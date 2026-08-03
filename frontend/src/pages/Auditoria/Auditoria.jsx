import { useState, useEffect, useCallback } from 'react'
import { auditoriaService } from '../../services/api'

const ACCIONES = {
  INSERT:  { label: 'Creación',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  UPDATE:  { label: 'Modificación',color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  DELETE:  { label: 'Eliminación', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  LOGIN:   { label: 'Login',       color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  LOGOUT:  { label: 'Logout',      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  CANCEL:  { label: 'Cancelación', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  AJUSTE:  { label: 'Ajuste inv.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  PRECIO:  { label: 'Cambio precio',color: '#e879f9', bg: 'rgba(232,121,249,0.1)' },
}

export default function Auditoria() {
  const [registros,    setRegistros]    = useState([])
  const [resumen,      setResumen]      = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [pagina,       setPagina]       = useState(1)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [fechaDesde,   setFechaDesde]   = useState('')
  const [fechaHasta,   setFechaHasta]   = useState('')
  const [totalRegistros, setTotalRegistros] = useState(0)
  const POR_PAGINA = 20

 const hoy = new Date().toISOString().slice(0, 10)

  // REEMPLAZAR la función cargar
const cargar = useCallback(async () => {
  setLoading(true)
  try {
    const params = {
      page_size: POR_PAGINA,
      page: pagina,
    }
    if (busqueda)     params.search      = busqueda
    if (filtroAccion) params.accion      = filtroAccion
    if (fechaDesde)   params.fecha_desde = fechaDesde
    if (fechaHasta)   params.fecha_hasta = fechaHasta

    const [reg, res] = await Promise.all([
      auditoriaService.listar(params),
      auditoriaService.resumen(),
    ])
    setRegistros(reg.data.results || reg.data)
    setTotalRegistros(reg.data.count || 0)
    setResumen(res.data)
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}, [busqueda, filtroAccion, fechaDesde, fechaHasta, pagina])

useEffect(() => {
  setPagina(1)
}, [busqueda, filtroAccion, fechaDesde, fechaHasta])

  useEffect(() => {
    const t = setTimeout(cargar, 400)
    return () => clearTimeout(t)
  }, [cargar])

// REEMPLAZAR estas dos líneas
const totalPaginas    = Math.ceil(totalRegistros / POR_PAGINA)
const registrosPagina = registros  // ya vienen paginados del backend

  const exportarExcel = () => {
    if (!registros.length) return
    const headers = ['Fecha', 'Hora', 'Usuario', 'Acción', 'Tabla', 'ID Registro', 'Detalle', 'IP']
    const rows = registros.map(r => [
      new Date(r.fecha_hora).toLocaleDateString('es-CO'),
      new Date(r.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      r.usuario_nombre,
      ACCIONES[r.accion]?.label || r.accion,
      r.tabla_afectada || '—',
      r.registro_id || '—',
      r.detalle || '—',
      r.ip_dispositivo || '—',
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `auditoria_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          Auditoría
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
          Registro de todas las acciones del sistema
        </p>
      </div>

      {/* Cards resumen */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.5)' }}>Total registros</p>
            <p className="text-xl font-black" style={{ color: '#a78bfa', fontFamily: 'Syne, sans-serif' }}>
              {resumen.total_registros?.toLocaleString('es-CO')}
            </p>
          </div>
          {(resumen.usuarios_activos || []).slice(0, 1).map((u, i) => (
            <div key={i} className="glass rounded-2xl p-4">
              <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.5)' }}>Usuario más activo</p>
              <p className="text-base font-black text-white truncate" style={{ fontFamily: 'Syne, sans-serif' }}>
                {u.usuario_nombre}
              </p>
              <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>{u.total} acciones</p>
            </div>
          ))}
          {(resumen.por_accion || []).slice(0, 2).map((a, i) => (
            <div key={i} className="glass rounded-2xl p-4">
              <p className="text-xs mb-1" style={{ color: 'rgba(196,181,253,0.5)' }}>
                {ACCIONES[a.accion]?.label || a.accion}
              </p>
              <p className="text-xl font-black"
                 style={{ color: ACCIONES[a.accion]?.color || '#a78bfa', fontFamily: 'Syne, sans-serif' }}>
                {a.total}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3">
        <input
          type="text" value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar usuario o detalle..."
          className="input-pos flex-1 min-w-48 px-4 py-2.5 rounded-xl text-sm"
        />
        <select value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)}
                className="input-pos px-4 py-2.5 rounded-xl text-sm"
                style={{ background: '#1e1b4b', color: '#e2e8f0' }}>
          <option value="">Todas las acciones</option>
          {Object.entries(ACCIONES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <input type="date" value={fechaDesde}
               onChange={e => setFechaDesde(e.target.value)}
               className="input-pos px-4 py-2.5 rounded-xl text-sm"
               style={{ background: '#1e1b4b', color: '#e2e8f0' }} />
        <input type="date" value={fechaHasta}
               onChange={e => setFechaHasta(e.target.value)}
               className="input-pos px-4 py-2.5 rounded-xl text-sm"
               style={{ background: '#1e1b4b', color: '#e2e8f0' }} />
        {registros.length > 0 && (
          <button onClick={exportarExcel}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
            📥 Exportar
          </button>
        )}
        {(busqueda || filtroAccion || fechaDesde || fechaHasta) && (
          <button onClick={() => { setBusqueda(''); setFiltroAccion(''); setFechaDesde(''); setFechaHasta('') }}
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
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse"
                   style={{ background: 'rgba(139,92,246,0.05)' }} />
            ))}
          </div>
        ) : registros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-3xl">🔍</p>
            <p className="text-sm text-white">No hay registros de auditoría</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
                    {['Fecha/Hora', 'Usuario', 'Acción', 'Tabla', 'Detalle', 'IP'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                          style={{ color: 'rgba(196,181,253,0.4)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registrosPagina.map((r, i) => {
                    const accion = ACCIONES[r.accion] || { label: r.accion, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' }
                    return (
                      <tr key={r.id} style={{
                        borderBottom: '1px solid rgba(139,92,246,0.07)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(139,92,246,0.02)',
                      }}>
                        <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                          <div>{new Date(r.fecha_hora).toLocaleDateString('es-CO')}</div>
                          <div style={{ color: 'rgba(196,181,253,0.3)' }}>
                            {new Date(r.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-white">
                          {r.usuario_nombre}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg"
                                style={{ background: accion.bg, color: accion.color }}>
                            {accion.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                          {r.tabla_afectada || '—'}
                          {r.registro_id && (
                            <span className="ml-1" style={{ color: 'rgba(196,181,253,0.3)' }}>
                              #{r.registro_id}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-white max-w-xs">
                          <div className="truncate" title={r.detalle}>
                            {r.detalle || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'rgba(196,181,253,0.3)' }}>
                          {r.ip_dispositivo || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3"
                   style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
                <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                  {totalRegistros.toLocaleString('es-CO')} registros · Página {pagina} de {totalPaginas}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30"
                          style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                    ← Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    const p = pagina <= 3 ? i + 1 : pagina - 2 + i
                    if (p < 1 || p > totalPaginas) return null
                    return (
                      <button key={p} onClick={() => setPagina(p)}
                              className="w-8 h-8 rounded-lg text-xs font-bold"
                              style={p === pagina
                                ? { background: '#7c3aed', color: 'white' }
                                : { background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30"
                          style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}