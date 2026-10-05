# Privacy policy: Tomatick (Pomodoro Focus Timer)

Tomatick does not collect, transmit, sell, or share any personal
data.

- The extension makes no network requests.
- Timer state and your settings are stored with Chrome's storage API. Settings
  use `chrome.storage.sync`, so if Chrome Sync is on, Google syncs them between
  your own signed-in browsers; the extension's author never receives them.
- Alert sounds are generated on your device.
- The optional site blocker needs Chrome's permission to redirect pages, which
  it asks for only when you turn it on and gives back when you turn it off.
  It compares page addresses against your list of blocked sites inside
  Chrome, using Chrome's declarativeNetRequest rules. It doesn't read page
  content, and it doesn't record or send your browsing history anywhere. Your
  blocked-site list is stored with your other settings.
- No analytics, tracking, or third-party code is included.

Uninstalling the extension deletes all of its stored data.
