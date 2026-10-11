// ============================================================
// Recibo de venta para impresora térmica (vía CajonPOS local)
// ============================================================
const ANCHO = 32
const CAJON_URL = 'http://localhost:8765'

const money = (v) => '$' + Math.round(parseFloat(v || 0)).toLocaleString('es-CO')
const centrar = (t) => ' '.repeat(Math.max(0, Math.floor((ANCHO - t.length) / 2))) + t
const linea = (izq, der) => {
  const espacio = Math.max(1, ANCHO - izq.length - der.length)
  return izq + ' '.repeat(espacio) + der
}

export function construirRecibo(venta, cambio = 0) {
  const fecha = new Date(venta.fecha_hora).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const nombreTienda = (localStorage.getItem('pos_nombre_tienda') || 'RECIBO DE VENTA').toUpperCase()
  const out = []
  out.push(centrar(nombreTienda))
  out.push(centrar(`Venta #${venta.id}`))
  out.push(centrar(fecha))
  out.push('-'.repeat(ANCHO))
  for (const d of venta.detalle || []) {
    const nombre = String(d.producto_nombre || '').slice(0, ANCHO)
    out.push(nombre)
    const cant = parseFloat(d.cantidad)
    const precio = d.precio_unit != null ? money(d.precio_unit) : ''
    out.push(linea(`  ${cant} x ${precio}`, money(d.subtotal)))
  }
  out.push('-'.repeat(ANCHO))
  if (parseFloat(venta.descuento) > 0) out.push(linea('Descuento', '-' + money(venta.descuento)))
  out.push(linea('TOTAL', money(venta.total)))
  for (const p of venta.pagos || []) out.push(linea(p.forma_pago_nombre || 'Pago', money(p.monto)))
  if (cambio > 0) out.push(linea('Cambio', money(cambio)))
  out.push('')
  out.push(centrar('Gracias por su compra'))
  out.push('\n')
  return out.join('\n')
}

// Imprime en la impresora POS. El driver también abre el cajón al imprimir.
export async function imprimirRecibo(texto) {
  try {
    await fetch(`${CAJON_URL}/imprimir-recibo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    })
    return true
  } catch {
    console.warn('CajonPOS no disponible — no se pudo imprimir')
    return false
  }
}

export async function abrirCajonLocal() {
  try {
    await fetch(`${CAJON_URL}/abrir-cajon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    console.warn('CajonPOS no disponible')
  }
}
