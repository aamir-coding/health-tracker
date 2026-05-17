import { useState, useEffect } from 'react'
import {
  WifiOff, RefreshCw, X, CheckCircle,
  Smartphone, CloudOff,
} from 'lucide-react'
import { usePWA }           from '../hooks/usePWA'
import { useOfflineQueue }  from '../hooks/useOfflineQueue'

const DISMISS_KEY = 'ht_install_dismissed'

/* ── Offline bar ─────────────────────────────────────────────── */
function OfflineBar({ queueLength }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium"
      style={{
        background: 'rgba(180,117,0,0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 2px 16px rgba(245,158,11,0.5)',
      }}
    >
      <WifiOff size={14} className="text-amber-100" />
      <span className="text-amber-100">
        You're offline
        {queueLength > 0 && (
          <> — <strong>{queueLength}</strong> log{queueLength !== 1 ? 's' : ''} queued to sync</>
        )}
      </span>
    </div>
  )
}

/* ── Update banner ───────────────────────────────────────────── */
function UpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div
      role="dialog"
      aria-label="App update available"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[190] flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: 'rgba(14,8,38,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(99,102,241,0.38)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.15)',
        width: 'min(380px, calc(100vw - 2rem))',
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background:'rgba(99,102,241,0.18)', border:'1px solid rgba(99,102,241,0.3)' }}>
        <RefreshCw size={15} className="text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold">Update available</p>
        <p className="text-gray-400 text-xs mt-0.5">A new version of HealthTrack is ready</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onDismiss} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
          <X size={14} />
        </button>
        <button
          onClick={onUpdate}
          className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold"
          style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 0 10px rgba(99,102,241,0.4)' }}
        >
          Refresh
        </button>
      </div>
    </div>
  )
}

/* ── Offline-ready toast ─────────────────────────────────────── */
function OfflineReadyToast({ onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[190] flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: 'rgba(14,8,38,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(16,185,129,0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 12px rgba(16,185,129,0.15)',
        width: 'min(340px, calc(100vw - 2rem))',
      }}
    >
      <CheckCircle size={18} className="text-green-400 flex-shrink-0"
        style={{ filter:'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }} />
      <div className="flex-1">
        <p className="text-white text-xs font-semibold">Ready to work offline</p>
        <p className="text-gray-400 text-xs mt-0.5">App is cached and fully available offline</p>
      </div>
      <button onClick={onDismiss} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
        <X size={13} />
      </button>
    </div>
  )
}

/* ── Install banner ──────────────────────────────────────────── */
function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div
      role="dialog"
      aria-label="Install HealthTrack"
      className="fixed bottom-4 right-4 z-[190] p-4 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.11)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        width: 'min(300px, calc(100vw - 2rem))',
      }}
    >
      <button
        onClick={onDismiss}
        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 4px 14px rgba(99,102,241,0.45)' }}>
          <img
            src="/pwa-192x192.png"
            alt="HealthTrack"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">Install HealthTrack</p>
          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
            Add to your home screen for offline access and a native app experience
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDismiss}
          className="flex-1 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
          style={{ background:'rgba(255,255,255,0.07)' }}
        >
          Not now
        </button>
        <button
          onClick={onInstall}
          className="flex-1 py-2 rounded-xl text-xs text-white font-semibold flex items-center justify-center gap-1.5"
          style={{
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            boxShadow:'0 0 14px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.22)',
          }}
        >
          <Smartphone size={13} />
          Install
        </button>
      </div>
    </div>
  )
}

/* ── Sync-success toast ──────────────────────────────────────── */
function SyncToast({ count, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[190] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
      style={{
        background: 'rgba(14,8,38,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(16,185,129,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      <CloudOff size={14} className="text-green-400" />
      <p className="text-white text-xs">
        Synced <strong>{count}</strong> offline log{count !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

/* ── Root component ──────────────────────────────────────────── */
export default function PWABanners() {
  const {
    installPrompt, isInstalled, install,
    isOnline,
    needRefresh, offlineReady, updateServiceWorker, dismissUpdate, dismissOfflineReady,
  } = usePWA()

  const [showInstall,      setShowInstall]      = useState(false)
  const [showOfflineReady, setShowOfflineReady] = useState(false)
  const [syncCount,        setSyncCount]        = useState(0)

  const { queue, queueLength } = useOfflineQueue({
    onSync: () => {
      const prev = load()
      setSyncCount((c) => c + 1)
      setTimeout(() => setSyncCount(0), 4000)
    },
  })

  // Show install banner 30s after the prompt fires (if not dismissed before)
  useEffect(() => {
    if (!installPrompt || isInstalled) return
    if (localStorage.getItem(DISMISS_KEY)) return
    const t = setTimeout(() => setShowInstall(true), 30_000)
    return () => clearTimeout(t)
  }, [installPrompt, isInstalled])

  // Show offline-ready toast once
  useEffect(() => {
    if (offlineReady) setShowOfflineReady(true)
  }, [offlineReady])

  const handleInstall = async () => {
    const accepted = await install()
    if (accepted) setShowInstall(false)
  }

  const handleDismissInstall = () => {
    setShowInstall(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  return (
    <>
      {/* Offline bar — fixed at top, overlaps header briefly */}
      {!isOnline && <OfflineBar queueLength={queueLength} />}

      {/* Sync success */}
      {syncCount > 0 && (
        <SyncToast count={syncCount} onDismiss={() => setSyncCount(0)} />
      )}

      {/* New version ready */}
      {needRefresh && (
        <UpdateBanner
          onUpdate={() => updateServiceWorker(true)}
          onDismiss={dismissUpdate}
        />
      )}

      {/* App cached for offline */}
      {showOfflineReady && !needRefresh && (
        <OfflineReadyToast
          onDismiss={() => { setShowOfflineReady(false); dismissOfflineReady() }}
        />
      )}

      {/* Install prompt */}
      {showInstall && !needRefresh && (
        <InstallBanner onInstall={handleInstall} onDismiss={handleDismissInstall} />
      )}
    </>
  )
}

// small helper used in SyncToast
function load() {
  try { return JSON.parse(localStorage.getItem('ht_offline_queue') || '[]') }
  catch { return [] }
}