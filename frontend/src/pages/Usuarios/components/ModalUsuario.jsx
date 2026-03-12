// ============================================================
// 2. src/pages/Usuarios/components/ModalUsuario.jsx
// ============================================================
import { useState, useEffect } from 'react'
import { usuariosService, superAdminService } from '../../../services/api'

const ROLES = [
  { value: 'COORDINADOR',       label: 'Coordinador', desc: 'Acceso total al sistema'        },
  { value: 'CAJERO',      label: 'Cajero',        desc: 'Solo POS y ventas'              },
  { value: 'ALMACENISTA', label: 'Almacenista',   desc: 'Inventario y productos'         },
]

export default function ModalUsuario({ usuario, onGuardado, onCerrar }) {
  const esEdicion = !!usuario?.id
  const [tiendas, setTiendas] = useState([])
  useEffect(() => {
    superAdminService.tiendas().then(({ data }) => setTiendas(data.results || data))
  }, [])
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')
  const [form, setForm] = useState({
    username:        '',
    nombre_completo: '',
    email:           '',
    rol:             'CAJERO',
    tienda:          '', 
    password:        '',
    confirmar:       '',
  })

  useEffect(() => {
    if (usuario) {
      setForm({
        username:        usuario.username        || '',
        nombre_completo: usuario.nombre_completo || '',
        email:           usuario.email           || '',
        rol:             usuario.rol             || 'CAJERO',
        password:        '',
        confirmar:       '',
      })
    }
  }, [usuario])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleGuardar = async () => {
    if (!form.username || !form.nombre_completo) {
      setError('Usuario y nombre completo son obligatorios.')
      return
    }
    if (!esEdicion && !form.password) {
      setError('La contraseña es obligatoria para nuevos usuarios.')
      return
    }
    if (form.password && form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setGuardando(true)
    setError('')

    const payload = {
      username:        form.username,
      nombre_completo: form.nombre_completo,
      email:           form.email,
      rol:             form.rol,
      tienda:          form.tienda,   
      password2:       form.confirmar,   
    }
    if (form.password) payload.password = form.password

    try {
      if (esEdicion) {
        await usuariosService.actualizar(usuario.id, payload)
      } else {
        await usuariosService.crear(payload)
      }
      onGuardado()
    } catch (err) {
      const data = err.response?.data
      const msg  = typeof data === 'object'
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
        : 'Error al guardar el usuario.'
      setError(msg)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-15"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-md animate-fade-in overflow-y-auto max-h-[90vh] mt-10"
           style={{ boxShadow: '0 32px 80px rgba(124,58,237,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: 'Syne, sans-serif', color: '#ffffff', fontSize: '1.25rem', fontWeight: 900 }}>
            {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onCerrar}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6"  y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">

          {/* Nombre completo */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              Nombre completo *
            </label>
            <input name="nombre_completo" value={form.nombre_completo}
                   onChange={handleChange} placeholder="Ej: Juan Pérez"
                   className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
          </div>

          {/* Username + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Usuario *
              </label>
              <input name="username" value={form.username}
                     onChange={handleChange} placeholder="juanperez"
                     className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Email
              </label>
              <input name="email" value={form.email} type="email"
                     onChange={handleChange} placeholder="juan@tienda.com"
                     className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              Rol *
            </label>
            <div className="space-y-2">
              {ROLES.map(r => (
                <button key={r.value} type="button"
                        onClick={() => setForm(p => ({ ...p, rol: r.value }))}
                        className="w-full flex items-center justify-between px-4 py-3
                                   rounded-xl transition-all text-left"
                        style={form.rol === r.value ? {
                          background: 'rgba(139,92,246,0.15)',
                          border: '1px solid rgba(139,92,246,0.4)',
                        } : {
                          background: 'rgba(139,92,246,0.04)',
                          border: '1px solid rgba(139,92,246,0.1)',
                        }}>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                      {r.desc}
                    </p>
                  </div>
                  {form.rol === r.value && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                           stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Tienda */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                  style={{ color: 'rgba(196,181,253,0.6)' }}>
              Tienda *
            </label>
            <select name="tienda" value={form.tienda}
                    onChange={handleChange}
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

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              {esEdicion ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
            </label>
            <input name="password" value={form.password} type="password"
                   onChange={handleChange} placeholder="••••••••"
                   className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
          </div>

          {form.password && (
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Confirmar contraseña *
              </label>
              <input name="confirmar" value={form.confirmar} type="password"
                     onChange={handleChange} placeholder="••••••••"
                     className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
          )}

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
          <div className="flex gap-3 pt-2">
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
              ) : (esEdicion ? 'Guardar cambios' : 'Crear usuario')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
