import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header  from './Header'
import { productosService } from '../../services/api'

// ── Precarga caché de productos al iniciar ───────────────────
async function precargarProductos() {
  try {
    const fechaCache = localStorage.getItem('pos_productos_cache_fecha')
    const ahora = new Date()
    
    if (fechaCache) {
      const diff = ahora - new Date(fechaCache)
      if (diff < 60 * 60 * 1000) {
        console.log('[Cache] Productos ya cacheados, saltando...')
        return
      }
    }

    console.log('[Cache] Cargando todos los productos...')
    let todos = []
    let pagina = 1
    let hayMas = true
    while (hayMas) {
      const { data } = await productosService.listar({ page_size: 100, page: pagina })
      const resultados = data.results || data
      todos = [...todos, ...resultados]
      hayMas = !!data.next
      pagina++
    }
    localStorage.setItem('pos_productos_cache', JSON.stringify(todos))
    localStorage.setItem('pos_productos_cache_fecha', ahora.toISOString())
    console.log('[Cache] Productos cacheados:', todos.length)
  } catch (err) {
    console.warn('[Cache] Error cargando productos:', err)
  }
}

// ── Sincronizar ventas offline ───────────────────────────────
async function sincronizarVentasOffline() {
  const pendientes = JSON.parse(localStorage.getItem('pos_ventas_offline') || '[]')
  if (!pendientes.length) return

  console.log('[Sync] Sincronizando', pendientes.length, 'ventas offline...')
  
  const { ventasService } = await import('../../services/api')
  const exitosas = []
  const fallidas = []

  for (const venta of pendientes) {
    try {
      const payload = {
        detalle: venta.carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad:    item.cantidad,
          descuento:   item.descuento || 0,
          precio_unit: item.precio_unit,
        })),
        pagos: [{
          forma_pago_id: venta.formaPagoId,
          monto:         venta.total,
        }],
      }
      await ventasService.procesar(payload)
      exitosas.push(venta.id)
      console.log('[Sync] Venta sincronizada:', venta.id)
    } catch (err) {
      console.warn('[Sync] Error sincronizando venta:', venta.id, err)
      fallidas.push(venta)
    }
  }

  // Guardar solo las que fallaron
  localStorage.setItem('pos_ventas_offline', JSON.stringify(fallidas))
  
  if (exitosas.length > 0) {
    console.log('[Sync] Sincronizadas:', exitosas.length, 'ventas')
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('ventas:sincronizadas', { 
        detail: { cantidad: exitosas.length } 
      }))
     }, 500)
  }
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    precargarProductos()

    // Sincronizar al cargar si hay ventas pendientes
    if (navigator.onLine) sincronizarVentasOffline()

    // Sincronizar automáticamente cuando vuelve el internet
    const handleOnline = () => {
      console.log('[Sync] Conexión restaurada, sincronizando...')
      sincronizarVentasOffline()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])
  

  return (
    <div className="min-h-screen" style={{ background: '#0f0520' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header  sidebarCollapsed={collapsed} />
      <main
        className="transition-all duration-300 pt-16 min-h-screen"
        style={{
          marginLeft: collapsed ? '72px' : '240px',
          background: 'linear-gradient(135deg, #0f0520 0%, #1a0a2e 50%, #0d1117 100%)',
        }}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}