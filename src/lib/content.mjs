/** @param {{ draft?: boolean, pubDate: Date | string | number }} data
 * @param {Date} [now]
 */
export function isPublished(data, now = new Date()) {
  const publishedAt = new Date(data.pubDate).getTime();
  return data.draft !== true && Number.isFinite(publishedAt) && publishedAt <= now.getTime();
}

/** @param {string} value */
function normalize(value) {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR');
}

/**
 * @template {{ title: string, description: string, tags: string[], body?: string }} T
 * @param {T[]} posts
 * @param {string} query
 * @returns {T[]}
 */
export function searchPosts(posts, query) {
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  return posts.filter((post) => {
    const text = normalize([post.title, post.description, ...post.tags, post.body ?? ''].join(' '));
    return tokens.every((token) => text.includes(token));
  });
}

/** Approximate reading time for Korean and English prose, with a one-minute minimum.
 * @param {string} [body]
 */
export function readingMinutes(body = '') {
  const text = body
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .normalize('NFKC');
  const cjkPattern = /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;
  const cjkCount = text.match(cjkPattern)?.length ?? 0;
  const otherWords = text.replace(cjkPattern, ' ').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(cjkCount / 500 + otherWords / 200));
}

/** @param {Date | string | number} date */
export function formatDate(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(date));
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)?.value).join('.');
}
