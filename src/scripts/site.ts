import { searchPosts } from '../lib/content.mjs';

type Theme = 'light' | 'dark';
type SearchPost = {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  body: string;
};

const root = document.documentElement;
const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let explicitTheme: Theme | null = null;

try {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') explicitTheme = saved;
} catch {
  // The theme still works when browser storage is unavailable.
}

function applyTheme(theme: Theme) {
  root.dataset.theme = theme;
  themeToggle?.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
  const background = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
    'content', background || (theme === 'dark' ? '#111318' : '#ffffff'),
  );
}

applyTheme(explicitTheme ?? (systemTheme.matches ? 'dark' : 'light'));

themeToggle?.addEventListener('click', () => {
  explicitTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(explicitTheme);
  try {
    localStorage.setItem('theme', explicitTheme);
  } catch {
    // Keep the explicit choice for this page even if it cannot be persisted.
  }
});

systemTheme.addEventListener('change', (event) => {
  if (!explicitTheme) applyTheme(event.matches ? 'dark' : 'light');
});

const searchDialog = document.querySelector<HTMLDialogElement>('#search-dialog');
const searchInput = document.querySelector<HTMLInputElement>('#search-input');
const searchStatus = document.querySelector<HTMLElement>('#search-status');
const searchResults = document.querySelector<HTMLElement>('#search-results');

if (searchDialog && searchInput && searchStatus && searchResults) {
  const dialog = searchDialog;
  const input = searchInput;
  const status = searchStatus;
  const results = searchResults;
  let posts: SearchPost[] | null = null;
  let pendingRequest: Promise<SearchPost[]> | null = null;
  let previousFocus: HTMLElement | null = null;

  function loadPosts(): Promise<SearchPost[]> {
    if (posts !== null) return Promise.resolve(posts);
    if (pendingRequest) return pendingRequest;

    pendingRequest = fetch('/search.json')
      .then(async (response) => {
        if (!response.ok) throw new Error('Search index request failed');
        const index = await response.json();
        if (!index || !Array.isArray(index.posts)) throw new Error('Invalid search index');
        posts = index.posts as SearchPost[];
        return posts;
      })
      .finally(() => {
        pendingRequest = null;
      });
    return pendingRequest;
  }

  async function updateResults() {
    if (posts === null) {
      results.replaceChildren();
      results.setAttribute('aria-busy', 'true');
      status.textContent = '기록을 불러오는 중입니다…';
    }

    let index: SearchPost[];
    try {
      index = await loadPosts();
    } catch {
      results.removeAttribute('aria-busy');
      results.replaceChildren();
      status.textContent = '기록을 불러오지 못했습니다. 검색어를 입력하거나 검색창을 다시 열면 재시도합니다.';
      return;
    }

    // Read the current input after loading, so an earlier query cannot replace newer results.
    const query = input.value.trim();
    const matches: SearchPost[] = query ? searchPosts(index, query) : index;
    const visiblePosts = matches.slice(0, 20);
    const fragment = document.createDocumentFragment();

    for (const post of visiblePosts) {
      const link = document.createElement('a');
      link.className = 'search-result';
      link.href = post.url;

      const category = document.createElement('span');
      category.className = 'search-result-category';
      category.textContent = ({ tech: '기술', papers: '논문 노트', notes: '학습 기록' } as Record<string, string>)[post.category] ?? post.category;
      const title = document.createElement('h3');
      title.textContent = post.title;
      const description = document.createElement('p');
      description.textContent = post.description;

      link.append(category, title, description);
      fragment.append(link);
    }

    results.replaceChildren(fragment);
    results.removeAttribute('aria-busy');
    if (query) {
      status.textContent = matches.length
        ? `검색 결과 ${matches.length}개${matches.length > 20 ? ' · 상위 20개를 표시합니다.' : ''}`
        : '검색 결과가 없습니다. 다른 단어나 태그로 찾아보세요.';
    } else {
      status.textContent = matches.length
        ? `최근 기록 · ${matches.length > 20 ? '최근 20개를 표시합니다.' : `${matches.length}개의 기록`}`
        : '아직 등록된 기록이 없습니다.';
    }
  }

  function openSearch() {
    if (!dialog.open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    }
    input.focus({ preventScroll: true });
    void updateResults();
  }

  function closeSearch() {
    if (dialog.open) dialog.close();
  }

  document.querySelectorAll<HTMLButtonElement>('[data-open-search]').forEach((button) => {
    button.addEventListener('click', openSearch);
  });
  document.querySelector('#close-search')?.addEventListener('click', closeSearch);
  input.addEventListener('input', () => void updateResults());

  dialog.addEventListener('close', () => {
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    previousFocus = null;
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeSearch();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      closeSearch();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.isComposing) return;
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (
      target.isContentEditable || Boolean(target.closest('input, textarea, select, [role="textbox"]'))
    );
    const commandShortcut = (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k';
    const slashShortcut = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && !isTyping;
    if (commandShortcut || slashShortcut) {
      event.preventDefault();
      openSearch();
    }
  });
}
