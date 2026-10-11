import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import type { ModuleConfigMap } from '@lanius/config';

const execFileAsync = promisify(execFile);

/**
 * GitHub Release 摘要。
 */
export type GithubReleaseSummary = {
  tag: string;
  name: string;
  publishedAt: string | null;
  prerelease: boolean;
  draft: boolean;
};

/**
 * 当前运行版本信息。
 */
export type CurrentReleaseInfo = {
  imageTag: string | null;
  packageVersion: string | null;
  gitSha: string | null;
};

/**
 * 从 GitHub API 列出 Releases（公开；可选 token）。
 *
 * @param github - github 模块配置
 * @returns 发布列表（最新在前）
 */
export async function listGithubReleases(
  github: ModuleConfigMap['github'],
): Promise<GithubReleaseSummary[]> {
  const url = `https://api.github.com/repos/${github.owner}/${github.repo}/releases?per_page=30`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Lanius-Warframe-Bot',
  };
  if (github.token) {
    headers.Authorization = `Bearer ${github.token}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    // 无 Release 时回退 tags
    return listGithubTags(github);
  }
  const rows = (await response.json()) as Array<{
    tag_name?: string;
    name?: string;
    published_at?: string;
    prerelease?: boolean;
    draft?: boolean;
  }>;
  if (!Array.isArray(rows) || rows.length === 0) {
    return listGithubTags(github);
  }
  return rows
    .filter((row) => row.tag_name && !row.draft)
    .map((row) => ({
      tag: row.tag_name ?? '',
      name: row.name || row.tag_name || '',
      publishedAt: row.published_at ?? null,
      prerelease: Boolean(row.prerelease),
      draft: false,
    }));
}

/**
 * 列出 tags（无 Release 时）。
 *
 * @param github - 配置
 * @returns 摘要列表
 */
async function listGithubTags(
  github: ModuleConfigMap['github'],
): Promise<GithubReleaseSummary[]> {
  const url = `https://api.github.com/repos/${github.owner}/${github.repo}/tags?per_page=30`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Lanius-Warframe-Bot',
  };
  if (github.token) {
    headers.Authorization = `Bearer ${github.token}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    return [];
  }
  const rows = (await response.json()) as Array<{ name?: string }>;
  return (rows ?? [])
    .filter((row) => row.name)
    .map((row) => ({
      tag: row.name ?? '',
      name: row.name ?? '',
      publishedAt: null,
      prerelease: false,
      draft: false,
    }));
}

/**
 * 读取当前镜像/包版本。
 *
 * @returns CurrentReleaseInfo
 */
export function getCurrentReleaseInfo(): CurrentReleaseInfo {
  return {
    imageTag: process.env.IMAGE_TAG?.trim() || null,
    packageVersion: readRootPackageVersion(),
    gitSha: process.env.GIT_SHA?.trim() || null,
  };
}

/**
 * 尝试应用镜像 tag：调用 update-image.sh（需 docker / sock）。
 *
 * @param github - github 模块（含 deployDir）
 * @param tag - 如 v0.2.0
 * @returns 执行结果
 */
export async function applyReleaseTag(
  github: ModuleConfigMap['github'],
  tag: string,
): Promise<{
  ok: boolean;
  mode: 'executed' | 'manual';
  detail: string;
}> {
  const script = resolve(github.deployDir, 'update-image.sh');
  if (!existsSync(script)) {
    return {
      ok: false,
      mode: 'manual',
      detail: `缺少 ${script}。请在宿主机执行：IMAGE_TAG=${tag} docker compose -f ${github.composeFile} pull && up -d`,
    };
  }

  // 无 docker.sock 时脚本会失败，返回手动指令
  try {
    const { stdout, stderr } = await execFileAsync(
      'bash',
      [script, tag],
      {
        cwd: github.deployDir,
        env: {
          ...process.env,
          IMAGE_TAG: tag,
          COMPOSE_FILE: github.composeFile,
        },
        timeout: 10 * 60 * 1000,
      },
    );
    return {
      ok: true,
      mode: 'executed',
      detail: `${stdout}\n${stderr}`.trim().slice(0, 4000),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      mode: 'manual',
      detail: `${message}\n手动：cd ${github.deployDir} && IMAGE_TAG=${tag} bash update-image.sh ${tag}`,
    };
  }
}

/**
 * 读取根 package.json version。
 *
 * @returns 版本或 null
 */
function readRootPackageVersion(): string | null {
  const candidates = [
    resolve(process.cwd(), 'package.json'),
    resolve(process.cwd(), '../../package.json'),
  ];
  for (const path of candidates) {
    try {
      if (!existsSync(path)) continue;
      const pkg = JSON.parse(readFileSync(path, 'utf8')) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // next
    }
  }
  return null;
}
