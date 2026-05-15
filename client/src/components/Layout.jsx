import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, SquarePen, ScrollText, Settings,
  Menu, X, LogOut, Heart, Sun, Moon, Monitor,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/log', label: 'Log Entry', icon: SquarePen },
  { path: '/history', label: 'History', icon: ScrollText },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor }

export function Avatar({ user, size = 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs'
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white/40`}
      />
    )
  }
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
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
        background: 'rgba(99,102,241,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
      } : undefined}
    >
      <Icon
        size={17}
        className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
      />
      {label}
    </Link>
  )
}

function SidebarContent({ onNavClick, streak }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const ThemeIcon = THEME_ICONS[theme] || Monitor

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/40 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">
              HealthTrack
            </span>
          </div>
          <button
            onClick={toggle}
            title={`Theme: ${theme}`}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 transition-colors"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          >
            <ThemeIcon size={14} />
          </button>
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
            background: 'rgba(251,146,60,0.14)',
            border: '1px solid rgba(251,146,60,0.28)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span className="text-lg">🔥</span>
          <div>
            <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">
              {streak} day streak
            </div>
            <div className="text-xs text-orange-500 dark:text-orange-500">Keep it going!</div>
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-4 border-t border-white/40 dark:border-white/[0.06]">
        <Link
          to="/settings"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl hover:bg-white/30 dark:hover:bg-white/[0.04] transition-colors"
        >
          <Avatar user={user} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
          </div>
        </Link>
        <button
          onClick={() => { signOut(); navigate('/login') }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-56 glass-sidebar flex flex-col shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-white/[0.06] text-gray-500"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} streak={streak} />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 glass-header flex-shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">HealthTrack</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white/30 dark:hover:bg-white/[0.06] transition-colors"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}