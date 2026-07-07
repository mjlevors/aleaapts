import { defineConfig } from 'tinacms';

const branch = process.env.GITHUB_BRANCH || process.env.HEAD || 'astro-native-rebuild';

export default defineConfig({
	branch,
	// No Tina Cloud project connected yet — running fully locally via `npm run cms`.
	clientId: '',
	token: '',
	build: {
		outputFolder: 'admin',
		publicFolder: 'public',
	},
	media: {
		tina: {
			mediaRoot: '',
			publicFolder: 'public',
		},
	},
	schema: {
		collections: [
			{
				name: 'home',
				label: 'Homepage',
				path: 'src/content/home',
				format: 'json',
				ui: {
					allowedActions: {
						create: false,
						delete: false,
					},
				},
				fields: [
					{
						type: 'object',
						name: 'heroSlides',
						label: 'Hero slideshow slides',
						list: true,
						fields: [
							{ type: 'string', name: 'heading', label: 'Heading' },
							{ type: 'string', name: 'body', label: 'Body (optional)' },
						],
					},
					{ type: 'string', name: 'aboutHeading', label: 'About heading' },
					{ type: 'string', name: 'aboutBody', label: 'About body', ui: { component: 'textarea' } },
					{ type: 'string', name: 'ctaLabel', label: 'Call-to-action button label' },
					{ type: 'string', name: 'ctaUrl', label: 'Call-to-action button URL' },
					{ type: 'string', name: 'officeHeading', label: 'Office heading' },
					{ type: 'string', name: 'officeLines', label: 'Office address/phone lines', list: true },
				],
			},
		],
	},
});
