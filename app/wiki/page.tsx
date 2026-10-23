import Link from "next/link";
import { categoriesOf, filterPages, formatDate, getAllWikiPages, tagsOf } from "@/lib/mdx";
import { excerpt } from "@/lib/markdown";

type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function WikiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const category = first(params.category);
  const tag = first(params.tag);
  const allPages = await getAllWikiPages();
  const categories = categoriesOf(allPages);
  const tags = tagsOf(allPages);
  const pages = filterPages(allPages, { category, tag });
  const filterLabel = category ? `SECTION: ${category}` : tag ? `TAG: ${tag}` : null;

  return (
    <main className="wiki-shell">
      <header className="wiki-header">
        <Link href="/" className="wiki-mark">B/15</Link>
        <div className="wiki-brand"><strong>FIELD MANUAL</strong><span>COMPLETE KNOWLEDGE / LOCAL MDX</span></div>
        <Link href="/" className="wiki-back">← Home</Link>
      </header>
      <section className="full-index-hero"><p className="wiki-kicker">BOOKCHAOWALIT / COMPLETE INDEX</p><h1>Every page has<br /><em>a place.</em></h1><p>Browse the current local archive by section or tag. It is a read-only working shelf.</p></section>
      <section className="full-index-grid">
        <aside className="index-rail">
          <div><span>SECTIONS</span><strong>{String(categories.length).padStart(2, "0")}</strong></div>
          {categories.map((item) => <Link key={item} href={"/wiki?category=" + encodeURIComponent(item)} aria-current={item === category ? "page" : undefined}>{item}<b>{allPages.filter((page) => page.category === item).length}</b></Link>)}
          <div className="rail-tags"><span>TAGS ON FILE</span><div>{tags.map((item) => <Link key={item} href={"/wiki?tag=" + encodeURIComponent(item)} aria-current={item === tag ? "page" : undefined}>{item}</Link>)}</div></div>
        </aside>
        <div className="page-register full-register">
          <div className="register-heading"><div><span>{filterLabel ?? "ALL LEAVES"}</span><h2>The archive.</h2></div><span>{pages.length} {pages.length === 1 ? "PAGE" : "PAGES"}{filterLabel && <> · <Link href="/wiki">CLEAR</Link></>}</span></div>
          {pages.length === 0 && <p className="page-copy">No page on file matches this filter.</p>}
          {pages.map((page, index) => <Link href={"/wiki/" + page.slug} className="page-row" key={page.slug}><span className="page-number">{String(index + 1).padStart(2, "0")}</span><div className="page-copy"><span>{page.category}</span><h3>{page.title}</h3><p>{excerpt(page.content, 160)}</p><div className="tag-line">{page.tags.slice(0, 3).map((tag) => <em key={tag}>{tag}</em>)}</div></div><div className="page-meta"><time>{formatDate(page.last_updated, "short")}</time><b>OPEN ↗</b></div></Link>)}
        </div>
      </section>
      <footer className="wiki-footer"><span>BOOKCHAOWALIT / WIKI INDEX</span><span>READ ONLY · LOCAL MDX</span></footer>
    </main>
  );
}
