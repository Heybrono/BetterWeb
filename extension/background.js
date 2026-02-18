/* =============================================
   BetterWeb — Background Service Worker
   by leon.cgn.lx
   Handles Mod Injection, Store Registry & Popup
   ============================================= */

const STORE_URL = 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/extensions.json';

// Remote version/lock config (controlled via GitHub file)
const VERSION_URL = 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/extension/version.json';
const VERSION_STATE_KEY = 'bwVersionStateV1';

// Sync state (chrome.storage.sync) — small metadata only
const SYNC_KEY = 'bwSyncStateV1';

// Built-in theme CSS fallback (used when GitHub fetch fails)
const BUILTIN_THEME_CSS = {
  'theme-midnight': `:root{--bg:#0f0518!important;--blue:#6d28d9!important;--purple:#a855f7!important;}body{background:var(--bg)!important;}`,
  'theme-matrix': `:root{--bg:#000!important;--blue:#00ff66!important;--purple:#00ff66!important;--t1:#b6ffcf!important;--t2:#4ade80!important;--t3:#16a34a!important;}body{background:var(--bg)!important;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace!important;}`,
  'theme-sunset': `:root{--bg:#2a1015!important;--blue:#f59e0b!important;--purple:#ec4899!important;}body{background:linear-gradient(#2a1015,#1f0b12)!important;}`
};

// Built-in mod code fallback (used when GitHub fetch fails)
// NOTE: This code is wrapped in wrapSafeCode() before injection.
// IMPORTANT: No nested template literals or ${...} in these strings,
// because this file itself uses template literals.
const BUILTIN_MOD_CODE = {
  'mod-focus': `
if (window.__bwFocusMode) return;
window.__bwFocusMode = true;

const css = [
  '/* BetterWeb Focus Mode */',
  '/* YouTube */',
  '#related, ytd-watch-next-secondary-results-renderer, ytd-rich-grid-renderer[is-two-columns], ytd-mini-guide-renderer { display:none !important; }',
  '/* Twitter/X */',
  '[aria-label="Timeline: Trending now"], [data-testid="sidebarColumn"], aside[role="complementary"] { display:none !important; }',
  '/* Generic sidebars */',
  'aside, .sidebar, .SideNav, .RightRail { display:none !important; }'
].join('\\n');

const s = document.createElement('style');
s.id = 'bw-focus-mode';
s.textContent = css;
(document.head || document.documentElement).appendChild(s);
console.log('[BetterWeb] Focus Mode active');
`,

  'mod-pip': `
if (window.__bwPip) return;
window.__bwPip = true;

function addBtn(video) {
  try {
    if (!video || video.__bwPipBtn) return;
    video.__bwPipBtn = true;

    const parent = video.parentElement;
    if (!parent) return;
    const cs = getComputedStyle(parent);
    if (cs.position === 'static') parent.style.position = 'relative';

    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'PiP';
    b.style.cssText = [
      'position:absolute',
      'top:10px',
      'right:10px',
      'z-index:2147483647',
      'background:rgba(0,0,0,0.55)',
      'color:#fff',
      'border:1px solid rgba(255,255,255,0.2)',
      'padding:6px 10px',
      'border-radius:10px',
      'font:600 12px system-ui,-apple-system,Segoe UI,sans-serif',
      'cursor:pointer',
      'backdrop-filter:blur(6px)'
    ].join(';');

    b.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (!document.pictureInPictureEnabled) return;
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          return;
        }
        await video.requestPictureInPicture();
      } catch (err) {
        console.warn('[BetterWeb] PiP failed:', err);
      }
    }, true);

    parent.appendChild(b);
  } catch (_) {}
}

function scan() {
  document.querySelectorAll('video').forEach(addBtn);
}

scan();
setInterval(scan, 2000);
console.log('[BetterWeb] Force PiP active');
`,

  'mod-whatsapp-galaxy': `
const MOD_ID = 'mod-whatsapp-galaxy';

if (window.__bwWaGalaxyLook && window.__bwModUiHandlers && window.__bwModUiHandlers[MOD_ID] && typeof window.__bwModUiHandlers[MOD_ID].open === 'function') {
  try { window.__bwModUiHandlers[MOD_ID].open(); } catch (_) {}
  return;
}
if (window.__bwWaGalaxyLook) return;
window.__bwWaGalaxyLook = true;

function isWhatsApp() {
  try { return location && location.hostname === 'web.whatsapp.com'; } catch (_) { return false; }
}

if (!isWhatsApp()) {
  return;
}

const STYLE_ID = 'bw-wa-galaxy-style';
const PANEL_ID = 'bw-wa-galaxy-panel';
const FAB_ID = 'bw-wa-galaxy-fab';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;

  const css = [
    'html[data-bw-wa-theme]{--bw-wa-app-a:0.34;}',
    'html[data-bw-wa-theme="galaxy"]{--bw-wa-a1:#4f8fff;--bw-wa-a2:#a855f7;--bw-wa-a3:#22d3ee;--bw-wa-bg:radial-gradient(ellipse 80% 50% at 20% 30%,rgba(79,143,255,0.10) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 20%,rgba(168,85,247,0.10) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 60% 90%,rgba(34,211,238,0.08) 0%,transparent 70%),linear-gradient(180deg,#030014 0%,#05001a 45%,#0b0030 100%);}',
    'html[data-bw-wa-theme="aurora"]{--bw-wa-a1:#22c55e;--bw-wa-a2:#22d3ee;--bw-wa-a3:#a855f7;--bw-wa-bg:radial-gradient(ellipse 80% 50% at 20% 30%,rgba(34,197,94,0.10) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 20%,rgba(34,211,238,0.10) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 60% 90%,rgba(168,85,247,0.08) 0%,transparent 70%),linear-gradient(180deg,#020617 0%,#001024 50%,#06142a 100%);}',
    'html[data-bw-wa-theme="sunset"]{--bw-wa-a1:#f59e0b;--bw-wa-a2:#ec4899;--bw-wa-a3:#a855f7;--bw-wa-bg:radial-gradient(ellipse 80% 50% at 20% 30%,rgba(245,158,11,0.11) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 20%,rgba(236,72,153,0.11) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 60% 90%,rgba(168,85,247,0.08) 0%,transparent 70%),linear-gradient(180deg,#140510 0%,#2a1015 55%,#3a1145 100%);}',
    'html[data-bw-wa-theme="matrix"]{--bw-wa-a1:#00ff66;--bw-wa-a2:#22c55e;--bw-wa-a3:#4ade80;--bw-wa-bg:radial-gradient(ellipse 80% 50% at 20% 30%,rgba(0,255,102,0.10) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 20%,rgba(34,197,94,0.10) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 60% 90%,rgba(74,222,128,0.07) 0%,transparent 70%),linear-gradient(180deg,#000 0%,#020a06 55%,#001a10 100%);}',

    'html{background:var(--bw-wa-bg)!important;background-attachment:fixed!important;}',
    'body{background:transparent!important;}',
    '#app, #app>div{background:transparent!important;}',

    '#app .app-wrapper-web, #app .two, #app>div, #app>div>div{border:1px solid transparent!important;border-radius:16px!important;overflow:hidden!important;background:linear-gradient(rgba(10,5,20,var(--bw-wa-app-a)),rgba(10,5,20,var(--bw-wa-app-a))) padding-box,linear-gradient(135deg,var(--bw-wa-a1),var(--bw-wa-a2),var(--bw-wa-a3)) border-box!important;backdrop-filter:blur(18px) saturate(130%);box-shadow:0 0 0 1px rgba(255,255,255,0.05),0 0 36px rgba(79,143,255,0.10),0 0 48px rgba(168,85,247,0.10);}',
    '#app header{background:rgba(255,255,255,0.06)!important;backdrop-filter:blur(14px) saturate(130%);border-bottom:1px solid rgba(255,255,255,0.08)!important;}',

   '#bw-wa-galaxy-fab{position:fixed;top:14px;right:14px;z-index:2147483647;width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(10,5,20,0.65);backdrop-filter:blur(14px) saturate(130%);color:#fff;font:800 16px system-ui;cursor:pointer;box-shadow:0 18px 60px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;}',
    '#bw-wa-galaxy-fab:hover{background:rgba(10,5,20,0.82);border-color:rgba(255,255,255,0.22);}',

    '#bw-wa-galaxy-panel{position:fixed;top:64px;right:14px;z-index:2147483647;width:min(380px,calc(100vw - 28px));max-height:min(520px,calc(100vh - 92px));overflow:auto;padding:14px;border-radius:18px;color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;border:1px solid transparent;background:linear-gradient(rgba(10,5,20,0.76),rgba(10,5,20,0.76)) padding-box,linear-gradient(135deg,var(--bw-wa-a1),var(--bw-wa-a2),var(--bw-wa-a3)) border-box;backdrop-filter:blur(18px) saturate(130%);box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 30px 90px rgba(0,0,0,0.55);display:none;}',
    '#bw-wa-galaxy-panel .bw-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}',
    '#bw-wa-galaxy-panel .bw-title{display:flex;align-items:center;gap:10px;min-width:0;}',
    '#bw-wa-galaxy-panel .bw-ico{width:36px;height:36px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);font-size:18px;flex-shrink:0;}',
    '#bw-wa-galaxy-panel .bw-name{font-weight:900;letter-spacing:0.04em;font-size:12px;}',
    '#bw-wa-galaxy-panel .bw-sub{font-size:11px;color:rgba(255,255,255,0.70);margin-top:2px;}',
    '#bw-wa-galaxy-panel .bw-x{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;}',
    '#bw-wa-galaxy-panel .bw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}',
    '#bw-wa-galaxy-panel .bw-theme{position:relative;display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;text-align:left;}',
    '#bw-wa-galaxy-panel .bw-theme:hover{background:rgba(255,255,255,0.08);}',
    '#bw-wa-galaxy-panel .bw-prev{height:40px;border-radius:10px;border:1px solid rgba(255,255,255,0.10);}',
    '#bw-wa-galaxy-panel .bw-lbl{font-weight:800;font-size:12px;}',
    '#bw-wa-galaxy-panel .bw-active{outline:2px solid rgba(255,255,255,0.22);box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 0 24px rgba(79,143,255,0.12);}',
    '#bw-wa-galaxy-panel .bw-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}',
    '#bw-wa-galaxy-panel .bw-btn{flex:1;min-width:140px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-weight:900;font-size:12px;cursor:pointer;}',
    '#bw-wa-galaxy-panel .bw-btn.danger{background:rgba(239,68,68,0.14);border-color:rgba(239,68,68,0.35);color:#fecaca;}',
    '#bw-wa-galaxy-panel .bw-note{margin-top:10px;font-size:11px;color:rgba(255,255,255,0.6);line-height:1.35;}'
  ].join('\\n');

  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
}

function applyTheme(key) {
  const k = key || 'galaxy';
  document.documentElement.setAttribute('data-bw-wa-theme', k);
  try { localStorage.setItem('bw-wa-theme', k); } catch (_) {}
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  panel.querySelectorAll('.bw-theme').forEach((b) => {
    b.classList.toggle('bw-active', b.getAttribute('data-theme') === k);
  });
}

function ensurePanel() {
  if (document.getElementById(PANEL_ID)) return;
  const p = document.createElement('div');
  p.id = PANEL_ID;
  p.setAttribute('role', 'dialog');
  p.innerHTML =
    '<div class="bw-hd"><div class="bw-title"><div class="bw-ico">' + String.fromCodePoint(0x1F4AC) + '</div><div style="min-width:0"><div class="bw-name">WHATSAPP GALAXY LOOK+</div><div class="bw-sub">Glass UI ' + String.fromCodePoint(0x2022) + ' RGB Outline ' + String.fromCodePoint(0x2022) + ' 4K gradients</div></div></div><button class="bw-x" type="button">' + String.fromCodePoint(0x2715) + '</button></div>' +
    '<div class="bw-grid">' +
    '<button class="bw-theme" type="button" data-theme="galaxy"><div class="bw-prev" style="background:linear-gradient(135deg,#4f8fff,#a855f7,#22d3ee)"></div><div class="bw-lbl">Galaxy</div></button>' +
    '<button class="bw-theme" type="button" data-theme="aurora"><div class="bw-prev" style="background:linear-gradient(135deg,#22c55e,#22d3ee,#a855f7)"></div><div class="bw-lbl">Aurora</div></button>' +
    '<button class="bw-theme" type="button" data-theme="sunset"><div class="bw-prev" style="background:linear-gradient(135deg,#f59e0b,#ec4899,#a855f7)"></div><div class="bw-lbl">Sunset</div></button>' +
    '<button class="bw-theme" type="button" data-theme="matrix"><div class="bw-prev" style="background:linear-gradient(135deg,#00ff66,#22c55e,#4ade80)"></div><div class="bw-lbl">Matrix</div></button>' +
    '</div>' +
    '<div class="bw-actions"><button class="bw-btn" type="button" id="bw-wa-hide">Hide</button><button class="bw-btn danger" type="button" id="bw-wa-disable">Disable Mod</button></div>' +
    '<div class="bw-note">Works on <b>web.whatsapp.com</b>.</div>';
  document.documentElement.appendChild(p);
  var x = p.querySelector('.bw-x');
  if (x) x.addEventListener('click', function() { p.style.display = 'none'; });
  var hide = p.querySelector('#bw-wa-hide');
  if (hide) hide.addEventListener('click', function() { p.style.display = 'none'; });
  p.querySelectorAll('.bw-theme').forEach(function(b) {
    b.addEventListener('click', function() { applyTheme(b.getAttribute('data-theme')); });
  });
  var dis = p.querySelector('#bw-wa-disable');
  if (dis) dis.addEventListener('click', function() {
    try { if (typeof chrome !== 'undefined' && chrome.runtime) chrome.runtime.sendMessage({ action: 'toggleExtension', id: MOD_ID, enabled: false }, function() {}); } catch (_) {}
    cleanup();
  });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') p.style.display = 'none'; });
}

function ensureFab() {
  if (document.getElementById(FAB_ID)) return;
  var b = document.createElement('button');
  b.id = FAB_ID;
  b.type = 'button';
  b.textContent = '✨';
  b.title = 'WhatsApp Galaxy Look+';
  b.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    togglePanel();
  }, true);
  document.documentElement.appendChild(b);
}

function togglePanel() {
  ensureStyle(); ensurePanel();
  var p = document.getElementById(PANEL_ID);
  if (!p) return;
  p.style.display = (getComputedStyle(p).display !== 'none') ? 'none' : 'block';
  applyTheme(document.documentElement.getAttribute('data-bw-wa-theme') || 'galaxy');
}

function cleanup() {
  try {
    var p = document.getElementById(PANEL_ID); if (p) p.remove();
    var s = document.getElementById(STYLE_ID); if (s) s.remove();
    var f = document.getElementById(FAB_ID); if (f) f.remove();
    document.documentElement.removeAttribute('data-bw-wa-theme');
    if (window.__bwModUiHandlers && window.__bwModUiHandlers[MOD_ID]) delete window.__bwModUiHandlers[MOD_ID];
  } catch (_) {}
}

try {
  var saved = localStorage.getItem('bw-wa-theme') || 'galaxy';
  ensureStyle(); applyTheme(saved); ensurePanel(); ensureFab();
} catch (_) {
  ensureStyle(); applyTheme('galaxy'); ensurePanel(); ensureFab();
}

window.__bwModUiHandlers = window.__bwModUiHandlers || {};
window.__bwModUiHandlers[MOD_ID] = { open: togglePanel, cleanup: cleanup };
console.log('[BetterWeb] WhatsApp Galaxy Look+ active');
`,


  'dev-mode-ultimate': `
if (window.__bwDevModeUltimate) {
  const existing = document.getElementById('bw-devmode-hud');
  if (existing) existing.style.display = existing.style.display === 'none' ? 'block' : 'none';
  return;
}
window.__bwDevModeUltimate = true;

const hud = document.createElement('div');
hud.id = 'bw-devmode-hud';
hud.style.cssText = 'position:fixed;bottom:18px;left:18px;width:340px;max-height:50vh;overflow:auto;z-index:2147483647;background:rgba(5,5,10,0.86);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.14);border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,0.55);color:#e5e7eb;font:12px ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;pointer-events:auto';

hud.innerHTML =
  '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.08)">' +
    '<div style="font-weight:900;letter-spacing:0.06em;font-size:11px;color:#a855f7">DEV MODE ULTIMATE</div>' +
    '<button type="button" id="bw-dm-x" style="width:28px;height:28px;border-radius:10px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer">' + String.fromCodePoint(0x2715) + '</button>' +
  '</div>' +
  '<div id="bw-dm-body" style="padding:10px 12px"></div>';

(document.documentElement || document.body).appendChild(hud);

const x = hud.querySelector('#bw-dm-x');
if (x) x.addEventListener('click', () => { hud.style.display = 'none'; });

const body = hud.querySelector('#bw-dm-body');

function fmtBytes(n) {
  if (!n || n < 1024) return String(n || 0) + ' B';
  const u = ['KB', 'MB', 'GB'];
  let v = n, i = -1;
  do { v /= 1024; i++; } while (v >= 1024 && i < u.length - 1);
  return v.toFixed(1) + ' ' + u[i];
}

function escH(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function update() {
  try {
    const media = Array.from(document.querySelectorAll('video,audio'));
    const scripts = Array.from(document.scripts || []);
    const links = Array.from(document.querySelectorAll('link[rel=stylesheet]'));
    const mem = performance && performance.memory ? performance.memory.usedJSHeapSize : null;

    const ml = media.slice(0, 10).map((m, i) =>
      '<div style="margin-top:4px;color:#93c5fd">' + m.tagName + '#' + (i+1) + '</div>' +
      '<div style="opacity:0.8;word-break:break-all">' + escH(m.currentSrc || m.src || '(no src)') + '</div>'
    ).join('');

    body.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
        '<span style="padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05)">scripts: <b>' + scripts.length + '</b></span>' +
        '<span style="padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05)">styles: <b>' + links.length + '</b></span>' +
        '<span style="padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05)">media: <b>' + media.length + '</b></span>' +
        (mem ? '<span style="padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05)">heap: <b>' + fmtBytes(mem) + '</b></span>' : '') +
      '</div>' +
      '<div style="font-weight:800;color:#10b981;margin-top:4px">Media (top 10)</div>' +
      (ml || '<div style="opacity:0.7;margin-top:6px">No media detected.</div>') +
      '<div style="opacity:0.6;margin-top:10px">URL: ' + escH(location.href) + '</div>';
  } catch (e) {
    body.textContent = 'Error: ' + (e && e.message ? e.message : String(e));
  }
}
update();
setInterval(update, 1500);
console.log('[BetterWeb] Dev Mode Ultimate active');
`,


  'mod-chatgpt-galaxy': `
var MOD_ID = 'mod-chatgpt-galaxy';
if (window.__bwChatGptGalaxy) return;
window.__bwChatGptGalaxy = true;

function isChatGpt() {
  try { return location.hostname === 'chatgpt.com' || location.hostname === 'chat.openai.com'; } catch(_) { return false; }
}
if (!isChatGpt()) return;

var SID = 'bw-chatgpt-galaxy-style';
if (document.getElementById(SID)) return;

var css = [
  'html,body{background:#030014!important;}',
  'body::before{content:"";position:fixed;inset:0;z-index:-1;background:radial-gradient(ellipse 80% 50% at 20% 30%,rgba(79,143,255,0.08) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 20%,rgba(168,85,247,0.06) 0%,transparent 70%),linear-gradient(180deg,#030014 0%,#05001a 45%,#0b0030 100%);pointer-events:none;}',
  'main,div[class*="react-scroll"]{background:transparent!important;}',
  'nav{background:rgba(3,0,20,0.85)!important;backdrop-filter:blur(12px)!important;border-right:1px solid rgba(255,255,255,0.06)!important;}',
  'nav a,nav button{color:rgba(255,255,255,0.75)!important;}',
  'nav a:hover,nav button:hover{background:rgba(255,255,255,0.06)!important;color:#fff!important;}',
  '[data-testid="conversation-turn-"] > div{background:transparent!important;}',
  '.markdown{color:#e2e8f0!important;}',
  '.markdown code{background:rgba(168,85,247,0.12)!important;border:1px solid rgba(168,85,247,0.2)!important;color:#d8b4fe!important;}',
  '.markdown pre{background:rgba(5,5,20,0.9)!important;border:1px solid rgba(255,255,255,0.08)!important;border-radius:12px!important;}',
  'textarea{background:rgba(255,255,255,0.04)!important;border:1px solid rgba(255,255,255,0.1)!important;color:#f1f5f9!important;border-radius:16px!important;}',
  'textarea:focus{border-color:rgba(79,143,255,0.4)!important;box-shadow:0 0 30px rgba(79,143,255,0.08)!important;}',
  'button[data-testid="send-button"]{background:linear-gradient(135deg,#4f8fff,#a855f7)!important;border:none!important;color:#fff!important;}',
  'header,div[class*="sticky"]{background:rgba(3,0,20,0.8)!important;backdrop-filter:blur(12px)!important;border-bottom:1px solid rgba(255,255,255,0.06)!important;}',
  '::selection{background:rgba(168,85,247,0.4)!important;}'
].join('\\n');

var s = document.createElement('style');
s.id = SID;
s.textContent = css;
(document.head || document.documentElement).appendChild(s);
console.log('[BetterWeb] ChatGPT Galaxy Theme active');
`,


  'mod-chatgpt-project': `
var MOD_ID = 'mod-chatgpt-project';
if (window.__bwChatGptProject && window.__bwModUiHandlers && window.__bwModUiHandlers[MOD_ID]) {
  try { window.__bwModUiHandlers[MOD_ID].open(); } catch(_) {}
  return;
}
if (window.__bwChatGptProject) return;
window.__bwChatGptProject = true;

function isChatGpt() {
  try { return location.hostname === 'chatgpt.com' || location.hostname === 'chat.openai.com'; } catch(_) { return false; }
}
if (!isChatGpt()) return;

var PID = 'bw-chatgpt-project-panel';
var PSID = 'bw-chatgpt-project-style';

function ensureStyle() {
  if (document.getElementById(PSID)) return;
  var s = document.createElement('style');
  s.id = PSID;
  s.textContent = [
    '#' + PID + '{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;width:min(680px,calc(100vw - 40px));max-height:min(700px,calc(100vh - 60px));overflow:auto;padding:0;border-radius:20px;color:#fff;font-family:system-ui,-apple-system,sans-serif;border:1px solid transparent;background:linear-gradient(rgba(8,4,24,0.94),rgba(8,4,24,0.94)) padding-box,linear-gradient(135deg,#4f8fff,#a855f7,#22d3ee) border-box;backdrop-filter:blur(24px);box-shadow:0 40px 120px rgba(0,0,0,0.6);display:none;}',
    '#' + PID + ' .bwp-hd{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);}',
    '#' + PID + ' .bwp-title{font-weight:900;font-size:14px;letter-spacing:0.04em;}',
    '#' + PID + ' .bwp-sub{font-size:11px;color:rgba(255,255,255,0.6);margin-top:3px;}',
    '#' + PID + ' .bwp-x{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:16px;}',
    '#' + PID + ' .bwp-body{padding:20px;}',
    '#' + PID + ' .bwp-input{width:100%;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#fff;font-size:14px;font-family:inherit;resize:vertical;min-height:80px;}',
    '#' + PID + ' .bwp-input:focus{outline:none;border-color:rgba(79,143,255,0.4);box-shadow:0 0 24px rgba(79,143,255,0.08);}',
    '#' + PID + ' .bwp-input::placeholder{color:rgba(255,255,255,0.35);}',
    '#' + PID + ' .bwp-hint{margin-top:10px;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5;}',
    '#' + PID + ' .bwp-modes{display:flex;gap:8px;margin:16px 0;}',
    '#' + PID + ' .bwp-mode{flex:1;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);cursor:pointer;text-align:center;}',
    '#' + PID + ' .bwp-mode:hover{background:rgba(255,255,255,0.08);}',
    '#' + PID + ' .bwp-mode.active{border-color:rgba(79,143,255,0.5);background:rgba(79,143,255,0.08);box-shadow:0 0 20px rgba(79,143,255,0.08);}',
    '#' + PID + ' .bwp-mode-icon{font-size:24px;margin-bottom:6px;}',
    '#' + PID + ' .bwp-mode-name{font-weight:800;font-size:12px;}',
    '#' + PID + ' .bwp-mode-desc{font-size:10px;color:rgba(255,255,255,0.55);margin-top:3px;}',
    '#' + PID + ' .bwp-go{width:100%;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#4f8fff,#a855f7);color:#fff;font-weight:900;font-size:14px;cursor:pointer;margin-top:12px;}',
    '#' + PID + ' .bwp-go:hover{transform:scale(1.01);box-shadow:0 8px 32px rgba(79,143,255,0.2);}',
    '#' + PID + ' .bwp-files{margin-top:16px;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;}',
    '#' + PID + ' .bwp-file{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);margin-bottom:8px;font-size:12px;font-family:ui-monospace,monospace;}',
    '#' + PID + ' .bwp-file-icon{color:#a855f7;}',
    '#' + PID + ' .bwp-file-name{flex:1;font-weight:700;}',
    '#' + PID + ' .bwp-file-size{color:rgba(255,255,255,0.5);}',
    '#' + PID + ' .bwp-dl{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:14px;border:none;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:900;font-size:13px;cursor:pointer;margin-top:12px;}',
    '#' + PID + ' .bwp-dl:hover{transform:scale(1.02);}',
    '#bw-chatgpt-project-overlay{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:none;}'
  ].join('\\n');
  (document.head || document.documentElement).appendChild(s);
}

var selectedMode = 'standard';

var PROMPTS = {
  standard: 'You are a project file generator. The user describes what they want built. Respond ONLY with the project files. For each file, output EXACTLY this format:\\n\\n--- FILENAME: path/to/file.ext ---\\n(the complete file content here)\\n--- END FILE ---\\n\\nDo NOT add explanations before or after. Output ALL files needed for a working project.',
  agent: 'You are an advanced AI coding agent. The user describes a project. You must:\\n1. Analyze requirements and break them into components\\n2. Plan the architecture (list files + purpose)\\n3. Generate ALL files using this EXACT format for each:\\n\\n--- FILENAME: path/to/file.ext ---\\n(complete file content)\\n--- END FILE ---\\n\\nAfter all files, add a brief summary of what you built and how to run it. Think step by step.'
};

function parseFiles(text) {
  var files = [];
  var re = /---\\s*FILENAME:\\s*(.+?)\\s*---([\\s\\S]*?)---\\s*END FILE\\s*---/gi;
  var m;
  while ((m = re.exec(text)) !== null) {
    var name = m[1].trim();
    var content = m[2];
    if (content.charAt(0) === '\\n') content = content.substring(1);
    if (content.charAt(content.length - 1) === '\\n') content = content.substring(0, content.length - 1);
    files.push({ name: name, content: content });
  }
  return files;
}

function createPanel() {
  if (document.getElementById(PID)) return;
  ensureStyle();

  var overlay = document.createElement('div');
  overlay.id = 'bw-chatgpt-project-overlay';
  document.documentElement.appendChild(overlay);

  var p = document.createElement('div');
  p.id = PID;
  p.innerHTML =
    '<div class="bwp-hd">' +
      '<div><div class="bwp-title">PROJECT BUILDER</div><div class="bwp-sub">Describe your project, get downloadable files</div></div>' +
      '<button class="bwp-x" type="button">' + String.fromCodePoint(0x2715) + '</button>' +
    '</div>' +
    '<div class="bwp-body">' +
      '<textarea class="bwp-input" id="bwp-desc" placeholder="Describe your project... e.g. A landing page with navbar, hero section, contact form, dark theme, responsive design" rows="4"></textarea>' +
      '<div class="bwp-hint">Tip: Be specific. Mention tech stack, features, and design preferences.</div>' +
      '<div class="bwp-modes">' +
        '<div class="bwp-mode active" data-mode="standard">' +
          '<div class="bwp-mode-icon">' + String.fromCodePoint(0x1F4E6) + '</div>' +
          '<div class="bwp-mode-name">Standard</div>' +
          '<div class="bwp-mode-desc">Quick file generation</div>' +
        '</div>' +
        '<div class="bwp-mode" data-mode="agent">' +
          '<div class="bwp-mode-icon">' + String.fromCodePoint(0x1F916) + '</div>' +
          '<div class="bwp-mode-name">Agent Mode+</div>' +
          '<div class="bwp-mode-desc">Plans + builds + explains</div>' +
        '</div>' +
      '</div>' +
      '<button class="bwp-go" type="button" id="bwp-go-btn">Generate Project</button>' +
      '<div class="bwp-files" id="bwp-files" style="display:none"></div>' +
    '</div>';

  document.documentElement.appendChild(p);

  overlay.addEventListener('click', closePanel);
  p.querySelector('.bwp-x').addEventListener('click', closePanel);

  p.querySelectorAll('.bwp-mode').forEach(function(b) {
    b.addEventListener('click', function() {
      selectedMode = b.getAttribute('data-mode');
      p.querySelectorAll('.bwp-mode').forEach(function(m) { m.classList.toggle('active', m === b); });
    });
  });

  var goBtn = p.querySelector('#bwp-go-btn');
  goBtn.addEventListener('click', function() {
    var desc = p.querySelector('#bwp-desc').value.trim();
    if (!desc) { p.querySelector('#bwp-desc').focus(); return; }
    injectPrompt(desc);
    closePanel();
  });

  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closePanel(); });
}

function openPanel() {
  createPanel();
  var p = document.getElementById(PID);
  var ov = document.getElementById('bw-chatgpt-project-overlay');
  if (p) p.style.display = 'block';
  if (ov) ov.style.display = 'block';
}

function closePanel() {
  var p = document.getElementById(PID);
  var ov = document.getElementById('bw-chatgpt-project-overlay');
  if (p) p.style.display = 'none';
  if (ov) ov.style.display = 'none';
}

function injectPrompt(desc) {
  var systemPrompt = PROMPTS[selectedMode] || PROMPTS.standard;
  var fullMsg = systemPrompt + '\\n\\nUser Project Request:\\n' + desc;

  var textarea = document.querySelector('textarea, #prompt-textarea, div[contenteditable="true"]');
  if (!textarea) return;

  if (textarea.tagName === 'TEXTAREA') {
    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeSetter.call(textarea, fullMsg);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    textarea.textContent = fullMsg;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  setTimeout(function() {
    var sendBtn = document.querySelector('button[data-testid="send-button"], form button[type="submit"], button[aria-label="Send"]');
    if (sendBtn && !sendBtn.disabled) sendBtn.click();
  }, 300);

  startFileScan();
}

var scanInterval = null;
function startFileScan() {
  if (scanInterval) clearInterval(scanInterval);
  var attempts = 0;
  scanInterval = setInterval(function() {
    attempts++;
    scanForFiles();
    if (attempts > 120) clearInterval(scanInterval);
  }, 2000);
}

function scanForFiles() {
  var msgs = document.querySelectorAll('.markdown, [data-message-author-role="assistant"] .prose, .agent-turn .markdown');
  if (!msgs.length) return;

  var lastMsg = msgs[msgs.length - 1];
  var text = lastMsg.textContent || lastMsg.innerText || '';

  var files = parseFiles(text);
  if (files.length === 0) return;

  clearInterval(scanInterval);
  showFileResults(files);
}

function showFileResults(files) {
  createPanel();
  var p = document.getElementById(PID);
  var ov = document.getElementById('bw-chatgpt-project-overlay');
  if (p) p.style.display = 'block';
  if (ov) ov.style.display = 'block';

  var container = p.querySelector('#bwp-files');
  container.style.display = 'block';
  container.innerHTML = '<div style="font-weight:900;font-size:13px;margin-bottom:12px">' + String.fromCodePoint(0x2705) + ' ' + files.length + ' files detected</div>';

  files.forEach(function(f) {
    var size = new Blob([f.content]).size;
    var sizeStr = size < 1024 ? size + ' B' : (size / 1024).toFixed(1) + ' KB';
    container.innerHTML += '<div class="bwp-file"><span class="bwp-file-icon">' + String.fromCodePoint(0x1F4C4) + '</span><span class="bwp-file-name">' + f.name + '</span><span class="bwp-file-size">' + sizeStr + '</span></div>';
  });

  var dlBtn = document.createElement('button');
  dlBtn.className = 'bwp-dl';
  dlBtn.textContent = String.fromCodePoint(0x1F4E5) + ' Download as ZIP';
  dlBtn.addEventListener('click', function() { downloadZip(files); });
  container.appendChild(dlBtn);
}

function downloadZip(files) {
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  script.onload = function() {
    var zip = new JSZip();
    files.forEach(function(f) { zip.file(f.name, f.content); });
    zip.generateAsync({ type: 'blob' }).then(function(blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'project.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  };
  document.head.appendChild(script);
}

openPanel();

window.__bwModUiHandlers = window.__bwModUiHandlers || {};
window.__bwModUiHandlers[MOD_ID] = { open: openPanel, cleanup: function() {
  var p = document.getElementById(PID); if (p) p.remove();
  var ov = document.getElementById('bw-chatgpt-project-overlay'); if (ov) ov.remove();
  var s = document.getElementById(PSID); if (s) s.remove();
}};
console.log('[BetterWeb] ChatGPT Project Builder active');
`,


  'mod-yt-cinema': `
if (window.__bwYtCinema) return;
window.__bwYtCinema = true;

function isYouTube() {
  try { return location.hostname === 'www.youtube.com' || location.hostname === 'youtube.com'; } catch(_) { return false; }
}
if (!isYouTube()) return;

var SID = 'bw-yt-cinema-style';
if (document.getElementById(SID)) return;

var css = [
  '/* BetterWeb YouTube Cinema Mode */',
  'html[bw-yt-cinema] ytd-watch-flexy:not([theater]) #secondary{display:none!important;}',
  'html[bw-yt-cinema] ytd-watch-flexy:not([theater]) #primary{max-width:100%!important;margin:0 auto!important;}',
  'html[bw-yt-cinema] ytd-watch-flexy:not([theater]) #player-container-outer{max-width:100%!important;}',
  'html[bw-yt-cinema] #masthead-container{background:rgba(0,0,0,0.85)!important;backdrop-filter:blur(10px)!important;}',
  'html[bw-yt-cinema] ytd-app{background:#0a0a0a!important;}',
  'html[bw-yt-cinema] #comments{max-width:900px!important;margin:0 auto!important;}',
  'html[bw-yt-cinema] #below{max-width:900px!important;margin:0 auto!important;}',
  'html[bw-yt-cinema] .ytp-gradient-bottom{opacity:0.3!important;}',
  '/* Ambient glow behind video */',
  'html[bw-yt-cinema] #movie_player{box-shadow:0 0 80px rgba(79,143,255,0.08),0 0 160px rgba(168,85,247,0.04)!important;border-radius:12px!important;overflow:hidden!important;}'
].join('\\n');

var s = document.createElement('style');
s.id = SID;
s.textContent = css;
document.head.appendChild(s);

document.documentElement.setAttribute('bw-yt-cinema', '');

var btn = document.createElement('button');
btn.id = 'bw-yt-cinema-btn';
btn.type = 'button';
btn.textContent = String.fromCodePoint(0x1F3AC) + ' Cinema';
btn.style.cssText = 'position:fixed;top:70px;right:16px;z-index:2147483647;padding:8px 14px;border-radius:10px;background:rgba(10,5,20,0.8);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);color:#fff;font:700 12px system-ui;cursor:pointer;';
btn.addEventListener('click', function() {
  document.documentElement.toggleAttribute('bw-yt-cinema');
  btn.style.borderColor = document.documentElement.hasAttribute('bw-yt-cinema') ? 'rgba(79,143,255,0.5)' : 'rgba(255,255,255,0.12)';
});
document.documentElement.appendChild(btn);

console.log('[BetterWeb] YouTube Cinema Mode active');
`,


  'mod-speed-reader': `
if (window.__bwSpeedReader) return;
window.__bwSpeedReader = true;

var PID = 'bw-speed-reader';
var SID = 'bw-speed-reader-style';

var s = document.createElement('style');
s.id = SID;
s.textContent = [
  '#' + PID + '{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;width:min(600px,90vw);padding:40px;border-radius:20px;background:rgba(5,5,15,0.92);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);box-shadow:0 30px 80px rgba(0,0,0,0.5);color:#fff;font-family:system-ui,-apple-system,sans-serif;display:none;text-align:center;}',
  '#' + PID + ' .sr-word{font-size:clamp(2rem,6vw,4rem);font-weight:800;letter-spacing:0.02em;min-height:5rem;display:flex;align-items:center;justify-content:center;margin:20px 0;}',
  '#' + PID + ' .sr-word .sr-mid{color:#a855f7;}',
  '#' + PID + ' .sr-controls{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px;}',
  '#' + PID + ' .sr-btn{padding:10px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-weight:800;font-size:13px;cursor:pointer;}',
  '#' + PID + ' .sr-btn:hover{background:rgba(255,255,255,0.1);}',
  '#' + PID + ' .sr-btn.primary{background:linear-gradient(135deg,#4f8fff,#a855f7);border:none;}',
  '#' + PID + ' .sr-speed{font-size:12px;color:rgba(255,255,255,0.6);margin-top:12px;}',
  '#' + PID + ' .sr-progress{width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,0.08);margin-top:16px;overflow:hidden;}',
  '#' + PID + ' .sr-progress-bar{height:100%;background:linear-gradient(90deg,#4f8fff,#a855f7);transition:width 0.15s linear;width:0%;}',
  '#' + PID + ' .sr-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:16px;}',
  '#bw-speed-reader-overlay{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);display:none;}'
].join('\\n');
(document.head || document.documentElement).appendChild(s);

var overlay = document.createElement('div');
overlay.id = 'bw-speed-reader-overlay';
document.documentElement.appendChild(overlay);

var panel = document.createElement('div');
panel.id = PID;
panel.innerHTML =
  '<button class="sr-x" type="button">' + String.fromCodePoint(0x2715) + '</button>' +
  '<div style="font-weight:900;font-size:14px;letter-spacing:0.04em;color:#a855f7">SPEED READER</div>' +
  '<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px">Select text on any page, then click the button</div>' +
  '<div class="sr-word" id="sr-word">Select text to begin</div>' +
  '<div class="sr-progress"><div class="sr-progress-bar" id="sr-bar"></div></div>' +
  '<div class="sr-controls">' +
    '<button class="sr-btn" type="button" id="sr-slower">- Slower</button>' +
    '<button class="sr-btn primary" type="button" id="sr-toggle">' + String.fromCodePoint(0x25B6) + ' Start</button>' +
    '<button class="sr-btn" type="button" id="sr-faster">Faster +</button>' +
  '</div>' +
  '<div class="sr-speed" id="sr-info">300 WPM</div>';
document.documentElement.appendChild(panel);

var words = [];
var idx = 0;
var wpm = 300;
var timer = null;
var running = false;

function getSelectedText() {
  var sel = window.getSelection();
  return sel ? sel.toString().trim() : '';
}

function highlightWord(w) {
  if (!w) return w;
  var mid = Math.floor(w.length / 3);
  if (mid < 1) mid = 0;
  return w.substring(0, mid) + '<span class="sr-mid">' + w.charAt(mid) + '</span>' + w.substring(mid + 1);
}

function showWord() {
  if (idx >= words.length) { stop(); return; }
  document.getElementById('sr-word').innerHTML = highlightWord(words[idx]);
  document.getElementById('sr-bar').style.width = ((idx + 1) / words.length * 100) + '%';
  idx++;
}

function start() {
  var text = getSelectedText();
  if (text) {
    words = text.split(/\\s+/).filter(function(w) { return w.length > 0; });
    idx = 0;
  }
  if (words.length === 0) {
    document.getElementById('sr-word').innerHTML = 'Select text first!';
    return;
  }
  running = true;
  document.getElementById('sr-toggle').textContent = String.fromCodePoint(0x23F8) + ' Pause';
  timer = setInterval(showWord, 60000 / wpm);
}

function stop() {
  running = false;
  clearInterval(timer);
  timer = null;
  document.getElementById('sr-toggle').textContent = String.fromCodePoint(0x25B6) + (idx >= words.length ? ' Restart' : ' Resume');
  if (idx >= words.length) idx = 0;
}

function close() {
  stop();
  panel.style.display = 'none';
  overlay.style.display = 'none';
}

function open() {
  panel.style.display = 'block';
  overlay.style.display = 'block';
  var text = getSelectedText();
  if (text) {
    words = text.split(/\\s+/).filter(function(w) { return w.length > 0; });
    idx = 0;
    document.getElementById('sr-word').innerHTML = words.length + ' words ready';
    document.getElementById('sr-bar').style.width = '0%';
  }
}

panel.querySelector('.sr-x').addEventListener('click', close);
overlay.addEventListener('click', close);
document.getElementById('sr-toggle').addEventListener('click', function() { running ? stop() : start(); });
document.getElementById('sr-slower').addEventListener('click', function() {
  wpm = Math.max(100, wpm - 50);
  document.getElementById('sr-info').textContent = wpm + ' WPM';
  if (running) { stop(); start(); }
});
document.getElementById('sr-faster').addEventListener('click', function() {
  wpm = Math.min(1000, wpm + 50);
  document.getElementById('sr-info').textContent = wpm + ' WPM';
  if (running) { stop(); start(); }
});
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') close(); });

open();

window.__bwModUiHandlers = window.__bwModUiHandlers || {};
window.__bwModUiHandlers['mod-speed-reader'] = { open: open, cleanup: function() {
  close();
  panel.remove(); overlay.remove();
  var ss = document.getElementById(SID); if (ss) ss.remove();
}};
console.log('[BetterWeb] Speed Reader active');
`
};

// Fallback Registry
const FALLBACK_EXTENSIONS = [
  {
    id: 'dev-mode-ultimate',
    name: 'Dev Mode Ultimate',
    publisher: 'Leon.cgn.lx',
    version: '3.0.0',
    description: 'The ultimate reconnaissance tool. Network Spy, Media Revealer, and Script Monitor with floating HUD.',
    privacy: 'Runs locally.',
    permissions: ['activeTab', 'scripting'],
    icon: '🛠️',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/dev-mode-ultimate.js'
  },
  {
    id: 'mod-focus',
    name: 'Focus Mode',
    publisher: 'Leon.cgn.lx',
    version: '1.2.0',
    description: 'Eliminates distractions. Hides trending feeds and sidebars.',
    privacy: 'CSS only.',
    permissions: ['activeTab'],
    icon: '🎯',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-focus.js'
  },
  {
    id: 'mod-pip',
    name: 'Force PiP',
    publisher: 'Leon.cgn.lx',
    version: '1.1.0',
    description: 'Adds a PiP button to every video player.',
    privacy: 'No data collection.',
    permissions: ['activeTab'],
    icon: '📺',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-pip.js'
  },
  {
    id: 'mod-whatsapp-galaxy',
    name: 'WhatsApp Galaxy Look+',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Galaxy glass UI + RGB outline + theme switcher for WhatsApp Web.',
    privacy: 'Runs locally on web.whatsapp.com.',
    permissions: ['activeTab'],
    icon: '💬',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-whatsapp-galaxy.js'
  },
  {
    id: 'mod-chatgpt-galaxy',
    name: 'ChatGPT Galaxy Theme',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Galaxy dark theme for ChatGPT — purple gradients, glass nav, neon code blocks.',
    privacy: 'CSS only on chatgpt.com.',
    permissions: ['activeTab'],
    icon: '🤖',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-chatgpt-galaxy.js'
  },
  {
    id: 'mod-chatgpt-project',
    name: 'ChatGPT Project Downloads',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Detects --- FILENAME / END FILE --- blocks and enables ZIP + single-file downloads after ChatGPT finishes.',
    privacy: 'Runs locally on chatgpt.com.',
    permissions: ['activeTab'],
    icon: '🏗️',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-chatgpt-project.js'
  },
  {
    id: 'mod-yt-cinema',
    name: 'YouTube Cinema Mode',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Full-width video, hidden sidebar, ambient glow, dark cinema experience for YouTube.',
    privacy: 'CSS only on youtube.com.',
    permissions: ['activeTab'],
    icon: '🎬',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-yt-cinema.js'
  },
  {
    id: 'mod-speed-reader',
    name: 'Speed Reader',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'RSVP speed reading — select text, read at 100-1000 WPM with focus highlighting. Works on any page.',
    privacy: 'Runs locally.',
    permissions: ['activeTab'],
    icon: '📖',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-speed-reader.js'
  },  {
    id: 'mod-chatgpt-autocontinue',
    name: 'ChatGPT Auto-Continue',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Auto-clicks “Continue generating” when ChatGPT pauses mid-answer.',
    privacy: 'Runs locally on chatgpt.com.',
    permissions: ['activeTab'],
    icon: '⏭️',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-chatgpt-autocontinue.js'
  },
  {
    id: 'mod-scroll-progress',
    name: 'Scroll Progress',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Top progress bar showing how far you scrolled. Click to dim.',
    privacy: 'Runs locally.',
    permissions: ['activeTab'],
    icon: '📊',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-scroll-progress.js'
  },
  {
    id: 'mod-untrack-links',
    name: 'Untrack Links',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Removes tracking parameters (utm_, fbclid, gclid, etc.) from links automatically.',
    privacy: 'Runs locally.',
    permissions: ['activeTab'],
    icon: '🧼',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-untrack-links.js'
  },
  {
    id: 'mod-site-notes',
    name: 'Site Notes',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Floating notes per website (saved per-domain). Great for research.',
    privacy: 'Saved locally per site.',
    permissions: ['activeTab'],
    icon: '📝',
    type: 'mod',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/mod-site-notes.js'
  },

  {
    id: 'theme-midnight',
    name: 'Midnight Purple',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Deep purple and black OLED aesthetic.',
    privacy: 'CSS only.',
    permissions: ['storage'],
    icon: '🟣',
    type: 'theme',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/theme-midnight.js'
  },
  {
    id: 'theme-matrix',
    name: 'Matrix Code',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Green terminal styling and monospace.',
    privacy: 'CSS only.',
    permissions: ['storage'],
    icon: '📟',
    type: 'theme',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/theme-matrix.js'
  },
  {
    id: 'theme-sunset',
    name: 'Sunset Bliss',
    publisher: 'Leon.cgn.lx',
    version: '1.0.0',
    description: 'Warm orange and pink gradients.',
    privacy: 'CSS only.',
    permissions: ['storage'],
    icon: '🌅',
    type: 'theme',
    entry: 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/store/mods/theme-sunset.js'
  }
];

// ─── Small Helpers ────────────────────────────
function isInjectableUrl(url) {
  if (!url) return false;
  const u = String(url);
  return !(
    u.startsWith('chrome://') ||
    u.startsWith('chrome-extension://') ||
    u.startsWith('edge://') ||
    u.startsWith('about:') ||
    u.startsWith('view-source:') ||
    u.startsWith('devtools:')
  );
}

function inferType(ext) {
  const id = ext && ext.id ? String(ext.id) : '';
  const target = ext && ext.target ? String(ext.target) : '';
  const entry = ext && ext.entry ? String(ext.entry) : '';
  const hasThemeCss = !!(ext && (ext.themeCss || ext.css));
  const code = ext && ext.code ? String(ext.code) : '';

  if (code && code.includes('bw-custom-theme')) return 'theme';
  if (id.startsWith('theme-')) return 'theme';
  if (hasThemeCss) return 'theme';
  if (target === 'newtab') return 'theme';
  if (entry.endsWith('.css')) return 'theme';
  if (entry.includes('theme-') || /\/themes?\//.test(entry)) return 'theme';

  const t = (ext && ext.type ? String(ext.type) : '').toLowerCase();
  if (t === 'theme' || t === 'mod') return t;
  if (target === 'content') return 'mod';
  return 'mod';
}

function normalizeExtension(raw) {
  const ext = raw || {};
  const id = String(ext.id || '').trim();
  if (!id) return null;
  const type = inferType({ ...ext, id });
  return {
    id,
    name: String(ext.name || id),
    publisher: String(ext.publisher || 'Unknown'),
    version: String(ext.version || '1.0.0'),
    description: String(ext.description || ''),
    privacy: String(ext.privacy || ''),
    permissions: Array.isArray(ext.permissions) ? ext.permissions : [],
    icon: ext.icon || '📦',
    type,
    target: ext.target || (type === 'theme' ? 'newtab' : 'content'),
    entry: String(ext.entry || '')
  };
}

function wrapSafeCode(code) {
  return "(function() { 'use strict'; try {\n" + (code || '') + "\n} catch(e) { console.error('[BetterWeb Mod Error]', e); } })();";
}

function looksLikeCss(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (t.startsWith(':root') || t.startsWith('body') || t.startsWith('html') || t.startsWith('/*')) return true;
  if (t.includes('{') && !t.includes('document.') && !t.includes('window.') && !t.includes('function')) return true;
  return false;
}

function unescapeJsString(s) {
  return String(s || '').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

function extractCssFromJs(jsText) {
  const txt = String(jsText || '');
  const tpl = txt.match(/(?:textContent|innerHTML|innerText)\s*(?:\+?=)\s*`([\s\S]*?)`/m);
  if (tpl && tpl[1] && tpl[1].trim()) return tpl[1];
  const sq = txt.match(/(?:textContent|innerHTML|innerText)\s*(?:\+?=)\s*'([\s\S]*?)'/m);
  if (sq && sq[1] && sq[1].trim()) return unescapeJsString(sq[1]);
  const dq = txt.match(/(?:textContent|innerHTML|innerText)\s*(?:\+?=)\s*"([\s\S]*?)"/m);
  if (dq && dq[1] && dq[1].trim()) return unescapeJsString(dq[1]);
  return '';
}

function deriveThemeCss(ext, fetchedText) {
  const id = ext && ext.id ? String(ext.id) : '';
  const raw = String(fetchedText || '');
  if (looksLikeCss(raw)) return raw;
  const extracted = extractCssFromJs(raw);
  if (extracted && extracted.trim()) return extracted;
  if (id && BUILTIN_THEME_CSS[id]) return BUILTIN_THEME_CSS[id];
  return '';
}

// ── Remote Version / Lock Helpers ───────────────────────────
function semverParts(v) {
  return String(v || '0.0.0').trim().split('.').map((x) => {
    const n = parseInt(x, 10);
    return Number.isFinite(n) ? n : 0;
  });
}

function semverCompare(a, b) {
  const pa = semverParts(a);
  const pb = semverParts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

async function refreshRemoteVersionState() {
  try {
    const res = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const state = await res.json();
    await chrome.storage.local.set({
      [VERSION_STATE_KEY]: {
        ...state,
        fetchedAt: Date.now()
      }
    });
    return state;
  } catch (_) {
    return null;
  }
}

async function getCachedVersionState() {
  try {
    const data = await chrome.storage.local.get([VERSION_STATE_KEY]);
    return data && data[VERSION_STATE_KEY] ? data[VERSION_STATE_KEY] : null;
  } catch (_) {
    return null;
  }
}

async function getLockState() {
  const st = await getCachedVersionState();
  const lock = st && st.lock ? st.lock : {};
  return {
    enabled: !!lock.enabled,
    reason: lock && lock.reason ? String(lock.reason) : '',
    github: st && st.github ? String(st.github) : 'https://github.com/Heybrono/BetterWeb',
    remoteVersion: st && st.version ? String(st.version) : ''
  };
}

// ── Sync Helpers ──────────────────────────────
async function readSyncState() {
  try { const data = await chrome.storage.sync.get([SYNC_KEY]); return data && data[SYNC_KEY] ? data[SYNC_KEY] : null; } catch (_) { return null; }
}

async function writeSyncState(state) {
  try { await chrome.storage.sync.set({ [SYNC_KEY]: state }); return true; } catch (_) { return false; }
}

async function buildLocalSyncState() {
  const data = await chrome.storage.local.get(['installed', 'activeTheme']);
  const installed = data.installed || {};
  const activeTheme = data.activeTheme || 'default';
  const items = Object.entries(installed).map(([id, item]) => {
    if (!item || typeof item !== 'object') return null;
    const t = inferType({ ...item, id });
    return { id, entry: item.entry || '', type: t, target: item.target || (t === 'theme' ? 'newtab' : 'content'), enabled: !!item.enabled, name: item.name || id, publisher: item.publisher || 'Unknown', version: item.version || '1.0.0', icon: item.icon || '📦' };
  }).filter(Boolean);
  return { v: 1, activeTheme, items, updatedAt: Date.now() };
}

let _syncWriteTimer = null;
function scheduleSyncWrite() {
  clearTimeout(_syncWriteTimer);
  _syncWriteTimer = setTimeout(() => { syncWriteFromLocal().catch(() => {}); }, 350);
}

async function syncWriteFromLocal() { await writeSyncState(await buildLocalSyncState()); }

async function syncApplyToLocal() {
  try {
    const state = await readSyncState();
    if (!state || !state.items) return;
    await migrateInstalledIfNeeded();
    const data = await chrome.storage.local.get(['installed']);
    const installed = data.installed || {};
    for (const it of state.items) {
      if (!it || !it.id) continue;
      if (!installed[it.id]) {
        await installExtension({ id: it.id, name: it.name, publisher: it.publisher, version: it.version, icon: it.icon, type: it.type, target: it.target, entry: it.entry, description: '', privacy: '', permissions: [] }, { suppressThemeActivation: true, skipSyncWrite: true });
      } else {
        if (typeof it.enabled === 'boolean') installed[it.id].enabled = !!it.enabled;
      }
    }
    await chrome.storage.local.set({ installed });
    if (state.activeTheme) await chrome.storage.local.set({ activeTheme: state.activeTheme });
    scheduleSyncWrite();
  } catch (_) {}
}

let _migrationPromise = null;
async function migrateInstalledIfNeeded() {
  if (_migrationPromise) return _migrationPromise;
  _migrationPromise = (async () => {
    const data = await chrome.storage.local.get(['installed', 'activeTheme', 'settings']);
    const installed = (data && data.installed) ? data.installed : {};
    let changed = false;
    for (const [id, item] of Object.entries(installed)) {
      if (!item || typeof item !== 'object') continue;
      if (item.id !== id) { item.id = id; changed = true; }
      const t = inferType({ ...item, id });
      if (item.type !== t) { item.type = t; changed = true; }
      if (!item.target) { item.target = (t === 'theme' ? 'newtab' : 'content'); changed = true; }
      if (t === 'theme' && !item.themeCss) {
        const css = deriveThemeCss(item, item.code || item.css || '');
        if (css) { item.themeCss = css; changed = true; }
        else if (BUILTIN_THEME_CSS[id]) { item.themeCss = BUILTIN_THEME_CSS[id]; changed = true; }
      }
      if (t === 'mod' && BUILTIN_MOD_CODE[id]) {
        const codeRaw = String(item.code || '');
        const needsRepair =
          !codeRaw.trim() ||
          codeRaw.length < 1200 ||
          (id === 'mod-whatsapp-galaxy' && (!codeRaw.includes('bw-wa-galaxy-style') || !codeRaw.includes('bw-wa-galaxy-panel'))) ||
          (id === 'mod-chatgpt-project' && !codeRaw.includes('--- FILENAME:'));

        if (needsRepair) {
          item.code = wrapSafeCode(BUILTIN_MOD_CODE[id]);
          changed = true;
        }
      }
    }
    let activeTheme = data.activeTheme;
    if (!activeTheme && data.settings && data.settings.activeTheme) activeTheme = data.settings.activeTheme;
    if (!activeTheme) activeTheme = 'default';
    if (data.activeTheme !== activeTheme) await chrome.storage.local.set({ activeTheme });
    if (changed) await chrome.storage.local.set({ installed });
  })().finally(() => { _migrationPromise = null; });
  return _migrationPromise;
}

// ─── Install Handler ───────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      settings: { devModeUltimate: false, mediaInspector: false, showMode: false, inputLogger: false },
      activeTheme: 'default',
      installed: {},
      inputLogs: []
    });
    syncApplyToLocal().catch(() => {});
  }
  try { await migrateInstalledIfNeeded(); } catch (_) {}
  refreshRemoteVersionState().catch(() => {});
  scheduleSyncWrite();
});

chrome.runtime.onStartup.addListener(() => {
  migrateInstalledIfNeeded().catch(() => {});
  syncApplyToLocal().catch(() => {});
  refreshRemoteVersionState().catch(() => {});
});

// ─── Tab Update Listener ───────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Mods are executed by the always-on content script (content-bridge.js).
  // No dynamic code execution (unsafe-eval) — MV3 compatible.
  if (changeInfo.status === 'complete' && tab && isInjectableUrl(tab.url)) {
    try { chrome.tabs.sendMessage(tabId, { action: 'bwRefreshMods' }).catch(() => {}); } catch (_) {}
  }
});

async function injectCodeIntoTab(tabId, safeCode, modName) {
  if (!safeCode) return;
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => { console.warn('[BetterWeb] Dynamic mod code execution is disabled (MV3 CSP). Mods run via content-bridge.js.'); },
    args: [safeCode]
  });
  chrome.tabs.sendMessage(tabId, { action: 'showToast', message: 'Mod Loaded: ' + (modName || 'Mod'), type: 'success' }).catch(() => {});
}

async function injectActiveMods(tabId) {
  try {
    await migrateInstalledIfNeeded();
    const data = await chrome.storage.local.get('installed');
    const installed = data.installed || {};
    const mods = Object.entries(installed).map(([id, item]) => ({ ...(item || {}), id })).filter((ext) => ext && ext.enabled && inferType(ext) === 'mod');
    for (const mod of mods) {
      try { if (mod.code) await injectCodeIntoTab(tabId, mod.code, mod.name); } catch (_) {}
    }
  } catch (err) { console.error('[BetterWeb] Injection error:', err); }
}

async function injectModsIntoOpenTabs() {
  try { const tabs = await chrome.tabs.query({}); for (const t of tabs) { if (t && t.id && isInjectableUrl(t.url)) injectActiveMods(t.id).catch(() => {}); } } catch (_) {}
}

async function broadcastModToggled(id, enabled) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (t && t.id && isInjectableUrl(t.url)) {
        chrome.tabs.sendMessage(t.id, { action: 'bwModToggled', id, enabled: !!enabled }).catch(() => {});
        if (!enabled) chrome.tabs.sendMessage(t.id, { action: 'bwModDisabled', id }).catch(() => {});
      }
    }
  } catch (_) {}
}

async function broadcastModDisabled(id) { return broadcastModToggled(id, false); }

// ─── Message Router ────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handlers = {
    fetchRegistry: () => fetchRegistry(),
    getRegistry: () => getRegistry(),
    getInstalled: () => getInstalled(),
    installExtension: () => installExtension(msg.ext),
    uninstallExtension: () => uninstallExtension(msg.id),
    toggleExtension: () => toggleExtension(msg.id, msg.enabled),
    runModNow: () => runModNow(msg.id, sender),
    getActiveTheme: () => getActiveTheme(),
    setActiveTheme: () => setActiveTheme(msg.themeId),
    toggleDevModeUltimate: () => toggleDevModeUltimate(msg.enabled),
    getInputLogs: () => getInputLogs(),
    clearInputLogs: () => clearInputLogs(),
    toggleMediaInspector: () => setToolSetting('mediaInspector', msg.enabled),
    toggleShowMode: () => setToolSetting('showMode', msg.enabled),
    toggleInputLogger: () => setToolSetting('inputLogger', msg.enabled),
    getVersionState: () => getVersionState(),
    refreshVersionState: () => refreshVersionState()
  };
  const handler = handlers[msg && msg.action];
  if (handler) {
    handler().then(sendResponse).catch((err) => { sendResponse({ success: false, error: err.message }); });
    return true;
  }
});

// ─── Registry & Store ──────────────────────────
async function fetchRegistry() {
  try {
    const resp = await fetch(STORE_URL, { cache: 'no-cache' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const extensions = (Array.isArray(data.extensions) ? data.extensions : []).map(normalizeExtension).filter(Boolean);
    await chrome.storage.local.set({ registry: extensions, registryFetchedAt: Date.now() });
    return { success: true, extensions };
  } catch (err) {
    return { success: true, extensions: FALLBACK_EXTENSIONS.map(normalizeExtension).filter(Boolean) };
  }
}

async function getRegistry() {
  const data = await chrome.storage.local.get(['registry']);
  const cached = Array.isArray(data.registry) ? data.registry : null;
  if (cached && cached.length) return { success: true, extensions: cached.map(normalizeExtension).filter(Boolean) };
  return { success: true, extensions: FALLBACK_EXTENSIONS.map(normalizeExtension).filter(Boolean) };
}

// ─── Installer Logic ───────────────────────────
async function getInstalled() {
  await migrateInstalledIfNeeded();
  const data = await chrome.storage.local.get('installed');
  return { success: true, installed: data.installed || {} };
}

async function installExtension(rawExt, options) {
  try {
    const lock = await getLockState();
    if (lock && lock.enabled) {
      return { success: false, error: 'Sperre aktiv: ' + (lock.reason || 'Wartung') };
    }

    const opts = options || {};
    const ext = normalizeExtension(rawExt);
    if (!ext) throw new Error('Invalid extension manifest');
    await migrateInstalledIfNeeded();
    const data = await chrome.storage.local.get('installed');
    const installed = data.installed || {};
    let fetchedText = '';
    if (ext.entry) {
      try { const resp = await fetch(ext.entry, { cache: 'no-cache' }); if (!resp.ok) throw new Error('HTTP ' + resp.status); fetchedText = await resp.text(); } catch (fetchErr) { fetchedText = ''; }
    }
    const nowIso = new Date().toISOString();
    const isThemeByCode = !!(fetchedText && fetchedText.includes('bw-custom-theme'));
    const themeExt = (ext.type === 'theme' || isThemeByCode) ? (ext.type === 'theme' ? ext : { ...ext, type: 'theme', target: 'newtab' }) : ext;
    if (themeExt.type === 'theme') {
      installed[themeExt.id] = { ...themeExt, enabled: true, installedAt: nowIso, themeCss: deriveThemeCss(themeExt, fetchedText) };
      await chrome.storage.local.set({ installed });
      if (!opts.suppressThemeActivation) await setActiveTheme(themeExt.id);
      if (!opts.skipSyncWrite) scheduleSyncWrite();
      return { success: true };
    }
    let code = fetchedText;
    if (!code) code = BUILTIN_MOD_CODE[ext.id] || 'console.log("[BetterWeb] ' + ext.name + ' active!");';
    if (code.length > 512000) throw new Error('Script exceeds 500KB limit');
    installed[ext.id] = { ...ext, code: wrapSafeCode(code), enabled: true, installedAt: nowIso };
    await chrome.storage.local.set({ installed });
    // Mods are executed by content scripts (MV3-safe). No dynamic injection needed.
    if (!opts.skipSyncWrite) scheduleSyncWrite();
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

async function uninstallExtension(id) {
  await migrateInstalledIfNeeded();
  const data = await chrome.storage.local.get('installed');
  const installed = data.installed || {};
  delete installed[id];
  const theme = await chrome.storage.local.get('activeTheme');
  if (theme.activeTheme === id) await chrome.storage.local.set({ activeTheme: 'default' });
  await chrome.storage.local.set({ installed });
  scheduleSyncWrite();
  broadcastModToggled(id, false).catch(() => {});
  return { success: true };
}

async function toggleExtension(id, enabled) {
  const lock = await getLockState();
  if (lock && lock.enabled) {
    return { success: false, error: 'Sperre aktiv: ' + (lock.reason || 'Wartung') };
  }

  await migrateInstalledIfNeeded();
  const data = await chrome.storage.local.get('installed');
  const installed = data.installed || {};
  const item = installed[id];
  if (item) {
    item.enabled = !!enabled;
    installed[id] = item;
    await chrome.storage.local.set({ installed });    if (inferType({ ...item, id }) === 'mod') broadcastModToggled(id, item.enabled).catch(() => {});
    scheduleSyncWrite();
  }
  return { success: true };
}

async function runModNow(id, sender) {
  try {
    const lock = await getLockState();
    if (lock && lock.enabled) {
      return { success: false, error: 'Sperre aktiv: ' + (lock.reason || 'Wartung') };
    }

    await migrateInstalledIfNeeded();
    const data = await chrome.storage.local.get('installed');
    const installed = data.installed || {};
    const item = installed[id];
    if (!item) return { success: false, error: 'Mod not installed' };
    if (inferType({ ...item, id }) !== 'mod') return { success: false, error: 'Not a mod' };    let tabId = sender && sender.tab && sender.tab.id;
    if (!tabId) { const tabs = await chrome.tabs.query({ active: true, currentWindow: true }); tabId = tabs && tabs[0] && tabs[0].id; }
    if (!tabId) return { success: false, error: 'No active tab' };
        try { chrome.tabs.sendMessage(tabId, { action: 'bwRunModNow', id }).catch(() => {}); } catch (_) {}
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}

// ─── Theme Management ──────────────────────────
async function getActiveTheme() {
  const data = await chrome.storage.local.get(['activeTheme', 'settings']);
  return { success: true, themeId: data.activeTheme || (data.settings && data.settings.activeTheme) || 'default' };
}

async function setActiveTheme(themeId) {
  await chrome.storage.local.set({ activeTheme: themeId || 'default' });
  scheduleSyncWrite();
  return { success: true };
}

// ─── Tool Helpers ──────────────────────────────
async function toggleDevModeUltimate(enabled) {
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) { if (t.url && isInjectableUrl(t.url)) chrome.tabs.sendMessage(t.id, { action: 'toggleDevModeUltimate', enabled }).catch(() => {}); }
  return { success: true };
}

async function getInputLogs() { const data = await chrome.storage.local.get('inputLogs'); return { success: true, logs: data.inputLogs || [] }; }
async function clearInputLogs() { await chrome.storage.local.set({ inputLogs: [] }); return { success: true }; }
async function setToolSetting(key, enabled) { const data = await chrome.storage.local.get('settings'); const settings = data.settings || {}; settings[key] = !!enabled; await chrome.storage.local.set({ settings }); return { success: true }; }
// ─── Version State API (for Update / Sperre UI) ──────────────
async function getVersionState() {
  const st = await getCachedVersionState();
  return { success: true, state: st };
}

async function refreshVersionState() {
  const st = await refreshRemoteVersionState();
  return { success: true, state: st || (await getCachedVersionState()) };
}
