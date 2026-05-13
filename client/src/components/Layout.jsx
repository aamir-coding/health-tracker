import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, SquarePen, ScrollText, Menu, X, LogOut, Heart, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { logsApi } from '../api/healthApi'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/log', label: 'Log Entry', icon: SquarePen },
  { path: '/history', label: 'History', icon: ScrollText },
]

function SidebarContent({ onNavClick, streak }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { dark, toggle } = useTheme()

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">HealthTrack</span>
          </div>
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={17} className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {streak > 0 && (
        <div className="mx-3 mb-3 px-3 py-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex items-center gap-2.5">
          <span className="text-xl">🔥</span>
          <div>
            <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">{streak} day streak</div>
            <div className="text-xs text-orange-500 dark:text-orange-500">Keep it going!</div>
          </div>
        </div>
      )}

      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-0.5">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 dark:text-indigo-300 font-semibold text-xs">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { signOut(); navigate('/login') }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [streak, setStreak] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      logsApi.getStreak().then(({ data }) => setStreak(data.streak || 0)).catch(() => {})
    }
  }, [user])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
        <SidebarContent streak={streak} />
      </aside>

      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-56 bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <X size={18} />
            </button>
            <SidebarContent onNavClick={() => setMobileOpen(false)} streak={streak} />
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">HealthTrack</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { const { toggle } = useTheme?.() || {}; toggle?.() }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            </button>
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
              <Menu size={20} />
            </button>
          </div>
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