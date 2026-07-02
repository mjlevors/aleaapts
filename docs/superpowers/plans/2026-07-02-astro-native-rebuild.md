# Astro-Native Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scraped WordPress/Avia homepage markup with real Astro components, `astro:assets`-managed images, and clean CSS/JS — zero leftover WordPress code or asset paths anywhere in `src/` or `public/`.

**Architecture:** Five focused Astro components (`SiteHeader`, `HeroSlideshow`, `AboutSection`, `OfficeSection`, `SiteFooter`) composed by a slimmed `BaseLayout` and `index.astro`. Photos move from `public/wp-content/uploads/` into `src/assets/images/` and render through `astro:assets`. No jQuery, no Avia JS/CSS, no icon fonts, no hardcoded API keys.

**Tech Stack:** Astro 7 (static output), `astro:assets` (built-in Sharp image service), vanilla JS (no new dependencies).

## Global Constraints

- Node `>=22.12.0` (per `package.json` engines) — do not add dependencies that require a different floor.
- No new npm dependencies — everything needed (`astro:assets`, vanilla JS) ships with Astro 7.
- Same visual look as the current site (colors, layout, copy) — no visual redesign. Design tokens below are extracted directly from the current theme's merged CSS, not guessed.
- Single page (`/`) only — no new routes.
- Map: Google Maps `<iframe>` embed, no JavaScript SDK, no API key anywhere in the code.
- Fonts: Open Sans loaded directly via `<link>`, no cookie-consent gating script.
- After the final task, grepping `src/` and `public/` for `wp-content`, `wp-includes`, `avia`, `jquery`, `enfold`, `isotope`, `AIzaSy` must return zero matches.

---

## Design tokens (extracted from the current Avia merged CSS)

These are real values pulled from `public/wp-content/uploads/dynamic_avia/avia-merged-styles-*.css` (`:root` custom properties and base rules), not placeholders:

```css
--color-bg: #ffffff;
--color-text: #7c6853;
--color-heading: #382410;
--color-accent: #c3512f;
--color-accent-dark: #883d1f;
--color-border: #ebe8e2;
--color-header-bg: #ffffff;
--color-header-text: #000000;
--color-footer-bg: #2b2822;
--color-footer-text: #988f81;
--color-footer-heading: #dccfc5;
--font-family: 'Open Sans', Helvetica, Arial, sans-serif;
--container-max-width: 1010px;
--container-padding: 50px;
```

Breakpoints: `767px` (mobile), `989px` (tablet) — same as the current theme's media queries.

---

### Task 1: Migrate photo assets into `src/assets/images/`

**Files:**
- Create: `src/assets/images/logo.png`
- Create: `src/assets/images/hero-1.jpg`, `src/assets/images/hero-2.jpg`, `src/assets/images/hero-3.jpg`
- Create: `src/assets/images/complex-01.jpg` through `src/assets/images/complex-10.jpg` (10 files)
- Create: `src/assets/images/img-0112.jpg`, `src/assets/images/img-0114.jpg`, `src/assets/images/img-0115.jpg`, `src/assets/images/img-0117.jpg`

**Interfaces:**
- Produces: a stable set of source image files under `src/assets/images/` that later tasks import via relative `import` statements (e.g. `import logo from '../assets/images/logo.png'`).

- [ ] **Step 1: Create the directory and copy files with clean names**

Run:
```bash
mkdir -p src/assets/images
cp public/wp-content/uploads/2020/03/logo.png src/assets/images/logo.png
cp public/wp-content/uploads/2024/12/Albert-Lea-Apartments-Complex-05-1500x630.jpg src/assets/images/hero-1.jpg
cp public/wp-content/uploads/2024/12/Albert-Lea-Apartments-Complex-01-1500x630.jpg src/assets/images/hero-2.jpg
cp public/wp-content/uploads/2024/12/Albert-Lea-Apartments-Complex-03-1500x630.jpg src/assets/images/hero-3.jpg
for n in 01 02 03 04 05 06 07 08 09 10; do
  cp "public/wp-content/uploads/2024/12/Albert-Lea-Apartments-Complex-$n.jpg" "src/assets/images/complex-$n.jpg"
done
cp public/wp-content/uploads/2020/03/IMG_0112.jpg src/assets/images/img-0112.jpg
cp public/wp-content/uploads/2020/03/IMG_0114.jpg src/assets/images/img-0114.jpg
cp public/wp-content/uploads/2020/03/IMG_0115.jpg src/assets/images/img-0115.jpg
cp public/wp-content/uploads/2020/03/IMG_0117.jpg src/assets/images/img-0117.jpg
```

- [ ] **Step 2: Verify all 18 files are present**

Run: `ls src/assets/images | wc -l`
Expected: `18`

- [ ] **Step 3: Commit**

```bash
git add src/assets/images
git commit -m "Add source photo assets for astro:assets pipeline"
```

---

### Task 2: Create `src/styles/global.css` and rewrite `BaseLayout.astro`

**Files:**
- Create: `src/styles/global.css`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`
- Modify: `src/layouts/BaseLayout.astro` (full rewrite)

**Interfaces:**
- Consumes: `src/assets/images/logo.png` (from Task 1)
- Produces: `BaseLayout` props unchanged from current usage — `title: string`, `canonicalPath?: string`, `description?: string`, `schemaGraph?: string` (the `postCssHref` prop is removed, it's no longer used by anything). `SiteHeader` and `SiteFooter` take no props.

- [ ] **Step 1: Write `src/styles/global.css`**

```css
:root {
	--color-bg: #ffffff;
	--color-text: #7c6853;
	--color-heading: #382410;
	--color-accent: #c3512f;
	--color-accent-dark: #883d1f;
	--color-border: #ebe8e2;
	--color-header-bg: #ffffff;
	--color-header-text: #000000;
	--color-footer-bg: #2b2822;
	--color-footer-text: #988f81;
	--color-footer-heading: #dccfc5;
	--font-family: 'Open Sans', Helvetica, Arial, sans-serif;
	--container-max-width: 1010px;
	--container-padding: 50px;
}

*, *::before, *::after {
	box-sizing: border-box;
}

html {
	scroll-behavior: smooth;
}

body {
	margin: 0;
	font-family: var(--font-family);
	font-size: 16px;
	line-height: 1.65;
	color: var(--color-text);
	background: var(--color-bg);
}

h1, h2, h3, h4, h5, h6 {
	font-family: var(--font-family);
	color: var(--color-heading);
	font-weight: 600;
	margin: 0 0 0.5em;
}

h1 { font-size: 34px; }
h2 { font-size: 28px; }
h3 { font-size: 20px; }

p {
	margin: 0 0 1em;
}

a {
	color: var(--color-accent);
}

img {
	max-width: 100%;
	height: auto;
	display: block;
}

.container {
	width: 100%;
	max-width: var(--container-max-width);
	margin: 0 auto;
	padding: 0 var(--container-padding);
}

.section {
	padding-top: 70px;
	padding-bottom: 70px;
}

.section--flush {
	padding-top: 0;
	padding-bottom: 20px;
}

@media (max-width: 767px) {
	.container {
		padding: 0 20px;
	}
	.section {
		padding-top: 40px;
		padding-bottom: 40px;
	}
}

.button {
	display: inline-block;
	border-radius: 3px;
	padding: 16px 32px;
	font-size: 14px;
	font-weight: 600;
	text-decoration: none;
	text-align: center;
	background-color: var(--color-accent);
	color: #ffffff;
	border: 1px solid var(--color-accent-dark);
	transition: opacity 0.2s ease-in-out;
}

.button:hover {
	opacity: 0.85;
}

.visually-hidden {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}
```

- [ ] **Step 2: Write `src/components/SiteHeader.astro`**

```astro
---
import { Image } from 'astro:assets';
import logo from '../assets/images/logo.png';
---

<header class="site-header">
	<div class="container site-header__inner">
		<a href="/" aria-label="Albert Lea Apartments home">
			<Image src={logo} alt="Albert Lea Apartments" width={150} height={50} loading="eager" />
		</a>
	</div>
</header>

<style>
	.site-header {
		background: var(--color-header-bg);
		color: var(--color-header-text);
	}

	.site-header__inner {
		display: flex;
		justify-content: center;
		align-items: center;
		padding-top: 20px;
		padding-bottom: 20px;
	}
</style>
```

- [ ] **Step 3: Write `src/components/SiteFooter.astro`**

```astro
---
const year = new Date().getFullYear();
---

<footer class="site-footer">
	<div class="container">
		<span>© Copyright {year} - Albert Lea Apartments. All rights reserved.</span>
	</div>
</footer>

<style>
	.site-footer {
		background: var(--color-footer-bg);
		color: var(--color-footer-text);
		font-size: 12px;
		padding-top: 15px;
		padding-bottom: 15px;
	}
</style>
```

- [ ] **Step 4: Rewrite `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';

interface Props {
	title: string;
	canonicalPath?: string;
	description?: string;
	/** Raw JSON string for the schema.org graph, page-specific. */
	schemaGraph?: string;
}

const {
	title,
	canonicalPath = '/',
	description,
	schemaGraph,
} = Astro.props;

const canonicalURL = new URL(canonicalPath, Astro.site);
---

<!DOCTYPE html>
<html lang="en-US">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

	<title>{title}</title>
	<link rel="canonical" href={canonicalURL} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:url" content={canonicalURL} />
	<meta property="og:site_name" content="Albert Lea Apartments" />
	{description && <meta name="description" content={description} />}
	<meta name="twitter:card" content="summary_large_image" />
	{schemaGraph && (
		<script type="application/ld+json" set:html={schemaGraph} />
	)}

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600&display=swap" rel="stylesheet" />

	<script type="text/javascript" async src="https://www.googletagmanager.com/gtag/js?id=G-ZYVCXMV4ZN"></script>
	<script type="text/javascript">
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());
		gtag('config', 'G-ZYVCXMV4ZN');
	</script>
</head>
<body>
	<SiteHeader />
	<main>
		<slot />
	</main>
	<SiteFooter />
</body>
</html>
```

- [ ] **Step 5: Verify the build succeeds**

Run: `npm run build`
Expected: `1 page(s) built` with no errors (the page will look broken/incomplete since `index.astro` still references the old layout content — that's fixed in later tasks. This step only confirms the layout itself compiles.)

Note: `index.astro` will fail to build at this point because it still passes old-style markup into the new `<slot />`. That's expected — proceed directly to Task 3 before attempting a full build. If you need an intermediate checkpoint, temporarily replace the contents of `src/pages/index.astro`'s `<BaseLayout>` body with a single `<p>placeholder</p>`, run the build, confirm success, then continue to Task 3 (the placeholder gets replaced there).

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css src/components/SiteHeader.astro src/components/SiteFooter.astro src/layouts/BaseLayout.astro
git commit -m "Rebuild BaseLayout with clean head, own CSS, no WP/Avia scripts"
```

---

### Task 3: Create `HeroSlideshow.astro`

**Files:**
- Create: `src/components/HeroSlideshow.astro`

**Interfaces:**
- Consumes: `src/assets/images/hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg` (from Task 1)
- Produces: `<HeroSlideshow />` component with no props, self-contained autoplay behavior.

- [ ] **Step 1: Write `src/components/HeroSlideshow.astro`**

```astro
---
import { Image } from 'astro:assets';
import hero1 from '../assets/images/hero-1.jpg';
import hero2 from '../assets/images/hero-2.jpg';
import hero3 from '../assets/images/hero-3.jpg';

const slides = [
	{
		image: hero1,
		alt: 'Exterior view of Albert Lea Apartments near local shopping',
		title: 'CONVENIENT LOCATION',
		subtitle: 'On bus route – Near shopping',
	},
	{
		image: hero2,
		alt: 'Albert Lea Apartments building with balcony units',
		title: '1 AND 2 BEDROOM APARTMENTS',
		subtitle: 'Onsite laundry rooms. Balcony apts available with a/c',
	},
	{
		image: hero3,
		alt: 'Albert Lea Apartments building exterior',
		title: 'AFFORDABLE RENT',
		subtitle: null,
	},
];
---

<section class="hero" aria-roledescription="carousel" aria-label="Albert Lea Apartments highlights">
	<ul class="hero__slides">
		{slides.map((slide, i) => (
			<li class="hero__slide" data-index={i} aria-hidden={i === 0 ? 'false' : 'true'}>
				<Image
					src={slide.image}
					alt={slide.alt}
					width={1500}
					height={630}
					loading={i === 0 ? 'eager' : 'lazy'}
					fetchpriority={i === 0 ? 'high' : 'auto'}
				/>
				<div class="hero__caption">
					<h2>{slide.title}</h2>
					{slide.subtitle && <p>{slide.subtitle}</p>}
				</div>
			</li>
		))}
	</ul>
	<div class="hero__controls">
		<button type="button" class="hero__prev" aria-label="Previous slide">
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="32" viewBox="0 0 15 32" aria-hidden="true">
				<path d="M14.464 27.84q0.832 0.832 0 1.536-0.832 0.832-1.536 0l-12.544-12.608q-0.768-0.768 0-1.6l12.544-12.608q0.704-0.832 1.536 0 0.832 0.704 0 1.536l-11.456 11.904z"></path>
			</svg>
		</button>
		<button type="button" class="hero__next" aria-label="Next slide">
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="32" viewBox="0 0 15 32" aria-hidden="true">
				<path d="M0.416 27.84l11.456-11.84-11.456-11.904q-0.832-0.832 0-1.536 0.832-0.832 1.536 0l12.544 12.608q0.768 0.832 0 1.6l-12.544 12.608q-0.704 0.832-1.536 0-0.832-0.704 0-1.536z"></path>
			</svg>
		</button>
	</div>
</section>

<style>
	.hero {
		position: relative;
		overflow: hidden;
	}

	.hero__slides {
		position: relative;
		list-style: none;
		margin: 0;
		padding: 0;
		aspect-ratio: 1500 / 630;
	}

	.hero__slide {
		position: absolute;
		inset: 0;
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.6s ease-in-out;
	}

	.hero__slide.is-active {
		opacity: 1;
		visibility: visible;
	}

	.hero__slide :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hero__caption {
		position: absolute;
		left: 5%;
		bottom: 10%;
		color: #ffffff;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
		max-width: 90%;
	}

	.hero__caption h2 {
		color: #ffffff;
		font-size: 28px;
		margin-bottom: 0.25em;
	}

	.hero__caption p {
		margin: 0;
		font-size: 16px;
	}

	.hero__controls {
		position: absolute;
		inset: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		pointer-events: none;
		padding: 0 16px;
	}

	.hero__prev,
	.hero__next {
		pointer-events: auto;
		background: rgba(0, 0, 0, 0.3);
		border: none;
		color: #ffffff;
		padding: 10px;
		cursor: pointer;
		border-radius: 3px;
	}

	.hero__prev:hover,
	.hero__next:hover {
		background: rgba(0, 0, 0, 0.5);
	}

	@media (max-width: 767px) {
		.hero__caption h2 {
			font-size: 18px;
		}
	}
</style>

<script>
	const hero = document.querySelector('.hero');
	if (hero) {
		const slides = Array.from(hero.querySelectorAll<HTMLLIElement>('.hero__slide'));
		const prevButton = hero.querySelector('.hero__prev');
		const nextButton = hero.querySelector('.hero__next');
		let current = 0;
		let timer: ReturnType<typeof setInterval> | undefined;

		function show(index: number) {
			slides[current].classList.remove('is-active');
			slides[current].setAttribute('aria-hidden', 'true');
			current = (index + slides.length) % slides.length;
			slides[current].classList.add('is-active');
			slides[current].setAttribute('aria-hidden', 'false');
		}

		function next() {
			show(current + 1);
		}

		function prev() {
			show(current - 1);
		}

		function startAutoplay() {
			timer = setInterval(next, 6000);
		}

		function stopAutoplay() {
			if (timer) clearInterval(timer);
		}

		slides[0].classList.add('is-active');
		slides[0].setAttribute('aria-hidden', 'false');

		nextButton?.addEventListener('click', () => {
			next();
			stopAutoplay();
			startAutoplay();
		});

		prevButton?.addEventListener('click', () => {
			prev();
			stopAutoplay();
			startAutoplay();
		});

		hero.addEventListener('mouseenter', stopAutoplay);
		hero.addEventListener('mouseleave', startAutoplay);

		startAutoplay();
	}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HeroSlideshow.astro
git commit -m "Add HeroSlideshow component with vanilla-JS autoplay"
```

---

### Task 4: Create `AboutSection.astro` (copy, CTA, photo gallery)

**Files:**
- Create: `src/components/AboutSection.astro`

**Interfaces:**
- Consumes: `src/assets/images/complex-01.jpg` .. `complex-10.jpg`, `img-0112.jpg`, `img-0114.jpg`, `img-0115.jpg`, `img-0117.jpg` (from Task 1)
- Produces: `<AboutSection />` component with no props.

- [ ] **Step 1: Write `src/components/AboutSection.astro`**

```astro
---
import { Image } from 'astro:assets';
import complex01 from '../assets/images/complex-01.jpg';
import complex02 from '../assets/images/complex-02.jpg';
import complex03 from '../assets/images/complex-03.jpg';
import complex04 from '../assets/images/complex-04.jpg';
import complex05 from '../assets/images/complex-05.jpg';
import complex06 from '../assets/images/complex-06.jpg';
import complex07 from '../assets/images/complex-07.jpg';
import complex08 from '../assets/images/complex-08.jpg';
import complex09 from '../assets/images/complex-09.jpg';
import complex10 from '../assets/images/complex-10.jpg';
import img0112 from '../assets/images/img-0112.jpg';
import img0114 from '../assets/images/img-0114.jpg';
import img0115 from '../assets/images/img-0115.jpg';
import img0117 from '../assets/images/img-0117.jpg';

const gallery = [
	{ image: complex06, alt: 'Albert Lea Apartments building exterior, view 6', orientation: 'landscape' },
	{ image: complex05, alt: 'Albert Lea Apartments building exterior, view 5', orientation: 'landscape' },
	{ image: complex01, alt: 'Albert Lea Apartments building exterior, view 1', orientation: 'landscape' },
	{ image: complex03, alt: 'Albert Lea Apartments building exterior, view 3', orientation: 'landscape' },
	{ image: complex02, alt: 'Albert Lea Apartments building exterior, view 2', orientation: 'landscape' },
	{ image: complex04, alt: 'Albert Lea Apartments building exterior, view 4', orientation: 'portrait' },
	{ image: complex08, alt: 'Albert Lea Apartments building exterior, view 8', orientation: 'portrait' },
	{ image: complex09, alt: 'Albert Lea Apartments building exterior, view 9', orientation: 'portrait' },
	{ image: complex07, alt: 'Albert Lea Apartments building exterior, view 7', orientation: 'portrait' },
	{ image: complex10, alt: 'Albert Lea Apartments building exterior, view 10', orientation: 'portrait' },
	{ image: img0117, alt: 'Albert Lea Apartments common area photo 1', orientation: 'portrait' },
	{ image: img0115, alt: 'Albert Lea Apartments common area photo 2', orientation: 'portrait' },
	{ image: img0114, alt: 'Albert Lea Apartments common area photo 3', orientation: 'landscape' },
	{ image: img0112, alt: 'Albert Lea Apartments common area photo 4', orientation: 'landscape' },
];
---

<section class="section about" id="about">
	<div class="container about__grid">
		<div class="about__copy">
			<h2>About A-Lea Apartments</h2>
			<p>
				Like Kwik Trip? The 3 buildings that make up the A Lea Apartments have a
				neighborhood Kwik Trip surrounded. The complex is also just a 5 minute drive
				from anywhere you may need to be in the city due to it's central location.
				On-site laundry and off-street parking. We just updated the flooring in our
				common areas and hallways. Most units, roughly 60 of the 71 units, have been
				updated within the last 5-7 years. We do allow tenants to have a cat or a dog
				with management approval, but with restrictions, with the size of the dog
				being one example. Only 1 pet/unit.
			</p>
			<a
				class="button"
				href="https://www.apartments.com/a-lea-apartments-albert-lea-mn/rlv7f10/"
				target="_blank"
				rel="noopener noreferrer"
			>
				Go to Apartments.com
			</a>
		</div>

		<div class="about__gallery">
			{gallery.map((item) => (
				<div class={`gallery-item gallery-item--${item.orientation}`}>
					<Image src={item.image} alt={item.alt} width={800} loading="lazy" />
				</div>
			))}
		</div>
	</div>
</section>

<style>
	.about__grid {
		display: grid;
		gap: 40px;
	}

	.about__gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		grid-auto-flow: dense;
		gap: 4px;
	}

	.gallery-item {
		overflow: hidden;
	}

	.gallery-item :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.gallery-item--landscape {
		aspect-ratio: 4 / 3;
	}

	.gallery-item--portrait {
		aspect-ratio: 3 / 4;
		grid-row: span 2;
	}

	@media (min-width: 768px) {
		.about__grid {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AboutSection.astro
git commit -m "Add AboutSection component with CSS-grid photo gallery"
```

---

### Task 5: Create `OfficeSection.astro` (address, phone, map iframe)

**Files:**
- Create: `src/components/OfficeSection.astro`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `<OfficeSection />` component with no props.

- [ ] **Step 1: Write `src/components/OfficeSection.astro`**

```astro
<section class="section office">
	<div class="container office__grid">
		<div>
			<h2>Office</h2>
			<p>Albert Lea Apartments</p>
			<p>909 Janson Street<br />Albert Lea, MN 56007</p>
			<p>Manager Phone: <a href="tel:+17638430629">763-843-0629</a></p>
		</div>
		<div class="office__map">
			<iframe
				src="https://www.google.com/maps?q=909+Janson+Street,+Albert+Lea,+MN+56007&output=embed"
				title="Map showing the location of Albert Lea Apartments"
				loading="lazy"
				referrerpolicy="no-referrer-when-downgrade"
			></iframe>
		</div>
	</div>
</section>

<style>
	.office__grid {
		display: grid;
		gap: 40px;
	}

	.office__map {
		height: 400px;
	}

	.office__map iframe {
		width: 100%;
		height: 100%;
		border: 0;
	}

	@media (min-width: 768px) {
		.office__grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
```

- [ ] **Step 2: Verify no API key or Maps JS SDK reference exists in the new file**

Run: `grep -c "AIzaSy\|maps.googleapis.com/maps/api/js" src/components/OfficeSection.astro`
Expected: `0`

- [ ] **Step 3: Commit**

```bash
git add src/components/OfficeSection.astro
git commit -m "Add OfficeSection component with iframe map embed, no API key"
```

---

### Task 6: Rewrite `src/pages/index.astro` to compose the new components

**Files:**
- Modify: `src/pages/index.astro` (full rewrite)

**Interfaces:**
- Consumes: `BaseLayout` (Task 2), `HeroSlideshow` (Task 3), `AboutSection` (Task 4), `OfficeSection` (Task 5).

- [ ] **Step 1: Rewrite `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroSlideshow from '../components/HeroSlideshow.astro';
import AboutSection from '../components/AboutSection.astro';
import OfficeSection from '../components/OfficeSection.astro';

const schemaGraph = JSON.stringify({
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebPage",
			"@id": "/",
			"url": "/",
			"name": "Home - Albert Lea Apartments",
			"isPartOf": { "@id": "https://www.aleaapts.com/#website" },
			"datePublished": "2020-03-18T14:23:11+00:00",
			"dateModified": "2024-12-30T19:48:02+00:00",
			"breadcrumb": { "@id": "/#breadcrumb" },
			"inLanguage": "en-US",
			"potentialAction": [{ "@type": "ReadAction", "target": ["/"] }]
		},
		{
			"@type": "BreadcrumbList",
			"@id": "/#breadcrumb",
			"itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home" }]
		},
		{
			"@type": "WebSite",
			"@id": "https://www.aleaapts.com/#website",
			"url": "https://www.aleaapts.com/",
			"name": "Albert Lea Apartments",
			"description": "Albert Lea Apartments",
			"potentialAction": [{
				"@type": "SearchAction",
				"target": { "@type": "EntryPoint", "urlTemplate": "https://www.aleaapts.com/?s={search_term_string}" },
				"query-input": { "@type": "PropertyValueSpecification", "valueRequired": true, "valueName": "search_term_string" }
			}],
			"inLanguage": "en-US"
		}
	]
});
---

<BaseLayout title="Home - Albert Lea Apartments" canonicalPath="/" schemaGraph={schemaGraph}>
	<HeroSlideshow />
	<AboutSection />
	<OfficeSection />
</BaseLayout>
```

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: `1 page(s) built in ...` with no errors.

- [ ] **Step 3: Start the dev server and manually verify in a browser**

Run: `astro dev --background`

Open `http://localhost:4321/` and confirm:
- Hero slideshow autoplays through 3 slides and crossfades every ~6s
- Prev/next buttons work and pause/resume autoplay
- About section renders copy, CTA button (opens Apartments.com in a new tab), and photo gallery
- Office section shows address, clickable phone link, and an embedded map
- Header logo and footer copyright render

Then stop it: `astro dev stop`

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Compose homepage from HeroSlideshow, AboutSection, OfficeSection"
```

---

### Task 7: Delete all WordPress assets and verify zero leftover references

**Files:**
- Delete: `public/wp-content/` (entire directory)
- Delete: `public/wp-includes/` (entire directory)

**Interfaces:**
- Consumes: nothing (this task only removes files once nothing in `src/` references them, which Task 6 guarantees).

- [ ] **Step 1: Confirm nothing under `src/` still references a WordPress path**

Run: `grep -rn "wp-content\|wp-includes" src/`
Expected: no output (empty)

- [ ] **Step 2: Delete the WordPress asset directories**

```bash
rm -rf public/wp-content public/wp-includes
```

- [ ] **Step 3: Run the build**

Run: `npm run build`
Expected: `1 page(s) built in ...` with no errors, no 404s reported.

- [ ] **Step 4: Grep the whole repo for leftover WordPress/Avia markers**

Run: `grep -rn "wp-content\|wp-includes\|avia\|jquery\|enfold\|isotope\|AIzaSy" src/ public/ --include="*.astro" --include="*.css" --include="*.js"`
Expected: no output (empty)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove all WordPress/Avia assets from public/"
```

---

### Task 8: Final verification and push

**Files:** none (verification only)

- [ ] **Step 1: Full clean build**

Run: `rm -rf dist && npm run build`
Expected: `1 page(s) built in ...`, no errors.

- [ ] **Step 2: Confirm `dist/` output has no WordPress references**

Run: `grep -rln "wp-content\|wp-includes\|jquery\|avia" dist/ || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 3: Push to GitHub**

```bash
git push
```

- [ ] **Step 4: Report to the user**

Summarize: page composed of 5 new components, images migrated to `astro:assets`, all WP/Avia code and assets removed, hardcoded Maps API key gone, build clean, pushed to `main`.
