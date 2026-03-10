// ============================================================
// 3. src/pages/Reportes/components/ResumenPagos.jsx
// ============================================================
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS_PIE = ['#8b5cf6', '#06b6d4', '#4ade80', '#fbbf24', '#f87171']

export default function ResumenPagos({ pagos }) {
  if (!pagos || pagos.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm" style={{ color: 'rgba(196,181,253,0.4)' }}>
          Sin datos de pagos
        </p>
      </div>
    )
  }

  const total = pagos.reduce((s, p) => s + parseFloat(p.total || p.monto || 0), 0)

  return (
    <div>
      <h3 className="text-base font-bold text-white mb-4"
          style={{ fontFamily: 'Syne, sans-serif' }}>
        Formas de pago
      </h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={pagos} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                 dataKey="total" nameKey="forma_pago_nombre" paddingAngle={3}>
              {pagos.map((_, i) => (
                <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(15,10,30,0.95)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '12px',
              }}
              formatter={v => [`$${parseFloat(v).toLocaleString('es-CO')}`]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {pagos.map((p, i) => {
            const monto = parseFloat(p.total || p.monto || 0)
            const pct   = total > 0 ? ((monto / total) * 100).toFixed(1) : 0
            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full"
                          style={{ background: COLORS_PIE[i % COLORS_PIE.length] }} />
                    <span style={{ color: 'rgba(196,181,253,0.7)' }}>
                      {p.forma_pago_nombre || p.nombre}
                    </span>
                  </span>
                  <span className="font-semibold text-white">{pct}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden"
                     style={{ background: 'rgba(139,92,246,0.1)' }}>
                  <div className="h-full rounded-full"
                       style={{
                         width: `${pct}%`,
                         background: COLORS_PIE[i % COLORS_PIE.length],
                       }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}