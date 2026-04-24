import { useNavigate } from 'react-router-dom'

export default function UltimasVentas({ ventas, loading }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl animate-pulse"
               style={{ background: 'rgba(139,92,246,0.05)' }} />
        ))}
      </div>
    )
  }

  if (!ventas || ventas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <p className="text-sm" style={{ color: 'rgba(196,181,253,0.4)' }}>
          No hay ventas registradas hoy
        </p>
      </div>
    )
  }

  // Genera resumen de productos de la venta
  const resumenProductos = (venta) => {
    if (!venta.detalle || venta.detalle.length === 0) return 'Sin detalle'
    const nombres = venta.detalle.map(d => d.producto_nombre || d.nombre)
    if (nombres.length <= 2) return nombres.join(', ')
    return `${nombres.slice(0, 2).join(', ')} +${nombres.length - 2} más`
  }

  return (
    <div className="space-y-2">
      {ventas.slice(0, 6).map((venta) => (
        <div key={venta.id}
             className="flex items-center justify-between px-3 py-2.5 rounded-xl
                        cursor-pointer transition-all duration-200 hover:scale-[1.01]"
             style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}
             onClick={() => navigate('/reportes')}>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-medium text-white">
                {resumenProductos(venta)}
              </p>
              <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                {new Date(venta.fecha_hora).toLocaleTimeString('es-CO', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-white">
              ${parseFloat(venta.total).toLocaleString('es-CO')}
            </p>
            <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: venta.estado === 'COMPLETADA'
                      ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                    color: venta.estado === 'COMPLETADA' ? '#4ade80' : '#f87171',
                  }}>
              {venta.estado}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}