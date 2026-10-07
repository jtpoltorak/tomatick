import { InjectionToken, type Signal } from '@angular/core';

/**
 * Lets the web app offer its own "Install" button. Only the web build provides
 * one; the extension has nothing to install, so it injects null.
 */
export interface InstallPrompt {
  /** True while the browser says the app can be installed and it isn't yet. */
  readonly available: Signal<boolean>;
  /** Shows the browser's install dialog. Must be called straight from a click. */
  install(): Promise<void>;
}

export const INSTALL_PROMPT = new InjectionToken<InstallPrompt | null>('InstallPrompt', {
  providedIn: 'root',
  factory: () => null,
});
