import { DEFAULT_SETTINGS, initialState, type Settings, type TimerState } from '../shared/timer';

const native = vi.hoisted(() => ({
  scheduled: [] as { id: number; schedule?: { at?: Date }; channelId?: string; title: string }[],
  permission: 'granted',
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    createChannel: vi.fn(async () => {}),
    cancel: vi.fn(async () => {
      native.scheduled = [];
    }),
    removeDeliveredNotifications: vi.fn(async () => {}),
    checkPermissions: vi.fn(async () => ({ display: native.permission })),
    requestPermissions: vi.fn(async () => ({ display: native.permission })),
    schedule: vi.fn(async ({ notifications }: { notifications: typeof native.scheduled }) => {
      native.scheduled = notifications;
    }),
  },
}));
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(async () => ({})) } }));

const { AndroidTimerHost, upcomingAlerts } = await import('./android-timer-host');

const ALERTS_ON: Settings = { ...DEFAULT_SETTINGS, notificationsEnabled: true, soundEnabled: true };
/** Lets the queued native calls finish. */
const settle = () => vi.advanceTimersByTimeAsync(0);

function running(settings: Settings, now: number): TimerState {
  return { ...initialState(settings, now), status: 'running', endTime: now + 25 * 60_000 };
}

describe('upcomingAlerts', () => {
  it('covers just the current phase when nothing auto-starts', () => {
    const now = Date.now();
    const alerts = upcomingAlerts(running(ALERTS_ON, now), ALERTS_ON);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      title: 'Focus session complete',
      body: 'Ready for your short break.',
      channelId: 'phase-bell',
    });
    expect(alerts[0].schedule?.at?.getTime()).toBe(now + 25 * 60_000);
  });

  it('queues each phase that will auto-start, on its own schedule', () => {
    const settings = { ...ALERTS_ON, autoStartBreaks: true, sound: 'chime' as const };
    const now = Date.now();
    const alerts = upcomingAlerts(running(settings, now), settings);
    // Focus ends, the break auto-starts and ends, then focus waits for a tap.
    expect(alerts.map((a) => a.body)).toEqual(['Short break started.', 'Ready for your focus.']);
    expect(alerts[1].schedule?.at?.getTime()).toBe(now + 30 * 60_000);
    expect(alerts.every((a) => a.channelId === 'phase-chime')).toBe(true);
  });

  it('uses the silent channel when sound is off', () => {
    const settings = { ...ALERTS_ON, soundEnabled: false };
    expect(upcomingAlerts(running(settings, Date.now()), settings)[0].channelId).toBe(
      'phase-silent',
    );
  });
});

describe('AndroidTimerHost', () => {
  beforeEach(() => {
    localStorage.clear();
    native.scheduled = [];
    native.permission = 'granted';
    vi.useFakeTimers();
    // jsdom has no Web Audio; turning sound on unlocks it.
    vi.stubGlobal(
      'AudioContext',
      class {
        resume = async () => {};
      },
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('schedules a native alert on start and cancels it on pause', async () => {
    const host = new AndroidTimerHost();
    await host.saveSettings(ALERTS_ON);
    await host.send({ command: 'start' });
    await settle();
    expect(native.scheduled).toHaveLength(1);

    await host.send({ command: 'pause' });
    await settle();
    expect(native.scheduled).toHaveLength(0);
  });

  it('schedules nothing while notifications are off or not allowed', async () => {
    const host = new AndroidTimerHost();
    await host.send({ command: 'start' });
    await settle();
    expect(native.scheduled).toHaveLength(0);

    native.permission = 'denied';
    await host.saveSettings(ALERTS_ON);
    await settle();
    expect(native.scheduled).toHaveLength(0);
  });

  it('catches up on every phase that ended while the app was asleep', async () => {
    const settings = { ...DEFAULT_SETTINGS, autoStartBreaks: true, autoStartWork: true };
    const host = new AndroidTimerHost();
    await host.saveSettings(settings);
    await host.send({ command: 'start' });
    // Focus 25 + break 5 + focus 25 = 55 minutes, so 2 minutes into the next break.
    vi.setSystemTime(Date.now() + 57 * 60_000);
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    const { state } = await host.load();
    expect(state).toMatchObject({ phase: 'shortBreak', status: 'running', completedToday: 2 });
    expect(state.endTime! - Date.now()).toBe(3 * 60_000);
  });
});
