import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft, Check,
  CalendarDays, Footprints, Moon, Droplets, Scale, FileText,
  Frown, Meh, Smile, SmilePlus, Laugh,
} from 'lucide-react'
import { logsApi } from '../api/healthApi'
import GlowIcon from '../components/GlowIcon'
import Layout from '../components/Layout'

const MOODS = [
  { value:1, icon:Frown,    color:'red',    label:'Very bad' },
  { value:2, icon:Meh,      color:'amber',  label:'Bad'      },
  { value:3, icon:Smile,    color:'cyan',   label:'Okay'     },
  { value:4, icon:SmilePlus,color:'green',  label:'Good'     },
  { value:5, icon:Laugh,    color:'violet', label:'Great'    },
]

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

  const [form, setForm] = useState({
    date: today(), steps:'', sleepHours:'', waterMl:'', weight:'', mood:null, notes:'',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (existing) {
      setForm({
        date:       existing.date?.slice(0, 10) || today(),
        steps:      existing.steps       ?? '',
        sleepHours: existing.sleepHours  ?? '',
        waterMl:    existing.waterMl     ?? '',
        weight:     existing.weight      ?? '',
        mood:       existing.mood        ?? null,
        notes:      existing.notes       ?? '',
      })
    }
  }, [])

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const sanitise = (obj) => {
    const out = { 
      date: new Date(obj.date).toISOString(),
      dateLocal: obj.date,
    }
    for (const k of ['steps','sleepHours','waterMl','weight','mood']) {
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
      else          await logsApi.create(payload)
      setSuccess(true)
      setTimeout(() => navigate('/'), 1400)
    } catch (err) {
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
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Alerts */}
            {error && (
              <div
                className="text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl"
                style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.22)' }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm px-4 py-3 rounded-xl"
                style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.22)' }}
              >
                <Check size={15} />Saved! Taking you to the dashboard…
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
                <input type="number" className="input-field" placeholder="e.g. 7500" value={form.steps} min={0} max={100000} step={1} onChange={e => set('steps', e.target.value)} />
              </div>
              <div>
                <IconLabel icon={Moon} color="purple" hint="hours">Sleep</IconLabel>
                <input type="number" className="input-field" placeholder="e.g. 7.5" value={form.sleepHours} min={0} max={24} step={0.5} onChange={e => set('sleepHours', e.target.value)} />
              </div>
            </div>

            {/* Water + Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <IconLabel icon={Droplets} color="cyan" hint="ml">Water</IconLabel>
                <input type="number" className="input-field" placeholder="e.g. 2000" value={form.waterMl} min={0} max={20000} step={50} onChange={e => set('waterMl', e.target.value)} />
              </div>
              <div>
                <IconLabel icon={Scale} color="amber" hint="kg">Weight</IconLabel>
                <input type="number" className="input-field" placeholder="e.g. 68.5" value={form.weight} min={1} max={500} step={0.1} onChange={e => set('weight', e.target.value)} />
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
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1" disabled={loading || success}>
                Cancel
              </button>
              <button type="submit" disabled={loading || success} className="btn-primary flex-1">
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