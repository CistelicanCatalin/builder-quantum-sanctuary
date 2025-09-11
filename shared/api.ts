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

export interface SitesListResponse { items: SiteItem[] }
export interface SiteCreateRequest { url: string; apiKey: string }
export interface SiteCreateResponse { item: SiteItem }

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
export interface MysqlSettingsGetResponse { settings: MysqlSettingsMasked | null }
export interface MysqlSettingsSaveRequest extends MysqlSettings {}
export interface MysqlSettingsSaveResponse { status: "ok" }
