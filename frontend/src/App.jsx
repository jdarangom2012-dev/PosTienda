// ============================================================
// 5. Actualizar src/App.jsx — versión FINAL completa
// ============================================================
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute  from './components/PrivateRoute'
import Layout        from './components/Layout/Layout'
import Login         from './pages/Auth/Login'
import Dashboard     from './pages/Dashboard/Dashboard'
import POS           from './pages/POS/POS'
import Productos     from './pages/Productos/Productos'
import Inventario    from './pages/Inventario/Inventario'
import Reportes      from './pages/Reportes/Reportes'
import Usuarios      from './pages/Usuarios/Usuarios'
import Categorias    from './pages/Productos/components/Categorias'
import SuperAdmin    from './pages/SuperAdmin/SuperAdmin'
import Creditos      from './pages/Creditos/Creditos'
import Auditoria from './pages/Auditoria/Auditoria'

// ← Componente separado para usar useLocation DENTRO del BrowserRouter
function AppRoutes() {
  const location = useLocation()
  const [categoriasKey, setCategoriasKey] = useState(0)

  // Cada vez que navegas a /categorias incrementa el key
  useEffect(() => {
    if (location.pathname === '/categorias') {
      setCategoriasKey(k => k + 1)
    }
  }, [location.pathname])


  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/pos"        element={<POS />} />
        <Route path="/productos"  element={<Productos />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/reportes"   element={<Reportes />} />
        <Route path="/usuarios"   element={<Usuarios />} />
        <Route path="/categorias" element={<Categorias key={categoriasKey} />} />
        <Route path="/creditos"   element={<Creditos />} />
        <Route path="/auditoria" element={<Auditoria />} />
      </Route>
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      <Route path="/superadmin" element={
        <PrivateRoute roles={['SUPERADMIN']}>
          <SuperAdmin />
        </PrivateRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}