// ============================================================
// 6. src/pages/Dashboard/components/AlertasStock.jsx
// ============================================================
import { useNavigate } from 'react-router-dom'

export default function AlertasStock({ alertas, loading }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl animate-pulse"
               style={{ background: 'rgba(139,92,246,0.05)' }} />
        ))}
      </div>
    )
  }

  if (!alertas || alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
             style={{ background: 'rgba(74,222,128,0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="#4ade80" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-white">Todo en orden</p>
        <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
          No hay productos con stock bajo
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alertas.slice(0, 5).map((item) => {
        const pct = item.stock_minimo > 0
          ? (item.cantidad_actual / item.stock_minimo) * 100
          : 0
        const critico = pct <= 30

        return (
          <div key={item.id}
               className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                          cursor-pointer hover:scale-[1.01]"
               style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}
               onClick={() => navigate('/inventario')}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${critico ? 'animate-pulse' : ''}`}
                 style={{ background: critico ? '#f87171' : '#fbbf24' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {item.producto_nombre}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 rounded-full overflow-hidden"
                     style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <div className="h-full rounded-full transition-all"
                       style={{
                         width: `${Math.min(pct, 100)}%`,
                         background: critico
                           ? 'linear-gradient(90deg, #ef4444, #f87171)'
                           : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                       }} />
                </div>
                <span className="text-xs flex-shrink-0"
                      style={{ color: 'rgba(196,181,253,0.5)' }}>
                  {item.cantidad_actual}/{item.stock_minimo}
                </span>
              </div>
            </div>
          </div>
        )
      })}
      {alertas.length > 5 && (
        <button onClick={() => navigate('/inventario')}
                className="w-full text-xs py-2 rounded-xl transition-all"
                style={{ color: '#a78bfa' }}>
          Ver {alertas.length - 5} más →
        </button>
      )}
    </div>
  )
}
