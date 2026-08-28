import { useState, useEffect } from 'react'
import { logsApi } from '../api/healthApi'
import { useSocket } from '../hooks/useSocket'

const COLORS = [
  'bg-gray-100 dark:bg-gray-800',
  'bg-indigo-500 dark:bg-indigo-300',
]

function intensity(count) {
  return count ? 1 : 0
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

  // Real-time updates: re-fetch on create/delete (affects counts),
  // skip on update (most edits don't change date/heatmap)
  useSocket({
    onLogNew: async () => {
      try {
        const { data } = await logsApi.getHeatmap()
        setHeatmap(data.heatmap || {})
      } catch (e) {}
    },
    onLogUpdated: () => {
      // Skip: most updates are to steps/mood/notes, not dates
      // If user edits the date, heatmap will refresh on next natural fetch or delete
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

  // Build complete Monday-to-Sunday columns so dates stay in their real weekday rows.
  const daysSinceMonday = (today.getDay() + 6) % 7
  const start = new Date(today)
  start.setDate(today.getDate() - daysSinceMonday - (15 * 7))

  // Format a Date to local YYYY-MM-DD (avoids UTC shifts from toISOString)
  const formatLocalDateKey = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }

  const weeks = []
  const cursor = new Date(start)
  for (let w = 0; w < 16; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = formatLocalDateKey(cursor)
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
        <div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))', gap: 4, marginBottom: 4, marginLeft: 20 }}>
            {weeks.map((week, wi) => {
              const m = months.find(mo => mo.col === wi)
              return (
                <div key={wi} style={{ minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 11 }}
                  className="text-gray-400 dark:text-gray-600">
                  {m ? m.label : ''}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '20px repeat(16, minmax(0, 1fr))', gridTemplateRows: 'repeat(7, minmax(0, 1fr))', gap: 4, alignItems: 'center' }}>
            {['M','T','W','T','F','S','S'].map((label, row) => (
              <div key={`label-${row}`} style={{ gridColumn: 1, gridRow: row + 1, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="text-gray-400 dark:text-gray-600">
                {label}
              </div>
            ))}

            {weeks.map((week, wi) => week.map((day, di) => (
              <div
                key={`${wi}-${di}`}
                className={`rounded-[3px] ${day.future ? 'opacity-0' : COLORS[intensity(day.count)]}`}
                style={{ gridColumn: wi + 2, gridRow: di + 1, width: '82%', aspectRatio: '1', justifySelf: 'center', cursor: day.future ? 'default' : 'default' }}
                onMouseEnter={(e) => showTooltip(day, e.currentTarget)}
                onMouseLeave={() => setTooltip(null)}
              />
            )))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, justifyContent: 'flex-end' }}>
            <div className={`rounded-sm ${COLORS[1]}`} style={{ width: 12, height: 12 }} />
            <span className="text-sm text-gray-400 dark:text-gray-500">Recorded</span>
          </div>
        </div>
      </div>
    </div>

      {tooltip && (
        <div
          className="absolute z-50 bg-gray-900 dark:bg-gray-700 text-white text-sm px-2.5 py-1.5 rounded-lg pointer-events-none shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-medium">{tooltip.text}</div>
          <div className="text-gray-300">{tooltip.count ? 'Day recorded' : 'No record'}</div>
        </div>
      )}
    </div>
  )
}