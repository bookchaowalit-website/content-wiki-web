import Link from "next/link";
import type { ReactNode } from "react";

// A small, safe markdown renderer for the wiki's own content: headings, paragraphs, fenced code,
// ordered and unordered lists, **bold**, *italic*, `code` and [links](url). Everything becomes React
// elements, so text (including HTML inside code samples) is always escaped; there is no raw HTML path.

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "list"; ordered: boolean; items: string[] };

export function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^```\s*([\w-]*)\s*$/);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++; // closing fence (or end of input)
      blocks.push({ type: "code", lang: fence[1], code: code.join("\n") });
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3 | 4, text: heading[2].trim() });
      i++;
      continue;
    }
    const listItem = /^\s*(?:[-*]|\d+\.)\s+/;
    if (listItem.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && listItem.test(lines[i]) && /^\s*\d+\./.test(lines[i]) === ordered) items.push(lines[i++].replace(listItem, "").trim());
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const text: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,4}\s)/.test(lines[i]) && !listItem.test(lines[i])) text.push(lines[i++].trim());
    blocks.push({ type: "paragraph", text: text.join(" ") });
  }
  return blocks;
}

/** Only http(s), mailto and site-relative links are rendered as links. */
export function safeHref(href: string): string | null {
  return /^(https?:\/\/|mailto:|\/(?!\/))/i.test(href) ? href : null;
}

type InlineOptions = { availableSlugs?: ReadonlySet<string> };

export function renderInline(text: string, options: InlineOptions = {}, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|\*([^*\s][^*]*)\*/g;
  let last = 0;
  let n = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${n++}`;
    const [, code, bold, label, href, italic] = match;
    if (code !== undefined) out.push(<code key={key}>{code}</code>);
    else if (bold !== undefined) out.push(<strong key={key}>{renderInline(bold, options, key)}</strong>);
    else if (italic !== undefined) out.push(<em key={key}>{renderInline(italic, options, key)}</em>);
    else out.push(renderLink(label, href, options, key));
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderLink(label: string, href: string, { availableSlugs }: InlineOptions, key: string): ReactNode {
  const wiki = href.match(/^\/wiki\/([a-z0-9-]+)$/);
  if (wiki && availableSlugs && !availableSlugs.has(wiki[1])) {
    return <span className="unavailable-related" key={key}>{`${label} · not on file`}</span>;
  }
  const safe = safeHref(href);
  if (!safe) return <span key={key}>{label}</span>;
  if (safe.startsWith("/")) return <Link href={safe} key={key}>{label}</Link>;
  return <a href={safe} key={key} rel="noopener noreferrer" target="_blank">{label}</a>;
}

/** Renders the page body. A leading "# Title" that repeats the page title is dropped (the page header shows it). */
export function Markdown({ source, title, availableSlugs }: { source: string; title?: string; availableSlugs?: ReadonlySet<string> }) {
  const options = { availableSlugs };
  const blocks = parseBlocks(source);
  if (blocks[0]?.type === "heading" && blocks[0].level === 1 && blocks[0].text === title) blocks.shift();
  return (
    <>
      {blocks.map((block, index) => {
        const key = `b-${index}`;
        switch (block.type) {
          case "heading": {
            const Tag = `h${block.level}` as const;
            return <Tag key={key}>{renderInline(block.text, options, key)}</Tag>;
          }
          case "code":
            return <pre key={key} tabIndex={0}><code className={block.lang ? `language-${block.lang}` : undefined}>{block.code}</code></pre>;
          case "list": {
            const items = block.items.map((item, j) => <li key={j}>{renderInline(item, options, `${key}-${j}`)}</li>);
            return block.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>;
          }
          default:
            return <p key={key}>{renderInline(block.text, options, key)}</p>;
        }
      })}
    </>
  );
}

/** Plain-text excerpt: the first paragraph with inline markup removed. */
export function excerpt(markdown: string, max: number): string {
  const first = parseBlocks(markdown).find((block) => block.type === "paragraph");
  if (!first || first.type !== "paragraph") return "A page in the local knowledge archive.";
  const plain = first.text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "");
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}
