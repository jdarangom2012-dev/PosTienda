# ============================================================
# CajonPOS — Servidor local para abrir cajón de dinero
# 3nStar — ESC/POS via USB/Serial
# ============================================================
import json
import logging
import os
import serial
import serial.tools.list_ports
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
import sys

# ── Cargar configuración ─────────────────────────────────────
if getattr(sys, 'frozen', False):
    # Corriendo como .exe
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # Corriendo como script Python
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_PATH = os.path.join(BASE_DIR, 'config.json')

with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)

# ── Configurar logging ───────────────────────────────────────
log_ruta = config.get('log_ruta', os.path.join(BASE_DIR, 'logs', 'cajon.log'))
os.makedirs(os.path.dirname(log_ruta), exist_ok=True)

logging.basicConfig(
    level    = logging.INFO,
    format   = '%(asctime)s [%(levelname)s] %(message)s',
    handlers = [
        logging.FileHandler(log_ruta, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

# ── Flask app ─────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── Comando ESC/POS para abrir cajón ─────────────────────────
COMANDO_CAJON = b'\x1B\x70\x00\x19\xFA'

def listar_puertos():
    """Lista todos los puertos COM disponibles."""
    puertos = serial.tools.list_ports.comports()
    return [{'puerto': p.device, 'descripcion': p.description} for p in puertos]

def abrir_cajon():
    """Envía el comando ESC/POS a la impresora para abrir el cajón."""
    puerto   = config.get('puerto_com', 'COM3')
    baudrate = config.get('baudrate', 9600)
    timeout  = config.get('timeout', 3)

    log.info(f"Intentando abrir cajón — Puerto: {puerto} | Baudrate: {baudrate}")

    try:
        with serial.Serial(puerto, baudrate, timeout=timeout) as ser:
            ser.write(COMANDO_CAJON)
            log.info(f"✅ Cajón abierto correctamente — Puerto: {puerto}")
            return True, f"Cajón abierto en {puerto}"
    except serial.SerialException as e:
        log.error(f"❌ Error al abrir cajón — Puerto: {puerto} | Error: {str(e)}")
        return False, str(e)
    except Exception as e:
        log.error(f"❌ Error inesperado — {str(e)}")
        return False, str(e)

# ── Endpoints ─────────────────────────────────────────────────
@app.route('/abrir-cajon', methods=['POST'])
def endpoint_abrir_cajon():
    log.info("📥 Solicitud recibida: /abrir-cajon")
    exito, mensaje = abrir_cajon()
    if exito:
        return jsonify({'ok': True,  'mensaje': mensaje}), 200
    else:
        return jsonify({'ok': False, 'error': mensaje}),   500

@app.route('/puertos', methods=['GET'])
def endpoint_puertos():
    """Lista los puertos COM disponibles — útil para configuración."""
    puertos = listar_puertos()
    log.info(f"📋 Puertos disponibles consultados: {[p['puerto'] for p in puertos]}")
    return jsonify({'puertos': puertos}), 200

@app.route('/ping', methods=['GET'])
def endpoint_ping():
    """Verifica que el servidor esté corriendo."""
    log.info("🏓 Ping recibido")
    return jsonify({
        'ok':      True,
        'mensaje': 'CajonPOS corriendo',
        'config':  {
            'puerto_com':      config.get('puerto_com'),
            'servidor_puerto': config.get('servidor_puerto'),
        }
    }), 200

# ── Main ──────────────────────────────────────────────────────
if __name__ == '__main__':
    host   = config.get('servidor_host', 'localhost')
    puerto = config.get('servidor_puerto', 8765)

    log.info("=" * 50)
    log.info("🚀 CajonPOS iniciando...")
    log.info(f"   Puerto COM:     {config.get('puerto_com')}")
    log.info(f"   Servidor:       http://{host}:{puerto}")
    log.info(f"   Log:            {log_ruta}")
    log.info("=" * 50)

    # Listar puertos disponibles al iniciar
    puertos = listar_puertos()
    if puertos:
        log.info("Puertos COM disponibles:")
        for p in puertos:
            log.info(f"   {p['puerto']} — {p['descripcion']}")
    else:
        log.warning("⚠️ No se encontraron puertos COM disponibles")

    app.run(host=host, port=puerto, debug=False)