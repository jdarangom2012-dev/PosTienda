// ============================================================
// PRODUCTOS — CRUD CATÁLOGO — PosFácil
// ============================================================
// Archivos a crear:
//
//  src/pages/Productos/Productos.jsx
//  src/pages/Productos/components/ModalProducto.jsx
//  src/pages/Productos/components/TarjetaProducto.jsx
// ============================================================


// ============================================================
// 1. src/pages/Productos/components/TarjetaProducto.jsx
// ============================================================
export default function TarjetaProducto({ producto, onEditar, onEliminar }) {
  const stock     = producto.stock_actual ?? 0
  const bajo      = stock <= (producto.stock_minimo ?? 0)
  const agotado   = stock === 0

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200
                    hover:scale-[1.02] hover:shadow-lg group"
         style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="#8b5cf6" strokeWidth="2">
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEditar(producto)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => onEliminar(producto)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="font-bold text-white text-sm leading-tight mb-1"
           style={{ fontFamily: 'Syne, sans-serif' }}>
          {producto.nombre}
        </p>
        <p className="text-xs mb-2" style={{ color: 'rgba(196,181,253,0.5)' }}>
          {producto.categoria_nombre || 'Sin categoría'} • {producto.codigo_barras || 'Sin código'}
        </p>
      </div>

      {/* Precios */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'rgba(196,181,253,0.4)' }}>Venta</p>
          <p className="text-lg font-black gradient-text"
             style={{ fontFamily: 'Syne, sans-serif' }}>
            ${parseFloat(producto.precio_venta).toLocaleString('es-CO')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs mb-0.5" style={{ color: 'rgba(196,181,253,0.4)' }}>Costo</p>
          <p className="text-sm font-semibold" style={{ color: 'rgba(196,181,253,0.6)' }}>
            ${parseFloat(producto.precio_costo).toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Stock badge */}
      <div className="flex items-center justify-between pt-2"
           style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <span className="text-xs px-2 py-1 rounded-lg font-medium"
              style={{
                background: agotado
                  ? 'rgba(239,68,68,0.15)'
                  : bajo
                    ? 'rgba(251,191,36,0.15)'
                    : 'rgba(74,222,128,0.12)',
                color: agotado ? '#f87171' : bajo ? '#fbbf24' : '#4ade80',
              }}>
          {agotado ? '⚠ Agotado' : bajo ? `⚡ Stock bajo: ${stock}` : `✓ Stock: ${stock}`}
        </span>
        <span className="text-xs px-2 py-1 rounded-lg"
              style={{
                background: producto.activo ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                color: producto.activo ? '#4ade80' : '#f87171',
              }}>
          {producto.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
  )
}

