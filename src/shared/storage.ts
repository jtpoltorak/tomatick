import {
  DEFAULT_SETTINGS,
  initialState,
  sanitizeSettings,
  type Settings,
  type TimerState,
} from './timer';

// Settings live in `sync` so they follow the user across their Chrome profiles.
// Timer state lives in `local` because it changes often and is device-specific.

export async function loadSettings(): Promise<Settings> {
  const { settings } = await chrome.storage.sync.get('settings');
  return sanitizeSettings({ ...DEFAULT_SETTINGS, ...(settings as Partial<Settings> | undefined) });
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ settings: sanitizeSettings(settings) });
}

export async function loadState(): Promise<TimerState> {
  const { state } = await chrome.storage.local.get('state');
  if (state) return state as TimerState;
  return initialState(await loadSettings(), Date.now());
}

export async function saveState(state: TimerState): Promise<void> {
  await chrome.storage.local.set({ state });
}
