# Tomatick

**Tomatick: Focus Timer** is a simple, customizable focus timer for Chrome, based on the
Pomodoro Technique®. It defaults to the classic technique: 25-minute focus sessions, 5-minute short breaks, and a 15-minute
long break after every 4 sessions. All of that is adjustable. Sound and
notification alerts and a site blocker are available but off until you turn
them on.

<p>
  <img src="docs/popup.png" alt="Timer" width="300" />
  <img src="docs/settings.png" alt="Settings" width="300" />
</p>

## Features

- One-click start, pause, restart, and skip. Press **Space** in the popup to start or pause.
- Click **Focus**, **Short break**, or **Long break** to jump to that timer.
- A countdown badge on the toolbar icon. It turns into a ✓ when a timer ends.
- Optional alerts when time's up: a sound (bell, chime, or digital beep, with volume) and/or a desktop notification.
- Optional auto-start for breaks and for focus sessions.
- A count of focus sessions done today, and dots showing progress toward the long break.
- **Alt+Shift+P** opens the popup.
- An optional site blocker: during focus sessions, sites on your list (YouTube, Reddit, and friends) show a "stay focused" page instead, with the time left. Breaks and pauses unblock them.
- Follows your system's light or dark theme.
- A **Help** screen (the ? in the popup) with a quick how-to, a contact address, and links to the privacy policy, terms of use, and credits.

<p>
  <img src="docs/blocked.png" alt="Blocked site page" width="600" />
</p>

## Development

Requires Node 22.22.3+ (or 24+) and Chrome 120+.

```bash
npm install
npm run build     # builds the extension into dist/
npm test          # unit and component tests (Vitest)
npm run watch     # rebuilds on change
npm run package   # builds and writes tomatick-<version>.zip for the Web Store
```

### Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the `dist/` folder.
4. Pin the Tomatick icon from the puzzle-piece menu so the badge is visible.

After a rebuild, click the reload arrow on the extension's card. The popup
picks up changes the next time you open it, but the background worker only
updates on reload.

## How it works

Think of the background service worker as a kitchen timer sitting on the
counter, and the popup as you glancing at it. Closing the popup doesn't stop
the timer. Chrome also "puts the counter away" (shuts the worker down) when
it's idle, so the timer never counts down in memory. Instead it writes down
_when_ the timer ends and asks Chrome to wake it at that moment.

| Path                           | What it is                                                                                                                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/timer.ts`          | The pure timer state machine (start, pause, reset, next phase). No `chrome.*` calls, so it's easy to test.                                                                                                                                                       |
| `src/background/background.ts` | The service worker. Owns the timer state in `chrome.storage.local`, schedules a `chrome.alarms` alarm for the end time, updates the badge, and fires the alerts. Catches up on browser startup if a timer ended while Chrome was closed.                         |
| `src/offscreen/offscreen.ts`   | Service workers can't play audio, so the worker opens a hidden [offscreen document](https://developer.chrome.com/docs/extensions/reference/api/offscreen) to play the alert sound.                                                                               |
| `src/shared/blocker.ts`        | Site blocker helpers: cleaning up typed sites and deciding when to block. The worker turns a [declarativeNetRequest](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest) redirect rule on during focus sessions and off otherwise. |
| `src/blocked/blocked.ts`       | The "stay focused" page blocked sites redirect to. It shows the time left and offers a link back once the session ends.                                                                                                                                          |
| `src/shared/about.ts`          | The author name, support email, copyright year, and legal "last updated" date shown on the Help screen and legal page. Fill these in before publishing; `npm run package` warns until you do.                                                                    |
| `public/legal.html`            | The privacy policy, terms of use, and credits page, opened from Help. [PRIVACY.md](PRIVACY.md) and [TERMS.md](TERMS.md) carry the same text for the Web Store; change them together.                                                                             |
| `src/shared/sounds.ts`         | The alert sounds, synthesized with the Web Audio API (no audio files).                                                                                                                                                                                           |
| `src/popup/`                   | The Angular popup. `PomodoroStore` mirrors storage into signals and sends commands to the worker; `TimerView` and `SettingsView` are the two screens.                                                                                                            |
| `public/`                      | `manifest.json`, icons, and the small static pages, copied into `dist/` as-is.                                                                                                                                                                                   |
| `scripts/build.mjs`            | Runs `ng build` for the popup, then esbuild for the worker and offscreen script.                                                                                                                                                                                 |

Settings are saved to `chrome.storage.sync`, so they follow your Chrome profile.

## Publishing to the Chrome Web Store

At install, the extension only asks for permissions Chrome shows no install
warning for. The site blocker's access to sites is an optional permission
Chrome asks for only when someone turns the blocker on, and it's handed back
when they turn it off. There's no remote code, network requests, or data
collection, which keeps review straightforward.

1. Keep "Pomodoro" out of the extension's name and store title: Pomodoro® is a registered trademark of Francesco Cirillo, whose [trademark guidelines](https://www.pomodorotechnique.com/pomodoro-trademark-guidelines/) don't allow it in product names. Describing the technique is fine with the ® and the not-affiliated note (see Help and `legal.html#credits`).
1. Fill in your name and support email in `src/shared/about.ts`, `PRIVACY.md`, and `TERMS.md`.
1. Bump `version` in `package.json` (the build copies it into the manifest).
1. Run `npm run package` and upload the zip it writes.
1. Register at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) (one-time $5 fee). Use the support email you want to keep: the account's email can't be changed later. Turn on 2-step verification for the Google account, and declare yourself a **non-trader** (you're an individual, not a business).
1. Listing assets: at least one 1280x800 screenshot, a 440x280 promo tile, and the 128px icon (`public/icons/icon-128.png`).
1. Privacy tab: privacy policy URL `https://github.com/jtpoltorak/tomatick/blob/main/PRIVACY.md`. Certify that no user data is collected. Single purpose: "A focus timer that alternates focus sessions and breaks." Permission justifications:
   - `alarms`: wake the extension when a focus session or break ends.
   - `notifications`: show the optional "time's up" notification.
   - `offscreen`: play the optional "time's up" sound, since service workers can't play audio.
   - `storage`: remember the timer and the user's settings.
   - `declarativeNetRequestWithHostAccess` and `<all_urls>` (both optional, requested only when the user turns on the site blocker): redirect the sites the user listed to the extension's "stay focused" page during focus sessions.
