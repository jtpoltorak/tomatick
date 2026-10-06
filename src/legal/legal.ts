// Fills the legal page's names, dates, and contact address from src/shared/about.ts,
// and shows the parts that apply to the build it's in (extension or web app).

import { ABOUT } from '../shared/about';
import { APP_VERSION } from '../shared/version';

const isExtension = Boolean(globalThis.chrome?.runtime?.id);

const values: Record<string, string> = {
  author: ABOUT.author,
  copyrightYear: String(ABOUT.copyrightYear),
  legalUpdated: ABOUT.legalUpdated,
  version: isExtension ? chrome.runtime.getManifest().version : APP_VERSION,
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

// Text marked data-only="web" starts hidden, so the extension's page reads as before.
for (const el of document.querySelectorAll<HTMLElement>('[data-only]')) {
  el.hidden = el.dataset['only'] !== (isExtension ? 'extension' : 'web');
}
