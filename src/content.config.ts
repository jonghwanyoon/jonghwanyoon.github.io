import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['tech', 'papers', 'notes']),
    tags: z.array(z.string().trim().min(1).transform(value => value.normalize('NFC'))).default([]),
    draft: z.boolean().default(false),
    paper: z.object({
      title: z.string(),
      authors: z.string(),
      year: z.number().int(),
      url: z.url().refine((value) => /^https:\/\//i.test(value), 'HTTPS 링크를 사용해 주세요.'),
    }).optional(),
  }),
});

export const collections = { blog };
