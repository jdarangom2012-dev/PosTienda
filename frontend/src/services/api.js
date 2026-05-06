// ============================================================
// 2. src/services/api.js
// ============================================================
import axios from 'axios'

// Base URL — en desarrollo usa el proxy de Vite
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
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
        // Refresh falló — limpiar sesión y redirigir
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('usuario')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

// ── Auto-logout por inactividad (8 horas) ────────────────────
const TIEMPO_INACTIVIDAD = 10 * 60 * 60 * 1000 // 8 horas en ms
let timerInactividad = null

const resetTimer = () => {
  if (timerInactividad) clearTimeout(timerInactividad)
    timerInactividad = setTimeout(() => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }, TIEMPO_INACTIVIDAD)
}

// Detectar actividad del usuario
if (typeof window !== 'undefined') {
  ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetTimer, { passive: true })
  })
  resetTimer() // Iniciar el timer al cargar
}

export default api

export const authService = {
  login:   (data) => api.post('/usuarios/login/',         data),
  logout:  ()     => api.post('/usuarios/logout/'),
  refresh: (data) => api.post('/usuarios/token/refresh/', data),
  perfil:  ()     => api.get('/usuarios/perfil/'),
}

// Servicios de autenticación
export const usuariosService = {
  listar:     (params) => api.get('/usuarios/usuarios/', { params }),
  obtener:    (id)     => api.get(`/usuarios/usuarios/${id}/`),
  crear:      (data)   => api.post('/usuarios/usuarios/', data),
  actualizar: (id, data) => api.patch(`/usuarios/usuarios/${id}/`, data),
  eliminar:   (id)     => api.delete(`/usuarios/usuarios/${id}/`),
  cambiarPassword: (id, data) => api.post(`/usuarios/usuarios/${id}/cambiar-password/`, data),
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
  estado      : ()        => api.get('/ia/chat/'),
  chat        : (mensaje) => api.post('/ia/chat/', { mensaje }),
  predicciones: ()        => api.get('/ia/predicciones/'),
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
export const superAdminService = {
  // Tiendas
  tiendas:        ()          => api.get('/usuarios/tiendas/'),
  tienda:         (id)        => api.get(`/usuarios/tiendas/${id}/`),
  crearTienda:    (data)      => api.post('/usuarios/tiendas/', data),
  actualizarTienda:(id, data) => api.patch(`/usuarios/tiendas/${id}/`, data),
  activarTienda:  (id)        => api.post(`/usuarios/tiendas/${id}/activar/`),
  desactivarTienda:(id)       => api.post(`/usuarios/tiendas/${id}/desactivar/`),
  cambiarPlan:    (id, data)  => api.post(`/usuarios/tiendas/${id}/cambiar-plan/`, data),
  usuariosTienda: (id)        => api.get(`/usuarios/tiendas/${id}/usuarios/`),

  // Usuarios superadmin
  crearAdmin: (data) => api.post('/usuarios/usuarios/', data),
}

// ── Verificar token cada 5 minutos ───────────────────────────
if (typeof window !== 'undefined') {
  setInterval(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    try {
      await api.get('/usuarios/perfil/')
    } catch (err) {
      if (err.response?.status === 401) {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('usuario')
          window.location.href = '/login'
          return
        }
        try {
          const { data } = await axios.post('/api/usuarios/token/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('usuario')
          window.location.href = '/login'
        }
      }
    }
  }, 5 * 60 * 1000)
}
// Servicios de créditos
export const creditosService = {
  listar:   (params) => api.get('/creditos/',              { params }),
  detalle:  (id)     => api.get(`/creditos/${id}/`),
  crear:    (data)   => api.post('/creditos/',              data),
  abonar:   (id, data) => api.post(`/creditos/${id}/abonar/`, data),
  resumen:  ()       => api.get('/creditos/resumen/'),
}
