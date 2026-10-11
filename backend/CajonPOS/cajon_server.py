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
from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import tempfile
import subprocess
import time

try:
    import win32print
    WIN32PRINT_DISPONIBLE = True
except ImportError:
    WIN32PRINT_DISPONIBLE = False

# ── Cargar configuración ─────────────────────────────────────
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
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

# ── Comando ESC/POS para abrir cajón (usado en modo serial) ──
COMANDO_CAJON = b'\x1B\x70\x01\x19\xFA'

def listar_puertos():
    puertos = serial.tools.list_ports.comports()
    return [{'puerto': p.device, 'descripcion': p.description} for p in puertos]

def listar_impresoras():
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

def abrir_cajon_raw(nombre_impresora_raw):
    """Abre el cajón enviando el comando ESC/POS directo a una impresora que use el
    driver 'Generic / Text Only' (deja pasar los bytes RAW). No gasta papel."""
    log.info(f"Intentando abrir cajón (RAW) — Impresora: {nombre_impresora_raw}")
    try:
        h = win32print.OpenPrinter(nombre_impresora_raw)
        try:
            win32print.StartDocPrinter(h, 1, ("Apertura cajon", None, "RAW"))
            win32print.StartPagePrinter(h)
            win32print.WritePrinter(h, COMANDO_CAJON)
            win32print.EndPagePrinter(h)
            win32print.EndDocPrinter(h)
        finally:
            win32print.ClosePrinter(h)
        log.info("✅ Cajón abierto vía RAW (sin papel)")
        return True, f"Cajón abierto (RAW) en {nombre_impresora_raw}"
    except Exception as e:
        log.error(f"❌ Error RAW — {str(e)}")
        return False, str(e)

def abrir_cajon_usb():
    """Usa Notepad para imprimir un archivo real, cambiando temporalmente
    la impresora predeterminada a la del cajón. Esto replica el mismo
    camino que usa 'Página de prueba' de Windows, que sí activa el kick
    del cajón en este driver 3nStar (config 'Cash Drawer #1 Before
    Printing' en Propiedades de impresora → Configuración del dispositivo)."""
    if not WIN32PRINT_DISPONIBLE:
        msg = "pywin32 no está instalado — no se puede usar modo USB"
        log.error(f"❌ {msg}")
        return False, msg

    # Si hay impresora RAW configurada, se usa primero (sin papel); si falla, cae a Notepad
    nombre_raw = config.get('impresora_raw')
    if nombre_raw:
        ok, msg = abrir_cajon_raw(nombre_raw)
        if ok:
            return ok, msg
        log.warning("RAW falló — usando método Notepad como respaldo")

    nombre_impresora = config.get('nombre_impresora', 'POS-80C')
    log.info(f"Intentando abrir cajón (Notepad print) — Impresora: {nombre_impresora}")

    impresora_original = win32print.GetDefaultPrinter()

    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            # Texto configurable en config.json ("texto_apertura") para gastar menos papel
            f.write(config.get('texto_apertura', "Apertura de cajon\n\n\n"))
            ruta_temp = f.name

        win32print.SetDefaultPrinter(nombre_impresora)
        time.sleep(0.3)

        subprocess.run(
            ["notepad.exe", "/p", ruta_temp],
            timeout=10,
        )

        log.info(f"✅ Comando enviado vía Notepad — Impresora: {nombre_impresora}")
        return True, f"Cajón abierto en {nombre_impresora}"
    except Exception as e:
        log.error(f"❌ Error al abrir cajón — Impresora: {nombre_impresora} | Error: {str(e)}")
        return False, str(e)
    finally:
        try:
            win32print.SetDefaultPrinter(impresora_original)
        except Exception:
            pass

def imprimir_recibo(texto):
    """Imprime un recibo de texto por el mismo camino (Notepad /p) que la apertura
    del cajón. El driver abre el cajón antes de imprimir, así que una sola
    impresión hace las dos cosas."""
    if not WIN32PRINT_DISPONIBLE:
        return False, "pywin32 no está instalado — no se puede imprimir"

    nombre_impresora = config.get('nombre_impresora', 'POS-80C')
    log.info(f"Imprimiendo recibo — Impresora: {nombre_impresora}")
    impresora_original = win32print.GetDefaultPrinter()
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            f.write(texto)
            ruta_temp = f.name
        win32print.SetDefaultPrinter(nombre_impresora)
        time.sleep(0.3)
        subprocess.run(["notepad.exe", "/p", ruta_temp], timeout=15)
        log.info("✅ Recibo enviado a impresión")
        return True, "Recibo impreso"
    except Exception as e:
        log.error(f"❌ Error al imprimir recibo — {str(e)}")
        return False, str(e)
    finally:
        try:
            win32print.SetDefaultPrinter(impresora_original)
        except Exception:
            pass

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

@app.route('/imprimir-recibo', methods=['POST'])
def endpoint_imprimir_recibo():
    log.info("📥 Solicitud recibida: /imprimir-recibo")
    datos = request.get_json(silent=True) or {}
    texto = datos.get('texto', '')
    if not texto.strip():
        return jsonify({'ok': False, 'error': 'texto vacío'}), 400
    exito, mensaje = imprimir_recibo(texto)
    if exito:
        return jsonify({'ok': True,  'mensaje': mensaje}), 200
    return jsonify({'ok': False, 'error': mensaje}), 500

@app.route('/puertos', methods=['GET'])
def endpoint_puertos():
    puertos = listar_puertos()
    log.info(f"📋 Puertos disponibles consultados: {[p['puerto'] for p in puertos]}")
    return jsonify({'puertos': puertos}), 200

@app.route('/impresoras', methods=['GET'])
def endpoint_impresoras():
    impresoras = listar_impresoras()
    log.info(f"🖨️ Impresoras disponibles consultadas: {[i['nombre'] for i in impresoras]}")
    return jsonify({'impresoras': impresoras}), 200

@app.route('/ping', methods=['GET'])
def endpoint_ping():
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

    puertos = listar_puertos()
    if puertos:
        log.info("Puertos COM disponibles:")
        for p in puertos:
            log.info(f"   {p['puerto']} — {p['descripcion']}")
    else:
        log.info("No se encontraron puertos COM (normal si el cajón es USB)")

    if WIN32PRINT_DISPONIBLE:
        impresoras = listar_impresoras()
        if impresoras:
            log.info("Impresoras instaladas en Windows:")
            for i in impresoras:
                log.info(f"   {i['nombre']}")
    else:
        log.warning("⚠️ pywin32 no instalado — modo USB no disponible")

    app.run(host=host, port=puerto, debug=False)