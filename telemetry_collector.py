"""Read-only Linux socket inventory for NetWatch.

Every displayed socket originates in ss; process identity is never inferred from ports.
The collector preserves failures by source instead of fabricating empty results.
"""
import ipaddress
import os
import re
import subprocess
import time
from collections import Counter

SOURCES = {
    'inet': ['ss', '-tupnaH'],
    'raw': ['ss', '-awpnH'],
    'unix': ['ss', '-xapnH'],
}
PID_PATTERN = re.compile(r'"([^"]+)",pid=(\d+)')


def run_ss(argv, timeout=8):
    """Return lines or raise, including on nonzero exit status."""
    result = subprocess.run(argv, capture_output=True, text=True, timeout=timeout, check=False)
    if result.returncode:
        raise RuntimeError(f'ss retornou {result.returncode}: {result.stderr.strip()[:160]}')
    return result.stdout.splitlines()


def endpoint(raw, parse_endpoint):
    if not raw:
        raw = '*:*'
    return parse_endpoint(raw)


def unix_endpoint(path, inode):
    return {'raw': path, 'ip': path, 'port': '', 'port_int': 0,
            'service': '', 'iface': '', 'inode': inode}


def parse_rows(kind, lines, parse_endpoint):
    rows = []
    for line in lines:
        tokens = line.split()
        if kind == 'inet':
            # Netid State Recv-Q Send-Q Local Peer [users:(...)]
            if len(tokens) < 6:
                continue
            proto, state, recv, send, local, peer = tokens[:6]
            proc = line.split(None, 6)[6] if len(tokens) > 6 else ''
            loc, rem = endpoint(local, parse_endpoint), endpoint(peer, parse_endpoint)
            socket_type = ''
        elif kind == 'raw':
            # Raw socket output does not carry a Netid prefix.
            if len(tokens) < 5:
                continue
            proto, state = 'raw', tokens[0]
            recv, send, local, peer = tokens[1:5]
            proc = line.split(None, 5)[5] if len(tokens) > 5 else ''
            loc, rem = endpoint(local, parse_endpoint), endpoint(peer, parse_endpoint)
            socket_type = ''
        else:
            # unix: Netid State Recv-Q Send-Q LocalPath LocalInode PeerPath PeerInode [users]
            if len(tokens) < 8:
                continue
            socket_type, state, recv, send, local_path, local_ino, peer_path, peer_ino = tokens[:8]
            proto = 'unix'
            proc = line.split(None, 8)[8] if len(tokens) > 8 else ''
            loc, rem = unix_endpoint(local_path, local_ino), unix_endpoint(peer_path, peer_ino)
        if not proto or proto not in ('tcp', 'udp', 'raw', 'unix'):
            continue
        names = PID_PATTERN.findall(proc)
        pid = int(names[0][1]) if names else None
        process_name = names[0][0] if names else None
        rows.append({'proto': proto, 'socket_type': socket_type, 'state': state.upper(),
                     'recv_q': recv, 'send_q': send, 'local': loc, 'peer': rem,
                     'pid': pid, 'process_name': process_name,
                     'owners': [{'name': name, 'pid': int(pid)} for name, pid in names]})
    return rows


def _is_global_address(address):
    try:
        return ipaddress.ip_address(address).is_global
    except ValueError:
        return False


def pid_start_ticks(pid):
    if not pid:
        return None
    try:
        with open(f'/proc/{pid}/stat', encoding='utf-8') as file:
            return int(file.read().rsplit(')', 1)[1].split()[19])
    except (OSError, ValueError, IndexError):
        return None


def app_category(name):
    if not name:
        return 'Desconhecido'
    name = name.lower()
    for category, markers in (
        ('Navegador Web', ('chrome', 'firefox', 'brave', 'chromium', 'opera', 'edge')),
        ('Dev & IA', ('chatgpt', 'claude', 'codex', 'code', 'cursor', 'node')),
        ('Rede & VPN', ('tailscale', 'zerotier', 'openvpn', 'wireguard')),
        ('Contêineres', ('docker', 'containerd')),
        ('Comunicação', ('discord', 'telegram', 'slack', 'teams', 'zoom')),
        ('Sistema Operacional', ('systemd', 'avahi', 'networkmanager', 'sshd', 'cupsd')),
    ):
        if any(marker in name for marker in markers):
            return category
    return 'Geral'


def direction_for(row, listening):
    proto, state, local, peer = row['proto'], row['state'], row['local'], row['peer']
    if proto == 'unix':
        return 'LOCAL'
    if proto == 'raw':
        return 'RAW'
    wildcard = peer['ip'] in ('*', '0.0.0.0', '::') or peer['port'] in ('*', '')
    if proto == 'tcp' and state == 'LISTEN':
        return 'LISTEN'
    if proto == 'udp' and wildcard:
        return 'BOUND'  # Bound UDP is not a TCP listener.
    if wildcard:
        return 'UNKNOWN'
    if local['ip'] in ('127.0.0.1', '::1') and peer['ip'] in ('127.0.0.1', '::1'):
        return 'LOCAL'
    if proto == 'tcp' and local['port_int'] in listening:
        return 'INBOUND'  # Heuristic: accepted socket on a local listening port.
    if state in ('TIME-WAIT', 'CLOSE-WAIT', 'FIN-WAIT-1', 'FIN-WAIT-2', 'LAST-ACK'):
        return 'UNKNOWN'  # The original initiating direction is not provable.
    return 'OUTBOUND'  # Heuristic; not a packet capture.


def collect_snapshot(parse_endpoint, get_process_details, get_interfaces,
                     get_bandwidth_rates, is_special_or_private,
                     cache_lock, geo_cache, dns_cache, queue_lock, lookup_queue,
                     lookup_seen, geo_enabled=False, get_lsof_mapping=None):
    samples, errors = {}, {}
    for name, cmd in SOURCES.items():
        try:
            samples[name] = parse_rows(name, run_ss(cmd), parse_endpoint)
        except (OSError, subprocess.SubprocessError, RuntimeError) as exc:
            errors[name] = str(exc)
            samples[name] = []
    if len(errors) == len(SOURCES):
        return {'status': 'error', 'error': 'Fontes de sockets indisponíveis',
                'sources': {key: {'status': 'error', 'error': errors[key]} for key in SOURCES}}

    interfaces = get_interfaces()
    if not interfaces:
        errors['interfaces'] = 'Não foi possível inventariar interfaces de rede'
    address_to_iface = {
        addr['ip']: iface['name'] for iface in interfaces for addr in iface.get('addresses', [])
        if addr.get('ip') and iface.get('is_up')
    }
    real_process_fallback = get_lsof_mapping() if get_lsof_mapping else {}
    listening = {r['local']['port_int'] for r in samples['inet']
                 if r['proto'] == 'tcp' and r['state'] == 'LISTEN'}
    rows = [r for group in samples.values() for r in group]
    proc_cache = {}
    ticks_cache = {}
    counts = Counter()
    top_processes = Counter()
    top_countries = Counter()
    connections = []
    for row in rows:
        if row['proto'] in ('tcp', 'udp', 'raw'):
            row['local']['iface'] = (
                row['local'].get('iface') or address_to_iface.get(row['local']['ip'], '')
            )
        pid = row['pid']
        if pid is None and row['proto'] in ('tcp', 'udp'):
            key = row['local']['raw'] + '->' + row['peer']['raw']
            fallback = real_process_fallback.get(key)
            if fallback:
                pid = int(fallback['pid'])
                row['process_name'] = fallback['command']
                row['owners'] = [{'name': fallback['command'], 'pid': pid}]
        if pid and pid not in proc_cache:
            proc_cache[pid] = get_process_details(pid)
        if pid and pid not in ticks_cache:
            ticks_cache[pid] = pid_start_ticks(pid)
        proc = proc_cache.get(pid) or {}
        name = row['process_name'] or None
        if name and pid is not None:
            top_processes[name] += 1
        direction = direction_for(row, listening)
        peer = row['peer']
        geo, hostname = None, ''
        if row['proto'] in ('tcp', 'udp'):
            ip = peer['ip']
            try:
                is_ip = bool(ipaddress.ip_address(ip))
            except ValueError:
                is_ip = False
            if is_ip and ip not in ('0.0.0.0', '::'):
                is_private, label = is_special_or_private(ip)
                if is_private:
                    geo = {'status': 'local', 'country': 'Rede Local', 'city': label}
                else:
                    with cache_lock:
                        item = geo_cache.get(ip)
                        hostname = dns_cache.get(ip, '')
                    if item and item.get('status') == 'success':
                        geo = item
                    needs_geo = geo_enabled and (not item or (
                        item.get('status') == 'fail' and
                        float(item.get('retry_at', 0)) <= time.time()))
                    needs_dns = ip not in dns_cache
                    if needs_geo or needs_dns:
                        with queue_lock:
                            if ip not in lookup_seen:
                                lookup_seen.add(ip)
                                lookup_queue.append(ip)
        if geo and geo.get('status') == 'success' and direction == 'OUTBOUND':
            country = geo.get('country')
            if country and country not in ('Rede Local', 'Desconhecido'):
                top_countries[country] += 1
        counts[row['proto']] += 1
        counts[direction] += 1
        if row['state'] == 'ESTAB':
            counts['established'] += 1
        if pid is None:
            counts['unidentified'] += 1
        connections.append({
            'proto': row['proto'], 'socket_type': row['socket_type'], 'state': row['state'],
            'direction': direction, 'recv_q': row['recv_q'], 'send_q': row['send_q'],
            'local': row['local'], 'peer': peer, 'pid': pid,
            'process_name': name or 'Não identificado',
            'identity_verified': bool(pid is not None and name),
            'peer_is_public': bool(row['proto'] in ('tcp', 'udp') and
                                   peer['ip'] not in ('*', '') and
                                   _is_global_address(peer['ip'])),
            'start_ticks': ticks_cache.get(pid), 'owners': row['owners'],
            'app_category': app_category(name), 'cmdline': proc.get('cmdline', ''),
            'exe': proc.get('exe', ''), 'user': proc.get('user', ''),
            'geo': geo, 'hostname': hostname
        })
    known_pids = {c['pid'] for c in connections if c['pid'] is not None}
    with queue_lock:
        queue_size = len(lookup_queue)
    summary = {
        'total': len(connections), 'outbound': counts['OUTBOUND'],
        'inbound': counts['INBOUND'], 'listen': counts['LISTEN'],
        'bound': counts['BOUND'], 'local': counts['LOCAL'],
        'raw': counts['raw'], 'unknown': counts['UNKNOWN'],
        'tcp': counts['tcp'], 'udp': counts['udp'], 'unix': counts['unix'],
        'established': counts['established'], 'unique_processes': len(known_pids),
        'unidentified_sockets': counts['unidentified'], 'queue_size': queue_size
    }
    bandwidth, history = get_bandwidth_rates(len(connections))
    return {
        'status': 'partial' if errors or not interfaces else 'ok',
        'errors': errors,
        'sources': {
            **{key: {'status': 'error', 'error': errors[key]} if key in errors else
               {'status': 'ok', 'count': len(samples[key])} for key in SOURCES},
            'interfaces': {'status': 'ok', 'count': len(interfaces)} if interfaces else
                          {'status': 'error', 'error': errors['interfaces']}
        },
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S%z'),
        'summary': summary, 'bandwidth': bandwidth, 'history': history,
        'connections': connections,
        'top_processes': [{'name': name, 'count': count} for name, count in top_processes.most_common(10)],
        'top_countries': [{'country': name, 'count': count} for name, count in top_countries.most_common(8)],
        'interfaces': interfaces
    }
