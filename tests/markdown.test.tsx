import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown, excerpt, parseBlocks, safeHref } from "@/lib/markdown";

const html = (source: string, extra: { title?: string; availableSlugs?: Set<string> } = {}) => renderToString(<Markdown source={source} {...extra} />);

describe("parseBlocks", () => {
  it("splits headings, paragraphs, lists and fenced code", () => {
    const blocks = parseBlocks("# T\n\nline one\nline two\n\n- a\n- b\n\n1. x\n2. y\n\n```js\nconst a = 1;\n\nconst b = 2;\n```\n#### Deep");
    expect(blocks).toEqual([
      { type: "heading", level: 1, text: "T" },
      { type: "paragraph", text: "line one line two" },
      { type: "list", ordered: false, items: ["a", "b"] },
      { type: "list", ordered: true, items: ["x", "y"] },
      { type: "code", lang: "js", code: "const a = 1;\n\nconst b = 2;" },
      { type: "heading", level: 4, text: "Deep" },
    ]);
  });

  it("keeps markdown-looking lines inside code fences as code, and survives an unclosed fence", () => {
    expect(parseBlocks("```\n# not a heading\n- not a list")).toEqual([{ type: "code", lang: "", code: "# not a heading\n- not a list" }]);
  });

  it("handles CRLF line endings", () => {
    expect(parseBlocks("## A\r\ntext\r\n")).toEqual([{ type: "heading", level: 2, text: "A" }, { type: "paragraph", text: "text" }]);
  });
});

describe("Markdown", () => {
  it("escapes HTML in text and code instead of injecting it", () => {
    const out = html("<script>alert(1)</script>\n\n```\n<img src=x onerror=alert(1)>\n```");
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;script&gt;");
  });

  it("renders bold, italic, inline code and safe links", () => {
    const out = html("**b** *i* `c` [ext](https://example.com) [site](/wiki)");
    expect(out).toContain("<strong>b</strong>");
    expect(out).toContain("<em>i</em>");
    expect(out).toContain("<code>c</code>");
    expect(out).toContain('href="https://example.com" rel="noopener noreferrer" target="_blank"');
    expect(out).toContain('href="/wiki"');
  });

  it("drops unsafe link targets but keeps the label", () => {
    const out = html("[x](javascript:alert(1)) [y](//evil.example)");
    expect(out).not.toContain("href=");
    expect(out).toContain("x");
  });

  it("marks wiki links to missing pages and links the ones on file", () => {
    const out = html("[Here](/wiki/here) [Gone](/wiki/gone)", { availableSlugs: new Set(["here"]) });
    expect(out).toContain('href="/wiki/here"');
    expect(out).toContain("Gone · not on file");
  });

  it("drops a leading h1 that repeats the page title, but not a different one", () => {
    expect(html("# Same\n\ntext", { title: "Same" })).not.toContain("<h1");
    expect(html("# Other\n\ntext", { title: "Same" })).toContain("<h1>Other</h1>");
  });
});

describe("safeHref and excerpt", () => {
  it("allows http(s), mailto and site-relative links only", () => {
    expect(safeHref("https://a.b")).toBe("https://a.b");
    expect(safeHref("mailto:a@b.c")).toBe("mailto:a@b.c");
    expect(safeHref("/wiki/x")).toBe("/wiki/x");
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("//evil.example")).toBeNull();
  });

  it("excerpts the first paragraph as plain text, truncated", () => {
    expect(excerpt("# T\n\nSome **bold** and [a link](/x) and `code`.", 100)).toBe("Some bold and a link and code.");
    expect(excerpt("# T\n\n" + "word ".repeat(50), 20)).toBe("word word word word…");
    expect(excerpt("# Only a heading", 50)).toBe("A page in the local knowledge archive.");
  });
});
