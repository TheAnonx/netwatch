#!/usr/bin/env python3
"""Linux NetWatch service lifecycle. Never stop an unverified process by port."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
SERVER = (ROOT / 'server.py').resolve()
PIDFILE = ROOT / '.netwatch.pid'
LOGFILE = ROOT / '.netwatch.log'
PORT = 9876


def proc_start_ticks(pid: int) -> int | None:
    try:
        fields = Path(f'/proc/{pid}/stat').read_text().rsplit(')', 1)[1].split()
        return int(fields[19])
    except (OSError, ValueError, IndexError):
        return None


def proc_matches(pid: int) -> bool:
    """Check real /proc argv, uid, process start time and exact source file."""
    try:
        if pid <= 1:
            return False
        raw = Path(f'/proc/{pid}/cmdline').read_bytes().split(b'\0')
        args = [arg.decode('utf-8', errors='replace') for arg in raw if arg]
        cwd = Path(f'/proc/{pid}/cwd').resolve()
        candidates = [(Path(arg) if Path(arg).is_absolute() else cwd / arg).resolve()
                      for arg in args[1:]]
        if not args or SERVER not in candidates:
            return False
        uid_line = next(line for line in
                        Path(f'/proc/{pid}/status').read_text().splitlines()
                        if line.startswith('Uid:'))
        return int(uid_line.split()[1]) == os.getuid() and bool(proc_start_ticks(pid))
    except (OSError, ValueError, StopIteration):
        return False


def pid_record() -> dict | None:
    try:
        text = PIDFILE.read_text().strip()
        if text.isdigit():  # Legacy format; always re-verify identity.
            return {'pid': int(text), 'start_ticks': None}
        parsed = json.loads(text)
        if type(parsed) is not dict:
            return None
        if type(parsed.get('pid')) is not int:
            return None
        return parsed
    except (OSError, ValueError, json.JSONDecodeError):
        return None


def record_matches(record: dict | None) -> bool:
    if not record:
        return False
    pid = record.get('pid')
    if type(pid) is not int or not proc_matches(pid):
        return False
    ticks = proc_start_ticks(pid)
    pinned = record.get('start_ticks')
    if pinned is not None and pinned != ticks:
        return False
    if record.get('script') not in (None, str(SERVER)):
        return False
    return ticks is not None


def occupied() -> bool:
    try:
        with socket.create_connection(('127.0.0.1', PORT), timeout=0.25):
            return True
    except OSError:
        return False


def save_record(pid: int) -> None:
    content = {'pid': pid, 'start_ticks': proc_start_ticks(pid),
               'script': str(SERVER)}
    fd, name = tempfile.mkstemp(
        prefix='.netwatch-pid-', dir=PIDFILE.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as output:
            os.fchmod(output.fileno(), 0o600)
            json.dump(content, output, ensure_ascii=False)
            output.write('\n')
            output.flush()
            os.fsync(output.fileno())
        os.replace(name, PIDFILE)
    finally:
        Path(name).unlink(missing_ok=True)


def start() -> int:
    record = pid_record()
    if record_matches(record):
        print(f'NetWatch já está ativo (PID {record["pid"]}).')
        print(f'Abrir: http://127.0.0.1:{PORT}')
        return 0
    if occupied():
        print(f'Falha: porta {PORT} ocupada por processo não identificado como NetWatch.',
              file=sys.stderr)
        return 1

    try:
        with LOGFILE.open('ab') as logfile:
            process = subprocess.Popen(
                [sys.executable, '-B', str(SERVER)],
                cwd=ROOT,
                stdin=subprocess.DEVNULL,
                stdout=logfile,
                stderr=subprocess.STDOUT,
                start_new_session=True,
                close_fds=True
            )
        for _ in range(40):
            if process.poll() is not None:
                print(f'Falha: servidor saiu com código {process.returncode}. '
                      f'Veja {LOGFILE.name}', file=sys.stderr)
                return 1
            if proc_matches(process.pid) and occupied():
                save_record(process.pid)
                print(f'NetWatch ativo: http://127.0.0.1:{PORT} (PID {process.pid})')
                print('O serviço roda apenas no loopback. GeoIP remoto é opt-in.')
                return 0
            time.sleep(0.1)
        print(f'Falha: porta {PORT} não respondeu. Consulte {LOGFILE.name}',
              file=sys.stderr)
        return 1
    except (OSError, ValueError) as exc:
        print(f'Falha ao iniciar: {exc}', file=sys.stderr)
        return 1


def stop() -> int:
    record = pid_record()
    if not record:
        print('NetWatch não está registrado como serviço deste repositório.')
        return 0
    if not record_matches(record):
        print('Falha segura: PID ausente, reutilizado ou sem identidade comprovada. '
              'Nenhum processo foi encerrado.', file=sys.stderr)
        return 1
    pid = record['pid']
    initial_ticks = proc_start_ticks(pid)
    os.kill(pid, signal.SIGTERM)
    for _ in range(50):
        current = proc_start_ticks(pid)
        if current is None or current != initial_ticks:
            PIDFILE.unlink(missing_ok=True)
            print(f'NetWatch encerrado (PID {pid}).')
            return 0
        # Linux processes may remain as zombies until their parent reaps them.
        try:
            state = Path(f'/proc/{pid}/stat').read_text().rsplit(')', 1)[1].split()[0]
            if state == 'Z':
                PIDFILE.unlink(missing_ok=True)
                print(f'NetWatch encerrado (PID {pid}).')
                return 0
        except OSError:
            PIDFILE.unlink(missing_ok=True)
            return 0
        time.sleep(0.1)
    print('SIGTERM enviado, mas processo ainda ativo. '
          'Nenhum SIGKILL automático foi executado.', file=sys.stderr)
    return 1


def status() -> int:
    record = pid_record()
    if record_matches(record):
        print(f'ACTIVE pid={record["pid"]} url=http://127.0.0.1:{PORT}')
        return 0
    print('INACTIVE' if not occupied() else 'PORT_BUSY_UNVERIFIED')
    return 1


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('start', 'stop', 'status'))
    action = parser.parse_args().action
    result = {'start': start, 'stop': stop, 'status': status}[action]()
    raise SystemExit(result)


if __name__ == '__main__':
    main()
