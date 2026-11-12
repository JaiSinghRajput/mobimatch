#!/bin/bash
# MobiMatch Automated PostgreSQL Backup Script with 7-Day Rolling Retention
set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/mobimatch}"
DB_CONTAINER="${DB_CONTAINER:-mobimatch-app-postgres-1}"
DB_NAME="${DB_NAME:-mobimatch}"
DB_USER="${DB_USER:-postgres}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/mobimatch_${DATE}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting PostgreSQL backup for ${DB_NAME}..."

# If running via docker
if docker ps -q -f name="${DB_CONTAINER}" | grep -q .; then
    docker exec "${DB_CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
    pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
fi

echo "[$(date)] Backup completed: ${BACKUP_FILE}"

# Retention: Delete backups older than 7 days
echo "[$(date)] Pruning backups older than 7 days..."
find "${BACKUP_DIR}" -type f -name "mobimatch_*.sql.gz" -mtime +7 -exec rm -f {} \;
echo "[$(date)] Backup rotation complete."

