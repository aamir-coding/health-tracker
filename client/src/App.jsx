import { useEffect } from 'react'
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

// Notification scheduler — runs once, reads settings from localStorage each tick
function useNotificationScheduler() {
  useEffect(() => {
    if (!('Notification' in window)) return

    const check = () => {
      if (Notification.permission !== 'granted') return
      if (localStorage.getItem('ht_reminder_enabled') !== 'true') return
      const stored = localStorage.getItem('ht_reminder_time') || '09:00'
      const [h, m] = stored.split(':').map(Number)
      const now = new Date()
      if (now.getHours() !== h || now.getMinutes() !== m) return

      const payload = {
        type:  'SHOW_NOTIFICATION',
        title: 'HealthTrack Reminder',
        body:  "Time to log your health data today! 💪",
        url:   '/log',
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => reg.active?.postMessage(payload))
          .catch(() => {
            new Notification(payload.title, { body: payload.body, icon: '/pwa-192x192.png' })
          })
      } else {
        new Notification(payload.title, { body: payload.body, icon: '/pwa-192x192.png' })
      }
    }

    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
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