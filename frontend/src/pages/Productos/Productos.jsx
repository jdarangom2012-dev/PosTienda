// ============================================================
// 3. src/pages/Productos/Productos.jsx
// ============================================================
import { useState, useEffect, useRef  } from 'react'
import { productosService } from '../../services/api'
import TarjetaProducto from './components/TarjetaProducto'
import ModalProducto   from './components/ModalProducto'


  const POR_PAGINA = 12  // ← FUERA del componente

export default function Productos() {
  const [productos,    setProductos]   = useState([])
  const [categorias,   setCategorias]  = useState([])
  const [loading,      setLoading]     = useState(true)
  const [busqueda,     setBusqueda]    = useState('')
  const [categoria,    setCategoria]   = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoEdit, setProductoEdit] = useState(null)
  const [pagina,       setPagina]      = useState(1)
  const [total,        setTotal]       = useState(0)
  const busquedaRef = useRef(null)

  const cargar = async (pag = 1, bus = '', cat = '') => {
    setLoading(true)
    try {
      const params = { page: pag, page_size: POR_PAGINA }
      if (bus) params.search    = bus
      if (cat) params.categoria = cat
      const { data } = await productosService.listar(params)
      setProductos(data.results || data)
      setTotal(data.count || (data.results || data).length)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Categorías — solo una vez
  useEffect(() => {
    productosService.categorias().then(({ data }) =>
      setCategorias(data.results || data)
    )
    cargar(1, '', '')  // ← carga inicial aquí también
  }, [])

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => cargar(1, busqueda, categoria), 400)
    return () => clearTimeout(t)
  }, [busqueda])

  useEffect(() => {
    const enfocar = () => setTimeout(() => busquedaRef.current?.focus(), 100)
    enfocar()
    window.addEventListener('productos:focus', enfocar)
    return () => window.removeEventListener('productos:focus', enfocar)
  }, [])

  // Cambio de categoría
  useEffect(() => {
    cargar(1, busqueda, categoria)
  }, [categoria])
  // Cambio de página
  useEffect(() => {
    if (pagina === 1) return  // evita doble carga inicial
    cargar(pagina, busqueda, categoria)
  }, [pagina])

const handleNuevo = () => {
  setProductoEdit(null)
  setModalAbierto(true)
}

const handleEditar = (producto) => {
  setProductoEdit(producto)
  setModalAbierto(true)
}

const handleEliminar = async (producto) => {
  if (!window.confirm(`¿Desactivar "${producto.nombre}"?`)) return
  try {
    await productosService.eliminar(producto.id)
    cargar(pagina, busqueda, categoria)
  } catch {
    alert('Error al desactivar el producto.')
  }
}

const handleGuardado = () => {
  setModalAbierto(false)
  setProductoEdit(null)
  cargar(pagina, busqueda, categoria)
}

const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Catálogo de Productos
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
            {total} productos registrados
          </p>
        </div>
        <button onClick={handleNuevo} className="btn-primary px-5 py-3 rounded-xl
                 font-bold text-white text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3">
        {/* Buscador */}
        <div className="relative flex-1 min-w-48">
          <div className="absolute left-3 top-1/2 -translate-y-1/2"
               style={{ color: '#8b5cf6' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            ref={busquedaRef}  // ← AGREGAR
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="input-pos w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>

        {/* Categoría */}
       <select
          value={categoria}
          onChange={e => { setCategoria(e.target.value); setPagina(1) }}
          className="input-pos px-4 py-2.5 rounded-xl text-sm min-w-40"
          style={{ background: '#1e1b4b', color: '#e2e8f0' }}  // ← AGREGAR
        >
          <option value="" style={{ background: '#1e1b4b', color: '#e2e8f0' }}>
            Todas las categorías
          </option>
          {categorias.map(c => (
            <option 
              key={c.id} 
              value={c.id}
              style={{ background: '#1e1b4b', color: '#e2e8f0' }}  // ← AGREGAR
            >
              {c.nombre}
            </option>
          ))}
        </select>

        {/* Limpiar filtros */}
        {(busqueda || categoria) && (
          <button
            onClick={() => { setBusqueda(''); setCategoria(''); setPagina(1) }}
            className="px-4 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Grid productos */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-52 rounded-2xl animate-pulse"
                 style={{ background: 'rgba(139,92,246,0.06)' }} />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
               style={{ background: 'rgba(139,92,246,0.08)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="rgba(139,92,246,0.4)" strokeWidth="1.5">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-white">No hay productos</p>
          <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
            {busqueda ? 'Intenta con otra búsqueda' : 'Crea el primer producto'}
          </p>
          {!busqueda && (
            <button onClick={handleNuevo}
                    className="btn-primary px-4 py-2 rounded-xl text-sm font-bold text-white mt-2">
              + Nuevo Producto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.map(p => (
            <TarjetaProducto
              key={p.id}
              producto={p}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all
                       disabled:opacity-30"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          {[...Array(totalPaginas)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPagina(i + 1)}
              className="w-9 h-9 rounded-xl text-sm font-bold transition-all"
              style={pagina === i + 1 ? {
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: 'white',
              } : {
                background: 'rgba(139,92,246,0.08)',
                color: 'rgba(196,181,253,0.6)',
              }}>
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all
                       disabled:opacity-30"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalProducto
          producto={productoEdit}
          onGuardado={handleGuardado}
          onCerrar={() => { setModalAbierto(false); setProductoEdit(null) }}
        />
      )}
    </div>
  )
}