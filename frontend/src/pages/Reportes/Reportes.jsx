import { useState, useEffect } from 'react'
import { iaService, ventasService, inventarioService, productosService } from '../../services/api'
import GraficaVentas from './components/GraficaVentas'


// ── Iconos ──────────────────────────────────────────────────
const IconIA    = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor" opacity=".3"/></svg>
const IconLock  = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IconSend  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const IconBot   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/></svg>
const IconUser  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
const IconClock = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

// ── Chatbot ──────────────────────────────────────────────────
function EstadoBasicIA() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
           style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(139,92,246,0.4)' }}>
        <IconLock />
      </div>
      <div>
        <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          IA no disponible en tu plan
        </h3>
        <p className="text-sm max-w-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
          Tu plan actual <span className="font-bold" style={{ color: '#a78bfa' }}>BASIC</span> no
          tiene habilitada la inteligencia artificial. Actualiza a{' '}
          <span className="font-bold" style={{ color: '#f59e0b' }}>Premium</span> para acceder.
        </p>
      </div>
      <div className="glass rounded-2xl p-5 max-w-sm w-full text-left space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(196,181,253,0.4)' }}>
          Con Premium obtienes
        </p>
        {[
          'Asistente IA para consultas de ventas',
          'Predicciones de stock con Prophet',
          '50 consultas mensuales incluidas',
          'Reportes inteligentes automáticos',
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(196,181,253,0.7)' }}>
            <span style={{ color: '#f59e0b' }}>✦</span> {item}
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: 'rgba(196,181,253,0.3)' }}>
        Contacta al administrador para actualizar tu plan
      </p>
    </div>
  )
}

function EstadoAgotado({ resetFecha }) {
  const fecha = resetFecha
    ? new Date(resetFecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'el próximo mes'
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
           style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.5)' }}>
        <IconClock />
      </div>
      <div>
        <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          Tokens agotados
        </h3>
        <p className="text-sm max-w-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
          Consumiste todos tus tokens este mes. Podrás volver a usar la IA el{' '}
          <span className="font-bold text-white">{fecha}</span>.
        </p>
      </div>
    </div>
  )
}

function Chat({ tokensDisponibles, tokensMes }) {
  const [mensajes, setMensajes] = useState([
    { rol: 'bot', texto: '¡Hola! Soy tu asistente IA. Puedo ayudarte con consultas sobre ventas, inventario y reportes. ¿En qué te puedo ayudar?' }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [tokens,  setTokens]  = useState(tokensDisponibles)

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || loading) return
    setMensajes(m => [...m, { rol: 'user', texto }])
    setInput('')
    setLoading(true)
    try {
      const { data } = await iaService.chat(texto)
      setMensajes(m => [...m, { rol: 'bot', texto: data.respuesta }])
      setTokens(data.tokens_disponibles)
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al conectar con la IA.'
      setMensajes(m => [...m, { rol: 'bot', texto: `⚠️ ${msg}`, error: true }])
    } finally {
      setLoading(false)
    }
  }

  const pct = Math.round((tokens / tokensMes) * 100)

  return (
    <div className="flex flex-col gap-4">
      <div className="glass rounded-2xl p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'rgba(196,181,253,0.5)' }}>Tokens disponibles</span>
            <span className="font-bold" style={{ color: tokens > 10 ? '#a78bfa' : '#f87171' }}>
              {tokens} / {tokensMes}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{
                   width: `${pct}%`,
                   background: pct > 20 ? 'linear-gradient(90deg, #7c3aed, #a855f7)' : 'linear-gradient(90deg, #dc2626, #f87171)'
                 }} />
          </div>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-lg font-bold"
             style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
          PREMIUM
        </div>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto"
           style={{ minHeight: 320, maxHeight: 420 }}>
        {mensajes.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.rol === 'bot' && (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                <IconBot />
              </div>
            )}
            <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                 style={m.rol === 'user' ? {
                   background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                   color: 'white', borderBottomRightRadius: 4,
                 } : {
                   background: m.error ? 'rgba(239,68,68,0.08)' : 'rgba(139,92,246,0.06)',
                   color: m.error ? '#f87171' : 'rgba(226,232,240,0.9)',
                   borderBottomLeftRadius: 4,
                 }}>
              {m.texto}
            </div>
            {m.rol === 'user' && (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                <IconUser />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
              <IconBot />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(139,92,246,0.06)', borderBottomLeftRadius: 4 }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                       style={{ background: '#a78bfa', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Pregunta algo sobre tus ventas o inventario..."
          disabled={loading || tokens === 0}
          className="input-pos flex-1 px-4 py-3 rounded-xl text-sm"
        />
        <button onClick={enviar} disabled={loading || !input.trim() || tokens === 0}
                className="btn-primary px-4 py-3 rounded-xl text-white disabled:opacity-40 transition-all">
          <IconSend />
        </button>
      </div>
    </div>
  )
}

// ── Tab Reportes ─────────────────────────────────────────────
function TabReportes() {
  const [resumenHoy,    setResumenHoy]    = useState(null)
  const [resumenSemana, setResumenSemana] = useState(null)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      ventasService.resumenHoy(),
      ventasService.resumenSemana(),
    ]).then(([hoy, semana]) => {
      setResumenHoy(hoy.data)
      setResumenSemana(semana.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  )

  const fmt = (v) => `$${parseFloat(v || 0).toLocaleString('es-CO')}`

  // Formatear fechas para la gráfica
  const datosGrafica = (resumenSemana?.por_dia || []).map(d => ({
    fecha:    new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
    ingresos: d.ingresos,
    cantidad: d.cantidad,
  }))

  return (
    <div className="space-y-5">

      {/* Cards resumen hoy */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ventas hoy',      value: resumenHoy?.total_ventas     || 0,                          color: '#8b5cf6', suffix: '' },
          { label: 'Ingresos hoy',    value: fmt(resumenHoy?.total_ingresos),                            color: '#4ade80', suffix: '' },
          { label: 'Ticket promedio', value: fmt(resumenHoy?.ticket_promedio),                           color: '#06b6d4', suffix: '' },
          { label: 'Canceladas hoy',  value: resumenHoy?.total_canceladas  || 0,                         color: '#f87171', suffix: '' },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-4">
            <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.5)' }}>{card.label}</p>
            <p className="text-xl font-black" style={{ color: card.color, fontFamily: 'Syne, sans-serif' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfica ventas 7 días */}
      <div className="glass rounded-2xl p-5">
        <GraficaVentas
          datos={datosGrafica}
          titulo="Ventas últimos 7 días"
          periodo={`${resumenSemana?.desde || ''} — ${resumenSemana?.hasta || ''}`}
        />
      </div>

      {/* Top productos + Formas de pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Top productos semana */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-base font-bold text-white mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            🏆 Top productos — 7 días
          </h3>
          <div className="space-y-3">
            {(resumenSemana?.top_productos || []).map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold w-5 text-center"
                        style={{ color: i === 0 ? '#f59e0b' : 'rgba(196,181,253,0.4)' }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-white">{p.producto__nombre}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#a78bfa' }}>
                    {parseFloat(p.total_vendido)} uds
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                    {fmt(p.total_ingresos)}
                  </p>
                </div>
              </div>
            ))}
            {(!resumenSemana?.top_productos?.length) && (
              <p className="text-sm text-center py-4" style={{ color: 'rgba(196,181,253,0.4)' }}>
                Sin ventas esta semana
              </p>
            )}
          </div>
        </div>

        {/* Formas de pago */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-base font-bold text-white mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            💳 Formas de pago — 7 días
          </h3>
          <div className="space-y-3">
            {(resumenSemana?.por_forma_pago || []).map((p, i) => {
              const total7 = resumenSemana?.total_ingresos || 1
              const pct    = Math.round((p.total / total7) * 100)
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{p.forma_pago_nombre}</span>
                    <span style={{ color: '#a78bfa' }}>{fmt(p.total)} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.1)' }}>
                    <div className="h-full rounded-full"
                         style={{
                           width: `${pct}%`,
                           background: 'linear-gradient(90deg, #7c3aed, #a855f7)'
                         }} />
                  </div>
                </div>
              )
            })}
            {(!resumenSemana?.por_forma_pago?.length) && (
              <p className="text-sm text-center py-4" style={{ color: 'rgba(196,181,253,0.4)' }}>
                Sin datos de pagos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Resumen semana */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-base font-bold text-white mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
          📅 Resumen semana
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total ventas',    value: resumenSemana?.total_ventas    || 0,             color: '#8b5cf6' },
            { label: 'Total ingresos',  value: fmt(resumenSemana?.total_ingresos),              color: '#4ade80' },
            { label: 'Ticket promedio', value: fmt(resumenSemana?.ticket_promedio),             color: '#06b6d4' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black mb-1" style={{ color: s.color, fontFamily: 'Syne, sans-serif' }}>
                {s.value}
              </p>
              <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── Tab Movimientos ──────────────────────────────────────────
function TabMovimientos() {
  const [productos,    setProductos]    = useState([])
  const [movimientos,  setMovimientos]  = useState([])
  const [loading,      setLoading]      = useState(false)
  const [filtros, setFiltros] = useState({
    producto_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    tipo: '',
  })

  useEffect(() => {
    productosService.listar({ page_size: 1000 })
      .then(({ data }) => setProductos(data.results || data))
      .catch(console.error)
  }, [])

  const buscar = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtros.producto_id) params.producto_id = filtros.producto_id
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta
      if (filtros.tipo)        params.tipo        = filtros.tipo
      const { data } = await inventarioService.movimientos(params)
      setMovimientos(data.results || data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const TIPOS = {
    ENTRADA:    { label: 'Entrada',    color: '#4ade80' },
    SALIDA:     { label: 'Salida',     color: '#f87171' },
    AJUSTE_POS: { label: 'Ajuste +',  color: '#06b6d4' },
    AJUSTE_NEG: { label: 'Ajuste −',  color: '#f59e0b' },
    DEVOLUCION: { label: 'Devolución', color: '#a78bfa' },
  }

  const totalEntradas = movimientos
    .filter(m => ['ENTRADA','DEVOLUCION','AJUSTE_POS'].includes(m.tipo_movimiento))
    .reduce((s, m) => s + parseFloat(m.cantidad), 0)

  const totalSalidas = movimientos
    .filter(m => ['SALIDA','AJUSTE_NEG'].includes(m.tipo_movimiento))
    .reduce((s, m) => s + parseFloat(m.cantidad), 0)

    const exportarExcel = () => {
    if (!movimientos.length) return

    const headers = ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock anterior', 'Stock nuevo', 'Motivo', 'Usuario']
    const rows = movimientos.map(m => [
      new Date(m.created_at).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
      m.producto_nombre || m.producto,
      TIPOS[m.tipo_movimiento]?.label || m.tipo_movimiento,
      ((['SALIDA','AJUSTE_NEG'].includes(m.tipo_movimiento) ? '-' : '+') + parseFloat(m.cantidad)),
      parseFloat(m.stock_anterior),
      parseFloat(m.stock_nuevo),
      m.motivo || '',
      m.usuario_nombre || '',
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `movimientos_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(196,181,253,0.5)' }}>
          Filtros de búsqueda
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={filtros.producto_id}
            onChange={e => setFiltros(f => ({ ...f, producto_id: e.target.value }))}
            className="input-pos px-3 py-2.5 rounded-xl text-sm"
            style={{ background: '#1e1b4b', color: '#e2e8f0' }}
          >
            <option value="">Todos los productos</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          <select
            value={filtros.tipo}
            onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))}
            className="input-pos px-3 py-2.5 rounded-xl text-sm"
            style={{ background: '#1e1b4b', color: '#e2e8f0' }}
          >
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <input
            type="date" value={filtros.fecha_desde}
            onChange={e => setFiltros(f => ({ ...f, fecha_desde: e.target.value }))}
            className="input-pos px-3 py-2.5 rounded-xl text-sm"
          />
          <input
            type="date" value={filtros.fecha_hasta}
            onChange={e => setFiltros(f => ({ ...f, fecha_hasta: e.target.value }))}
            className="input-pos px-3 py-2.5 rounded-xl text-sm"
          />
        </div>
       <div className="flex gap-2">
          <button
            onClick={buscar}
            disabled={loading}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Buscando...' : '🔍 Buscar movimientos'}
          </button>
          <button
            onClick={exportarExcel}
            disabled={!movimientos.length}
            className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-30 transition-all"
            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            📥 Exportar Excel
          </button>
        </div>
      </div>

      {/* Resumen */}
      {movimientos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total movimientos', value: movimientos.length, color: '#a78bfa' },
            { label: 'Total entradas',    value: totalEntradas.toLocaleString('es-CO') + ' uds', color: '#4ade80' },
            { label: 'Total salidas',     value: totalSalidas.toLocaleString('es-CO') + ' uds',  color: '#f87171' },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <p className="text-xl font-black" style={{ color: s.color, fontFamily: 'Syne, sans-serif' }}>
                {s.value}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.4)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      {movimientos.length > 0 ? (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
                  {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock ant.', 'Stock nuevo', 'Motivo', 'Usuario'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                        style={{ color: 'rgba(196,181,253,0.4)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => {
                  const tipo = TIPOS[m.tipo_movimiento] || { label: m.tipo_movimiento, color: '#a78bfa' }
                  return (
                    <tr key={m.id} style={{
                      borderBottom: '1px solid rgba(139,92,246,0.07)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(139,92,246,0.02)',
                    }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.6)' }}>
                        {new Date(m.created_at).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{m.producto_nombre || m.producto}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-1 rounded-lg"
                              style={{ background: tipo.color + '18', color: tipo.color }}>
                          {tipo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: tipo.color }}>
                        {['SALIDA','AJUSTE_NEG'].includes(m.tipo_movimiento) ? '−' : '+'}{parseFloat(m.cantidad)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
                        {parseFloat(m.stock_anterior)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-white">{parseFloat(m.stock_nuevo)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                        {m.motivo || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                        {m.usuario_nombre || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="glass rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-3xl">📦</p>
            <p className="text-sm font-medium text-white">Aplica los filtros y busca movimientos</p>
            <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
              Selecciona un producto o rango de fechas y presiona Buscar
            </p>
          </div>
        )
      )}
    </div>
  )
}

// ── Tab IA ───────────────────────────────────────────────────
function TabIA() {
  const [estadoIA, setEstadoIA] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    iaService.estado()
      .then(({ data }) => setEstadoIA(data))
      .catch(() => setEstadoIA(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  )
  if (!estadoIA || !estadoIA.es_premium)    return <EstadoBasicIA />
  if (estadoIA.tokens_disponibles === 0)     return <EstadoAgotado resetFecha={estadoIA.ia_reset_fecha} />
  return <Chat tokensDisponibles={estadoIA.tokens_disponibles} tokensMes={estadoIA.ia_tokens_mes} />
}

// ── Página principal ─────────────────────────────────────────
export default function Reportes() {
  const [tab, setTab] = useState('reportes')

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Reportes & IA
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
            Análisis e inteligencia artificial
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
             style={{ background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}>
          <IconIA />
          <span className="text-xs font-bold">IA</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
          {[
            { id: 'reportes',     label: '📊 Reportes' },
            { id: 'movimientos',  label: '📦 Movimientos' },
            { id: 'ia',           label: '🤖 Asistente IA' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex-1 py-4 text-sm font-semibold transition-all"
                    style={tab === t.id ? {
                      color: '#a78bfa',
                      borderBottom: '2px solid #8b5cf6',
                      background: 'rgba(139,92,246,0.06)',
                    } : {
                      color: 'rgba(196,181,253,0.4)',
                    }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'reportes'    && <TabReportes />}
          {tab === 'movimientos' && <TabMovimientos />}
          {tab === 'ia'          && <TabIA />}
        </div>
      </div>

    </div>
  )
}