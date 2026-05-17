// Notification click — open/focus the right page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  const action = event.action

  if (action === 'dismiss') return

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        if (clients.openWindow) return clients.openWindow(url)
      })
  )
})

// Main thread → SW bridge for showing notifications
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, url } = event.data
    event.waitUntil(
      self.registration.showNotification(title || 'HealthTrack', {
        body: body || 'Time to log your health data!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        tag: 'daily-reminder',
        renotify: true,
        data: { url: url || '/log' },
        actions: [
          { action: 'open',    title: 'Log now'  },
          { action: 'dismiss', title: 'Dismiss'  },
        ],
      })
    )
  }
})

// Server push (future-ready)
self.addEventListener('push', (event) => {
  const data = event.data?.json?.() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'HealthTrack', {
      body: data.body || 'You have a new health update.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: { url: data.url || '/' },
    })
  )
})