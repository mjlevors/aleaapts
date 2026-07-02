# Astro-native rebuild — design

## Problem

The site was seeded from a scraped WordPress export (Enfold/Avia theme). The
Astro pages render mostly by reusing the raw scraped HTML: Avia builder
class soup, WordPress asset paths (`/wp-content/...`, `/wp-includes/...`),
jQuery, the Avia plugin JS framework, an icon font, and a hardcoded Google
Maps JavaScript API key. None of this is Astro-native, and most of it is
dead weight once the interactive behaviors it once powered (Isotope
masonry, Avia slideshow plugin, WP cookie-consent gating) are rebuilt from
scratch.

Goal: rebuild the current single homepage as real Astro components with
clean HTML/CSS/vanilla JS, preserving the current visual design and
content, with zero leftover WordPress/Avia code or asset paths.

## Scope

Same visual look, same content (hero slideshow, about section with CTA and
photo gallery, office/contact section, header, footer). No visual redesign.
Single page (`/`) — no new routes.

## Architecture

```
src/
  layouts/
    BaseLayout.astro       -- <head>, meta/canonical/JSON-LD, fonts, gtag.js, <slot/>
  components/
    SiteHeader.astro        -- centered logo
    HeroSlideshow.astro     -- 3-slide autoplay slideshow, vanilla JS
    AboutSection.astro      -- heading, copy, CTA button, photo gallery grid
    OfficeSection.astro     -- address/phone + Google Maps iframe embed
    SiteFooter.astro        -- copyright line
  pages/
    index.astro              -- composes components, holds page JSON-LD data
  styles/
    global.css               -- reset + design tokens (colors/spacing/type)
  assets/
    images/                  -- source photos (logo, hero/gallery shots)
```

### BaseLayout.astro

- `<head>`: charset, viewport, robots meta, title, canonical, OpenGraph
  tags, Twitter card meta, JSON-LD `schemaGraph` prop (unchanged mechanism),
  Google Fonts `<link>` for Open Sans (loaded directly, no consent gate),
  `gtag.js` loaded directly (own analytics, not WP-specific).
- No jQuery, no Avia head/footer script bundles, no WP block-library
  inline CSS, no `html`/`body` Avia class soup — replaced with a small set
  of real classes/ids used by the layout and components.
- `<slot />` for page content; shared header/footer rendered here.

### HeroSlideshow.astro

- Markup: `<ul>` of slides, each an `<img>` (via `astro:assets`) + caption
  overlay (title + optional subtitle).
- Prev/next controls: real inline SVG arrows (already present in the
  current scrape, kept, no icon-font dependency).
- Behavior: a `<script>` module (vanilla JS, no jQuery, no Avia plugin
  registry) handling autoplay (6s interval, matching current
  `data-slideshow-options`), pause on hover, and manual prev/next.
- Accessibility: `aria-live`, visible focus states on controls, alt text
  per slide image.

### AboutSection.astro

- Heading + descriptive paragraph (existing copy, unchanged).
- CTA button linking to Apartments.com (`target="_blank" rel="noopener
  noreferrer"`), plain styled `<a>`, no icon-font button classes.
- Photo gallery: CSS grid reproducing the current masonry visual
  arrangement. Since the layout is fixed (not user-filterable), no JS
  library (Isotope) is needed — CSS grid with `grid-auto-flow` / explicit
  spans replicates it statically.
- All gallery images rendered via `astro:assets` `<Image>`, one source
  file per photo (no manual WordPress size-variant lists).

### OfficeSection.astro

- Address, phone (existing text content, unchanged).
- Map: Google Maps `<iframe src="https://www.google.com/maps?q=...&output=embed">`,
  `loading="lazy"`, no API key, no JS SDK.
- Drops the hardcoded Google Maps JavaScript API key entirely (was
  flagged as a plaintext secret in the previous review).

### SiteHeader.astro / SiteFooter.astro

- Header: logo image (`astro:assets`, eager-loaded, since it's above the
  fold) linking to `/`.
- Footer: copyright line, current year.

## Images

All photos move from `public/wp-content/uploads/...` into
`src/assets/images/` and are imported + rendered through `astro:assets`
(`<Image>`/`<Picture>`), which generates responsive sizes and modern
formats (webp/avif) at build time. This replaces the ~90 hand-picked
WordPress size variants with one source file per photo. Once nothing
references them, `public/wp-content/` and `public/wp-includes/` are
deleted in full — nothing under `public/` will reference a WordPress path
after this change.

## Fonts, analytics, consent

- Open Sans: plain `<link>` to Google Fonts in `BaseLayout.astro`. No
  cookie-consent gating script (the WP consent plugin that used to gate
  this is gone; not being recreated per product decision).
- Google Analytics (`gtag.js`): loaded directly in `<head>`, unchanged
  tracking ID. This is the site owner's own analytics, not
  WordPress-specific, so it's kept as-is.

## What gets deleted

- `public/wp-content/`, `public/wp-includes/` (entirely, once no
  references remain).
- All Avia/WP CSS classes and `html`/`body` class soup.
- jQuery (`jquery.min.js`, `jquery-migrate.min.js`).
- Icon fonts (`entypo-fontello`, `entypo-fontello-enfold`) — the
  slideshow arrows and scroll-to-top control already render via inline
  SVG in the current markup, so the font-face rules were dead weight.
- The hardcoded Google Maps JavaScript API key.
- The WP cookie-consent gating script for font loading.
- `avia-head-scripts.js`, `avia-footer-scripts.js` (Avia plugin bootstrap
  + bundled Waypoints.js — unneeded once the slideshow/gallery are
  rebuilt without the Avia plugin framework).
- `post-20.css` (trivial builder padding tweaks — reproduced as real CSS
  rules in component `<style>` blocks or `global.css`).

## Testing / verification

- `npm run build` succeeds with zero references to `/wp-content/` or
  `/wp-includes/` in the built output (`dist/`).
- `npm run dev` — manually verify in a browser: slideshow autoplay +
  manual nav, about section CTA link, gallery images render at
  responsive sizes, map iframe loads, header/footer render, page matches
  current visual layout.
- Grep the repo post-rebuild for `wp-content`, `wp-includes`, `avia`,
  `jquery` to confirm zero leftover references outside of git history.
