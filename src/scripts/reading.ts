function createCopyStatus() {
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  return status;
}

function attachCopyAction(button: HTMLButtonElement, status: HTMLElement, getText: () => string, subject: string) {
  const originalLabel = button.textContent || '복사';
  let resetTimer: number | undefined;

  button.addEventListener('click', async () => {
    window.clearTimeout(resetTimer);
    button.disabled = true;
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(getText());
      button.textContent = '복사 완료';
      status.textContent = `${subject}를 클립보드에 복사했습니다.`;
    } catch {
      button.textContent = '복사 실패';
      status.textContent = `${subject}를 복사하지 못했습니다. 내용을 직접 선택해 복사해 주세요.`;
    } finally {
      button.disabled = false;
      resetTimer = window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 2400);
    }
  });
}

document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre) => {
  if (pre.parentElement?.classList.contains('code-block')) return;
  const code = pre.querySelector('code');
  const languageClass = Array.from(code?.classList ?? []).find((name) => name.startsWith('language-'));
  const language = (pre.dataset.language || languageClass?.slice('language-'.length) || 'CODE').toUpperCase();
  const source = code?.textContent ?? pre.textContent ?? '';

  const wrapper = document.createElement('div');
  wrapper.className = 'code-block';
  const toolbar = document.createElement('div');
  toolbar.className = 'code-toolbar';
  const label = document.createElement('span');
  label.className = 'code-language';
  label.textContent = language;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-code';
  button.textContent = '코드 복사';
  const status = createCopyStatus();

  toolbar.append(label, button);
  pre.before(wrapper);
  wrapper.append(toolbar, pre, status);
  pre.tabIndex = 0;
  pre.setAttribute('aria-label', `${language} 코드. 가로로 스크롤할 수 있습니다.`);
  attachCopyAction(button, status, () => source, '코드');
});

document.querySelectorAll<HTMLButtonElement>('.share-button').forEach((button) => {
  button.type = 'button';
  button.textContent = '링크 복사';
  const status = createCopyStatus();
  button.after(status);
  attachCopyAction(button, status, () => window.location.href, '링크');
});

document.querySelectorAll<HTMLTableElement>('.prose table').forEach((table, index) => {
  if (table.parentElement?.classList.contains('table-scroll')) return;
  const wrapper = document.createElement('div');
  const caption = table.caption?.textContent?.trim();
  wrapper.className = 'table-scroll';
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', `${caption || `표 ${index + 1}`}. 가로로 스크롤할 수 있습니다.`);
  table.before(wrapper);
  wrapper.append(table);
});

document.querySelectorAll<HTMLElement>('.prose .katex-display').forEach((formula, index) => {
  formula.tabIndex = 0;
  formula.setAttribute('role', 'region');
  formula.setAttribute('aria-label', `수식 ${index + 1}. 가로로 스크롤할 수 있습니다.`);
});

const tocItems = Array.from(document.querySelectorAll<HTMLAnchorElement>('.toc a[href^="#"]')).flatMap((link) => {
  let id: string;
  try {
    id = decodeURIComponent(link.hash.slice(1));
  } catch {
    return [];
  }
  const heading = document.getElementById(id);
  return heading && /^H[23]$/.test(heading.tagName) ? [{ link, heading }] : [];
});

if (tocItems.length) {
  const visibleHeadings = new Set<Element>();

  function markCurrentHeading(heading: HTMLElement) {
    for (const item of tocItems) {
      if (item.heading === heading) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  }

  function updateCurrentHeading() {
    const visible = tocItems.filter(({ heading }) => visibleHeadings.has(heading));
    const candidates = visible.length ? visible : tocItems.filter(({ heading }) => heading.getBoundingClientRect().top <= 128);
    const current = visible.length ? candidates[0] : candidates[candidates.length - 1];
    markCurrentHeading((current ?? tocItems[0]).heading);
  }

  for (const { link, heading } of tocItems) {
    link.addEventListener('click', () => markCurrentHeading(heading));
  }

  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleHeadings.add(entry.target);
        else visibleHeadings.delete(entry.target);
      }
      updateCurrentHeading();
    }, { rootMargin: '-96px 0px -60% 0px', threshold: 0 });
    for (const { heading } of tocItems) observer.observe(heading);
  } else {
    let scheduled = false;
    const scheduleUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        updateCurrentHeading();
      });
    };
    document.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
  }
  window.addEventListener('hashchange', updateCurrentHeading);
  requestAnimationFrame(updateCurrentHeading);
}

export {};
