// ============================================================
// 3. src/context/AuthContext.jsx
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null)
  const [cargando, setCargando] = useState(true)

  // Al montar, restaurar sesión si hay token guardado
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario')
    const token           = localStorage.getItem('access_token')
    if (usuarioGuardado && token) {
      setUsuario(JSON.parse(usuarioGuardado))
    }
    setCargando(false)
  }, [])

const login = async (credentials) => {
  const { data } = await authService.login(credentials)
  localStorage.setItem('access_token',  data.access)
  localStorage.setItem('refresh_token', data.refresh)
  localStorage.setItem('usuario',       JSON.stringify(data.usuario))
  setUsuario(data.usuario)
}

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) await authService.logout(refresh)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('usuario')
      setUsuario(null)
    }
  }

  const esAdmin      = usuario?.rol === 'ADMIN'
  const esCajero     = usuario?.rol === 'CAJERO'
  const esAlmacenista= usuario?.rol === 'ALMACENISTA'

  return (
    <AuthContext.Provider value={{
      usuario, cargando, login, logout,
      esAdmin, esCajero, esAlmacenista,
      estaAutenticado: !!usuario,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
