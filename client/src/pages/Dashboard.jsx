import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { SquarePen, Target } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logsApi } from '../api/healthApi'
import { useSocket } from '../hooks/useSocket'
import { convertWeight, convertWater, weightUnit, waterUnit } from '../utils/units'
import Layout from '../components/Layout'
import MetricCard from '../components/MetricCard'
import TrendChart from '../components/TrendChart'
import InsightCard from '../components/InsightCard'
import ActivityHeatmap from '../components/ActivityHeatmap'
import WeekComparison from '../components/WeekComparison'

const MOOD_LABELS = { 1: 'Very bad', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Great' }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function computeHealthScore(avg) {
  let score = 0, max = 0
  if (avg.steps != null) { score += Math.min(avg.steps / 10000, 1) * 25; max += 25 }
  if (avg.sleepHours != null) {
    const s = avg.sleepHours
    score += (s >= 7 && s <= 9 ? 25 : s >= 6 ? 18 : s >= 5 ? 10 : 5); max += 25
  }
  if (avg.waterMl != null) { score += Math.min(avg.waterMl / 2000, 1) * 25; max += 25 }
  if (avg.mood != null) { score += ((avg.mood - 1) / 4) * 25; max += 25 }
  return max === 0 ? null : Math.round((score / max) * 100)
}

function scoreLabel(s) {
  if (s >= 80) return { text: 'Excellent', color: 'text-green-600 dark:text-green-400' }
  if (s >= 60) return { text: 'Good', color: 'text-indigo-600 dark:text-indigo-400' }
  if (s >= 40) return { text: 'Fair', color: 'text-amber-500 dark:text-amber-400' }
  return { text: 'Needs work', color: 'text-red-500 dark:text-red-400' }
}

function bmiCategory(bmi) {
  const b = parseFloat(bmi)
  if (b < 18.5) return { label: 'Underweight', color: 'text-blue-500 dark:text-blue-400' }
  if (b < 25) return { label: 'Healthy', color: 'text-green-600 dark:text-green-400' }
  if (b < 30) return { label: 'Overweight', color: 'text-amber-500 dark:text-amber-400' }
  return { label: 'Obese', color: 'text-red-500 dark:text-red-400' }
}

function GoalsProgress({ goals, latest }) {
  const items = [
    { key: 'steps', label: 'Steps', icon: '🚶', actual: latest?.steps, target: goals?.dailySteps, fmt: v => v?.toLocaleString(), color: 'bg-indigo-500' },
    { key: 'sleep', label: 'Sleep', icon: '🌙', actual: latest?.sleepHours, target: goals?.dailySleepHours, fmt: v => `${v}h`, color: 'bg-purple-500' },
    { key: 'water', label: 'Water', icon: '💧', actual: latest?.waterMl, target: goals?.dailyWaterMl, fmt: v => `${v}ml`, color: 'bg-cyan-500' },
    { key: 'mood', label: 'Mood', icon: '😊', actual: latest?.mood, target: goals?.targetMood, fmt: v => `${v}/5`, color: 'bg-green-500' },
  ].filter(i => i.target != null)

  if (!items.length) return null

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
            <Target size={14} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Today's goals</h2>
        </div>
        <Link to="/settings" className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline">Edit goals</Link>
      </div>
      <div className="space-y-3.5">
        {items.map(({ key, label, icon, actual, target, fmt, color }) => {
          const pct = actual != null ? Math.min(Math.round(actual / target * 100), 100) : 0
          const met = pct >= 100
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-gray-600 dark:text-gray-400">{icon} {label}</span>
                <span className={`text-xs font-medium tabular-nums ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {actual != null ? fmt(actual) : '—'} / {fmt(target)}
                  {met && ' ✓'}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${met ? 'bg-green-500' : color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded-lg w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [streak, setStreak] = useState({ streak: 0, longest: 0 })
  const [loading, setLoading] = useState(true)
  const [heightInput, setHeightInput] = useState('')
  const [settingHeight, setSettingHeight] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, recentRes, streakRes] = await Promise.all([
        logsApi.getStats(), logsApi.getRecent(), logsApi.getStreak(),
      ])
      setStats(statsRes.data)
      setRecentLogs(recentRes.data.logs || [])
      setStreak(streakRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useSocket({ onLogNew: fetchData, onLogUpdated: fetchData, onLogDeleted: fetchData })

  const handleSetHeight = async () => {
    const h = parseFloat(heightInput)
    if (!h || h < 50 || h > 300) return
    setSettingHeight(true)
    try {
      const { authApi } = await import('../api/healthApi')
      const { data } = await authApi.updateProfile({ height: h })
      updateUser({ height: data.user.height })
      setHeightInput('')
    } catch (err) {
      console.error(err)
    } finally {
      setSettingHeight(false)
    }
  }

  const units = user?.preferences?.units || 'metric'
  const latest = stats?.latest
  const avg = stats?.averages || {}

  const bmi = user?.height && latest?.weight
    ? (latest.weight / Math.pow(user.height / 100, 2)).toFixed(1) : null
  const bmiCat = bmi ? bmiCategory(bmi) : null
  const healthScore = computeHealthScore(avg)
  const scoreMeta = healthScore != null ? scoreLabel(healthScore) : null

  const metricCards = [
    { label: 'Steps', value: latest?.steps != null ? latest.steps.toLocaleString() : null, unit: 'steps', icon: '🚶', sub: avg.steps != null ? `30d avg: ${Math.round(avg.steps).toLocaleString()}` : null },
    { label: 'Sleep', value: latest?.sleepHours ?? null, unit: 'hrs', icon: '🌙', sub: avg.sleepHours != null ? `30d avg: ${avg.sleepHours}hrs` : null },
    { label: 'Water', value: latest?.waterMl != null ? convertWater(latest.waterMl, units) : null, unit: waterUnit(units), icon: '💧', sub: avg.waterMl != null ? `30d avg: ${convertWater(Math.round(avg.waterMl), units)}${waterUnit(units)}` : null },
    { label: 'Mood', value: latest?.mood ?? null, unit: '/ 5', icon: '😊', sub: latest?.mood != null ? MOOD_LABELS[latest.mood] : null },
  ]

  return (
    <Layout streak={streak.streak}>
      {loading ? <Skeleton /> : (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">{todayLabel()}</p>
            </div>
            <Link to="/log" className="btn-primary self-start gap-2"><SquarePen size={15} />Log today</Link>
          </div>

          {streak.streak > 0 && (
            <div className="card p-4 flex items-center gap-4 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
              <span className="text-3xl">🔥</span>
              <div className="flex-1">
                <div className="font-bold text-orange-800 dark:text-orange-300 text-base">{streak.streak} day streak!</div>
                <div className="text-orange-500 text-xs">Personal best: {streak.longest} days</div>
              </div>
              {streak.streak >= 7 && <span className="text-2xl">🏆</span>}
            </div>
          )}

          {stats?.total === 0 && (
            <div className="card p-8 text-center border-dashed">
              <p className="text-4xl mb-3">🌱</p>
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No logs yet</h2>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Log your first entry to start seeing trends</p>
              <Link to="/log" className="btn-primary gap-2"><SquarePen size={15} />Log your first entry</Link>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metricCards.map(m => <MetricCard key={m.label} {...m} />)}
          </div>

          {/* Goals progress */}
          <GoalsProgress goals={user?.goals} latest={latest} />

          {/* BMI + Health score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="card p-5">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">BMI</span>
              {bmi ? (
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{bmi}</span>
                    <span className={`text-sm font-semibold ${bmiCat.color}`}>{bmiCat.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {convertWeight(latest?.weight, units)}{weightUnit(units)} · {user.height}cm
                    {user?.goals?.targetWeight && <span className="ml-1">· target: {user.goals.targetWeight}kg</span>}
                  </p>
                  <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-red-400 opacity-70" style={{ width: '100%' }} />
                  </div>
                  <div className="relative -mt-2 h-3 w-3 rounded-full bg-indigo-600 border-2 border-white dark:border-gray-900 shadow"
                    style={{ marginLeft: `${Math.min(Math.max((parseFloat(bmi) - 15) / 25 * 100, 0), 96)}%` }} />
                  <div className="flex justify-between text-xs text-gray-300 dark:text-gray-600 mt-0.5"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span></div>
                </div>
              ) : !user?.height ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Enter your height to calculate BMI</p>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Height (cm)" min={50} max={300} step={1} value={heightInput} onChange={e => setHeightInput(e.target.value)} className="input-field" onKeyDown={e => e.key === 'Enter' && handleSetHeight()} />
                    <button onClick={handleSetHeight} disabled={settingHeight || !heightInput} className="btn-primary flex-shrink-0">{settingHeight ? '…' : 'Save'}</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">Log your weight to see BMI</p>
              )}
            </div>

            <div className="card p-5">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Health score</span>
              {healthScore != null ? (
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{healthScore}</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">/ 100</span>
                    <span className={`text-sm font-semibold ${scoreMeta.color}`}>{scoreMeta.text}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Based on 30-day averages</p>
                  <div className="mt-3 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${healthScore >= 80 ? 'bg-green-500' : healthScore >= 60 ? 'bg-indigo-500' : healthScore >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${healthScore}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">Log more data to see your health score</p>
              )}
            </div>
          </div>

          <TrendChart logs={recentLogs} />
          <WeekComparison />
          <InsightCard />
          <ActivityHeatmap />

          {stats?.total > 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-2">
              {stats.total} total log{stats.total !== 1 ? 's' : ''} ·{' '}
              <Link to="/history" className="text-indigo-500 hover:underline">View all history</Link>
            </p>
          )}
        </div>
      )}
    </Layout>
  )
}