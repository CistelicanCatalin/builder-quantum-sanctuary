-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS wp_manager_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create sites table
CREATE TABLE IF NOT EXISTS wp_manager_sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL UNIQUE,
    api_key VARCHAR(128) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    status ENUM('active', 'inactive', 'error') DEFAULT 'active',
    last_seen DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    settings JSON DEFAULT NULL,
    INDEX idx_url (url),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;