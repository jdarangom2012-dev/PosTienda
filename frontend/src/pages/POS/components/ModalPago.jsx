import { useState, useEffect } from 'react'
import { ventasService, creditosService, clientesService } from '../../../services/api'
import { construirRecibo, imprimirRecibo, abrirCajonLocal } from '../../../utils/recibo'

export default function ModalPago({ total, carrito, onExito, onCerrar }) {
  const [formasPago,       setFormasPago]       = useState([])
  const [formaPagoId,      setFormaPagoId]      = useState(null)
  const [formaPago,        setFormaPago]         = useState(null)
  const [montoPagado,      setMontoPagado]      = useState('')
  const [procesando,       setProcesando]        = useState(false)
  const [error,            setError]             = useState('')
  const [esCredito,        setEsCredito]         = useState(false)
  const [clienteNombre,    setClienteNombre]     = useState('')
  const [clienteApellido,    setClienteApellido]    = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [busquedaCliente,    setBusquedaCliente]    = useState('')
  const [clientesSugeridos,  setClientesSugeridos]  = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [buscandoClientes,   setBuscandoClientes]   = useState(false)
  

  useEffect(() => {
    const cargarFormasPago = async () => {
      try {
        const { data } = await ventasService.formasPago()
        setFormasPago(data)
        if (data.length > 0) {
          setFormaPagoId(data[0].id)
          setFormaPago(data[0])
        }
        // Cachear para offline
        localStorage.setItem('pos_formas_pago', JSON.stringify(data))
      } catch {
        // Offline — cargar desde caché
        const cached = localStorage.getItem('pos_formas_pago')
        if (cached) {
          const data = JSON.parse(cached)
          setFormasPago(data)
          if (data.length > 0) {
            setFormaPagoId(data[0].id)
            setFormaPago(data[0])
          }
        }
      }
    }
    cargarFormasPago()
    setMontoPagado(total.toString())
  }, [total])

  const esEfectivo = formaPago?.nombre?.toLowerCase().includes('efectivo')

  const monto  = parseFloat(montoPagado) || 0
  const cambio = esEfectivo ? monto - total : 0
  const valido = esCredito
    ? clienteSeleccionado
      ? true
      : (clienteNombre.trim().length > 0 && clienteApellido.trim().length > 0)
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

  // ── Guardar venta offline ────────────────────────────────
  const guardarVentaOffline = () => {
    const ventaOffline = {
      id:          `offline_${Date.now()}`,
      fecha:       new Date().toISOString(),
      total,
      carrito:     [...carrito],
      formaPagoId,
      formaPagoNombre: formaPago?.nombre || 'Efectivo',
      esCredito,
      clienteNombre,
      clienteTelefono,
      sincronizada: false,
    }
    const pendientes = JSON.parse(localStorage.getItem('pos_ventas_offline') || '[]')
    pendientes.push(ventaOffline)
    localStorage.setItem('pos_ventas_offline', JSON.stringify(pendientes))
    console.log('[Offline] Venta guardada localmente:', ventaOffline.id)
    return ventaOffline
  }

  const buscarClientes = async (texto) => {
    setBusquedaCliente(texto)
    setClienteSeleccionado(null)
    if (texto.length < 2) { setClientesSugeridos([]); return }
    setBuscandoClientes(true)
    try {
      const { data } = await clientesService.buscar(texto)
      setClientesSugeridos(data)
    } catch { setClientesSugeridos([]) }
    finally { setBuscandoClientes(false) }
  }

  const seleccionarClienteExistente = (cliente) => {
    const partes = cliente.cliente_nombre.split(' ')
    setClienteNombre(partes[0] || '')
    setClienteApellido(partes.slice(1).join(' ') || '')
    setClienteTelefono(cliente.cliente_telefono || '')
    setClienteSeleccionado(cliente)
    setBusquedaCliente(cliente.cliente_nombre)
    setClientesSugeridos([])
  }

  // ── Imprimir recibo (opcional) / abrir cajón ──────────────
  const [imprimir, setImprimir] = useState(() => {
    try { return localStorage.getItem('pos_imprimir_recibo') === '1' } catch { return false }
  })
  const toggleImprimir = (v) => {
    setImprimir(v)
    try { localStorage.setItem('pos_imprimir_recibo', v ? '1' : '0') } catch {}
  }

  // Si se imprime, el driver ya abre el cajón; si no, se abre aparte (solo efectivo).
  const postVenta = async (ventaObj, cambioV) => {
    if (imprimir) {
      await imprimirRecibo(construirRecibo(ventaObj, cambioV))
    } else if (esEfectivo) {
      await abrirCajonLocal()
    }
  }

  const procesar = async () => {
    if (!valido) return
    setProcesando(true)
    setError('')

    // ── Modo offline ────────────────────────────────────────
    if (!navigator.onLine) {
      const ventaOffline = guardarVentaOffline()
      // Simular respuesta exitosa para el ticket
       const dataOffline = {
        venta: {
          id:         ventaOffline.id,
          fecha_hora: ventaOffline.fecha,
          total:      total.toString(),
          subtotal:   total.toString(),
          descuento:  '0',
          estado:     'PENDIENTE_SYNC',
          cajero:     'offline',
          detalle:    carrito.map(item => ({
            producto_nombre: item.nombre,
            cantidad:        item.cantidad.toString(),
            precio_unit:     item.precio_unit.toString(),
            subtotal:        (item.precio_unit * item.cantidad).toString(),
          })),
          pagos: [{
            forma_pago_nombre: formaPago?.nombre || 'Efectivo',
            monto:             total.toString(),
          }],
        }
      }
      await postVenta(dataOffline.venta, cambio)
      onExito(dataOffline, cambio)
      setProcesando(false)
      return
    }

    try {
      if (esCredito) {
        const payload = {
          detalle: carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad:    item.cantidad,
            descuento:   item.descuento || 0,
            precio_unit: item.precio_unit,
          })),
          pagos: [{
            forma_pago_id: 4,   // FormaPago "Crédito" — siempre ID=4
            monto:         total,
          }],
        }
        const { data: ventaData } = await ventasService.procesar(payload)
        await creditosService.crear({
        cliente_nombre: clienteSeleccionado
          ? clienteSeleccionado.cliente_nombre
          : `${clienteNombre.trim()} ${clienteApellido.trim()}`.toUpperCase(),
        cliente_telefono: clienteTelefono.trim(),
        total_deuda: total,
        venta_id: ventaData.venta.id,
        notas: `Venta #${ventaData.venta.id}`,
      })
        if (imprimir) await postVenta(ventaData.venta, 0)
        onExito(ventaData, 0)
      } else {
        const payload = {
          detalle: carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad:    item.cantidad,
            descuento:   item.descuento || 0,
            precio_unit: item.precio_unit,
          })),
          pagos: [{
            forma_pago_id: formaPagoId,
            monto:         total,
          }],
        }
        const { data } = await ventasService.procesar(payload)
        await postVenta(data.venta, cambio)
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
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#f59e0b' }}>
          Datos del cliente
        </p>

        {/* Buscador cliente existente */}
        <div className="relative">
          <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.6)' }}>
            Buscar cliente existente
          </p>
          <input
            type="text"
            value={busquedaCliente}
            onChange={e => buscarClientes(e.target.value)}
            placeholder="Escribe el nombre..."
            className="input-pos w-full px-4 py-3 rounded-xl text-sm"
          />
          {/* Sugerencias */}
          {clientesSugeridos.length > 0 && (
            <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
                style={{ background: '#1e1b4b', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              {clientesSugeridos.map((c, i) => (
                <button key={i} onClick={() => seleccionarClienteExistente(c)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-yellow-500/10 transition-all"
                        style={{ borderBottom: i < clientesSugeridos.length - 1 ? '1px solid rgba(245,158,11,0.1)' : 'none' }}>
                  <p className="font-bold text-white">{c.cliente_nombre}</p>
                  <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                    {c.cliente_telefono || 'Sin teléfono'} · Saldo: ${parseFloat(c.saldo_total || 0).toLocaleString('es-CO')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cliente seleccionado */}
        {clienteSeleccionado && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div>
              <p className="text-xs font-bold text-white">{clienteSeleccionado.cliente_nombre}</p>
              <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                Saldo actual: ${parseFloat(clienteSeleccionado.saldo_total || 0).toLocaleString('es-CO')}
              </p>
            </div>
            <button onClick={() => {
              setClienteSeleccionado(null)
              setBusquedaCliente('')
              setClienteNombre('')
              setClienteApellido('')
              setClienteTelefono('')
            }} className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
              ✕
            </button>
          </div>
        )}

        {/* Separador */}
        {!clienteSeleccionado && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.2)' }} />
            <span className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>o nuevo cliente</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.2)' }} />
          </div>
        )}

        {/* Campos manuales — solo si no hay cliente seleccionado */}
        {!clienteSeleccionado && (
          <>
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.6)' }}>Nombre *</p>
              <input type="text" value={clienteNombre}
                    onChange={e => setClienteNombre(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.6)' }}>Apellido *</p>
              <input type="text" value={clienteApellido}
                    onChange={e => setClienteApellido(e.target.value)}
                    placeholder="Apellido del cliente"
                    className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.6)' }}>Teléfono (opcional)</p>
              <input type="text" value={clienteTelefono}
                    onChange={e => setClienteTelefono(e.target.value)}
                    placeholder="Teléfono del cliente"
                    className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
          </>
        )}

        <div className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.1)' }}>
          <span className="text-xs" style={{ color: 'rgba(196,181,253,0.6)' }}>Deuda a registrar</span>
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

        {/* Imprimir recibo (opcional) */}
        <label className="flex items-center gap-3 mb-4 cursor-pointer select-none px-4 py-3 rounded-xl"
               style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <input type="checkbox" checked={imprimir}
                 onChange={e => toggleImprimir(e.target.checked)}
                 className="w-5 h-5 accent-purple-500" />
          <span className="text-sm font-semibold text-white">🖨️ Imprimir recibo</span>
          <span className="text-xs ml-auto" style={{ color: 'rgba(196,181,253,0.5)' }}>
            {imprimir ? 'Imprime y abre el cajón' : 'Solo abre el cajón'}
          </span>
        </label>

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