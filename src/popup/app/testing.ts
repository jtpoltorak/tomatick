import { computed, signal } from '@angular/core';
import {
  DEFAULT_SETTINGS,
  initialState,
  phaseDurationMs,
  remainingMs,
  type Settings,
  type TimerState,
} from '../../shared/timer';
import type { Command } from '../../shared/messages';
import { PomodoroStore } from './pomodoro-store';

/** A PomodoroStore stand-in with no chrome.* calls, for component tests. */
export function createFakeStore(overrides: Partial<TimerState> = {}) {
  const now = Date.now();
  const state = signal<TimerState>({ ...initialState(DEFAULT_SETTINGS, now), ...overrides });
  const settings = signal<Settings>(DEFAULT_SETTINGS);
  const sent: Command[] = [];
  const fake = {
    state,
    settings,
    loaded: signal(true),
    alertHintDismissed: signal(false),
    remainingMs: computed(() => remainingMs(state(), now)),
    totalMs: computed(() => phaseDurationMs(state().phase, settings())),
    progress: computed(() => 0),
    alertsOff: computed(() => !settings().soundEnabled && !settings().notificationsEnabled),
    sent,
    async send(command: Command) {
      sent.push(command);
    },
    async updateSettings(next: Settings) {
      settings.set(next);
    },
    async dismissAlertHint() {
      fake.alertHintDismissed.set(true);
    },
  };
  return fake;
}

export function provideFakeStore(fake: ReturnType<typeof createFakeStore>) {
  return { provide: PomodoroStore, useValue: fake };
}
