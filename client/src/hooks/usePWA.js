import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled,   setIsInstalled]   = useState(false)
  const [isOnline,      setIsOnline]      = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  const {
    needRefresh:   [needRefresh,  setNeedRefresh],
    offlineReady:  [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Quietly check for updates every hour
      if (r) setInterval(() => r.update(), 60 * 60 * 1000)
    },
    onRegisterError(err) {
      console.warn('SW registration error:', err)
    },
  })

  useEffect(() => {
    // Capture the native install prompt so we can show it on our own terms
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // Detect standalone mode (already installed)
    const mq = window.matchMedia('(display-mode: standalone)')
    const updateInstalled = (e) => setIsInstalled(e.matches)
    setIsInstalled(mq.matches || Boolean(window.navigator.standalone))
    mq.addEventListener('change', updateInstalled)

    // Network status
    const goOnline  = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      mq.removeEventListener('change', updateInstalled)
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return false
    const { outcome } = await installPrompt.prompt()
    if (outcome === 'accepted') setInstallPrompt(null)
    return outcome === 'accepted'
  }

  const dismissUpdate      = () => setNeedRefresh(false)
  const dismissOfflineReady = () => setOfflineReady(false)

  return {
    installPrompt,
    isInstalled,
    install,
    isOnline,
    needRefresh,
    offlineReady,
    updateServiceWorker,
    dismissUpdate,
    dismissOfflineReady,
  }
}