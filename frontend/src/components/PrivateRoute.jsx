// ============================================================
// 4. src/components/PrivateRoute.jsx
// ============================================================
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, roles = [] }) {
  const { estaAutenticado, usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'var(--purple-950)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-purple-500
                          border-t-transparent animate-spin" />
          <p className="text-purple-300 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!estaAutenticado) return <Navigate to="/login" replace />

  if (roles.length > 0 && !roles.includes(usuario?.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
