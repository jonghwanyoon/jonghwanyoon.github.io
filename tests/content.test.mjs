import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isPublished, searchPosts, readingMinutes, formatDate } from '../src/lib/content.mjs';

const now = new Date('2026-09-05T03:00:00Z');

test('draft posts stay private even after their publication date', () => {
  assert.equal(isPublished({ draft: true, pubDate: new Date('2026-01-01') }, now), false);
});

test('future posts stay private until the exact publication time', () => {
  assert.equal(isPublished({ draft: false, pubDate: new Date('2026-09-05T03:00:01Z') }, now), false);
  assert.equal(isPublished({ draft: false, pubDate: new Date('2026-09-05T03:00:00Z') }, now), true);
});

test('past posts publish with an omitted draft value and invalid dates stay private', () => {
  assert.equal(isPublished({ pubDate: new Date('2026-09-01') }, now), true);
  assert.equal(isPublished({ pubDate: new Date('invalid') }, now), false);
});

const posts = [
  { id: 'astro', title: 'Astro에서 블로그 만들기', description: '정적 사이트 기록', tags: ['TypeScript'], body: '콘텐츠 컬렉션과 검색을 다룹니다.' },
  { id: 'paper', title: '논문 읽는 방법', description: '천천히 이해하기', tags: ['논문'], body: 'Attention의 구조를 수식으로 살펴봅니다.' },
];

test('search matches every token across title, description, tags, and body', () => {
  assert.deepEqual(searchPosts(posts, 'ASTRO  typescript\n 검색 정적').map((post) => post.id), ['astro']);
  assert.deepEqual(searchPosts(posts, '논문 attention').map((post) => post.id), ['paper']);
  assert.deepEqual(searchPosts(posts, 'Astro attention'), []);
});

test('search normalizes composed Korean and full-width Latin text', () => {
  assert.deepEqual(searchPosts(posts, '블로그'.normalize('NFD')).map((post) => post.id), ['astro']);
  assert.deepEqual(searchPosts(posts, 'ＡＳＴＲＯ').map((post) => post.id), ['astro']);
});

test('empty searches preserve order and searching does not mutate source posts', () => {
  const snapshot = structuredClone(posts);
  assert.deepEqual(searchPosts(posts, ' \t\n'), posts);
  searchPosts(posts, '논문');
  assert.deepEqual(posts, snapshot);
});

test('reading time has a one-minute minimum', () => {
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes('짧은 기록입니다.'), 1);
});

test('reading time accounts for long Korean text without relying on spaces', () => {
  assert.equal(readingMinutes('가'.repeat(1001)), 3);
});

test('reading time combines Korean characters and English words', () => {
  assert.equal(readingMinutes('가'.repeat(500) + ' ' + 'word '.repeat(200)), 2);
  assert.equal(readingMinutes('word '.repeat(401)), 3);
});

test('Markdown image and link URLs do not inflate reading time', () => {
  const longUrl = 'https://example.com/' + 'very-long-path-'.repeat(600);
  assert.equal(readingMinutes(`![도식](${longUrl})\n[참고 자료](${longUrl})`), 1);
});

test('date display uses the Korean calendar date independently of machine timezone', () => {
  assert.equal(formatDate(new Date('2026-09-04T16:30:00Z')), '2026.09.05');
});

function authoringWorkspace(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'blog-authoring-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

function newPost(cwd, args) {
  return spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/new-post.mjs', import.meta.url)), ...args], {
    cwd, encoding: 'utf8',
  });
}

test('authoring command creates an unpublished paper with a safely quoted title and Korean date', (t) => {
  const cwd = authoringWorkspace(t);
  const dateBefore = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const result = newPost(cwd, ['first-paper', '--type', 'papers', '--title', '논문: "질문"']);
  assert.equal(result.status, 0, result.stderr);
  const content = readFileSync(join(cwd, 'src/content/blog/first-paper.md'), 'utf8');
  const dateAfter = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  assert.match(content, /^draft: true$/m);
  assert.match(content, /^category: papers$/m);
  const title = content.match(/^title: (.+)$/m)?.[1];
  assert.equal(JSON.parse(title), '논문: "질문"');
  const date = content.match(/^pubDate: (.+)$/m)?.[1];
  assert.ok(date === dateBefore || date === dateAfter);
});

test('authoring command rejects path traversal and unsupported categories', (t) => {
  const cwd = authoringWorkspace(t);
  const traversal = newPost(cwd, ['../escape']);
  assert.notEqual(traversal.status, 0);
  assert.match(traversal.stderr, /slug/i);
  assert.equal(existsSync(join(cwd, 'src')), false);
  const category = newPost(cwd, ['safe-name', '--type', 'unknown']);
  assert.notEqual(category.status, 0);
  assert.match(category.stderr, /tech.*papers.*notes/);
  assert.equal(existsSync(join(cwd, 'src')), false);
});

test('authoring command never overwrites an existing post', (t) => {
  const cwd = authoringWorkspace(t);
  const directory = join(cwd, 'src/content/blog');
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, 'existing.md');
  writeFileSync(destination, '내가 이미 작성한 글', 'utf8');
  const result = newPost(cwd, ['existing']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /이미/);
  assert.equal(readFileSync(destination, 'utf8'), '내가 이미 작성한 글');
});

test('authoring command rejects an existing MDX post with the same collection ID', (t) => {
  const cwd = authoringWorkspace(t);
  const directory = join(cwd, 'src/content/blog');
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, 'existing.mdx');
  writeFileSync(destination, '이미 작성한 MDX 글', 'utf8');
  const result = newPost(cwd, ['existing']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /이미/);
  assert.equal(readFileSync(destination, 'utf8'), '이미 작성한 MDX 글');
  assert.equal(existsSync(join(directory, 'existing.md')), false);
});
