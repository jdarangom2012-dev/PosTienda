# ============================================================
# CajonPOS — Servidor local para abrir cajón de dinero
# 3nStar — ESC/POS via USB (win32print) o Serial/COM
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

try:
    import win32print
    WIN32PRINT_DISPONIBLE = True
except ImportError:
    WIN32PRINT_DISPONIBLE = False

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

def listar_impresoras():
    """Lista todas las impresoras instaladas en Windows (para USB)."""
    if not WIN32PRINT_DISPONIBLE:
        return []
    impresoras = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)
    return [{'nombre': p[2]} for p in impresoras]

def abrir_cajon_serial():
    """Envía el comando ESC/POS por puerto COM/Serial (cajón conectado directo al PC)."""
    puerto   = config.get('puerto_com', 'COM3')
    baudrate = config.get('baudrate', 9600)
    timeout  = config.get('timeout', 3)

    log.info(f"Intentando abrir cajón (SERIAL) — Puerto: {puerto} | Baudrate: {baudrate}")

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

def abrir_cajon_usb():
    """Envía el comando ESC/POS a través del spooler de Windows (impresora USB, ej. POS-80C)."""
    if not WIN32PRINT_DISPONIBLE:
        msg = "pywin32 no está instalado — no se puede usar modo USB"
        log.error(f"❌ {msg}")
        return False, msg

    nombre_impresora = config.get('nombre_impresora', 'POS-80C')
    log.info(f"Intentando abrir cajón (USB) — Impresora: {nombre_impresora}")

    h_printer = None
    try:
        h_printer = win32print.OpenPrinter(nombre_impresora)
        h_job = win32print.StartDocPrinter(h_printer, 1, ("AbrirCajon", None, "RAW"))
        try:
            win32print.StartPagePrinter(h_printer)
            win32print.WritePrinter(h_printer, COMANDO_CAJON)
            win32print.EndPagePrinter(h_printer)
        finally:
            win32print.EndDocPrinter(h_printer)

        log.info(f"✅ Cajón abierto correctamente — Impresora: {nombre_impresora}")
        return True, f"Cajón abierto en {nombre_impresora}"
    except Exception as e:
        log.error(f"❌ Error al abrir cajón USB — Impresora: {nombre_impresora} | Error: {str(e)}")
        return False, str(e)
    finally:
        if h_printer:
            win32print.ClosePrinter(h_printer)

def abrir_cajon():
    """Enruta al método correcto (usb o serial) según config.json."""
    tipo_conexion = config.get('tipo_conexion', 'usb')  # 'usb' o 'serial'

    if tipo_conexion == 'serial':
        return abrir_cajon_serial()
    else:
        return abrir_cajon_usb()

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

@app.route('/impresoras', methods=['GET'])
def endpoint_impresoras():
    """Lista las impresoras instaladas en Windows — útil para configurar modo USB."""
    impresoras = listar_impresoras()
    log.info(f"🖨️ Impresoras disponibles consultadas: {[i['nombre'] for i in impresoras]}")
    return jsonify({'impresoras': impresoras}), 200

@app.route('/ping', methods=['GET'])
def endpoint_ping():
    """Verifica que el servidor esté corriendo."""
    log.info("🏓 Ping recibido")
    return jsonify({
        'ok':      True,
        'mensaje': 'CajonPOS corriendo',
        'config':  {
            'tipo_conexion':    config.get('tipo_conexion', 'usb'),
            'puerto_com':       config.get('puerto_com'),
            'nombre_impresora': config.get('nombre_impresora'),
            'servidor_puerto':  config.get('servidor_puerto'),
        }
    }), 200

# ── Main ──────────────────────────────────────────────────────
if __name__ == '__main__':
    host   = config.get('servidor_host', 'localhost')
    puerto = config.get('servidor_puerto', 8765)
    tipo_conexion = config.get('tipo_conexion', 'usb')

    log.info("=" * 50)
    log.info("🚀 CajonPOS iniciando...")
    log.info(f"   Tipo conexión:  {tipo_conexion}")
    if tipo_conexion == 'serial':
        log.info(f"   Puerto COM:     {config.get('puerto_com')}")
    else:
        log.info(f"   Impresora USB:  {config.get('nombre_impresora')}")
    log.info(f"   Servidor:       http://{host}:{puerto}")
    log.info(f"   Log:            {log_ruta}")
    log.info("=" * 50)

    # Listar puertos COM disponibles al iniciar (informativo)
    puertos = listar_puertos()
    if puertos:
        log.info("Puertos COM disponibles:")
        for p in puertos:
            log.info(f"   {p['puerto']} — {p['descripcion']}")
    else:
        log.info("No se encontraron puertos COM (normal si el cajón es USB)")

    # Listar impresoras disponibles al iniciar (informativo)
    if WIN32PRINT_DISPONIBLE:
        impresoras = listar_impresoras()
        if impresoras:
            log.info("Impresoras instaladas en Windows:")
            for i in impresoras:
                log.info(f"   {i['nombre']}")
    else:
        log.warning("⚠️ pywin32 no instalado — modo USB no disponible")

    app.run(host=host, port=puerto, debug=False)