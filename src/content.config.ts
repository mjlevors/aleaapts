import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const home = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/home' }),
	schema: z.object({
		heroSlides: z.array(
			z.object({
				heading: z.string(),
				body: z.string().optional(),
			})
		),
		aboutHeading: z.string(),
		aboutBody: z.string(),
		ctaLabel: z.string(),
		ctaUrl: z.string(),
		officeHeading: z.string(),
		officeLines: z.array(z.string()),
	}),
});

export const collections = { home };
