#!/bin/bash
# backup-db.sh
DB_USER="wp_manager"
DB_PASS="Catalin123!"
DB_NAME="wp_manager"
BACKUP_DIR="/var/www/builder/storage/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > "$BACKUP_DIR/wp_manager_$TIMESTAMP.sql"
echo "Backup creat: $BACKUP_DIR/wp_manager_$TIMESTAMP.sql"
echo "Backup bazei de date finalizat cu succes."