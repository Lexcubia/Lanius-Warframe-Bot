# 运行时配置（default + local）

面向**重启即生效**、无需重发镜像的内容：页脚备案、派系显示名等。

## 目录

| 路径 | 是否入库 | 作用 |
| ---- | -------- | ---- |
| `config/default/*.yaml` | **是** | 回退默认值；仓库内可安全提交 |
| `config/local/*.yaml` | **否**（gitignore） | 环境覆盖；生产备案号、定制映射写这里 |
| `config/local/*.yaml.example` | 是 | 覆盖文件模板 |

## 加载规则

1. 先读 `default/<name>.yaml`
2. 再读 `local/<name>.yaml`（若存在）
3. **深合并**（对象按键合并；`local` 覆盖 `default`）
4. API 启动时加载；改文件后 **重启 api（及依赖方）容器** 即可

环境变量：

- `LANIUS_RUNTIME_CONFIG_ROOT`：配置根目录（默认仓库根下的 `config/`；Docker 内一般为 `/runtime-config`）

## 已支持文件

| 文件 | 消费方 | 说明 |
| ---- | ------ | ---- |
| `site.yaml` | API `GET /v1/site` → Web Footer | 备案链接、版权等 |
| `labels.yaml` | API worldstate 映射 | `factions` / `nodes` / `paths` 显示名覆盖 |

后续同类内容：在 `default/` 增加同名 YAML + Zod schema + 启动加载，并在本表登记。

## 本地快速开始

```bash
cp config/local/site.yaml.example config/local/site.yaml
cp config/local/labels.yaml.example config/local/labels.yaml
# 编辑后重启 pnpm dev:api / docker compose
```
