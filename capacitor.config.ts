import type { CapacitorConfig } from '@capacitor/cli';

// The Android app wraps the same Angular UI as the web app. `npm run build:android`
// builds it into dist-android/ and copies it into android/.
const config: CapacitorConfig = {
  // The app's permanent Play Store id. It can never change once published.
  appId: 'com.tomomomento.app',
  appName: 'Tomomomento',
  webDir: 'dist-android',
  android: {
    // Matches the light theme, so there's no flash while the app starts.
    backgroundColor: '#ffffff',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_timer',
      iconColor: '#e8590c',
    },
  },
};

export default config;
