import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bookmark,
  Heart,
  Flame,
  LogOut,
  ChevronRight,
  Shield,
  User,
  Crown,
  FileText,
  Lock,
  BookOpen,
  Highlighter,
  Sparkles,
  Flower2,
  Bell,
  Mail,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import { useToast } from '@/hooks/useToast'
import { hapticSelect } from '@/lib/haptics'
import {
  enableDailyVerseNotification,
  disableDailyVerseNotification,
  updateDailyVerseNotificationTime,
} from '@/lib/notifications'
import { getNotificationEnabled, getNotificationTime } from '@/lib/preferences'

export default function SanctuaryScreen() {
  const { user, role, signOut } = useAuth()
  const { stats, bookmarks, highlights } = useReadingProgress()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [notifTime, setNotifTime] = useState('07:00')
  const [notifLoading, setNotifLoading] = useState(true)

  useEffect(() => {
    Promise.all([getNotificationEnabled(), getNotificationTime()]).then(([enabled, time]) => {
      setNotifEnabled(enabled)
      setNotifTime(time)
      setNotifLoading(false)
    })
  }, [])

  const handleToggleNotification = async () => {
    hapticSelect()
    if (notifEnabled) {
      await disableDailyVerseNotification()
      setNotifEnabled(false)
      showToast('Daily reminder turned off', 'success')
    } else {
      const granted = await enableDailyVerseNotification(notifTime)
      if (granted) {
        setNotifEnabled(true)
        showToast('Daily reminder set for ' + notifTime, 'success')
      } else {
        showToast('Notification permission denied', 'error')
      }
    }
  }

  const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    setNotifTime(time)
    if (notifEnabled) {
      await updateDailyVerseNotificationTime(time)
      showToast('Reminder time updated', 'success')
    }
  }

  const menuItems = [
    {
      icon: User,
      label: 'Edit Profile',
      onClick: () => navigate('/me/profile'),
    },
    {
      icon: Heart,
      label: 'Favorites',
      badge: bookmarks.length > 0 ? bookmarks.length : undefined,
      onClick: () => navigate('/me/bookmarks'),
    },
    {
      icon: Highlighter,
      label: 'Highlights',
      badge: highlights.length > 0 ? highlights.length : undefined,
      onClick: () => navigate('/me/bookmarks'), // Could add dedicated highlights screen later
    },
    {
      icon: Flame,
      label: 'Reading Streak',
      onClick: () => navigate('/read'),
    },
    ...(notifLoading
      ? []
      : [
          {
            icon: Bell,
            label: 'Daily Reminder',
            onClick: handleToggleNotification,
            toggle: notifEnabled,
          } as any,
        ]),
    ...(role === 'shepherd' || role === 'admin'
      ? [
          {
            icon: Shield,
            label: 'Shepherd Dashboard',
            onClick: () => navigate('/shepherd'),
          },
        ]
      : []),
    ...(role === 'admin'
      ? [
          {
            icon: Crown,
            label: 'Admin Panel',
            onClick: () => navigate('/admin/dashboard'),
          },
        ]
      : []),
    {
      icon: Mail,
      label: 'Contact Admin',
      onClick: () => navigate('/contact-admin'),
    },
    {
      icon: Sparkles,
      label: 'Become a Shepherd',
      onClick: () => navigate('/shepherd/apply'),
    },
    {
      icon: Lock,
      label: 'Privacy Policy',
      onClick: () => navigate('/privacy'),
    },
    {
      icon: FileText,
      label: 'Terms of Use',
      onClick: () => navigate('/terms'),
    },
  ]

  // Garden visualization: one element per chapter read (capped at 16 for visual layout)
  const gardenElements = Math.min(stats.totalDaysRead, 16)
  const gardenArray = Array.from({ length: gardenElements }, (_, i) => i)

  const timeGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen px-5 pt-6 pb-24 safe-top safe-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-sm text-charcoal-muted">{timeGreeting()}</p>
        <h1 className="font-serif text-2xl text-midnight">Your Sanctuary</h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-cream-warm rounded-2xl border border-border-soft p-5 mb-6 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-midnight flex items-center justify-center shadow-md">
            <span className="text-xl text-cream font-serif">
              {(user?.user_metadata?.full_name || user?.email)?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-charcoal truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Reader'}
            </p>
            <p className="text-sm text-charcoal-muted truncate">{user?.email}</p>
            {role && role !== 'member' && (
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-wheat-pale text-wheat-dark text-xs rounded-full capitalize font-medium">
                {role}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Garden Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-cream-warm rounded-2xl border border-border-soft p-5 mb-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flower2 className="w-4 h-4 text-sage-dark" strokeWidth={1.5} />
            <h2 className="text-sm font-medium text-charcoal-muted uppercase tracking-wider">
              Your Garden
            </h2>
          </div>
          <span className="text-xs text-charcoal-muted">{stats.totalDaysRead} days planted</span>
        </div>

        {gardenElements === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-charcoal-muted italic">
              "The best time to plant a tree was twenty years ago. The second best time is now."
            </p>
            <button
              onClick={() => navigate('/read')}
              className="mt-3 text-xs text-terracotta font-medium"
            >
              Plant your first seed →
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {gardenArray.map((i) => {
              const variants = [
                <Flower2 key={i} className="w-5 h-5 text-sage" strokeWidth={1.5} />,
                <Heart key={i} className="w-5 h-5 text-terracotta" strokeWidth={1.5} />,
                <Sparkles key={i} className="w-5 h-5 text-wheat-dark" strokeWidth={1.5} />,
                <BookOpen key={i} className="w-5 h-5 text-sky-soft" strokeWidth={1.5} />,
              ]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-10 h-10 rounded-full bg-white border border-border-soft flex items-center justify-center shadow-sm"
                >
                  {variants[i % 4]}
                </motion.div>
              )
            })}
            {stats.totalDaysRead > 16 && (
              <div className="w-10 h-10 rounded-full bg-midnight/5 flex items-center justify-center text-xs text-charcoal-muted">
                +{stats.totalDaysRead - 16}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Reading Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <div className="bg-cream-warm rounded-2xl border border-border-soft p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-sage-dark" strokeWidth={1.5} />
            <span className="text-sm uppercase tracking-wider text-charcoal-muted font-medium">Days Read</span>
          </div>
          <p className="font-serif text-3xl text-charcoal">{stats.totalDaysRead}</p>
          <p className="text-sm text-charcoal-muted mt-1">Total days with reading</p>
        </div>
        <div className="bg-cream-warm rounded-2xl border border-border-soft p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-wheat-dark" strokeWidth={1.5} />
            <span className="text-sm uppercase tracking-wider text-charcoal-muted font-medium">Verses</span>
          </div>
          <p className="font-serif text-3xl text-charcoal">{stats.totalVersesRead}</p>
          <p className="text-sm text-charcoal-muted mt-1">Verses encountered</p>
        </div>
        <div className="bg-cream-warm rounded-2xl border border-border-soft p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
            <span className="text-sm uppercase tracking-wider text-charcoal-muted font-medium">Current Streak</span>
          </div>
          <p className="font-serif text-3xl text-charcoal">{stats.currentStreak}</p>
          <p className="text-sm text-charcoal-muted mt-1">Days in a row</p>
        </div>
        <div className="bg-cream-warm rounded-2xl border border-border-soft p-5">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-4 h-4 text-sky-soft" strokeWidth={1.5} />
            <span className="text-sm uppercase tracking-wider text-charcoal-muted font-medium">Best Streak</span>
          </div>
          <p className="font-serif text-3xl text-charcoal">{stats.longestStreak}</p>
          <p className="text-sm text-charcoal-muted mt-1">Personal record</p>
        </div>
      </motion.div>

      {/* Menu */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-2 mb-8"
      >
        {menuItems.map((item) => {
          const Icon = item.icon
          const isToggle = 'toggle' in item
          return (
            <div key={item.label}>
              <button
                onClick={() => { hapticSelect(); item.onClick() }}
                className="w-full bg-cream-warm rounded-xl border border-border-soft p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-charcoal-muted" strokeWidth={1.5} />
                  <span className="text-sm text-charcoal">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {'badge' in item && item.badge !== undefined && (
                    <span className="px-2 py-0.5 bg-terracotta text-cream rounded-full text-[10px] font-medium">
                      {item.badge}
                    </span>
                  )}
                  {isToggle ? (
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${item.toggle ? 'bg-terracotta' : 'bg-charcoal-muted/30'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${item.toggle ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                  )}
                </div>
              </button>
              {isToggle && item.toggle && (
                <div className="px-4 py-3 bg-cream-warm/50 border-x border-b border-border-soft rounded-b-xl -mt-1 pt-4">
                  <label className="text-xs font-medium text-charcoal-muted uppercase tracking-wider mb-1.5 block">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={notifTime}
                    onChange={handleTimeChange}
                    className="w-full px-4 py-2.5 bg-white border border-border-soft rounded-xl text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>
              )}
            </div>
          )
        })}
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="safe-bottom"
      >
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full py-3 border border-terracotta/20 text-terracotta rounded-xl text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Sign Out
        </button>
      </motion.div>

      <p className="text-center text-xs text-charcoal-muted mt-8">
        Meek Meet v0.1.10
      </p>

      {/* Sign Out Confirmation */}
      {showSignOutConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowSignOutConfirm(false)}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-cream rounded-2xl p-5 border border-border-soft shadow-xl"
          >
            <h3 className="font-medium text-midnight mb-2">Sign Out?</h3>
            <p className="text-sm text-charcoal-muted mb-4">
              Your reading progress and bookmarks are safely stored. Come back whenever you're ready.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-border-soft text-charcoal-muted"
              >
                Stay
              </button>
              <button
                onClick={() => { hapticSelect(); signOut() }}
                className="flex-1 py-2.5 rounded-xl text-sm bg-terracotta text-cream font-medium"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
