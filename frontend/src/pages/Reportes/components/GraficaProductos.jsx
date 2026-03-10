// ============================================================
// 2. src/pages/Reportes/components/GraficaProductos.jsx
// ============================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const COLORS = ['#8b5cf6','#a855f7','#7c3aed','#6d28d9','#5b21b6','#4c1d95']

export default function GraficaProductos({ productos }) {
  if (!productos || productos.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm" style={{ color: 'rgba(196,181,253,0.4)' }}>
          Sin datos de productos
        </p>
      </div>
    )
  }

  const datos = productos.slice(0, 6).map(p => ({
    nombre: p.producto_nombre?.length > 12
      ? p.producto_nombre.substring(0, 12) + '…'
      : p.producto_nombre,
    vendidos: parseFloat(p.total_vendido) || p.cantidad || 0,
    ingresos: parseFloat(p.total_ingresos) || 0,
  }))

  return (
    <div>
      <h3 className="text-base font-bold text-white mb-4"
          style={{ fontFamily: 'Syne, sans-serif' }}>
        Top productos más vendidos
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={datos} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" vertical={false} />
          <XAxis dataKey="nombre" tick={{ fill: 'rgba(196,181,253,0.4)', fontSize: 10 }}
                 axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(196,181,253,0.4)', fontSize: 11 }}
                 axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'rgba(15,10,30,0.95)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '12px',
              color: 'white',
            }}
            formatter={(v, n) => [v, n === 'vendidos' ? 'Unidades' : 'Ingresos']}
          />
          <Bar dataKey="vendidos" radius={[6, 6, 0, 0]}>
            {datos.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}