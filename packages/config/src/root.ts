import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

/**
 * 解析配置根目录（含 `default/` 与 `local/`）。
 * 业务代码应通过 ConfigDriver 取配置，勿自行拼路径。
 *
 * @param repoRoot - 仓库根（用于默认推断）
 * @returns 绝对路径
 */
export function resolveConfigRoot(repoRoot: string = process.cwd()): string {
  const override = process.env.LANIUS_CONFIG_ROOT?.trim();
  if (override && override.length > 0) {
    return isAbsolute(override) ? override : resolve(repoRoot, override);
  }
  // 兼容旧环境变量
  const legacy = process.env.LANIUS_RUNTIME_CONFIG_ROOT?.trim();
  if (legacy && legacy.length > 0) {
    return isAbsolute(legacy) ? legacy : resolve(repoRoot, legacy);
  }
  return resolve(repoRoot, 'config');
}

/**
 * 在 cwd 向上查找含 `config/default` 的仓库根。
 *
 * @param cwd - 起始目录
 * @returns 仓库根绝对路径
 */
export function findRepoRoot(cwd: string = process.cwd()): string {
  let dir = resolve(cwd);
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, 'config', 'default'))) {
      return dir;
    }
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  if (cwd.replace(/\\/g, '/').endsWith('/apps/api')) {
    return resolve(cwd, '../..');
  }
  if (cwd.replace(/\\/g, '/').endsWith('/apps/bot')) {
    return resolve(cwd, '../..');
  }
  return resolve(cwd);
}
