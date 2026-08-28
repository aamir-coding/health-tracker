import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import GlowIcon from './GlowIcon'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { convertWater, convertWeight, waterUnit, weightUnit } from '../utils/units'

const METRICS = [
  { key:'steps',      label:'Steps',  color:'#6366f1', unit:'steps', decimals:0, glowColor:'indigo' },
  { key:'sleepHours', label:'Sleep',  color:'#8b5cf6', unit:'hrs',   decimals:1, glowColor:'purple' },
  { key:'waterMl',    label:'Water',  color:'#06b6d4', unit:'ml',    decimals:0, glowColor:'cyan'   },
  { key:'weight',     label:'Weight', color:'#f59e0b', unit:'kg',    decimals:1, glowColor:'amber'  },
  { key:'mood',       label:'Mood',   color:'#10b981', unit:'/ 5',   decimals:0, glowColor:'green'  },
]

function CustomTooltip({ active, payload, label, metric, units }) {
  if (!active || !payload?.length || payload[0].value == null) return null
  return (
    <div
      className="px-3 py-2 text-sm rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.1), 0 0 8px ${metric.color}33`,
      }}
    >
      <p className="text-gray-500 text-sm mb-0.5">{label}</p>
      <p className="font-semibold" style={{ color: metric.color }}>
        {metric.decimals === 0
          ? Number(payload[0].value).toLocaleString()
          : payload[0].value}{' '}
        {metric.key === 'waterMl' ? waterUnit(units) : metric.key === 'weight' ? weightUnit(units) : metric.unit}
      </p>
    </div>
  )
}

export default function TrendChart({ logs }) {
  const [selectedKey, setSelectedKey] = useState('steps')
  const { dark } = useTheme()
  const { user } = useAuth()
  const units = user?.preferences?.units || 'metric'
  const metric = METRICS.find(m => m.key === selectedKey) || METRICS[0]

  // Ensure data is chronological: oldest -> newest (left -> right on chart)
  const data = (logs || [])
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(log => ({
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: log[metric.key] != null
        ? metric.key === 'waterMl' ? convertWater(log.waterMl, units)
        : metric.key === 'weight' ? convertWeight(log.weight, units)
        : parseFloat(log[metric.key].toFixed(metric.decimals))
        : null,
    }))

  const hasData = data.some(d => d.value != null)
  const gridColor  = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const tickColor  = dark ? '#4b5563' : '#9ca3af'

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">7-day trend</h2>
        <div className="flex flex-wrap gap-1.5">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setSelectedKey(m.key)}
              className="px-3 py-1 rounded-full text-sm font-medium transition-all duration-200"
              style={
                selectedKey === m.key
                  ? {
                      color: '#fff',
                      background: m.color,
                      boxShadow: `0 0 10px ${m.color}60, 0 2px 8px ${m.color}40`,
                    }
                  : {
                      background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                      color: dark ? '#9ca3af' : '#6b7280',
                    }
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="h-48 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-600">
          <GlowIcon icon={TrendingUp} color="indigo" size="lg" />
          <p className="text-sm">No {metric.label.toLowerCase()} data yet</p>
          <p className="text-sm opacity-70">Start logging to see your trends</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="date" padding={{ left: 12, right: 12 }} tick={{ fontSize: 13, fill: tickColor }} tickMargin={8} axisLine={false} tickLine={false} />
            <YAxis width={48} tick={{ fontSize: 13, fill: tickColor }} tickMargin={5} axisLine={false} tickLine={false} domain={metric.key === 'mood' ? [1, 5] : ['auto', 'auto']} />
            <Tooltip content={props => <CustomTooltip {...props} metric={metric} units={units} />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={metric.color}
              strokeWidth={2.5}
              dot={{ fill: metric.color, strokeWidth: 0, r: 4, filter: `drop-shadow(0 0 4px ${metric.color})` }}
              activeDot={{ r: 6, strokeWidth: 0, fill: metric.color }}
              connectNulls={false}
              style={{ filter: `drop-shadow(0 0 6px ${metric.color}80)` }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}