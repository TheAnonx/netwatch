#!/usr/bin/env bash
# Never kill a process merely because it listens on the NetWatch port.
set -euo pipefail
DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
exec python3 -B "$DIR/scripts/service_ctl.py" stop
