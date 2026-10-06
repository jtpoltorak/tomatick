import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PLATFORM, TIMER_HOST } from '../popup/app/timer-host';
import { WebTimerHost } from './web-timer-host';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: PLATFORM, useValue: 'web' },
    { provide: TIMER_HOST, useClass: WebTimerHost },
  ],
};
