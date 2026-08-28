import { useState } from 'react'
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import GlowIcon from './GlowIcon'
import { insightsApi } from '../api/healthApi'

export default function InsightCard() {
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const fetchInsight = async (refresh = false) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await insightsApi.getWeekly(refresh)
      setInsight(data.insight)
      setLoaded(true)
    } catch {
      setError('Could not load insight. Check your API key in the server .env file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GlowIcon icon={Sparkles} color="violet" size="md" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI weekly insight</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">Powered by Groq · OpenAI's GPT-OSS (20B)</p>
          </div>
        </div>
        {loaded && (
          <button
            onClick={() => fetchInsight(true)}
            disabled={loading}
            title="Refresh insight"
            className="p-2 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {!loaded && !loading && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
            Get 3 personalised, actionable tips based on your week's data.
          </p>
          <button onClick={() => fetchInsight(false)} className="btn-primary gap-2">
            <Sparkles size={15} />
            Generate my insight
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-2.5 py-2">
          {[100, 83, 66, 83, 70].map((w, i) => (
            <div
              key={i}
              className="h-3.5 rounded-full animate-pulse"
              style={{ width: `${w}%`, background: 'rgba(139,92,246,0.12)' }}
            />
          ))}
          <p className="text-sm text-violet-400 dark:text-violet-500 text-center mt-3">Analysing your week…</p>
        </div>
      )}

      {error && !loading && (
        <div
          className="flex items-start gap-2 text-sm px-3.5 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)' }}
        >
          <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      {insight && !loading && (
        <div
          className="rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line"
          style={{
            background: 'rgba(139,92,246,0.07)',
            border: '1px solid rgba(139,92,246,0.16)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {insight}
        </div>
      )}
    </div>
  )
}