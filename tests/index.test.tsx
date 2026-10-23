import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import WikiPage from "@/app/wiki/page";

async function index(searchParams: Record<string, string> = {}) {
  return renderToString(await WikiPage({ searchParams: Promise.resolve(searchParams) }));
}

describe("home page", () => {
  it("lists every page on file with a plain-text excerpt and the read-only notice", async () => {
    const html = renderToString(await Home());
    expect(html).toContain("React Hooks");
    expect(html).toContain("JavaScript Basics");
    expect(html).toContain("Design Patterns");
    expect(html).toMatch(/3(<!-- -->)? PAGES · READ ONLY/);
    expect(html).not.toContain("**");
  });
});

describe("wiki index", () => {
  it("shows every page without a filter", async () => {
    const html = await index();
    expect(html).toContain("React Hooks");
    expect(html).toContain("Design Patterns");
  });

  it("filters by the category link it offers", async () => {
    const html = await index({ category: "react" });
    expect(html).toContain("React Hooks");
    expect(html).not.toContain("Design Patterns");
    expect(html).not.toContain("JavaScript Basics");
  });

  it("filters by the tag link it offers", async () => {
    const html = await index({ tag: "architecture" });
    expect(html).toContain("Design Patterns");
    expect(html).not.toContain("React Hooks");
  });
});
