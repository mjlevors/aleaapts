# CMS-ready content collections + Astro-native rebuild — design

## Problem

`src/pages/index.astro` still renders the raw scraped WordPress/Enfold-Avia
HTML (`avia-section`, `av-k7xf...`, `flex_column`, `container_wrap`, WP
image-size-variant lists) from the original migration. `BaseLayout.astro`
only loads `global.css`, a small clean reset — none of the Enfold theme's
actual CSS was ever carried into the repo (`public/wp-content/themes` has
zero `.css` files). So the Avia classes covering hero slideshow, about
section, gallery, and office section have no stylesheet backing them at
all; the page renders visually broken (unstyled layout/background) by
construction, not from a config bug.

Separately, all page text (hero captions, about copy, office address/phone,
gallery image list) is hardcoded inline in `index.astro`. There's no
structured place a future git-based CMS (Decap CMS, confirmed as the
target) could point at to let a non-technical editor change this content.

This finishes the previously-approved-but-never-executed
[2026-07-02 Astro-native rebuild plan](2026-07-02-astro-native-rebuild-design.md)
and additionally moves all page content into Astro content collections
under `src/content/`, so:

1. The visual bug is fixed with real components and real CSS.
2. Content lives in a shape a git-based CMS can be pointed at later
   (a separate, later step — no CMS is installed as part of this work).

## Scope

Same visual look/content as the original site (hero slideshow, about
section with CTA and photo gallery, office/contact section with map,
header, footer). No visual redesign. Single page (`/`) — no new routes.
No CMS package, admin UI, or config file is added in this pass.

## Content collections

`src/content/config.ts` defines three collections, all `type: 'data'` (no
markdown body — every field is structured frontmatter/YAML), using the
`image()` schema helper so images stay optimized through `astro:assets`:

```
src/content/
  home/
    index.yaml          -- singleton page data
  heroSlides/
    01-convenient-location.yaml
    02-bedroom-apartments.yaml
    03-affordable-rent.yaml
  gallery/
    01-complex-06.yaml
    02-complex-05.yaml
    03-complex-01.yaml
    04-complex-03.yaml
    05-complex-02.yaml
    06-complex-04.yaml
    07-complex-08.yaml
    08-complex-09.yaml
    09-complex-07.yaml
    10-complex-10.yaml
    11-img-0117.yaml
    12-img-0115.yaml
    13-img-0114.yaml
    14-img-0112.yaml
```

`heroSlides` and `gallery` are folder collections (one file per item) so a
future CMS can add/remove/reorder entries as separate files rather than
editing a JSON/YAML array. `home` is a singleton file collection for
page-level fields that don't repeat.

### `home` schema (`src/content/config.ts`)

```ts
seoTitle: string
seoDescription: string
aboutHeading: string
aboutBody: string
ctaLabel: string
ctaUrl: string
officeHeading: string
officeAddressLines: string[]
officePhone: string
mapQuery: string        // for the Google Maps iframe embed URL
```

Populated from current content:
- `seoTitle`: "Home - Albert Lea Apartments"
- `aboutHeading`: "About A-Lea Apartments"
- `aboutBody`: existing paragraph (Kwik Trip / 3 buildings / 71 units / pet policy)
- `ctaLabel`: "Go to Apartments.com", `ctaUrl`: `https://www.apartments.com/a-lea-apartments-albert-lea-mn/rlv7f10/`
- `officeHeading`: "Office"
- `officeAddressLines`: `["Albert Lea Apartments", "909 Janson Street Albert Lea, Mn 56007", "Manager Phone: 763-843-0629"]`
- `mapQuery`: "909 Janson Street, Albert Lea, MN 56007"

### `heroSlides` schema

```ts
order: number
heading: string
body: string.optional()
image: image()
alt: string
```

Three entries, matching current captions: "CONVENIENT LOCATION" / "On bus
route – Near shopping"; "1 AND 2 BEDROOM APARTMENTS" / "Onsite laundry
rooms, Balcony apts available with a/c"; "AFFORDABLE RENT" / (no body).
Images: `src/assets/images/hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg`
(already present, already sourced from the same complex photos used for
the slideshow).

### `gallery` schema

```ts
order: number
image: image()
alt: string
```

14 entries, one per photo already in `src/assets/images/` (`complex-01`
through `complex-10`, `img-0112`, `img-0114`, `img-0115`, `img-0117`) —
matches exactly what's referenced in the current masonry grid. No manual
WordPress size-variant lists; `astro:assets` generates responsive
sizes/formats at build time from the single source file per photo.

## Components

```
src/
  layouts/
    BaseLayout.astro       -- unchanged mechanism, but title/description
                               can be passed from the home entry
  components/
    SiteHeader.astro        -- unchanged (already clean)
    HeroSlideshow.astro     -- NEW: reads getCollection('heroSlides')
    AboutSection.astro      -- NEW: reads home entry + getCollection('gallery')
    OfficeSection.astro     -- NEW: reads home entry, plain Maps iframe embed
    SiteFooter.astro        -- unchanged (already clean)
  pages/
    index.astro              -- shrinks to composing the components,
                                 reads home entry for SEO title/description,
                                 keeps the JSON-LD schemaGraph construction
```

- `HeroSlideshow.astro`: `<ul>` of slides sorted by `order`, `astro:assets`
  `<Image>` per slide, caption overlay (heading + optional body), inline
  SVG prev/next arrows (already present in the scrape, reused), a
  `<script>` module (vanilla JS) for 6s autoplay + pause-on-hover +
  manual nav — no jQuery, no Avia plugin registry.
- `AboutSection.astro`: heading/body/CTA from the `home` entry, photo grid
  from `getCollection('gallery')` sorted by `order`, rendered as a CSS
  grid (`grid-auto-flow` / spans) reproducing the current visual
  arrangement — no Isotope JS needed since the layout is fixed.
- `OfficeSection.astro`: address lines + phone from `home`, a plain
  `<iframe src="https://www.google.com/maps?q=...&output=embed">` built
  from `mapQuery`, `loading="lazy"`. Drops the hardcoded Google Maps JS
  API key entirely (flagged as a plaintext secret in the prior review).

## Cleanup

- Delete `public/wp-content/`, `public/wp-includes/` in full — nothing
  under `public/` references a WordPress path once `index.astro` no
  longer does.
- Remove the inline `<script>` block in `index.astro` that sets up the
  legacy `av_google_map` JS object (replaced by the plain iframe embed).
- No jQuery, Avia plugin bundles, or icon-font references exist in the
  current component set already built (`SiteHeader`/`SiteFooter`/
  `BaseLayout`) — nothing further to remove there.

## CMS readiness (not installed)

No CMS package, admin route, or config file is added in this pass, per
explicit instruction. The result of this work is that `src/content/`
holds exactly the fields and images a git-based CMS (Decap CMS is the
confirmed target) would edit later: three collections, YAML files, image
fields pointing at `src/assets/images/`. Installing Decap CMS later is a
follow-up step: add `public/admin/index.html` + `public/admin/config.yml`
declaring these same three collections, and set up a GitHub-backend auth
flow — no changes to the content shape should be needed at that point.

## Testing / verification

- `npm run build` succeeds with zero references to `/wp-content/` or
  `/wp-includes/` in `dist/`.
- `npm run dev` — manually verify in a browser: slideshow autoplay +
  manual nav, about section renders with CTA link and gallery grid, map
  iframe loads, header/footer render, overall layout is visually intact
  (not the broken/unstyled state seen before this fix).
- Grep the repo post-rebuild for `wp-content`, `wp-includes`, `avia`,
  `jquery` to confirm zero leftover references outside of git history.
