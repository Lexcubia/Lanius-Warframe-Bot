import {
  existsSync,
  mkdirSync,
  readFileSync,
  watch,
  writeFileSync,
  type FSWatcher,
} from 'node:fs';
import { resolve } from 'node:path';

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { deepMerge } from './merge.js';
import { migrateMonolithLocalIfNeeded } from './migrate.js';
import {
  CONFIG_MODULE_IDS,
  MODULE_FIELD_META,
  MODULE_SCHEMAS,
  type ConfigModuleId,
  type ModuleConfigMap,
} from './modules.js';
import {
  listRestartRequiredFields,
  maskSecrets,
  preserveSecretsOnWrite,
} from './mask.js';
import { findRepoRoot, resolveConfigRoot } from './root.js';

/**
 * 订阅回调。
 */
export type ConfigListener<M extends ConfigModuleId = ConfigModuleId> = (
  value: ModuleConfigMap[M],
) => void;

/**
 * 驱动构造选项。
 */
export type ConfigDriverOptions = {
  /** 仓库根；默认自动探测 */
  repoRoot?: string;
  /** 配置根；默认 `LANIUS_CONFIG_ROOT` 或 `<repo>/config` */
  configRoot?: string;
  /** 是否监听 local 目录变更（跨进程热加载） */
  watchLocal?: boolean;
};

/**
 * 模块化配置驱动：default ⊕ local、校验、掩码、保存、订阅。
 */
export class ConfigDriver {
  readonly repoRoot: string;
  readonly configRoot: string;
  private readonly cache = new Map<ConfigModuleId, unknown>();
  private readonly listeners = new Map<
    ConfigModuleId,
    Set<ConfigListener>
  >();
  private watcher: FSWatcher | undefined;

  /**
   * @param options - 根路径与是否 watch
   */
  constructor(options: ConfigDriverOptions = {}) {
    this.repoRoot = options.repoRoot ?? findRepoRoot();
    this.configRoot = options.configRoot ?? resolveConfigRoot(this.repoRoot);
    migrateMonolithLocalIfNeeded(this.repoRoot, this.configRoot);
    this.reloadAll();
    if (options.watchLocal !== false) {
      this.startWatch();
    }
  }

  /**
   * 读取已校验的模块配置。
   *
   * @param moduleId - 模块 id
   * @returns 类型化配置
   */
  get<M extends ConfigModuleId>(moduleId: M): ModuleConfigMap[M] {
    const cached = this.cache.get(moduleId);
    if (cached !== undefined) {
      return cached as ModuleConfigMap[M];
    }
    return this.reload(moduleId);
  }

  /**
   * 重新加载单个模块并通知订阅者。
   *
   * @param moduleId - 模块 id
   * @returns 新配置
   */
  reload<M extends ConfigModuleId>(moduleId: M): ModuleConfigMap[M] {
    const schema = MODULE_SCHEMAS[moduleId];
    const merged = deepMerge(
      readYamlObject(resolve(this.configRoot, 'default', `${moduleId}.yaml`)),
      readYamlObject(resolve(this.configRoot, 'local', `${moduleId}.yaml`)),
    );
    const parsed = schema.parse(merged) as ModuleConfigMap[M];
    this.cache.set(moduleId, parsed);
    const set = this.listeners.get(moduleId);
    if (set) {
      for (const cb of set) {
        try {
          cb(parsed as never);
        } catch {
          // 订阅方错误不阻断驱动
        }
      }
    }
    return parsed;
  }

  /**
   * 重载全部模块。
   *
   * @returns 无返回值
   */
  reloadAll(): void {
    for (const id of CONFIG_MODULE_IDS) {
      this.reload(id);
    }
  }

  /**
   * 订阅模块变更。
   *
   * @param moduleId - 模块 id
   * @param listener - 回调
   * @returns 取消订阅函数
   */
  subscribe<M extends ConfigModuleId>(
    moduleId: M,
    listener: ConfigListener<M>,
  ): () => void {
    let set = this.listeners.get(moduleId);
    if (!set) {
      set = new Set();
      this.listeners.set(moduleId, set);
    }
    set.add(listener as ConfigListener);
    return () => {
      set?.delete(listener as ConfigListener);
    };
  }

  /**
   * 返回掩码后的配置（Admin 读）。
   *
   * @param moduleId - 模块 id
   * @returns 掩码对象 + 元数据
   */
  describe(moduleId: ConfigModuleId): {
    moduleId: ConfigModuleId;
    data: Record<string, unknown>;
    restartRequired: string[];
    fieldMeta: (typeof MODULE_FIELD_META)[ConfigModuleId];
  } {
    const data = maskSecrets(moduleId, this.get(moduleId));
    return {
      moduleId,
      data,
      restartRequired: listRestartRequiredFields(moduleId),
      fieldMeta: MODULE_FIELD_META[moduleId],
    };
  }

  /**
   * 保存模块覆盖到 `local/<module>.yaml` 并热加载。
   *
   * @param moduleId - 模块 id
   * @param incoming - 客户端提交（可含掩码）
   * @returns 需重启的字段列表
   */
  save(
    moduleId: ConfigModuleId,
    incoming: Record<string, unknown>,
  ): { restartRequired: string[] } {
    const previous = this.get(moduleId);
    const preserved = preserveSecretsOnWrite(moduleId, previous, incoming);
    const schema = MODULE_SCHEMAS[moduleId];
    // 与 default 合并后再校验，允许 local 只写部分键
    const defaultLayer = readYamlObject(
      resolve(this.configRoot, 'default', `${moduleId}.yaml`),
    );
    const merged = deepMerge(defaultLayer, preserved);
    schema.parse(merged);

    const localDir = resolve(this.configRoot, 'local');
    mkdirSync(localDir, { recursive: true });
    const target = resolve(localDir, `${moduleId}.yaml`);
    writeFileSync(target, stringifyYaml(preserved), 'utf8');
    this.reload(moduleId);

    const changedRestart = listRestartRequiredFields(moduleId).filter(
      (path) => {
        const a = JSON.stringify(getPathValue(previous as object, path));
        const b = JSON.stringify(getPathValue(this.get(moduleId) as object, path));
        return a !== b;
      },
    );
    return { restartRequired: changedRestart };
  }

  /**
   * 停止文件监听。
   *
   * @returns 无返回值
   */
  close(): void {
    this.watcher?.close();
    this.watcher = undefined;
  }

  /**
   * 监听 local 目录变更以跨进程热加载。
   *
   * @returns 无返回值
   */
  private startWatch(): void {
    const localDir = resolve(this.configRoot, 'local');
    mkdirSync(localDir, { recursive: true });
    try {
      this.watcher = watch(localDir, { persistent: false }, (_event, filename) => {
        if (!filename || typeof filename !== 'string') {
          return;
        }
        if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
          return;
        }
        const id = filename.replace(/\.ya?ml$/i, '') as ConfigModuleId;
        if ((CONFIG_MODULE_IDS as readonly string[]).includes(id)) {
          try {
            this.reload(id);
          } catch {
            // 半写入时忽略
          }
        }
      });
    } catch {
      // watch 不可用时仅依赖显式 reload
    }
  }
}

let singleton: ConfigDriver | undefined;

/**
 * 获取进程内单例驱动（首次创建）。
 *
 * @param options - 仅首次生效
 * @returns ConfigDriver
 */
export function getConfigDriver(options?: ConfigDriverOptions): ConfigDriver {
  if (!singleton) {
    singleton = new ConfigDriver(options);
  }
  return singleton;
}

/**
 * 重置单例（测试用）。
 *
 * @returns 无返回值
 */
export function resetConfigDriverForTests(): void {
  singleton?.close();
  singleton = undefined;
}

/**
 * 读取 YAML 对象；缺失则 `{}`。
 *
 * @param path - 绝对路径
 * @returns 对象
 */
function readYamlObject(path: string): Record<string, unknown> {
  if (!existsSync(path)) {
    return {};
  }
  const raw = parseYaml(readFileSync(path, 'utf8'));
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

/**
 * 读取点分路径（只读）。
 *
 * @param obj - 对象
 * @param path - 路径
 * @returns 值
 */
function getPathValue(obj: object, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || typeof cur !== 'object') {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}
