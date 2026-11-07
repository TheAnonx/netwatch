#!/usr/bin/env python3
"""Build an allowlisted, static-only GitHub Pages artifact with no host telemetry."""
from __future__ import annotations

import argparse
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'web'
DEFAULT_OUTPUT = ROOT / 'dist' / 'pages'
STATIC_FILES = (
    'app.js', 'glass.js', 'style.css', 'pages.css', 'pages.js', 'demo.js'
)
VENDOR_FILES = (
    'liquid-glass/LICENSE',
    'liquid-glass/README.md',
    'liquid-glass/liquid-glass.css',
    'liquid-glass/liquid-glass.js',
    'liquid-glass/assets/MapWorker-tpM-Txsc.js',
)


def render_index(index_html: str) -> str:
    """Inject the public connector without modifying the local dashboard HTML."""
    if index_html.count('</head>') != 1:
        raise RuntimeError('Missing or ambiguous closing head tag')
    if '<script src="app.js?' not in index_html:
        raise RuntimeError('Local app entrypoint not found')
    if index_html.count('<script src="app.js?') != 1:
        raise RuntimeError('Ambiguous app entrypoint')
    # The site is interactive but never trusted with the process-termination API.
    style = '  <link rel="stylesheet" href="pages.css">\n'
    html = index_html.replace('</head>', style + '</head>', 1)
    html = html.replace('<script src="app.js?',
                        '<script src="demo.js"></script>\n'
                        '  <script src="pages.js"></script>\n'
                        '  <script src="app.js?', 1)
    # GitHub Pages is HTTPS-only; the sole permitted HTTP connection is loopback.
    # Note: a <meta> CSP cannot implement frame-ancestors; keep the Pages UI read-only.
    policy = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob:; "
        "connect-src 'self' http://127.0.0.1:9876; "
        "worker-src 'self' blob:; "
        "object-src 'none'; base-uri 'none'; form-action 'none'"
    )
    meta = (
        '  <meta name="referrer" content="no-referrer">\n'
        f'  <meta http-equiv="Content-Security-Policy" content="{policy}">\n'
    )
    html = html.replace('</head>', meta + '</head>', 1)
    if re.search(r'on(?:click|load|error)\s*=', html, flags=re.I):
        raise RuntimeError('Inline HTML event handlers are forbidden in public Pages')
    return html


def build_site(target: Path = DEFAULT_OUTPUT) -> list[Path]:
    requested = target.absolute()
    if requested.is_symlink() or (ROOT / 'dist').is_symlink():
        raise ValueError('Refusing symlinked release paths')
    target = requested.resolve()
    if target == ROOT or target == SOURCE or (
            ROOT in target.parents and not target.is_relative_to(ROOT / 'dist')):
        raise ValueError('Refusing to overwrite a source directory')
    if not (target == DEFAULT_OUTPUT.resolve() or
            target.name == 'pages' and target.parent.name.startswith('tmp')):
        raise ValueError('Output must be dist/pages or a temporary test/pages folder')
    if target.exists():
        if not target.is_dir():
            raise ValueError('Output destination must be an ordinary directory')
        shutil.rmtree(target)
    target.mkdir(parents=True, exist_ok=True)
    copied = []
    for filename in STATIC_FILES:
        src = SOURCE / filename
        if not src.is_file() or src.is_symlink():
            raise RuntimeError(f'Static source missing or untrusted: {filename}')
        dst = target / filename
        shutil.copyfile(src, dst)
        copied.append(dst)
    vendor = SOURCE / 'vendor'
    if not vendor.is_dir() or vendor.is_symlink():
        raise RuntimeError('Vendored assets missing')
    found = {p.relative_to(vendor).as_posix() for p in vendor.rglob('*')
             if p.is_file() or p.is_symlink()}
    if found != set(VENDOR_FILES):
        raise RuntimeError('Unexpected vendor file list; review before publishing')
    for name in VENDOR_FILES:
        source = vendor / name
        if not source.is_file() or source.is_symlink():
            raise RuntimeError('Missing or symlinked vendor asset: ' + name)
        destination = target / 'vendor' / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        copied.append(destination)
    index = render_index((SOURCE / 'index.html').read_text(encoding='utf-8'))
    (target / 'index.html').write_text(index, encoding='utf-8')
    (target / '.nojekyll').touch()
    copied.extend([target / 'index.html', target / '.nojekyll'])
    # Strict output policy: runtime logs, caches and Python sources cannot ship.
    for file in target.rglob('*'):
        if file.is_file() and (file.name.startswith('.netwatch') or
                              file.suffix in {'.py', '.pyc', '.key', '.pem', '.log'}):
            raise RuntimeError(f'Unsafe release payload: {file.name}')
    return copied


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT,
                        help='Output directory (default: dist/pages)')
    args = parser.parse_args()
    copied = build_site(args.output)
    print(f'GitHub Pages ready: {args.output} ({sum(f.is_file() for f in copied)} files)')
    print('Preview is demonstration-only until the visitor explicitly pairs a local collector.')


if __name__ == '__main__':
    main()
