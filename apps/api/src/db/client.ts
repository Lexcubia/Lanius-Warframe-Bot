import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

/**
 * SQLite 访问封装（Node 22.5+ 内置 node:sqlite）。
 *
 * 为什么不直接 `import { DatabaseSync } from 'node:sqlite'`：
 * esbuild 0.27 / Vite 5 的内置模块清单不含 Node 22.5 新增的 `sqlite`，
 * 静态 import 会被误判为第三方包并剥掉 `node:` 前缀（产物变 `from 'sqlite'`），
 * 且 Vitest 在解析阶段也会报 "Failed to load url sqlite"。
 *
 * 因此统一改为 `createRequire` + 拼接模块名的间接引用：打包器/测试器
 * 无法静态分析该依赖，加载推迟到 Node 运行期完成（要求 Node >= 22.5）。
 */

/** Node 内置 `DatabaseSync` 类型引用。 */
type DatabaseSyncType = typeof import('node:sqlite').DatabaseSync;

const requireModule = createRequire(import.meta.url);
// 间接拼接模块名，避免被 esbuild/Vite 静态解析
const sqliteModuleId = ['node', 'sqlite'].join(':');
const { DatabaseSync } = requireModule(sqliteModuleId) as {
  DatabaseSync: DatabaseSyncType;
};

export type LaniusDb = {
  raw: InstanceType<DatabaseSyncType>;
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
  get<T extends Record<string, unknown>>(sql: string, params?: unknown[]): T | undefined;
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
  const raw = new DatabaseSync(filePath);
  raw.exec('PRAGMA journal_mode = WAL');
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
      raw.prepare(sql).run(...(params as never[]));
    },
    all<T extends Record<string, unknown>>(sql: string, params: unknown[] = []) {
      return raw.prepare(sql).all(...(params as never[])) as T[];
    },
    get<T extends Record<string, unknown>>(sql: string, params: unknown[] = []) {
      return raw.prepare(sql).get(...(params as never[])) as T | undefined;
    },
    close() {
      raw.close();
    },
  };
}
