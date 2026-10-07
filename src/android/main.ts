// Entry point for the Android app: the web app's UI and engine running in
// Capacitor's WebView, with native notifications for when the app is closed.
// No service worker: the app's files are already on the phone.
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from '../popup/app/app';
import { appConfig } from './app.config';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
