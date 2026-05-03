// ============================================================
// 5. src/pages/Dashboard/components/VentasChart.jsx
// ============================================================
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-4 py-3 text-xs"
           style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
        <p className="font-bold text-white mb-1">{label}</p>
        <p style={{ color: '#a78bfa' }}>
          Ventas: <span className="font-bold text-white">
            ${payload[0]?.value?.toLocaleString('es-CO')}
          </span>
        </p>
        <p style={{ color: '#e879f9' }}>
          Cantidad: <span className="font-bold text-white">{payload[1]?.value}</span>
        </p>
      </div>
    )
  }
  return null
}
export default function VentasChart({ data, loading }) {
  if (loading) {
    return (
      <div className="h-64 rounded-xl animate-pulse"
           style={{ background: 'rgba(139,92,246,0.05)' }} />
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center rounded-xl"
           style={{ background: 'rgba(139,92,246,0.05)' }}>
        <p className="text-sm" style={{ color: 'rgba(196,181,253,0.4)' }}>
          No hay datos de ventas esta semana
        </p>
      </div>
    )
  }

  const formatted = data.map(d => ({
    ...d,
    dia: new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
      weekday: 'short', day: 'numeric'
    }),
    ingresos: parseFloat(d.ingresos) || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={formatted} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="gradCantidad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#e879f9" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#e879f9" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
        <XAxis dataKey="dia" tick={{ fill: 'rgba(196,181,253,0.5)', fontSize: 11 }}
               axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'rgba(196,181,253,0.5)', fontSize: 11 }}
               axisLine={false} tickLine={false}
               tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="ingresos" stroke="#8b5cf6"
              strokeWidth={2} fill="url(#gradVentas)" />
        <Area type="monotone" dataKey="cantidad" stroke="#e879f9"
              strokeWidth={2} fill="url(#gradCantidad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

