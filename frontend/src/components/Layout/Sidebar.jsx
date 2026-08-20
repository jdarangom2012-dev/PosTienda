// ============================================================
// LAYOUT PRINCIPAL + DASHBOARD — PosFácil
// ============================================================
// Archivos a crear:
//
//  src/components/Layout/Sidebar.jsx
//  src/components/Layout/Header.jsx
//  src/components/Layout/Layout.jsx
//  src/pages/Dashboard/Dashboard.jsx
//  src/pages/Dashboard/components/StatCard.jsx
//  src/pages/Dashboard/components/VentasChart.jsx
//  src/pages/Dashboard/components/AlertasStock.jsx
//  src/pages/Dashboard/components/UltimasVentas.jsx
// ============================================================


// ============================================================
// 1. src/components/Layout/Sidebar.jsx
// ============================================================
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'



const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    roles: ['COORDINADOR', 'CAJERO', 'ALMACENISTA'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    path: '/pos',
    label: 'Punto de Venta',
    roles: ['COORDINADOR', 'CAJERO'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
{
  path:  '/categorias',
  label: 'Categorías',
  roles: ['COORDINADOR'],  
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
},
  {
    path: '/productos',
    label: 'Productos',
    roles: ['COORDINADOR'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="17"/>
        <line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
      </svg>
    ),
  },
  {
    path: '/inventario',
    label: 'Inventario',
    roles: ['COORDINADOR', 'ALMACENISTA'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    path: '/creditos',
    label: 'Créditos',
    roles: ['COORDINADOR'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  // DESPUÉS del item de Créditos
{
  path: '/auditoria',
  label: 'Auditoría',
  roles: ['COORDINADOR', 'SUPERADMIN'],
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
},
  {
    path: '/reportes',
    label: 'Reportes & IA',
    roles: ['COORDINADOR'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
        <path d="M2 20h20"/>
      </svg>
    ),
  },
  {
    path: '/usuarios',
    label: 'Usuarios',
    roles: ['SUPERADMIN'],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  { 
    path: '/superadmin', 
    label: 'Super Admin', 
    roles: ['SUPERADMIN'], 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  } 
]

function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sideLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#a78bfa"/>
          <stop offset="50%"  stopColor="#e879f9"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#sideLogoGrad)" opacity="0.15"/>
      <rect x="10" y="18" width="28" height="18" rx="3"
            stroke="url(#sideLogoGrad)" strokeWidth="2" fill="none"/>
      <rect x="14" y="22" width="8" height="5" rx="1.5"
            fill="url(#sideLogoGrad)" opacity="0.8"/>
      <rect x="26" y="22" width="8" height="5" rx="1.5"
            fill="url(#sideLogoGrad)" opacity="0.5"/>
      <rect x="14" y="30" width="20" height="2" rx="1"
            fill="url(#sideLogoGrad)" opacity="0.4"/>
      <rect x="16" y="12" width="16" height="7" rx="2"
            stroke="url(#sideLogoGrad)" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <circle cx="38" cy="12" r="4" fill="url(#sideLogoGrad)" opacity="0.9"/>
      <circle cx="38" cy="12" r="2" fill="white" opacity="0.6"/>
    </svg>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(navigator.onLine)  
  const itemsVisibles = NAV_ITEMS.filter(item =>
    item.roles.includes(usuario?.rol)
  )

  useEffect(() => {                                             // ← nuevo
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const handleLogout = async () => {
    if (!isOnline) return   // ← bloqueo extra de seguridad
    await logout()
    navigate('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '240px',
        background: 'linear-gradient(180deg, #1a0a2e 0%, #0f0520 100%)',
        borderRight: '1px solid rgba(139, 92, 246, 0.15)',
      }}>

      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-16"
           style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
        <div className="flex-shrink-0">
          <LogoIcon size={36} />
        </div>
        {!collapsed && (
          <span className="font-black text-xl gradient-text"
                style={{ fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap' }}>
            PosFácil
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {itemsVisibles.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (item.path === '/categorias') {
                setTimeout(() => window.dispatchEvent(new Event('categorias:focus')), 200)
              }
              if (item.path === '/productos') {
                setTimeout(() => window.dispatchEvent(new Event('productos:focus')), 200)
              }
              if (item.path === '/inventario') {
                setTimeout(() => window.dispatchEvent(new Event('inventario:focus')), 200)
              }
              if (item.path === '/creditos') {
                setTimeout(() => window.dispatchEvent(new Event('creditos:focus')), 200)
              }
              if (item.path === '/pos') {
                setTimeout(() => window.dispatchEvent(new Event('pos:focus')), 200)
              }
              if (item.path === '/auditoria') {
                setTimeout(() => window.dispatchEvent(new Event('auditoria:focus')), 200)
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
              ${isActive ? 'text-white' : 'text-purple-300 hover:text-white'}`
            }
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.2))',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.2)',
            } : {
              border: '1px solid transparent',
            }}>
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="text-sm font-medium truncate"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Usuario + logout */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
               style={{ background: 'rgba(139,92,246,0.08)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #7c3aed, #e879f9)', color: 'white' }}>
              {usuario?.username?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {usuario?.nombre_completo || usuario?.username}
              </p>
              <p className="text-xs truncate" style={{ color: 'rgba(196,181,253,0.5)' }}>
                {usuario?.rol_display || usuario?.rol}
              </p>
            </div>
          </div>
        )}

        <button
            onClick={handleLogout}
            disabled={!isOnline}
            title={!isOnline ? 'No puedes cerrar sesión sin conexión a internet' : ''}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-sm transition-all duration-200 group"
            style={{
              color: 'rgba(196,181,253,0.5)',
              opacity: !isOnline ? 0.4 : 1,                    // ← feedback visual
              cursor: !isOnline ? 'not-allowed' : 'pointer',    // ← feedback visual
            }}
            onMouseEnter={e => { if (isOnline) e.currentTarget.style.color = '#fca5a5' }}
            onMouseLeave={e => { if (isOnline) e.currentTarget.style.color = 'rgba(196,181,253,0.5)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className="flex-shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        {/* Logo NautilusTech */}
        {!collapsed && (
          <a href="https://nautilustech.app/" target="_blank" rel="noopener noreferrer"
             className="flex flex-col items-center gap-1 mt-2 py-2 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/LogoNautilusTech.png" alt="NautilusTech" className="h-5" />
            <span className="text-xs" style={{ color: 'rgba(0,210,211,0.6)', fontSize: '10px' }}>
              nautilustech.app
            </span>
          </a>
        )}
      </div>

      {/* Toggle collapse */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center
                   justify-center transition-all duration-200 hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          border: '2px solid rgba(139,92,246,0.3)',
          boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
        }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
             stroke="white" strokeWidth="3" strokeLinecap="round">
          {collapsed
            ? <polyline points="9 18 15 12 9 6"/>
            : <polyline points="15 18 9 12 15 6"/>
          }
        </svg>
      </button>
    </aside>
  )
}
