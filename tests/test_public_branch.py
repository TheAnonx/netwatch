"""Independent public Git history: no private main ancestry, no force push."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

from scripts import prepare_public_branch as public


def git(*args, check=True):
    return subprocess.run(['git', *args], text=True, capture_output=True,
                          timeout=20, check=check)


class PublicHistoryTests(unittest.TestCase):
    def test_initial_public_snapshot_and_incremental_updates(self):
        oldcwd = Path.cwd()
        with tempfile.TemporaryDirectory(prefix='netwatch-public-test-') as tmp:
            try:
                os.chdir(tmp)
                git('init', '-q', '-b', 'main')
                git('config', 'user.name', 'Fixture Contributor')
                git('config', 'user.email', 'fixture@users.noreply.github.com')
                for name in ('README.md', 'server.py', 'web/app.js',
                             'docs/INSTALLATION.md', 'docs/RELEASE.md'):
                    file = Path(name)
                    file.parent.mkdir(parents=True, exist_ok=True)
                    file.write_text('Public content\n')
                git('add', '.')
                git('commit', '-q', '-m', 'private local development')
                self.assertEqual(public.main(), 0)
                self.assertEqual(git('rev-list', '--count', 'public-release').stdout.strip(), '1')
                self.assertNotEqual(git('merge-base', 'main', 'public-release',
                                        check=False).returncode, 0)
                self.assertEqual(git('branch', '--show-current').stdout.strip(), 'main')
                self.assertEqual(public.main(), 0)  # Idempotent when no changes.
                self.assertEqual(git('rev-list', '--count', 'public-release').stdout.strip(), '1')
                Path('README.md').write_text('Public content updated\n')
                git('add', 'README.md')
                git('commit', '-q', '-m', 'local update')
                self.assertEqual(public.main(), 0)
                self.assertEqual(git('rev-list', '--count', 'public-release').stdout.strip(), '2')
                self.assertEqual(git('branch', '--show-current').stdout.strip(), 'main')
            finally:
                os.chdir(oldcwd)

    def test_reject_uncommitted_changes(self):
        oldcwd = Path.cwd()
        with tempfile.TemporaryDirectory(prefix='netwatch-public-test-') as tmp:
            try:
                os.chdir(tmp)
                git('init', '-q', '-b', 'main')
                git('config', 'user.name', 'Fixture Contributor')
                git('config', 'user.email', 'fixture@users.noreply.github.com')
                Path('README.md').write_text('initial')
                git('add', 'README.md')
                git('commit', '-q', '-m', 'fixture')
                Path('README.md').write_text('uncommitted')
                self.assertEqual(public.main(), 1)
                self.assertNotEqual(git('rev-parse', '--verify', 'public-release',
                                        check=False).returncode, 0)
            finally:
                os.chdir(oldcwd)


if __name__ == '__main__':
    unittest.main()
