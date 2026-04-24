import { useState, useEffect } from 'react'
import { ventasService, creditosService } from '../../../services/api'

export default function ModalPago({ total, carrito, onExito, onCerrar }) {
  const [formasPago,       setFormasPago]       = useState([])
  const [formaPagoId,      setFormaPagoId]      = useState(null)
  const [formaPago,        setFormaPago]         = useState(null)
  const [montoPagado,      setMontoPagado]      = useState('')
  const [procesando,       setProcesando]        = useState(false)
  const [error,            setError]             = useState('')
  const [esCredito,        setEsCredito]         = useState(false)
  const [clienteNombre,    setClienteNombre]     = useState('')
  const [clienteTelefono,  setClienteTelefono]   = useState('')

  useEffect(() => {
    ventasService.formasPago().then(({ data }) => {
      setFormasPago(data)
      if (data.length > 0) {
        setFormaPagoId(data[0].id)
        setFormaPago(data[0])
      }
    })
    setMontoPagado(total.toString())
  }, [total])

  const esEfectivo = formaPago?.nombre?.toLowerCase().includes('efectivo')

  const monto  = parseFloat(montoPagado) || 0
  const cambio = esEfectivo ? monto - total : 0
  const valido = esCredito
    ? clienteNombre.trim().length > 0
    : formaPagoId && (esEfectivo ? monto >= total : true)

  const seleccionarForma = (fp) => {
    setFormaPagoId(fp.id)
    setFormaPago(fp)
    setEsCredito(false)
    if (!fp.nombre?.toLowerCase().includes('efectivo')) {
      setMontoPagado(total.toString())
    }
  }

  const seleccionarCredito = () => {
    setEsCredito(true)
    setFormaPagoId(null)
    setFormaPago(null)
  }

  const procesar = async () => {
    if (!valido) return
    setProcesando(true)
    setError('')

    try {
      if (esCredito) {
        // ── Procesar como crédito ──────────────────────
        // 1. Primero crear la venta con forma de pago especial
        const payload = {
          detalle: carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad:    item.cantidad,
            descuento:   item.descuento || 0,
          })),
          pagos: [{
            forma_pago_id: formasPago[0]?.id, // temporal
            monto:         total,
          }],
        }
        const { data: ventaData } = await ventasService.procesar(payload)

        // 2. Crear el crédito asociado a la venta
        await creditosService.crear({
          cliente_nombre:   clienteNombre.trim(),
          cliente_telefono: clienteTelefono.trim(),
          total_deuda:      total,
          venta_id:         ventaData.venta.id,
          notas:            `Venta #${ventaData.venta.id}`,
        })

        onExito(ventaData, 0)

      } else {
        // ── Procesar pago normal ───────────────────────
        const payload = {
          detalle: carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad:    item.cantidad,
            descuento:   item.descuento || 0,
          })),
          pagos: [{
            forma_pago_id: formaPagoId,
            monto:         total,
          }],
        }
        const { data } = await ventasService.procesar(payload)

        // Abrir cajón si es efectivo
        if (esEfectivo) {
          try {
            await fetch('http://localhost:8765/abrir-cajon', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            })
          } catch {
            console.warn('CajonPOS no disponible')
          }
        }

        onExito(data, cambio)
      }

    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.detalle
        || err.response?.data?.detail
        || JSON.stringify(err.response?.data)
        || 'Error al procesar la venta'
      setError(msg)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-md animate-fade-in"
           style={{ boxShadow: '0 32px 80px rgba(124,58,237,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Procesar Pago
          </h2>
          <button onClick={onCerrar}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6"  y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Total */}
        <div className="text-center py-4 mb-6 rounded-2xl"
             style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.6)' }}>
            TOTAL A COBRAR
          </p>
          <p className="text-4xl font-black gradient-text"
             style={{ fontFamily: 'Syne, sans-serif' }}>
            ${total.toLocaleString('es-CO')}
          </p>
        </div>

        {/* Forma de pago */}
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2 tracking-widest uppercase"
             style={{ color: 'rgba(196,181,253,0.6)' }}>
            Forma de Pago
          </p>
          <div className="grid grid-cols-2 gap-2">
            {formasPago.map(fp => (
              <button
                key={fp.id}
                onClick={() => seleccionarForma(fp)}
                className="py-3 px-4 rounded-xl text-sm font-semibold transition-all"
                style={!esCredito && formaPagoId === fp.id ? {
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                } : {
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  color: 'rgba(196,181,253,0.7)',
                }}>
                {fp.nombre}
              </button>
            ))}

            {/* Botón Crédito */}
            <button
              onClick={seleccionarCredito}
              className="py-3 px-4 rounded-xl text-sm font-semibold transition-all"
              style={esCredito ? {
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
              } : {
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                color: 'rgba(245,158,11,0.7)',
              }}>
              📋 A Crédito
            </button>
          </div>
        </div>

        {/* Campos crédito */}
        {esCredito && (
          <div className="space-y-3 mb-4 p-4 rounded-2xl"
               style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p className="text-xs font-bold uppercase tracking-wider"
               style={{ color: '#f59e0b' }}>
              Datos del cliente
            </p>
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.6)' }}>
                Nombre *
              </p>
              <input
                type="text"
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
                placeholder="Nombre del cliente"
                className="input-pos w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.6)' }}>
                Teléfono (opcional)
              </p>
              <input
                type="text"
                value={clienteTelefono}
                onChange={e => setClienteTelefono(e.target.value)}
                placeholder="Teléfono del cliente"
                className="input-pos w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                 style={{ background: 'rgba(245,158,11,0.1)' }}>
              <span className="text-xs" style={{ color: 'rgba(196,181,253,0.6)' }}>
                Deuda a registrar
              </span>
              <span className="text-sm font-black" style={{ color: '#f59e0b' }}>
                ${total.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        )}

        {/* Monto recibido — solo efectivo */}
        {esEfectivo && !esCredito && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2 tracking-widest uppercase"
               style={{ color: 'rgba(196,181,253,0.6)' }}>
              Monto Recibido
            </p>
            <input
              type="number"
              value={montoPagado}
              onChange={e => setMontoPagado(e.target.value)}
              className="input-pos w-full px-4 py-3.5 rounded-xl text-lg font-bold text-center"
              min={total}
            />
          </div>
        )}

        {/* Devolución — solo efectivo */}
        {esEfectivo && !esCredito && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
               style={{
                 background: cambio > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(139,92,246,0.06)',
                 border: `1px solid ${cambio > 0 ? 'rgba(74,222,128,0.2)' : 'rgba(139,92,246,0.1)'}`,
               }}>
            <span className="text-sm font-semibold"
                  style={{ color: cambio > 0 ? '#4ade80' : 'rgba(196,181,253,0.4)' }}>
              Devolución
            </span>
            <span className="text-xl font-black"
                  style={{ color: cambio > 0 ? '#4ade80' : 'rgba(196,181,253,0.3)', fontFamily: 'Syne, sans-serif' }}>
              ${cambio > 0 ? cambio.toLocaleString('es-CO') : '0'}
            </span>
          </div>
        )}

        {/* Aviso pago digital */}
        {!esEfectivo && !esCredito && formaPago && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
               style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <span style={{ color: '#06b6d4' }}>💳</span>
            <span className="text-sm" style={{ color: 'rgba(196,181,253,0.7)' }}>
              Pago exacto por <strong style={{ color: '#06b6d4' }}>{formaPago.nombre}</strong> — no requiere devolución
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl mb-4 text-sm"
               style={{
                 background: 'rgba(239,68,68,0.1)',
                 border: '1px solid rgba(239,68,68,0.3)',
                 color: '#fca5a5',
               }}>
            {error}
          </div>
        )}

        {/* Botón cobrar */}
        <button
          onClick={procesar}
          disabled={!valido || procesando}
          className="w-full py-4 rounded-xl font-black text-white text-lg tracking-wide
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{
            fontFamily: 'Syne, sans-serif',
            background: esCredito
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #7c3aed, #a855f7)',
          }}>
          {procesando ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Procesando...
            </span>
          ) : esCredito ? (
            <span className="flex items-center justify-center gap-2">
              📋 Registrar Crédito ${total.toLocaleString('es-CO')}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Cobrar ${total.toLocaleString('es-CO')}
            </span>
          )}
        </button>

      </div>
    </div>
  )
}