import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { generateImage } from "./client";
import { ImageGenerationRequest, ImageData, Env } from "./types";

const DEFAULT_MODEL = "doubao-seedream-5-0-260128";

function formatResult(data: ImageData[]) {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  > = [];

  for (const item of data) {
    if (item.error) {
      content.push({
        type: "text",
        text: `Error: [${item.error.code}] ${item.error.message}`,
      });
    } else if (item.b64_json) {
      content.push({ type: "image", data: item.b64_json, mimeType: "image/jpeg" });
      if (item.size) content.push({ type: "text", text: `Size: ${item.size}` });
    } else if (item.url) {
      content.push({
        type: "text",
        text: `${item.url}${item.size ? ` (${item.size})` : ""}`,
      });
    }
  }
  return { content };
}

function createServer(apiKey: string, model: string) {
  const server = new McpServer({
    name: "doubao-seedream-mcp",
    version: "1.0.0",
  });

  const sizeDesc =
    "Image size. Either resolution ('2K','3K','4K') or pixel dimensions ('2048x2048'). Default: 2048x2048";
  const responseFormatDesc =
    "Return format: 'url' returns download link (24h valid), 'b64_json' returns base64 data. Default: url";
  const outputFormatDesc = "Output image format (only 5.0-lite). Default: jpeg";

  // Tool 1: Text to Image
  server.tool(
    "text_to_image",
    "Generate image from text prompt using Doubao Seedream",
    {
      prompt: z.string().describe("Image description (max ~300 Chinese chars or 600 English words)"),
      size: z.string().optional().describe(sizeDesc),
      response_format: z.enum(["url", "b64_json"]).optional().describe(responseFormatDesc),
      output_format: z.enum(["png", "jpeg"]).optional().describe(outputFormatDesc),
      watermark: z.boolean().optional().describe("Add watermark. Default: true"),
      optimize_prompt: z.enum(["standard", "fast"]).optional().describe("Prompt optimization mode. Default: standard"),
    },
    async ({ prompt, size, response_format, output_format, watermark, optimize_prompt }) => {
      const req: ImageGenerationRequest = {
        model,
        prompt,
        sequential_image_generation: "disabled",
        ...(size && { size }),
        ...(response_format && { response_format }),
        ...(output_format && { output_format }),
        ...(watermark !== undefined && { watermark }),
        ...(optimize_prompt && { optimize_prompt_options: { mode: optimize_prompt } }),
      };
      const res = await generateImage(apiKey, req);
      if (res.error) return { content: [{ type: "text" as const, text: `Error: [${res.error.code}] ${res.error.message}` }] };
      return formatResult(res.data);
    }
  );

  // Tool 2: Image to Image
  server.tool(
    "image_to_image",
    "Generate image from reference image(s) + text prompt. Supports 1-14 reference images (URL or base64).",
    {
      prompt: z.string().describe("Text description for the generated image"),
      images: z.union([z.string(), z.array(z.string())]).describe("Reference image(s): URL or base64 string. Single string or array (max 14)."),
      size: z.string().optional().describe(sizeDesc),
      response_format: z.enum(["url", "b64_json"]).optional().describe(responseFormatDesc),
      output_format: z.enum(["png", "jpeg"]).optional().describe(outputFormatDesc),
      watermark: z.boolean().optional().describe("Add watermark. Default: true"),
      optimize_prompt: z.enum(["standard", "fast"]).optional().describe("Prompt optimization mode. Default: standard"),
    },
    async ({ prompt, images, size, response_format, output_format, watermark, optimize_prompt }) => {
      const req: ImageGenerationRequest = {
        model,
        prompt,
        image: images,
        sequential_image_generation: "disabled",
        ...(size && { size }),
        ...(response_format && { response_format }),
        ...(output_format && { output_format }),
        ...(watermark !== undefined && { watermark }),
        ...(optimize_prompt && { optimize_prompt_options: { mode: optimize_prompt } }),
      };
      const res = await generateImage(apiKey, req);
      if (res.error) return { content: [{ type: "text" as const, text: `Error: [${res.error.code}] ${res.error.message}` }] };
      return formatResult(res.data);
    }
  );

  // Tool 3: Generate Image Group
  server.tool(
    "generate_image_group",
    "Generate a group of related images (sequential/comic-style). Only for 5.0-lite/4.5/4.0.",
    {
      prompt: z.string().describe("Text description for the image group"),
      images: z.union([z.string(), z.array(z.string())]).optional().describe("Optional reference image(s)"),
      max_images: z.number().min(1).max(15).optional().describe("Max images to generate (1-15). Default: 15. Ref + generated ≤ 15."),
      size: z.string().optional().describe(sizeDesc),
      response_format: z.enum(["url", "b64_json"]).optional().describe(responseFormatDesc),
      output_format: z.enum(["png", "jpeg"]).optional().describe(outputFormatDesc),
      watermark: z.boolean().optional().describe("Add watermark. Default: true"),
      optimize_prompt: z.enum(["standard", "fast"]).optional().describe("Prompt optimization mode. Default: standard"),
    },
    async ({ prompt, images, max_images, size, response_format, output_format, watermark, optimize_prompt }) => {
      const req: ImageGenerationRequest = {
        model,
        prompt,
        sequential_image_generation: "auto",
        ...(images && { image: images }),
        ...(max_images && { sequential_image_generation_options: { max_images } }),
        ...(size && { size }),
        ...(response_format && { response_format }),
        ...(output_format && { output_format }),
        ...(watermark !== undefined && { watermark }),
        ...(optimize_prompt && { optimize_prompt_options: { mode: optimize_prompt } }),
      };
      const res = await generateImage(apiKey, req);
      if (res.error) return { content: [{ type: "text" as const, text: `Error: [${res.error.code}] ${res.error.message}` }] };
      return formatResult(res.data);
    }
  );

  // Tool 4: Search and Generate
  server.tool(
    "search_and_generate",
    "Generate image with web search enabled. Model searches internet for up-to-date info to improve generation. Only for 5.0-lite.",
    {
      prompt: z.string().describe("Text description - model may search web for referenced content"),
      images: z.union([z.string(), z.array(z.string())]).optional().describe("Optional reference image(s)"),
      sequential_image_generation: z.enum(["auto", "disabled"]).optional().describe("'auto' for image group, 'disabled' for single. Default: disabled"),
      max_images: z.number().min(1).max(15).optional().describe("Max images when using 'auto' mode"),
      size: z.string().optional().describe(sizeDesc),
      response_format: z.enum(["url", "b64_json"]).optional().describe(responseFormatDesc),
      output_format: z.enum(["png", "jpeg"]).optional().describe(outputFormatDesc),
      watermark: z.boolean().optional().describe("Add watermark. Default: true"),
      optimize_prompt: z.enum(["standard", "fast"]).optional().describe("Prompt optimization mode. Default: standard"),
    },
    async ({ prompt, images, sequential_image_generation, max_images, size, response_format, output_format, watermark, optimize_prompt }) => {
      const req: ImageGenerationRequest = {
        model,
        prompt,
        tools: [{ type: "web_search" }],
        sequential_image_generation: sequential_image_generation || "disabled",
        ...(images && { image: images }),
        ...(max_images && { sequential_image_generation_options: { max_images } }),
        ...(size && { size }),
        ...(response_format && { response_format }),
        ...(output_format && { output_format }),
        ...(watermark !== undefined && { watermark }),
        ...(optimize_prompt && { optimize_prompt_options: { mode: optimize_prompt } }),
      };
      const res = await generateImage(apiKey, req);
      if (res.error) return { content: [{ type: "text" as const, text: `Error: [${res.error.code}] ${res.error.message}` }] };

      const result = formatResult(res.data);
      if (res.usage?.tool_usage?.web_search) {
        result.content.push({ type: "text", text: `(Web searches: ${res.usage.tool_usage.web_search})` });
      }
      return result;
    }
  );

  return server;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/mcp") {
      return new Response("Not Found. MCP endpoint is at /mcp", { status: 404 });
    }

    // Extract config from headers (user-provided) or env (fallback)
    const authHeader = request.headers.get("authorization") || "";
    const apiKey = authHeader.replace(/^Bearer\s+/i, "") || env.ARK_API_KEY || "";
    const model = request.headers.get("x-model") || env.ARK_MODEL || DEFAULT_MODEL;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key. Set Authorization header or ARK_API_KEY env." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Dynamically import createMcpHandler from agents/mcp
    const server = createServer(apiKey, model);
    const handler = createMcpHandler(server, { route: "/mcp" });
    return handler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
