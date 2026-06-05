# AGENTS.md

## Project Overview

This is a Cloudflare Workers-based MCP (Model Context Protocol) server that wraps the Volcengine Doubao Seedream image generation API. It exposes 4 MCP tools for AI agents to generate images.

## Architecture

- **Runtime**: Cloudflare Workers (stateless, Streamable HTTP transport)
- **MCP SDK**: `@modelcontextprotocol/sdk` + `agents` (Cloudflare's agents framework)
- **Language**: TypeScript
- **Build**: Wrangler (Cloudflare's CLI tool)

## Project Structure

```
src/
├── index.ts    # Worker entry point, MCP server factory, tool definitions
├── client.ts   # HTTP client for Volcengine Ark API
└── types.ts    # TypeScript type definitions
```

## Key Design Decisions

1. **Per-request server instantiation**: Each request creates a new `McpServer` instance via `createServer(apiKey, model)`. This is required by MCP SDK 1.26.0+ to prevent response leakage between clients.

2. **Header-based authentication**: API key and model are extracted from HTTP request headers (`Authorization`, `X-Model`), enabling multi-tenant usage without server-side secrets.

3. **Closure-based config passing**: Since MCP tool handlers don't receive HTTP headers directly, `apiKey` and `model` are captured via closure when tools are registered in `createServer()`.

4. **Dual return format**: Tools support both `url` (text content with download link) and `b64_json` (MCP image content for direct rendering) via the `response_format` parameter.

## Tools

| Tool | Purpose |
|------|---------|
| `text_to_image` | Generate single image from text prompt |
| `image_to_image` | Generate image from reference image(s) + text |
| `generate_image_group` | Generate multiple related images (sequential) |
| `search_and_generate` | Web search-enhanced image generation |

## External API

- **Endpoint**: `POST https://ark.cn-beijing.volces.com/api/v3/images/generations`
- **Auth**: Bearer token in Authorization header
- **Docs**: https://www.volcengine.com/docs/82379/1541523

## Development Commands

```bash
npm run dev        # Local development with wrangler
npm run deploy     # Deploy to Cloudflare Workers
npm run typecheck  # TypeScript type checking
```

## Configuration

- `wrangler.toml` — Worker name, compatibility settings
- Environment variables (optional): `ARK_API_KEY`, `ARK_MODEL`

## Conventions

- No state between requests (stateless worker)
- Error responses follow MCP content format: `{ content: [{ type: "text", text: "Error: ..." }] }`
- All optional parameters use conditional spread (`...(param && { key: param })`)
