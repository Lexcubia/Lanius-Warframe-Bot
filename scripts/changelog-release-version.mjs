/**
 * 从 CHANGELOG.md 解析「最新已发布版本」，供 main 合并后自动打 tag。
 *
 * 约定（Keep a Changelog）：
 * - `## [Unreleased]` 发布前必须清空条目（可保留空节）
 * - 最新版本节为文件中第一个 `## [X.Y.Z] - YYYY-MM-DD`
 * - 根 `package.json` 的 `version` 必须与该版本一致
 *
 * 用法：
 * - `node scripts/changelog-release-version.mjs` → stdout 打印 `X.Y.Z`
 * - `node scripts/changelog-release-version.mjs --github-output` → 写入 `$GITHUB_OUTPUT`
 */
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 读取仓库根文件文本。
 *
 * @param {string} relativePath - 相对仓库根的路径
 * @returns {string} 文件 UTF-8 内容
 */
function readRootFile(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

/**
 * 判断 Unreleased 节是否仍有列表条目（发布合入 main 前应已挪到版本节）。
 *
 * @param {string} changelog - CHANGELOG.md 全文
 * @returns {boolean} 若仍有 `-` / `*` 条目则为 true
 */
function unreleasedHasItems(changelog) {
  const match = changelog.match(/^## \[Unreleased\]\s*\r?\n([\s\S]*?)(?=^## |\z)/m);
  if (!match) {
    return false;
  }
  return /^[-*]\s+\S/m.test(match[1]);
}

/**
 * 提取 CHANGELOG 中按文件顺序出现的第一个 SemVer 版本节号。
 *
 * @param {string} changelog - CHANGELOG.md 全文
 * @returns {string} 如 `0.1.0`（可含预发布后缀）
 * @throws {Error} 未找到任何 `## [X.Y.Z]` 节时抛出
 */
function readLatestChangelogVersion(changelog) {
  const re = /^## \[(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)\](?:\s*-\s*\d{4}-\d{2}-\d{2})?\s*$/gm;
  const found = re.exec(changelog);
  if (!found) {
    throw new Error(
      'CHANGELOG.md 中未找到版本节（期望形如 ## [0.1.0] - YYYY-MM-DD）。发布前请将 Unreleased 提升为版本节。',
    );
  }
  return found[1];
}

/**
 * 读取根 package.json 的产品版本号。
 *
 * @returns {string} package.json 的 version 字段
 * @throws {Error} 缺少 version 时抛出
 */
function readPackageVersion() {
  const pkg = JSON.parse(readRootFile('package.json'));
  if (typeof pkg.version !== 'string' || !pkg.version) {
    throw new Error('根 package.json 缺少 version 字段');
  }
  return pkg.version;
}

/**
 * 校验 CHANGELOG / package.json 并返回待打 tag 的版本号（无 `v` 前缀）。
 *
 * @returns {string} 如 `0.1.0`
 * @throws {Error} Unreleased 仍有条目、版本缺失或与 package.json 不一致时抛出
 */
function resolveReleaseVersion() {
  const changelog = readRootFile('CHANGELOG.md');

  if (unreleasedHasItems(changelog)) {
    throw new Error(
      'CHANGELOG 的 [Unreleased] 仍有条目。合入 main 前请将其整理为 ## [X.Y.Z] - YYYY-MM-DD，并同步根 package.json version。',
    );
  }

  const changelogVersion = readLatestChangelogVersion(changelog);
  const packageVersion = readPackageVersion();
  if (changelogVersion !== packageVersion) {
    throw new Error(
      `版本不一致：CHANGELOG 最新节为 ${changelogVersion}，根 package.json 为 ${packageVersion}。请在发布 PR 中对齐二者。`,
    );
  }

  return changelogVersion;
}

/**
 * CLI 入口：解析版本并打印或写入 Actions 输出。
 *
 * @returns {void}
 */
function run() {
  const version = resolveReleaseVersion();
  const tag = `v${version}`;

  if (process.argv.includes('--github-output')) {
    const outPath = process.env.GITHUB_OUTPUT;
    if (!outPath) {
      throw new Error('未设置 GITHUB_OUTPUT');
    }
    appendFileSync(outPath, `version=${version}\n`);
    appendFileSync(outPath, `tag=${tag}\n`);
    console.log(`release version=${version} tag=${tag}`);
    return;
  }

  console.log(version);
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
