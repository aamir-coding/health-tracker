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
      setError('Could not load insight. Check your Gemini API key in the server .env file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">AI weekly insight</h2>
            <p className="text-xs text-gray-400">Powered by Gemini</p>
          </div>
        </div>
        {loaded && (
          <button
            onClick={() => fetch(true)}
            disabled={loading}
            title="Refresh insight"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* States */}
      {!loaded && !loading && (
        <div className="text-center py-5">
          <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
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
          <div className="h-4 bg-violet-50 rounded-full animate-pulse w-full" />
          <div className="h-4 bg-violet-50 rounded-full animate-pulse w-5/6" />
          <div className="h-4 bg-violet-50 rounded-full animate-pulse w-4/6" />
          <div className="h-4 bg-violet-50 rounded-full animate-pulse w-5/6" />
          <div className="h-4 bg-violet-50 rounded-full animate-pulse w-3/4" />
          <p className="text-xs text-violet-400 text-center mt-3">
            Analysing your week…
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {insight && !loading && (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line border border-violet-100">
          {insight}
        </div>
      )}
    </div>
  )
}