import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';

/**
 * SQLite 访问封装（better-sqlite3）。
 */
export type LaniusDb = {
  raw: Database.Database;
  /**
   * 执行无返回 SQL。
   *
   * @param sql - SQL
   * @param params - 绑定参数
   * @returns 无返回值
   */
  run(sql: string, params?: unknown[]): void;
  /**
   * 查询多行。
   *
   * @param sql - SQL
   * @param params - 绑定参数
   * @returns 行数组
   */
  all<T extends Record<string, unknown>>(sql: string, params?: unknown[]): T[];
  /**
   * 查询单行。
   *
   * @param sql - SQL
   * @param params - 绑定参数
   * @returns 行或 undefined
   */
  get<T extends Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): T | undefined;
  /**
   * 关闭数据库。
   *
   * @returns 无返回值
   */
  close(): void;
};

/**
 * 打开（或创建）Lanius SQLite 库并确保 schema。
 *
 * @param filePath - 数据库文件绝对路径，或 `:memory:`
 * @returns LaniusDb
 */
export function openLaniusDb(filePath: string): LaniusDb {
  if (filePath !== ':memory:') {
    mkdirSync(dirname(filePath), { recursive: true });
  }
  const raw = new Database(filePath);
  raw.pragma('journal_mode = WAL');
  raw.exec(`
    CREATE TABLE IF NOT EXISTS module_settings (
      module_id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      help_override_json TEXT
    );
    CREATE TABLE IF NOT EXISTS help_menu (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      title_zh TEXT NOT NULL,
      title_en TEXT NOT NULL,
      intro_zh TEXT NOT NULL,
      intro_en TEXT NOT NULL,
      visible_module_ids_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS acl_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scope TEXT NOT NULL,
      target_id TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      effect TEXT NOT NULL,
      module_id TEXT,
      user_openid TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      scene TEXT NOT NULL,
      target_id TEXT NOT NULL,
      user_id TEXT NOT NULL DEFAULT '',
      module_id TEXT NOT NULL,
      outcome TEXT NOT NULL,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      request_id TEXT NOT NULL DEFAULT '',
      detail TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts);
    CREATE INDEX IF NOT EXISTS idx_acl_scope ON acl_rules(scope, target_id);
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene TEXT NOT NULL,
      target_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      frequency TEXT NOT NULL DEFAULT 'on_change',
      last_fingerprint TEXT,
      last_pushed_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(scene, target_id, module_id)
    );
    CREATE TABLE IF NOT EXISTS rotation_schedules (
      module_id TEXT PRIMARY KEY,
      epoch_iso TEXT NOT NULL,
      period_days INTEGER NOT NULL DEFAULT 7,
      items_json TEXT NOT NULL
    );
  `);

  return {
    raw,
    run(sql, params = []) {
      raw.prepare(sql).run(...params);
    },
    all<T extends Record<string, unknown>>(sql: string, params: unknown[] = []) {
      return raw.prepare(sql).all(...params) as T[];
    },
    get<T extends Record<string, unknown>>(sql: string, params: unknown[] = []) {
      return raw.prepare(sql).get(...params) as T | undefined;
    },
    close() {
      raw.close();
    },
  };
}
