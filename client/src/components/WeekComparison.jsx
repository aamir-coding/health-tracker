import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { logsApi } from '../api/healthApi'

const METRICS = [
  { key: 'steps', label: '🚶 Steps', unit: 'steps', better: 'up', fmt: v => Math.round(v).toLocaleString() },
  { key: 'sleepHours', label: '🌙 Sleep', unit: 'hrs', better: 'up', fmt: v => v.toFixed(1) },
  { key: 'waterMl', label: '💧 Water', unit: 'ml', better: 'up', fmt: v => Math.round(v).toLocaleString() },
  { key: 'mood', label: '😊 Mood', unit: '/5', better: 'up', fmt: v => v.toFixed(1) },
  { key: 'weight', label: '⚖️ Weight', unit: 'kg', better: null, fmt: v => v.toFixed(1) },
]

function Delta({ curr, prev, better }) {
  if (curr == null || prev == null || prev === 0) return <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
  const diff = curr - prev
  const pct = Math.round(Math.abs(diff / prev) * 100)
  if (pct === 0) return <span className="flex items-center gap-0.5 text-gray-400 dark:text-gray-500 text-xs"><Minus size={11} />0%</span>
  const good = better === null ? null : (diff > 0) === (better === 'up')
  const cls = good === null ? 'text-gray-500 dark:text-gray-400' : good ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${cls}`}>
      {diff > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {pct}%
    </span>
  )
}

export default function WeekComparison() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    logsApi.getCompare()
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="card h-44 animate-pulse" />

  const hasData = data && METRICS.some(m => data.thisWeek?.[m.key] != null || data.lastWeek?.[m.key] != null)
  if (!hasData) return null

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">This week vs last week</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {['Metric', 'Last week', 'This week', 'Change'].map((h, i) => (
                <th key={h} className={`pb-2 text-xs font-medium text-gray-400 dark:text-gray-500 ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map(({ key, label, unit, better, fmt }) => {
              const curr = data.thisWeek?.[key]
              const prev = data.lastWeek?.[key]
              if (curr == null && prev == null) return null
              return (
                <tr key={key} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <td className="py-2.5 text-gray-600 dark:text-gray-400 text-xs">{label}</td>
                  <td className="py-2.5 text-right text-gray-400 dark:text-gray-500 text-xs tabular-nums">
                    {prev != null ? `${fmt(prev)} ${unit}` : '—'}
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-800 dark:text-gray-200 text-xs tabular-nums">
                    {curr != null ? `${fmt(curr)} ${unit}` : '—'}
                  </td>
                  <td className="py-2.5">
                    <div className="flex justify-end">
                      <Delta curr={curr} prev={prev} better={better} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}