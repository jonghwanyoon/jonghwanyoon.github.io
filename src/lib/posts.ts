import { getCollection, type CollectionEntry } from 'astro:content';
import { isPublished } from './content.mjs';

export const categories = {
  tech: { label: '기술', description: '직접 만들고 문제를 해결하며 배운 것들.' },
  papers: { label: '논문 노트', description: '논문의 질문과 아이디어를 내 언어로 정리합니다.' },
  notes: { label: '학습 기록', description: '새롭게 알게 된 것과 아직 남아 있는 질문들.' },
} as const;

export async function getPosts() {
  const now = new Date();
  const posts = await getCollection('blog', ({ data }) => isPublished(data, now));
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id));
}

export function postUrl(post: Pick<CollectionEntry<'blog'>, 'id'>) {
  return `/blog/${post.id}/`;
}
