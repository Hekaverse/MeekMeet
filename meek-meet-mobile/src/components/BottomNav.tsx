import { NavLink } from 'react-router-dom'
import { Home, BookOpen, Users, Calendar, Flower2 } from 'lucide-react'
import { hapticSelect } from '@/lib/haptics'

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/read', label: 'Read', icon: BookOpen },
  { to: '/circles', label: 'Circles', icon: Users },
  { to: '/dashboard', label: 'Meetings', icon: Calendar },
  { to: '/me', label: 'Sanctuary', icon: Flower2 },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-t border-border-soft safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              onClick={() => hapticSelect()}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                  isActive
                    ? 'text-terracotta'
                    : 'text-charcoal-muted'
                }`
              }
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
