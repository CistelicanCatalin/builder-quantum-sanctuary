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
  maintenance?: boolean;
  time: string;
  // Optional future fields if plugin is extended
  updates?: {
    plugins_outdated?: number;
    core_outdated?: boolean;
    themes_outdated?: number;
  };
}