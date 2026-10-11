/**
 * 本地预览：跑 vitest 写出 packages/render/tmp/preview.png
 * 用法：pnpm --filter @lanius/render preview
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'vitest', 'run', 'src/preview-card.write.test.ts'],
  { cwd: pkgRoot, stdio: 'inherit', shell: true },
);
process.exit(result.status ?? 1);
