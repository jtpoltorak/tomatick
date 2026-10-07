import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { INSTALL_PROMPT } from '../popup/app/install-prompt';
import { PLATFORM, TIMER_HOST } from '../popup/app/timer-host';
import { WebInstallPrompt } from './web-install-prompt';
import { WebTimerHost } from './web-timer-host';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: PLATFORM, useValue: 'web' },
    { provide: TIMER_HOST, useClass: WebTimerHost },
    { provide: INSTALL_PROMPT, useClass: WebInstallPrompt },
  ],
};
