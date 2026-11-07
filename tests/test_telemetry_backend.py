"""Backend contract tests: source completeness, identity, truthful errors and local API."""

import json
import os
import unittest
from collections import deque
from email.message import Message
from threading import Lock
from unittest import mock

import telemetry_collector as collector


def sample_sources():
    return {
        'inet': [
            'tcp LISTEN 0 128 172.16.99.209:8080 0.0.0.0:* users:(("web",pid=321,fd=3))',
            'tcp ESTAB 0 0 172.16.99.209:43000 1.1.1.1:443 users:(("web",pid=321,fd=5))',
            'udp UNCONN 0 0 0.0.0.0:5353 0.0.0.0:* users:(("mdns",pid=444,fd=4))',
            'tcp TIME-WAIT 0 0 172.16.99.209:44000 8.8.8.8:443',
        ],
        'raw': ['UNCONN 0 0 *:58 *:*'],
        'unix': [
            'u_str ESTAB 0 0 /run/user/1000/bus 111 * 222 users:(("dbus",pid=555,fd=1))',
            'u_str ESTAB 0 0 * 333 * 444',
        ]
    }


def parse_endpoint(value):
    parts = value.rsplit(':', 1)
    addr, port = parts if len(parts) == 2 else (value, '')
    return {'raw': value, 'ip': addr, 'port': port,
            'port_int': int(port) if port.isdigit() else 0, 'service': '',
            'iface': ''}


class CollectorContractTests(unittest.TestCase):
    def scan(self, failures=()):
        sources = sample_sources()
        def fake_ss(argv, timeout=8):
            source = {v[1]: k for k, v in collector.SOURCES.items()}[argv[1]]
            if source in failures:
                raise RuntimeError('mocked source unavailable')
            return sources[source]

        iface = [{'name': 'wlo1', 'is_up': True, 'addresses': [
            {'ip': '172.16.99.209', 'family': 'inet'}]}]
        lock = Lock()
        queue = deque()
        seen = set()
        with mock.patch.object(collector, 'run_ss', side_effect=fake_ss), \
             mock.patch.object(collector, 'pid_start_ticks', return_value=127):
            return collector.collect_snapshot(
                parse_endpoint,
                lambda pid: {'cmdline': 'verified', 'exe': '/bin/test', 'user': 'test'},
                lambda: iface,
                lambda total: ({'available': True, 'total_rx_bps': 3,
                                'total_tx_bps': 2, 'interfaces': {}}, []),
                lambda ip: (ip.startswith('172.'), 'LAN'),
                lock, {}, {}, lock, queue, seen, geo_enabled=False,
                get_lsof_mapping=lambda: {}
            )

    def test_all_families_are_collected(self):
        data = self.scan()
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['summary']['total'], 7)
        self.assertEqual(data['summary']['listen'], 1)
        self.assertEqual(data['summary']['bound'], 1)
        self.assertEqual(data['summary']['raw'], 1)
        self.assertEqual(data['summary']['unix'], 2)
        self.assertEqual(data['summary']['unique_processes'], 3)
        self.assertEqual(data['sources']['inet']['count'], 4)

    def test_unknown_process_never_gets_guessed_name(self):
        data = self.scan()
        unnamed = [c for c in data['connections'] if not c['pid']]
        self.assertTrue(unnamed)
        self.assertTrue(all(c['process_name'] == 'Não identificado' for c in unnamed))
        self.assertTrue(all(not c['identity_verified'] for c in unnamed))
        self.assertEqual(len(data['top_processes']), 3)

    def test_unconnected_udp_has_no_remote_geolocation(self):
        data = self.scan()
        udp = next(c for c in data['connections']
                   if c['proto'] == 'udp' and c['state'] == 'UNCONN')
        self.assertIsNone(udp['geo'])
        self.assertFalse(udp['peer_is_public'])
        self.assertEqual(udp['direction'], 'BOUND')

    def test_public_flag_and_interface_binding(self):
        rows = self.scan()['connections']
        internet = next(c for c in rows if c['peer']['ip'] == '1.1.1.1')
        self.assertEqual(internet['local']['iface'], 'wlo1')
        self.assertTrue(internet['peer_is_public'])
        self.assertFalse(any(c['peer_is_public'] for c in rows if c['proto'] == 'unix'))

    def test_partial_error_does_not_fabricate_success(self):
        data = self.scan(failures=('inet',))
        self.assertEqual(data['status'], 'partial')
        self.assertEqual(data['sources']['inet']['status'], 'error')
        self.assertEqual(data['summary']['tcp'], 0)
        self.assertGreater(data['summary']['unix'], 0)

    def test_total_collection_failure_is_explicit(self):
        data = self.scan(failures=('inet', 'raw', 'unix'))
        self.assertEqual(data['status'], 'error')
        self.assertNotIn('connections', data)

    def test_unix_anonymous_socket_tracks_inode(self):
        data = self.scan()
        unnamed = next(c for c in data['connections']
                       if c['proto'] == 'unix' and not c['pid'])
        self.assertEqual(unnamed['local']['inode'], '333')
        self.assertEqual(unnamed['direction'], 'LOCAL')


class ApiAuthorizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import server
        cls.server = server

    def handler(self, origin='http://127.0.0.1:9876', token=None):
        request = object.__new__(self.server.NetWatchHandler)
        request.headers = Message()
        request.headers['Host'] = '127.0.0.1:9876'
        request.headers['Origin'] = origin
        request.headers['Content-Type'] = 'application/json'
        request.headers['Content-Length'] = '42'
        if token:
            request.headers['X-NetWatch-Token'] = token
        return request

    def test_reject_missing_session_token(self):
        with self.assertRaises(PermissionError):
            self.handler()._check_post_authority()

    def test_reject_cross_site_even_with_token(self):
        with self.assertRaises(PermissionError):
            self.handler(origin='http://attacker.test',
                         token=self.server.SESSION_TOKEN)._check_post_authority()

    def test_valid_authority_check_is_non_destructive(self):
        self.assertEqual(self.handler(token=self.server.SESSION_TOKEN)
                         ._check_post_authority(), 42)

    def test_invalid_pid_cannot_terminate_server(self):
        with self.assertRaises(ValueError):
            self.handler()._terminate({'pid': os.getpid(), 'force': False,
                                       'start_ticks': 1})

    def test_loopback_bind_is_default(self):
        self.assertEqual(self.server.HOST, '127.0.0.1')


if __name__ == '__main__':
    unittest.main()
