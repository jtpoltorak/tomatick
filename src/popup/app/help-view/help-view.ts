import { Component, ElementRef, inject, signal } from '@angular/core';
import { ABOUT } from '../../../shared/about';
import { APP_VERSION } from '../../../shared/version';
import { PLATFORM } from '../timer-host';

type HelpTab = 'basics' | 'tips' | 'technique' | 'about';

@Component({
  selector: 'app-help-view',
  templateUrl: './help-view.html',
  styleUrl: './help-view.css',
})
export class HelpView {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly about = ABOUT;
  protected readonly version = globalThis.chrome?.runtime?.getManifest?.().version ?? APP_VERSION;
  protected readonly isWeb = inject(PLATFORM) === 'web';
  protected readonly mailto = `mailto:${ABOUT.email}?subject=${encodeURIComponent('Tomomomento feedback')}`;

  protected readonly tabs: { id: HelpTab; label: string }[] = [
    { id: 'basics', label: 'Basics' },
    { id: 'tips', label: 'Tips' },
    { id: 'technique', label: 'Technique' },
    { id: 'about', label: 'About' },
  ];
  protected readonly tab = signal<HelpTab>('basics');

  /** Arrow keys, Home, and End move between tabs, as in the WAI-ARIA tabs pattern. */
  protected onTabKey(event: KeyboardEvent): void {
    const i = this.tabs.findIndex((t) => t.id === this.tab());
    const last = this.tabs.length - 1;
    const next = {
      ArrowRight: i === last ? 0 : i + 1,
      ArrowLeft: i === 0 ? last : i - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const id = this.tabs[next].id;
    this.tab.set(id);
    this.host.nativeElement.querySelector<HTMLElement>(`#help-tab-${id}`)?.focus();
  }
}
