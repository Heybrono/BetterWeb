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

if (!isWhatsApp()) return;

const STYLE_ID = 'bw-wa-galaxy-style';
const PANEL_ID = 'bw-wa-galaxy-panel';
const FAB_ID = 'bw-wa-galaxy-fab';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;

  const css = [
    '/* BetterWeb WhatsApp Galaxy Look+ V4.0 (True RGB Edition) */',
    '@keyframes bwWaRgbHue { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }',
    '@keyframes bwRgbBgMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }',
    ':root { --bw-wa-bg: #0b0f19; --bw-wa-g: linear-gradient(135deg, #4f8fff, #a855f7); }',
    'html[data-bw-wa-theme="galaxy"] { --bw-wa-bg: #030014; --bw-wa-g: linear-gradient(135deg, #4f8fff, #a855f7, #22d3ee); }',
    'html[data-bw-wa-theme="midnight"] { --bw-wa-bg: #000000; --bw-wa-g: linear-gradient(135deg, #1e293b, #334155, #475569); }',
    'html[data-bw-wa-theme="cyberpunk"] { --bw-wa-bg: #050510; --bw-wa-g: linear-gradient(135deg, #fcee0a, #00f0ff, #ff003c); }',
    'html[data-bw-wa-theme="sakura"] { --bw-wa-bg: #1a0505; --bw-wa-g: linear-gradient(135deg, #ffb7b2, #ff9aa2, #ffdac1); }',
    'html[data-bw-wa-theme="aurora"] { --bw-wa-bg: #020617; --bw-wa-g: linear-gradient(135deg, #22c55e, #22d3ee, #a855f7); }',
    'html[data-bw-wa-theme="sunset"] { --bw-wa-bg: #1a0b0b; --bw-wa-g: linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6); }',
    'html[data-bw-wa-theme="matrix"] { --bw-wa-bg: #000500; --bw-wa-g: linear-gradient(135deg, #00ff00, #003300); }',
    'html[data-bw-wa-theme="rainbow"] { --bw-wa-bg: #000000; }',
    
    'body, #app { background: var(--bw-wa-bg) !important; background-color: var(--bw-wa-bg) !important; }',
    '#app > div::after { display: none !important; }',
    
    '/* The main container */',
    '#app > div > .two, #app > div > div[tabindex] {',
    '  background-color: rgba(15, 23, 42, 0.45) !important;',
    '  backdrop-filter: blur(24px) !important;',
    '  background-image: var(--bw-wa-g) !important;',
    '  background-origin: border-box !important;',
    '  background-clip: padding-box, border-box !important;',
    '  border: 1px solid rgba(255,255,255,0.08) !important;',
    '  border-radius: 16px !important;',
    '  box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 20px 80px rgba(0,0,0,0.8) !important;',
    '  margin: 10px auto !important;',
    '  width: calc(100% - 38px) !important;',
    '  height: calc(100% - 38px) !important;',
    '  max-width: 1600px !important;',
    '  transition: background-image 0.5s ease !important;',
    '}',
    
    '/* True RGB Background for Rainbow Theme */',
    'html[data-bw-wa-theme="rainbow"] body::before {',
    '  content: "";',
    '  position: fixed;',
    '  inset: -50%;',
    '  z-index: -1;',
    '  background: conic-gradient(from 180deg at 50% 50%, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff, #ff0000);',
    '  animation: bwWaRgbHue 8s linear infinite;',
    '  opacity: 0.55;',
    '  filter: blur(80px);',
    '}',
    'html[data-bw-wa-theme="rainbow"] #app > div > .two, html[data-bw-wa-theme="rainbow"] #app > div > div[tabindex] {',
    '  background-image: none !important;',
    '  background-color: rgba(0, 0, 0, 0.55) !important;',
    '  border-color: rgba(255, 255, 255, 0.15) !important;',
    '  box-shadow: 0 0 40px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05) !important;',
    '}',
    
    '/* Transparent inner backgrounds */',
    '[data-testid="conversation-panel-wrapper"], [data-testid="chat-list"], #pane-side, [data-testid="chat-list-background"] { background: transparent !important; }',
    '[data-asset-chat-background-light], [data-asset-chat-background-dark] { opacity: 0.04 !important; filter: invert(1) !important; }',
    
    '/* Headers and Footers */',
    'header, [data-testid="conversation-header"], [data-testid="chatlist-header"] { background: rgba(0,0,0,0.4) !important; backdrop-filter: blur(16px) !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }',
    'footer, [data-testid="compose-box"] { background: rgba(0,0,0,0.4) !important; backdrop-filter: blur(16px) !important; border-top: 1px solid rgba(255,255,255,0.08) !important; }',
    
    '/* Typography */',
    'h1, h2, h3, h4, span:not([data-icon]), div, p { color: #e2e8f0 !important; }',
    'span[data-testid="icon-search-alt"] { color: #94a3b8 !important; }',
    
    '/* Inputs */',
    'div[contenteditable="true"], [data-testid="chat-list-search"] { background: rgba(0,0,0,0.5) !important; color: #fff !important; border-radius: 20px !important; border: 1px solid rgba(255,255,255,0.15) !important; backdrop-filter: blur(8px); }',
    
    '/* Chat Bubbles */',
    '[data-testid^="msg-"] > div { background: rgba(255,255,255,0.08) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important; color: #fff !important; }',
    '[data-testid^="msg-"][class*="message-out"] > div { background: rgba(79, 143, 255, 0.15) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(79, 143, 255, 0.3) !important; }',
    
    '/* Rainbow Chat Bubbles */',
    'html[data-bw-wa-theme="rainbow"] [data-testid^="msg-"][class*="message-out"] > div {',
    '  background: linear-gradient(135deg, rgba(255, 0, 128, 0.25), rgba(128, 0, 255, 0.25)) !important;',
    '  border: 1px solid rgba(255, 0, 128, 0.5) !important;',
    '  animation: bwWaRgbHue 4s linear infinite !important;',
    '}',
    
    '/* UI Elements */',
    '#' + FAB_ID + '{position:fixed;top:14px;right:14px;z-index:99999;width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(10,5,20,0.65);backdrop-filter:blur(14px);color:#fff;font:800 16px system-ui;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;}',
    '#' + FAB_ID + ':hover{background:rgba(10,5,20,0.82);border-color:rgba(255,255,255,0.22);transform:scale(1.05);}',
    '#' + PANEL_ID + '{position:fixed;top:64px;right:14px;z-index:99999;width:min(340px,calc(100vw - 28px));max-height:80vh;overflow:auto;padding:14px;border-radius:18px;color:#fff;font-family:system-ui;border:1px solid rgba(255,255,255,0.12);background:rgba(5,5,10,0.9);backdrop-filter:blur(24px);box-shadow:0 30px 90px rgba(0,0,0,0.6);display:none;}',
    '#' + PANEL_ID + ' .bw-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;}',
    '#' + PANEL_ID + ' .bw-theme{padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);cursor:pointer;text-align:center;transition:background 0.2s;}',
    '#' + PANEL_ID + ' .bw-theme:hover{background:rgba(255,255,255,0.08);}',
    '#' + PANEL_ID + ' .bw-theme.active{border-color:rgba(168,85,247,0.6);box-shadow:0 0 12px rgba(168,85,247,0.2);background:rgba(168,85,247,0.1);}',
    '#' + PANEL_ID + ' .bw-p{height:30px;border-radius:6px;margin-bottom:6px;}',
    '#' + PANEL_ID + ' .bw-lbl{font-size:11px;font-weight:700;}',
    '#' + PANEL_ID + ' .bw-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:800;font-size:13px;letter-spacing:0.05em;color:#fff;}',
    '#' + PANEL_ID + ' .bw-x{cursor:pointer;padding:4px;opacity:0.7;font-size:16px;}',
    '#' + PANEL_ID + ' .bw-x:hover{opacity:1;}'
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
  if (panel) {
    panel.querySelectorAll('.bw-theme').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-theme') === k);
    });
  }
}

function ensurePanel() {
  if (document.getElementById(PANEL_ID)) return;
  const p = document.createElement('div');
  p.id = PANEL_ID;
  p.innerHTML =
    '<div class="bw-hd"><span>WHATSAPP THEMES</span><span class="bw-x">✕</span></div>' +
    '<div class="bw-grid">' +
    '<div class="bw-theme" data-theme="rainbow"><div class="bw-p" style="background:linear-gradient(270deg,#f00,#ff8000,#ff0,#0f0,#0ff,#00f,#8000ff,#f00);background-size:400% 400%;animation:bwRgbBgMove 5s linear infinite, bwWaRgbHue 3s linear infinite"></div><div class="bw-lbl">RGB Rainbow</div></div>' +
    '<div class="bw-theme" data-theme="galaxy"><div class="bw-p" style="background:linear-gradient(135deg,#4f8fff,#a855f7)"></div><div class="bw-lbl">Galaxy</div></div>' +
    '<div class="bw-theme" data-theme="cyberpunk"><div class="bw-p" style="background:linear-gradient(135deg,#fcee0a,#00f0ff)"></div><div class="bw-lbl">Cyberpunk</div></div>' +
    '<div class="bw-theme" data-theme="midnight"><div class="bw-p" style="background:linear-gradient(135deg,#1e293b,#000)"></div><div class="bw-lbl">Midnight</div></div>' +
    '<div class="bw-theme" data-theme="sakura"><div class="bw-p" style="background:linear-gradient(135deg,#ffb7b2,#ff9aa2)"></div><div class="bw-lbl">Sakura</div></div>' +
    '<div class="bw-theme" data-theme="aurora"><div class="bw-p" style="background:linear-gradient(135deg,#22c55e,#a855f7)"></div><div class="bw-lbl">Aurora</div></div>' +
    '<div class="bw-theme" data-theme="sunset"><div class="bw-p" style="background:linear-gradient(135deg,#f59e0b,#ec4899)"></div><div class="bw-lbl">Sunset</div></div>' +
    '<div class="bw-theme" data-theme="matrix"><div class="bw-p" style="background:linear-gradient(135deg,#00ff00,#003300)"></div><div class="bw-lbl">Matrix</div></div>' +
    '</div>' +
    '<div style="margin-top:12px;font-size:10px;color:rgba(255,255,255,0.4);text-align:center">V4.0 • True RGB Edition</div>';
  document.documentElement.appendChild(p);
  p.querySelector('.bw-x').addEventListener('click', () => p.style.display = 'none');
  p.querySelectorAll('.bw-theme').forEach(b => {
    b.addEventListener('click', () => applyTheme(b.getAttribute('data-theme')));
  });
}

function ensureFab() {
  if (document.getElementById(FAB_ID)) return;
  const b = document.createElement('button');
  b.id = FAB_ID;
  b.textContent = '🎨';
  b.title = 'Change WhatsApp Theme';
  b.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    ensurePanel();
    const p = document.getElementById(PANEL_ID);
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
    applyTheme(document.documentElement.getAttribute('data-bw-wa-theme') || 'galaxy');
  });
  document.documentElement.appendChild(b);
}

function togglePanel() {
  ensureStyle(); ensurePanel();
  const p = document.getElementById(PANEL_ID);
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
console.log('[BetterWeb] WhatsApp Galaxy Look+ V4.0 (True RGB) active');