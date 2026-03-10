// ============================================================
// 2. src/pages/Inventario/components/TablaMovimientos.jsx
// ============================================================
export default function TablaMovimientos({ movimientos, loading }) {
  const TIPO_CONFIG = {
    ENTRADA:  { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   label: '↑ Entrada'  },
    SALIDA:   { color: '#f87171', bg: 'rgba(239,68,68,0.1)',    label: '↓ Salida'   },
    AJUSTE:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   label: '⚡ Ajuste'  },
    DEVOLUCION:{ color: '#06b6d4',bg: 'rgba(6,182,212,0.1)',    label: '↩ Devolución'},
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl animate-pulse"
               style={{ background: 'rgba(139,92,246,0.05)' }} />
        ))}
      </div>
    )
  }

  if (!movimientos || movimientos.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm" style={{ color: 'rgba(196,181,253,0.4)' }}>
          No hay movimientos registrados
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock anterior', 'Stock nuevo', 'Motivo'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase"
                  style={{ color: 'rgba(196,181,253,0.4)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => {
            const cfg = TIPO_CONFIG[m.tipo_movimiento] || TIPO_CONFIG.AJUSTE
            return (
              <tr key={m.id}
                  className="transition-all hover:bg-purple-900/10"
                  style={{ borderBottom: '1px solid rgba(139,92,246,0.06)' }}>
                <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                  {new Date(m.created_at).toLocaleString('es-CO', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-white">{m.producto_nombre}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                        style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold"
                        style={{ color: m.tipo_movimiento === 'SALIDA' ? '#f87171' : '#4ade80' }}>
                    {m.tipo_movimiento === 'SALIDA' ? '-' : '+'}{m.cantidad}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>
                  {m.stock_anterior}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-white">
                  {m.stock_nuevo}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                  {m.motivo || '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
