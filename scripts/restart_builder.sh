#!/bin/bash
# Script de restart sigur pentru Builder Quantum Sanctuary

# --- Configurare variabile ---
APP_DIR="/var/www/builder"
BACKUP_SCRIPT="$APP_DIR/backup-db.sh"
NODE_START_CMD="pnpm run start"  # sau comanda ta de pornire Node în producție
NGINX_SERVICE="nginx"

echo "=============================="
echo "Restart sigur Builder Quantum Sanctuary"
echo "=============================="

# 1️⃣ Crează backup DB înainte de restart
echo "[1/5] Creare backup bazei de date..."
if [ -f "$BACKUP_SCRIPT" ]; then
    bash "$BACKUP_SCRIPT"
else
    echo "⚠️ Backup script nu găsit la $BACKUP_SCRIPT! Oprește restart-ul."
    exit 1
fi

# 2️⃣ Oprește aplicația Node dacă rulează
echo "[2/5] Oprire aplicație Node..."
pkill -f "$NODE_START_CMD" || echo "Node nu era pornit."

# 3️⃣ Aplica migrations fără a reseta date
echo "[3/5] Aplicare migrations..."
cd "$APP_DIR"
pnpm run migrate || echo "⚠️ Migrări deja aplicate sau eroare ignorată."

# 4️⃣ Pornește aplicația Node
echo "[4/5] Pornire aplicație Node..."
nohup $NODE_START_CMD > "$APP_DIR/node.log" 2>&1 &
echo "Node pornește în background. Log: $APP_DIR/node.log"

# 5️⃣ Repornește Nginx
echo "[5/5] Repornește Nginx..."
sudo systemctl restart $NGINX_SERVICE
sudo systemctl status $NGINX_SERVICE --no-pager

echo "=============================="
echo "Restart finalizat cu succes!"
echo "=============================="
