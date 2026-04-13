// ============================================================
// 3. src/pages/Inventario/components/ModalMovimiento.jsx
// ============================================================
import { useState } from 'react'
import { inventarioService } from '../../../services/api'

const TIPOS = [
  { value: 'ENTRADA',    label: '↑ Entrada de mercancía',  color: '#4ade80' },
  { value: 'AJUSTE_POS', label: '⚡ Ajuste positivo',      color: '#fbbf24' },
  { value: 'AJUSTE_NEG', label: '↓ Ajuste negativo',       color: '#f87171' },
  { value: 'DEVOLUCION', label: '↩ Devolución',            color: '#06b6d4' },
]

export default function ModalMovimiento({ inventario, onGuardado, onCerrar }) {
  const [form, setForm] = useState({
    tipo_movimiento: 'ENTRADA',
    cantidad:        '',
    motivo:          '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const stockActual = parseFloat(inventario?.cantidad_actual) || 0
  const cantidad    = parseFloat(form.cantidad) || 0
  const preview = form.tipo_movimiento === 'SALIDA' || form.tipo_movimiento === 'AJUSTE_NEG'
    ? stockActual - cantidad
    : form.tipo_movimiento === 'AJUSTE_POS'
    ? cantidad
    : stockActual + cantidad

  const handleGuardar = async () => {
    if (!form.cantidad || cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0.')
      return
    }
    if (!form.motivo.trim()) {
      setError('El motivo es obligatorio.')
      return
    }
    if (form.tipo_movimiento === 'SALIDA' && cantidad > stockActual) {
      setError(`Stock insuficiente. Disponible: ${stockActual}`)
      return
    }
    setGuardando(true)
    setError('')
    try {
      await inventarioService.movimiento({
        producto_id:     inventario.producto_id || inventario.id,
        tipo_movimiento: form.tipo_movimiento,
        cantidad:        cantidad,
        motivo:          form.motivo,
      })
      onGuardado()
    } catch (err) {
      const data = err.response?.data
      setError(typeof data === 'object'
        ? Object.values(data).flat().join(' | ')
        : 'Error al registrar el movimiento.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-md animate-fade-in"
           style={{ boxShadow: '0 32px 80px rgba(124,58,237,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-white"
                style={{ fontFamily: 'Syne, sans-serif' }}>
              Ajustar Inventario
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
              {inventario?.producto_nombre}
            </p>
          </div>
          <button onClick={onCerrar}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Stock actual */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
             style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <span className="text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>Stock actual</span>
          <span className="text-2xl font-black text-white"
                style={{ fontFamily: 'Syne, sans-serif' }}>
            {stockActual}
          </span>
        </div>

        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              Tipo de movimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(t => (
                <button key={t.value}
                        onClick={() => setForm(p => ({ ...p, tipo_movimiento: t.value }))}
                        className="py-2.5 px-2 rounded-xl text-xs font-semibold transition-all text-center"
                        style={form.tipo_movimiento === t.value ? {
                          background: `${t.color}20`,
                          border: `1px solid ${t.color}40`,
                          color: t.color,
                        } : {
                          background: 'rgba(139,92,246,0.06)',
                          border: '1px solid rgba(139,92,246,0.1)',
                          color: 'rgba(196,181,253,0.5)',
                        }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              {form.tipo_movimiento === 'AJUSTE' ? 'Nuevo stock' : 'Cantidad'}
            </label>
            <input
              type="number" min="0"
              value={form.cantidad}
              onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))}
              placeholder="0"
              className="input-pos w-full px-4 py-3.5 rounded-xl text-lg font-bold text-center"
            />
          </div>

          {/* Preview nuevo stock */}
          {form.cantidad && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                 style={{
                   background: preview < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.08)',
                   border: `1px solid ${preview < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
                 }}>
              <span className="text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>
                Stock resultante
              </span>
              <span className="text-xl font-black"
                    style={{ color: preview < 0 ? '#f87171' : '#4ade80',
                             fontFamily: 'Syne, sans-serif' }}>
                {preview < 0 ? 'Insuficiente' : preview}
              </span>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold mb-2 tracking-widest uppercase"
                   style={{ color: 'rgba(196,181,253,0.6)' }}>
              Motivo *
            </label>
            <textarea
              value={form.motivo}
              onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
              placeholder="Ej: Compra a proveedor, ajuste por conteo físico..."
              rows={2}
              className="input-pos w-full px-4 py-3 rounded-xl text-sm resize-none"
            />
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
          <div className="flex gap-3 pt-1">
            <button onClick={onCerrar}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      color: 'rgba(196,181,253,0.7)',
                    }}>
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={guardando}
                    className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold
                               text-white disabled:opacity-50">
              {guardando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : 'Registrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
