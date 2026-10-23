import { describe, expect, it } from "vitest";
import { filterPages, formatDate, getAllWikiPages, getWikiPageBySlug, isValidSlug, sortByUpdated, type WikiPage } from "@/lib/mdx";

const page = (slug: string, last_updated: string, extra: Partial<WikiPage> = {}): WikiPage => ({ slug, title: slug, category: "c", tags: [], related_pages: [], content: "", last_updated, ...extra });

describe("content loading", () => {
  it("reads the three local pages, newest first, with typed front matter", async () => {
    const pages = await getAllWikiPages();
    expect(pages.map((p) => p.slug)).toEqual(["design-patterns", "react-hooks", "javascript-basics"]);
    expect(pages[0]).toMatchObject({ title: "Design Patterns", category: "architecture", last_updated: "2024-03-20" });
    expect(pages[0].tags).toContain("architecture");
  });

  it("returns null for unknown slugs and for anything that is not a plain slug", async () => {
    expect(await getWikiPageBySlug("react-hooks")).not.toBeNull();
    expect(await getWikiPageBySlug("nope")).toBeNull();
    for (const bad of ["../package", "a/b", "", "React-Hooks", 42, undefined]) expect(await getWikiPageBySlug(bad)).toBeNull();
  });

  it("isValidSlug accepts lowercase kebab-case only", () => {
    expect(isValidSlug("a-b-1")).toBe(true);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("-a")).toBe(false);
  });
});

describe("filtering and sorting", () => {
  const pages = [page("a", "2024-01-01", { category: "x", tags: ["One"], content: "alpha text" }), page("b", "2024-02-01", { category: "y", tags: ["two"] })];

  it("filters by category, tag (case-insensitive) and query", () => {
    expect(filterPages(pages, { category: "x" }).map((p) => p.slug)).toEqual(["a"]);
    expect(filterPages(pages, { tag: "one" }).map((p) => p.slug)).toEqual(["a"]);
    expect(filterPages(pages, { query: " ALPHA " }).map((p) => p.slug)).toEqual(["a"]);
    expect(filterPages(pages, {})).toHaveLength(2);
    expect(filterPages(pages, { category: "x", tag: "two" })).toEqual([]);
  });

  it("sorts newest first and puts undated pages last", () => {
    expect(sortByUpdated([page("old", "2023-01-01"), page("none", ""), page("new", "2025-01-01")]).map((p) => p.slug)).toEqual(["new", "old", "none"]);
  });

  it("formats dates without a time-zone shift and labels missing ones", () => {
    expect(formatDate("2024-03-15", "long")).toBe("15 March 2024");
    expect(formatDate("2024-03-15", "short")).toBe("15 Mar 2024");
    expect(formatDate("", "short")).toBe("Undated");
    expect(formatDate("garbage", "short")).toBe("Undated");
  });
});
