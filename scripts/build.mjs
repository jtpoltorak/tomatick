// Builds the extension into dist/:
//   1. Angular builds the popup (index.html + main.js + styles.css) and copies public/.
//   2. esbuild bundles the background service worker, the offscreen sound player,
//      the site blocker's "stay focused" page, and the legal page.
//   3. The manifest version is synced from package.json.
// Flags: --watch rebuilds on change; --zip also writes a Web Store upload zip.
// --web builds the web app (PWA) into dist-web/ instead; see buildWeb() below.
import * as esbuild from 'esbuild';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { deflateRawSync } from 'node:zlib';

const watch = process.argv.includes('--watch');
const zip = process.argv.includes('--zip');
const web = process.argv.includes('--web');
const ng = (args) =>
  spawn('npx', ['ng', 'build', ...args], { stdio: 'inherit', shell: process.platform === 'win32' });

const workerOptions = {
  entryPoints: {
    background: 'src/background/background.ts',
    offscreen: 'src/offscreen/offscreen.ts',
    blocked: 'src/blocked/blocked.ts',
    legal: 'src/legal/legal.ts',
  },
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  logLevel: 'info',
};

async function syncManifestVersion() {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
  manifest.version = pkg.version;
  await writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  return pkg.version;
}

if (web) {
  await buildWeb();
  process.exit(0);
}

await rm('dist', { recursive: true, force: true });

if (watch) {
  const ctx = await esbuild.context(workerOptions);
  await ctx.watch();
  ng(['--watch', '--configuration', 'development']);
  console.log('Watching. After a rebuild, reload the extension in chrome://extensions.');
} else {
  const code = await new Promise((resolve) => ng([]).on('exit', resolve));
  if (code !== 0) process.exit(code ?? 1);
  await esbuild.build(workerOptions);
  const version = await syncManifestVersion();
  if (zip) {
    await warnAboutPlaceholders();
    await writeZip('dist', `tomatick-${version}.zip`);
  }
}

/**
 * The web app: the same Angular UI with an in-page timer engine, plus the
 * legal page and a service worker so it can be installed and work offline.
 * The output is a static site, ready for GitHub Pages or any static host.
 */
async function buildWeb() {
  await rm('dist-web', { recursive: true, force: true });
  const code = await new Promise((resolve) =>
    ng(['--configuration', 'production,web']).on('exit', resolve),
  );
  if (code !== 0) process.exit(code ?? 1);
  const { version } = JSON.parse(await readFile('package.json', 'utf8'));
  const shared = {
    outdir: 'dist-web',
    bundle: true,
    target: 'es2022',
    minify: true,
    logLevel: 'info',
  };
  await esbuild.build({ ...shared, entryPoints: { legal: 'src/legal/legal.ts' }, format: 'esm' });
  await esbuild.build({
    ...shared,
    entryPoints: { sw: 'src/web/sw.ts' },
    format: 'iife',
    define: { APP_VERSION: JSON.stringify(version) },
  });
}

/** The Help screen and legal page shouldn't ship with "YOUR NAME" in them. */
async function warnAboutPlaceholders() {
  const about = await readFile('src/shared/about.ts', 'utf8');
  const left = ['YOUR NAME', 'support@example.com'].filter((p) => about.includes(`'${p}'`));
  if (left.length) {
    console.warn(
      `\nWarning: fill in ${left.join(' and ')} in src/shared/about.ts before publishing.\n`,
    );
  }
}

/** Minimal zip writer (deflate, no dependencies) for the Web Store upload. */
async function writeZip(dir, outFile) {
  const files = [];
  const walk = async (d) => {
    for (const name of await readdir(d)) {
      const p = join(d, name);
      if ((await stat(p)).isDirectory()) await walk(p);
      else files.push(p);
    }
  };
  await walk(dir);

  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };

  const DOS_DATE = 0x21; // 1980-01-01, a fixed date keeps the zip reproducible
  const out = createWriteStream(outFile);
  const central = [];
  let offset = 0;
  for (const file of files) {
    const data = await readFile(file);
    const packed = deflateRawSync(data);
    const name = Buffer.from(relative(dir, file).split('\\').join('/'));
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    out.write(Buffer.concat([local, name, packed]));

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(DOS_DATE, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(packed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([entry, name]));
    offset += 30 + name.length + packed.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  out.end(Buffer.concat([cd, end]));
  await new Promise((resolve) => out.on('finish', resolve));
  console.log(`Wrote ${outFile} (${files.length} files)`);
}
