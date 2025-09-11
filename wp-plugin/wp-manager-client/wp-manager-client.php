<?php
/*
Plugin Name: WP Manager Client
Description: Client plugin pentru conectarea site-    register_rest_route('wpm/v1', '/themes/update', [
        'methods'  => 'POST',
        'callback' => 'wpm_themes_update',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('wpm/v1', '/security/file-permissions', [
        'methods'  => 'POST',
        'callback' => 'wpm_check_file_permissions',
        'permission    echo '<form method="post" style="margin-top:10px;">';
    wp_nonce_field('wpm_regenerate_key_action', 'wpm_regenerate_key_nonce');
    echo '<input type="submit" name="wpm_regenerate_key" class="button button-primary" value="Regenerate Key">';
    echo '</form>';
    echo '</div>';
}

// POST /wpm/v1/security/file-permissions
function wpm_check_file_permissions(WP_REST_Request $request) {
    $auth = wpm_check_auth(); 
    if ($auth !== true) return $auth;

    // Lista fișierelor și directoarelor WordPress importante de verificat
    $files_to_check = [
        // Root files
        'index.php',
        'wp-config.php',
        '.htaccess',
        'wp-config-sample.php',
        'wp-login.php',
        'wp-settings.php',
        'wp-load.php',
        'wp-blog-header.php',
        'wp-cron.php',
        'wp-mail.php',
        'xmlrpc.php',
        'readme.html',
        'license.txt',
        'robots.txt',
        'sitemap.xml',
        '.env',
        '.user.ini',
        
        // Directories
        'wp-content',
        'wp-content/themes',
        'wp-content/plugins',
        'wp-content/uploads',
        'wp-admin',
        'wp-includes',
        'wp-content/cache',
        
        // Admin files
        'wp-admin/index.php',
        'wp-admin/admin.php',
        'wp-admin/admin-ajax.php',
        'wp-admin/install.php',
        
        // Includes files
        'wp-includes/functions.php',
        'wp-includes/wp-db.php',
        'wp-includes/version.php',
        
        // Sensitive files
        'wp-content/debug.log',
        'wp-content/wp-config.php',
        'wp-content/backup-db',
    ];

    // Permisiuni recomandate pentru fișiere/directoare
    $recommended_permissions = [
        'index.php' => '0644',
        'wp-config.php' => '0600',
        '.htaccess' => '0644',
        'wp-config-sample.php' => '0644',
        'wp-login.php' => '0644',
        'wp-settings.php' => '0644',
        'wp-load.php' => '0644',
        'wp-blog-header.php' => '0644',
        'wp-cron.php' => '0644',
        'wp-mail.php' => '0644',
        'xmlrpc.php' => '0000', // Ar trebui dezactivat
        'readme.html' => '0000', // Ar trebui șters
        'license.txt' => '0000', // Ar trebui șters
        'robots.txt' => '0644',
        'sitemap.xml' => '0644',
        '.env' => '0600',
        '.user.ini' => '0644',
        
        // Directories
        'wp-content' => '0755',
        'wp-content/themes' => '0755',
        'wp-content/plugins' => '0755',
        'wp-content/uploads' => '0755',
        'wp-admin' => '0755',
        'wp-includes' => '0755',
        'wp-content/cache' => '0755',
        
        // Admin files
        'wp-admin/index.php' => '0644',
        'wp-admin/admin.php' => '0644',
        'wp-admin/admin-ajax.php' => '0644',
        'wp-admin/install.php' => '0000', // Ar trebui șters după instalare
        
        // Includes files
        'wp-includes/functions.php' => '0644',
        'wp-includes/wp-db.php' => '0644',
        'wp-includes/version.php' => '0644',
        
        // Sensitive files
        'wp-content/debug.log' => '0600',
        'wp-content/wp-config.php' => '0000', // Nu ar trebui să existe aici
        'wp-content/backup-db' => '0700',
    ];

    $results = [];
    $wp_root = rtrim(ABSPATH, '/\\') . '/';
    
    foreach ($files_to_check as $file_path) {
        $full_path = $wp_root . $file_path;
        $recommended = isset($recommended_permissions[$file_path]) ? $recommended_permissions[$file_path] : '0644';
        
        if (file_exists($full_path)) {
            $current_perms = substr(sprintf('%o', fileperms($full_path)), -4);
            $formatted_perms = '0' . $current_perms;
            
            // Determină statusul
            $status = 'ok';
            if ($recommended === '0000') {
                $status = ($formatted_perms !== '0000') ? 'error' : 'ok';
            } elseif ($formatted_perms !== $recommended) {
                // Verifică dacă permisiunile sunt mai restrictive (ok) sau mai permisive (warning/error)
                $current_oct = octdec($current_perms);
                $recommended_oct = octdec(substr($recommended, 1));
                
                if ($current_oct > $recommended_oct) {
                    $status = ($current_oct - $recommended_oct > 111) ? 'error' : 'warning'; // 111 octal = diferență semnificativă
                } else {
                    $status = 'ok'; // Mai restrictiv e ok
                }
            }
            
            // Obține datele fișierului
            $file_stats = stat($full_path);
            $created = date('c', $file_stats['ctime']);
            $modified = date('c', $file_stats['mtime']);
            
            $results[] = [
                'file' => $file_path,
                'currentPermissions' => $formatted_perms,
                'recommended' => $recommended,
                'status' => $status,
                'created' => $created,
                'lastModified' => $modified
            ];
        } else {
            // Fișierul nu există - poate fi ok sau nu, depinde de context
            $status = in_array($recommended, ['0000']) ? 'ok' : 'warning';
            
            $results[] = [
                'file' => $file_path,
                'currentPermissions' => 'N/A',
                'recommended' => $recommended,
                'status' => $status,
                'created' => 'N/A',
                'lastModified' => 'N/A'
            ];
        }
    }
    
    return [
        'status' => 'success',
        'site_url' => get_site_url(),
        'permissions' => $results,
        'checked_at' => current_time('c')
    ];
}ack' => '__return_true',
    ]);WordPress cu WP Manager Dashboard. Expune endpoint-uri sigure pentru status, login admin cu token, mentenanță și activare/dezactivare pluginuri.
Version: 1.3.0
Author: YourName
*/

// Include fișierul cu funcționalitățile de backup
require_once plugin_dir_path(__FILE__) . 'includes/backup.php';

if (!defined('ABSPATH')) exit;

// La activare -> generează API key dacă nu există
register_activation_hook(__FILE__, 'wpm_generate_api_key');
function wpm_generate_api_key() {
    if (!get_option('wp_manager_api_key')) {
        $key = bin2hex(random_bytes(32));
        update_option('wp_manager_api_key', $key);
    }
}

// Helper: citește API key din request (Bearer sau ?api_key=)
function wpm_get_api_key_from_request() {
    $api_key = '';
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (!empty($headers['Authorization'])) {
            $auth = $headers['Authorization'];
            if (strpos($auth, 'Bearer ') === 0) {
                $api_key = substr($auth, 7);
            }
        }
    }
    if (empty($api_key) && isset($_GET['api_key'])) {
        $api_key = sanitize_text_field($_GET['api_key']);
    }
    return $api_key;
}

function wpm_check_auth() {
    $provided_key = wpm_get_api_key_from_request();
    $stored_key   = get_option('wp_manager_api_key');
    if ($provided_key !== $stored_key) {
        return new WP_REST_Response(['error' => 'Unauthorized'], 403);
    }
    return true;
}

function wpm_require_plugins_lib() {
    if (!function_exists('activate_plugin')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
}

// Înregistrăm endpoint-urile REST
add_action('rest_api_init', function () {
    register_rest_route('wpm/v1', '/status', [
        'methods'  => 'GET',
        'callback' => 'wpm_get_status',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('wpm/v1', '/plugins/activate', [
        'methods'  => 'POST',
        'callback' => 'wpm_plugins_activate',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('wpm/v1', '/plugins/deactivate', [
        'methods'  => 'POST',
        'callback' => 'wpm_plugins_deactivate',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('wpm/v1', '/plugins/update', [
        'methods'  => 'POST',
        'callback' => 'wpm_plugins_update',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('wpm/v1', '/maintenance', [
        'methods'  => 'POST',
        'callback' => 'wpm_toggle_maintenance',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('wpm/v1', '/admin-login', [
        'methods'  => 'POST',
        'callback' => 'wpm_admin_login_url',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('wpm/v1', '/themes/update', [
        'methods'  => 'POST',
        'callback' => 'wpm_themes_update',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('wpm/v1', '/security/file-permissions', [
        'methods'  => 'POST',
        'callback' => 'wpm_check_file_permissions',
        'permission_callback' => '__return_true',
    ]);
});

// GET /wpm/v1/status
function wpm_get_status(WP_REST_Request $request) {
    $auth = wpm_check_auth(); if ($auth !== true) return $auth;

    global $wpdb;
    // Prevent caches
    if (function_exists('nocache_headers')) nocache_headers();
    if (!function_exists('get_plugins')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    if (!function_exists('get_site_transient')) {
        require_once ABSPATH . 'wp-includes/option.php';
    }
    if (!function_exists('get_home_path')) {
        if (file_exists(ABSPATH . 'wp-admin/includes/file.php')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
    }
    $active_plugins = get_option('active_plugins', []);
    $network_active = function_exists('is_multisite') && is_multisite() ? (array) get_site_option('active_sitewide_plugins', []) : [];
    $network_active_files = is_array($network_active) ? array_keys($network_active) : [];
    $all_plugins    = function_exists('get_plugins') ? get_plugins() : [];

    $updates = get_site_transient('update_plugins');
    $updates_map = [];
    if ($updates && isset($updates->response) && is_array($updates->response)) {
        foreach ($updates->response as $file => $info) {
            if (is_object($info) && isset($info->new_version)) {
                $updates_map[$file] = $info->new_version;
            }
        }
    }

    $active_list = [];
    foreach ($active_plugins as $plugin_file) {
        if (isset($all_plugins[$plugin_file])) {
            $active_list[] = [
                'file'    => $plugin_file,
                'name'    => $all_plugins[$plugin_file]['Name'],
                'version' => $all_plugins[$plugin_file]['Version'],
                'new_version' => isset($updates_map[$plugin_file]) ? $updates_map[$plugin_file] : '',
            ];
        }
    }

    // Include network-activated plugins in active list
    foreach ($network_active_files as $plugin_file) {
        if (isset($all_plugins[$plugin_file])) {
            $active_list[] = [
                'file'    => $plugin_file,
                'name'    => $all_plugins[$plugin_file]['Name'],
                'version' => $all_plugins[$plugin_file]['Version'],
                'new_version' => isset($updates_map[$plugin_file]) ? $updates_map[$plugin_file] : '',
            ];
        }
    }

    // Build inactive list and maintenance flag
    $inactive_list = [];
    if (is_array($all_plugins)) {
        foreach ($all_plugins as $file => $meta) {
            if (!in_array($file, $active_plugins, true) && !in_array($file, $network_active_files, true)) {
                $inactive_list[] = [
                    'file'    => $file,
                    'name'    => isset($meta['Name']) ? $meta['Name'] : $file,
                    'version' => isset($meta['Version']) ? $meta['Version'] : '',
                    'new_version' => isset($updates_map[$file]) ? $updates_map[$file] : '',
                ];
            }
        }
    }
    // Detect maintenance: core .maintenance file OR our stored state
    $home_base = function_exists('get_home_path') ? rtrim(get_home_path(), '/\\') . '/' : ABSPATH;
    $maintenance = file_exists($home_base . '.maintenance') || (bool) get_option('wpm_maintenance_state', false);

    // Get themes information
    if (!function_exists('wp_get_themes')) {
        require_once ABSPATH . 'wp-admin/includes/theme.php';
    }
    
    $all_themes = wp_get_themes();
    $current_theme = wp_get_theme();
    $theme_updates = get_site_transient('update_themes');
    $themes_list = [];
    
    foreach ($all_themes as $theme_dir => $theme) {
        $theme_data = [
            'name' => $theme->get('Name'),
            'version' => $theme->get('Version'),
            'stylesheet' => $theme->get_stylesheet(),
            'is_active' => ($current_theme->get_stylesheet() === $theme->get_stylesheet())
        ];
        
        // Check if update is available
        if ($theme_updates && isset($theme_updates->response[$theme->get_stylesheet()])) {
            $update = $theme_updates->response[$theme->get_stylesheet()];
            $theme_data['new_version'] = $update['new_version'];
        }
        
        $themes_list[] = $theme_data;
    }

    return [
        'site_url'       => get_site_url(),
        'home_url'       => home_url(),
        'wp_version'     => get_bloginfo('version'),
        'php_version'    => phpversion(),
        'mysql_version'  => $wpdb->db_version(),
        'active_plugins' => [
            'active_count' => count($active_plugins),
            'all_count'    => is_array($all_plugins) ? count($all_plugins) : 0,
            'active'       => $active_list,
            'inactive'     => $inactive_list,
        ],
        'themes' => [
            'active' => $current_theme->get_stylesheet(),
            'installed' => $themes_list
        ],
        'maintenance'    => $maintenance,
        'time' => current_time('mysql'),
    ];
}

// POST /wpm/v1/plugins/activate { file }
function wpm_plugins_activate(WP_REST_Request $request) {
    $auth = wpm_check_auth(); if ($auth !== true) return $auth;
    $file = sanitize_text_field($request->get_param('file') ?? '');
    if (!$file) return new WP_REST_Response(['error' => 'Missing file'], 400);
    wpm_require_plugins_lib();
    $result = activate_plugin($file, '', false, false);
    if (is_wp_error($result)) {
        return new WP_REST_Response(['error' => $result->get_error_message()], 500);
    }
    return ['status' => 'ok', 'action' => 'activated', 'file' => $file];
}

// POST /wpm/v1/plugins/deactivate { file }
function wpm_plugins_deactivate(WP_REST_Request $request) {
    $auth = wpm_check_auth(); if ($auth !== true) return $auth;
    $file = sanitize_text_field($request->get_param('file') ?? '');
    if (!$file) return new WP_REST_Response(['error' => 'Missing file'], 400);
    wpm_require_plugins_lib();
    deactivate_plugins($file, false, false);
    if (function_exists('is_plugin_active') && is_plugin_active($file)) {
        return new WP_REST_Response(['error' => 'Failed to deactivate'], 500);
    }
    return ['status' => 'ok', 'action' => 'deactivated', 'file' => $file];
}

// POST /wpm/v1/plugins/update { file }
function wpm_plugins_update(WP_REST_Request $request) {
    $auth = wpm_check_auth(); if ($auth !== true) return $auth;
    $file = sanitize_text_field($request->get_param('file') ?? '');
    if (!$file) return new WP_REST_Response(['error' => 'Missing file'], 400);
    // Ensure required includes
    if (!function_exists('wp_update_plugins')) {
        require_once ABSPATH . 'wp-includes/update.php';
    }
    if (!function_exists('plugins_api')) {
        require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
    }
    if (!function_exists('WP_Filesystem')) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
    }
    if (!class_exists('Plugin_Upgrader')) {
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/class-plugin-upgrader.php';
    }
    if (!function_exists('wp_clean_plugins_cache')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    // Initialize filesystem (force direct when possible for REST context)
    if (!defined('FS_METHOD')) define('FS_METHOD', 'direct');
    $fs_ok = WP_Filesystem();
    if (!$fs_ok) {
        return new WP_REST_Response(['error' => 'Filesystem init failed'], 500);
    }

    // Refresh available updates and perform upgrade
    wp_update_plugins();
    wp_clean_plugins_cache(false);
    $skin = new Automatic_Upgrader_Skin();
    $upgrader = new Plugin_Upgrader($skin);
    @set_time_limit(300);
    ob_start();
    $result = $upgrader->upgrade($file);
    $output = trim(ob_get_clean());

    if (is_wp_error($result)) {
        return new WP_REST_Response(['error' => $result->get_error_message(), 'output' => $output], 500);
    }
    if ($result === false) {
        // Most likely no update available or failure
        $errors = method_exists($skin, 'get_errors') ? $skin->get_errors() : null;
        $msg = ($errors && is_wp_error($errors)) ? $errors->get_error_message() : 'Upgrade failed or not needed';
        return new WP_REST_Response(['error' => $msg, 'output' => $output], 500);
    }
    // true or null (already up to date)
    wp_clean_plugins_cache(true);
    return ['status' => 'ok', 'action' => 'updated', 'file' => $file, 'output' => $output];
}

// POST /wpm/v1/maintenance { enable }
function wpm_toggle_maintenance(WP_REST_Request $request) {
    $auth = wpm_check_auth(); if ($auth !== true) return $auth;
    $enable = (bool) $request->get_param('enable');
    if (!function_exists('get_home_path')) {
        if (file_exists(ABSPATH . 'wp-admin/includes/file.php')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
    }
    $home_base = function_exists('get_home_path') ? rtrim(get_home_path(), '/\\') . '/' : ABSPATH;
    $file = $home_base . '.maintenance';
    if ($enable) {
        $content = "<?php\n$" . "upgrading = time();\n"; // avoid heredoc var parsing
        $written = @file_put_contents($file, $content);
        if ($written === false) {
            // If write failed, reflect actual state
            $exists = file_exists($file);
            update_option('wpm_maintenance_state', $exists);
            return new WP_REST_Response(['error' => 'Failed to enable maintenance'], 500);
        }
    } else {
        if (file_exists($file)) {
            $ok = @unlink($file);
            if (!$ok && file_exists($file)) {
                // Could not remove
                update_option('wpm_maintenance_state', true);
                return new WP_REST_Response(['error' => 'Failed to disable maintenance'], 500);
            }
        }
    }
    $exists = file_exists($file);
    update_option('wpm_maintenance_state', $exists);
    return ['status' => 'ok', 'maintenance' => $exists ? true : false];
}

// POST /wpm/v1/themes/update { stylesheet }
function wpm_themes_update(WP_REST_Request $request) {
    $auth = wpm_check_auth(); if ($auth !== true) return $auth;
    $stylesheet = sanitize_text_field($request->get_param('stylesheet') ?? '');
    if (!$stylesheet) return new WP_REST_Response(['error' => 'Missing stylesheet'], 400);

    // Ensure required includes
    if (!function_exists('wp_update_themes')) {
        require_once ABSPATH . 'wp-includes/update.php';
    }
    if (!function_exists('themes_api')) {
        require_once ABSPATH . 'wp-admin/includes/theme.php';
    }
    if (!function_exists('WP_Filesystem')) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
    }
    if (!class_exists('Theme_Upgrader')) {
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
    }

    // Initialize filesystem
    if (!defined('FS_METHOD')) define('FS_METHOD', 'direct');
    $fs_ok = WP_Filesystem();
    if (!$fs_ok) {
        return new WP_REST_Response(['error' => 'Filesystem init failed'], 500);
    }

    // Refresh available updates and perform upgrade
    wp_update_themes();
    $skin = new Automatic_Upgrader_Skin();
    $upgrader = new Theme_Upgrader($skin);
    @set_time_limit(300);
    ob_start();
    $result = $upgrader->upgrade($stylesheet);
    $output = trim(ob_get_clean());

    if (is_wp_error($result)) {
        return new WP_REST_Response(['error' => $result->get_error_message(), 'output' => $output], 500);
    }
    if ($result === false) {
        $errors = method_exists($skin, 'get_errors') ? $skin->get_errors() : null;
        $msg = ($errors && is_wp_error($errors)) ? $errors->get_error_message() : 'Upgrade failed or not needed';
        return new WP_REST_Response(['error' => $msg, 'output' => $output], 500);
    }

    return ['status' => 'ok', 'action' => 'updated', 'stylesheet' => $stylesheet, 'output' => $output];
}

// POST /wpm/v1/admin-login -> { url }
function wpm_admin_login_url(WP_REST_Request $request) {
    $auth = wpm_check_auth(); if ($auth !== true) return $auth;

    // Select first administrator
    $admin = get_user_by('login', 'admin');
    if (!$admin) {
        $admins = get_users(['role' => 'administrator', 'number' => 1]);
        if (!$admins) return new WP_REST_Response(['error' => 'No admin user'], 500);
        $admin = $admins[0];
    }

    $token = wp_generate_password(32, false);
    set_transient('wpm_admin_login_' . $token, $admin->ID, 5 * MINUTE_IN_SECONDS);

    $url = add_query_arg('wpm_token', $token, admin_url());
    return ['url' => $url];
}

// Auto-login handler pentru token
add_action('init', function () {
    if (is_user_logged_in()) return;
    if (empty($_GET['wpm_token'])) return;

    $token = sanitize_text_field($_GET['wpm_token']);
    $user_id = get_transient('wpm_admin_login_' . $token);
    if (!$user_id) return;

    delete_transient('wpm_admin_login_' . $token);
    wp_set_auth_cookie($user_id, true);
    wp_redirect(admin_url());
    exit;
});

// Admin page minimal pentru gestionarea cheii
add_action('admin_menu', function () {
    add_menu_page(
        'WP Manager Client',
        'WP Manager Client',
        'manage_options',
        'wpm-client',
        'wpm_admin_page',
        'dashicons-admin-generic',
        80
    );
});

function wpm_admin_page() {
    if (isset($_POST['wpm_regenerate_key']) && check_admin_referer('wpm_regenerate_key_action', 'wpm_regenerate_key_nonce')) {
        $new_key = bin2hex(random_bytes(32));
        update_option('wp_manager_api_key', $new_key);
        echo '<div class="notice notice-success is-dismissible"><p>Cheia API a fost regenerată!</p></div>';
    }

    $api_key = get_option('wp_manager_api_key');

    echo '<div class="wrap"><h1>WP Manager Client</h1>';
    echo '<p>Cheia API pentru dashboard:</p>';
    echo '<input type="text" value="'.esc_attr($api_key).'" style="width:400px;" readonly>';
    echo '<form method="post" style="margin-top:10px;">';
    wp_nonce_field('wpm_regenerate_key_action', 'wpm_regenerate_key_nonce');
    echo '<input type="submit" name="wpm_regenerate_key" class="button button-primary" value="Regenerate Key">';
    echo '</form>';
    echo '</div>';
}