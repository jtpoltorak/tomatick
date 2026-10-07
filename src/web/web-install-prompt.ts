// Chrome and Edge fire beforeinstallprompt once the app meets their install
// rules. Holding on to that event lets the app show its own Install button
// instead of relying on the small icon in the address bar. Safari and Firefox
// never fire it, so the button simply doesn't appear there.

import { computed, Injectable, signal } from '@angular/core';
import type { InstallPrompt } from '../popup/app/install-prompt';

/** Not in TypeScript's DOM types yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const deferred = signal<BeforeInstallPromptEvent | null>(null);

// Listen as soon as this module loads, since the event can fire before Angular starts.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred.set(event as BeforeInstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => deferred.set(null));
}

@Injectable()
export class WebInstallPrompt implements InstallPrompt {
  readonly available = computed(() => deferred() !== null);

  async install(): Promise<void> {
    const event = deferred();
    if (!event) return;
    // Each event can only prompt once. If the person says no, Chrome fires a
    // fresh beforeinstallprompt later and the button comes back.
    deferred.set(null);
    await event.prompt();
  }
}
