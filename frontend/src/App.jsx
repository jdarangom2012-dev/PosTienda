// ============================================================
// 5. Actualizar src/App.jsx — versión FINAL completa
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import Categorias from './pages/Productos/components/Categorias'
import SuperAdmin from './pages/SuperAdmin/SuperAdmin'



export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/pos"        element={<POS />} />
            <Route path="/productos"  element={<Productos />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/reportes"   element={<Reportes />} />
            <Route path="/usuarios"   element={<Usuarios />} />
            <Route path="/categorias" element={<Categorias />} />
          </Route>
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          <Route path="/superadmin" element={
          <PrivateRoute roles={['SUPERADMIN']}>
            <SuperAdmin />
          </PrivateRoute>
        } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
















