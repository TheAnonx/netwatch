"""Service lifecycle safety: foreign PIDs and occupied ports are never killed."""
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock

from scripts import service_ctl as service


ROOT = Path(__file__).resolve().parents[1]


class LifecycleTests(unittest.TestCase):
    def test_this_test_process_cannot_be_misidentified_as_server(self):
        self.assertFalse(service.proc_matches(os.getpid()))

    def test_stale_pid_record_is_rejected(self):
        record = {'pid': 7777, 'start_ticks': 123, 'script': str(service.SERVER)}
        with mock.patch.object(service, 'proc_matches', return_value=True), \
             mock.patch.object(service, 'proc_start_ticks', return_value=999):
            self.assertFalse(service.record_matches(record))

    def test_untrusted_port_does_not_get_assumed_or_stopped(self):
        with mock.patch.object(service, 'pid_record', return_value=None), \
             mock.patch.object(service, 'occupied', return_value=True), \
             mock.patch.object(service.subprocess, 'Popen') as spawned:
            self.assertEqual(service.start(), 1)
            spawned.assert_not_called()

    def test_stop_never_signals_unverified_pid(self):
        with mock.patch.object(service, 'pid_record', return_value={'pid': 42}), \
             mock.patch.object(service, 'record_matches', return_value=False), \
             mock.patch.object(service.os, 'kill') as killer:
            self.assertEqual(service.stop(), 1)
            killer.assert_not_called()

    def test_pid_record_created_atomically_with_private_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / '.netwatch.pid'
            with mock.patch.object(service, 'PIDFILE', target), \
                 mock.patch.object(service, 'proc_start_ticks', return_value=123):
                service.save_record(9100)
            record = json.loads(target.read_text())
            self.assertEqual(record['pid'], 9100)
            self.assertEqual(record['start_ticks'], 123)
            self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o600)
            self.assertFalse(list(Path(directory).glob('.netwatch-pid-*')))

    def test_wrappers_never_kill_by_port(self):
        for name in ('start.sh', 'stop.sh'):
            source = (ROOT / name).read_text()
            self.assertIn('service_ctl.py', source)
            self.assertNotIn('kill -9', source)
            self.assertNotIn('lsof -Pi', source)


if __name__ == '__main__':
    unittest.main()
