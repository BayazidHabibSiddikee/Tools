#!/usr/bin/env bash
# toolforge — start the Toolforge web server
# Usage: ./start.sh [--host] [--port PORT]
#
#   --host   Bind to 0.0.0.0 instead of 127.0.0.1 (LAN-accessible)
#   --port   Override the default port (7077)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-7077}"
HOST="${HOST:-127.0.0.1}"

# Parse flags
while [[ $# -gt 0 ]]; do
  case $1 in
    --host) HOST="0.0.0.0"; shift ;;
    --port) PORT="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

export PORT HOST
exec node "$SCRIPT_DIR/index.js"
