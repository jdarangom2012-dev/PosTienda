// ============================================================
// CATEGORÍAS — PosFácil
// ============================================================
// Archivos a crear/actualizar:
//
//  src/pages/Productos/components/Categorias.jsx  ← página completa
//  src/services/api.js                            ← agrega categoriasService
//  src/App.jsx                                    ← agrega ruta /categorias
// ============================================================


// ============================================================
// 1. src/pages/Productos/components/Categorias.jsx
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { categoriasService } from '../../../services/api'

// ── Modal crear / editar ─────────────────────────────────────
function ModalCategoria({ categoria, onGuardado, onCerrar }) {
  const esEdicion = !!categoria?.id
  const [form, setForm] = useState({
    nombre:      categoria?.nombre      || '',
    descripcion: categoria?.descripcion || '',
    activa:      categoria?.activa      ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      if (esEdicion) {
        await categoriasService.actualizar(categoria.id, form)
      } else {
        await categoriasService.crear(form)
      }
      onGuardado()
    } catch (err) {
      const data = err.response?.data
      setError(
        typeof data === 'object'
          ? Object.values(data).flat().join(' | ')
          : 'Error al guardar la categoría.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm animate-fade-in"
           style={{ boxShadow: '0 32px 80px rgba(124,58,237,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            {esEdicion ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button onClick={onCerrar}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6"  x2="6"  y2="18"/>
              <line x1="6"  y1="6"  x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              Nombre *
            </label>
            <input
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej: Bebidas, Lácteos, Snacks..."
              className="input-pos w-full px-4 py-3 rounded-xl text-sm"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción opcional..."
              rows={3}
              className="input-pos w-full px-4 py-3 rounded-xl text-sm resize-none"
            />
          </div>

          {/* Toggle activa */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
               style={{
                 background: 'rgba(139,92,246,0.06)',
                 border: '1px solid rgba(139,92,246,0.1)',
               }}>
            <div>
              <p className="text-sm font-semibold text-white">Activa</p>
              <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                Las categorías inactivas no aparecen en productos
              </p>
            </div>
            <button
              onClick={() => setForm(p => ({ ...p, activa: !p.activa }))}
              className="w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0"
              style={{
                background: form.activa
                  ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                  : 'rgba(139,92,246,0.15)',
              }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                    style={{ left: form.activa ? '26px' : '2px' }} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
                 style={{
                   background: 'rgba(239,68,68,0.1)',
                   border: '1px solid rgba(239,68,68,0.3)',
                   color: '#fca5a5',
                 }}>
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button onClick={onCerrar}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      color: 'rgba(196,181,253,0.7)',
                    }}>
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={guardando}
                    className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold
                               text-white disabled:opacity-50">
              {guardando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (esEdicion ? 'Guardar cambios' : 'Crear categoría')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal confirmación eliminar ──────────────────────────────
function ModalEliminar({ categoria, onConfirmar, onCerrar }) {
  const [eliminando, setEliminando] = useState(false)

  const handleEliminar = async () => {
    setEliminando(true)
    try {
      await categoriasService.eliminar(categoria.id)
      onConfirmar()
    } catch {
      onCerrar()
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm animate-fade-in"
           style={{ boxShadow: '0 32px 80px rgba(239,68,68,0.2)' }}>
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(239,68,68,0.1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="#f87171" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
          <h3 className="text-lg font-black text-white mb-1"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            ¿Desactivar categoría?
          </h3>
          <p className="text-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
            <span className="text-white font-semibold">"{categoria?.nombre}"</span>
            {' '}ya no aparecerá en la lista de categorías activas.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCerrar}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    color: 'rgba(196,181,253,0.7)',
                  }}>
            Cancelar
          </button>
          <button onClick={handleEliminar} disabled={eliminando}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.15)',
                           border: '1px solid rgba(239,68,68,0.3)',
                           color: '#f87171' }}>
            {eliminando ? 'Desactivando...' : 'Sí, desactivar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal Categorías ──────────────────────────────
export default function Categorias() {
  const [categorias,   setCategorias]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [busqueda,     setBusqueda]     = useState('')
  const [soloActivas,  setSoloActivas]  = useState(true)
  const [modalForm,    setModalForm]    = useState(false)
  const [categoriaEdit,setCategoriaEdit]= useState(null)
  const [modalEliminar,setModalEliminar]= useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (busqueda) params.search = busqueda
      const { data } = await categoriasService.listar(params)
      let items = data.results || data
      if (soloActivas) items = items.filter(c => c.activa)
      setCategorias(items)
    } catch (err) {
      console.error('Error cargando categorías:', err)
    } finally {
      setLoading(false)
    }
  }, [busqueda, soloActivas])

  useEffect(() => { cargar() }, [cargar])

  const handleGuardado = () => {
    setModalForm(false)
    setCategoriaEdit(null)
    cargar()
  }

  const handleEditar = (c) => {
    setCategoriaEdit(c)
    setModalForm(true)
  }

  const handleNueva = () => {
    setCategoriaEdit(null)
    setModalForm(true)
  }

  const activas   = categorias.filter(c =>  c.activa).length
  const inactivas = categorias.filter(c => !c.activa).length

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Categorías
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
            Organiza tus productos por categoría
          </p>
        </div>
        <button onClick={handleNueva}
                className="btn-primary px-5 py-3 rounded-xl font-bold text-white
                           text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Categoría
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',     value: categorias.length, color: '#8b5cf6' },
          { label: 'Activas',   value: activas,           color: '#4ade80' },
          { label: 'Inactivas', value: inactivas,         color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-black"
               style={{ fontFamily: 'Syne, sans-serif', color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.4)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="glass rounded-2xl p-4 flex gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2"
               style={{ color: '#8b5cf6' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar categoría..."
            className="input-pos w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <button
          onClick={() => setSoloActivas(!soloActivas)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={soloActivas ? {
            background: 'rgba(74,222,128,0.15)',
            border: '1px solid rgba(74,222,128,0.3)',
            color: '#4ade80',
          } : {
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.15)',
            color: 'rgba(196,181,253,0.6)',
          }}>
          {soloActivas ? '✓ Solo activas' : 'Todas'}
        </button>
      </div>

      {/* Tabla */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse"
                   style={{ background: 'rgba(139,92,246,0.05)' }} />
            ))}
          </div>
        ) : categorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                 style={{ background: 'rgba(139,92,246,0.08)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                   stroke="rgba(139,92,246,0.4)" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-white">No hay categorías</p>
            <button onClick={handleNueva}
                    className="btn-primary px-4 py-2 rounded-xl text-sm font-bold text-white mt-1">
              + Nueva Categoría
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                {['Nombre', 'Descripción', 'Productos', 'Estado', 'Acciones'].map(h => (
                  <th key={h}
                      className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase"
                      style={{ color: 'rgba(196,181,253,0.4)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorias.map(c => (
                <tr key={c.id}
                    className="transition-all hover:bg-purple-900/10"
                    style={{ borderBottom: '1px solid rgba(139,92,246,0.06)' }}>

                  {/* Nombre */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: 'rgba(139,92,246,0.15)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="#a78bfa" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-white">{c.nombre}</span>
                    </div>
                  </td>

                  {/* Descripción */}
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
                      {c.descripcion || '—'}
                    </span>
                  </td>

                  {/* Productos */}
                  <td className="px-4 py-3">
                    <span className="text-sm px-2 py-1 rounded-lg"
                          style={{
                            background: 'rgba(139,92,246,0.1)',
                            color: '#a78bfa',
                          }}>
                      {c.total_productos ?? c.productos_count ?? '—'} productos
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-lg font-medium"
                          style={{
                            background: c.activa
                              ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                            color: c.activa ? '#4ade80' : '#f87171',
                          }}>
                      {c.activa ? '● Activa' : '● Inactiva'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditar(c)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold
                                         transition-all hover:scale-105"
                              style={{
                                background: 'rgba(139,92,246,0.1)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                color: '#a78bfa',
                              }}>
                        Editar
                      </button>
                      <button onClick={() => setModalEliminar(c)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold
                                         transition-all hover:scale-105"
                              style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#f87171',
                              }}>
                        {c.activa ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modales */}
      {modalForm && (
        <ModalCategoria
          categoria={categoriaEdit}
          onGuardado={handleGuardado}
          onCerrar={() => { setModalForm(false); setCategoriaEdit(null) }}
        />
      )}
      {modalEliminar && (
        <ModalEliminar
          categoria={modalEliminar}
          onConfirmar={() => { setModalEliminar(null); cargar() }}
          onCerrar={() => setModalEliminar(null)}
        />
      )}
    </div>
  )
}

