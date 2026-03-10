// ============================================================
// 4. src/pages/Reportes/components/Chatbot.jsx
// ============================================================
import { useState, useRef, useEffect } from 'react'
import { iaService } from '../../../services/api'

const MensajeBurbuja = ({ msg }) => {
  const esUsuario = msg.rol === 'user'
  return (
    <div className={`flex gap-3 ${esUsuario ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
           style={{
             background: esUsuario
               ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
               : 'rgba(139,92,246,0.15)',
           }}>
        {esUsuario ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="white" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="#a78bfa" strokeWidth="2">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <circle cx="7.5"  cy="14.5" r="1.5"/>
            <circle cx="16.5" cy="14.5" r="1.5"/>
          </svg>
        )}
      </div>

      {/* Burbuja */}
      <div className="max-w-xs lg:max-w-sm xl:max-w-md">
        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
             style={esUsuario ? {
               background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
               color: 'white',
               borderBottomRightRadius: '4px',
             } : {
               background: 'rgba(139,92,246,0.1)',
               border: '1px solid rgba(139,92,246,0.15)',
               color: 'rgba(220,210,255,0.9)',
               borderBottomLeftRadius: '4px',
             }}>
          {msg.contenido}
        </div>
        <p className="text-xs mt-1 px-1"
           style={{
             color: 'rgba(196,181,253,0.3)',
             textAlign: esUsuario ? 'right' : 'left',
           }}>
          {msg.hora}
        </p>
      </div>
    </div>
  )
}

const TypingIndicator = () => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
         style={{ background: 'rgba(139,92,246,0.15)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="#a78bfa" strokeWidth="2">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
      </svg>
    </div>
    <div className="px-4 py-3 rounded-2xl flex items-center gap-1"
         style={{ background: 'rgba(139,92,246,0.1)', borderBottomLeftRadius: '4px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: '#8b5cf6',
                animationDelay: `${i * 0.15}s`,
              }} />
      ))}
    </div>
  </div>
)

const SUGERENCIAS = [
  '¿Cuáles son los productos más vendidos hoy?',
  '¿Qué productos tienen stock bajo?',
  '¿Cuánto vendí esta semana?',
  '¿Cuál es mi producto más rentable?',
]

export default function Chatbot() {
  const [mensajes,  setMensajes]  = useState([
    {
      id: 1,
      rol: 'assistant',
      contenido: '¡Hola! Soy tu asistente de ventas con IA 🤖 Puedo responderte preguntas sobre tus ventas, inventario y productos. ¿En qué te puedo ayudar?',
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    }
  ])
  const [input,    setInput]    = useState('')
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, cargando])

  const enviar = async (texto) => {
    const msg = texto || input.trim()
    if (!msg || cargando) return
    setInput('')

    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

    setMensajes(prev => [...prev, {
      id:       Date.now(),
      rol:      'user',
      contenido: msg,
      hora,
    }])

    setCargando(true)
    try {
      const { data } = await iaService.chat({ mensaje: msg })
      setMensajes(prev => [...prev, {
        id:       Date.now() + 1,
        rol:      'assistant',
        contenido: data.respuesta || data.mensaje || 'No pude procesar tu consulta.',
        hora:     new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch {
      setMensajes(prev => [...prev, {
        id:       Date.now() + 1,
        rol:      'assistant',
        contenido: 'Lo siento, no pude conectarme en este momento. Asegúrate de tener configurada la API key de OpenAI en el archivo .env',
        hora:     new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setCargando(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '480px' }}>
      {/* Header chatbot */}
      <div className="flex items-center gap-3 pb-4 mb-4"
           style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="white" strokeWidth="2">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <circle cx="7.5"  cy="14.5" r="1.5"/>
            <circle cx="16.5" cy="14.5" r="1.5"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Asistente IA</p>
          <p className="text-xs flex items-center gap-1"
             style={{ color: '#4ade80' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            En línea
          </p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4"
           style={{ maxHeight: '320px' }}>
        {mensajes.map(m => <MensajeBurbuja key={m.id} msg={m} />)}
        {cargando && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias */}
      {mensajes.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGERENCIAS.map((s, i) => (
            <button key={i} onClick={() => enviar(s)}
                    className="text-xs px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                    style={{
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.15)',
                      color: 'rgba(196,181,253,0.7)',
                    }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Escribe tu pregunta..."
          disabled={cargando}
          className="input-pos flex-1 px-4 py-3 rounded-xl text-sm
                     disabled:opacity-50"
        />
        <button
          onClick={() => enviar()}
          disabled={!input.trim() || cargando}
          className="w-11 h-11 rounded-xl flex items-center justify-center
                     btn-primary disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all hover:scale-105">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="white" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
