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

if [[ ! -d "$BACKEND_VENV_DIR" ]]; then
  echo "Creating backend virtual environment in $BACKEND_VENV_DIR ..."
  python3 -m venv "$BACKEND_VENV_DIR"
fi

echo "Installing backend dependencies ..."
(
  cd "$BACKEND_DIR"
  "$BACKEND_PYTHON" -m pip install -r requirements.txt
)

echo "Installing frontend dependencies ..."
(
  cd "$FRONTEND_DIR"
  npm install
)

echo "Dependencies installed."
