# 编码规范

技术基线：TypeScript（strict）· Node.js 20+ · pnpm workspace · Vitest。  
Lint/Format：**ESLint + Prettier**（见仓库根配置）。

## 1. TypeScript

- 开启 `strict`；避免 `any`（确需时写清原因与收窄计划）。
- 共享契约放 `packages/core`（Zod schema 与推断类型同源）。
- 公开 API 错误用稳定错误码常量，勿只返回随意字符串。
- 优先具名导出；应用入口可用默认导出若框架要求。

## 2. 命名

| 对象            | 风格                                   | 示例                  |
| --------------- | -------------------------------------- | --------------------- |
| 文件（TS 模块） | kebab-case 或与导出一致的清晰名        | `worldstate-route.ts` |
| 类型 / 接口     | PascalCase                             | `MarketItemDto`       |
| 函数 / 变量     | camelCase                              | `resolveAlias`        |
| 常量            | SCREAMING_SNAKE 或 camelCase（模块级） | `DEFAULT_REALM`       |
| React 组件      | PascalCase 文件                        | `SearchBox.tsx`       |
| 包名            | `@lanius/...`                          | `@lanius/core`        |
| 产品名          | **Lanius**                             | 勿写成 Lanuis         |

## 3. 分层

- **API**：路由薄；校验（Zod）→ 服务 → 上游 adapter → DTO。
- **Bot**：解析命令 → 调 API → Formatter（文本）或 card-render（图片）→ 官方下行。
- **Web**：只消费 API；服务端/客户端组件按 Next 惯例；勿在浏览器打上游。

## 4. 异步与错误

- 使用 `async/await`；不吞异常。
- 边界（HTTP handler、QQ 回调）统一映射为用户可读错误（i18n 键）。
- 日志用结构化字段（pino）；用户/群 ID 哈希后再记。

## 5. i18n 与文案

- 用户可见字符串走文案键（zh/en），代码里不硬编码单语长文案（测试夹具除外）。
- 标识符、注释（面向开发者）用英文；产品说明文档可用中文。

## 6. 测试

- 纯函数 / DTO / 别名解析：Vitest 单测。
- Formatter 与卡片渲染：快照或黄金文件（控制体积）。
- 不为「测而测」加脆弱的 E2E；里程碑阶段再补关键路径。

## 7. 安全

- 密钥只从配置文件/DB 加载；示例文件无真实值。
- 管理接口鉴权；公开查询只读且限流。
- 不在日志/错误响应中回显 Secret。

## 8. Git

- 小步提交；信息说明「为什么」。
- 禁止提交 `config.local.yaml`、`node_modules`、含密钥的 dump。
