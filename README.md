# Field Manual wiki

A read-only Next.js wiki over **three local markdown pages** in `content/wiki/*.mdx` (JavaScript basics, React
hooks, design patterns). There is no editor, no CMS and no GitHub-backed editing.

## What it does

- `/` lists the pages, newest first, with a plain-text excerpt and the sections in use.
- `/wiki` is the full index; `?category=` and `?tag=` filter it (the section and tag links on the page use them).
- `/wiki/<slug>` renders a page. The markdown is turned into React elements by a small renderer in
  `lib/markdown.tsx` (headings, paragraphs, lists, fenced code, bold, italic, inline code, links), so HTML in the
  content (for example JSX in code samples) is always shown as text. Only http(s), mailto and site-relative links
  are rendered; links to wiki pages that are not on file are shown as "not on file". Unknown or malformed slugs 404.
- `/api/mcp` answers JSON-RPC `initialize`, `tools/list` and `tools/call` with `get_entries`, `get_entry_by_slug`,
  `search_entries` and `get_categories` over the same files. It echoes the request id; unknown tools, slugs and
  methods return JSON-RPC errors. It runs on Node.js and ships `content/` with the function.
- Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What it does not do

No community editing, PR review, automatic backlinks, full-text search UI or "45+ domains". The `.mdx` files are
read as plain markdown; MDX components are not executed.

## Layout

- `lib/mdx.ts`: reads and validates the content, filtering, sorting, date formatting.
- `lib/markdown.tsx`: the safe markdown renderer and excerpts.
- `app/page.tsx`, `app/wiki/page.tsx`, `app/wiki/[slug]/page.tsx`: pages. `app/api/mcp/route.ts`: MCP endpoint.
- `lib/sentry.ts`, `instrumentation.ts`, `instrumentation-client.ts`: Sentry setup.
- `tests/`: Vitest tests for the content loader, renderer, pages, MCP route and Sentry scrubbing.

## Run

```bash
npm ci
npm run dev        # http://localhost:3000
npm run lint && npm run typecheck && npm test && npm run build
```

CI: shared `platform-ci-workflows` v1.1.1 (lint, typecheck, tests with a 95% line-coverage gate, build, security scan).
