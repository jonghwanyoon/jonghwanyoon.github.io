import type { APIRoute } from 'astro';
import { getPosts, postUrl } from '../lib/posts';

export const GET: APIRoute = async () => {
  const posts = (await getPosts()).map((post) => ({
    id: post.id,
    url: postUrl(post),
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags,
    category: post.data.category,
    body: post.body ?? '',
  }));
  return new Response(JSON.stringify({ posts }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
