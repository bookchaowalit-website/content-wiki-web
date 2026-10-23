import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, getWikiPageBySlug, getAllWikiPages } from "@/lib/mdx";
import { Markdown } from "@/lib/markdown";

interface PageProps { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const pages = await getAllWikiPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export default async function WikiPageDetail({ params }: PageProps) {
  const { slug } = await params;
  const page = await getWikiPageBySlug(slug);
  if (!page) notFound();
  const availableSlugs = new Set((await getAllWikiPages()).map((item) => item.slug));

  return (
    <main className="wiki-shell detail-shell">
      <header className="wiki-header">
        <Link href="/" className="wiki-mark">B/15</Link>
        <div className="wiki-brand"><strong>FIELD MANUAL</strong><span>OPEN LEAF / LOCAL MDX</span></div>
        <Link href="/wiki" className="wiki-back">← Index</Link>
      </header>
      <article className="wiki-article">
        <header className="article-header">
          <div><p className="wiki-kicker">{page.category} / FIELD NOTE</p><h1>{page.title}</h1><p className="article-date">Updated {formatDate(page.last_updated, "long")}</p></div>
          <div className="article-tags">{page.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </header>
        <div className="article-grid">
          <aside className="article-rail"><span>READING ORDER</span><strong>01</strong><Link href="/wiki">← All pages</Link>{page.related_pages.length > 0 && <><span className="related-label">RELATED</span>{page.related_pages.map((related) => availableSlugs.has(related) ? <Link href={"/wiki/" + related} key={related}>{related} ↗</Link> : <span className="unavailable-related" key={related}>{related} · not on file</span>)}</>}</aside>
          <div className="wiki-body"><Markdown source={page.content} title={page.title} availableSlugs={availableSlugs} /></div>
        </div>
      </article>
      <footer className="wiki-footer"><span>BOOKCHAOWALIT / WIKI LEAF</span><span>STATIC MDX · READ ONLY</span></footer>
    </main>
  );
}
