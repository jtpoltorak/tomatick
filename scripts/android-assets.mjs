// Generates the Android app's icons, splash screens and notification sounds
// into android/app/src/main/res. Only needed when the icon or sounds change:
//   npm i --no-save playwright && npx playwright install chromium && node scripts/android-assets.mjs
// (Needs Node 23.6+ to import the TypeScript sound definitions directly.)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { peakLevel, SOUNDS } from '../src/shared/sounds.ts';

const RES = 'android/app/src/main/res';
const svg = await readFile('assets/icon.svg', 'utf8');
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

// --- Icons and splash screens -------------------------------------------------
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

/** Renders the icon at `iconSize`, centered on a `width`x`height` canvas. */
async function render(path, width, height, iconSize, { background = '#fff', round = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  const sized = svg.replace('<svg ', `<svg width="${iconSize}" height="${iconSize}" `);
  const shape = round ? 'border-radius:50%;overflow:hidden;' : '';
  await page.setContent(
    `<body style="margin:0"><div style="width:${width}px;height:${height}px;${shape}` +
      `background:${background};display:grid;place-items:center">${sized}</div></body>`,
  );
  await page.screenshot({ path, omitBackground: true });
  await page.close();
}

for (const [name, scale] of Object.entries(DENSITIES)) {
  const dir = `${RES}/mipmap-${name}`;
  await mkdir(dir, { recursive: true });
  // Older Android: a full square icon and a round one.
  const legacy = 48 * scale;
  await render(`${dir}/ic_launcher.png`, legacy, legacy, Math.round(legacy * 0.8));
  await render(`${dir}/ic_launcher_round.png`, legacy, legacy, Math.round(legacy * 0.72), {
    round: true,
  });
  // Android 8+: a 108dp transparent layer the launcher masks to its own shape.
  // Only the middle 66dp is sure to show, so the icon stays inside it.
  const fg = 108 * scale;
  await render(`${dir}/ic_launcher_foreground.png`, fg, fg, Math.round(66 * scale), {
    background: 'transparent',
  });
}

const SPLASH = {
  'drawable/splash.png': [480, 320],
  ...Object.fromEntries(
    Object.entries({ mdpi: 320, hdpi: 480, xhdpi: 720, xxhdpi: 960, xxxhdpi: 1280 }).flatMap(
      ([name, short]) => {
        const long = { mdpi: 480, hdpi: 800, xhdpi: 1280, xxhdpi: 1600, xxxhdpi: 1920 }[name];
        return [
          [`drawable-port-${name}/splash.png`, [short, long]],
          [`drawable-land-${name}/splash.png`, [long, short]],
        ];
      },
    ),
  ),
};
for (const [file, [w, h]] of Object.entries(SPLASH)) {
  await mkdir(`${RES}/${file.split('/')[0]}`, { recursive: true });
  await render(`${RES}/${file}`, w, h, Math.round(Math.min(w, h) * 0.3));
}
await browser.close();

// --- Notification sounds ------------------------------------------------------
// The same notes the app plays with Web Audio, rendered to 16-bit mono WAV.
const RATE = 44100;
const OSC = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  triangle: (p) => 1 - 4 * Math.abs(((p + 0.25) % 1) - 0.5),
  square: (p) => (p % 1 < 0.5 ? 1 : -1),
};

function renderSound(notes, level) {
  const end = Math.max(...notes.map((n) => n.at + n.duration)) + 0.1;
  const out = new Float32Array(Math.ceil(end * RATE));
  for (const note of notes) {
    const start = Math.floor(note.at * RATE);
    const length = Math.floor(note.duration * RATE);
    for (let i = 0; i < length; i++) {
      const t = i / RATE;
      // 10ms attack, then an exponential decay to silence (as in sounds.ts).
      const env = t < 0.01 ? t / 0.01 : Math.pow(0.0001, (t - 0.01) / (note.duration - 0.01));
      out[start + i] += OSC[note.type](note.freq * t) * env * level;
    }
  }
  return out;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) =>
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2),
  );
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

await mkdir(`${RES}/raw`, { recursive: true });
for (const [id, notes] of Object.entries(SOUNDS)) {
  // Android sets the loudness from the phone's notification volume, so render
  // near full scale (the web app's levels leave headroom for several notes).
  await writeFile(`${RES}/raw/tomo_${id}.wav`, wav(renderSound(notes, peakLevel(id) * 2)));
}
// A silent channel sound, for "notifications on, sound off".
await writeFile(`${RES}/raw/tomo_silent.wav`, wav(new Float32Array(RATE / 10)));
console.log('Android icons, splash screens and sounds written to', RES);
