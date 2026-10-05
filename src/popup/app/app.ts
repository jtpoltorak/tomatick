import { Component, effect, inject, signal } from '@angular/core';
import { PomodoroStore } from './pomodoro-store';
import { HelpView } from './help-view/help-view';
import { SettingsView } from './settings-view/settings-view';
import { TimerView } from './timer-view/timer-view';

type View = 'timer' | 'settings' | 'help';

@Component({
  selector: 'app-root',
  imports: [TimerView, SettingsView, HelpView],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly store = inject(PomodoroStore);
  // The Options page links here with #settings.
  protected readonly view = signal<View>(location.hash === '#settings' ? 'settings' : 'timer');

  constructor() {
    // Phase colors are CSS variables keyed off <html data-phase>.
    effect(() => {
      document.documentElement.dataset['phase'] = this.store.state().phase;
    });
  }

  protected show(view: View): void {
    this.view.set(view);
  }
}
