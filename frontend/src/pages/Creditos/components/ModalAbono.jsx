import { useState } from 'react'
import { creditosService } from '../../../services/api'

export default function ModalAbono({ credito, onGuardado, onCerrar }) {
  const [monto,     setMonto]     = useState('')
  const [nota,      setNota]      = useState('')
  const [formaPago, setFormaPago] = useState('EFECTIVO')
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const fmt = (v) => `$${parseFloat(v || 0).toLocaleString('es-CO')}`
  const montoNum = parseFloat(monto) || 0
  const valido   = montoNum > 0 && montoNum <= parseFloat(credito.saldo_pendiente)

  const guardar = async () => {
    if (!valido) return
    setGuardando(true)
    setError('')
    try {
      await creditosService.abonar(credito.id, { monto: montoNum, nota, forma_pago: formaPago })
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el abono.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm animate-fade-in"
           style={{ boxShadow: '0 32px 80px rgba(124,58,237,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Registrar Abono
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
              {credito.cliente_nombre}
            </p>
          </div>
          <button onClick={onCerrar}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Saldo */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
             style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <span className="text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>Saldo pendiente</span>
          <span className="text-xl font-black" style={{ color: '#f59e0b', fontFamily: 'Syne, sans-serif' }}>
            {fmt(credito.saldo_pendiente)}
          </span>
        </div>

        <div className="space-y-4">
          {/* Monto */}
          <div>
            <p className="text-xs font-semibold mb-2 tracking-widest uppercase"
               style={{ color: 'rgba(196,181,253,0.6)' }}>
              Monto del abono *
            </p>
            <input
              type="number" value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0"
              className="input-pos w-full px-4 py-3.5 rounded-xl text-lg font-bold text-center"
              max={credito.saldo_pendiente}
            />
          </div>

          {/* Forma de pago */}
          <div>
            <p className="text-xs font-semibold mb-2 tracking-widest uppercase"
               style={{ color: 'rgba(196,181,253,0.6)' }}>
              Forma de pago *
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'EFECTIVO', label: '💵 Efectivo' },
                { value: 'NEQUI',    label: '📱 Nequi' },
                { value: 'OTRO',     label: '💳 Otro' },
              ].map(fp => (
                <button key={fp.value} onClick={() => setFormaPago(fp.value)}
                        className="py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={formaPago === fp.value ? {
                          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                          color: 'white',
                        } : {
                          background: 'rgba(139,92,246,0.08)',
                          border: '1px solid rgba(139,92,246,0.2)',
                          color: 'rgba(196,181,253,0.7)',
                        }}>
                  {fp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nota */}
          <div>
            <p className="text-xs font-semibold mb-2 tracking-widest uppercase"
               style={{ color: 'rgba(196,181,253,0.6)' }}>
              Nota (opcional)
            </p>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Ej: Pago parcial..."
              rows={2}
              className="input-pos w-full px-4 py-3 rounded-xl text-sm resize-none"
            />
          </div>

          {/* Nuevo saldo */}
          {montoNum > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                 style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
              <span className="text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>Saldo restante</span>
              <span className="text-lg font-black" style={{ color: '#4ade80', fontFamily: 'Syne, sans-serif' }}>
                {fmt(parseFloat(credito.saldo_pendiente) - montoNum)}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button onClick={onCerrar}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(196,181,253,0.7)' }}>
              Cancelar
            </button>
            <button onClick={guardar} disabled={!valido || guardando}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}>
              {guardando ? 'Guardando...' : 'Registrar Abono'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}