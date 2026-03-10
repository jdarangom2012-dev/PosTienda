// ============================================================
// 5. src/pages/Reportes/Reportes.jsx
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { ventasService, iaService } from '../../services/api'
import GraficaVentas    from './components/GraficaVentas'
import GraficaProductos from './components/GraficaProductos'
import ResumenPagos     from './components/ResumenPagos'
import Chatbot          from './components/Chatbot'

const PERIODOS = [
  { id: 'hoy',    label: 'Hoy'      },
  { id: 'semana', label: '7 días'   },
  { id: 'mes',    label: '30 días'  },
]

export default function Reportes() {
  const [periodo,    setPeriodo]    = useState('semana')
  const [resumen,    setResumen]    = useState(null)
  const [graficaData,setGraficaData]= useState([])
  const [productos,  setProductos]  = useState([])
  const [pagos,      setPagos]      = useState([])
  const [loading,    setLoading]    = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [resHoy, resSem, ventas] = await Promise.allSettled([
        ventasService.resumenHoy(),
        ventasService.resumenSemana(),
        ventasService.listar({ page_size: 100 }),
      ])

      // Resumen según período
      if (periodo === 'hoy' && resHoy.status === 'fulfilled') {
        setResumen(resHoy.value.data)
      } else if (resSem.status === 'fulfilled') {
        setResumen(resSem.value.data)
      }

      // Datos para gráfica
      if (resSem.status === 'fulfilled') {
        const d = resSem.value.data
        setGraficaData(d.por_dia || d.ventas_por_dia || [])
        setProductos(d.top_productos || d.productos_top || [])
        setPagos(d.por_forma_pago || d.formas_pago || [])
      }

    } catch (err) {
      console.error('Error cargando reportes:', err)
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => { cargar() }, [cargar])

  const fmt = (v) => parseFloat(v || 0).toLocaleString('es-CO')

  const STATS = [
    {
      label:    'Total ventas',
      value:    resumen?.total_ventas || resumen?.cantidad_ventas || '—',
      sub:      'transacciones',
      color:    '#8b5cf6',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ),
    },
    {
      label:    'Ingresos',
      value:    `$${fmt(resumen?.total_ingresos || resumen?.ingresos_totales)}`,
      sub:      'en el período',
      color:    '#4ade80',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label:    'Ticket promedio',
      value:    `$${fmt(resumen?.ticket_promedio || resumen?.promedio_venta)}`,
      sub:      'por venta',
      color:    '#06b6d4',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      label:    'Canceladas',
      value:    resumen?.ventas_canceladas || resumen?.canceladas || '0',
      sub:      'ventas',
      color:    '#f87171',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9"  y2="15"/>
          <line x1="9"  y1="9" x2="15" y2="15"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Reportes & IA
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
            Análisis de ventas e inteligencia artificial
          </p>
        </div>
        {/* Selector período */}
        <div className="flex gap-1 p-1 rounded-xl"
             style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
          {PERIODOS.map(p => (
            <button key={p.id} onClick={() => setPeriodo(p.id)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={periodo === p.id ? {
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      color: 'white',
                    } : {
                      color: 'rgba(196,181,253,0.5)',
                    }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: `${s.color}20`, color: s.color }}>
                {s.icon}
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-24 rounded-lg animate-pulse"
                   style={{ background: 'rgba(139,92,246,0.1)' }} />
            ) : (
              <p className="text-2xl font-black text-white"
                 style={{ fontFamily: 'Syne, sans-serif' }}>
                {s.value}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.4)' }}>
              {s.label} · {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfica ventas — 2/3 */}
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          {loading ? (
            <div className="h-48 rounded-xl animate-pulse"
                 style={{ background: 'rgba(139,92,246,0.05)' }} />
          ) : (
            <GraficaVentas
              datos={graficaData}
              titulo="Evolución de ventas"
              periodo={PERIODOS.find(p => p.id === periodo)?.label}
            />
          )}
        </div>

        {/* Formas de pago — 1/3 */}
        <div className="glass rounded-2xl p-5">
          {loading ? (
            <div className="h-48 rounded-xl animate-pulse"
                 style={{ background: 'rgba(139,92,246,0.05)' }} />
          ) : (
            <ResumenPagos pagos={pagos} />
          )}
        </div>
      </div>

      {/* Top productos + Chatbot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top productos */}
        <div className="glass rounded-2xl p-5">
          {loading ? (
            <div className="h-48 rounded-xl animate-pulse"
                 style={{ background: 'rgba(139,92,246,0.05)' }} />
          ) : (
            <GraficaProductos productos={productos} />
          )}
        </div>

        {/* Chatbot IA */}
        <div className="glass rounded-2xl p-5">
          <Chatbot />
        </div>
      </div>

    </div>
  )
}

