import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import type { Command } from '../../shared/messages';
import {
  DEFAULT_SETTINGS,
  initialState,
  phaseDurationMs,
  remainingMs,
  type Settings,
  type TimerState,
} from '../../shared/timer';
import { TIMER_HOST } from './timer-host';

/**
 * The UI's view of the timer. The host (the background worker in the
 * extension, an in-page engine on the web) owns the real state; this store
 * mirrors it into signals and forwards the user's commands back to the host.
 */
@Injectable({ providedIn: 'root' })
export class PomodoroStore {
  private readonly host = inject(TIMER_HOST);

  readonly state = signal<TimerState>(initialState(DEFAULT_SETTINGS, Date.now()));
  readonly settings = signal<Settings>(DEFAULT_SETTINGS);
  readonly loaded = signal(false);
  readonly alertHintDismissed = signal(true);
  /** Whether the user has granted the site access the blocker needs. */
  readonly blockerAccess = signal(false);

  /** Ticks while the timer runs so the countdown re-renders. */
  private readonly now = signal(Date.now());

  readonly remainingMs = computed(() => remainingMs(this.state(), this.now()));
  readonly totalMs = computed(() => phaseDurationMs(this.state().phase, this.settings()));
  /** 0 at the start of a phase, 1 when it ends. */
  readonly progress = computed(() => {
    const total = this.totalMs();
    return total > 0 ? Math.min(1, Math.max(0, 1 - this.remainingMs() / total)) : 0;
  });
  readonly alertsOff = computed(
    () => !this.settings().soundEnabled && !this.settings().notificationsEnabled,
  );

  constructor() {
    void this.refresh();

    const unsubscribe = this.host.onChange(() => void this.refresh());
    inject(DestroyRef).onDestroy(unsubscribe);

    effect((onCleanup) => {
      if (this.state().status !== 'running') return;
      this.now.set(Date.now());
      const id = setInterval(() => this.now.set(Date.now()), 250);
      onCleanup(() => clearInterval(id));
    });
  }

  async refresh(): Promise<void> {
    const { state, settings, alertHintDismissed, blockerAccess } = await this.host.load();
    this.blockerAccess.set(blockerAccess);
    this.state.set(state);
    this.settings.set(settings);
    this.alertHintDismissed.set(alertHintDismissed);
    this.now.set(Date.now());
    this.loaded.set(true);
  }

  async send(command: Command): Promise<void> {
    const res = await this.host.send(command);
    if (res.ok) {
      this.now.set(Date.now());
      this.state.set(res.state);
    } else {
      console.error(res.error);
    }
  }

  async updateSettings(settings: Settings): Promise<void> {
    this.settings.set(settings);
    await this.host.saveSettings(settings);
  }

  /** Must be called straight from a click, since Chrome only prompts on a user gesture. */
  async requestBlockerAccess(): Promise<boolean> {
    const granted = await this.host.requestBlockerAccess();
    this.blockerAccess.set(granted);
    return granted;
  }

  /** Must be called straight from a click, since browsers only prompt on a user gesture. */
  requestNotificationAccess(): Promise<boolean> {
    return this.host.requestNotificationAccess();
  }

  async dismissAlertHint(): Promise<void> {
    this.alertHintDismissed.set(true);
    await this.host.dismissAlertHint();
  }
}
