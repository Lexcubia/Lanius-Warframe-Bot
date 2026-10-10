# 编码规范

技术基线：TypeScript（strict）· Node.js 20+ · pnpm workspace · Vitest。  
Lint/Format：**ESLint + Prettier**（见仓库根配置）。

> Agent 硬约束总表见根目录 [AGENTS.md](../AGENTS.md)。本节与 AGENTS 冲突时，**以 AGENTS 与用户最新规则为准**。

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

### 2.1 职责清晰、简洁

- 名称须**描述职责**，短而准：`fetchWorldstate`、`formatPriceText`、`verifyQqCallback`。
- **禁止**冗长叙事式命名（把整句说明塞进标识符）。
- **禁止**含糊名：`data`、`info`、`temp`、`foo`、`handleStuff`、`doThing`（极小循环下标 `i`/`j` 除外）。
- 好：`cacheTtlMs`；坏：`theNumberOfMillisecondsForWhichWeCache`。

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
- 标识符、类型名、API 契约字段用 **English**；产品说明文档可用中文。

## 6. 注释规范

### 6.1 目标：注释率 ≥ 80%

对 **TypeScript「需注释单元」** 统计覆盖率，目标 **≥ 80%**；**新建代码应力争 100%**。

**需注释单元（分母）包括：**

1. 每一个 **function / method**（导出与模块级私有均算；不含仅一行的 trivial property getter 若无逻辑——有逻辑则算）。
2. 每一个 **exported** `type` / `interface` / `class` / 重要 `const`（配置表、错误码表等）。
3. 每一个 **非平凡逻辑块**（≥2 层分支、协议验签、缓存失效、图片降级、鉴权）——须有紧邻的块注释或所属函数 TSDoc 已充分说明该路径。

**算作已覆盖（分子）须同时满足：**

- 有符合 §6.3 格式的多行 TSDoc（函数）或等价文档注释（类型/常量）；
- 内容说明**职责 / 约束 / 语义**，而非复述标识符；
- `@param` / `@returns` 齐全（见下）。

**不算覆盖（禁止刷比例）：**

- `@param raw - raw`、`@returns the result` 等空转义；
- 粘贴 Agent 对话、提示词、聊天记录；
- 大段注释掉的废代码；
- 与代码无关的情绪/过程流水账。

PR / Agent 自检：对**本 diff 新增或实质修改**的需注释单元，覆盖率应 ≥ 80%（新建函数建议 100%）。

### 6.2 语言与禁忌

| 场景                                   | 语言 / 规则                                  |
| -------------------------------------- | -------------------------------------------- |
| 函数 TSDoc（含 `@param` / `@returns`） | **English**                                  |
| 类型 / 导出常量的文档注释              | **English**                                  |
| 行内/块「为什么」注释                  | 中文或英文；同一文件内统一                   |
| Agent 对话 / prompt / 会话摘录         | **禁止**出现在任何注释或源码中               |
| 注释内容范围                           | **仅**项目与代码（行为、不变量、协议、领域） |

### 6.3 函数入参 / 出参：标准多行 TSDoc

**每一个函数**（含非导出）必须使用多行 TSDoc，并包含：

1. 首行：职责摘要（一句）。
2. 空行（可选）后：必要的细节（副作用、realm/locale、降级）。
3. **每个参数一行** `@param name - …`（含义、合法值、单位）。
4. **`@returns …`**（`void` 函数写明无返回值或不写返回数据时的行为）。
5. 调用方需处理的错误：`@throws …`。

**标准格式示例：**

```ts
/**
 * Resolve a player-facing alias to a canonical item id.
 *
 * Looks up locale-specific alias tables; does not call upstream APIs.
 *
 * @param raw - User-entered name or alias (trimmed by caller)
 * @param locale - UI/query locale; `zh` or `en`
 * @returns Canonical item id, or `null` if the alias is unknown
 */
export function resolveAlias(raw: string, locale: Locale): string | null {
  // ...
}

/**
 * Format a market quote for QQ text reply mode.
 *
 * @param quote - Normalized quote DTO from Lanius API
 * @param locale - Reply locale for number/date formatting
 * @returns Single-message plain text (no image payload)
 */
function formatPriceText(quote: MarketQuoteDto, locale: Locale): string {
  // ...
}

/**
 * Verify the official QQ callback signature and parse the event body.
 *
 * @param headers - Incoming HTTP headers from the QQ open platform
 * @param body - Raw request body bytes
 * @returns Parsed official event envelope
 * @throws {QqSignatureError} When signature verification fails
 */
async function verifyQqCallback(headers: Headers, body: Uint8Array): Promise<QqEventEnvelope> {
  // ...
}
```

**不合格示例（禁止）：**

```ts
/** does stuff */
function resolveAlias(raw: string, locale: Locale): string | null {}

/**
 * resolveAlias
 * @param raw - raw
 * @returns result
 */

/**
 * User said: please fix this — agent: I will add a comment here...
 */
```

### 6.4 导出类型

```ts
/**
 * Normalized worldstate snapshot for one realm.
 * Clients must not depend on upstream field names.
 */
export interface WorldstateDto {
  realm: Realm;
  fetchedAt: string;
  invasions: InvasionDto[];
}
```

### 6.5 TODO / FIXME

```ts
// TODO(api): wire china realm upstream after MVP
// FIXME(bot): retry official image upload once on 5xx
```

- 必须带可执行含义；禁止裸 `// TODO`。
- 可选 `TODO(scope):`；有工单则附链接或编号。
- TODO 文本仍不得包含 Agent 对话。

## 7. 测试

- 纯函数 / DTO / 别名解析：Vitest 单测。
- Formatter 与卡片渲染：快照或黄金文件（控制体积）。
- 不为「测而测」加脆弱的 E2E；里程碑阶段再补关键路径。

## 8. 安全

- 密钥只从配置文件/DB 加载；示例文件无真实值。
- 管理接口鉴权；公开查询只读且限流。
- 不在日志/错误响应中回显 Secret。

## 9. Git

- 分支：日常合入 **`develop`**；**`main`** 仅发布归档。见 [CONTRIBUTING.md](./CONTRIBUTING.md) §分支、[VERSIONING.md](./VERSIONING.md)、[AGENTS.md](../AGENTS.md) §分支。
- 提交信息遵循 [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md)。
- 小步提交；body 写清「为什么」。
- 禁止提交 `config.local.yaml`、`node_modules`、含密钥的 dump。
- **禁止向 `main` 或 `develop` 直接 commit**（仅 merge / PR）。
