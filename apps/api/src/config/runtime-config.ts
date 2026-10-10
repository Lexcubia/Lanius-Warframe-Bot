import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import {
  LabelsConfigSchema,
  SiteDtoSchema,
  type LabelsConfig,
  type SiteDto,
} from '@lanius/core';
import { parse as parseYaml } from 'yaml';
import type { ZodTypeAny } from 'zod';

/**
 * 解析运行时配置根目录（含 `default/` 与 `local/`）。
 *
 * @param repoRoot - 仓库根（本地默认）
 * @returns 绝对路径
 */
export function resolveRuntimeConfigRoot(repoRoot: string): string {
  const override = process.env.LANIUS_RUNTIME_CONFIG_ROOT?.trim();
  if (override && override.length > 0) {
    return isAbsolute(override) ? override : resolve(repoRoot, override);
  }
  return resolve(repoRoot, 'config');
}

/**
 * 深合并普通对象；数组与标量以 `override` 为准。
 *
 * @param base - 默认层
 * @param override - 覆盖层
 * @returns 合并结果（新对象）
 */
export function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      result[key] = deepMerge(
        current as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * 读取单个 YAML 文件；不存在则返回空对象。
 *
 * @param path - 绝对路径
 * @returns 解析后的对象，或 `{}`
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
 * 按 default → local 合并并校验一份运行时 YAML。
 *
 * @param runtimeRoot - 配置根（含 default/local）
 * @param name - 文件名（不含扩展名），如 `site`
 * @param schema - Zod schema
 * @returns 校验后的配置
 */
export function loadMergedRuntimeConfig<T>(
  runtimeRoot: string,
  name: string,
  schema: ZodTypeAny,
): T {
  const defaultPath = resolve(runtimeRoot, 'default', `${name}.yaml`);
  const localPath = resolve(runtimeRoot, 'local', `${name}.yaml`);
  const merged = deepMerge(readYamlObject(defaultPath), readYamlObject(localPath));
  return schema.parse(merged) as T;
}

/**
 * 加载公开站点配置（页脚备案等）。
 *
 * @param runtimeRoot - 配置根
 * @returns SiteDto
 */
export function loadSiteConfig(runtimeRoot: string): SiteDto {
  return loadMergedRuntimeConfig(runtimeRoot, 'site', SiteDtoSchema);
}

/**
 * 加载显示名覆盖表。
 *
 * @param runtimeRoot - 配置根
 * @returns LabelsConfig
 */
export function loadLabelsConfig(runtimeRoot: string): LabelsConfig {
  return loadMergedRuntimeConfig(runtimeRoot, 'labels', LabelsConfigSchema);
}
