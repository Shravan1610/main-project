#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
BACKEND_VENV_DIR="$BACKEND_DIR/.venv"
BACKEND_PYTHON="$BACKEND_VENV_DIR/bin/python"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in PATH."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is not installed or not in PATH."
  exit 1
fi

if ! python3 -m pip --version >/dev/null 2>&1; then
  echo "Error: pip for python3 is not available."
  exit 1
fi

cleanup() {
  echo
  echo "Stopping dev servers..."
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

if [[ ! -d "$BACKEND_VENV_DIR" ]]; then
  echo "Error: backend virtual environment not found at $BACKEND_VENV_DIR"
  echo "Run ./install-deps.sh first."
  exit 1
fi

if [[ ! -x "$BACKEND_PYTHON" ]]; then
  echo "Error: backend python executable not found at $BACKEND_PYTHON"
  echo "Run ./install-deps.sh first."
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Error: frontend dependencies are not installed."
  echo "Run ./install-deps.sh first."
  exit 1
fi

echo "Starting backend on http://localhost:8000 ..."
(
  cd "$BACKEND_DIR"
  "$BACKEND_PYTHON" -m uvicorn src.main:app --reload --port 8000
) &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:3000 ..."
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

echo "World Monitor dev servers are running."
echo "Press Ctrl+C to stop."

wait "$BACKEND_PID" "$FRONTEND_PID"
