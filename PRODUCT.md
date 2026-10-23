# Field Manual wiki — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `wiki`) on 2026-10-23.

## What it is

A read-only personal knowledge shelf: three authored markdown pages in `content/wiki/`, rendered by Next.js.

## Who it is for

A portfolio visitor who wants to read short reference notes and see a calm editorial layout.

## What works today

1. Home and `/wiki` list the pages (newest first) with excerpts; `/wiki?category=` and `/wiki?tag=` filter the index.
2. `/wiki/<slug>` renders the page as real headings, lists and code blocks. Content HTML is escaped, unsafe links
   are dropped and links to missing wiki pages are marked "not on file". Unknown slugs return 404.
3. `/api/mcp` answers JSON-RPC with `get_entries`, `get_entry_by_slug`, `search_entries` and `get_categories`
   over the same files, echoing the request id.
4. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No community editing, GitHub-backed editing, PR review, automatic backlinks or "45+ domains" (portfolio card
  claims flagged in the 2026-10 review). There are three pages; several pages they link to do not exist.
- No search box on the site (search exists only as the MCP `search_entries` tool). No accounts or storage.

## Live URL and deploy state

- Live: https://wiki.bookchaowalit.com (HTTP 200 on 2026-10-23). The live detail pages
  (e.g. `/wiki/react-hooks`) still show the raw markdown text and inject the HTML from code samples (4 live
  `<button>` elements on that page), the bug fixed on `main`.
- Last production deploy: 2026-10-23 12:27 (+07), Vercel CLI, commit ddc98a5 (the CVE patch). The Vercel project
  `bookchaowalit-wiki-frontend` has a Git link naming the old repository (`bookchaowalit/bookchaowalit-wiki-frontend`),
  so a push to `main` does not deploy. The L2 commits stay undeployed until the owner reconnects Vercel Git to
  `bookchaowalit-website/content-wiki-web` (owner action D9).
- `NEXT_PUBLIC_SENTRY_DSN` is set on the Vercel project (Sentry project `content-wiki-web`, org `personal-yu0`).

## Boundaries

- Reads only its own `content/` directory; slugs are validated (lowercase kebab-case) before any file read.
- No personal data is collected.
