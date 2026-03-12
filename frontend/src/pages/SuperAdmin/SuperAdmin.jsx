import { useState, useEffect } from 'react'
import { superAdminService } from '../../services/api'
import { useNavigate } from 'react-router-dom'

// ── Iconos ───────────────────────────────────────────────────
const IconTienda  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IconUser    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
const IconEdit    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconPlus    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
const IconX       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

// ── Modal Tienda ─────────────────────────────────────────────
function ModalTienda({ tienda, onGuardado, onCerrar }) {
  const [form, setForm] = useState({
    codigo:        tienda?.codigo        || '',
    nombre:        tienda?.nombre        || '',
    plan:          tienda?.plan          || 'BASIC',
    ia_activa:     tienda?.ia_activa     || false,
    ia_tokens_mes: tienda?.ia_tokens_mes || 50,
    activa:        tienda?.activa        ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const guardar = async () => {
    if (!form.codigo || !form.nombre) { setError('Código y nombre son obligatorios.'); return }
    setLoading(true)
    setError('')
    try {
      if (tienda) {
        await superAdminService.actualizarTienda(tienda.id, form)
      } else {
        await superAdminService.crearTienda(form)
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.codigo?.[0] || err.response?.data?.nombre?.[0] || 'Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {tienda ? 'Editar Tienda' : 'Nueva Tienda'}
          </h2>
          <button onClick={onCerrar} className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <IconX />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>Código de tienda</label>
            <input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value.toUpperCase()})}
                   placeholder="Ej: TIENDA-001"
                   className="input-pos w-full px-4 py-3 rounded-xl text-sm"
                   disabled={!!tienda} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>Nombre</label>
            <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                   placeholder="Ej: Tienda Centro"
                   className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>Plan</label>
            <select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}
                    className="input-pos w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: '#1e1b4b', color: '#e2e8f0' }}>
              <option value="BASIC"   style={{ background: '#1e1b4b' }}>Básico</option>
              <option value="PREMIUM" style={{ background: '#1e1b4b' }}>Premium</option>
            </select>
          </div>

          {form.plan === 'PREMIUM' && (
            <>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                   style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <span className="text-sm text-white">IA habilitada</span>
                <button onClick={() => setForm({...form, ia_activa: !form.ia_activa})}
                        className="w-12 h-6 rounded-full transition-all relative"
                        style={{ background: form.ia_activa ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(139,92,246,0.2)' }}>
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
                       style={{ left: form.ia_activa ? '26px' : '2px' }} />
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                       style={{ color: 'rgba(196,181,253,0.6)' }}>Tokens mensuales</label>
                <input type="number" value={form.ia_tokens_mes}
                       onChange={e => setForm({...form, ia_tokens_mes: parseInt(e.target.value)})}
                       className="input-pos w-full px-4 py-3 rounded-xl text-sm" min={10} max={500} />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm px-4 py-2 rounded-xl"
               style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onCerrar} className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(196,181,253,0.7)' }}>
              Cancelar
            </button>
            <button onClick={guardar} disabled={loading}
                    className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40">
              {loading ? 'Guardando...' : tienda ? 'Actualizar' : 'Crear Tienda'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal Usuario Admin ──────────────────────────────────────
function ModalAdmin({ tiendas, onGuardado, onCerrar }) {
  const [form, setForm] = useState({
    username:       '',
    nombre_completo:'',
    email:          '',
    password:       '',
    rol:            'ADMIN',
    tienda:         '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const guardar = async () => {
    if (!form.username || !form.password || !form.tienda) {
      setError('Usuario, contraseña y tienda son obligatorios.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await superAdminService.crearAdmin(form)
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.username?.[0] || 'Error al crear el usuario.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Nuevo Administrador
          </h2>
          <button onClick={onCerrar} className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <IconX />
          </button>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Usuario',          key: 'username',        type: 'text',     ph: 'admin_tienda' },
            { label: 'Nombre completo',  key: 'nombre_completo', type: 'text',     ph: 'Juan Pérez' },
            { label: 'Email',            key: 'email',           type: 'email',    ph: 'admin@tienda.com' },
            { label: 'Contraseña',       key: 'password',        type: 'password', ph: '••••••••' },
          ].map(({ label, key, type, ph }) => (
            <div key={key}>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>{label}</label>
              <input type={type} value={form[key]} placeholder={ph}
                     onChange={e => setForm({...form, [key]: e.target.value})}
                     className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>Rol</label>
            <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}
                    className="input-pos w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: '#1e1b4b', color: '#e2e8f0' }}>
              <option value="ADMIN"        style={{ background: '#1e1b4b' }}>Administrador</option>
              <option value="CAJERO"       style={{ background: '#1e1b4b' }}>Cajero</option>
              <option value="ALMACENISTA"  style={{ background: '#1e1b4b' }}>Almacenista</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>Tienda</label>
            <select value={form.tienda} onChange={e => setForm({...form, tienda: e.target.value})}
                    className="input-pos w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: '#1e1b4b', color: '#e2e8f0' }}>
              <option value="" style={{ background: '#1e1b4b' }}>Selecciona una tienda</option>
              {tiendas.map(t => (
                <option key={t.id} value={t.id} style={{ background: '#1e1b4b' }}>
                  {t.nombre} ({t.codigo})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm px-4 py-2 rounded-xl"
               style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onCerrar} className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(196,181,253,0.7)' }}>
              Cancelar
            </button>
            <button onClick={guardar} disabled={loading}
                    className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40">
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta Tienda ───────────────────────────────────────────
function TarjetaTienda({ tienda, onEditar, onToggle, onVerUsuarios }) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
            <IconTienda />
          </div>
          <div>
            <p className="font-bold text-white text-sm">{tienda.nombre}</p>
            <p className="text-xs font-mono" style={{ color: 'rgba(196,181,253,0.5)' }}>
              {tienda.codigo}
            </p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-lg font-bold"
              style={tienda.activa ? {
                background: 'rgba(74,222,128,0.1)', color: '#4ade80'
              } : {
                background: 'rgba(239,68,68,0.1)', color: '#f87171'
              }}>
          {tienda.activa ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Plan e IA */}
      <div className="flex gap-2">
        <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
              style={tienda.plan === 'PREMIUM' ? {
                background: 'rgba(245,158,11,0.1)', color: '#f59e0b'
              } : {
                background: 'rgba(139,92,246,0.08)', color: 'rgba(196,181,253,0.5)'
              }}>
          {tienda.plan}
        </span>
        {tienda.ia_activa && (
          <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
                style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
            IA ✓ {tienda.tokens_disponibles}/{tienda.ia_tokens_mes} tokens
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 mt-auto">
        <button onClick={() => onVerUsuarios(tienda)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                style={{ background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}>
          <IconUser /> Usuarios
        </button>
        <button onClick={() => onEditar(tienda)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                style={{ background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}>
          <IconEdit /> Editar
        </button>
        <button onClick={() => onToggle(tienda)}
                className="py-2 px-3 rounded-xl text-xs font-semibold"
                style={tienda.activa ? {
                  background: 'rgba(239,68,68,0.08)', color: '#f87171'
                } : {
                  background: 'rgba(74,222,128,0.08)', color: '#4ade80'
                }}>
          {tienda.activa ? <IconX /> : <IconCheck />}
        </button>
      </div>
    </div>
  )
}

// ── Modal Usuarios de Tienda ─────────────────────────────────
function ModalUsuariosTienda({ tienda, onCerrar }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    superAdminService.usuariosTienda(tienda.id)
      .then(({ data }) => setUsuarios(data))
      .finally(() => setLoading(false))
  }, [tienda.id])

  const ROLES = { ADMIN: '#a78bfa', CAJERO: '#06b6d4', ALMACENISTA: '#4ade80' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              {tienda.nombre}
            </h2>
            <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
              {usuarios.length} usuarios registrados
            </p>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <IconX />
          </button>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : usuarios.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'rgba(196,181,253,0.4)' }}>
            No hay usuarios en esta tienda
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                   style={{ background: 'rgba(139,92,246,0.06)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                     style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  {(u.nombre_completo || u.username)[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{u.nombre_completo || u.username}</p>
                  <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>@{u.username}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg font-bold"
                      style={{ background: `${ROLES[u.rol]}18`, color: ROLES[u.rol] || '#a78bfa' }}>
                  {u.rol}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// ── Página principal SuperAdmin ──────────────────────────────
export default function SuperAdmin() {
  const [tiendas,       setTiendas]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modalTienda,   setModalTienda]   = useState(false)
  const [modalAdmin,    setModalAdmin]    = useState(false)
  const [tiendaEdit,    setTiendaEdit]    = useState(null)
  const [tiendaUsuarios,setTiendaUsuarios]= useState(null)
  const [busqueda,      setBusqueda]      = useState('')

  const cargar = async () => {
    setLoading(true)
    try {
      const { data } = await superAdminService.tiendas()
      setTiendas(data.results || data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const handleToggle = async (tienda) => {
    const accion = tienda.activa ? 'desactivar' : 'activar'
    if (!window.confirm(`¿${accion} la tienda "${tienda.nombre}"?`)) return
    try {
      if (tienda.activa) await superAdminService.desactivarTienda(tienda.id)
      else               await superAdminService.activarTienda(tienda.id)
      cargar()
    } catch {}
  }

  const tiendas_filtradas = tiendas.filter(t =>
    t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    t.codigo.toLowerCase().includes(busqueda.toLowerCase())
  )

  const activas  = tiendas.filter(t => t.activa).length
  const premium  = tiendas.filter(t => t.plan === 'PREMIUM').length
  const navigate = useNavigate() 
  return (
    <div className="space-y-5 animate-fade-in">

  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
        Panel Superadmin
      </h2>
      <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
        Gestión global de tiendas y usuarios
      </p>
    </div>
    <div className="flex gap-2">
      <button onClick={() => navigate('/usuarios')}
              className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
              style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(196,181,253,0.7)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Gestión Usuarios
      </button>
      <button onClick={() => setModalAdmin(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
              style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
        <IconUser /> Nuevo Admin
      </button>
      <button onClick={() => { setTiendaEdit(null); setModalTienda(true) }}
              className="btn-primary px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2">
        <IconPlus /> Nueva Tienda
      </button>
    </div>
  </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total tiendas',  value: tiendas.length, color: '#8b5cf6' },
          { label: 'Activas',        value: activas,         color: '#4ade80' },
          { label: 'Plan Premium',   value: premium,         color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <p className="text-3xl font-black" style={{ color: s.color, fontFamily: 'Syne, sans-serif' }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.4)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="glass rounded-2xl p-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8b5cf6' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                 placeholder="Buscar tienda por nombre o código..."
                 className="input-pos w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" />
        </div>
      </div>

      {/* Grid tiendas */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-52 rounded-2xl animate-pulse"
                 style={{ background: 'rgba(139,92,246,0.06)' }} />
          ))}
        </div>
      ) : tiendas_filtradas.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm font-medium text-white">No hay tiendas</p>
          <button onClick={() => { setTiendaEdit(null); setModalTienda(true) }}
                  className="btn-primary px-4 py-2 rounded-xl text-sm font-bold text-white">
            + Nueva Tienda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tiendas_filtradas.map(t => (
            <TarjetaTienda
              key={t.id}
              tienda={t}
              onEditar={t => { setTiendaEdit(t); setModalTienda(true) }}
              onToggle={handleToggle}
              onVerUsuarios={t => setTiendaUsuarios(t)}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {modalTienda && (
        <ModalTienda
          tienda={tiendaEdit}
          onGuardado={() => { setModalTienda(false); cargar() }}
          onCerrar={() => setModalTienda(false)}
        />
      )}
      {modalAdmin && (
        <ModalAdmin
          tiendas={tiendas}
          onGuardado={() => { setModalAdmin(false) }}
          onCerrar={() => setModalAdmin(false)}
        />
      )}
      {tiendaUsuarios && (
        <ModalUsuariosTienda
          tienda={tiendaUsuarios}
          onCerrar={() => setTiendaUsuarios(null)}
        />
      )}
    </div>
  )
}