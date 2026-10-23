import { NextResponse } from "next/server";
import { categoriesOf, filterPages, getAllWikiPages, getWikiPageBySlug, type WikiPage } from "@/lib/mdx";

// Stateless JSON-RPC MCP endpoint over the same local MDX pages the site renders (content/wiki).
// Runs on Node.js (not Edge) because it reads content/ from the filesystem.

type RpcRequest = { id?: number | string | null; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };

const TOOLS = [
  { name: "get_entries", description: "List wiki pages (metadata only), optionally by category", inputSchema: { type: "object", properties: { category: { type: "string", description: "Filter by category" } } } },
  { name: "get_entry_by_slug", description: "Get one wiki page with its markdown", inputSchema: { type: "object", properties: { slug: { type: "string", description: "Page slug" } }, required: ["slug"] } },
  { name: "search_entries", description: "Search titles, categories, tags and page text", inputSchema: { type: "object", properties: { query: { type: "string", description: "Search query" } }, required: ["query"] } },
  { name: "get_categories", description: "List the categories in use", inputSchema: { type: "object", properties: {} } },
];

class RpcError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

const summary = (page: WikiPage) => ({ slug: page.slug, title: page.title, category: page.category, tags: page.tags, last_updated: page.last_updated, related_pages: page.related_pages });
const text = (value: unknown) => (typeof value === "string" ? value : undefined);

async function callTool(name: string | undefined, args: Record<string, unknown> = {}) {
  switch (name) {
    case "get_entries":
      return { entries: filterPages(await getAllWikiPages(), { category: text(args.category) }).map(summary) };
    case "get_entry_by_slug": {
      const entry = await getWikiPageBySlug(args.slug);
      if (!entry) throw new RpcError(-32602, `No wiki page with slug ${String(args.slug)}`);
      return { entry };
    }
    case "search_entries": {
      const query = text(args.query);
      if (!query?.trim()) throw new RpcError(-32602, "query must be a non-empty string");
      return { entries: filterPages(await getAllWikiPages(), { query }).map(summary) };
    }
    case "get_categories":
      return { categories: categoriesOf(await getAllWikiPages()) };
    default:
      throw new RpcError(-32602, `Unknown tool: ${String(name)}`);
  }
}

export async function POST(request: Request) {
  let id: RpcRequest["id"] = null;
  try {
    const body = (await request.json()) as RpcRequest;
    id = body.id ?? null;
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "Field Manual Wiki", version: "1.0.0" },
        };
        break;
      case "tools/list":
        result = { tools: TOOLS };
        break;
      case "tools/call":
        result = await callTool(body.params?.name, body.params?.arguments);
        break;
      default:
        throw new RpcError(-32601, `Unknown method: ${String(body.method)}`);
    }
    return NextResponse.json({ jsonrpc: "2.0", id, result });
  } catch (error) {
    const code = error instanceof RpcError ? error.code : -32700;
    const message = error instanceof RpcError ? error.message : "Parse error";
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 400 });
  }
}
