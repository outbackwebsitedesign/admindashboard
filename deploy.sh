#!/bin/bash
# ============================================================
# WARNING — DO NOT ADD git reset --hard OR git clean TO THIS SCRIPT
#
# The localStorage database files are stored in the user's browser
# and are not tracked by git. git reset --hard and git clean WILL
# NOT affect them, but could still cause issues with deployment.
#
# git pull is the only safe way to update — it only touches tracked files.
# ============================================================
set -e

SERVICE_NAME="admindashboard"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="$(which node)"
PORT=9000

echo "==> Pulling latest from main..."
git -C "$APP_DIR" pull origin main

echo "==> Starting HTTP server on port ${PORT}..."

# Always recreate systemd service to ensure it's up to date
echo "==> Creating systemd service..."
sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" > /dev/null <<EOF
[Unit]
Description=Admin Dashboard HTTP Server
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_BIN} ${APP_DIR}/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
    echo "==> Service created and enabled on boot."

echo "==> Restarting service..."
sudo systemctl restart "$SERVICE_NAME"

echo "==> Done. Service status:"
sudo systemctl status "$SERVICE_NAME" --no-pager -l

echo ""
echo "==> Dashboard available at: http://localhost:${PORT}"
