# Blog rebuild implementation plan

> **For agentic workers:** Execute independent bounded tasks in this session and review the result before deployment.

**Goal:** Deliver a clean, modern Korean technical blog on the user's existing GitHub Pages repository.
**Architecture:** Astro static pages share a common shell and typed Markdown collection. A small browser script handles theme, search, and reading interactions; content publication rules are shared by every output.
**Tech Stack:** Astro 7, TypeScript, CSS, remark-math, rehype-katex, Node test runner, GitHub Actions.
**Spec:** docs/superpowers/specs/2026-09-05-blog-design.md

## Global constraints

- White, black and blue visual direction selected by the user.
- Repository jonghwanyoon/jonghwanyoon.github.io; master deploys to GitHub Pages.
- Reset old content; do not invent paper summaries or actual study history.
- Exclude drafts and future dates from all public outputs.
- Existing npm package-lock remains the dependency lock.

## Tasks

- [x] Content foundation: write tests for publication and multilingual search; implement src/lib/content.mjs and content.config.ts. Add a Korean guide post and Markdown templates, document authoring, and generate RSS/search from published content.
- [x] Site design: replace the old shell and CSS with shared accessible header/footer/search dialog, editorial home and archive, category/tag pages, about and 404. Add responsive dark mode.
- [x] Reading experience: render Markdown with TOC, code copy, syntax highlighting, KaTeX math, dates and reading estimates. Verify long content does not overflow the viewport.
- [ ] Validation and release: install dependencies, run content tests, Astro build/type checks, inspect generated links and draft exclusion. Obtain independent code review, fix actionable issues, commit and deploy to GitHub Pages; verify the live site.

## Validation evidence

- 22 Node tests passed (publication, search, reading time, safe authoring, special tag URLs).
- Astro 7.3.1 check: 0 errors, 0 warnings, 0 hints; production build: 9 pages.
- 152 generated internal links/anchors plus canonical, RSS, search and sitemap checked.
- Browser: Korean body search, native dialog, dark mode, mobile TOC, code clipboard success; no viewport overflow at 320/390/768/1440 px.
- npm audit: 0 vulnerabilities after framework and compatible dependency updates.
- Independent review fixes: special tag URL encoding, MDX collision protection, text contrast, keyboard-scrollable tables/math, CI tests before deployment.
