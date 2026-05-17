import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft, Check, CloudOff,
  CalendarDays, Footprints, Moon, Droplets, Scale, FileText,
  Frown, Meh, Smile, SmilePlus, Laugh,
} from 'lucide-react'
import { logsApi }           from '../api/healthApi'
import { useOfflineQueue }   from '../hooks/useOfflineQueue'
import GlowIcon              from '../components/GlowIcon'
import Layout                from '../components/Layout'

const MOODS = [
  { value:1, icon:Frown,    color:'red',    label:'Very bad' },
  { value:2, icon:Meh,      color:'amber',  label:'Bad'      },
  { value:3, icon:Smile,    color:'cyan',   label:'Okay'     },
  { value:4, icon:SmilePlus,color:'green',  label:'Good'     },
  { value:5, icon:Laugh,    color:'violet', label:'Great'    },
]

// Timezone-safe: uses local date parts rather than toISOString() which returns UTC
const today = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function IconLabel({ icon, color, children, hint }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-2">
        <GlowIcon icon={icon} color={color} size="xs" />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{children}</label>
      </div>
      {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
    </div>
  )
}

export default function LogEntry() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const existing  = location.state?.log
  const { enqueue } = useOfflineQueue()

  const [form, setForm] = useState({
    date:'', steps:'', sleepHours:'', waterMl:'', weight:'', mood:null, notes:'',
  })
  const [loading,      setLoading]      = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [offlineSaved, setOfflineSaved] = useState(false)
  const [error,        setError]        = useState('')

  // Cleaner init: always sets form, handles both edit and create in one place
  useEffect(() => {
    setForm(existing
      ? {
          date:       existing.date?.slice(0, 10) || today(),
          steps:      existing.steps       ?? '',
          sleepHours: existing.sleepHours  ?? '',
          waterMl:    existing.waterMl     ?? '',
          weight:     existing.weight      ?? '',
          mood:       existing.mood        ?? null,
          notes:      existing.notes       ?? '',
        }
      : { date:today(), steps:'', sleepHours:'', waterMl:'', weight:'', mood:null, notes:'' }
    )
  }, [])

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  // Validation helpers (kept from original — more robust than relying on input type="number")
  const isWholeNumber       = (value) => value === '' || /^\d+$/.test(value)
  const isDecimalOnePlace   = (value) => value === '' || /^\d+(\.\d)?$/.test(value)
  const isSleepValid        = (value) => value === '' || /^\d+(\.\d)?$/.test(value)
  const isWaterValid        = (value) => value === '' || /^\d+$/.test(value)
  const withinRange         = (value, min, max) => value === '' || (Number(value) >= min && Number(value) <= max)

  // Preserves dateLocal alongside ISO string — backend may rely on both
  const sanitise = (obj) => {
    const out = {
      date:      new Date(obj.date).toISOString(),
      dateLocal: obj.date,
    }
    for (const k of ['steps','sleepHours','waterMl','weight','mood']) {
      if (obj[k] !== '' && obj[k] !== null && obj[k] !== undefined) out[k] = Number(obj[k])
    }
    if (obj.notes?.trim()) out.notes = obj.notes.trim()
    return out
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation (original behaviour preserved)
    if (!isWholeNumber(form.steps) || !withinRange(form.steps, 0, 100000)) {
      setError('Steps must be a whole number between 0 and 100,000.')
      return
    }
    if (!isDecimalOnePlace(form.weight) || !withinRange(form.weight, 1, 500)) {
      setError('Weight must be a number with at most one decimal place.')
      return
    }
    if (!isSleepValid(form.sleepHours) || !withinRange(form.sleepHours, 0, 24)) {
      setError('Sleep must be a number with at most one decimal place.')
      return
    }
    if (!isWaterValid(form.waterMl) || !withinRange(form.waterMl, 0, 20000)) {
      setError('Water must be a whole number between 0 and 20,000.')
      return
    }

    setLoading(true)
    const payload = sanitise(form)

    // Offline path — enqueue and return early
    if (!navigator.onLine) {
      enqueue(payload, existing ? 'update' : 'create', existing?._id)
      setOfflineSaved(true)
      setLoading(false)
      setTimeout(() => navigate('/'), 1600)
      return
    }

    try {
      if (existing) await logsApi.update(existing._id, payload)
      else          await logsApi.create(payload)
      setSuccess(true)
      setTimeout(() => navigate('/'), 1400)
    } catch (err) {
      // Treat a network failure (even when onLine was true) as an offline event
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        enqueue(payload, existing ? 'update' : 'create', existing?._id)
        setOfflineSaved(true)
        setLoading(false)
        setTimeout(() => navigate('/'), 1600)
        return
      }
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'Failed to save log. Please check your values.'
      )
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
            style={{ background:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)' }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {existing ? 'Edit log entry' : 'Log health data'}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              All fields optional — log what you tracked today
            </p>
          </div>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Alerts */}
            {error && (
              <div className="alert-glass alert-error">
                {error}
              </div>
            )}
            {success && (
              <div className="alert-glass alert-success flex items-center gap-2">
                <Check size={15} />Saved! Taking you to the dashboard…
              </div>
            )}
            {offlineSaved && (
              <div
                className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.22)' }}
              >
                <CloudOff size={15} className="text-amber-500 flex-shrink-0" />
                <span className="text-amber-700 dark:text-amber-300">
                  Saved offline — will sync automatically when you're back online
                </span>
              </div>
            )}

            {/* Date */}
            <div>
              <IconLabel icon={CalendarDays} color="indigo">Date</IconLabel>
              <input
                type="date"
                className="input-field"
                value={form.date}
                max={today()}
                onChange={e => set('date', e.target.value)}
                required
              />
            </div>

            {/* Steps + Sleep */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <IconLabel icon={Footprints} color="indigo" hint="0–100,000">Steps</IconLabel>
                <input type="text" inputMode="numeric" className="input-field" placeholder="e.g. 7500"
                  value={form.steps} onChange={e => set('steps', e.target.value)} />
              </div>
              <div>
                <IconLabel icon={Moon} color="purple" hint="hours">Sleep</IconLabel>
                <input type="text" inputMode="decimal" className="input-field" placeholder="e.g. 7.1"
                  value={form.sleepHours} onChange={e => set('sleepHours', e.target.value)} />
              </div>
            </div>

            {/* Water + Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <IconLabel icon={Droplets} color="cyan" hint="ml">Water</IconLabel>
                <input type="text" inputMode="numeric" className="input-field" placeholder="e.g. 2130"
                  value={form.waterMl} onChange={e => set('waterMl', e.target.value)} />
              </div>
              <div>
                <IconLabel icon={Scale} color="amber" hint="kg">Weight</IconLabel>
                <input type="text" inputMode="decimal" className="input-field" placeholder="e.g. 68.5"
                  value={form.weight} onChange={e => set('weight', e.target.value)} />
              </div>
            </div>

            {/* Mood */}
            <div>
              <IconLabel icon={Smile} color="green">Mood</IconLabel>
              <div className="flex gap-2">
                {MOODS.map(({ value, icon, color, label }) => {
                  const active = form.mood === value
                  return (
                    <button
                      key={value}
                      type="button"
                      title={label}
                      onClick={() => set('mood', active ? null : value)}
                      className="flex-1 flex items-center justify-center py-3 rounded-xl transition-all duration-200"
                      style={{
                        background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                        border: `2px solid ${active ? 'rgba(255,255,255,0.35)' : 'transparent'}`,
                        transform: active ? 'scale(1.08)' : 'scale(1)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <GlowIcon icon={icon} color={color} size="sm" active={active} />
                    </button>
                  )
                })}
              </div>
              {form.mood && (
                <p className="text-xs text-center mt-2 font-medium text-indigo-500 dark:text-indigo-400">
                  {MOODS.find(m => m.value === form.mood)?.label}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <IconLabel icon={FileText} color="teal" hint={`${form.notes.length}/500`}>Notes</IconLabel>
              <textarea
                className="input-field resize-none"
                placeholder="How are you feeling? Any highlights from today?"
                rows={3}
                maxLength={500}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1"
                disabled={loading || success || offlineSaved}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success || offlineSaved}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : existing ? 'Update log' : 'Save log'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}