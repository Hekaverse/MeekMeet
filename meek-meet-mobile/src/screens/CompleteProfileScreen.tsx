import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  MapPin,
  Church,
  FileText,
  Loader2,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { hapticSuccess, hapticLight } from '@/lib/haptics'

interface NominatimResult {
  display_name: string
  name: string
  type: string
}

const DENOMINATION_OPTIONS = [
  'Anglican',
  'Baptist',
  'Catholic',
  'Presbyterian',
  'Uniting Church',
  'Pentecostal',
  'Orthodox',
  'Non-denominational',
  'Other',
]

export default function CompleteProfileScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [denomination, setDenomination] = useState('')
  const [bio, setBio] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Location autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Denomination dropdown
  const [showDenominationDropdown, setShowDenominationDropdown] = useState(false)
  const denominationRef = useRef<HTMLDivElement>(null)

  // Load existing profile
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }
    const load = async () => {
      const { data: basic } = await supabase
        .from('profiles')
        .select('full_name, location')
        .eq('id', user.id)
        .single()
      if (basic) {
        setFullName(basic.full_name ?? '')
        setLocation(basic.location ?? '')
      }
      const { data: enhanced } = await supabase
        .from('profiles')
        .select('denomination, bio')
        .eq('id', user.id)
        .single()
      if (enhanced) {
        setDenomination(enhanced.denomination ?? '')
        setBio(enhanced.bio ?? '')
      }
      setIsLoading(false)
    }
    load()
  }, [user])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
      if (
        denominationRef.current &&
        !denominationRef.current.contains(event.target as Node)
      ) {
        setShowDenominationDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced location search
  const searchLocations = useCallback((query: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=en`,
          { headers: { 'Accept': 'application/json' } }
        )
        if (!res.ok) throw new Error('Search failed')
        const data: NominatimResult[] = await res.json()
        const formatted = data.map((item) => {
          // Extract city/suburb and state for cleaner display
          const parts = item.display_name.split(', ')
          if (parts.length >= 2) {
            const city = parts[0]
            const state = parts.find((p) =>
              ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].some((s) =>
                p.includes(s)
              ) || ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'].some((s) => p.includes(s))
            ) || parts[1]
            return `${city}, ${state}`
          }
          return item.display_name
        })
        setSuggestions(formatted)
        setShowSuggestions(formatted.length > 0)
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsSearching(false)
      }
    }, 350)
  }, [])

  const handleLocationChange = (value: string) => {
    setLocation(value)
    searchLocations(value)
  }

  const selectLocation = (value: string) => {
    setLocation(value)
    setShowSuggestions(false)
    hapticLight()
  }

  const clearLocation = () => {
    setLocation('')
    setSuggestions([])
    setShowSuggestions(false)
    locationInputRef.current?.focus()
  }

  const handleSave = async () => {
    if (!user) return
    const trimmedName = fullName.trim()
    if (!trimmedName) return

    setIsSaving(true)

    // Use upsert to handle both existing and missing profile rows
    let payload: any = {
      id: user.id,
      full_name: trimmedName,
      location: location.trim() || null,
    }

    let { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })

    // If enhanced columns exist, try updating them too
    if (!error) {
      const { error: enhancedErr } = await supabase
        .from('profiles')
        .update({ denomination: denomination.trim() || null, bio: bio.trim() || null })
        .eq('id', user.id)
      // Ignore enhanced column errors — migration may not be applied
      if (enhancedErr) console.warn('Enhanced profile fields not saved:', enhancedErr.message)
    }

    if (error) {
      showToast('Could not save profile: ' + error.message, 'error')
      setIsSaving(false)
      return
    }

    await hapticSuccess()
    setSaved(true)
    setTimeout(() => navigate('/', { replace: true }), 900)
    setIsSaving(false)
  }

  const canContinue = fullName.trim().length > 0
  const progress = Math.min(100, (fullName.trim() ? 25 : 0) + (location.trim() ? 25 : 0) + (denomination ? 25 : 0) + (bio.trim() ? 25 : 0))

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream px-5 pt-6 pb-8 safe-top safe-bottom flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex-1 flex flex-col max-w-md mx-auto w-full"
      >
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-midnight mb-4 shadow-lg"
          >
            <img
              src="/logo.png"
              alt="Meek Meet"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif text-2xl text-midnight mb-1"
          >
            {saved ? 'Welcome aboard' : 'Complete Your Profile'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-charcoal-muted leading-relaxed"
          >
            {saved
              ? 'Your journey begins now.'
              : 'Help your community know who you are.'}
          </motion.p>
        </div>

        {/* Scripture Banner */}
        {!saved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6 py-4 px-5 bg-wheat rounded-2xl text-center border border-border-soft"
          >
            <p className="text-midnight font-serif italic text-[15px] leading-relaxed">
              &ldquo;Blessed are the meek, for they shall inherit the earth.&rdquo;
            </p>
            <p className="text-terracotta text-[11px] font-semibold tracking-widest uppercase mt-1.5">
              Matthew 5:5
            </p>
          </motion.div>
        )}

        {/* Progress Bar */}
        {!saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-medium text-charcoal-light tracking-wide uppercase">
                Profile completion
              </span>
              <span className="text-[11px] font-semibold text-terracotta">
                {progress}%
              </span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden border border-border-soft">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-terracotta to-copper"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        {saved ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <div className="w-24 h-24 rounded-full bg-sage-pale flex items-center justify-center mb-5 shadow-sm">
              <CheckCircle className="w-12 h-12 text-sage" strokeWidth={1.5} />
            </div>
            <p className="text-charcoal-muted text-sm">Redirecting you home...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="space-y-5 flex-1"
          >
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-charcoal-light font-semibold tracking-wide uppercase flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                Full Name
                <span className="text-terracotta">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3.5 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-all shadow-sm"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Location with Autocomplete */}
            <div className="space-y-1.5 relative">
              <label className="text-xs text-charcoal-light font-semibold tracking-wide uppercase flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                Location
              </label>
              <div className="relative" ref={suggestionsRef}>
                <input
                  ref={locationInputRef}
                  type="text"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => location.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Start typing your suburb..."
                  className="w-full px-4 py-3.5 pr-10 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-all shadow-sm"
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isSearching && (
                    <Loader2 className="w-4 h-4 text-charcoal-muted animate-spin" strokeWidth={1.5} />
                  )}
                  {location && !isSearching && (
                    <button
                      onClick={clearLocation}
                      className="p-0.5 rounded-full hover:bg-cream transition-colors"
                    >
                      <X className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      ref={suggestionsRef}
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-border-soft rounded-xl shadow-lg overflow-hidden"
                    >
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => selectLocation(suggestion)}
                          className="w-full px-4 py-3 text-left text-sm text-charcoal hover:bg-cream transition-colors flex items-center gap-2 border-b border-border-soft/50 last:border-0"
                        >
                          <MapPin className="w-3.5 h-3.5 text-charcoal-muted shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{suggestion}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Denomination Dropdown */}
            <div className="space-y-1.5 relative" ref={denominationRef}>
              <label className="text-xs text-charcoal-light font-semibold tracking-wide uppercase flex items-center gap-1.5">
                <Church className="w-3.5 h-3.5" strokeWidth={1.5} />
                Tradition / Denomination
              </label>
              <button
                onClick={() => setShowDenominationDropdown(!showDenominationDropdown)}
                className="w-full px-4 py-3.5 bg-white border border-border-soft rounded-xl text-sm text-left shadow-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-all"
              >
                <span className={denomination ? 'text-charcoal' : 'text-charcoal-muted'}>
                  {denomination || 'Select your tradition'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-charcoal-muted transition-transform ${showDenominationDropdown ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
              </button>

              <AnimatePresence>
                {showDenominationDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-border-soft rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                  >
                    {DENOMINATION_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setDenomination(option)
                          setShowDenominationDropdown(false)
                          hapticLight()
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-border-soft/50 last:border-0 ${
                          denomination === option
                            ? 'bg-cream text-terracotta font-medium'
                            : 'text-charcoal hover:bg-cream'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs text-charcoal-light font-semibold tracking-wide uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                Short Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A little about yourself, your story, or what brings you here..."
                rows={3}
                className="w-full px-4 py-3.5 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-all resize-none shadow-sm"
              />
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        {!saved && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 space-y-3"
          >
            <button
              onClick={handleSave}
              disabled={isSaving || !canContinue}
              className={`w-full py-4 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-md ${
                canContinue
                  ? 'bg-midnight text-cream hover:bg-midnight/90 active:scale-[0.98]'
                  : 'bg-midnight/30 text-cream/60 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </>
              )}
            </button>

            <button
              onClick={async () => {
                if (!user) return
                const { error } = await supabase
                  .from('profiles')
                  .upsert(
                    {
                      id: user.id,
                      full_name: 'Meek Meet User',
                    },
                    { onConflict: 'id' }
                  )
                if (error) {
                  showToast('Could not skip: ' + error.message, 'error')
                  return
                }
                navigate('/', { replace: true })
              }}
              className="w-full py-3 text-xs text-charcoal-muted font-medium hover:text-charcoal transition-colors"
            >
              Skip for now
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
