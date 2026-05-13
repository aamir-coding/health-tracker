import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Check } from 'lucide-react'
import { logsApi } from '../api/healthApi'
import Layout from '../components/Layout'

const MOODS = [
  { value: 1, emoji: '😞', label: 'Very bad' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
]

const today = () => new Date().toISOString().slice(0, 10)

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="label mb-0">{label}</label>
        {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function LogEntry() {
  const navigate = useNavigate()
  const location = useLocation()
  const existing = location.state?.log

  const [form, setForm] = useState({ date: today(), steps: '', sleepHours: '', waterMl: '', weight: '', mood: null, notes: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existing) {
      setForm({
        date: existing.date?.slice(0, 10) || today(),
        steps: existing.steps ?? '',
        sleepHours: existing.sleepHours ?? '',
        waterMl: existing.waterMl ?? '',
        weight: existing.weight ?? '',
        mood: existing.mood ?? null,
        notes: existing.notes ?? '',
      })
    }
  }, [])

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const sanitise = (obj) => {
    const out = { date: obj.date }
    for (const k of ['steps', 'sleepHours', 'waterMl', 'weight', 'mood']) {
      if (obj[k] !== '' && obj[k] !== null && obj[k] !== undefined) out[k] = Number(obj[k])
    }
    if (obj.notes.trim()) out.notes = obj.notes.trim()
    return out
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = sanitise(form)
      if (existing) await logsApi.update(existing._id, payload)
      else await logsApi.create(payload)
      setSuccess(true)
      setTimeout(() => navigate('/'), 1400)
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to save log. Please check your values.')
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{existing ? 'Edit log entry' : 'Log health data'}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">All fields optional — log what you tracked today</p>
          </div>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3.5 py-2.5 rounded-lg">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                <Check size={16} />Saved! Taking you to the dashboard…
              </div>
            )}

            <Field label="📅 Date">
              <input type="date" className="input-field" value={form.date} max={today()} onChange={e => set('date', e.target.value)} required />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="🚶 Steps" hint="0–100,000">
                <input type="number" className="input-field" placeholder="e.g. 7500" value={form.steps} min={0} max={100000} step={1} onChange={e => set('steps', e.target.value)} />
              </Field>
              <Field label="🌙 Sleep" hint="hours">
                <input type="number" className="input-field" placeholder="e.g. 7.5" value={form.sleepHours} min={0} max={24} step={0.5} onChange={e => set('sleepHours', e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="💧 Water" hint="ml">
                <input type="number" className="input-field" placeholder="e.g. 2000" value={form.waterMl} min={0} max={20000} step={50} onChange={e => set('waterMl', e.target.value)} />
              </Field>
              <Field label="⚖️ Weight" hint="kg">
                <input type="number" className="input-field" placeholder="e.g. 68.5" value={form.weight} min={1} max={500} step={0.1} onChange={e => set('weight', e.target.value)} />
              </Field>
            </div>

            <Field label="😊 Mood">
              <div className="flex gap-2">
                {MOODS.map(({ value, emoji, label }) => (
                  <button key={value} type="button" title={label} onClick={() => set('mood', form.mood === value ? null : value)}
                    className={`flex-1 py-3 rounded-xl text-xl transition-all duration-150 border-2 ${
                      form.mood === value
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 dark:border-indigo-500 scale-110 shadow-sm'
                        : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}>
                    {emoji}
                  </button>
                ))}
              </div>
              {form.mood && (
                <p className="text-xs text-indigo-500 dark:text-indigo-400 text-center mt-2 font-medium">
                  {MOODS.find(m => m.value === form.mood)?.label}
                </p>
              )}
            </Field>

            <Field label="📝 Notes" hint={`${form.notes.length}/500`}>
              <textarea className="input-field resize-none" placeholder="How are you feeling? Any highlights from today?" rows={3} maxLength={500} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1" disabled={loading || success}>Cancel</button>
              <button type="submit" disabled={loading || success} className="btn-primary flex-1">
                {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : existing ? 'Update log' : 'Save log'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}