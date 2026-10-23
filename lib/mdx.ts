import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export interface WikiPage {
  title: string;
  category: string;
  tags: string[];
  last_updated: string;
  related_pages: string[];
  content: string;
  slug: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "wiki");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && SLUG.test(slug);
}

function toPage(slug: string, raw: string): WikiPage {
  const { data, content } = matter(raw);
  const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    category: typeof data.category === "string" ? data.category : "uncategorised",
    tags: list(data.tags),
    related_pages: list(data.related_pages),
    // gray-matter may parse an unquoted date into a Date; keep a stable YYYY-MM-DD string.
    last_updated: data.last_updated instanceof Date ? data.last_updated.toISOString().slice(0, 10) : String(data.last_updated ?? ""),
    content,
  };
}

/** Newest first; pages without a date sort last. */
export function sortByUpdated(pages: WikiPage[]): WikiPage[] {
  return [...pages].sort((a, b) => (b.last_updated || "").localeCompare(a.last_updated || "") || a.slug.localeCompare(b.slug));
}

export async function getAllWikiPages(): Promise<WikiPage[]> {
  const files = (await fs.readdir(CONTENT_DIR)).filter((file) => file.endsWith(".mdx"));
  const pages = await Promise.all(files.map(async (file) => toPage(file.slice(0, -4), await fs.readFile(path.join(CONTENT_DIR, file), "utf8"))));
  return sortByUpdated(pages);
}

/** Null for an unknown slug, and for anything that is not a plain slug (no path traversal). */
export async function getWikiPageBySlug(slug: unknown): Promise<WikiPage | null> {
  if (!isValidSlug(slug)) return null;
  try {
    return toPage(slug, await fs.readFile(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8"));
  } catch {
    return null;
  }
}

export function filterPages(pages: WikiPage[], filter: { category?: string; tag?: string; query?: string }): WikiPage[] {
  const tag = filter.tag?.toLowerCase();
  const query = filter.query?.trim().toLowerCase();
  return pages.filter(
    (page) =>
      (!filter.category || page.category === filter.category) &&
      (!tag || page.tags.some((item) => item.toLowerCase() === tag)) &&
      (!query || [page.title, page.category, page.content, ...page.tags].some((field) => field.toLowerCase().includes(query))),
  );
}

export function categoriesOf(pages: WikiPage[]): string[] {
  return [...new Set(pages.map((page) => page.category))];
}

export function tagsOf(pages: WikiPage[]): string[] {
  return [...new Set(pages.flatMap((page) => page.tags))];
}

export function formatDate(value: string, month: "short" | "long"): string {
  const date = new Date(`${value}T12:00:00Z`);
  if (!value || Number.isNaN(date.getTime())) return "Undated";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month, year: "numeric", timeZone: "UTC" });
}
