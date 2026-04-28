// ============================================================
// 5. src/pages/POS/POS.jsx
// ============================================================
import { useState, useRef  } from 'react'
import BuscadorProducto from './components/BuscadorProducto'
import CarritoItem      from './components/CarritoItem'
import ModalPago        from './components/ModalPago'
import TicketVenta      from './components/TicketVenta'

export default function POS() {
  const [carrito,       setCarrito]       = useState([])
  const [modalPago,     setModalPago]     = useState(false)
  const [ventaExitosa,  setVentaExitosa]  = useState(null)
  const [cambio,        setCambio]        = useState(0)

  // Calculos
  const subtotal   = carrito.reduce((s, i) => s + (i.precio_unit * i.cantidad), 0)
  const descuentos = carrito.reduce((s, i) => s + i.descuento, 0)
  const total      = subtotal - descuentos
   // ── Agrega esta ref ──
  const buscadorRef = useRef(null)

  // Agregar producto al carrito
  const agregarProducto = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.producto_id === producto.id)
      if (existe) {
        return prev.map(i =>
          i.producto_id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      }
      return [...prev, {
        producto_id: producto.id,
        nombre:      producto.nombre,
        precio_unit: parseFloat(producto.precio_venta),
        cantidad:    1,
        descuento:   0,
      }]
    })
  }

  // Cambiar cantidad
  const cambiarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito(prev => prev.filter(i => i.producto_id !== productoId))
    } else {
      setCarrito(prev => prev.map(i =>
        i.producto_id === productoId ? { ...i, cantidad: nuevaCantidad } : i
      ))
    }
  }

  // Eliminar del carrito
  const eliminarItem = (productoId) => {
    setCarrito(prev => prev.filter(i => i.producto_id !== productoId))
  }

  // Venta exitosa
  const handleVentaExitosa = (data, cambioDevuelto) => {
    setVentaExitosa(data.venta)
    setCambio(cambioDevuelto)
    setModalPago(false)
    setCarrito([])
     // ── Enfocar buscador después de cobrar ──
    setTimeout(() => buscadorRef.current?.focus(), 100)
  }

  // Nueva venta
  const nuevaVenta = () => {
    setVentaExitosa(null)
    setCambio(0)
     // ── Enfocar buscador ──
    setTimeout(() => buscadorRef.current?.focus(), 100)
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-88px)]">

      {/* ── Panel izquierdo — Buscador + Carrito ── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">

        {/* Buscador */}
       <div className="glass rounded-2xl p-4" style={{ overflow: 'visible', position: 'relative', zIndex: 10 }}>
          <BuscadorProducto onAgregar={agregarProducto}
          inputRef={buscadorRef}          
        />
        </div>

        {/* Carrito */}
        <div className="glass rounded-2xl flex-1 flex flex-col overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center justify-between px-5 py-4"
               style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white"
                  style={{ fontFamily: 'Syne, sans-serif' }}>
                Carrito
              </h3>
              {carrito.length > 0 && (
                <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center
                                 justify-center text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #e879f9)' }}>
                  {carrito.length}
                </span>
              )}
            </div>
            {carrito.length > 0 && (
              <button
                onClick={() => setCarrito([])}
                className="text-xs px-3 py-1 rounded-lg transition-all"
                style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
                Limpiar
              </button>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                     style={{ background: 'rgba(139,92,246,0.08)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                       stroke="rgba(139,92,246,0.4)" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
                <p className="text-sm font-medium"
                   style={{ color: 'rgba(196,181,253,0.4)' }}>
                  Busca productos para agregar
                </p>
                <p className="text-xs text-center"
                   style={{ color: 'rgba(196,181,253,0.25)' }}>
                  Escribe el nombre o escanea el código de barras
                </p>
              </div>
            ) : (
              carrito.map(item => (
                <CarritoItem
                  key={item.producto_id}
                  item={item}
                  onCambiarCantidad={cambiarCantidad}
                  onEliminar={eliminarItem}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Panel derecho — Resumen y cobro ── */}
      <div className="w-72 flex flex-col gap-4 flex-shrink-0">

        {/* Resumen */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Resumen
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'rgba(196,181,253,0.6)' }}>
                Productos ({carrito.length})
              </span>
              <span className="text-white">
                ${subtotal.toLocaleString('es-CO')}
              </span>
            </div>
            {descuentos > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#4ade80' }}>Descuentos</span>
                <span style={{ color: '#4ade80' }}>
                  -${descuentos.toLocaleString('es-CO')}
                </span>
              </div>
            )}
            <div className="pt-3" style={{ borderTop: '1px solid rgba(139,92,246,0.15)' }}>
              <div className="flex justify-between items-center">
                <span className="text-lg font-black text-white"
                      style={{ fontFamily: 'Syne, sans-serif' }}>
                  Total
                </span>
                <span className="text-2xl font-black gradient-text"
                      style={{ fontFamily: 'Syne, sans-serif' }}>
                  ${total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón cobrar */}
        <button
          onClick={() => setModalPago(true)}
          disabled={carrito.length === 0}
          className="btn-primary py-5 rounded-2xl font-black text-white text-xl
                     tracking-wide disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all duration-300"
          style={{ fontFamily: 'Syne, sans-serif' }}>
          <span className="flex items-center justify-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Cobrar
          </span>
        </button>

        {/* Atajos de teclado */}
        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
             style={{ color: 'rgba(196,181,253,0.4)' }}>
            Atajos
          </p>
          <div className="space-y-2">
            {[
              ['Enter', 'Agregar por código'],
              ['Esc',   'Cancelar búsqueda'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold"
                      style={{
                        background: 'rgba(139,92,246,0.15)',
                        color: '#a78bfa',
                        border: '1px solid rgba(139,92,246,0.2)',
                      }}>
                  {key}
                </span>
                <span className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modales */}
      {modalPago && (
        <ModalPago
          total={total}
          carrito={carrito}
          onExito={handleVentaExitosa}
          onCerrar={() => setModalPago(false)}
        />
      )}

      {ventaExitosa && (
        <TicketVenta
          venta={ventaExitosa}
          cambio={cambio}
          onNuevaVenta={nuevaVenta}
        />
      )}
    </div>
  )
}