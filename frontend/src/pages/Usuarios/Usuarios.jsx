// ============================================================
// 3. src/pages/Usuarios/Usuarios.jsx
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usuariosService } from '../../services/api'
import TarjetaUsuario from './components/TarjetaUsuario'
import ModalUsuario   from './components/ModalUsuario'

export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const [usuarios,     setUsuarios]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroRol,    setFiltroRol]    = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEdit,  setUsuarioEdit]  = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (busqueda)  params.search = busqueda
      if (filtroRol) params.rol    = filtroRol
      const { data } = await usuariosService.listar(params)
      setUsuarios(data.results || data)
    } catch (err) {
      console.error('Error cargando usuarios:', err)
    } finally {
      setLoading(false)
    }
  }, [busqueda, filtroRol])

  useEffect(() => { cargar() }, [cargar])

  const handleNuevo = () => {
    setUsuarioEdit(null)
    setModalAbierto(true)
  }

  const handleEditar = (u) => {
    setUsuarioEdit(u)
    setModalAbierto(true)
  }

  const handleToggle = async (u) => {
    const accion = u.is_active ? 'desactivar' : 'activar'
    if (!window.confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a "${u.nombre_completo}"?`)) return
    try {
      await usuariosService.actualizar(u.id, { is_active: !u.is_active })
      cargar()
    } catch {
      alert('Error al cambiar el estado del usuario.')
    }
  }

  const handleGuardado = () => {
    setModalAbierto(false)
    setUsuarioEdit(null)
    cargar()
  }

  const admins      = usuarios.filter(u => u.rol === 'ADMIN').length
  const cajeros     = usuarios.filter(u => u.rol === 'CAJERO').length
  const almacenistas= usuarios.filter(u => u.rol === 'ALMACENISTA').length
  const activos     = usuarios.filter(u => u.is_active).length

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Gestión de Usuarios
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
            {usuarios.length} usuarios registrados · {activos} activos
          </p>
        </div>
        <button onClick={handleNuevo}
                className="btn-primary px-5 py-3 rounded-xl font-bold text-white
                           text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Stats roles */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',        value: usuarios.length, color: '#8b5cf6' },
          { label: 'Admins',       value: admins,          color: '#a855f7' },
          { label: 'Cajeros',      value: cajeros,         color: '#06b6d4' },
          { label: 'Almacenistas', value: almacenistas,    color: '#4ade80' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white"
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
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <div className="absolute left-3 top-1/2 -translate-y-1/2"
               style={{ color: '#8b5cf6' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input type="text" value={busqueda}
                 onChange={e => setBusqueda(e.target.value)}
                 placeholder="Buscar por nombre o usuario..."
                 className="input-pos w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" />
        </div>

        <select value={filtroRol}
                onChange={e => setFiltroRol(e.target.value)}
                className="input-pos px-4 py-2.5 rounded-xl text-sm">
          <option value="">Todos los roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="CAJERO">Cajero</option>
          <option value="ALMACENISTA">Almacenista</option>
        </select>

        {(busqueda || filtroRol) && (
          <button onClick={() => { setBusqueda(''); setFiltroRol('') }}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Grid usuarios */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl animate-pulse"
                 style={{ background: 'rgba(139,92,246,0.06)' }} />
          ))}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
               style={{ background: 'rgba(139,92,246,0.08)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="rgba(139,92,246,0.4)" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-white">No hay usuarios</p>
          <button onClick={handleNuevo}
                  className="btn-primary px-4 py-2 rounded-xl text-sm font-bold text-white mt-2">
            + Nuevo Usuario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {usuarios.map(u => (
            <TarjetaUsuario
              key={u.id}
              usuario={u}
              esYo={u.id === yo?.id}
              onEditar={handleEditar}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalUsuario
          usuario={usuarioEdit}
          onGuardado={handleGuardado}
          onCerrar={() => { setModalAbierto(false); setUsuarioEdit(null) }}
        />
      )}
    </div>
  )
}