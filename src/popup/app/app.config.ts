import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { ChromeTimerHost } from './chrome-timer-host';
import { TIMER_HOST } from './timer-host';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: TIMER_HOST, useClass: ChromeTimerHost },
  ],
};
