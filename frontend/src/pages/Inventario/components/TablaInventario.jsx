import { useState } from 'react'

const PAGE_SIZE = 15

export default function TablaInventario({ items, onAjustar, loading }) {
  const [pagina, setPagina] = useState(1)

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl animate-pulse"
               style={{ background: 'rgba(139,92,246,0.05)' }} />
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
             style={{ background: 'rgba(139,92,246,0.08)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
               stroke="rgba(139,92,246,0.4)" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <p className="text-sm" style={{ color: 'rgba(196,181,253,0.4)' }}>
          No hay productos en inventario
        </p>
      </div>
    )
  }

  // ── Paginación ──────────────────────────────────────────
  const totalPaginas = Math.ceil(items.length / PAGE_SIZE)
  const inicio       = (pagina - 1) * PAGE_SIZE
  const itemsPagina  = items.slice(inicio, inicio + PAGE_SIZE)

  const getPaginas = () => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    if (pagina <= 4)       return [1, 2, 3, 4, 5, '...', totalPaginas]
    if (pagina >= totalPaginas - 3) return [1, '...', totalPaginas-4, totalPaginas-3, totalPaginas-2, totalPaginas-1, totalPaginas]
    return [1, '...', pagina-1, pagina, pagina+1, '...', totalPaginas]
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
              {['Producto', 'Categoría', 'Stock actual', 'Stock mínimo', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase"
                    style={{ color: 'rgba(196,181,253,0.4)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itemsPagina.map((item) => {
              const stock   = parseFloat(item.cantidad_actual) || 0
              const minimo  = parseFloat(item.stock_minimo)    || 0
              const pct     = minimo > 0 ? Math.min((stock / minimo) * 100, 100) : 100
              const agotado = stock === 0
              const bajo    = stock > 0 && stock <= minimo

              return (
                <tr key={item.id}
                    className="transition-all duration-150 hover:bg-purple-900/10"
                    style={{ borderBottom: '1px solid rgba(139,92,246,0.06)' }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">{item.producto_nombre}</p>
                    <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                      {item.codigo_barras || 'Sin código'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                      {item.categoria_nombre || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-white w-12"
                            style={{ fontFamily: 'Syne, sans-serif' }}>
                        {stock}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden w-20"
                           style={{ background: 'rgba(139,92,246,0.1)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                             style={{
                               width: `${pct}%`,
                               background: agotado
                                 ? '#ef4444'
                                 : bajo
                                   ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                   : 'linear-gradient(90deg, #7c3aed, #4ade80)',
                             }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>
                      {minimo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-lg font-medium"
                          style={{
                            background: agotado
                              ? 'rgba(239,68,68,0.15)'
                              : bajo
                                ? 'rgba(251,191,36,0.15)'
                                : 'rgba(74,222,128,0.12)',
                            color: agotado ? '#f87171' : bajo ? '#fbbf24' : '#4ade80',
                          }}>
                      {agotado ? '⚠ Agotado' : bajo ? '⚡ Stock bajo' : '✓ Normal'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onAjustar(item)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:scale-105"
                      style={{
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        color: '#a78bfa',
                      }}>
                      Ajustar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center mt-4 px-2 gap-8">


          <div className="flex items-center gap-1">

            {/* Anterior */}
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.15)',
                color: pagina === 1 ? 'rgba(196,181,253,0.2)' : '#a78bfa',
                cursor: pagina === 1 ? 'not-allowed' : 'pointer',
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            {/* Números */}
            {getPaginas().map((p, i) =>
              p === '...'
                ? (
                  <span key={`ellipsis-${i}`}
                        className="w-8 h-8 flex items-center justify-center text-xs"
                        style={{ color: 'rgba(196,181,253,0.3)' }}>
                    ···
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                    style={pagina === p ? {
                      background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                      color: '#fff',
                      boxShadow: '0 0 12px rgba(139,92,246,0.4)',
                    } : {
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.15)',
                      color: '#a78bfa',
                    }}>
                    {p}
                  </button>
                )
            )}

            {/* Siguiente */}
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.15)',
                color: pagina === totalPaginas ? 'rgba(196,181,253,0.2)' : '#a78bfa',
                cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

          </div>
        </div>
      )}
    </div>
  )
}