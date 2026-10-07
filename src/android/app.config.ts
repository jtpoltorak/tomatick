import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PLATFORM, TIMER_HOST } from '../popup/app/timer-host';
import { AndroidTimerHost } from './android-timer-host';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: PLATFORM, useValue: 'android' },
    { provide: TIMER_HOST, useClass: AndroidTimerHost },
  ],
};
