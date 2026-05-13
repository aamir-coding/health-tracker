import { useState } from 'react'
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { insightsApi } from '../api/healthApi'

export default function InsightCard() {
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const fetch = async (refresh = false) => {
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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI weekly insight</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Powered by Groq</p>
          </div>
        </div>
        {loaded && (
          <button onClick={() => fetch(true)} disabled={loading} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {!loaded && !loading && (
        <div className="text-center py-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
            Get 3 personalised, actionable tips based on your week's data.
          </p>
          <button onClick={() => fetch(false)} className="btn-primary gap-2">
            <Sparkles size={15} />
            Generate my insight
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-2.5 py-2">
          {[100, 83, 66, 83, 75].map((w, i) => (
            <div key={i} className={`h-4 bg-violet-50 dark:bg-violet-900/20 rounded-full animate-pulse`} style={{ width: `${w}%` }} />
          ))}
          <p className="text-xs text-violet-400 dark:text-violet-500 text-center mt-3">Analysing your week…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {insight && !loading && (
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line border border-violet-100 dark:border-violet-800">
          {insight}
        </div>
      )}
    </div>
  )
}