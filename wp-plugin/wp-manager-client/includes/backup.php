<?php
// Endpoint pentru backup-ul bazei de date
add_action('rest_api_init', function () {
    register_rest_route('wpm/v1', '/backup/database', [
        'methods'  => 'GET',
        'callback' => 'wpm_backup_database',
        'permission_callback' => '__return_true',
    ]);
});

function wpm_backup_database(WP_REST_Request $request) {
    $auth = wpm_check_auth(); 
    if ($auth !== true) return $auth;

    global $wpdb;
    
    // Setăm timeout-ul la 5 minute
    @set_time_limit(300);
    
    // Dezactivăm compresia
    if(function_exists('apache_setenv')) {
        @apache_setenv('no-gzip', 1);
    }
    @ini_set('zlib.output_compression', 'Off');
    
    // Setăm headerele pentru download
    header("Content-Type: application/sql");
    header("Content-Disposition: attachment; filename=database-backup-" . date("Y-m-d-H-i-s") . ".sql");
    header("Pragma: no-cache");
    header("Expires: 0");
    
    // Obținem toate tabelele WordPress
    $tables = $wpdb->get_results("SHOW TABLES LIKE '{$wpdb->prefix}%'", ARRAY_N);
    
    // Începem exportul
    echo "/* Database backup for " . get_bloginfo('name') . " - " . date("Y-m-d H:i:s") . " */\n\n";
    
    foreach ($tables as $table) {
        $table_name = $table[0];
        
        // Structure
        $create_table = $wpdb->get_row("SHOW CREATE TABLE `{$table_name}`", ARRAY_N);
        echo "\n\n" . $create_table[1] . ";\n\n";
        
        // Data
        $rows = $wpdb->get_results("SELECT * FROM `{$table_name}`", ARRAY_A);
        foreach ($rows as $row) {
            $values = array_map(function($value) use ($wpdb) {
                if ($value === null) return 'NULL';
                return "'" . $wpdb->_real_escape($value) . "'";
            }, $row);
            
            echo "INSERT INTO `{$table_name}` VALUES (" . implode(", ", $values) . ");\n";
        }
    }
    
    exit;
}

// Endpoint pentru backup-ul fișierelor
add_action('rest_api_init', function () {
    register_rest_route('wpm/v1', '/backup/files', [
        'methods'  => 'GET',
        'callback' => 'wpm_backup_files',
        'permission_callback' => '__return_true',
    ]);
});

function wpm_backup_files(WP_REST_Request $request) {
    $auth = wpm_check_auth(); 
    if ($auth !== true) return $auth;
    
    // Setăm timeout-ul la 5 minute
    @set_time_limit(300);
    
    // Dezactivăm compresia
    if(function_exists('apache_setenv')) {
        @apache_setenv('no-gzip', 1);
    }
    @ini_set('zlib.output_compression', 'Off');
    
    // Creăm un fișier ZIP temporar
    $zip_file = tempnam(sys_get_temp_dir(), 'wpm_backup_');
    $zip = new ZipArchive();
    $zip->open($zip_file, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    
    // Adăugăm fișierele WordPress
    $root_path = ABSPATH;
    $root_path = rtrim($root_path, '/\\');
    $files_iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root_path),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
    
    // Excludem anumite directoare și fișiere
    $exclude_dirs = array(
        'wp-content/cache',
        'wp-content/uploads/backups',
        'wp-content/upgrade',
        'wp-content/debug.log'
    );
    
    foreach ($files_iterator as $name => $file) {
        if ($file->isDir()) continue;
        
        $filePath = $file->getRealPath();
        $relativePath = substr($filePath, strlen($root_path) + 1);
        
        // Verificăm dacă fișierul trebuie exclus
        $exclude = false;
        foreach ($exclude_dirs as $dir) {
            if (strpos($relativePath, $dir) === 0) {
                $exclude = true;
                break;
            }
        }
        
        if (!$exclude) {
            $zip->addFile($filePath, $relativePath);
        }
    }
    
    $zip->close();
    
    // Trimitem arhiva
    header("Content-Type: application/zip");
    header("Content-Disposition: attachment; filename=files-backup-" . date("Y-m-d-H-i-s") . ".zip");
    header("Content-Length: " . filesize($zip_file));
    header("Pragma: no-cache");
    header("Expires: 0");
    
    readfile($zip_file);
    unlink($zip_file);
    exit;
}
