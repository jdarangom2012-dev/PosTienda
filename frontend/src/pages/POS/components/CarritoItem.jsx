// ============================================================
// 2. src/pages/POS/components/CarritoItem.jsx
// ============================================================
export default function CarritoItem({ item, onCambiarCantidad, onEliminar }) {
  const subtotal = (item.precio_unit * item.cantidad) - item.descuento

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
         style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>

      {/* Info producto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{item.nombre}</p>
        <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
          ${parseFloat(item.precio_unit).toLocaleString('es-CO')} c/u
        </p>
      </div>

      {/* Control cantidad */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onCambiarCantidad(item.producto_id, item.cantidad - 1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center
                     transition-all hover:scale-110"
          style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="3">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <span className="w-8 text-center text-sm font-bold text-white">
          {item.cantidad}
        </span>
        <button
          onClick={() => onCambiarCantidad(item.producto_id, item.cantidad + 1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center
                     transition-all hover:scale-110"
          style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right w-20 flex-shrink-0">
        <p className="text-sm font-bold text-white">
          ${subtotal.toLocaleString('es-CO')}
        </p>
      </div>

      {/* Eliminar */}
      <button
        onClick={() => onEliminar(item.producto_id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center
                   transition-all hover:scale-110 flex-shrink-0"
        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6"  y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
