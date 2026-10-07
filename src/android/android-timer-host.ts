// The Android app's timer engine: the web app's engine, plus native alerts.
// Android freezes the WebView once the app is in the background, so the page's
// setTimeout can't be trusted to ring when a phase ends. Instead, every time
// the timer is armed we hand Android a notification scheduled for the exact
// end time (and for any phases that will auto-start after it). Android shows
// it on time even with the app closed or the phone asleep.

import { App } from '@capacitor/app';
import type { Command, CommandResponse } from '../shared/messages';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import { advance, type Phase, type Settings, type SoundId, type TimerState } from '../shared/timer';
import { completionMessage, loadSettings, loadState, WebTimerHost } from '../web/web-timer-host';

/** Notification ids 1..MAX_QUEUED are ours: the next phase end, then any auto-started ones. */
const MAX_QUEUED = 16;
const QUEUED_IDS = Array.from({ length: MAX_QUEUED }, (_, i) => ({ id: i + 1 }));

/**
 * A channel's sound can't change once it exists, so each alert sound gets its
 * own channel, plus a silent one for "notifications on, sound off". The sound
 * files are rendered from the same notes the web app plays (scripts/android-sounds.mjs).
 */
const CHANNELS: { id: string; name: string; sound: string }[] = [
  { id: 'phase-bell', name: 'Time is up (bell)', sound: 'tomo_bell.wav' },
  { id: 'phase-chime', name: 'Time is up (chime)', sound: 'tomo_chime.wav' },
  { id: 'phase-digital', name: 'Time is up (digital)', sound: 'tomo_digital.wav' },
  { id: 'phase-silent', name: 'Time is up (silent)', sound: 'tomo_silent.wav' },
];

function channelFor(settings: Settings): string {
  if (!settings.soundEnabled) return 'phase-silent';
  return `phase-${settings.sound satisfies SoundId}`;
}

// Notification calls are async and the timer can change quickly (start, then
// pause), so they run one at a time in order. This lives outside the class
// because the base constructor arms the timer before subclass fields exist.
let queue: Promise<unknown> = Promise.resolve();
/** Whether the latest phase end is covered by a native notification. */
let nativeAlertArmed = false;

function enqueue(task: () => Promise<void>): void {
  queue = queue.then(task).catch((err: unknown) => console.error('Native alert failed', err));
}

/** The phase ends to notify about: this one, then each phase that auto-starts after it. */
export function upcomingAlerts(state: TimerState, settings: Settings): LocalNotificationSchema[] {
  const alerts: LocalNotificationSchema[] = [];
  let s = state;
  while (s.status === 'running' && s.endTime !== null && alerts.length < MAX_QUEUED) {
    const next = advance(s, settings, s.endTime, true);
    const { title, body } = completionMessage(s.phase, next);
    alerts.push({
      id: alerts.length + 1,
      title,
      body,
      schedule: { at: new Date(s.endTime), allowWhileIdle: true },
      channelId: channelFor(settings),
      smallIcon: 'ic_stat_timer',
      iconColor: '#e8590c',
      autoCancel: true,
    });
    s = next;
  }
  return alerts;
}

let channelsReady: Promise<void> | undefined;

/** Creates the channels once per launch (Android ignores repeats). */
function ensureChannels(): Promise<void> {
  channelsReady ??= (async () => {
    for (const channel of CHANNELS) {
      await LocalNotifications.createChannel({
        ...channel,
        importance: 4, // High: makes a sound and pops up on screen.
        visibility: 1, // Public: shows on the lock screen.
        vibration: true,
      });
    }
  })().catch((err: unknown) => {
    channelsReady = undefined; // Try again next time.
    throw err;
  });
  return channelsReady;
}

/** Replaces any queued alerts with ones for `state`. Resolves to whether one is now armed. */
async function armNativeAlerts(state: TimerState, settings: Settings): Promise<boolean> {
  await LocalNotifications.cancel({ notifications: QUEUED_IDS });
  if (!settings.notificationsEnabled) return false;
  const notifications = upcomingAlerts(state, settings);
  if (notifications.length === 0) return false;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== 'granted') return false;
  await ensureChannels();
  await LocalNotifications.schedule({ notifications });
  return true;
}

function syncNativeAlerts(state: TimerState, settings: Settings): void {
  enqueue(async () => {
    try {
      nativeAlertArmed = await armNativeAlerts(state, settings);
    } catch (err) {
      nativeAlertArmed = false;
      throw err;
    }
  });
}

export class AndroidTimerHost extends WebTimerHost {
  constructor() {
    super();
    // Coming back from the background: catch up on phases that ended meanwhile.
    void App.addListener('resume', () => void this.completeIfDue(true));
  }

  override send(command: Command): Promise<CommandResponse> {
    // The person is back in the app and moving on, so clear a "time's up"
    // notification that's still showing. (Not on every re-arm: the page can
    // still be running in the background, and would hide it the moment it rang.)
    enqueue(() =>
      LocalNotifications.removeDeliveredNotifications({
        notifications: QUEUED_IDS.map(({ id }) => ({ id, title: '', body: '' })),
      }),
    );
    return super.send(command);
  }

  override async saveSettings(settings: Settings): Promise<void> {
    await super.saveSettings(settings);
    // Sound or notification choices may have changed, so re-arm with them.
    this.onScheduled(loadState());
  }

  override async requestNotificationAccess(): Promise<boolean> {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  }

  protected override onScheduled(state: TimerState): void {
    syncNativeAlerts(state, loadSettings());
  }

  /** Several phases may have ended while the app was asleep, each starting the next. */
  protected override catchUp(state: TimerState, settings: Settings, now: number): TimerState {
    let s = state;
    do {
      s = advance(s, settings, s.endTime ?? now, true);
    } while (s.status === 'running' && s.endTime !== null && s.endTime <= now);
    return s;
  }

  protected override async alertPhaseComplete(
    finished: Phase,
    next: TimerState,
    settings: Settings,
  ): Promise<void> {
    // If a native notification was armed for the phase that just ended, it
    // already rang with the chosen sound, so don't ring twice. Read this right
    // away: re-arming for the next phase is queued and hasn't run yet.
    if (nativeAlertArmed) return;
    await super.alertPhaseComplete(finished, next, { ...settings, notificationsEnabled: false });
  }
}
