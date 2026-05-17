import { useState, useEffect, useCallback } from 'react'

const KEY = 'ht_offline_queue'

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}
const persist = (q) => localStorage.setItem(KEY, JSON.stringify(q))

export function useOfflineQueue({ onSync } = {}) {
  const [queue,   setQueue]   = useState(load)
  const [syncing, setSyncing] = useState(false)

  const enqueue = useCallback((payload, type = 'create', logId = null) => {
    const item = { id: Date.now(), type, payload, logId }
    setQueue((prev) => {
      const next = [...prev, item]
      persist(next)
      return next
    })
    return item
  }, [])

  const sync = useCallback(async () => {
    const current = load()
    if (!current.length || syncing) return
    setSyncing(true)
    const { logsApi } = await import('../api/healthApi')
    const failed = []
    for (const item of current) {
      try {
        if      (item.type === 'create') await logsApi.create(item.payload)
        else if (item.type === 'update') await logsApi.update(item.logId, item.payload)
        else if (item.type === 'delete') await logsApi.delete(item.logId)
      } catch {
        failed.push(item)
      }
    }
    persist(failed)
    setQueue(failed)
    setSyncing(false)
    if (failed.length < current.length) onSync?.()
  }, [syncing, onSync])

  // Auto-sync when network comes back
  useEffect(() => {
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [sync])

  return { queue, queueLength: queue.length, enqueue, sync, syncing }
}