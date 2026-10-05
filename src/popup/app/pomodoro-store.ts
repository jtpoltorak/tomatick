import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { BLOCKER_PERMISSIONS } from '../../shared/blocker';
import { sendCommand, type Command } from '../../shared/messages';
import { loadSettings, loadState, saveSettings } from '../../shared/storage';
import {
  DEFAULT_SETTINGS,
  initialState,
  phaseDurationMs,
  remainingMs,
  type Settings,
  type TimerState,
} from '../../shared/timer';

const HINT_KEY = 'alertHintDismissed';

/**
 * The popup's view of the timer. The background worker owns the real state;
 * this store mirrors it from chrome.storage into signals and forwards the
 * user's commands back to the worker.
 */
@Injectable({ providedIn: 'root' })
export class PomodoroStore {
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

    const onChanged = () => void this.refresh();
    chrome.storage.onChanged.addListener(onChanged);
    inject(DestroyRef).onDestroy(() => chrome.storage.onChanged.removeListener(onChanged));

    effect((onCleanup) => {
      if (this.state().status !== 'running') return;
      this.now.set(Date.now());
      const id = setInterval(() => this.now.set(Date.now()), 250);
      onCleanup(() => clearInterval(id));
    });
  }

  async refresh(): Promise<void> {
    const [state, settings, ui, access] = await Promise.all([
      loadState(),
      loadSettings(),
      chrome.storage.local.get(HINT_KEY),
      chrome.permissions.contains(BLOCKER_PERMISSIONS),
    ]);
    this.blockerAccess.set(access);
    this.state.set(state);
    this.settings.set(settings);
    this.alertHintDismissed.set(Boolean(ui[HINT_KEY]));
    this.now.set(Date.now());
    this.loaded.set(true);
  }

  async send(command: Command): Promise<void> {
    const res = await sendCommand(command);
    if (res.ok) {
      this.now.set(Date.now());
      this.state.set(res.state);
    } else {
      console.error(res.error);
    }
  }

  async updateSettings(settings: Settings): Promise<void> {
    this.settings.set(settings);
    await saveSettings(settings);
  }

  /** Must be called straight from a click, since Chrome only prompts on a user gesture. */
  async requestBlockerAccess(): Promise<boolean> {
    const granted = await chrome.permissions.request(BLOCKER_PERMISSIONS);
    this.blockerAccess.set(granted);
    return granted;
  }

  async dismissAlertHint(): Promise<void> {
    this.alertHintDismissed.set(true);
    await chrome.storage.local.set({ [HINT_KEY]: true });
  }
}
