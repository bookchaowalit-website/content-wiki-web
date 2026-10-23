import Link from "next/link";
import { categoriesOf, formatDate, getAllWikiPages } from "@/lib/mdx";
import { excerpt } from "@/lib/markdown";

export default async function Home() {
  const pages = await getAllWikiPages();
  const categories = categoriesOf(pages);

  return (
    <main className="wiki-shell">
      <header className="wiki-header">
        <Link href="/" className="wiki-mark">B/15</Link>
        <div className="wiki-brand"><strong>FIELD MANUAL</strong><span>PERSONAL KNOWLEDGE / LOCAL MDX</span></div>
        <div className="wiki-state"><i /> {pages.length} PAGES · READ ONLY</div>
      </header>

      <section className="wiki-hero">
        <div>
          <p className="wiki-kicker">BOOKCHAOWALIT / KNOWLEDGE INDEX</p>
          <h1>Read what the<br /><em>work remembers.</em></h1>
          <p className="wiki-lede">A small, interconnected shelf of notes about code, patterns, and the parts of building that deserve another look.</p>
        </div>
        <div className="manual-slip" aria-label="Local knowledge base"><span>EDITION</span><strong>01</strong><b>LOCAL MDX<br />NO CMS</b></div>
      </section>

      <section className="wiki-index">
        <aside className="topic-index">
          <div className="index-label"><span>CONTENTS</span><span>{String(pages.length).padStart(2, "0")} LEAVES</span></div>
          <h2>Find a thread.</h2>
          <div className="topic-list">
            {categories.map((category, index) => <Link key={category} href={"/wiki?category=" + encodeURIComponent(category)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{category}</strong><em>{pages.filter((page) => page.category === category).length}</em></Link>)}
          </div>
          <Link href="/wiki" className="index-link">Open full index <b>↗</b></Link>
        </aside>

        <div className="page-register">
          <div className="register-heading"><div><span>RECENT LEAVES</span><h2>Pages worth opening.</h2></div><span>LOCAL ARCHIVE</span></div>
          {pages.map((page, index) => (
            <Link href={"/wiki/" + page.slug} className="page-row" key={page.slug}>
              <span className="page-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="page-copy"><span>{page.category}</span><h3>{page.title}</h3><p>{excerpt(page.content, 150)}</p></div>
              <div className="page-meta"><time>{formatDate(page.last_updated, "short")}</time><b>OPEN ↗</b></div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="wiki-footer"><span>BOOKCHAOWALIT / WIKI</span><span>LOCAL MDX CONTENT · NO EDITOR</span></footer>
    </main>
  );
}
