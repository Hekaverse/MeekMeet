import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Geolocation } from '@capacitor/geolocation'
import {
  MapPin,
  Users,
  ChevronRight,
  Search,
  X,
  Clock,
  Church,
  Heart,
  Sparkles,
  Globe,
  Landmark,
  HandHeart,
  Navigation,
  Crosshair,
  Shield,
  Loader2,
} from 'lucide-react'
import { hapticSelect, hapticSuccess } from '@/lib/haptics'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import {
  getStoredLocation,
  saveLocation,
  getLocationFromProfile,
  haversineDistance,
  formatDistance,
  AU_CITIES,
  type UserLocation,
} from '@/lib/location'
import type { ExternalGathering, Circle } from '@/types'

const traditionFilters = [
  { id: 'all', label: 'All', icon: HandHeart },
  { id: 'christian', label: 'Christian', icon: Church },
  { id: 'islamic', label: 'Islamic', icon: Globe },
  { id: 'jewish', label: 'Jewish', icon: Sparkles },
  { id: 'buddhist', label: 'Buddhist', icon: Heart },
  { id: 'hindu', label: 'Hindu', icon: Landmark },
  { id: 'interfaith', label: 'Interfaith', icon: Users },
]

const traditionColors: Record<string, string> = {
  christian: 'bg-sage-pale text-sage-dark border-sage/20',
  islamic: 'bg-wheat-pale text-wheat-dark border-wheat/20',
  jewish: 'bg-sky-pale text-sky-soft border-sky-soft/20',
  buddhist: 'bg-terracotta-pale text-terracotta border-terracotta/20',
  hindu: 'bg-orange-100 text-orange-700 border-orange-200',
  interfaith: 'bg-violet-100 text-violet-700 border-violet-200',
}

export default function CirclesScreen() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'gatherings' | 'meekmeet'>('gatherings')
  const [gatherings, setGatherings] = useState<ExternalGathering[]>([])
  const [circles, setCircles] = useState<Circle[]>([])
  const [circlesLoading, setCirclesLoading] = useState(false)

  const [userLoc, setUserLoc] = useState<UserLocation | null>(null)
  const [showLocPicker, setShowLocPicker] = useState(false)
  const [locQuery, setLocQuery] = useState('')
  const [query, setQuery] = useState('')
  const [traditionFilter, setTraditionFilter] = useState('all')
  const [gpsLoading, setGpsLoading] = useState(false)

  // Load curated JSON + location
  useEffect(() => {
    fetch('/data/gatherings.json')
      .then((r) => r.json())
      .then((data) => {
        setGatherings(data.gatherings || [])
      })

    const initLoc = async () => {
      let loc = await getStoredLocation()
      if (!loc) {
        const { data } = await supabase.auth.getSession()
        const userId = data.session?.user.id
        if (userId) {
          loc = await getLocationFromProfile(userId)
          if (loc) await saveLocation(loc)
        }
      }
      setUserLoc(loc)
      if (!loc) setShowLocPicker(true)
    }
    initLoc()
  }, [])

  const gatheringsWithDistance = useMemo(() => {
    if (!userLoc) return gatherings.map((g) => ({ ...g, distanceKm: 0 }))
    return gatherings
      .map((g) => ({
        ...g,
        distanceKm: haversineDistance(userLoc.latitude, userLoc.longitude, g.latitude, g.longitude),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [gatherings, userLoc])

  const filteredGatherings = useMemo(() => {
    let result = gatheringsWithDistance
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.denomination.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
      )
    }
    if (traditionFilter !== 'all') {
      result = result.filter((g) => g.tradition === traditionFilter)
    }
    return result
  }, [gatheringsWithDistance, query, traditionFilter])

  const detectGps = async () => {
    setGpsLoading(true)
    try {
      const perm = await Geolocation.requestPermissions()
      if (perm.location === 'denied') {
        showToast('Location permission denied', 'error')
        setGpsLoading(false)
        return
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
      const loc: UserLocation = {
        city: 'My Location',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }
      const { data } = await supabase.auth.getSession()
      await saveLocation(loc, data.session?.user.id)
      setUserLoc(loc)
      setShowLocPicker(false)
      hapticSuccess()
      showToast('Location set', 'success')
    } catch {
      showToast('Could not get location', 'error')
    }
    setGpsLoading(false)
  }

  const selectCity = async (city: typeof AU_CITIES[0]) => {
    const loc: UserLocation = {
      city: city.name,
      latitude: city.lat,
      longitude: city.lng,
    }
    const { data } = await supabase.auth.getSession()
    await saveLocation(loc, data.session?.user.id)
    setUserLoc(loc)
    setShowLocPicker(false)
    hapticSuccess()
    showToast(`Showing gatherings near ${city.name}`, 'success')
  }

  const handleChangeLocation = () => {
    hapticSelect()
    setShowLocPicker(true)
  }

  const clearFilters = () => {
    setQuery('')
    setTraditionFilter('all')
  }

  const loadCircles = async () => {
    setCirclesLoading(true)
    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) {
      showToast('Could not load circles', 'error')
    } else {
      setCircles((data ?? []) as Circle[])
    }
    setCirclesLoading(false)
  }

  const handleTabSwitch = (tab: 'gatherings' | 'meekmeet') => {
    hapticSelect()
    setActiveTab(tab)
    if (tab === 'meekmeet' && circles.length === 0) {
      loadCircles()
    }
  }

  const matchedCities = useMemo(() => {
    const q = locQuery.trim().toLowerCase()
    if (!q) return AU_CITIES
    return AU_CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.name.toLowerCase().replace(/,/g, '').includes(q)
    )
  }, [locQuery])

  return (
    <div className="min-h-screen bg-cream safe-top">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-serif text-2xl text-midnight mb-1">Circles</h1>
        <p className="text-sm text-charcoal-muted">
          Find a gathering near you, or join a Meek Meet circle.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5">
        <div className="flex bg-cream-warm rounded-xl p-1 border border-border-soft">
          <button
            onClick={() => handleTabSwitch('gatherings')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'gatherings'
                ? 'bg-midnight text-cream shadow-sm'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Find Gatherings
          </button>
          <button
            onClick={() => handleTabSwitch('meekmeet')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'meekmeet'
                ? 'bg-midnight text-cream shadow-sm'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Meek Meet Circles
          </button>
        </div>
      </div>

      {/* Location bar */}
      {userLoc && activeTab === 'gatherings' && (
        <div className="px-5 mb-4">
          <button
            onClick={handleChangeLocation}
            className="w-full flex items-center gap-2 px-3 py-2 bg-cream-warm rounded-xl border border-border-soft text-left active:scale-[0.98] transition-transform"
          >
            <MapPin className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
            <span className="text-sm text-charcoal">{userLoc.city}</span>
            <span className="text-xs text-charcoal-muted ml-auto">Change</span>
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'gatherings' ? (
          <motion.div
            key="gatherings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Location Picker Modal */}
            <AnimatePresence>
              {showLocPicker && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-24"
                  onClick={() => setShowLocPicker(false)}
                >
                  <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-cream rounded-2xl p-5 border border-border-soft shadow-xl max-h-[80vh] flex flex-col"
                  >
                    <h2 className="font-serif text-xl text-midnight mb-1">Where are you?</h2>
                    <p className="text-sm text-charcoal-muted mb-4">
                      Set your location to see gatherings near you.
                    </p>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={detectGps}
                      disabled={gpsLoading}
                      className="w-full py-3 bg-midnight text-cream rounded-xl font-medium text-sm flex items-center justify-center gap-2 mb-4 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <Crosshair className="w-4 h-4" strokeWidth={1.5} />
                      {gpsLoading ? 'Getting location...' : 'Use my current location'}
                    </motion.button>

                    <div className="relative mb-3">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                      <input
                        value={locQuery}
                        onChange={(e) => setLocQuery(e.target.value)}
                        placeholder="Or search for a city..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                      {locQuery && (
                        <button onClick={() => setLocQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                          <X className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto -mx-1 px-1">
                      <div className="space-y-1">
                        {matchedCities.map((city) => (
                          <button
                            key={city.name}
                            onClick={() => selectCity(city)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-cream-warm transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-charcoal-muted flex-shrink-0" strokeWidth={1.5} />
                            <span className="text-sm text-charcoal">{city.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filters */}
            <div className="px-5 mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search gatherings..."
                  className="w-full pl-9 pr-9 py-3 bg-cream-warm border border-border-soft rounded-xl text-base text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {/* Tradition chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {traditionFilters.map((f) => {
                  const Icon = f.icon
                  const active = traditionFilter === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => setTraditionFilter(f.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                        active
                          ? 'bg-midnight text-cream border-midnight'
                          : 'bg-white text-charcoal-muted border-border-soft hover:border-midnight/20'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {f.label}
                    </button>
                  )
                })}
              </div>

              {(query || traditionFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-terracotta font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" strokeWidth={1.5} />
                  Clear all filters
                </button>
              )}
            </div>

            {/* Results count */}
            <div className="px-5 flex items-center justify-between mb-3">
              <p className="text-sm text-charcoal-muted">
                {filteredGatherings.length} gathering{filteredGatherings.length !== 1 ? 's' : ''} found
                {userLoc && ` near ${userLoc.city}`}
              </p>

            </div>

            {/* Results */}
            <div className="px-5 pb-8 space-y-3">
              {filteredGatherings.map((g, i) => (
                <motion.button
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    hapticSelect()
                    navigate(`/gatherings/${g.id}`)
                  }}
                  className="w-full bg-white rounded-2xl border border-border-soft p-5 text-left shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${traditionColors[g.tradition] || 'bg-midnight/5 text-charcoal-muted border-midnight/10'}`}>
                          {g.tradition}
                        </span>
                        <span className="text-[10px] text-charcoal-muted">{g.denomination}</span>
                        {userLoc && (
                          <span className="text-[10px] font-medium text-sage ml-auto">
                            {formatDistance(g.distanceKm)}
                          </span>
                        )}
                      </div>
                      <h2 className="font-medium text-base text-midnight">{g.name}</h2>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-charcoal-muted" strokeWidth={1.5} />
                        <span className="text-sm text-charcoal-muted">{g.location}</span>
                      </div>
                      <p className="text-sm text-charcoal-muted mt-2 line-clamp-2">{g.description}</p>

                      {g.meetingTimes.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Clock className="w-3 h-3 text-wheat-dark" strokeWidth={1.5} />
                          <span className="text-xs text-wheat-dark font-medium">
                            {g.meetingTimes[0].day} {g.meetingTimes[0].time}
                          </span>
                          {g.meetingTimes.length > 1 && (
                            <span className="text-xs text-charcoal-muted">
                              +{g.meetingTimes.length - 1} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-charcoal-muted flex-shrink-0 mt-1" strokeWidth={1.5} />
                  </div>
                </motion.button>
              ))}

              {filteredGatherings.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Users className="w-12 h-12 text-charcoal-muted mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-charcoal-muted text-base mb-2">No gatherings found.</p>
                  <p className="text-sm text-charcoal-muted">Try adjusting your search, filters, or location.</p>
                  <button
                    onClick={handleChangeLocation}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-midnight text-cream rounded-xl text-sm font-medium"
                  >
                    <MapPin className="w-4 h-4" strokeWidth={1.5} />
                    Change Location
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="meekmeet"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-8 space-y-5">
              {/* Circles list */}
              {circlesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-terracotta animate-spin" strokeWidth={1.5} />
                </div>
              ) : circles.length > 0 ? (
                <div className="space-y-3">
                  {circles.map((circle, i) => (
                    <motion.button
                      key={circle.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => navigate(`/circles/${circle.slug}`)}
                      className="w-full text-left bg-cream-warm rounded-xl border border-border-soft p-4 active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base text-midnight truncate">{circle.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-charcoal-muted" strokeWidth={1.5} />
                            <span className="text-sm text-charcoal-muted">{circle.location}</span>
                          </div>
                          {circle.description && (
                            <p className="text-sm text-charcoal-muted mt-1.5 line-clamp-2">{circle.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-charcoal-muted flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-charcoal-muted mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-charcoal-muted">No active circles yet.</p>
                </div>
              )}

              {/* Become a Shepherd CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-cream-warm rounded-2xl border border-border-soft p-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-terracotta-pale flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-terracotta" strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-xl text-midnight mb-2">
                  Become a Shepherd of Your Region
                </h2>
                <p className="text-sm text-charcoal-muted leading-relaxed mb-6">
                  We're seeking shepherds — quiet guides who can hold space
                  for circles in their community. If you feel called, we'd love to hear from you.
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    hapticSelect()
                    navigate('/shepherd/apply')
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-midnight text-cream rounded-xl text-sm font-medium active:scale-95 transition-transform"
                >
                  Apply
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
