# A-Lea Apartments — Site Notes

## What this is
Single-page marketing site for Albert Lea Apartments (A-Lea Apartments), Albert Lea, MN. Built with Astro (static output), migrated off a WordPress/Avia (Enfold theme) site. Package name is `absent-aurora` (leftover scaffold name — not the real project name, harmless).

## Repo / deploy
- GitHub: `mjlevors/aleaapts` (origin)
- Cloudflare Pages: production tracks `main` → live at `aleaapts.com` / `www.aleaapts.com`. Any other branch → preview only (`*.pages.dev`).
- No `wrangler.toml` or `.github/` workflows — CF Pages build settings (Node version, build command) live in the CF dashboard only, not in-repo.
- Node >= 22.12.0 required (see `package.json` engines).

## Commands
```
npm install
astro dev --background   # always use --background per project convention
astro dev stop / status / logs
npm run build             # -> ./dist/
npm run preview
npm run astro check
```
No test suite or linter configured.

## Architecture
- `src/layouts/BaseLayout.astro` — shared HTML shell (head, header/logo, footer, scroll-to-top, global script/style tags). `postCssHref` prop points at page-specific Avia builder CSS.
- `src/pages/index.astro` — the only page (hero slideshow, about section, masonry gallery, office/contact section).
- `src/content/home/index.json` + `src/content.config.ts` — `home` content collection. Homepage copy (hero slides, about text, CTA, office info) is data-driven from this JSON — **edit content here, not in index.astro**.
- `src/styles/global.css` — global stylesheet, layered on top of legacy Avia CSS.
- `src/assets/images/` — source images (hero-*, complex-*, img-0112 etc., logo.png) used via Astro's image pipeline.
- `public/assets/` — static passthrough assets: `fonts/`, `images/`, `theme/` (legacy Avia/Enfold CSS+JS bundles), `vendor/` (jQuery). Referenced by absolute path from `BaseLayout.astro`/`index.astro`.

## WordPress/Avia legacy (important — don't break)
Migrated by renaming `/wp-content/...` and `/wp-includes/...` paths to `/assets/...` — **not** rewritten to drop Avia/Enfold. Still load-bearing:
- jQuery + jQuery Migrate (`public/assets/vendor/jquery/`)
- Avia framework JS/CSS (`avia-head-scripts.js`, `avia-footer-scripts.js`, `avia-merged-styles.css`, per-page `post-*.css`) — drives slideshow, parallax, etc. via global `avia_framework_globals`.
- Body/element classes (`wp-singular`, `avia_desktop`, `av_header_*`, ...) are retained and load-bearing for legacy CSS/JS — don't rename/remove casually.
New pages/components: prefer plain Astro/CSS, no need to extend Avia markup further, but don't break existing legacy scaffolding on the homepage without a deliberate full-rebuild decision.

## Current content (from src/content/home/index.json)
- Hero slides: "Convenient Location" (on bus route, near shopping), "1 and 2 Bedroom Apartments" (onsite laundry, balcony apts w/ a/c), "Affordable Rent"
- About: 3 buildings near a Kwik Trip, 5 min from anywhere in the city, on-site laundry, off-street parking, recently updated common-area flooring, ~60 of 71 units updated in last 5-7 years, pets allowed (cat/dog, size restrictions, mgmt approval, 1 pet/unit)
- CTA: "Go to Apartments.com" → apartments.com listing
- Office: Albert Lea Apartments, 909 Janson Street, Albert Lea, MN 56007. Manager phone 763-843-0629.

## Recent history (see `git log` for full/current)
- Removed remaining `wp-content`/`wp-includes` paths from public assets
- Linked office address + phone number
- Uninstalled TinaCMS (was tried, then removed)
- Replaced Decap CMS with TinaCMS (then TinaCMS itself removed — site currently has no CMS wired in; content is plain JSON)
- Original Avia layout/styles restored, map fixed, CMS-ready content added

## Misc
- `.wp-html-dump-backup/` — raw WordPress scrape kept locally only, gitignored, reference only.
- `docs/superpowers` and `.superpowers/` exist in the repo (not otherwise documented here — check contents if relevant to a task).
- `AGENTS.md` also exists at repo root alongside `CLAUDE.md`.
