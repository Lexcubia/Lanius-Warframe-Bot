import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import { parse as parseYaml } from 'yaml';

import { AppConfigSchema, type AppConfig } from './schema.js';

/**
 * Default relative path to the local secrets/config file (gitignored).
 */
export const DEFAULT_LOCAL_CONFIG = 'config.local.yaml';

/**
 * Fallback example config used when `config.local.yaml` is absent.
 */
export const DEFAULT_EXAMPLE_CONFIG = 'config.example.yaml';

/**
 * Resolves the config file path from `LANIUS_CONFIG` or repo-root defaults.
 * Prefers `config.local.yaml` when present; otherwise falls back to example.
 *
 * @param cwd - Working directory used to resolve relative config paths.
 * @param fileExists - Predicate that reports whether a path exists on disk.
 * @returns Absolute path to the YAML file that should be loaded.
 */
export function resolveConfigPath(
  cwd: string = process.cwd(),
  fileExists: (path: string) => boolean = pathExistsSync,
): string {
  const override = process.env.LANIUS_CONFIG;
  if (override && override.trim().length > 0) {
    return isAbsolute(override) ? override : resolve(cwd, override);
  }

  const localPath = resolve(cwd, DEFAULT_LOCAL_CONFIG);
  if (fileExists(localPath)) {
    return localPath;
  }

  return resolve(cwd, DEFAULT_EXAMPLE_CONFIG);
}

/**
 * Loads and validates Lanius YAML configuration for the API process.
 *
 * @param cwd - Working directory for relative path resolution (usually monorepo root).
 * @returns Parsed and Zod-validated application config.
 * @throws Error when the file cannot be read or fails schema validation.
 */
export function loadAppConfig(cwd: string = process.cwd()): AppConfig {
  const configPath = resolveConfigPath(cwd);
  const rawText = readFileSync(configPath, 'utf8');
  const rawYaml: unknown = parseYaml(rawText);
  return AppConfigSchema.parse(rawYaml ?? {});
}

/**
 * Synchronous existence check used by `resolveConfigPath` defaults.
 *
 * @param path - Absolute or relative filesystem path.
 * @returns `true` when the path can be read as a file.
 */
function pathExistsSync(path: string): boolean {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
}
