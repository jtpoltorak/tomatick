// The app version, from package.json. The extension can also read it from its
// manifest, but the web build has no manifest, so both builds can use this.
import { version } from '../../package.json';

export const APP_VERSION: string = version;
