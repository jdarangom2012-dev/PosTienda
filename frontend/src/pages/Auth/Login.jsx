import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({
    codigo_tienda: '',
    username:      '',
    password:      '',
  })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.codigo_tienda || !form.username || !form.password) {
      setError('Todos los campos son obligatorios.')
      return
    }
    setLoading(true)
    try {
      await login({
        codigo_tienda: form.codigo_tienda.trim().toUpperCase(),
        username:      form.username.trim(),
        password:      form.password,
      })
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data?.codigo_tienda) setError(data.codigo_tienda[0])
      else if (data?.detail)   setError(data.detail)
      else if (data?.non_field_errors) setError(data.non_field_errors[0])
      else setError('Credenciales incorrectas. Verifica el código de tienda, usuario y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 50%, #0f0a1e 100%)' }}>

      {/* Fondo decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
             style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
             style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="white" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            PosFácil
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(196,181,253,0.5)' }}>
            Sistema de Punto de Venta
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-6"
             style={{ boxShadow: '0 32px 80px rgba(124,58,237,0.2)' }}>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Código de tienda */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Código de tienda
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2"
                     style={{ color: '#8b5cf6' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <input
                  name="codigo_tienda"
                  value={form.codigo_tienda}
                  onChange={handleChange}
                  placeholder="TIENDA-001"
                  autoComplete="off"
                  className="input-pos w-full pl-10 pr-4 py-3 rounded-xl text-sm
                             uppercase tracking-widest font-bold"
                />
              </div>
            </div>

            {/* Usuario */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Usuario
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2"
                     style={{ color: '#8b5cf6' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="tu_usuario"
                  autoComplete="username"
                  className="input-pos w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2"
                     style={{ color: '#8b5cf6' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-pos w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
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

            {/* Botón */}
            <button type="submit" disabled={loading}
                    className="w-full btn-primary py-3.5 rounded-xl font-bold text-white
                               text-sm disabled:opacity-50 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center mt-6 gap-1">
          <a href="https://nautilustech.app/" target="_blank" rel="noopener noreferrer">
            <img src="/LogoNautilusTech.png" alt="NautilusTech" className="h-6 opacity-60 hover:opacity-100 transition-opacity" />
            </a>
            <p className="text-center text-xs"
            style={{ color: 'rgba(196,181,253,0.3)' }}>
            Desarrollado por{' '}
            <a href="https://nautilustech.app/" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(0,210,211,0.6)' }}
            className="hover:opacity-100 transition-opacity">
            NautilusTech
          </a>
        </p>
        </div>
      </div>
    </div>
  )
}