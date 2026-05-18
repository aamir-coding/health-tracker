import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import MeshBackground    from './components/MeshBackground'
import PWABanners        from './components/PWABanners'
import ProtectedRoute    from './components/ProtectedRoute'
import Login     from './pages/Login'
import Register  from './pages/Register'
import Dashboard from './pages/Dashboard'
import LogEntry  from './pages/LogEntry'
import History   from './pages/History'
import Settings  from './pages/Settings'

function fireNotification() {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (localStorage.getItem('ht_reminder_enabled') !== 'true') return

  const payload = {
    type:  'SHOW_NOTIFICATION',
    title: 'HealthTrack Reminder 💪',
    body:  "Time to log your health data for today!",
    url:   '/log',
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(reg => {
        // Use SW for proper Android notification
        if (reg.active) {
          reg.active.postMessage(payload)
        } else {
          // SW exists but not yet active — fall back
          new Notification(payload.title, {
            body: payload.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-64x64.png',
          })
        }
      })
      .catch(() => {
        new Notification(payload.title, {
          body: payload.body,
          icon: '/pwa-192x192.png',
        })
      })
  } else {
    new Notification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
    })
  }
}

// Runs check() aligned to minute boundaries (±100ms), not on an arbitrary tick
function useNotificationScheduler() {
  const intervalRef = useRef(null)
  const timeoutRef  = useRef(null)

  useEffect(() => {
    if (!('Notification' in window)) return

    const check = () => {
      const stored = localStorage.getItem('ht_reminder_time') || '09:00'
      const [targetH, targetM] = stored.split(':').map(Number)
      const now = new Date()
      if (now.getHours() === targetH && now.getMinutes() === targetM) {
        fireNotification()
      }
    }

    // Align: wait until the start of the next minute, then tick every 60s
    const now = new Date()
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 100

    timeoutRef.current = setTimeout(() => {
      check()
      intervalRef.current = setInterval(check, 60_000)
    }, msUntilNextMinute)

    return () => {
      clearTimeout(timeoutRef.current)
      clearInterval(intervalRef.current)
    }
  }, [])
}

export default function App() {
  useNotificationScheduler()

  return (
    <ThemeProvider>
      <AuthProvider>
        <MeshBackground />
        <PWABanners />
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/log"      element={<ProtectedRoute><LogEntry /></ProtectedRoute>} />
            <Route path="/history"  element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}