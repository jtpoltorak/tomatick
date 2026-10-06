import { Component, inject } from '@angular/core';
import { ABOUT } from '../../../shared/about';
import { APP_VERSION } from '../../../shared/version';
import { PLATFORM } from '../timer-host';

@Component({
  selector: 'app-help-view',
  templateUrl: './help-view.html',
  styleUrl: './help-view.css',
})
export class HelpView {
  protected readonly about = ABOUT;
  protected readonly version = globalThis.chrome?.runtime?.getManifest?.().version ?? APP_VERSION;
  protected readonly isWeb = inject(PLATFORM) === 'web';
  protected readonly mailto = `mailto:${ABOUT.email}?subject=${encodeURIComponent('Tomatick feedback')}`;
}
