// ============================================================
// 2. src/services/api.js
// ============================================================
import axios from 'axios'

// Base URL — en desarrollo usa el proxy de Vite
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: agrega el token JWT a cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor: si el token expiró, renueva automáticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')

        const { data } = await axios.post('/api/usuarios/token/refresh/', {
          refresh,
        })

        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        // Refresh falló — limpiar sesión
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('usuario')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

export const authService = {
  login:   (data) => api.post('/usuarios/login/',         data),
  logout:  ()     => api.post('/usuarios/logout/'),
  refresh: (data) => api.post('/usuarios/token/refresh/', data),
  perfil:  ()     => api.get('/usuarios/perfil/'),
}

// Servicios de autenticación
export const usuariosService = {
  listar:    (params) => api.get('/usuarios/',         { params }),
  detalle:   (id)     => api.get(`/usuarios/${id}/`),
  crear:     (data)   => api.post('/usuarios/',         data),
  actualizar:(id, d)  => api.patch(`/usuarios/${id}/`, d),
  perfil:    ()       => api.get('/usuarios/perfil/'),
}

// Servicios de productos
export const productosService = {
  listar:       (params) => api.get('/productos/',              { params }),
  buscar:       (q)      => api.get('/productos/buscar/',       { params: { q } }),
  buscarCodigo: (cod)    => api.get('/productos/buscar/',       { params: { q: cod } }),
  detalle:      (id)     => api.get(`/productos/${id}/`),
  crear:        (data)   => api.post('/productos/',              data),
  actualizar:   (id, d)  => api.patch(`/productos/${id}/`,      d),
  eliminar:     (id)     => api.patch(`/productos/${id}/`,      { activo: false }),
  categorias:   ()       => api.get('/productos/categorias/'),
}

// Servicios de inventario
export const inventarioService = {
  listar:      (params) => api.get('/inventario/',              { params }),
  detalle:     (id)     => api.get(`/inventario/${id}/`),
  alertas:     ()       => api.get('/inventario/alertas/'),
  movimientos: (params) => api.get('/inventario/movimientos/',  { params }),
  movimiento:  (data)   => api.post('/inventario/movimientos/', data),
}

// Servicios de ventas
export const ventasService = {
  procesar:      (data)   => api.post('/ventas/procesar/', data),
  cancelar:      (id, m)  => api.post(`/ventas/${id}/cancelar/`, { motivo: m }),
  listar:        (params) => api.get('/ventas/historial/', { params }),
  detalle:       (id)     => api.get(`/ventas/historial/${id}/`),
  hoy:           ()       => api.get('/ventas/historial/hoy/'),
  resumenHoy:    ()       => api.get('/ventas/historial/resumen-hoy/'),
  resumenSemana: ()       => api.get('/ventas/historial/resumen-semana/'),
  formasPago:    ()       => api.get('/ventas/formas-pago/activas/'),
}

// Servicios de IA
export const iaService = {
  chat:         (data)   => api.post('/ia/chat/',         data),
  predicciones: (params) => api.get('/ia/predicciones/',  { params }),
}

// Servicios de auditoría
export const auditoriaService = {
  listar:  (params) => api.get('/auditoria/', { params }),
  resumen: ()       => api.get('/auditoria/resumen/'),
}

// ============================================================
// 2. Actualiza src/services/api.js — agrega categoriasService
// ============================================================
export const categoriasService = {
  listar:    (params) => api.get('/productos/categorias/',         { params }),
  activas:   ()       => api.get('/productos/categorias/activas/'),
  detalle:   (id)     => api.get(`/productos/categorias/${id}/`),
  crear:     (data)   => api.post('/productos/categorias/',         data),
  actualizar:(id, d)  => api.patch(`/productos/categorias/${id}/`, d),
  eliminar:  (id)     => api.patch(`/productos/categorias/${id}/`, { activa: false }),
}
