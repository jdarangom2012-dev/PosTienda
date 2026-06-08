// ============================================================
// 4. src/pages/Inventario/Inventario.jsx
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react'
import { inventarioService } from '../../services/api'
import TablaInventario   from './components/TablaInventario'
import TablaMovimientos  from './components/TablaMovimientos'
import ModalMovimiento   from './components/ModalMovimiento'

export default function Inventario() {
  const [tab,          setTab]          = useState('stock')
  const [inventario,   setInventario]   = useState([])
  const [movimientos,  setMovimientos]  = useState([])
  const [alertas,      setAlertas]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroAlerta, setFiltroAlerta] = useState(false)
  const [modalItem,    setModalItem]    = useState(null)
  const [busquedaMov,  setBusquedaMov]  = useState('')
  const [paginaMov,    setPaginaMov]    = useState(1)
  const MOV_POR_PAGINA = 10

  const cargarStock = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (busqueda)     params.search      = busqueda
      if (filtroAlerta) params.bajo_minimo = true
      params.page_size = 1000 
      const { data } = await inventarioService.listar(params)
      setInventario(data.results || data)
    } catch (err) {
      console.error('Error cargando inventario:', err)
    } finally {
      setLoading(false)
    }
  }, [busqueda, filtroAlerta])

  const [todosMovimientos, setTodosMovimientos] = useState([])

  const cargarMovimientos = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await inventarioService.movimientos({ page_size: 500 })
      setTodosMovimientos(data.results || data)
      setPaginaMov(1)
    } catch (err) {
      console.error('Error cargando movimientos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrar movimientos localmente por búsqueda
  useEffect(() => {
    if (!busquedaMov.trim()) {
      setMovimientos(todosMovimientos)
    } else {
      const q = busquedaMov.toLowerCase()
      setMovimientos(
        todosMovimientos.filter(m =>
          m.producto_nombre?.toLowerCase().includes(q)
        )
      )
    }
    setPaginaMov(1)
  }, [busquedaMov, todosMovimientos])

  const cargarAlertas = useCallback(async () => {
    try {
      const { data } = await inventarioService.alertas()
      setAlertas(data.productos || [])
    } catch {}
  }, [])

  const busquedaRef = useRef(null)

  useEffect(() => {
    const enfocar = () => setTimeout(() => busquedaRef.current?.focus(), 100)
    enfocar()
    window.addEventListener('inventario:focus', enfocar)
    return () => window.removeEventListener('inventario:focus', enfocar)
  }, [])

  useEffect(() => {
    cargarAlertas()
    if (tab === 'stock')       cargarStock()
    if (tab === 'movimientos') cargarMovimientos()
  }, [tab, cargarStock, cargarMovimientos, cargarAlertas])

  const handleGuardado = () => {
    setModalItem(null)
    cargarStock()
    cargarMovimientos()
    cargarAlertas()
  }

  const agotados  = inventario.filter(i => parseFloat(i.cantidad_actual) === 0).length
  const bajoStock = alertas.length

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Control de Inventario
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
            Stock y movimientos de productos
          </p>
        </div>
        <button
          onClick={() => setModalItem({ producto_nombre: 'Seleccionar producto', cantidad_actual: 0 })}
          className="btn-primary px-5 py-3 rounded-xl font-bold text-white text-sm
                     flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Movimiento
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total productos',
            value: inventario.length,
            color: '#8b5cf6',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            ),
          },
          {
            label: 'Bajo stock',
            value: bajoStock,
            color: '#fbbf24',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ),
          },
          {
            label: 'Agotados',
            value: agotados,
            color: '#f87171',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9"  y1="9" x2="15" y2="15"/>
              </svg>
            ),
          },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-white"
                 style={{ fontFamily: 'Syne, sans-serif' }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl overflow-hidden">

        {/* Tab headers */}
        <div className="flex" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
          {[
            { id: 'stock',       label: 'Stock actual' },
            { id: 'movimientos', label: 'Movimientos' },
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
              {t.id === 'stock' && bajoStock > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                  {bajoStock}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filtros stock */}
        {tab === 'stock' && (
          <div className="flex gap-3 p-4"
               style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8b5cf6' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input ref={busquedaRef} type="text" value={busqueda}
                     onChange={e => setBusqueda(e.target.value)}
                     placeholder="Buscar producto..."
                     className="input-pos w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" />
            </div>
            <button onClick={() => setFiltroAlerta(!filtroAlerta)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={filtroAlerta ? {
                      background: 'rgba(251,191,36,0.2)',
                      border: '1px solid rgba(251,191,36,0.3)',
                      color: '#fbbf24',
                    } : {
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.15)',
                      color: 'rgba(196,181,253,0.6)',
                    }}>
              {filtroAlerta ? '⚡ Solo alertas' : 'Todos'}
            </button>
          </div>
        )}

        {/* Filtros movimientos */}
        {tab === 'movimientos' && (
          <div className="flex gap-3 p-4"
               style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8b5cf6' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input type="text" value={busquedaMov}
                     onChange={e => setBusquedaMov(e.target.value)}
                     placeholder="Buscar por producto..."
                     className="input-pos w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" />
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="p-4">
          {tab === 'stock' && (
            <TablaInventario
              items={inventario}
              onAjustar={setModalItem}
              loading={loading}
            />
          )}
          {tab === 'movimientos' && (
            <>
              <TablaMovimientos
                movimientos={movimientos.slice((paginaMov-1)*MOV_POR_PAGINA, paginaMov*MOV_POR_PAGINA)}
                loading={loading}
              />
              {movimientos.length > MOV_POR_PAGINA && (
                <div className="flex items-center justify-between px-2 pt-4">
                  <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                    {movimientos.length} movimientos · Página {paginaMov} de {Math.ceil(movimientos.length/MOV_POR_PAGINA)}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setPaginaMov(p => Math.max(1, p-1))}
                            disabled={paginaMov === 1}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30"
                            style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                      ← Anterior
                    </button>
                    {Array.from({ length: Math.min(5, Math.ceil(movimientos.length/MOV_POR_PAGINA)) }, (_, i) => {
                      const p = paginaMov <= 3 ? i+1 : paginaMov-2+i
                      if (p < 1 || p > Math.ceil(movimientos.length/MOV_POR_PAGINA)) return null
                      return (
                        <button key={p} onClick={() => setPaginaMov(p)}
                                className="w-8 h-8 rounded-lg text-xs font-bold"
                                style={p === paginaMov
                                  ? { background: '#7c3aed', color: 'white' }
                                  : { background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                          {p}
                        </button>
                      )
                    })}
                    <button onClick={() => setPaginaMov(p => Math.min(Math.ceil(movimientos.length/MOV_POR_PAGINA), p+1))}
                            disabled={paginaMov === Math.ceil(movimientos.length/MOV_POR_PAGINA)}
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

      {/* Modal */}
      {modalItem && (
        <ModalMovimiento
          inventario={modalItem}
          onGuardado={handleGuardado}
          onCerrar={() => setModalItem(null)}
        />
      )}
    </div>
  )
}
