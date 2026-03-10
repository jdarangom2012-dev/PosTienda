// ============================================================
// 4. src/pages/Dashboard/components/StatCard.jsx
// ============================================================
export default function StatCard({ title, value, subtitle, icon, color = '#8b5cf6', trend, loading }) {
  return (
    <div className="glass rounded-2xl p-5 animate-fade-in"
         style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span className="text-xs px-2 py-1 rounded-lg font-medium"
                style={{
                  background: trend >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color:      trend >= 0 ? '#4ade80' : '#f87171',
                  border:     `1px solid ${trend >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 rounded-lg animate-pulse" style={{ background: 'rgba(139,92,246,0.1)' }} />
          <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: 'rgba(139,92,246,0.08)' }} />
        </div>
      ) : (
        <>
          <p className="text-2xl font-black text-white mb-1"
             style={{ fontFamily: 'Syne, sans-serif' }}>
            {value}
          </p>
          <p className="text-xs font-medium" style={{ color: 'rgba(196,181,253,0.6)' }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.4)' }}>
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  )
}