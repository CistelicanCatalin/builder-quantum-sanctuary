/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export interface DemoResponse {
  message: string;
}

export interface SiteItem {
  id: number;
  url: string;
  last_seen: string | null;
  created_at: string;
}

export interface SitesListResponse {
  items: SiteItem[];
}
export interface SiteCreateRequest {
  url: string;
  apiKey: string;
}
export interface SiteCreateResponse {
  item: SiteItem;
}

export interface MysqlSettings {
  host: string;
  port?: number;
  user: string;
  password?: string;
  database: string;
}
export interface MysqlSettingsMasked {
  host: string;
  port: number;
  user: string;
  database: string;
  hasPassword: boolean;
}
export interface MysqlSettingsGetResponse {
  settings: MysqlSettingsMasked | null;
}
export interface MysqlSettingsSaveRequest extends MysqlSettings {}
export interface MysqlSettingsSaveResponse {
  status: "ok";
}

// Sites stats (for dashboard cards)
export interface SitesStatsResponse {
  total: number;
  addedThisWeek: number;
}

// WordPress site status shape returned by client plugin
export interface WpSiteStatusResponse {
  site_url: string;
  home_url: string;
  wp_version: string;
  php_version: string;
  mysql_version: string;
  active_plugins: {
    active_count: number;
    all_count: number;
    active: Array<{ file: string; name: string; version: string; new_version?: string }>;
    inactive?: Array<{ file: string; name: string; version: string; new_version?: string }>;
  };
  themes?: {
    active: string;
    installed: Array<{
      name: string;
      version: string;
      new_version?: string;
      stylesheet: string;
      is_active: boolean;
    }>;
  };
  maintenance?: boolean;
  time: string;
  // Optional future fields if plugin is extended
  updates?: {
    plugins_outdated?: number;
    core_outdated?: boolean;
    themes_outdated?: number;
  };
}

// Theme update request/response
export interface ThemeUpdateRequest {
  stylesheet: string;
}
export interface ThemeUpdateResponse {
  status: "ok";
  action: "updated";
  stylesheet: string;
  output?: string;
}

// Uptime monitoring interfaces
export interface UptimeCheck {
  id: number;
  site_id: number;
  url: string;
  last_check: string | null;
  last_status: number | null;
  response_time: number | null;
  created_at: string;
  check_interval: number; // in seconds
  is_active: boolean;
}

export interface UptimeCheckCreateRequest {
  site_id: number;
  url: string;
  check_interval: number;
}

export interface UptimeCheckCreateResponse {
  item: UptimeCheck;
}

export interface UptimeCheckUpdateRequest {
  check_interval?: number;
  is_active?: boolean;
}

export interface UptimeCheckHistoryItem {
  id: number;
  check_id: number;
  status_code: number | null;
  response_time: number | null;
  checked_at: string;
}

export interface UptimeCheckHistoryResponse {
  items: UptimeCheckHistoryItem[];
}