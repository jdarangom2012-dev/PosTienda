// ============================================================
// Service Worker — PosFácil
// Fase 2: Caché de app shell y productos
// ============================================================

const CACHE_NAME = 'posfacil-v1'
const CACHE_PRODUCTOS = 'posfacil-productos-v1'

// Archivos del app shell que se cachean al instalar
const APP_SHELL = [
  '/',
  '/index.html',
  '/pos',
  '/dashboard',
]

// ── Instalación ──────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Instalando...')
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando app shell')
      return cache.addAll(APP_SHELL).catch(err => {
        console.warn('[SW] Error cacheando app shell:', err)
      })
    })
  )
  self.skipWaiting()
})

// ── Activación ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activado')
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CACHE_PRODUCTOS)
          .map(k => {
            console.log('[SW] Eliminando caché viejo:', k)
            return caches.delete(k)
          })
      )
    )
  )
  self.clients.claim()
})

// ── Intercepción de requests ─────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) return

  // ── API de productos → cachear para offline ──────────────
    if ((url.pathname.startsWith('/api/productos') || url.pathname.startsWith('/api/inventario')) && request.method === 'GET') {
        event.respondWith(
        fetch(request)
            .then(response => {
            if (response.ok) {
                const clone = response.clone()
                caches.open(CACHE_PRODUCTOS).then(cache => {
                cache.put(request, clone)
                console.log('[SW] Productos cacheados:', url.pathname)
                })
            }
            return response
            })
            .catch(() => {
            console.log('[SW] Offline — sirviendo productos desde caché')
            return caches.match(request).then(cached => {
                if (cached) return cached
                return new Response(JSON.stringify({ results: [], count: 0 }), {
                headers: { 'Content-Type': 'application/json' }
                })
            })
            })
        )
    return
  }

  // ── App shell → Network first, caché como fallback ───────
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // ── Assets (JS, CSS, imágenes) → Cache first ─────────────
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }
})

// ── Mensaje desde la app ─────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})