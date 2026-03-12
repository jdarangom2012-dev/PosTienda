// ============================================================
// USUARIOS — PosFácil
// ============================================================
// Archivos a crear:
//
//  src/pages/Usuarios/Usuarios.jsx
//  src/pages/Usuarios/components/TarjetaUsuario.jsx
//  src/pages/Usuarios/components/ModalUsuario.jsx
// ============================================================


// ============================================================
// 1. src/pages/Usuarios/components/TarjetaUsuario.jsx
// ============================================================
const ROL_CONFIG = {
  ADMIN:       { label: 'Coordinador', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  COORDINADOR: { label: 'Coordinador', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  CAJERO:      { label: 'Cajero',        color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  ALMACENISTA: { label: 'Almacenista',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
}

export default function TarjetaUsuario({ usuario, onEditar, onToggle, esYo }) {
  const rol = ROL_CONFIG[usuario.rol] || ROL_CONFIG.CAJERO
  const inicial = (usuario.nombre_completo || usuario.username || '?')[0].toUpperCase()

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200
                    hover:scale-[1.02]"
         style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>

      {/* Avatar + info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                        text-lg font-black text-white flex-shrink-0"
             style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      fontFamily: 'Syne, sans-serif' }}>
          {inicial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-white text-sm truncate"
               style={{ fontFamily: 'Syne, sans-serif' }}>
              {usuario.nombre_completo || usuario.username}
            </p>
            {esYo && (
              <span className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                Tú
              </span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: 'rgba(196,181,253,0.5)' }}>
            @{usuario.username}
          </p>
        </div>
      </div>

      {/* Email */}
      <p className="text-xs truncate" style={{ color: 'rgba(196,181,253,0.4)' }}>
        {usuario.email || 'Sin email'}
      </p>
      {/* Tienda */}  {/* ← agregar esto */}
      <p className="text-xs truncate flex items-center gap-1"
        style={{ color: 'rgba(196,181,253,0.4)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
        {usuario.tienda_nombre || 'Sin tienda'}
      </p>

      {/* Rol + estado */}
      <div className="flex items-center justify-between">
        <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
              style={{ background: rol.bg, color: rol.color }}>
          {rol.label}
        </span>
        <span className="text-xs px-2 py-1 rounded-lg"
              style={{
                background: usuario.is_active
                  ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                color: usuario.is_active ? '#4ade80' : '#f87171',
              }}>
          {usuario.is_active ? '● Activo' : '● Inactivo'}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1"
           style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <button onClick={() => onEditar(usuario)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  color: '#a78bfa',
                }}>
          Editar
        </button>
        {!esYo && (
          <button onClick={() => onToggle(usuario)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                  style={{
                    background: usuario.is_active
                      ? 'rgba(239,68,68,0.08)' : 'rgba(74,222,128,0.08)',
                    border: `1px solid ${usuario.is_active
                      ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
                    color: usuario.is_active ? '#f87171' : '#4ade80',
                  }}>
            {usuario.is_active ? 'Desactivar' : 'Activar'}
          </button>
        )}
      </div>
    </div>
  )
}