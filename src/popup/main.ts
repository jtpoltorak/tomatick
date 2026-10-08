import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { restoreTheme } from './app/theme';

restoreTheme();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
