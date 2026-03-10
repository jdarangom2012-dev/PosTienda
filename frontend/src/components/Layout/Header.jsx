import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard':  { title: 'Dashboard',      subtitle: 'Resumen general del negocio' },
  '/pos':        { title: 'Punto de Venta', subtitle: 'Procesar ventas' },
  '/productos':  { title: 'Productos',      subtitle: 'Gestión del catálogo' },
  '/inventario': { title: 'Inventario',     subtitle: 'Control de stock' },
  '/reportes':   { title: 'Reportes & IA',  subtitle: 'Análisis e inteligencia artificial' },
  '/usuarios':   { title: 'Usuarios',       subtitle: 'Gestión del equipo' },
}

export default function Header({ sidebarCollapsed }) {
  const { usuario }  = useAuth()
  const { pathname } = useLocation()
  const pageInfo     = PAGE_TITLES[pathname] || { title: 'PosFácil', subtitle: '' }
  const fecha        = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6 h-16 transition-all duration-300"
      style={{
        left: sidebarCollapsed ? '72px' : '240px',
        background: 'rgba(15, 5, 32, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(139,92,246,0.12)',
      }}>

      <div>
        <h1 className="text-lg font-bold text-white leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>
          {pageInfo.title}
        </h1>
        <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
          {pageInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
             style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
          </svg>
          <span className="text-xs capitalize" style={{ color: 'rgba(196,181,253,0.7)' }}>
            {fecha}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #e879f9)' }}>
            {usuario?.username?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight">
              {usuario?.nombre_completo || usuario?.username}
            </p>
            <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
              {usuario?.rol_display || usuario?.rol}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}