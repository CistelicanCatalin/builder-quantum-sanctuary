#!/bin/bash
# backup-db.sh

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Set backup directory (use from .env or default)
BACKUP_DIR="${BACKUPS_DIR:-storage/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > "$BACKUP_DIR/wp_manager_$TIMESTAMP.sql"
echo "Backup creat: $BACKUP_DIR/wp_manager_$TIMESTAMP.sql"
echo "Backup bazei de date finalizat cu succes."