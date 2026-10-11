# 配置体系（模块化 + 导入驱动）

所有进程通过 **`@lanius/config`** 的 `getConfigDriver()` 读取配置，**禁止**业务代码拼 `default/` / `local/` 相对或绝对路径。

## 目录

| 路径 | 入库 | 作用 |
| --- | --- | --- |
| `config/default/<module>.yaml` | 是 | 可提交回退默认值 |
| `config/local/<module>.yaml` | 否（gitignore） | 环境覆盖；Admin 保存写入此处 |
| `config/local/*.yaml.example` | 是 | 覆盖模板 |

模块文件：`api` · `bot` · `qq` · `admin` · `redis` · `database` · `defaults` · `web` · `site` · `labels` · `github`。

`labels` 默认派系中文对齐 [灰机 wiki](https://warframe.huijiwiki.com/)（如 `Grineer` / `合一众` / `炽蛇军` / `科腐者`）；星图节点会把 WFCD 繁体星球名转为简体（谷神星、欧罗巴、赛德娜、赤毒要塞等）。

## 加载规则

1. 读 `default/<module>.yaml`
2. 深合并 `local/<module>.yaml`（若存在）
3. Zod 校验
4. Admin 保存 → 写 local → **进程内热加载**（`host`/`port`/`sqlitePath`/`redis.url` 等需手动重启进程）

环境变量（非密钥）：

- `LANIUS_CONFIG_ROOT`：配置根（默认 `<repo>/config`；容器内 `/config`）
- `LANIUS_CONFIG`：可选单体 `config.local.yaml` 路径；首次启动会拆分进 `local/`（迁移兼容）
- `HOST` / `PORT` / `LANIUS_API_BASE`：容器服务发现覆盖

## 本地快速开始

```bash
cp config/local/admin.yaml.example config/local/admin.yaml
cp config/local/api.yaml.example config/local/api.yaml
cp config/local/qq.yaml.example config/local/qq.yaml
cp config/local/redis.yaml.example config/local/redis.yaml
# 编辑后：pnpm dev:api / pnpm dev:web → http://localhost:8790/admin
```

根目录旧版单体 `config.local.yaml` 仍可放着：驱动会自动拆分到 `config/local/*`（目标文件已存在则跳过）。
