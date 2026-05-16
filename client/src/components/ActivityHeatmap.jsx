import { useState, useEffect } from 'react'
import { logsApi } from '../api/healthApi'
import { useSocket } from '../hooks/useSocket'

const COLORS = [
  'bg-gray-100 dark:bg-gray-800',
  'bg-indigo-300 dark:bg-indigo-600',
  'bg-indigo-600 dark:bg-indigo-400',
]

function intensity(count) {
  if (!count) return 0
  if (count === 1) return 1
  return 2
}

export default function ActivityHeatmap() {
  const [heatmap, setHeatmap] = useState({})
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    logsApi.getHeatmap()
      .then(({ data }) => setHeatmap(data.heatmap || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Real-time updates: incrementally update heatmap on new logs,
  // and re-fetch on updates/deletes to keep counts accurate.
  useSocket({
    onLogNew: (log) => {
      const key = new Date(log.date).toISOString().slice(0, 10)
      setHeatmap(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
    },
    onLogUpdated: async () => {
      try {
        const { data } = await logsApi.getHeatmap()
        setHeatmap(data.heatmap || {})
      } catch (e) {}
    },
    onLogDeleted: async () => {
      try {
        const { data } = await logsApi.getHeatmap()
        setHeatmap(data.heatmap || {})
      } catch (e) {}
    }
  })

  const showTooltip = (day, tileEl) => {
    if (day.future || !tileEl) return

    const tileRect = tileEl.getBoundingClientRect()
    const cardRect = tileEl.closest('[data-heatmap-card]')?.getBoundingClientRect()
    if (!cardRect) return

    setTooltip({
      text: day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      count: day.count,
      x: tileRect.left - cardRect.left + tileRect.width + 10,
      y: tileRect.top - cardRect.top - 6,
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(today)
  start.setDate(today.getDate() - 111)

  const weeks = []
  const cursor = new Date(start)
  for (let w = 0; w < 16; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10)
      week.push({ date: new Date(cursor), dateStr, count: heatmap[dateStr] || 0, future: cursor > today })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  const months = []
  weeks.forEach((week, wi) => {
    const m = week[0].date.toLocaleString('default', { month: 'short' })
    if (!months.length || months[months.length - 1].label !== m) {
      months.push({ label: m, col: wi })
    }
  })

  if (loading) {
    return <div className="card p-5 h-36 animate-pulse" />
  }

  return (
    <div className="card p-5" data-heatmap-card>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity — last 16 weeks</h2>

      <div className="relative">
        <div className="overflow-x-auto">
        <div style={{ minWidth: 520 }}>
          <div style={{ display: 'flex', marginBottom: 4, marginLeft: 20 }}>
            {weeks.map((week, wi) => {
              const m = months.find(mo => mo.col === wi)
              return (
                <div key={wi} style={{ width: 14, marginRight: 2, flexShrink: 0, fontSize: 10 }}
                  className="text-gray-400 dark:text-gray-600">
                  {m ? m.label : ''}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 2 }}>
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} style={{ width: 12, height: 12, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  className="text-gray-400 dark:text-gray-600">
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`rounded-sm ${day.future ? 'opacity-0' : COLORS[intensity(day.count)]}`}
                    style={{ width: 12, height: 12, cursor: day.future ? 'default' : 'default' }}
                    onMouseEnter={(e) => showTooltip(day, e.currentTarget)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 10, justifyContent: 'flex-end' }}>
            <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: 11 }}>Less</span>
            {COLORS.map((cls, i) => (
              <div key={i} className={`rounded-sm ${cls}`} style={{ width: 12, height: 12 }} />
            ))}
            <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: 11 }}>More</span>
          </div>
        </div>
      </div>
    </div>

      {tooltip && (
        <div
          className="absolute z-50 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg pointer-events-none shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-medium">{tooltip.text}</div>
          <div className="text-gray-300">{tooltip.count} log{tooltip.count !== 1 ? 's' : ''} logged</div>
        </div>
      )}
    </div>
  )
}