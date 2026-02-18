import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_ZIP = path.join(OUT_DIR, 'BetterWeb-Extension.zip');

fs.mkdirSync(OUT_DIR, { recursive: true });

// ─────────────────────────────────────────────
// CRC32
// ─────────────────────────────────────────────
function crc32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crc32Table();

function crc32(buf) {
  const u8 = (buf instanceof Uint8Array) ? buf : new Uint8Array(buf);
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function u32le(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

function u16le(n) {
  const b = Buffer.allocUnsafe(2);
  b.writeUInt16LE(n & 0xFFFF, 0);
  return b;
}

function u32be(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

// ─────────────────────────────────────────────
// Minimal PNG generator (RGBA + zlib)
// ─────────────────────────────────────────────
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = u32be(d.length);
  const crc = u32be(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, crc]);
}

function buildIconPng(size) {
  const w = size;
  const h = size;
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const r = Math.min(w, h) / 2;
  const r2 = r * r;
  const innerR = r * 0.4;
  const innerR2 = innerR * innerR;

  const raw = Buffer.allocUnsafe((w * 4 + 1) * h);

  for (let y = 0; y < h; y++) {
    const rowStart = y * (w * 4 + 1);
    raw[rowStart] = 0; // no filter

    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;

      let R = 0, G = 0, B = 0, A = 0;

      if (d2 <= r2) {
        // Gradient mix between #4f8fff and #a855f7
        const t = Math.max(0, Math.min(1, (x + y) / (2 * (size - 1))));
        const r1 = 0x4f, g1 = 0x8f, b1 = 0xff;
        const r2c = 0xa8, g2c = 0x55, b2c = 0xf7;

        R = Math.round(r1 + (r2c - r1) * t);
        G = Math.round(g1 + (g2c - g1) * t);
        B = Math.round(b1 + (b2c - b1) * t);
        A = 255;

        if (d2 <= innerR2) {
          // Inner core
          R = 255; G = 255; B = 255;
          A = 235;
        }
      }

      const i = rowStart + 1 + x * 4;
      raw[i] = R;
      raw[i + 1] = G;
      raw[i + 2] = B;
      raw[i + 3] = A;
    }
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlib.deflateSync(raw, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// ─────────────────────────────────────────────
// Manifest rewrite for extension-only package
// ─────────────────────────────────────────────
function stripExtPrefix(p) {
  if (typeof p !== 'string') return p;
  return p.startsWith('extension/') ? p.slice('extension/'.length) : p;
}

function rewriteManifest(rootManifestText) {
  const m = JSON.parse(rootManifestText);

  if (m.chrome_url_overrides && m.chrome_url_overrides.newtab) {
    m.chrome_url_overrides.newtab = stripExtPrefix(m.chrome_url_overrides.newtab);
  }

  if (m.background && m.background.service_worker) {
    m.background.service_worker = stripExtPrefix(m.background.service_worker);
  }

  if (Array.isArray(m.content_scripts)) {
    m.content_scripts = m.content_scripts.map((cs) => {
      const next = { ...cs };
      if (Array.isArray(next.js)) next.js = next.js.map(stripExtPrefix);
      return next;
    });
  }

  if (m.action && m.action.default_popup) {
    m.action.default_popup = stripExtPrefix(m.action.default_popup);
  }

  if (Array.isArray(m.web_accessible_resources)) {
    m.web_accessible_resources = m.web_accessible_resources.map((wr) => {
      const next = { ...wr };
      if (Array.isArray(next.resources)) next.resources = next.resources.map(stripExtPrefix);
      return next;
    });
  }

  return JSON.stringify(m, null, 2) + '\n';
}

// ─────────────────────────────────────────────
// Minimal ZIP (store / no compression)
// ─────────────────────────────────────────────
function dosDateTime(d) {
  const dt = d instanceof Date ? d : new Date();
  const year = Math.max(1980, dt.getFullYear());
  const month = dt.getMonth() + 1;
  const day = dt.getDate();
  const hours = dt.getHours();
  const minutes = dt.getMinutes();
  const seconds = Math.floor(dt.getSeconds() / 2);
  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

function buildZip(entries) {
  const encoder = new TextEncoder();
  const now = dosDateTime(new Date());

  let offset = 0;
  const locals = [];
  const centrals = [];

  for (const e of entries) {
    const name = String(e.name || '').replace(/^\/+/, '').replace(/\\/g, '/');
    const nameBytes = Buffer.from(encoder.encode(name));
    let dataBytes;
    if (Buffer.isBuffer(e.data)) dataBytes = e.data;
    else if (typeof e.data === 'string') dataBytes = Buffer.from(e.data, 'utf8');
    else if (e.data instanceof Uint8Array) dataBytes = Buffer.from(e.data);
    else dataBytes = Buffer.from(new Uint8Array(e.data));

    const crc = crc32(dataBytes);

    // Local file header
    const local = Buffer.allocUnsafe(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); // store
    local.writeUInt16LE(now.dosTime, 10);
    local.writeUInt16LE(now.dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(dataBytes.length, 18);
    local.writeUInt32LE(dataBytes.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    nameBytes.copy(local, 30);

    locals.push(local, dataBytes);

    // Central directory header
    const central = Buffer.allocUnsafe(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(now.dosTime, 12);
    central.writeUInt16LE(now.dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(dataBytes.length, 20);
    central.writeUInt32LE(dataBytes.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBytes.copy(central, 46);

    centrals.push(central);

    offset += local.length + dataBytes.length;
  }

  const centralStart = offset;
  const centralSize = centrals.reduce((a, b) => a + b.length, 0);

  const end = Buffer.allocUnsafe(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, ...centrals, end]);
}

// ─────────────────────────────────────────────
// Build BetterWeb-Extension.zip
// ─────────────────────────────────────────────
function readText(p) {
  return fs.readFileSync(path.join(ROOT, p), 'utf8');
}

function readBin(p) {
  return fs.readFileSync(path.join(ROOT, p));
}

const prefix = 'BetterWeb-Extension/';

const extFiles = [
  'background.js',
  'content-bridge.js',
  'version.json',
  'newtab.html',
  'newtab.css',
  'newtab.js',
  'registry.js',
  'installer.js',
  'storage.js',
  'popup.html',
  'popup.css',
  'popup.js'
];

const rootManifest = readText('manifest.json');
const manifestOut = rewriteManifest(rootManifest);

const entries = [];
entries.push({ name: prefix + 'manifest.json', data: Buffer.from(manifestOut, 'utf8') });

// Icons (generated)
entries.push({ name: prefix + 'icons/icon16.png', data: buildIconPng(16) });
entries.push({ name: prefix + 'icons/icon48.png', data: buildIconPng(48) });
entries.push({ name: prefix + 'icons/icon128.png', data: buildIconPng(128) });

// Extension files at root of the packaged extension
for (const f of extFiles) {
  const p = path.join('extension', f);
  entries.push({ name: prefix + f, data: readText(p) });
}

// Build ZIP
const zipBuf = buildZip(entries);
fs.writeFileSync(OUT_ZIP, zipBuf);

console.log('[OK] Wrote', OUT_ZIP, '(' + zipBuf.length + ' bytes)');
