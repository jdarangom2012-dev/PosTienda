// ============================================================
// 8. src/pages/Dashboard/Dashboard.jsx
// ============================================================
import { useEffect, useState } from 'react'
import { ventasService, inventarioService, creditosService } from '../../services/api'
import StatCard      from './components/StatCard'
import VentasChart   from './components/VentasChart'
import AlertasStock  from './components/AlertasStock'
import UltimasVentas from './components/UltimasVentas'

export default function Dashboard() {
  const [resumen,  setResumen]  = useState(null)
  const [semana,   setSemana]   = useState([])
  const [alertas,  setAlertas]  = useState([])
  const [ventasHoy, setVentasHoy] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [cartera, setCartera] = useState(null)
  const [cuentasAbiertas, setCuentasAbiertas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_cuentas') || '[]') }
    catch { return [] }
  })

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      try {
        const [r, s, a, v, c] = await Promise.all([
          ventasService.resumenHoy(),
          ventasService.resumenSemana(),
          inventarioService.alertas(),
          ventasService.hoy(),
          creditosService.resumen(),
        ])
        setResumen(r.data)
        setSemana(s.data.por_dia || [])
        setAlertas(a.data.productos || [])
        setVentasHoy(v.data || [])
        setCartera(c.data)
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const formatCOP = (n) =>
    `$${parseFloat(n || 0).toLocaleString('es-CO')}`

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Bienvenida */}
      <div>
        <h2 className="text-2xl font-black text-white"
            style={{ fontFamily: 'Syne, sans-serif' }}>
          Resumen del día 📊
        </h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(196,181,253,0.5)' }}>
          Todo lo que necesitas saber de un vistazo
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Ventas hoy"
          value={resumen?.total_ventas ?? '—'}
          subtitle="Transacciones completadas"
          color="#8b5cf6"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          }
        />
        <StatCard
          title="Ingresos hoy"
          value={formatCOP(resumen?.total_ingresos)}
          subtitle="Total cobrado"
          color="#e879f9"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
        />
        <StatCard
          title="Alertas stock"
          value={alertas.length}
          subtitle="Productos bajo mínimo"
          color="#fbbf24"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
        />
        <StatCard
          title="Canceladas hoy"
          value={resumen?.total_canceladas ?? '—'}
          subtitle="Ventas canceladas"
          color="#06b6d4"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9"  y1="9" x2="15" y2="15"/>
            </svg>
          }
        />
        <StatCard
          title="Cartera"
          value={formatCOP(cartera?.total_cartera)}
          subtitle={`${cartera?.total_clientes || 0} clientes con deuda`}
          color="#f59e0b"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          }
        />
        <StatCard
          title="Cuentas abiertas"
          value={cuentasAbiertas.length}
          subtitle={cuentasAbiertas.length === 0 ? 'Sin cuentas pendientes' : `$${cuentasAbiertas.reduce((s,c) => s + c.total, 0).toLocaleString('es-CO')} pendiente`}
          color="#4ade80"
          loading={false}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          }
        />
      </div>

      {/* Gráfica + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Gráfica ventas semana */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white"
                  style={{ fontFamily: 'Syne, sans-serif' }}>
                Ventas últimos 7 días
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(196,181,253,0.4)' }}>
                Ingresos y cantidad de ventas
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs"
                 style={{ color: 'rgba(196,181,253,0.5)' }}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block"
                      style={{ background: '#8b5cf6' }} />
                Ingresos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block"
                      style={{ background: '#e879f9' }} />
                Cantidad
              </span>
            </div>
          </div>
          <VentasChart data={semana} loading={loading} />
        </div>

        {/* Alertas stock */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white"
                style={{ fontFamily: 'Syne, sans-serif' }}>
              Alertas de Stock
            </h3>
            {alertas.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                {alertas.length}
              </span>
            )}
          </div>
          <AlertasStock alertas={alertas} loading={loading} />
        </div>
      </div>

      {/* Últimas ventas + Pagos por forma */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Últimas ventas */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white"
                style={{ fontFamily: 'Syne, sans-serif' }}>
              Últimas ventas de hoy
            </h3>
            <span className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
              {ventasHoy.length} ventas
            </span>
          </div>
          <UltimasVentas ventas={ventasHoy} loading={loading} />
        </div>

        {/* Pagos por forma */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Pagos por forma
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl animate-pulse"
                     style={{ background: 'rgba(139,92,246,0.05)' }} />
              ))}
            </div>
          ) : resumen?.pagos_por_forma?.length > 0 ? (
            <div className="space-y-3">
              {resumen.pagos_por_forma.map((pago, i) => {
                const colors = ['#8b5cf6','#e879f9','#06b6d4','#fbbf24','#4ade80']
                const color  = colors[i % colors.length]
                const total  = resumen.pagos_por_forma.reduce((s, p) => s + p.total, 0)
                const pct    = total > 0 ? (pago.total / total * 100) : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-white">{pago.forma_pago__nombre}</span>
                      <span style={{ color: 'rgba(196,181,253,0.6)' }}>
                        ${parseFloat(pago.total).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden"
                         style={{ background: 'rgba(139,92,246,0.1)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                           style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-center py-8"
               style={{ color: 'rgba(196,181,253,0.3)' }}>
              Sin ventas hoy
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

