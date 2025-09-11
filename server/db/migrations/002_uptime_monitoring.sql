-- Create the uptime checks table
CREATE TABLE IF NOT EXISTS wp_manager_uptime_checks (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    site_id BIGINT UNSIGNED NOT NULL,
    url VARCHAR(2048) NOT NULL,
    check_interval INT NOT NULL DEFAULT 300,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_check DATETIME NULL,
    last_status INT NULL,
    response_time INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_site_id (site_id),
    KEY idx_active_lastcheck (is_active, last_check)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create the uptime history table
CREATE TABLE IF NOT EXISTS wp_manager_uptime_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    check_id BIGINT UNSIGNED NOT NULL,
    status_code INT NULL,
    response_time INT NULL,
    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_check_id (check_id),
    KEY idx_checked_at (checked_at),
    FOREIGN KEY (check_id) REFERENCES wp_manager_uptime_checks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
