#!/bin/bash
# MobiMatch PostgreSQL Restore Script
set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <path_to_backup.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="${DB_CONTAINER:-mobimatch-app-postgres-1}"
DB_NAME="${DB_NAME:-mobimatch}"
DB_USER="${DB_USER:-postgres}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file ${BACKUP_FILE} not found."
    exit 1
fi

echo "Restoring database ${DB_NAME} from ${BACKUP_FILE}..."

if docker ps -q -f name="${DB_CONTAINER}" | grep -q .; then
    gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"
else
    gunzip -c "${BACKUP_FILE}" | psql -U "${DB_USER}" -d "${DB_NAME}"
fi

echo "Database restore completed successfully."

