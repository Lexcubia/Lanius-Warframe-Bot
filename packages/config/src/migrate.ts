import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { CONFIG_MODULE_IDS, type ConfigModuleId } from './modules.js';

/**
 * 将根级单体 `config.local.yaml` 拆分写入 `config/local/<module>.yaml`（仅当目标不存在时）。
 *
 * @param repoRoot - 仓库根
 * @param configRoot - 配置根（含 default/local）
 * @returns 是否执行了写入
 */
export function migrateMonolithLocalIfNeeded(
  repoRoot: string,
  configRoot: string,
): boolean {
  const candidates = [
    resolve(repoRoot, 'config.local.yaml'),
    process.env.LANIUS_CONFIG?.trim(),
    '/config/config.local.yaml',
  ].filter((p): p is string => Boolean(p));

  const monolith = candidates.find((path) => existsSync(path));
  if (!monolith) {
    return false;
  }

  let raw: unknown;
  try {
    raw = parseYaml(readFileSync(monolith, 'utf8'));
  } catch {
    return false;
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return false;
  }

  const doc = raw as Record<string, unknown>;
  const localDir = resolve(configRoot, 'local');
  mkdirSync(localDir, { recursive: true });

  let wrote = false;
  for (const moduleId of CONFIG_MODULE_IDS) {
    const slice = extractModuleSlice(doc, moduleId);
    if (slice === undefined) {
      continue;
    }
    const target = resolve(localDir, `${moduleId}.yaml`);
    if (existsSync(target)) {
      continue;
    }
    writeFileSync(target, stringifyYaml(slice), 'utf8');
    wrote = true;
  }
  return wrote;
}

/**
 * 从单体文档取出模块切片。
 *
 * @param doc - 单体对象
 * @param moduleId - 模块 id
 * @returns 切片或 undefined
 */
function extractModuleSlice(
  doc: Record<string, unknown>,
  moduleId: ConfigModuleId,
): Record<string, unknown> | undefined {
  const value = doc[moduleId];
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}
