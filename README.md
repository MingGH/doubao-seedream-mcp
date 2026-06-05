# doubao-seedream-mcp

将豆包 Seedream 图片生成模型封装为 MCP 服务，部署在 Cloudflare Workers 上，开箱即用。

## 功能

支持豆包 Seedream API 的全部能力：

| Tool | 功能 | 适用模型 |
|------|------|----------|
| `text_to_image` | 文生图 | 全部 |
| `image_to_image` | 图生图（单图/多图参考，最多14张） | 全部 |
| `generate_image_group` | 生成组图（内容关联的多张图） | 5.0-lite / 4.5 / 4.0 |
| `search_and_generate` | 联网搜索 + 生图 | 5.0-lite |

通用参数支持：

- **尺寸** — `2K` / `3K` / `4K` 或自定义像素值（如 `2048x2048`）
- **输出格式** — PNG / JPEG（仅 5.0-lite 支持切换）
- **返回方式** — URL（24小时有效链接）或 Base64（直接展示）
- **水印控制** — 开启/关闭右下角 "AI生成" 水印
- **提示词优化** — standard（高质量）/ fast（快速）

## 快速使用

### 前置条件

1. 一个[火山方舟](https://console.volcengine.com/ark)的 API Key
2. 在火山方舟控制台开通 Seedream 模型的访问权限

### MCP 客户端配置

在你的 MCP 客户端（Claude Desktop、Cursor、Kiro 等）中添加：

**方式一：远程 URL（支持 Streamable HTTP 的客户端）**

```json
{
  "mcpServers": {
    "doubao-seedream": {
      "url": "https://doubao-seedream-mcp.tangym.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <your-ark-api-key>",
        "X-Model": "doubao-seedream-5-0-260128"
      }
    }
  }
}
```

**方式二：通过 mcp-remote 代理（Claude Desktop 等仅支持 stdio 的客户端）**

```json
{
  "mcpServers": {
    "doubao-seedream": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://doubao-seedream-mcp.tangym.workers.dev/mcp",
        "--header",
        "Authorization:Bearer <your-ark-api-key>",
        "--header",
        "X-Model:doubao-seedream-5-0-260128"
      ]
    }
  }
}
```

### 配置说明

| Header | 必填 | 说明 |
|--------|------|------|
| `Authorization` | ✅ | 火山方舟 API Key，格式 `Bearer ark-xxx` |
| `X-Model` | ❌ | 模型名称，默认 `doubao-seedream-5-0-260128` |

支持的模型：
- `doubao-seedream-5-0-260128`（推荐，功能最全）
- `doubao-seedream-4.5`
- `doubao-seedream-4.0`
- `doubao-seedream-3.0-t2i`

## 自部署

如果你想部署自己的实例：

```bash
# 克隆项目
git clone <repo-url>
cd doubao-seedream-mcp

# 安装依赖
npm install

# 本地开发
npm run dev

# 部署到 Cloudflare Workers
npm run deploy
```

也可以通过环境变量设置默认的 API Key（这样用户无需在 header 中传递）：

```bash
npx wrangler secret put ARK_API_KEY
npx wrangler secret put ARK_MODEL
```

## 本地测试

```bash
npm run dev

# 用 MCP Inspector 测试
npx @modelcontextprotocol/inspector@latest
# 在 Inspector 中输入 http://localhost:8787/mcp
```

## 使用示例

配置好 MCP 后，直接对 AI 说：

- "帮我生成一张赛博朋克风格的城市夜景"
- "参考这张图片，生成一张类似风格的日落场景" （附图）
- "生成一组4格漫画，讲述一只猫咪的日常"
- "搜索最新的 iPhone 设计，生成一张产品宣传图"

## API 参考

基于[火山方舟 Seedream API 文档](https://www.volcengine.com/docs/82379/1541523)。

## License

MIT
