/// <reference lib="webworker" />

import { ExpirationPlugin } from 'workbox-expiration'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

type PushPayload = {
  title?: string
  body?: string
  url?: string
  tag?: string
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    (request.destination === 'script' || request.destination === 'style'),
  new CacheFirst({
    cacheName: 'lazy-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
)

registerRoute(({ url }) => url.hostname.endsWith('.supabase.co'), new NetworkOnly())

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})

self.addEventListener('push', (event) => {
  let payload: PushPayload = {}
  try {
    payload = event.data?.json() as PushPayload
  } catch {
    payload.body = event.data?.text()
  }

  const options: NotificationOptions = {
    body: payload.body || 'Bạn đã ghi lại thu chi hôm nay chưa?',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: payload.tag || 'vi-nho-reminder',
    data: { url: payload.url || '/?tab=transactions&new=1' },
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Ví Nhỏ', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = new URL(
    (event.notification.data as { url?: string } | undefined)?.url || '/',
    self.location.origin,
  ).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        const windowClient = client as WindowClient
        if (new URL(windowClient.url).origin === self.location.origin) {
          await windowClient.navigate(targetUrl)
          return windowClient.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
