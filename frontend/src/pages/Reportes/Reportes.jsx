import { useState, useEffect } from 'react'
import { iaService } from '../../services/api'

// ── Iconos ──────────────────────────────────────────────────
const IconIA      = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor" opacity=".3"/></svg>
const IconLock    = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IconSend    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const IconBot     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><circle cx="9"  cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/></svg>
const IconUser    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
const IconClock   = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

// ── Estado: Plan Basic ───────────────────────────────────────
function EstadoBasic() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
           style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(139,92,246,0.4)' }}>
        <IconLock />
      </div>
      <div>
        <h3 className="text-xl font-black text-white mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}>
          IA no disponible en tu plan
        </h3>
        <p className="text-sm max-w-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
          Tu plan actual <span className="font-bold" style={{ color: '#a78bfa' }}>BASIC</span> no
          tiene habilitada la inteligencia artificial.
          Actualiza a <span className="font-bold" style={{ color: '#f59e0b' }}>Premium</span> para
          acceder al asistente IA.
        </p>
      </div>
      <div className="glass rounded-2xl p-5 max-w-sm w-full text-left space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(196,181,253,0.4)' }}>
          Con Premium obtienes
        </p>
        {[
          'Asistente IA para consultas de ventas',
          'Predicciones de stock con Prophet',
          '50 consultas mensuales incluidas',
          'Reportes inteligentes automáticos',
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(196,181,253,0.7)' }}>
            <span style={{ color: '#f59e0b' }}>✦</span> {item}
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: 'rgba(196,181,253,0.3)' }}>
        Contacta al administrador para actualizar tu plan
      </p>
    </div>
  )
}

// ── Estado: Tokens agotados ──────────────────────────────────
function EstadoAgotado({ resetFecha }) {
  const fecha = resetFecha
    ? new Date(resetFecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'el próximo mes'

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
           style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.5)' }}>
        <IconClock />
      </div>
      <div>
        <h3 className="text-xl font-black text-white mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}>
          Tokens agotados
        </h3>
        <p className="text-sm max-w-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
          Consumiste todos tus tokens este mes.
          Podrás volver a usar la IA el{' '}
          <span className="font-bold text-white">{fecha}</span>.
        </p>
      </div>
      <div className="glass rounded-2xl px-6 py-4 flex items-center gap-3">
        <span style={{ color: '#f87171' }}>●</span>
        <span className="text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>
          Los tokens se reinician automáticamente cada mes
        </span>
      </div>
    </div>
  )
}

// ── Chat ─────────────────────────────────────────────────────
function Chat({ tokensDisponibles, tokensMes }) {
  const [mensajes, setMensajes] = useState([
    { rol: 'bot', texto: '¡Hola! Soy tu asistente IA. Puedo ayudarte con consultas sobre ventas, inventario y reportes. ¿En qué te puedo ayudar?' }
  ])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [tokens,   setTokens]   = useState(tokensDisponibles)

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || loading) return

    setMensajes(m => [...m, { rol: 'user', texto }])
    setInput('')
    setLoading(true)

    try {
      const { data } = await iaService.chat(texto)
      setMensajes(m => [...m, { rol: 'bot', texto: data.respuesta }])
      setTokens(data.tokens_disponibles)
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al conectar con la IA.'
      setMensajes(m => [...m, { rol: 'bot', texto: `⚠️ ${msg}`, error: true }])
    } finally {
      setLoading(false)
    }
  }

  const pct = Math.round((tokens / tokensMes) * 100)

  return (
    <div className="flex flex-col gap-4">

      {/* Barra tokens */}
      <div className="glass rounded-2xl p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'rgba(196,181,253,0.5)' }}>Tokens disponibles</span>
            <span className="font-bold" style={{ color: tokens > 10 ? '#a78bfa' : '#f87171' }}>
              {tokens} / {tokensMes}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{
                   width: `${pct}%`,
                   background: pct > 20
                     ? 'linear-gradient(90deg, #7c3aed, #a855f7)'
                     : 'linear-gradient(90deg, #dc2626, #f87171)'
                 }} />
          </div>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-lg font-bold"
             style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
          PREMIUM
        </div>
      </div>

      {/* Mensajes */}
      <div className="glass rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto"
           style={{ minHeight: 320, maxHeight: 420 }}>
        {mensajes.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.rol === 'bot' && (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                <IconBot />
              </div>
            )}
            <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                 style={m.rol === 'user' ? {
                   background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                   color: 'white',
                   borderBottomRightRadius: 4,
                 } : {
                   background: m.error ? 'rgba(239,68,68,0.08)' : 'rgba(139,92,246,0.06)',
                   color: m.error ? '#f87171' : 'rgba(226,232,240,0.9)',
                   borderBottomLeftRadius: 4,
                 }}>
              {m.texto}
            </div>
            {m.rol === 'user' && (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                <IconUser />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
              <IconBot />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(139,92,246,0.06)', borderBottomLeftRadius: 4 }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                       style={{ background: '#a78bfa', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Pregunta algo sobre tus ventas o inventario..."
          disabled={loading || tokens === 0}
          className="input-pos flex-1 px-4 py-3 rounded-xl text-sm"
        />
        <button
          onClick={enviar}
          disabled={loading || !input.trim() || tokens === 0}
          className="btn-primary px-4 py-3 rounded-xl text-white disabled:opacity-40 transition-all"
        >
          <IconSend />
        </button>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function Reportes() {
  const [estadoIA, setEstadoIA] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    iaService.estado()
      .then(({ data }) => setEstadoIA(data))
      .catch(() => setEstadoIA(null))
      .finally(() => setLoading(false))
  }, [])

  const renderIA = () => {
    if (loading) return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
    if (!estadoIA || !estadoIA.es_premium)     return <EstadoBasic />
    if (estadoIA.tokens_disponibles === 0)      return <EstadoAgotado resetFecha={estadoIA.ia_reset_fecha} />
    return <Chat tokensDisponibles={estadoIA.tokens_disponibles} tokensMes={estadoIA.ia_tokens_mes} />
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
            Reportes & IA
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>
            Asistente inteligente para tu tienda
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
             style={{ background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}>
          <IconIA />
          <span className="text-xs font-bold">IA</span>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        {renderIA()}
      </div>
    </div>
  )
}