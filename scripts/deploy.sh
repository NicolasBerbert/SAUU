#!/bin/bash
# ─────────────────────────────────────────────────────────
# Script de deploy — SAUU
# Executar no servidor: bash /var/www/sauu/scripts/deploy.sh
# ─────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="/var/www/sauu"
cd "$APP_DIR"

echo "==> [1/5] Atualizando código..."
git pull origin main

echo "==> [2/5] Instalando dependências..."
npm ci --omit=dev

echo "==> [3/5] Aplicando migrations..."
npx prisma migrate deploy

echo "==> [4/5] Building..."
npm run build

echo "==> [5/5] Reiniciando PM2 (zero-downtime)..."
pm2 reload sauu --update-env

echo ""
echo "Deploy concluído com sucesso!"
pm2 status
