import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Only load publishable post entries, not working notes stored alongside posts.
	loader: glob({ base: './src/content/blog', pattern: '**/{index,ko}.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			// Extended fields for better management
			tags: z.array(z.string()).default([]),
			draft: z.boolean().default(false),
			category: z.string().optional(),
			series: z.boolean().default(false),
		}),
});

export const collections = { blog };
