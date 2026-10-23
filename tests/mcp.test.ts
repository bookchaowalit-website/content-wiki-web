import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/mcp/route";

function rpc(body: unknown) {
  return POST(new Request("http://localhost/api/mcp", { method: "POST", body: JSON.stringify(body) }));
}

async function call(name: string, args: Record<string, unknown> = {}) {
  return (await rpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name, arguments: args } })).json();
}

describe("MCP route", () => {
  it("echoes the JSON-RPC request id", async () => {
    expect((await (await rpc({ jsonrpc: "2.0", id: 7, method: "tools/list" })).json()).id).toBe(7);
  });

  it("get_entries lists the real wiki pages, optionally by category", async () => {
    const all = await call("get_entries");
    expect(all.result.entries.map((e: { slug: string }) => e.slug).sort()).toEqual(["design-patterns", "javascript-basics", "react-hooks"]);
    const react = await call("get_entries", { category: "react" });
    expect(react.result.entries.map((e: { slug: string }) => e.slug)).toEqual(["react-hooks"]);
  });

  it("get_entry_by_slug returns the page markdown, and an error for an unknown slug", async () => {
    const hit = await call("get_entry_by_slug", { slug: "design-patterns" });
    expect(hit.result.entry.title).toBe("Design Patterns");
    expect(hit.result.entry.content).toContain("# Design Patterns");
    const miss = await call("get_entry_by_slug", { slug: "sample-entry" });
    expect(miss.error.code).toBe(-32602);
    expect(miss.id).toBe(9);
  });

  it("search_entries and get_categories act on the real content", async () => {
    const found = await call("search_entries", { query: "useReducer" });
    expect(found.result.entries.map((e: { slug: string }) => e.slug)).toEqual(["react-hooks"]);
    const cats = await call("get_categories");
    expect([...cats.result.categories].sort()).toEqual(["architecture", "programming", "react"]);
  });

  it("rejects unknown tools, unknown methods and bad JSON with JSON-RPC errors", async () => {
    expect((await call("delete_all")).error.code).toBe(-32602);
    expect((await (await rpc({ jsonrpc: "2.0", id: 1, method: "resources/list" })).json()).error.code).toBe(-32601);
    const bad = await POST(new Request("http://localhost/api/mcp", { method: "POST", body: "{" }));
    expect((await bad.json()).error.code).toBe(-32700);
  });
});
