#!/usr/bin/env bash
# NetWatch lifecycle: Python verifies the exact process before declaring success.
set -euo pipefail
DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
exec python3 -B "$DIR/scripts/service_ctl.py" start
