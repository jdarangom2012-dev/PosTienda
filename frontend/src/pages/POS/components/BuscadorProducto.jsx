import { useState, useRef, useEffect } from 'react'
import { productosService } from '../../../services/api'

export default function BuscadorProducto({ onAgregar, inputRef: externalRef }) {
  const [query,          setQuery]          = useState('')
  const [resultados,     setResultados]     = useState([])
  const [buscando,       setBuscando]       = useState(false)
  const [mostrar,        setMostrar]        = useState(false)
  const [productosCache, setProductosCache] = useState([])
  const [isOnline,       setIsOnline]       = useState(navigator.onLine)
  const internalRef = useRef(null)
  const timerRef    = useRef(null)
  const inputRef    = externalRef || internalRef

  // ── Online/Offline ───────────────────────────────────────
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ── Cargar caché de productos desde localStorage ─────────
  useEffect(() => {
    const cached = localStorage.getItem('pos_productos_cache')
    if (cached) {
      try {
        setProductosCache(JSON.parse(cached))
      } catch { setProductosCache([]) }
    }
  }, [])

  // ── Foco automático ──────────────────────────────────────
  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const enfocar = () => setTimeout(() => inputRef.current?.focus(), 100)
    enfocar()
    window.addEventListener('pos:focus', enfocar)
    return () => window.removeEventListener('pos:focus', enfocar)
  }, [])

  // ── Seleccionar producto ─────────────────────────────────
  const seleccionar = (producto) => {
    onAgregar(producto)
    setQuery('')
    setResultados([])
    setMostrar(false)
    inputRef.current?.focus()
  }

  // ── Buscar ───────────────────────────────────────────────
  const buscar = async (valor) => {
    setQuery(valor)
    if (!valor.trim()) { setResultados([]); setMostrar(false); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        if (!isOnline) {
          const q = valor.toLowerCase()
          const encontrados = productosCache.filter(p =>
            p.nombre?.toLowerCase().includes(q) ||
            p.codigo_barras?.includes(q)
          ).slice(0, 6)
          setResultados(encontrados)
          setMostrar(true)
        } else {
          const { data } = await productosService.buscar(valor)
          setResultados(data.results || data)
          setMostrar(true)
        }
      } catch {
        const q = valor.toLowerCase()
        const encontrados = productosCache.filter(p =>
          p.nombre?.toLowerCase().includes(q) ||
          p.codigo_barras?.includes(q)
        ).slice(0, 6)
        setResultados(encontrados)
        setMostrar(true)
      } finally {
        setBuscando(false)
      }
    }, 300)
  }

  // ── Enter / código de barras ─────────────────────────────
  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && query.trim()) {
      try {
        if (!isOnline) {
          const q = query.trim().toLowerCase()
          const encontrado = productosCache.find(p =>
            p.codigo_barras === query.trim() ||
            p.nombre?.toLowerCase().includes(q)
          )
          if (encontrado) seleccionar(encontrado)
        } else {
          const { data } = await productosService.buscarCodigo(query.trim())
          if (data.results?.length > 0 || data.length > 0) {
            seleccionar(data.results?.[0] || data[0])
          }
        }
      } catch {}
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8b5cf6' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => buscar(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar producto o escanear código de barras..."
          className="input-pos w-full pl-12 pr-4 py-4 rounded-2xl text-sm font-medium"
          style={{ fontSize: '15px' }}
        />
        {buscando && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {mostrar && resultados.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-[9999]"
             style={{ background: '#1a0a2e', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {resultados.slice(0, 6).map(p => (
            <button key={p.id} onClick={() => seleccionar(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-purple-900/30"
                    style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(139,92,246,0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{p.nombre}</p>
                <p className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>
                  {p.codigo_barras} • Stock: {p.stock_actual}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: '#a78bfa' }}>
                  ${parseFloat(p.precio_venta).toLocaleString('es-CO')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {mostrar && resultados.length === 0 && !buscando && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl px-4 py-6 text-center z-[9999]"
             style={{ background: '#1a0a2e', border: '1px solid rgba(139,92,246,0.2)' }}>
          <p className="text-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
            No se encontraron productos
          </p>
        </div>
      )}
    </div>
  )
}