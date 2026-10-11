// ============================================================
// 4. src/pages/POS/components/TicketVenta.jsx
// ============================================================
import { construirRecibo, imprimirRecibo } from '../../../utils/recibo'

export default function TicketVenta({ venta, cambio, onNuevaVenta }) {
  if (!venta) return null

  const fecha = new Date(venta.fecha_hora).toLocaleString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm animate-fade-in"
           style={{ boxShadow: '0 32px 80px rgba(74,222,128,0.2)' }}>

        {/* Éxito */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
               style={{ background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.3)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="#4ade80" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            ¡Venta Exitosa!
          </h2>
          <p className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.5)' }}>
            Venta #{venta.id} • {fecha}
          </p>
        </div>

        {/* Detalle */}
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {venta.detalle?.map((item, i) => (
            <div key={i} className="flex justify-between text-xs px-3 py-2 rounded-lg"
                 style={{ background: 'rgba(139,92,246,0.06)' }}>
              <span className="text-white">{item.producto_nombre}</span>
              <span style={{ color: 'rgba(196,181,253,0.6)' }}>
                x{item.cantidad} = ${parseFloat(item.subtotal).toLocaleString('es-CO')}
              </span>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="space-y-2 py-4 mb-4"
             style={{ borderTop: '1px solid rgba(139,92,246,0.15)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'rgba(196,181,253,0.6)' }}>Subtotal</span>
            <span className="text-white">${parseFloat(venta.subtotal).toLocaleString('es-CO')}</span>
          </div>
          {parseFloat(venta.descuento) > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: '#4ade80' }}>Descuento</span>
              <span style={{ color: '#4ade80' }}>-${parseFloat(venta.descuento).toLocaleString('es-CO')}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-black">
            <span className="text-white">Total</span>
            <span className="gradient-text">${parseFloat(venta.total).toLocaleString('es-CO')}</span>
          </div>
          {cambio > 0 && (
            <div className="flex justify-between text-sm font-bold">
              <span style={{ color: '#4ade80' }}>Cambio</span>
              <span style={{ color: '#4ade80' }}>${cambio.toLocaleString('es-CO')}</span>
            </div>
          )}
        </div>

        {/* Imprimir recibo (si el cliente lo pide después) */}
        <button
          onClick={() => imprimirRecibo(construirRecibo(venta, cambio))}
          className="w-full py-3 rounded-xl font-bold text-sm mb-3"
          style={{ background: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}>
          🖨️ Imprimir recibo
        </button>

        {/* Botón nueva venta */}
        <button
          onClick={onNuevaVenta}
          className="btn-primary w-full py-4 rounded-xl font-black text-white
                     text-base tracking-wide"
          style={{ fontFamily: 'Syne, sans-serif' }}>
          <span className="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5"  y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Venta
          </span>
        </button>
      </div>
    </div>
  )
}