// ============================================================
// REPORTES & IA — PosFácil
// ============================================================
// Archivos a crear:
//
//  src/pages/Reportes/Reportes.jsx
//  src/pages/Reportes/components/GraficaVentas.jsx
//  src/pages/Reportes/components/GraficaProductos.jsx
//  src/pages/Reportes/components/Chatbot.jsx
//  src/pages/Reportes/components/ResumenPagos.jsx
// ============================================================


// ============================================================
// 1. src/pages/Reportes/components/GraficaVentas.jsx
// ============================================================
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-4 py-3 rounded-xl text-sm"
         style={{
           background: 'rgba(15,10,30,0.95)',
           border: '1px solid rgba(139,92,246,0.3)',
           boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
         }}>
      <p className="font-bold text-white mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'ingresos'
            ? `💰 $${parseFloat(p.value).toLocaleString('es-CO')}`
            : `🛒 ${p.value} ventas`}
        </p>
      ))}
    </div>
  )
}
export default function GraficaVentas({ datos, titulo, periodo }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <p className="text-sm" style={{ color: 'rgba(196,181,253,0.4)' }}>
          Sin datos para mostrar
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white"
            style={{ fontFamily: 'Syne, sans-serif' }}>
          {titulo}
        </h3>
        <span className="text-xs px-2 py-1 rounded-lg"
              style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
          {periodo}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={datos} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gradCantidad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
          <XAxis dataKey="fecha" tick={{ fill: 'rgba(196,181,253,0.4)', fontSize: 11 }}
                 axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: 'rgba(196,181,253,0.4)', fontSize: 11 }}
                 axisLine={false} tickLine={false}
                 tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <YAxis yAxisId="right" orientation="right"
                 tick={{ fill: 'rgba(196,181,253,0.4)', fontSize: 11 }}
                 axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area yAxisId="left" type="monotone" dataKey="ingresos" name="ingresos"
                stroke="#8b5cf6" strokeWidth={2}
                fill="url(#gradIngresos)" />
          <Area yAxisId="right" type="monotone" dataKey="cantidad" name="cantidad"
                stroke="#06b6d4" strokeWidth={2}
                fill="url(#gradCantidad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
