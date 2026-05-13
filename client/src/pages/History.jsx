import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit2, Trash2, ChevronLeft, ChevronRight, SquarePen } from 'lucide-react'
import { logsApi } from '../api/healthApi'
import { useSocket } from '../hooks/useSocket'
import Layout from '../components/Layout'

const MOOD_EMOJI = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }

const fmtDate = d => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

function RowSkeleton() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export default function History() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const pageRef = useRef(page)

  useEffect(() => { pageRef.current = page }, [page])

  const fetchLogs = useCallback(async (p) => {
    setLoading(true)
    try {
      const { data } = await logsApi.getAll({ page: p, limit: 10 })
      setLogs(data.logs || [])
      setTotal(data.total)
      setPages(data.pages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs(page) }, [page, fetchLogs])
  const refresh = useCallback(() => fetchLogs(pageRef.current), [fetchLogs])
  useSocket({ onLogNew: refresh, onLogUpdated: refresh, onLogDeleted: refresh })

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this log? This cannot be undone.')) return
    setDeletingId(id)
    try { await logsApi.delete(id); fetchLogs(page) }
    catch { alert('Failed to delete. Please try again.') }
    finally { setDeletingId(null) }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">History</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">{total} log{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => navigate('/log')} className="btn-primary gap-2">
          <SquarePen size={15} />Add log
        </button>
      </div>

      {!loading && logs.length === 0 && (
        <div className="card p-12 text-center border-dashed">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No logs yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-4">Your health log entries will appear here</p>
          <button onClick={() => navigate('/log')} className="btn-primary gap-2"><SquarePen size={15} />Log now</button>
        </div>
      )}

      {(loading || logs.length > 0) && (
        <div className="card overflow-hidden hidden sm:block mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50">
                {['Date', 'Steps', 'Sleep', 'Water', 'Weight', 'Mood', ''].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider ${h === 'Date' || h === '' ? 'text-left' : h === 'Mood' ? 'text-center' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => <RowSkeleton key={i} />) : logs.map((log, i) => (
                <tr key={log._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${i < logs.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}>
                  <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{fmtDate(log.date)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {log.steps != null ? <span className="text-gray-700 dark:text-gray-300">{log.steps.toLocaleString()}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {log.sleepHours != null ? <span className="text-gray-700 dark:text-gray-300">{log.sleepHours}h</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {log.waterMl != null ? <span className="text-gray-700 dark:text-gray-300">{log.waterMl}ml</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {log.weight != null ? <span className="text-gray-700 dark:text-gray-300">{log.weight}kg</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center text-base">
                    {log.mood != null ? MOOD_EMOJI[log.mood] : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => navigate('/log', { state: { log } })} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(log._id)} disabled={deletingId === log._id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="sm:hidden space-y-2 mb-4">
          {logs.map(log => (
            <div key={log._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{fmtDate(log.date)}</span>
                <div className="flex gap-1">
                  <button onClick={() => navigate('/log', { state: { log } })} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-500"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(log._id)} disabled={deletingId === log._id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 disabled:opacity-40"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                {log.steps != null && <span>🚶 <span className="tabular-nums">{log.steps.toLocaleString()}</span> steps</span>}
                {log.sleepHours != null && <span>🌙 <span className="tabular-nums">{log.sleepHours}</span>h</span>}
                {log.waterMl != null && <span>💧 <span className="tabular-nums">{log.waterMl}</span>ml</span>}
                {log.weight != null && <span>⚖️ <span className="tabular-nums">{log.weight}</span>kg</span>}
                {log.mood != null && <span>{MOOD_EMOJI[log.mood]} Mood {log.mood}/5</span>}
              </div>
              {log.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic border-t border-gray-50 dark:border-gray-800 pt-2">"{log.notes}"</p>}
            </div>
          ))}
        </div>
      )}

      {pages > 1 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400 dark:text-gray-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary gap-1 py-1.5 px-3">
              <ChevronLeft size={15} />Prev
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary gap-1 py-1.5 px-3">
              Next<ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}