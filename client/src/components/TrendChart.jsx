import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const METRICS = [
  { key: 'steps', label: 'Steps', color: '#6366f1', unit: 'steps', decimals: 0 },
  { key: 'sleepHours', label: 'Sleep', color: '#8b5cf6', unit: 'hrs', decimals: 1 },
  { key: 'waterMl', label: 'Water', color: '#06b6d4', unit: 'ml', decimals: 0 },
  { key: 'weight', label: 'Weight', color: '#f59e0b', unit: 'kg', decimals: 1 },
  { key: 'mood', label: 'Mood', color: '#10b981', unit: '/ 5', decimals: 0 },
]

function formatAxisDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CustomTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length || payload[0].value == null) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="font-semibold" style={{ color: metric.color }}>
        {metric.decimals === 0
          ? Number(payload[0].value).toLocaleString()
          : payload[0].value}{' '}
        {metric.unit}
      </p>
    </div>
  )
}

export default function TrendChart({ logs }) {
  const [selectedKey, setSelectedKey] = useState('steps')
  const metric = METRICS.find((m) => m.key === selectedKey) || METRICS[0]

  const data = (logs || []).map((log) => ({
    date: formatAxisDate(log.date),
    value:
      log[metric.key] != null
        ? parseFloat(log[metric.key].toFixed(metric.decimals))
        : null,
  }))

  const hasData = data.some((d) => d.value != null)

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-sm font-semibold text-gray-900">7-day trend</h2>
        <div className="flex flex-wrap gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedKey(m.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                selectedKey === m.key
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                selectedKey === m.key ? { backgroundColor: m.color } : {}
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {!hasData ? (
        <div className="h-48 flex flex-col items-center justify-center text-gray-400">
          <span className="text-3xl mb-2">📈</span>
          <p className="text-sm">No {metric.label.toLowerCase()} data yet</p>
          <p className="text-xs mt-1">Start logging to see your trends</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              domain={metric.key === 'mood' ? [1, 5] : ['auto', 'auto']}
            />
            <Tooltip content={(props) => <CustomTooltip {...props} metric={metric} />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={metric.color}
              strokeWidth={2.5}
              dot={{ fill: metric.color, strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: metric.color }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}