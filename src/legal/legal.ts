// Fills the legal page's names, dates, and contact address from src/shared/about.ts.

import { ABOUT } from '../shared/about';

const values: Record<string, string> = {
  author: ABOUT.author,
  copyrightYear: String(ABOUT.copyrightYear),
  legalUpdated: ABOUT.legalUpdated,
  version: chrome.runtime.getManifest().version,
};

for (const el of document.querySelectorAll<HTMLElement>('[data-about]')) {
  const key = el.dataset['about']!;
  if (key === 'email') {
    el.textContent = ABOUT.email;
    (el as HTMLAnchorElement).href = `mailto:${ABOUT.email}`;
  } else {
    el.textContent = values[key] ?? '';
  }
}
