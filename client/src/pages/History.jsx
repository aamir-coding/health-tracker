import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Edit2, Trash2, ChevronLeft, ChevronRight, SquarePen,
  ClipboardList,
} from 'lucide-react'
import { logsApi } from '../api/healthApi'
import { useSocket } from '../hooks/useSocket'
import { MoodIcon } from '../components/GlowIcon'
import GlowIcon from '../components/GlowIcon'
import Layout from '../components/Layout'

const fmtDate = d => new Date(d).toLocaleDateString('en-US', {
  day:'numeric', month:'short', year:'numeric',
})

function RowSkeleton() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded-lg animate-pulse" style={{ background:'rgba(0,0,0,0.06)' }} />
        </td>
      ))}
    </tr>
  )
}

export default function History() {
  const navigate  = useNavigate()
  const [logs, setLogs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [pages, setPages]     = useState(1)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">History</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">{total} log{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => navigate('/log')} className="btn-primary gap-2">
          <SquarePen size={15} />Add log
        </button>
      </div>

      {/* Empty state */}
      {!loading && logs.length === 0 && (
        <div className="card p-12 text-center" style={{ border:'1px dashed rgba(99,102,241,0.22)' }}>
          <div className="flex justify-center mb-4">
            <GlowIcon icon={ClipboardList} color="indigo" size="xl" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No logs yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-4">
            Your health log entries will appear here
          </p>
          <button onClick={() => navigate('/log')} className="btn-primary gap-2">
            <SquarePen size={15} />Log now
          </button>
        </div>
      )}

      {/* Desktop table */}
      {(loading || logs.length > 0) && (
        <div className="card overflow-hidden hidden sm:block mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.15)' }}
                  className="bg-white/20 dark:bg-white/[0.03]">
                {['Date','Steps','Sleep','Water','Weight','Mood',''].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider ${
                      h === 'Date' || h === '' ? 'text-left' : h === 'Mood' ? 'text-center' : 'text-right'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => <RowSkeleton key={i} />)
                : logs.map((log, i) => (
                  <tr
                    key={log._id}
                    className="hover:bg-white/10 dark:hover:bg-white/[0.03] transition-colors"
                    style={i < logs.length - 1 ? { borderBottom:'1px solid rgba(255,255,255,0.08)' } : {}}
                  >
                    <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {fmtDate(log.date)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {log.steps != null
                        ? <span className="text-gray-700 dark:text-gray-300">{log.steps.toLocaleString()}</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {log.sleepHours != null
                        ? <span className="text-gray-700 dark:text-gray-300">{log.sleepHours}h</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {log.waterMl != null
                        ? <span className="text-gray-700 dark:text-gray-300">{log.waterMl}ml</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {log.weight != null
                        ? <span className="text-gray-700 dark:text-gray-300">{log.weight}kg</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-center">
                        {log.mood != null
                          ? <MoodIcon mood={log.mood} size="xs" />
                          : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => navigate('/log', { state: { log } })}
                          className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                          style={{ ':hover':{ background:'rgba(99,102,241,0.1)' } }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(log._id)}
                          disabled={deletingId === log._id}
                          className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && logs.length > 0 && (
        <div className="sm:hidden space-y-2 mb-4">
          {logs.map(log => (
            <div key={log._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {fmtDate(log.date)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigate('/log', { state: { log } })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(log._id)}
                    disabled={deletingId === log._id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
                {log.steps      != null && <span className="tabular-nums">{log.steps.toLocaleString()} steps</span>}
                {log.sleepHours != null && <span className="tabular-nums">{log.sleepHours}h sleep</span>}
                {log.waterMl    != null && <span className="tabular-nums">{log.waterMl}ml water</span>}
                {log.weight     != null && <span className="tabular-nums">{log.weight}kg</span>}
                {log.mood       != null && (
                  <span className="flex items-center gap-1.5">
                    <MoodIcon mood={log.mood} size="xs" />
                    Mood {log.mood}/5
                  </span>
                )}
              </div>
              {log.notes && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic pt-2"
                   style={{ borderTop:'1px solid rgba(255,255,255,0.12)' }}>
                  "{log.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400 dark:text-gray-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary gap-1 py-1.5 px-3">
              <ChevronLeft size={15} />Prev
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="btn-secondary gap-1 py-1.5 px-3">
              Next<ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}