#!/usr/bin/env python3
"""Prepare a public Git history without rewriting the private development branch.

Copies the current *committed tree* into an independent public-release commit,
with no ancestry from main. Later runs append only public snapshot commits.
The working tree is never checked out, reset or rewritten; no push is performed.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys

GIT = ['git']
REF = 'refs/heads/public-release'
BANNED_TRACKED = re.compile(
    r'(?:^|/)(?:\.env(?:\..*)?|\.netwatch[^/]*|\.dns_cache\.json|'
    r'\.geo_cache\.json|\.backups|__pycache__|dist)(?:/|$)|'
    r'\.(?:pem|key|pyc|log)$',
    re.IGNORECASE
)
PRIVATE_PATH = re.compile(r'/run/media/[^/\s]+/|/home/[^/\s]+/')


def git(*args, input_text: str | None = None, env=None, check=True):
    result = subprocess.run(
        [*GIT, *args], input=input_text, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, text=True, env=env, timeout=25)
    if check and result.returncode:
        raise RuntimeError(result.stderr.strip() or f'git {args} failed')
    return result


def main():
    status = git('status', '--porcelain').stdout
    if status.strip():
        print('FAIL: commit or remove working-tree changes before preparing release.',
              file=sys.stderr)
        return 1

    tracked = git('ls-tree', '-r', '--name-only', 'HEAD').stdout.splitlines()
    bad = [file for file in tracked if BANNED_TRACKED.search(file)]
    if bad:
        print('FAIL: tracked private/runtime filenames:', bad, file=sys.stderr)
        return 1

    # Inspect current committed objects only; never import private development history.
    for path in ('README.md', 'server.py', 'web/app.js', 'docs/INSTALLATION.md',
                 'docs/RELEASE.md'):
        if path not in tracked:
            print('FAIL: missing required release file:', path, file=sys.stderr)
            return 1
        contents = git('show', 'HEAD:' + path).stdout
        if PRIVATE_PATH.search(contents):
            print('FAIL: machine-specific path in release tree:', path, file=sys.stderr)
            return 1

    tree = git('rev-parse', 'HEAD^{tree}').stdout.strip()
    old_result = git('rev-parse', '--verify', REF, check=False)
    old = old_result.stdout.strip() if old_result.returncode == 0 else ''
    if old and git('rev-parse', old + '^{tree}').stdout.strip() == tree:
        print('PASS: public-release already matches the current committed tree.')
        return 0

    # The public commit deliberately uses non-identifying author metadata.
    # Maintainers can change the public author in a new repo before first upload.
    env = os.environ.copy()
    env.update({
        'GIT_AUTHOR_NAME': 'NetWatch contributors',
        'GIT_AUTHOR_EMAIL': 'netwatch-release@users.noreply.github.com',
        'GIT_COMMITTER_NAME': 'NetWatch contributors',
        'GIT_COMMITTER_EMAIL': 'netwatch-release@users.noreply.github.com',
    })
    message = ('chore: initial public NetWatch source snapshot'
               if not old else 'chore: update public NetWatch source snapshot')
    args = ['commit-tree', tree]
    if old:
        args.extend(['-p', old])
    args.extend(['-m', message])
    new = git(*args, env=env).stdout.strip()
    update = ['update-ref', REF, new]
    if old:
        update.append(old)  # Compare-and-swap: fail on concurrent changes.
    git(*update)
    commits = git('rev-list', '--count', REF).stdout.strip()
    print('PASS: public-release prepared; revision:', new[:12], 'public commits:', commits)
    print('No private main ancestry copied, no working-tree checkout, no network push.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
