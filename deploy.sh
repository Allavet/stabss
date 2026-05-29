#!/usr/bin/env bash
set -euo pipefail

SSH_USER="tomall"
SSH_HOST="tolktid.se"
SSH_PORT="30010"
REMOTE_PATH="/var/www/tolktid.se/public/stockholmsstad"

echo "==> Building production bundle"
npm run build

echo "==> Uploading dist/ to ${SSH_USER}@${SSH_HOST}:${REMOTE_PATH} (port ${SSH_PORT})"
shopt -s dotglob nullglob
scp -P "${SSH_PORT}" -r dist/* "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/"

echo "==> Done. Live at https://tolktid.se/stockholmsstad/"
