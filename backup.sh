#!/bin/bash

BACKUP_DIR="/mnt/c/Users/mmarm/family-agent/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="api"
DB_PATH="/app/database/family_agent.db"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

docker cp "$DB_CONTAINER:$DB_PATH" "$BACKUP_DIR/family_agent_$TIMESTAMP.db"

cd "$BACKUP_DIR" || exit 1
gzip "family_agent_$TIMESTAMP.db"

find "$BACKUP_DIR" -name "*.db.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completado: family_agent_$TIMESTAMP.db.gz"