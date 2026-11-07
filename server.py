#!/usr/bin/env python3
"""
NetWatch // Monitor e Dashboard de Conexões de Rede em Tempo Real
Autor: Antigravity
Projeto: NetWatch (caminho independente do usuário e da distribuição Linux)
"""

import os
import sys
import json
import time
import socket
import tempfile
import urllib.request
import urllib.error
import subprocess
import threading
import ipaddress
import re
import pwd
from collections import deque
import signal
import secrets
import hmac
from urllib.parse import urlsplit
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

PORT = 9876
HOST = '127.0.0.1'  # Default to loopback; the API exposes sensitive process data.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, 'web')
CACHE_FILE = os.path.join(BASE_DIR, '.geo_cache.json')
DNS_CACHE_FILE = os.path.join(BASE_DIR, '.dns_cache.json')
SESSION_TOKEN = secrets.token_urlsafe(32)

# Public GitHub Pages bridge is disabled until an exact HTTPS origin is configured.
PAGES_ORIGIN = os.environ.get('NETWATCH_PAGES_ORIGIN', '').strip()
PAGES_READ_TOKEN = secrets.token_urlsafe(32)
PAIRING_FILE = os.path.join(BASE_DIR, '.netwatch-pages-token')


def validated_pages_origin(value):
    if not value:
        return ''
    parsed = urlsplit(value)
    if (parsed.scheme != 'https' or not parsed.hostname or parsed.username or
            parsed.password or parsed.query or parsed.fragment or
            parsed.path not in ('', '/') or parsed.port not in (None, 443) or
            '*' in value or value != parsed.geturl()):
        raise ValueError('NETWATCH_PAGES_ORIGIN deve ser uma origem HTTPS exata, sem caminho/query')
    return parsed.scheme + '://' + parsed.netloc.rstrip('/')


PAGES_ORIGIN = validated_pages_origin(PAGES_ORIGIN)


def write_pairing_secret():
    """Persist only the read-only bridge secret, with mode 0600, never in logs."""
    if not PAGES_ORIGIN:
        try:
            os.unlink(PAIRING_FILE)
        except FileNotFoundError:
            pass
        return
    fd, temporary = tempfile.mkstemp(
        prefix='.pairing-', dir=os.path.dirname(PAIRING_FILE) or BASE_DIR)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, 'w', encoding='utf-8') as output:
            output.write(PAGES_READ_TOKEN + '\n')
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, PAIRING_FILE)
        os.chmod(PAIRING_FILE, 0o600)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)

# Lock for cache operations
cache_lock = threading.Lock()
geo_cache = {}
dns_cache = {}

# Lookup queue to avoid blocking requests (FIFO deque for fair ordering)
lookup_queue = deque()
lookup_seen = set()
queue_lock = threading.Lock()

# Load caches
if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            geo_cache = json.load(f)
    except Exception:
        geo_cache = {}

if os.path.exists(DNS_CACHE_FILE):
    try:
        with open(DNS_CACHE_FILE, 'r', encoding='utf-8') as f:
            dns_cache = json.load(f)
    except Exception:
        dns_cache = {}

def save_caches():
    """Atomic cache write: write-to-tmp + rename to prevent corruption."""
    with cache_lock:
        for filepath, data in [(CACHE_FILE, geo_cache), (DNS_CACHE_FILE, dns_cache)]:
            try:
                fd, tmp_path = tempfile.mkstemp(dir=BASE_DIR, suffix='.tmp')
                with os.fdopen(fd, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                os.replace(tmp_path, filepath)
            except Exception:
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

# The history sampler is independent of browser polling.
bw_lock = threading.Lock()
prev_net_io = {}
prev_time = time.monotonic()
metrics_history = deque(maxlen=120)
latest_rates = {'available': False, 'total_rx_bps': None, 'total_tx_bps': None,
                'interfaces': {}, 'rate_scope': 'unavailable'}
latest_total = 0


def get_bandwidth_rates(total_conns=0):
    # Kept as a compatible callback; independent sampler owns history timestamps.
    with bw_lock:
        return dict(latest_rates), list(metrics_history)


def sample_bandwidth():
    global prev_net_io, prev_time, latest_rates
    now = time.monotonic()
    counters = {}
    try:
        with open('/proc/net/dev', encoding='utf-8') as file:
            for line in file.readlines()[2:]:
                if ':' not in line:
                    continue
                name, rest = line.split(':', 1)
                numbers = rest.split()
                if len(numbers) >= 16:
                    counters[name.strip()] = (int(numbers[0]), int(numbers[8]))
    except (OSError, ValueError):
        with bw_lock:
            latest_rates = {'available': False, 'total_rx_bps': None, 'total_tx_bps': None,
                            'interfaces': {}, 'rate_scope': 'unavailable'}
        return
    # Sample IP socket counts independently of the number of browser clients.
    try:
        count_result = subprocess.run(
            ['ss', '-tunaH'], capture_output=True, text=True, timeout=3)
        ip_connections = (len(count_result.stdout.splitlines())
                          if count_result.returncode == 0 else None)
    except (OSError, subprocess.SubprocessError):
        ip_connections = None
    with bw_lock:
        dt = now - prev_time
        per_interface = {}
        for name, (rx, tx) in counters.items():
            if name == 'lo':
                continue
            before = prev_net_io.get(name)
            physical = os.path.exists(f'/sys/class/net/{name}/device')
            if before and dt > 0:
                rx_rate = max(0.0, (rx - before[0]) / dt)
                tx_rate = max(0.0, (tx - before[1]) / dt)
            else:
                rx_rate = tx_rate = 0.0
            per_interface[name] = {'rx_bps': rx_rate, 'tx_bps': tx_rate,
                                   'physical': physical}
        physical_names = [name for name, entry in per_interface.items() if entry['physical']]
        selected = physical_names if physical_names else list(per_interface)
        available = bool(prev_net_io) and dt > 0
        latest_rates = {
            'available': available,
            'total_rx_bps': sum(per_interface[name]['rx_bps'] for name in selected) if available else None,
            'total_tx_bps': sum(per_interface[name]['tx_bps'] for name in selected) if available else None,
            'interfaces': per_interface,
            'rate_scope': 'physical' if physical_names else 'virtual_fallback' if selected else 'none'
        }
        prev_net_io = counters
        prev_time = now
        if available and ip_connections is not None:
            cutoff = time.time() - 60
            metrics_history.append({
                'time': time.strftime('%H:%M:%S'), 'timestamp': time.time(),
                'rx_kbps': round(latest_rates['total_rx_bps'] * 8 / 1000, 1),
                'tx_kbps': round(latest_rates['total_tx_bps'] * 8 / 1000, 1),
                'total_conns': ip_connections
            })
            while metrics_history and metrics_history[0]['timestamp'] < cutoff:
                metrics_history.popleft()


def bandwidth_worker():
    while True:
        sample_bandwidth()
        time.sleep(2.0)


threading.Thread(target=bandwidth_worker, daemon=True, name='netwatch-bandwidth').start()


# Service port names
KNOWN_PORTS = {
    20: "FTP-Data", 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
    53: "DNS", 67: "DHCP-Server", 68: "DHCP-Client", 69: "TFTP",
    80: "HTTP", 110: "POP3", 123: "NTP", 137: "NetBIOS", 138: "NetBIOS",
    139: "NetBIOS", 143: "IMAP", 161: "SNMP", 179: "BGP", 194: "IRC",
    389: "LDAP", 443: "HTTPS", 465: "SMTPS", 514: "Syslog", 587: "Submission",
    636: "LDAPS", 993: "IMAPS", 995: "POP3S", 1080: "SOCKS", 1194: "OpenVPN",
    1433: "MSSQL", 1521: "Oracle", 1723: "PPTP", 1883: "MQTT", 1900: "SSDP",
    2049: "NFS", 3000: "Dev-App", 3306: "MySQL", 3389: "RDP", 5000: "Dev-Flask",
    5173: "Vite", 5353: "mDNS", 5432: "PostgreSQL", 5672: "RabbitMQ", 6379: "Redis",
    8000: "HTTP-Alt", 8080: "HTTP-Proxy", 8443: "HTTPS-Alt", 8888: "Jupyter",
    9000: "SonarQube", 9090: "Prometheus", 9092: "Kafka", 9200: "Elasticsearch",
    9876: "NetWatch", 9993: "ZeroTier", 27017: "MongoDB", 41641: "Tailscale",
    51820: "WireGuard"
}

def is_special_or_private(ip_str):
    if not ip_str or ip_str in ('*', '0.0.0.0', '::', '::1', '127.0.0.1', 'localhost'):
        return True, "Loopback / Local"
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_loopback:
            return True, "Loopback"
        if ip.is_link_local:
            return True, "Link-Local"
        if ip.is_multicast:
            return True, "Multicast"
        if ip.is_private:
            return True, "Rede Local (LAN)"
        # Check Carrier-Grade NAT (RFC 6598 - 100.64.0.0/10 - Tailscale)
        if ip in ipaddress.ip_network('100.64.0.0/10'):
            return True, "Tailscale VPN"
        return False, "Pública"
    except Exception:
        return True, "Desconhecido"

# Background worker for GeoIP & DNS lookups
GEO_PROVIDER = os.environ.get('NETWATCH_GEO_PROVIDER', 'off').lower()
if GEO_PROVIDER not in ('off', 'ipwhois'):
    raise ValueError('NETWATCH_GEO_PROVIDER deve ser off ou ipwhois')
_geo_retry_after = {}


def lookup_worker():
    last_save = time.monotonic()
    while True:
        with queue_lock:
            target_ip = lookup_queue.popleft() if lookup_queue else None
            if target_ip:
                lookup_seen.discard(target_ip)
        if not target_ip:
            time.sleep(0.5)
            continue
        try:
            with cache_lock:
                need_dns = target_ip not in dns_cache
            if need_dns:
                try:
                    host, _, _ = socket.gethostbyaddr(target_ip)
                except (OSError, socket.error):
                    host = ''
                with cache_lock:
                    dns_cache[target_ip] = host

            is_private, label = is_special_or_private(target_ip)
            with cache_lock:
                current = geo_cache.get(target_ip)
            if is_private:
                data = {'status': 'local', 'country': 'Rede Local', 'city': label}
                with cache_lock:
                    geo_cache[target_ip] = data
            elif GEO_PROVIDER == 'ipwhois' and (
                    not current or current.get('status') == 'fail') and (
                    time.monotonic() >= _geo_retry_after.get(target_ip, 0)):
                try:
                    # TLS + bounded timeout; opt-in because remote IPs leave this machine.
                    req = urllib.request.Request(
                        'https://ipwho.is/' + target_ip,
                        headers={'User-Agent': 'NetWatch/2.0'})
                    with urllib.request.urlopen(req, timeout=5) as response:
                        incoming = json.load(response)
                    if not incoming.get('success'):
                        raise ValueError('Provedor de GeoIP não retornou dados')
                    con = incoming.get('connection') or {}
                    geo = {'status': 'success', 'country': incoming.get('country', ''),
                           'countryCode': incoming.get('country_code', ''),
                           'city': incoming.get('city', ''), 'isp': con.get('isp', ''),
                           'org': con.get('org', ''), 'as': str(con.get('asn', ''))}
                    with cache_lock:
                        geo_cache[target_ip] = geo
                except (OSError, ValueError, urllib.error.URLError, TimeoutError):
                    _geo_retry_after[target_ip] = time.monotonic() + 600
                    with cache_lock:
                        geo_cache[target_ip] = {
                            'status': 'fail', 'retry_at': time.time() + 600
                        }
                time.sleep(1.5)  # Respect third-party quotas.
        finally:
            if time.monotonic() - last_save >= 15:
                save_caches()
                last_save = time.monotonic()


worker_thread = threading.Thread(target=lookup_worker, daemon=True)
worker_thread.start()

def parse_endpoint(ep):
    if not ep or ep == '*:*':
        return {'raw': ep, 'ip': '*', 'port': '*', 'port_int': 0, 'service': '', 'iface': ''}
    idx = ep.rfind(':')
    if idx != -1:
        addr = ep[:idx]
        port_str = ep[idx+1:]
    else:
        addr = ep
        port_str = '*'
    iface = ''
    if '%' in addr:
        addr, iface = addr.split('%', 1)
    addr = addr.strip('[]')
    port_int = int(port_str) if port_str.isdigit() else 0
    service = KNOWN_PORTS.get(port_int, '')
    return {
        'raw': ep,
        'ip': addr,
        'port': port_str,
        'port_int': port_int,
        'service': service,
        'iface': iface
    }

def get_process_details(pid):
    if not pid:
        return {'cmdline': '', 'exe': '', 'user': '', 'cwd': ''}
    cmdline = ''
    exe = ''
    user = ''
    try:
        cmd_path = f'/proc/{pid}/cmdline'
        if os.path.exists(cmd_path):
            with open(cmd_path, 'rb') as f:
                raw = f.read()
                cmdline = raw.replace(b'\x00', b' ').decode('utf-8', errors='ignore').strip()
    except Exception:
        pass

    try:
        exe_path = f'/proc/{pid}/exe'
        if os.path.exists(exe_path):
            exe = os.readlink(exe_path)
    except Exception:
        pass

    try:
        stat_path = f'/proc/{pid}/status'
        if os.path.exists(stat_path):
            with open(stat_path, 'r', errors='ignore') as f:
                for line in f:
                    if line.startswith('Uid:'):
                        uid = int(line.split()[1])
                        user = pwd.getpwuid(uid).pw_name
                        break
    except Exception:
        pass

    return {'cmdline': cmdline, 'exe': exe, 'user': user}

def get_interfaces():
    try:
        res = subprocess.run(['ip', '-j', 'addr'], capture_output=True, text=True, timeout=3)
        if res.returncode == 0:
            data = json.loads(res.stdout)
            result = []
            for item in data:
                ifname = item.get('ifname', '')
                flags = item.get('flags', [])
                addrs = []
                for a in item.get('addr_info', []):
                    local = a.get('local')
                    family = a.get('family')
                    prefixlen = a.get('prefixlen')
                    if local:
                        addrs.append({'ip': local, 'family': family, 'prefix': prefixlen})
                result.append({
                    'name': ifname,
                    'operstate': item.get('operstate', 'UNKNOWN'),
                    'is_up': 'UP' in flags,
                    'addresses': addrs
                })
            return result
    except Exception:
        pass
    return []

def get_lsof_mapping():
    mapping = {}
    try:
        res = subprocess.run(['lsof', '-i', '-P', '-n'], capture_output=True, text=True, timeout=4)
        if res.returncode == 0:
            lines = res.stdout.splitlines()
            for line in lines[1:]:
                parts = line.split()
                if len(parts) >= 9:
                    comm = parts[0]
                    try:
                        pid = int(parts[1])
                    except ValueError:
                        continue
                    u = parts[2]
                    # Name is usually the last part, e.g. 172.16.99.209:43740->172.217.114.4:443
                    name = parts[8]
                    mapping[name] = {'command': comm, 'pid': pid, 'user': u}
    except Exception:
        pass
    return mapping

from telemetry_collector import collect_snapshot


def scan_connections():
    return collect_snapshot(
        parse_endpoint, get_process_details, get_interfaces, get_bandwidth_rates,
        is_special_or_private, cache_lock, geo_cache, dns_cache,
        queue_lock, lookup_queue, lookup_seen,
        geo_enabled=(GEO_PROVIDER == 'ipwhois'),
        get_lsof_mapping=get_lsof_mapping
    )


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class NetWatchHandler(SimpleHTTPRequestHandler):
    """Local-only API. Process termination requires same-origin proof and a PID identity."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Content-Security-Policy',
                         "frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
        self.send_header('Cache-Control', 'no-store')
        if getattr(self, '_pages_cors', False):
            self.send_header('Access-Control-Allow-Origin', PAGES_ORIGIN)
            self.send_header('Vary', 'Origin')
        super().end_headers()

    def _host_allowed(self):
        host = self.headers.get('Host', '').strip().lower()
        return host in (f'localhost:{PORT}', f'127.0.0.1:{PORT}')

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _authorize_read(self, route):
        """Remote Pages can only read these API routes with an opt-in pairing token."""
        self._pages_cors = False
        origin = self.headers.get('Origin', '')
        if not origin or origin in (f'http://localhost:{PORT}', f'http://127.0.0.1:{PORT}'):
            return True
        if (route not in ('/api/connections', '/api/interfaces') or
                not PAGES_ORIGIN or origin != PAGES_ORIGIN):
            return False
        if not hmac.compare_digest(
                self.headers.get('X-NetWatch-Read-Token', ''), PAGES_READ_TOKEN):
            return False
        self._pages_cors = True
        return True

    def do_OPTIONS(self):
        route = urlsplit(self.path).path
        origin = self.headers.get('Origin', '')
        requested_method = self.headers.get('Access-Control-Request-Method', '')
        requested_headers = {
            item.strip().lower() for item in
            self.headers.get('Access-Control-Request-Headers', '').split(',')
            if item.strip()
        }
        if (not self._host_allowed() or not PAGES_ORIGIN or
                route not in ('/api/connections', '/api/interfaces') or
                origin != PAGES_ORIGIN or requested_method != 'GET' or
                not requested_headers.issubset({'x-netwatch-read-token'}) or
                'x-netwatch-read-token' not in requested_headers):
            return self._send_json({'error': 'Preflight não autorizado'}, 403)
        self._pages_cors = True
        self.send_response(204)
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'X-NetWatch-Read-Token')
        self.send_header('Access-Control-Max-Age', '300')
        self.end_headers()

    def do_GET(self):
        if not self._host_allowed():
            return self._send_json({'error': 'Host inválido'}, 403)
        route = urlsplit(self.path).path
        if not self._authorize_read(route):
            return self._send_json({'error': 'Leitura não autorizada'}, 403)
        if route == '/api/session':
            return self._send_json({'csrf_token': SESSION_TOKEN, 'capabilities': {'kill': True}})
        if route == '/api/connections':
            try:
                result = scan_connections()
            except Exception:
                return self._send_json({'status': 'error', 'error': 'Coleta indisponível'}, 503)
            if self._pages_cors and 'connections' in result:
                # A remotely hosted script must not receive command-line arguments,
                # executable paths, user names or reverse DNS entries (may contain secrets).
                result = dict(result)
                result['connections'] = [
                    {**entry, 'cmdline': '', 'exe': '', 'user': '',
                     'hostname': '', 'owners': []}
                    for entry in result['connections']
                ]
                result['remote_redaction'] = ['cmdline', 'exe', 'user', 'hostname', 'owners']
            return self._send_json(result, 503 if result.get('status') == 'error' else 200)
        if route == '/api/interfaces':
            return self._send_json(get_interfaces())
        if route == '/':
            self.path = '/index.html'
        return super().do_GET()

    def _check_post_authority(self):
        if not self._host_allowed():
            raise PermissionError('Host inválido')
        if self.headers.get('Origin', '') not in (f'http://localhost:{PORT}', f'http://127.0.0.1:{PORT}'):
            raise PermissionError('Origem inválida')
        if self.headers.get('Sec-Fetch-Site', 'same-origin') not in ('same-origin', 'none'):
            raise PermissionError('Requisição de outro site bloqueada')
        if self.headers.get('Content-Type', '').split(';')[0].strip().lower() != 'application/json':
            raise ValueError('Content-Type JSON obrigatório')
        if not hmac.compare_digest(self.headers.get('X-NetWatch-Token', ''), SESSION_TOKEN):
            raise PermissionError('Token de sessão inválido')
        try:
            length = int(self.headers.get('Content-Length', '0'))
        except ValueError as exc:
            raise ValueError('Content-Length inválido') from exc
        if not 1 <= length <= 1024:
            raise ValueError('Requisição fora do limite')
        return length

    @staticmethod
    def _start_ticks(pid):
        with open(f'/proc/{pid}/stat', encoding='utf-8') as file:
            fields = file.read().rsplit(')', 1)[1].split()
        return int(fields[19])

    def _terminate(self, payload):
        pid = payload.get('pid')
        force = payload.get('force', False)
        ticks = payload.get('start_ticks')
        if type(pid) is not int or pid <= 1 or pid == os.getpid():
            raise ValueError('PID inválido ou protegido')
        if type(force) is not bool:
            raise ValueError('Flag force inválida')
        if type(ticks) is not int or ticks <= 0:
            raise ValueError('Identidade do processo ausente')
        with open(f'/proc/{pid}/status', encoding='utf-8') as file:
            uid_line = next((line for line in file if line.startswith('Uid:')), None)
        if not uid_line or int(uid_line.split()[1]) != os.getuid():
            raise PermissionError('Processo de outro usuário ou identidade indisponível')
        if self._start_ticks(pid) != ticks:
            raise ValueError('PID reutilizado; atualize a lista antes de encerrar')
        sig = signal.SIGKILL if force else signal.SIGTERM
        if hasattr(os, 'pidfd_open') and hasattr(signal, 'pidfd_send_signal'):
            fd = os.pidfd_open(pid)
            try:
                if self._start_ticks(pid) != ticks:
                    raise ValueError('Identidade do PID mudou')
                signal.pidfd_send_signal(fd, sig)
            finally:
                os.close(fd)
        else:
            if self._start_ticks(pid) != ticks:
                raise ValueError('Identidade do PID mudou')
            os.kill(pid, sig)
        return {'success': True, 'message': f'Sinal {sig.name} enviado ao PID {pid}'}

    def do_POST(self):
        if urlsplit(self.path).path != '/api/kill':
            return self._send_json({'error': 'Endpoint inexistente'}, 404)
        try:
            length = self._check_post_authority()
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
            if not isinstance(payload, dict):
                raise ValueError('Objeto JSON obrigatório')
            return self._send_json(self._terminate(payload))
        except (PermissionError, ValueError, OSError, json.JSONDecodeError) as exc:
            return self._send_json({'success': False, 'error': str(exc)}, 403 if isinstance(exc, PermissionError) else 400)

    def log_message(self, format, *args):
        code = args[1] if len(args) > 1 else '200'
        if str(code).startswith(('1', '2', '3')):
            return
        super().log_message(format, *args)

def main():
    os.makedirs(WEB_DIR, exist_ok=True)
    # Generate a fresh, private pairing code on each successful startup.
    server = ThreadedHTTPServer((HOST, PORT), NetWatchHandler)
    write_pairing_secret()
    print(f"================================================================")
    print(f"🚀 NetWatch Dashboard iniciado com sucesso!")
    print(f"📡 Acesso Local:  http://localhost:{PORT}")
    print(f"🔒 Acesso somente no host local: http://127.0.0.1:{PORT}")
    print(f"📁 Diretório Web: {WEB_DIR}")
    print(f"================================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nFinalizando NetWatch...")
        save_caches()
        server.server_close()
        print("NetWatch finalizado.")

if __name__ == '__main__':
    main()
