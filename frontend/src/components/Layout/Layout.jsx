// ============================================================
// 3. src/components/Layout/Layout.jsx
// ============================================================
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header  from './Header'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#0f0520' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header  sidebarCollapsed={collapsed} />

      {/* Contenido principal */}
      <main
        className="transition-all duration-300 pt-16 min-h-screen"
        style={{
          marginLeft: collapsed ? '72px' : '240px',
          background: 'linear-gradient(135deg, #0f0520 0%, #1a0a2e 50%, #0d1117 100%)',
        }}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
