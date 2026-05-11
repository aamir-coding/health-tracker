import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { SquarePen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logsApi } from '../api/healthApi'
import { useSocket } from '../hooks/useSocket'
import Layout from '../components/Layout'
import MetricCard from '../components/MetricCard'
import TrendChart from '../components/TrendChart'
import InsightCard from '../components/InsightCard'

const MOOD_LABELS = { 1: 'Very bad', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Great' }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 bg-gray-200 rounded-lg w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-72 bg-gray-200 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        logsApi.getStats(),
        logsApi.getRecent(),
      ])
      setStats(statsRes.data)
      setRecentLogs(recentRes.data.logs || [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useSocket({
    onLogNew: fetchData,
    onLogUpdated: fetchData,
    onLogDeleted: fetchData,
  })

  const latest = stats?.latest
  const avg = stats?.averages || {}

  const metricCards = [
    {
      label: 'Steps',
      value: latest?.steps != null ? latest.steps.toLocaleString() : null,
      unit: 'steps',
      icon: '🚶',
      sub: avg.steps != null ? `30-day avg: ${Math.round(avg.steps).toLocaleString()}` : null,
    },
    {
      label: 'Sleep',
      value: latest?.sleepHours ?? null,
      unit: 'hrs',
      icon: '🌙',
      sub: avg.sleepHours != null ? `30-day avg: ${avg.sleepHours}hrs` : null,
    },
    {
      label: 'Water',
      value: latest?.waterMl ?? null,
      unit: 'ml',
      icon: '💧',
      sub: avg.waterMl != null ? `30-day avg: ${Math.round(avg.waterMl)}ml` : null,
    },
    {
      label: 'Mood',
      value: latest?.mood ?? null,
      unit: '/ 5',
      icon: '😊',
      sub: latest?.mood != null ? MOOD_LABELS[latest.mood] : null,
    },
  ]

  return (
    <Layout>
      {loading ? (
        <Skeleton />
      ) : (
        <div className="space-y-5">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {greeting()}, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">{todayLabel()}</p>
            </div>
            <Link to="/log" className="btn-primary self-start sm:self-auto gap-2">
              <SquarePen size={15} />
              Log today
            </Link>
          </div>

          {/* No data empty state */}
          {stats?.total === 0 && (
            <div className="card p-8 text-center border-dashed">
              <p className="text-4xl mb-3">🌱</p>
              <h2 className="font-semibold text-gray-700 mb-1">No logs yet</h2>
              <p className="text-gray-400 text-sm mb-4">
                Log your first entry to start seeing your trends and insights
              </p>
              <Link to="/log" className="btn-primary gap-2">
                <SquarePen size={15} />
                Log your first entry
              </Link>
            </div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metricCards.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>

          {/* Weight card (single wider) */}
          {latest?.weight != null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetricCard
                label="Weight"
                value={latest.weight}
                unit="kg"
                icon="⚖️"
                sub={avg.weight != null ? `30-day avg: ${avg.weight}kg` : null}
              />
              {latest?.notes && (
                <div className="card p-4 lg:p-5">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Latest note
                  </span>
                  <p className="text-sm text-gray-600 mt-2 italic">
                    "{latest.notes}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 7-day trends */}
          <TrendChart logs={recentLogs} />

          {/* AI Insight */}
          <InsightCard />

          {/* Footer */}
          {stats?.total > 0 && (
            <p className="text-center text-xs text-gray-400 pb-2">
              {stats.total} total log{stats.total !== 1 ? 's' : ''} ·{' '}
              <Link to="/history" className="text-indigo-500 hover:underline">
                View all history
              </Link>
            </p>
          )}
        </div>
      )}
    </Layout>
  )
}