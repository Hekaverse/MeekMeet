import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  MapPin,
  Loader2,
  CheckCircle,
  Camera,
  Phone,
  Church,
  FileText,
  BookOpen,
} from 'lucide-react'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'

export default function ProfileScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [denomination, setDenomination] = useState('')
  const [bio, setBio] = useState('')
  const [testimony, setTestimony] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [role, setRole] = useState('member')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Track whether enhanced columns exist in the DB schema
  const [hasEnhancedSchema, setHasEnhancedSchema] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return

    const loadProfile = async () => {
      // Load basic fields (guaranteed to exist)
      const { data: basic } = await supabase
        .from('profiles')
        .select('full_name, location, role, avatar_url')
        .eq('id', user.id)
        .single()

      if (basic) {
        setFullName(basic.full_name ?? '')
        setLocation(basic.location ?? '')
        setAvatarUrl(basic.avatar_url ?? null)
        setRole(basic.role ?? 'member')
      }

      // Try loading enhanced fields (may not exist if migration hasn't run)
      const { data: enhanced, error } = await supabase
        .from('profiles')
        .select('phone, denomination, bio, testimony')
        .eq('id', user.id)
        .single()

      if (!error && enhanced) {
        setPhone(enhanced.phone ?? '')
        setDenomination(enhanced.denomination ?? '')
        setBio(enhanced.bio ?? '')
        setTestimony(enhanced.testimony ?? '')
        setHasEnhancedSchema(true)
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    setSaved(false)

    const basicPayload = {
      full_name: fullName.trim() || null,
      location: location.trim() || null,
    }

    const enhancedPayload = hasEnhancedSchema
      ? {
          phone: phone.trim() || null,
          denomination: denomination.trim() || null,
          bio: bio.trim() || null,
          testimony: testimony.trim() || null,
        }
      : {}

    let { error } = await supabase
      .from('profiles')
      .update({ ...basicPayload, ...enhancedPayload })
      .eq('id', user.id)

    // If enhanced columns don't exist, retry with only basic fields
    if (error && hasEnhancedSchema) {
      const retry = await supabase
        .from('profiles')
        .update(basicPayload)
        .eq('id', user.id)
      error = retry.error
      if (!retry.error) {
        setHasEnhancedSchema(false)
        showToast('Profile saved (basic fields only — run DB migration for full profile)', 'info')
      }
    }

    if (error) {
      showToast('Failed to save profile: ' + error.message, 'error')
    } else if (hasEnhancedSchema) {
      setSaved(true)
      showToast('Profile saved', 'success')
      setTimeout(() => setSaved(false), 3000)
    }
    setIsSaving(false)
  }

  const handleAvatarClick = async () => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      })
      if (photo.dataUrl) {
        await uploadAvatarFromDataUrl(photo.dataUrl)
      }
    } catch (err: any) {
      if (err.message !== 'User cancelled photos app') {
        showToast('Camera error: ' + (err.message || 'Could not open camera'), 'error')
      }
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    await uploadAvatarBlob(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadAvatarFromDataUrl = async (dataUrl: string) => {
    try {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      await uploadAvatarBlob(blob)
    } catch (err: any) {
      showToast('Photo processing failed: ' + (err.message || 'Unknown error'), 'error')
    }
  }

  const uploadAvatarBlob = async (blob: Blob) => {
    if (!user) return
    setUploadingAvatar(true)
    try {
      const fileName = `${user.id}.jpg`
      const filePath = `${fileName}`

      await supabase.storage.from('avatars').remove([filePath])

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      showToast('Profile photo updated', 'success')
    } catch (err: any) {
      showToast('Photo upload failed: ' + (err.message || 'Unknown error'), 'error')
    }
    setUploadingAvatar(false)
  }

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return
    setUploadingAvatar(true)
    try {
      const fileName = avatarUrl.split('/').pop() || `${user.id}.jpg`
      await supabase.storage.from('avatars').remove([fileName])
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
      setAvatarUrl(null)
      showToast('Photo removed', 'success')
    } catch (err: any) {
      showToast('Failed to remove photo: ' + (err.message || 'Unknown error'), 'error')
    }
    setUploadingAvatar(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6 safe-top">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-charcoal" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-xl text-charcoal">Your Profile</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
            onContextMenu={(e) => {
              e.preventDefault()
              fileInputRef.current?.click()
            }}
            className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border-soft bg-cream-warm flex items-center justify-center active:scale-95 transition-transform"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-charcoal-muted" strokeWidth={1.5} />
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-cream animate-spin" strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-midnight rounded-full flex items-center justify-center border-2 border-cream">
              <Camera className="w-4 h-4 text-cream" strokeWidth={1.5} />
            </div>
          </button>
          {avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              className="text-xs text-terracotta font-medium"
            >
              Remove photo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        <div className="bg-cream-warm rounded-2xl border border-border-soft p-6 space-y-5">
          {/* Role */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-wheat-pale flex items-center justify-center">
              <User className="w-5 h-5 text-wheat-dark" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs text-charcoal-muted uppercase tracking-wider">Role</p>
              <p className="text-sm font-medium text-charcoal capitalize">{role}</p>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-sm text-charcoal-light font-medium">Email</label>
            <input
              type="text"
              value={user?.email ?? ''}
              readOnly
              className="w-full px-4 py-3 bg-cream/60 border border-border-soft rounded-xl text-sm text-charcoal-muted cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm text-charcoal-light font-medium">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm text-charcoal-light font-medium flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Suburb / City"
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm text-charcoal-light font-medium flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          {/* Denomination / Tradition */}
          <div className="space-y-2">
            <label className="text-sm text-charcoal-light font-medium flex items-center gap-2">
              <Church className="w-3.5 h-3.5" strokeWidth={1.5} />
              Tradition / Denomination
            </label>
            <input
              type="text"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              placeholder="e.g. Anglican, Baptist, Catholic, Non-denominational"
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm text-charcoal-light font-medium flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short introduction about yourself..."
              rows={3}
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta resize-none"
            />
          </div>

          {/* Testimony */}
          <div className="space-y-2">
            <label className="text-sm text-charcoal-light font-medium flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
              Testimony
            </label>
            <textarea
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
              placeholder="Share your faith journey..."
              rows={4}
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-1 focus:ring-terracotta resize-none"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-midnight text-cream rounded-full text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
                Saved
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
