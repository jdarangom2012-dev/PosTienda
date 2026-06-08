import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// ── Registro del Service Worker ──────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.log('[SW] Registrado correctamente:', reg.scope)

        // Si hay una nueva versión disponible, activarla
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Nueva versión disponible')
              newWorker.postMessage('SKIP_WAITING')
            }
          })
        })
      })
      .catch(err => console.error('[SW] Error al registrar:', err))
  })
}