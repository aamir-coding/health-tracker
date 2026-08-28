import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  SquarePen, Footprints, Moon, Droplets, Smile, HeartPulse,
  Flame, Trophy, Sprout, Target, Activity, Heart,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logsApi, authApi } from '../api/healthApi'
import { useSocket } from '../hooks/useSocket'
import { convertWeight, convertWater, weightUnit, waterUnit } from '../utils/units'
import GlowIcon from '../components/GlowIcon'
import Layout from '../components/Layout'
import MetricCard from '../components/MetricCard'
import TrendChart from '../components/TrendChart'
import InsightCard from '../components/InsightCard'
import ActivityHeatmap from '../components/ActivityHeatmap'
import WeekComparison from '../components/WeekComparison'

const MOOD_LABELS = { 1:'Very bad', 2:'Bad', 3:'Okay', 4:'Good', 5:'Great' }

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const todayLabel = () =>
  new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })

const todayLocal = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const formatLogDate = (log) => {
  if (!log) return null
  const date = log.dateLocal ? new Date(`${log.dateLocal}T00:00:00`) : new Date(log.date)
  return date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

function computeHealthScore(avg) {
  let score = 0, max = 0
  if (avg.steps != null)      { score += Math.min(avg.steps / 10000, 1) * 25; max += 25 }
  if (avg.sleepHours != null) {
    const s = avg.sleepHours
    score += (s >= 7 && s <= 9 ? 25 : s >= 6 ? 18 : s >= 5 ? 10 : 5); max += 25
  }
  if (avg.waterMl != null)    { score += Math.min(avg.waterMl / 2000, 1) * 25; max += 25 }
  if (avg.mood != null)       { score += ((avg.mood - 1) / 4) * 25; max += 25 }
  return max === 0 ? null : Math.round((score / max) * 100)
}

function scoreLabel(s) {
  if (s >= 80) return { text:'Excellent', color:'text-green-600 dark:text-green-400'  }
  if (s >= 60) return { text:'Good',      color:'text-indigo-600 dark:text-indigo-400' }
  if (s >= 40) return { text:'Fair',      color:'text-amber-500 dark:text-amber-400'   }
  return               { text:'Needs work',color:'text-red-500 dark:text-red-400'      }
}

function bmiCategory(bmi) {
  const b = parseFloat(bmi)
  if (b < 18.5) return { label:'Underweight', color:'text-blue-500 dark:text-blue-400'    }
  if (b < 25)   return { label:'Healthy',     color:'text-green-600 dark:text-green-400'  }
  if (b < 30)   return { label:'Overweight',  color:'text-amber-500 dark:text-amber-400'  }
  return               { label:'Obese',       color:'text-red-500 dark:text-red-400'      }
}

const GOAL_ITEMS = [
  { key:'steps',      label:'Steps',  icon:Footprints, color:'indigo', fmt:(v)=>v?.toLocaleString(), glowCls:'bg-indigo-500'  },
  { key:'sleepHours', label:'Sleep',  icon:Moon,       color:'purple', fmt:(v)=>`${v}h`,             glowCls:'bg-purple-500' },
  { key:'waterMl',    label:'Water',  icon:Droplets,   color:'cyan',   fmt:(v)=>`${v}ml`,            glowCls:'bg-cyan-500'   },
  { key:'mood',       label:'Mood',   icon:Smile,      color:'green',  fmt:(v)=>`${v}/5`,            glowCls:'bg-green-500'  },
]

function GoalsProgress({ goals, todayLog }) {
  const items = GOAL_ITEMS.map(m => ({
    ...m,
    actual: todayLog ? todayLog[m.key === 'mood' ? 'mood' : m.key] : 0,
    target: m.key === 'mood' ? goals?.targetMood : goals?.[`daily${m.key.charAt(0).toUpperCase() + m.key.slice(1)}`],
  })).filter(i => i.target != null)

  if (!items.length) return null

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GlowIcon icon={Target} color="green" size="md" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Today's goals</h2>
        </div>
        <Link to="/settings" className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline">
          Edit goals
        </Link>
      </div>
      <div className="space-y-4">
        {items.map(({ key, label, icon, color, actual, target, fmt, glowCls }) => {
          const pct = actual != null ? Math.min(Math.round(actual / target * 100), 100) : 0
          const met = pct >= 100
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <GlowIcon icon={icon} color={color} size="xs" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                </div>
                <span className={`text-xs font-medium tabular-nums ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {actual != null ? fmt(actual) : '—'} / {fmt(target)}{met && ' ✓'}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ${met ? 'bg-green-500' : glowCls}`}
                  style={{
                    width: `${pct}%`,
                    boxShadow: met ? '0 0 8px rgba(16,185,129,0.6)' : undefined,
                  }}
                />
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
      <div className="h-7 rounded-xl w-64" style={{ background: 'rgba(0,0,0,0.08)' }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl" style={{ background: 'rgba(0,0,0,0.06)' }} />
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const [stats, setStats]         = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [streak, setStreak]       = useState({ streak:0, longest:0 })
  const [loading, setLoading]     = useState(true)
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
      const { data } = await authApi.updateProfile({ height: h })
      updateUser({ height: data.user.height })
      setHeightInput('')
    } catch (err) {
      console.error(err)
    } finally {
      setSettingHeight(false)
    }
  }

  const units   = user?.preferences?.units || 'metric'
  const latest  = stats?.latest
  const avg     = stats?.averages || {}
  const todayLog = recentLogs.find(log => log.dateLocal === todayLocal())
  const latestDateLabel = formatLogDate(latest)

  const bmi = user?.height && latest?.weight
    ? (latest.weight / Math.pow(user.height / 100, 2)).toFixed(1) : null
  const bmiCat     = bmi ? bmiCategory(bmi) : null
  const healthScore = computeHealthScore(avg)
  const scoreMeta   = healthScore != null ? scoreLabel(healthScore) : null

  const metricCards = [
    {
      label:'Steps',
      value: latest?.steps != null ? latest.steps.toLocaleString() : null,
      unit:'steps',
      icon: <GlowIcon icon={Footprints} color="indigo" size="sm" />,
      sub: avg.steps != null ? `30d avg: ${Math.round(avg.steps).toLocaleString()}` : null,
    },
    {
      label:'Sleep',
      value: latest?.sleepHours ?? null,
      unit:'hrs',
      icon: <GlowIcon icon={Moon} color="purple" size="sm" />,
      sub: avg.sleepHours != null ? `30d avg: ${avg.sleepHours}hrs` : null,
    },
    {
      label:'Water',
      value: latest?.waterMl != null ? convertWater(latest.waterMl, units) : null,
      unit: waterUnit(units),
      icon: <GlowIcon icon={Droplets} color="cyan" size="sm" />,
      sub: avg.waterMl != null ? `30d avg: ${convertWater(Math.round(avg.waterMl), units)}${waterUnit(units)}` : null,
    },
    {
      label:'Mood',
      value: latest?.mood ?? null,
      unit:'/ 5',
      icon: <GlowIcon icon={Smile} color="green" size="sm" />,
      sub: latest?.mood != null ? MOOD_LABELS[latest.mood] : null,
    },
  ]

  return (
    <Layout streak={streak.streak}>
      {loading ? <Skeleton /> : (
        <div className="space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {greeting()}, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">{todayLabel()}</p>
            </div>
            <Link to="/log" className="btn-primary self-start gap-2">
              <SquarePen size={15} />Log today
            </Link>
          </div>

          {/* Streak banner */}
          {streak.streak > 0 && (
            <div
              className="card p-4 flex items-center gap-4"
              style={{ background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.22)' }}
            >
              <GlowIcon icon={Flame} color="orange" size="lg" />
              <div className="flex-1">
                <div className="font-bold text-orange-800 dark:text-orange-300 text-base">
                  {streak.streak} day streak!
                </div>
                <div className="text-orange-500 text-xs">
                  Personal best: {streak.longest} days · keep logging daily
                </div>
              </div>
              {streak.streak >= 7 && <GlowIcon icon={Trophy} color="amber" size="md" />}
            </div>
          )}

          {/* Empty state */}
          {stats?.total === 0 && (
            <div className="card p-10 text-center" style={{ border:'1px dashed rgba(99,102,241,0.25)' }}>
              <div className="flex justify-center mb-4">
                <GlowIcon icon={Sprout} color="green" size="xl" />
              </div>
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No logs yet</h2>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">
                Log your first entry to start seeing trends
              </p>
              <Link to="/log" className="btn-primary gap-2">
                <SquarePen size={15} />Log your first entry
              </Link>
            </div>
          )}

          {/* Latest entry metrics */}
          <div>
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Latest entry</h2>
              {latestDateLabel && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{latestDateLabel}</span>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {metricCards.map(m => <MetricCard key={m.label} {...m} />)}
            </div>
          </div>

          {/* Goals */}
          <GoalsProgress goals={user?.goals} todayLog={todayLog} />

          {/* BMI + Health score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* BMI */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <GlowIcon icon={HeartPulse} color="amber" size="sm" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">BMI</span>
              </div>
              {bmi ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{bmi}</span>
                    <span className={`text-sm font-semibold ${bmiCat.color}`}>{bmiCat.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {convertWeight(latest?.weight, units)}{weightUnit(units)} · {user.height}cm
                    {user?.goals?.targetWeight && ` · target: ${user.goals.targetWeight}kg`}
                  </p>
                  <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: '100%',
                        background: 'linear-gradient(90deg,#60a5fa,#34d399,#fbbf24,#f87171)',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div
                    className="relative h-3 w-3 rounded-full border-2 border-white dark:border-gray-900"
                    style={{
                      marginLeft: `${Math.min(Math.max((parseFloat(bmi) - 15) / 25 * 100, 0), 96)}%`,
                      marginTop: -10,
                      background: '#6366f1',
                      boxShadow: '0 0 6px rgba(99,102,241,0.7)',
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-300 dark:text-gray-600 mt-1">
                    <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                  </div>
                </>
              ) : !user?.height ? (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Enter your height to calculate BMI</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Height (cm)"
                      min={50} max={300} step={1}
                      value={heightInput}
                      onChange={e => setHeightInput(e.target.value)}
                      className="input-field"
                      onKeyDown={e => e.key === 'Enter' && handleSetHeight()}
                    />
                    <button
                      onClick={handleSetHeight}
                      disabled={settingHeight || !heightInput}
                      className="btn-primary flex-shrink-0"
                    >
                      {settingHeight ? '…' : 'Save'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  Log your weight to see BMI
                </p>
              )}
            </div>

            {/* Health score */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <GlowIcon icon={Activity} color="indigo" size="sm" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Health score
                </span>
              </div>
              {healthScore != null ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      {healthScore}
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">/ 100</span>
                    <span className={`text-sm font-semibold ${scoreMeta.color}`}>{scoreMeta.text}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Based on 30-day averages</p>
                  <div className="mt-3 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        healthScore >= 80 ? 'bg-green-500' :
                        healthScore >= 60 ? 'bg-indigo-500' :
                        healthScore >= 40 ? 'bg-amber-400'  : 'bg-red-400'
                      }`}
                      style={{
                        width: `${healthScore}%`,
                        boxShadow: `0 0 8px ${healthScore >= 80 ? 'rgba(16,185,129,0.6)' : healthScore >= 60 ? 'rgba(99,102,241,0.6)' : 'rgba(245,158,11,0.6)'}`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  Log more data to see your health score
                </p>
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