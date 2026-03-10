// ============================================================
// 2. src/pages/Productos/components/ModalProducto.jsx
// ============================================================
import { useState, useEffect } from 'react'
import { productosService } from '../../../services/api'

export default function ModalProducto({ producto, onGuardado, onCerrar }) {
  const esEdicion = !!producto?.id
  const [categorias, setCategorias] = useState([])
  const [guardando,  setGuardando]  = useState(false)
  const [error,      setError]      = useState('')
  const [form, setForm] = useState({
    nombre:        '',
    codigo_barras: '',
    descripcion:   '',
    categoria:     '',
    precio_costo:  '',
    precio_venta:  '',
    stock_minimo:  '5',
    activo:        true,
  })

  useEffect(() => {
  productosService.categorias().then(({ data }) => {
    const cats = data.results || data
    setCategorias(cats)
  })

  if (producto?.id) {
    // Cargar detalle completo para obtener precio_costo
    productosService.detalle(producto.id).then(({ data }) => {
      const cats_local = categorias
      setForm({
        nombre:        data.nombre        || '',
        codigo_barras: data.codigo_barras || '',
        descripcion:   data.descripcion   || '',
        categoria:     data.categoria     || '',
        precio_costo:  data.precio_costo  || '',
        precio_venta:  data.precio_venta  || '',
        stock_minimo:  data.stock_minimo  || '5',
        activo:        data.activo        ?? true,
      })
    })
  }
}, [producto])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('')
  }

  const handleGuardar = async () => {
    if (!form.nombre || !form.precio_venta || !form.precio_costo) {
      setError('Nombre, precio de costo y precio de venta son obligatorios.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      if (esEdicion) {
        await productosService.actualizar(producto.id, form)
      } else {
        await productosService.crear(form)
      }
      onGuardado()
    } catch (err) {
      const data = err.response?.data
      const msg  = typeof data === 'object'
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : 'Error al guardar el producto.'
      setError(msg)
    } finally {
      setGuardando(false)
    }
  }

  const margen = form.precio_costo && form.precio_venta
    ? (((parseFloat(form.precio_venta) - parseFloat(form.precio_costo))
        / parseFloat(form.precio_costo)) * 100).toFixed(1)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-lg animate-fade-in overflow-y-auto max-h-[90vh]"
           style={{ boxShadow: '0 32px 80px rgba(124,58,237,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            {esEdicion ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onCerrar}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6"  y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              Nombre *
            </label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
                   placeholder="Ej: Coca Cola 350ml"
                   className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
          </div>

          {/* Código + Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Código de barras
              </label>
              <input name="codigo_barras" value={form.codigo_barras} onChange={handleChange}
                     placeholder="7501055..."
                     className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Categoría
              </label>
              <select name="categoria" value={form.categoria} onChange={handleChange}
                      className="input-pos w-full px-4 py-3 rounded-xl text-sm">
                <option value="">Sin categoría</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Precio costo *
              </label>
              <input name="precio_costo" value={form.precio_costo} onChange={handleChange}
                     type="number" min="0" placeholder="0"
                     className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                     style={{ color: 'rgba(196,181,253,0.6)' }}>
                Precio venta *
              </label>
              <input name="precio_venta" value={form.precio_venta} onChange={handleChange}
                     type="number" min="0" placeholder="0"
                     className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
            </div>
          </div>

          {/* Margen calculado */}
          {margen !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                 style={{
                   background: parseFloat(margen) > 0
                     ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                   border: `1px solid ${parseFloat(margen) > 0
                     ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
                 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke={parseFloat(margen) > 0 ? '#4ade80' : '#f87171'} strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span className="text-xs font-semibold"
                    style={{ color: parseFloat(margen) > 0 ? '#4ade80' : '#f87171' }}>
                Margen: {margen}%
              </span>
            </div>
          )}

          {/* Stock mínimo */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              Stock mínimo (alerta)
            </label>
            <input name="stock_minimo" value={form.stock_minimo} onChange={handleChange}
                   type="number" min="0" placeholder="5"
                   className="input-pos w-full px-4 py-3 rounded-xl text-sm" />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              Descripción
            </label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                      placeholder="Descripción opcional del producto..."
                      rows={2}
                      className="input-pos w-full px-4 py-3 rounded-xl text-sm resize-none" />
          </div>

          {/* Activo */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
               style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <div>
              <p className="text-sm font-semibold text-white">Producto activo</p>
              <p className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                Los productos inactivos no aparecen en el POS
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, activo: !prev.activo }))}
              className="w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0"
              style={{
                background: form.activo
                  ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                  : 'rgba(139,92,246,0.2)',
              }}>
              <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
                    style={{ left: form.activo ? '26px' : '4px' }} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
                 style={{
                   background: 'rgba(239,68,68,0.1)',
                   border: '1px solid rgba(239,68,68,0.3)',
                   color: '#fca5a5',
                 }}>
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button onClick={onCerrar}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      color: 'rgba(196,181,253,0.7)',
                    }}>
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={guardando}
                    className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold text-white
                               disabled:opacity-50 disabled:cursor-not-allowed">
              {guardando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                esEdicion ? 'Guardar cambios' : 'Crear producto'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

