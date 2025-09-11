-- Create the backups table
CREATE TABLE IF NOT EXISTS wp_manager_backups (
    id INT NOT NULL AUTO_INCREMENT,
    site_id INT NOT NULL,
    type ENUM('full', 'database', 'files') NOT NULL DEFAULT 'full',
    status ENUM('pending', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    size_bytes BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    retention_days INT NOT NULL DEFAULT 30,
    is_manual BOOLEAN NOT NULL DEFAULT FALSE,
    download_url VARCHAR(2048) NULL,
    PRIMARY KEY (id),
    KEY idx_site_id (site_id),
    KEY idx_status (status),
    KEY idx_created_at (created_at),
    FOREIGN KEY (site_id) REFERENCES wp_manager_sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create the backup schedules table
CREATE TABLE IF NOT EXISTS wp_manager_backup_schedules (
    id INT NOT NULL AUTO_INCREMENT,
    site_id INT NOT NULL,
    type ENUM('full', 'database', 'files') NOT NULL DEFAULT 'full',
    frequency ENUM('daily', 'weekly', 'monthly') NOT NULL,
    time_of_day TIME NOT NULL DEFAULT '00:00:00',
    day_of_week TINYINT NULL, -- 0 = Sunday, 6 = Saturday, NULL for daily
    day_of_month TINYINT NULL, -- 1-31, NULL for daily/weekly
    retention_days INT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_run DATETIME NULL,
    next_run DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_site_id (site_id),
    KEY idx_next_run (next_run),
    FOREIGN KEY (site_id) REFERENCES wp_manager_sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
