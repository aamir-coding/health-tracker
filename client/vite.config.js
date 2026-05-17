import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,

      manifest: {
        name: 'HealthTrack — Daily Health Tracker',
        short_name: 'HealthTrack',
        description:
          'Track your daily health metrics, build streaks, get AI-powered insights, and stay on top of your wellbeing.',
        theme_color: '#4f46e5',
        background_color: '#0c0a1e',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?utm_source=pwa',
        lang: 'en',
        categories: ['health', 'fitness', 'lifestyle'],

        icons: [
          { src: 'pwa-64x64.png',           sizes: '64x64',   type: 'image/png'                  },
          { src: 'pwa-192x192.png',          sizes: '192x192', type: 'image/png'                  },
          { src: 'pwa-512x512.png',          sizes: '512x512', type: 'image/png', purpose: 'any'  },
          { src: 'maskable-icon-512x512.png',sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
        ],

        shortcuts: [
          {
            name: 'Log Today',
            short_name: 'Log',
            description: 'Add a new health log entry',
            url: '/log?utm_source=shortcut',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View your health dashboard',
            url: '/?utm_source=shortcut',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'History',
            short_name: 'History',
            description: 'View your log history',
            url: '/history?utm_source=shortcut',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        importScripts: ['/sw-custom.js'],
        skipWaiting: false,
        clientsClaim: true,
        runtimeCaching: [
          // App shell — network first, fall back to cache
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-v1',
              networkTimeoutSeconds: 5,
              plugins: [{ cacheWillUpdate: async () => null }],
            },
          },
          // API calls — network first, serve stale on failure
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-v1',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          // Static JS/CSS — stale while revalidate
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-v1',
              expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          // Images — cache first
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-v1',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          // Fonts — cache first
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-v1',
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],

  server: {
    proxy: {
      '/api':      { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io':{ target: 'http://localhost:5000', ws: true },
    },
  },
})