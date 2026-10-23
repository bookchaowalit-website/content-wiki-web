import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import WikiPageDetail, { generateStaticParams } from "@/app/wiki/[slug]/page";

async function render(slug: string) {
  return renderToString(await WikiPageDetail({ params: Promise.resolve({ slug }) }));
}

describe("wiki detail page", () => {
  it("prerenders every page on file", async () => {
    expect((await generateStaticParams()).map((p) => p.slug).sort()).toEqual(["design-patterns", "javascript-basics", "react-hooks"]);
  });

  it("renders the markdown as headings, lists and code blocks, not raw markdown text", async () => {
    const html = await render("react-hooks");
    expect(html).toContain("React Hooks");
    expect(html).toMatch(/<h2[^>]*>Built-in Hooks<\/h2>/);
    expect(html).toMatch(/<pre[^>]*><code[^>]*>import \{ useState \} from &#x27;react&#x27;;/);
    expect(html).toContain("<strong>Only call Hooks at the top level</strong>");
    expect(html).not.toContain("## Built-in Hooks");
    expect(html).not.toContain("```");
  });

  it("does not inject HTML from code samples into the page", async () => {
    const html = await render("react-hooks");
    // The useState sample contains <button onClick=...>; it must arrive as text.
    expect(html).not.toContain("<button");
    expect(html).toContain("&lt;button onClick");
  });

  it("keeps links to pages that exist and marks the others as not on file", async () => {
    const html = await render("react-hooks");
    expect(html).toContain('href="https://react.dev/reference/react/hooks"');
    expect(html).not.toContain('href="/wiki/react-components"');
    expect(html).toContain("React Components");
  });

  it("calls notFound for an unknown or unsafe slug", async () => {
    await expect(render("does-not-exist")).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
    await expect(render("../package")).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });
});
