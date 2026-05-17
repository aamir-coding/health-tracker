import { useState } from 'react'
import { Bell, Clock, Check, X, AlertTriangle } from 'lucide-react'
import GlowIcon from './GlowIcon'

const TIME_KEY    = 'ht_reminder_time'
const ENABLED_KEY = 'ht_reminder_enabled'

async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export default function NotificationSettings() {
  const [permission, setPermission] = useState(
    () => ('Notification' in window ? Notification.permission : 'unsupported')
  )
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem(ENABLED_KEY) === 'true'
  )
  const [time, setTime] = useState(
    () => localStorage.getItem(TIME_KEY) || '09:00'
  )
  const [saved, setSaved] = useState(false)

  const save = (nextEnabled, nextTime) => {
    localStorage.setItem(ENABLED_KEY, String(nextEnabled))
    localStorage.setItem(TIME_KEY, nextTime)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleToggle = async () => {
    if (!enabled && permission !== 'granted') {
      const result = await requestPermission()
      setPermission(result)
      if (result !== 'granted') return
    }
    const next = !enabled
    setEnabled(next)
    save(next, time)
  }

  const unsupported = permission === 'unsupported'
  const denied      = permission === 'denied'

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <GlowIcon icon={Bell} color="violet" size="md" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Daily reminder
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {unsupported && 'Notifications are not supported in this browser'}
              {denied      && 'Notifications are blocked — update your browser settings'}
              {!unsupported && !denied && 'Get a push reminder to log your health data each day'}
            </p>
          </div>
        </div>

        {/* Toggle */}
        {!unsupported && !denied && (
          <button
            onClick={handleToggle}
            aria-label={enabled ? 'Disable daily reminder' : 'Enable daily reminder'}
            className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200"
            style={{
              background: enabled
                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                : 'rgba(255,255,255,0.1)',
              border: `1px solid ${enabled ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.15)'}`,
              boxShadow: enabled ? '0 0 10px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
              style={{
                left:      enabled ? 'calc(100% - 22px)' : '2px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
              }}
            />
          </button>
        )}
      </div>

      {/* Denied warning */}
      {denied && (
        <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 px-3 py-2.5 rounded-xl"
          style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.22)' }}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
          Open your browser's Site Settings and allow notifications for this site, then reload.
        </div>
      )}

      {/* Time picker */}
      {enabled && permission === 'granted' && (
        <div className="mt-4 pt-4 flex items-center gap-3"
          style={{ borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          <Clock size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <label className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            Remind me at
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input-field text-sm flex-1 py-1.5"
          />
          <button
            onClick={() => save(enabled, time)}
            className="btn-primary text-xs py-1.5 px-3 gap-1 flex-shrink-0"
          >
            {saved
              ? <><Check size={12} /> Saved</>
              : 'Save'
            }
          </button>
        </div>
      )}

      {!unsupported && !denied && !enabled && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Toggle on above — your browser will ask for notification permission.
        </p>
      )}
    </div>
  )
}