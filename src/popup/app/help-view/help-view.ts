import { Component } from '@angular/core';
import { ABOUT } from '../../../shared/about';

@Component({
  selector: 'app-help-view',
  templateUrl: './help-view.html',
  styleUrl: './help-view.css',
})
export class HelpView {
  protected readonly about = ABOUT;
  protected readonly version = globalThis.chrome?.runtime?.getManifest?.().version ?? '';
  protected readonly mailto = `mailto:${ABOUT.email}?subject=${encodeURIComponent('Tomatick feedback')}`;
}
