import test from 'node:test';
import assert from 'node:assert/strict';
import { tagSlug, tagUrl } from '../src/lib/tags.mjs';

test('tag slugs preserve Korean, letters, numbers, hyphens, underscores, and case', () => {
  assert.equal(tagSlug('한글-Tag_2026'), '한글-Tag_2026');
  assert.equal(tagSlug('C'), 'C');
  assert.equal(tagSlug('c'), 'c');
});

test('tag slugs escape punctuation by Unicode codepoint', () => {
  const cases = [
    ['C++', 'C~2b~~2b~'],
    ['C#', 'C~23~'],
    ['CI/CD', 'CI~2f~CD'],
    ['100%', '100~25~'],
    ['~', '~7e~'],
    ['a b', 'a~20~b'],
    ['🚀', '~1f680~'],
  ];
  for (const [tag, expected] of cases) assert.equal(tagSlug(tag), expected);
});

test('escaped text cannot collide with punctuation tags', () => {
  const tags = ['C++', 'C#', 'C', 'CI/CD', 'CI~2f~CD', '100%', '100~25~', '~', '~~'];
  assert.equal(new Set(tags.map(tagSlug)).size, tags.length);
});

test('tag slugs trim surrounding whitespace and normalize canonical Unicode forms', () => {
  assert.equal(tagSlug('  한글  '), '한글');
  assert.equal(tagSlug('한글'.normalize('NFD')), '한글');
  assert.equal(tagSlug('cafe\u0301'), 'café');
});

test('tag URLs percent-encode Unicode while retaining the escaped ASCII slug', () => {
  assert.equal(tagUrl('한글'), '/tags/%ED%95%9C%EA%B8%80/');
  assert.equal(tagUrl('C++'), '/tags/C~2b~~2b~/');
  assert.equal(tagUrl('CI/CD'), '/tags/CI~2f~CD/');
});

test('special tags stay in one path segment without creating fragments, queries, or traversal', () => {
  for (const tag of ['CI/CD', 'C#', '?query=yes', '../..', '\\', '100%', '~', '한글 🚀']) {
    const slug = tagSlug(tag);
    assert.doesNotMatch(slug, /[/\\?#]/);
    const url = new URL(tagUrl(tag), 'https://example.test');
    assert.equal(url.pathname.split('/').filter(Boolean).length, 2);
    assert.equal(url.search, '');
    assert.equal(url.hash, '');
  }
});

test('empty and non-string tags are rejected instead of creating an empty route', () => {
  for (const tag of ['', ' \t\n', null, undefined, 42]) {
    assert.throws(() => tagSlug(tag), TypeError);
    assert.throws(() => tagUrl(tag), TypeError);
  }
});
