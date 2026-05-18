import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, SquarePen, ScrollText, Settings,
  Menu, X, LogOut, Heart, Sun, Moon, Monitor, Flame,
} from 'lucide-react'
import { useAuth }  from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import GlowIcon     from './GlowIcon'

const NAV_ITEMS = [
  { path: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { path: '/log',      label: 'Log Entry', icon: SquarePen       },
  { path: '/history',  label: 'History',   icon: ScrollText      },
  { path: '/settings', label: 'Settings',  icon: Settings        },
]

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor }

export function Avatar({ user, size = 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs'
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sz} rounded-full object-cover flex-shrink-0`}
        style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.3), 0 0 8px rgba(99,102,241,0.2)' }}
      />
    )
  }
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        boxShadow: '0 0 12px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}
    >
      <span className="text-white font-semibold">{initials}</span>
    </div>
  )
}

function NavItem({ path, label, icon: Icon, onClick }) {
  const location = useLocation()
  const active = location.pathname === path
  return (
    <Link
      to={path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? 'text-indigo-700 dark:text-indigo-300'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
      }`}
      style={active ? {
        background: 'rgba(99,102,241,0.11)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 0 12px rgba(99,102,241,0.08)',
      } : undefined}
    >
      <Icon
        size={17}
        className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
        style={active ? { filter: 'drop-shadow(0 0 4px rgba(99,102,241,0.5))' } : undefined}
      />
      {label}
    </Link>
  )
}

// onClose is only passed for the mobile drawer — used to render the X button
// inside the header row instead of as an absolute overlay that can clash
function SidebarContent({ onNavClick, streak, onClose }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const ThemeIcon = THEME_ICONS[theme] || Monitor

  return (
    <div className="flex flex-col h-full">
      {/* Logo row */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.28)',
              }}
            >
              <Heart
                className="w-4 h-4 text-white"
                fill="white"
                style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }}
              />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight truncate">
              HealthTrack
            </span>
          </div>

          {/* Right side: theme toggle + close (mobile only) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={toggle}
              title={`Theme: ${theme}`}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}
            >
              <ThemeIcon size={14} />
            </button>
            {/* X button only shown when rendered inside the mobile drawer */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.path} {...item} onClick={onNavClick} />
        ))}
      </nav>

      {/* Streak pill */}
      {streak > 0 && (
        <div
          className="mx-3 mb-3 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{
            background: 'rgba(251,146,60,0.12)',
            border: '1px solid rgba(251,146,60,0.25)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <GlowIcon icon={Flame} color="orange" size="xs" />
          <div>
            <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">
              {streak} day streak
            </div>
            <div className="text-xs text-orange-500">Keep it going!</div>
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.22)' }}>
        <Link
          to="/settings"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Avatar user={user} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
          </div>
        </Link>
        <button
          onClick={() => { signOut(); navigate('/login') }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children, streak = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 glass-sidebar flex-shrink-0">
        <SidebarContent streak={streak} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* w-64 instead of w-56: more breathing room for theme + close buttons */}
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 glass-sidebar flex flex-col shadow-2xl">
            <SidebarContent
              onNavClick={() => setMobileOpen(false)}
              onClose={() => setMobileOpen(false)}
              streak={streak}
            />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 glass-header flex-shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 0 10px rgba(99,102,241,0.4)',
              }}
            >
              <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">HealthTrack</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 transition-colors"
            style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}