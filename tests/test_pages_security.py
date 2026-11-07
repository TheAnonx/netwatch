"""Release gating: local-only backend and public Pages mode are separate."""

import os
from pathlib import Path
import stat
import tempfile
import unittest
from email.message import Message
from unittest import mock

import server


class PagesAuthorizationTests(unittest.TestCase):
    ORIGIN = 'https://netwatch-test.github.io'
    TOKEN = 'test-read-token-do-not-use-in-production-0001'

    def make_handler(self, origin=None, token=None, route='/api/connections'):
        handler = object.__new__(server.NetWatchHandler)
        handler.headers = Message()
        handler.headers['Host'] = '127.0.0.1:9876'
        if origin is not None:
            handler.headers['Origin'] = origin
        if token is not None:
            handler.headers['X-NetWatch-Read-Token'] = token
        handler.path = route
        handler._pages_cors = False
        return handler

    def test_exact_origin_and_read_token_are_required(self):
        with mock.patch.object(server, 'PAGES_ORIGIN', self.ORIGIN), \
             mock.patch.object(server, 'PAGES_READ_TOKEN', self.TOKEN):
            h = self.make_handler(self.ORIGIN, self.TOKEN)
            self.assertTrue(h._authorize_read('/api/connections'))
            self.assertTrue(h._pages_cors)
            h = self.make_handler(self.ORIGIN, self.TOKEN, '/api/session')
            self.assertFalse(h._authorize_read('/api/session'))
            self.assertFalse(h._pages_cors)
            self.assertFalse(self.make_handler(
                'https://evil.example', self.TOKEN)._authorize_read('/api/connections'))
            self.assertFalse(self.make_handler(
                self.ORIGIN, 'wrong')._authorize_read('/api/connections'))
            self.assertFalse(self.make_handler(
                self.ORIGIN, self.TOKEN)._authorize_read('/api/kill'))

    def test_local_browser_is_not_forced_to_pair(self):
        self.assertTrue(self.make_handler(origin=None)._authorize_read('/api/connections'))
        self.assertTrue(self.make_handler(
            'http://127.0.0.1:9876')._authorize_read('/api/connections'))

    def test_remote_read_strips_sensitive_process_metadata(self):
        source = {
            'status': 'ok', 'sources': {'inet': {'status': 'ok'}},
            'summary': {'total': 1},
            'connections': [{'pid': 123, 'cmdline': 'TOP_SECRET_ARG',
                             'exe': '/private/program', 'user': 'private-user',
                             'hostname': 'private.example', 'owners': [{'pid': 123}],
                             'process_name': 'example', 'state': 'ESTAB'}]
        }
        handler = self.make_handler(self.ORIGIN, self.TOKEN)
        response = {}
        handler._send_json = lambda value, status=200: response.update(
            value=value, status=status)
        with mock.patch.object(server, 'PAGES_ORIGIN', self.ORIGIN), \
             mock.patch.object(server, 'PAGES_READ_TOKEN', self.TOKEN), \
             mock.patch.object(server, 'scan_connections', return_value=source):
            handler.do_GET()
        self.assertEqual(response['status'], 200)
        row = response['value']['connections'][0]
        for sensitive in ('cmdline', 'exe', 'user', 'hostname'):
            self.assertEqual(row[sensitive], '')
        self.assertEqual(row['owners'], [])
        self.assertEqual(source['connections'][0]['cmdline'], 'TOP_SECRET_ARG')

    def test_no_cross_origin_process_kill(self):
        handler = self.make_handler(self.ORIGIN, self.TOKEN, '/api/kill')
        handler.headers['Content-Type'] = 'application/json'
        handler.headers['Content-Length'] = '40'
        handler.headers['X-NetWatch-Token'] = server.SESSION_TOKEN
        with self.assertRaises(PermissionError):
            handler._check_post_authority()

    def test_preflight_allows_only_token_header_on_read_endpoints(self):
        with mock.patch.object(server, 'PAGES_ORIGIN', self.ORIGIN):
            handler = self.make_handler(self.ORIGIN)
            handler.headers['Access-Control-Request-Method'] = 'GET'
            handler.headers['Access-Control-Request-Headers'] = 'x-netwatch-read-token'
            codes = []
            headers = {}
            handler.send_response = codes.append
            handler.send_header = lambda key, val: headers.update({key: val})
            handler.end_headers = lambda: None
            handler._send_json = lambda value, status=200: codes.append(status)
            handler.do_OPTIONS()
            self.assertEqual(codes, [204])
            self.assertEqual(headers['Access-Control-Allow-Methods'], 'GET')
            self.assertEqual(headers['Access-Control-Allow-Headers'], 'X-NetWatch-Read-Token')
            self.assertTrue(handler._pages_cors)
            handler.headers.replace_header('Access-Control-Request-Method', 'POST')
            handler.do_OPTIONS()
            self.assertEqual(codes[-1], 403)

    def test_https_origin_validation(self):
        self.assertEqual(server.validated_pages_origin(self.ORIGIN), self.ORIGIN)
        for invalid in ('http://someone.github.io', 'https://*.github.io',
                        'https://someone.github.io/repo',
                        'https://someone.github.io?token=1',
                        'https://user:password@github.io'):
            with self.subTest(value=invalid):
                with self.assertRaises(ValueError):
                    server.validated_pages_origin(invalid)

    def test_pairing_secret_is_private_and_not_committed(self):
        with tempfile.TemporaryDirectory() as workdir:
            filename = Path(workdir) / '.netwatch-pages-token'
            with mock.patch.object(server, 'PAIRING_FILE', str(filename)), \
                 mock.patch.object(server, 'PAGES_ORIGIN', self.ORIGIN), \
                 mock.patch.object(server, 'PAGES_READ_TOKEN', self.TOKEN):
                server.write_pairing_secret()
                self.assertEqual(filename.read_text().strip(), self.TOKEN)
                self.assertEqual(stat.S_IMODE(filename.stat().st_mode), 0o600)
            with mock.patch.object(server, 'PAIRING_FILE', str(filename)), \
                 mock.patch.object(server, 'PAGES_ORIGIN', ''):
                server.write_pairing_secret()
            self.assertFalse(filename.exists())


if __name__ == '__main__':
    unittest.main()
