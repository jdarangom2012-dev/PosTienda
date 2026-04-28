import { useState, useEffect, useCallback, useRef  } from 'react'
import { creditosService } from '../../services/api'
import ModalAbono from './components/ModalAbono'

export default function Creditos() {
  const [creditos,     setCreditos]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [fechaDesde,   setFechaDesde]   = useState('')
  const [fechaHasta,   setFechaHasta]   = useState('')
  const [modalAbono,   setModalAbono]   = useState(null)
  const [resumen,      setResumen]      = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (busqueda)     params.search      = busqueda
      if (filtroEstado) params.estado      = filtroEstado
      if (fechaDesde)   params.fecha_desde = fechaDesde
      if (fechaHasta)   params.fecha_hasta = fechaHasta

      const [c, r] = await Promise.all([
        creditosService.listar(params),
        creditosService.resumen(),
      ])
      setCreditos(c.data.results || c.data)
      setResumen(r.data)
    } catch (err) {
      console.error('Error cargando créditos:', err)
    } finally {
      setLoading(false)
    }
  }, [busqueda, filtroEstado, fechaDesde, fechaHasta])

  useEffect(() => {
    const t = setTimeout(cargar, 400)
    return () => clearTimeout(t)
  }, [cargar])

  const busquedaRef = useRef(null)
  
  useEffect(() => {
    const enfocar = () => setTimeout(() => busquedaRef.current?.focus(), 100)
    enfocar()
    window.addEventListener('creditos:focus', enfocar)
    return () => window.removeEventListener('creditos:focus', enfocar)
  }, [])

  const fmt = (v) => `$${parseFloat(v || 0).toLocaleString('es-CO')}`

  const colorEstado = (estado) => {
    if (estado === 'PAGADO')    return { bg: 'rgba(74,222,128,0.1)',  color: '#4ade80' }
    if (estado === 'VENCIDO')   return { bg: 'rgba(239,68,68,0.1)',   color: '#f87171' }
    return                             { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Créditos
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
            Gestión de cartera y deudas
          </p>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total cartera',  value: fmt(resumen?.total_cartera),  color: '#f59e0b' },
          { label: 'Créditos activos', value: resumen?.total_creditos || 0, color: '#8b5cf6' },
          { label: 'Clientes',       value: resumen?.total_clientes || 0,  color: '#06b6d4' },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-4">
            <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.5)' }}>{card.label}</p>
            <p className="text-xl font-black" style={{ color: card.color, fontFamily: 'Syne, sans-serif' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3">
        {/* Buscador */}
        <div className="relative flex-1 min-w-48">
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8b5cf6' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            ref={busquedaRef}  // ← AGREGAR
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente..."
            className="input-pos w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>

        {/* Estado */}
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="input-pos px-4 py-2.5 rounded-xl text-sm"
          style={{ background: '#1e1b4b', color: '#e2e8f0' }}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="PAGADO">Pagado</option>
          <option value="VENCIDO">Vencido</option>
        </select>

        {/* Fechas */}
        <input
          type="date" value={fechaDesde}
          onChange={e => setFechaDesde(e.target.value)}
          className="input-pos px-4 py-2.5 rounded-xl text-sm"
          style={{ background: '#1e1b4b', color: '#e2e8f0' }}
        />
        <input
          type="date" value={fechaHasta}
          onChange={e => setFechaHasta(e.target.value)}
          className="input-pos px-4 py-2.5 rounded-xl text-sm"
          style={{ background: '#1e1b4b', color: '#e2e8f0' }}
        />

        {/* Limpiar */}
        {(busqueda || filtroEstado || fechaDesde || fechaHasta) && (
          <button
            onClick={() => { setBusqueda(''); setFiltroEstado(''); setFechaDesde(''); setFechaHasta('') }}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse"
                   style={{ background: 'rgba(139,92,246,0.05)' }} />
            ))}
          </div>
        ) : creditos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm" style={{ color: 'rgba(196,181,253,0.4)' }}>
              No hay créditos registrados
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                {['Fecha', 'Cliente', 'Productos', 'Total deuda', 'Abonado', 'Saldo', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase"
                      style={{ color: 'rgba(196,181,253,0.4)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creditos.map(c => {
                const est = colorEstado(c.estado)
                return (
                  <tr key={c.id}
                      className="transition-all hover:bg-purple-900/10"
                      style={{ borderBottom: '1px solid rgba(139,92,246,0.06)' }}>
                    <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                      {new Date(c.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white">{c.cliente_nombre}</p>
                      {c.cliente_telefono && (
                        <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                          {c.cliente_telefono}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.6)' }}>
                      {c.venta
                        ? `Venta #${c.venta}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-white">
                      {fmt(c.total_deuda)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#4ade80' }}>
                      {fmt(c.total_abonado)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: '#f59e0b' }}>
                      {fmt(c.saldo_pendiente)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-lg font-medium"
                            style={{ background: est.bg, color: est.color }}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => setModalAbono(c)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:scale-105"
                          style={{
                            background: 'rgba(74,222,128,0.15)',
                            border: '1px solid rgba(74,222,128,0.3)',
                            color: '#4ade80',
                          }}>
                          + Abono
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal abono */}
      {modalAbono && (
        <ModalAbono
          credito={modalAbono}
          onGuardado={() => { setModalAbono(null); cargar() }}
          onCerrar={() => setModalAbono(null)}
        />
      )}
    </div>
  )
}