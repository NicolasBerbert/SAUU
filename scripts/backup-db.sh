#!/bin/bash
# ─────────────────────────────────────────────────────────
# Backup automático do PostgreSQL — SAUU
# Executar via cron: 0 3 * * * /home/ubuntu/backup-db.sh
# ─────────────────────────────────────────────────────────

set -euo pipefail

DB_NAME="sauu_db"
DB_USER="sauu"
BACKUP_DIR="/var/backups/sauu"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql.gz"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

# Dump comprimido
pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[backup] Backup criado: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Remover backups mais antigos que KEEP_DAYS dias
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
echo "[backup] Backups antigos removidos (retendo últimos ${KEEP_DAYS} dias)"

# ─────────────────────────────────────────────────────────
# Opcional: sincronizar para Oracle Object Storage
# Descomente e configure após criar o bucket:
#
# oci os object bulk-upload \
#   --bucket-name sauu-backups \
#   --src-dir "$BACKUP_DIR" \
#   --include "backup_*.sql.gz" \
#   --overwrite
# ─────────────────────────────────────────────────────────
