// Entry point for the web app: the extension popup's UI, with an in-page timer
// engine in place of the background worker.
import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from '../popup/app/app';
import { appConfig } from './app.config';
import { restoreTheme } from '../popup/app/theme';

restoreTheme();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));

// The service worker makes the app installable and lets it open offline.
if ('serviceWorker' in navigator && !isDevMode()) {
  navigator.serviceWorker.register('sw.js').catch((err) => console.error(err));
}
