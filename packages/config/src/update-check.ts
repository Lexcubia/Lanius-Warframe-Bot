import { execSync } from 'node:child_process';

/**
 * 启动时更新检查结果。
 */
export type UpdateCheckResult = {
  /** 是否有可用更新 */
  hasUpdate: boolean;
  /** 本地当前 commit（短） */
  localCommit: string;
  /** 远程最新 commit（短）；检查失败时为空 */
  remoteCommit: string;
  /** 落后远程的提交数 */
  behind: number;
  /** 检查失败原因（无更新或失败时为 undefined） */
  error?: string;
};

/**
 * 启动时检查 git 仓库是否有远程更新（不拉取，仅对比）。
 * 通过 `git fetch` + `git rev-list` 实现；非 git 仓库或网络失败时静默降级。
 *
 * @param repoRoot - 仓库根目录绝对路径
 * @param branch - 跟踪分支（默认 develop）
 * @returns 更新检查结果
 */
export function checkForUpdate(repoRoot: string, branch = 'develop'): UpdateCheckResult {
  const none: UpdateCheckResult = {
    hasUpdate: false,
    localCommit: '',
    remoteCommit: '',
    behind: 0,
  };

  try {
    const localCommit = execSync('git rev-parse --short HEAD', {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();

    // fetch 远程最新（静默），失败不影响启动
    try {
      execSync(`git fetch origin ${branch}`, {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 15000,
      });
    } catch {
      return { ...none, localCommit, error: 'fetch_failed' };
    }

    const remoteCommit = execSync(`git rev-parse --short origin/${branch}`, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();

    const behind = Number(
      execSync(`git rev-list --count HEAD..origin/${branch}`, {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim(),
    );

    return {
      hasUpdate: behind > 0,
      localCommit,
      remoteCommit,
      behind,
    };
  } catch (error) {
    return {
      ...none,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
