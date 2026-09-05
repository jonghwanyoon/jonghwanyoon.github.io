/** Build one reversible path segment after trimming and canonical Unicode normalization.
 * @param {string} tag
 */
export function tagSlug(tag) {
  if (typeof tag !== 'string' || !tag.trim()) {
    throw new TypeError('태그에는 비어 있지 않은 문자열을 사용해 주세요.');
  }
  return Array.from(tag.trim().normalize('NFC'), (character) => {
    if (/^[\p{L}\p{N}_-]$/u.test(character)) return character;
    return `~${character.codePointAt(0).toString(16)}~`;
  }).join('');
}

/** @param {string} tag */
export function tagUrl(tag) {
  return `/tags/${encodeURIComponent(tagSlug(tag))}/`;
}
