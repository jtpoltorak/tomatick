# Chrome Web Store listing

Everything to paste into the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
for Tomatick 1.0.0. Images are in [`images/`](images); regenerate them with
`node scripts/store-images.mjs` after UI changes.

## Store listing tab

**Title** (from the manifest): Tomatick: Focus Timer

**Summary** (from the manifest description, 132 characters max):

> A simple, customizable focus timer: focus sessions, short and long breaks, and optional sound and notification alerts.

**Category:** Productivity › Workflow & Planning

**Language:** English (United States)

**Description:**

```text
Tomatick is a simple, free focus timer. Work in 25-minute focus sessions with short breaks in between and a longer break after every four, the rhythm made popular by the Pomodoro Technique®. Change any of the times to suit you.

It's built to stay out of your way: one click to start, a countdown on the toolbar icon, and nothing to sign up for. Sounds, notifications, and the site blocker are all off until you turn them on.

Features
• Start, pause, restart, or skip with one click, or press Space
• A countdown badge on the toolbar icon, so you can see the time left at a glance
• Optional alerts when time's up: a gentle bell, chime, or beep, and/or a desktop notification
• Optional auto-start for breaks and focus sessions
• Today's completed sessions, and dots showing how close the long break is
• An optional site blocker that shows a "stay focused" page for the sites you choose, only during focus sessions
• A built-in guide to the technique and how to use it
• Light and dark themes that follow your system
• Alt+Shift+P opens Tomatick from anywhere in Chrome

Private by design
Tomatick has no account, no ads, no analytics, and no tracking. It makes no network requests. Your settings stay in your browser.

Free and open source
Tomatick is free and always will be. The code is open under the MIT License at https://github.com/jtpoltorak/tomatick. It was built with Claude Code, Anthropic's AI coding assistant.

Questions or ideas? Email tomatick.support@gmail.com.

Pomodoro® and the Pomodoro Technique® are registered trademarks of Francesco Cirillo. Tomatick isn't affiliated with or endorsed by Francesco Cirillo.
```

**Store icon:** `public/icons/icon-128.png`

**Screenshots** (1280×800, in this order):

1. `images/screenshot-1-focus.png`: the timer during a focus session
2. `images/screenshot-2-break.png`: a short break
3. `images/screenshot-3-settings.png`: settings
4. `images/screenshot-4-blocker.png`: the "stay focused" page
5. `images/screenshot-5-help.png`: the built-in help

**Small promo tile** (440×280): `images/promo-small.png`

**Marquee promo tile** (1400×560, optional): `images/promo-marquee.png`

**Official URL:** none (needs a verified domain; skip it)

**Homepage URL:** https://github.com/jtpoltorak/tomatick

**Support URL:** https://github.com/jtpoltorak/tomatick/issues

**Mature content:** No

## Privacy practices tab

**Single purpose:**

> A focus timer that alternates focus sessions and breaks.

**Permission justifications:**

| Permission                                       | Justification                                                                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `alarms`                                         | Wakes the extension when a focus session or break ends, so the timer keeps working while the popup is closed.                                          |
| `notifications`                                  | Shows the optional "time's up" notification, which is off until the user turns it on.                                                                  |
| `offscreen`                                      | Plays the optional "time's up" sound. Service workers can't play audio, so a hidden offscreen document does it.                                        |
| `storage`                                        | Remembers the timer and the user's settings.                                                                                                           |
| `declarativeNetRequestWithHostAccess` (optional) | Used only when the user turns on the site blocker: redirects the sites on their list to the extension's "stay focused" page during focus sessions.     |
| Host permission `<all_urls>` (optional)          | Requested only when the user turns on the site blocker, because the user can list any site; given back when they turn it off. No page content is read. |

**Are you using remote code?** No, I am not using remote code.

**Data usage:** check none of the data types. Then check all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/jtpoltorak/tomatick/blob/main/PRIVACY.md

## Distribution tab

- **Payments:** Free of charge
- **Visibility:** Public (or Unlisted first, if you'd like to try the store install before anyone can find it)
- **Distribution:** All regions
