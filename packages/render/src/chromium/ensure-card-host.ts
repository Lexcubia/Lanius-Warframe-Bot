import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';
import { existsSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * 卡片宿主 Vite 源码根（开发态 middleware）。
 */
const CARD_HOST_SRC = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../card-host',
);

/**
 * monorepo 根，供 Vite `fs.allow` 读取 workspace 包源码。
 */
const REPO_ROOT = resolve(CARD_HOST_SRC, '../../..');

/**
 * 预构建产物相对本文件的默认路径（`packages/render/dist/card-host`）。
 * tsup 打进 bot 后会失效，生产请设 `LANIUS_CARD_HOST_DIR`。
 */
const DEFAULT_STATIC_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../dist/card-host',
);

/**
 * 进程内单例 HTTP 服务。
 */
let httpServer: HttpServer | null = null;

/**
 * 宿主页可访问的 origin。
 */
let hostOrigin: string | null = null;

/**
 * 并发首次启动时共用的 Promise。
 */
let starting: Promise<string> | null = null;

/**
 * 开发态 Vite 实例（仅静态目录不可用时创建）。
 */
let viteServer: import('vite').ViteDevServer | null = null;

/**
 * 启动（或复用）卡片宿主 HTTP 服务。
 *
 * 优先：`LANIUS_CARD_HOST_DIR` / 预构建 `dist/card-host` 静态目录；
 * 否则：Vite middleware（本地开发 / 测试）。
 *
 * @returns 宿主 origin（不含尾斜杠）
 */
export async function ensureCardHostOrigin(): Promise<string> {
  if (hostOrigin) {
    return hostOrigin;
  }
  if (starting) {
    return starting;
  }
  starting = startCardHost();
  try {
    return await starting;
  } finally {
    starting = null;
  }
}

/**
 * 关闭卡片宿主（测试 teardown / 进程退出）。
 *
 * @returns 无返回值
 */
export async function shutdownCardHost(): Promise<void> {
  const http = httpServer;
  const vite = viteServer;
  httpServer = null;
  viteServer = null;
  hostOrigin = null;
  starting = null;
  if (http) {
    await new Promise<void>((resolveClose) => {
      http.close(() => resolveClose());
    });
  }
  if (vite) {
    await vite.close();
  }
}

/**
 * 解析静态宿主目录（存在 `index.html` 才视为可用）。
 *
 * @returns 绝对路径；不可用时 `null`
 */
function resolveStaticCardHostDir(): string | null {
  const fromEnv = process.env.LANIUS_CARD_HOST_DIR?.trim();
  const candidates = [fromEnv, DEFAULT_STATIC_DIR].filter(
    (value): value is string => Boolean(value),
  );
  for (const dir of candidates) {
    const abs = resolve(dir);
    if (existsSync(join(abs, 'index.html'))) {
      return abs;
    }
  }
  return null;
}

/**
 * 按静态目录或 Vite 开发中间件启动宿主。
 *
 * @returns 宿主 origin
 */
async function startCardHost(): Promise<string> {
  const staticDir = resolveStaticCardHostDir();
  if (staticDir) {
    return listenStatic(staticDir);
  }
  return listenViteDev();
}

/**
 * 用 Node HTTP 提供预构建宿主页。
 *
 * @param staticDir - 含 `index.html` 的目录
 * @returns 宿主 origin
 */
async function listenStatic(staticDir: string): Promise<string> {
  httpServer = createHttpServer((req, res) => {
    void serveStaticFile(staticDir, req.url ?? '/', res);
  });
  return bindHttpServer(httpServer);
}

/**
 * 静态文件响应（SPA：未知路径回退 `index.html`）。
 *
 * @param staticDir - 静态根
 * @param rawUrl - 请求 URL
 * @param res - HTTP 响应
 * @returns 无返回值
 */
async function serveStaticFile(
  staticDir: string,
  rawUrl: string,
  res: import('node:http').ServerResponse,
): Promise<void> {
  try {
    const pathOnly = decodeURIComponent(rawUrl.split('?')[0] ?? '/');
    const relative =
      pathOnly === '/' || pathOnly === ''
        ? 'index.html'
        : pathOnly.replace(/^\//, '');
    const filePath = resolve(staticDir, relative);
    if (!filePath.startsWith(staticDir)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    const target = existsSync(filePath)
      ? filePath
      : join(staticDir, 'index.html');
    const body = await readFile(target);
    res.statusCode = 200;
    res.setHeader('Content-Type', contentTypeFor(target));
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}

/**
 * 按扩展名返回 Content-Type。
 *
 * @param filePath - 文件路径
 * @returns MIME 类型
 */
function contentTypeFor(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

/**
 * 开发/测试：Vite middleware 挂载 card-host 源码。
 *
 * @returns 宿主 origin
 */
async function listenViteDev(): Promise<string> {
  const { createServer } = await import('vite');
  const vuePlugin = (await import('@vitejs/plugin-vue')).default;

  viteServer = await createServer({
    configFile: false,
    root: CARD_HOST_SRC,
    appType: 'spa',
    plugins: [vuePlugin()],
    server: {
      middlewareMode: true,
      hmr: false,
      fs: {
        allow: [REPO_ROOT],
      },
    },
    resolve: {
      dedupe: ['vue'],
    },
    optimizeDeps: {
      exclude: ['@lanius/ui', '@lanius/core'],
    },
    clearScreen: false,
    logLevel: 'error',
  });

  httpServer = createHttpServer((req, res) => {
    void viteServer!.middlewares(req, res, () => {
      res.statusCode = 404;
      res.end('Not found');
    });
  });
  return bindHttpServer(httpServer);
}

/**
 * 将 HTTP 服务绑定到 `127.0.0.1:0` 并记录 origin。
 *
 * @param server - Node HTTP Server
 * @returns 宿主 origin
 */
async function bindHttpServer(server: HttpServer): Promise<string> {
  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectListen);
      resolveListen();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('card-host HTTP server failed to bind a TCP port');
  }
  hostOrigin = `http://127.0.0.1:${address.port}`;
  return hostOrigin;
}
