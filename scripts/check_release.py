#!/usr/bin/env python3
"""Fail closed if the GitHub Pages artifact contains non-static or private files."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist' / 'pages'
EXPECTED = {
    'index.html', 'app.js', 'style.css', 'glass.js',
    'pages.css', 'pages.js', 'demo.js', '.nojekyll', 'vendor'
}
FORBIDDEN_SUFFIXES = {'.py', '.pyc', '.pem', '.key', '.log', '.db', '.sqlite'}
FORBIDDEN_NAMES = {'.env', '.netwatch-pages-token', '.geo_cache.json',
                   '.dns_cache.json', '.netwatch.pid', '.netwatch.log'}
LEAK_PATTERNS = [
    re.compile(r'/run/media/[^/\s]+/'),
    re.compile(r'/home/[^/\s]+/'),
    re.compile(r'-----BEGIN (?:OPENSSH|RSA|EC|PRIVATE) [A-Z ]*KEY-----'),
    re.compile(r'gh[pousr]_[A-Za-z0-9_]{25,}'),
    re.compile(r'github_pat_[A-Za-z0-9_]{35,}'),
]


def check_release(directory: Path = OUTPUT) -> int:
    errors = []
    if not directory.is_dir() or directory.is_symlink():
        return report(['Public artifact not found; run python scripts/build_pages.py'])
    names = {item.name for item in directory.iterdir()}
    if names != EXPECTED:
        errors.append('Unexpected or missing site roots: ' + repr(sorted(names ^ EXPECTED)))
    for path in directory.rglob('*'):
        if path.is_symlink():
            errors.append('Symlink not allowed: ' + path.relative_to(directory).as_posix())
        if not path.is_file():
            continue
        relative = path.relative_to(directory).as_posix()
        if path.name in FORBIDDEN_NAMES or path.suffix in FORBIDDEN_SUFFIXES:
            errors.append('Private file in site: ' + relative)
            continue
        data = path.read_bytes()
        if len(data) > 15_000_000:
            errors.append('Unexpected oversized artifact: ' + relative)
        if b'\0' in data:
            # Browsers may load assets, but they must be curated at source.
            errors.append('Unexpected binary asset in source-only artifact: ' + relative)
            continue
        text = data.decode('utf-8', errors='replace')
        for pattern in LEAK_PATTERNS:
            if pattern.search(text):
                errors.append('Sensitive path or credential pattern: ' + relative)
    html = (directory / 'index.html').read_text(encoding='utf-8') if (directory / 'index.html').exists() else ''
    if not ('src="pages.js"' in html and 'src="demo.js"' in html and
            'http-equiv="Content-Security-Policy"' in html):
        errors.append('Pages bootstrap or CSP is missing')
    return report(errors)


def report(errors):
    if errors:
        for error in errors:
            print('FAIL:', error, file=sys.stderr)
        return 1
    print('PASS: static Pages artifact includes only allowlisted files and no identified secrets')
    return 0


if __name__ == '__main__':
    raise SystemExit(check_release())
