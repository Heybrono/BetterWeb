/* =============================================
   BetterWeb — Content Bridge (MV3-safe)
   - Toast Notifications
   - Mod Control UI (top-right buttons)
   - Built-in Mod Runner (NO unsafe-eval)
   ============================================= */

(function () {
  'use strict';

  if (window.__betterWebBridge) return;
  window.__betterWebBridge = true;

  // ────────────────────────────────────────────
  // Small Utils
  // ────────────────────────────────────────────
  function escapeHtml(s) {
    const str = s == null ? '' : String(s);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function runtimeSend(msg) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (resp) => resolve(resp || null));
      } catch (_) {
        resolve(null);
      }
    });
  }

  function storageGet(keys) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(keys, resolve);
      } catch (_) {
        resolve({});
      }
    });
  }

  function safeOnChangedAddListener(fn) {
    try {
      chrome.storage.onChanged.addListener(fn);
    } catch (_) {
      // ignore
    }
  }

  function isChatGpt() {
    try {
      return location.hostname === 'chatgpt.com' || location.hostname === 'chat.openai.com';
    } catch (_) {
      return false;
    }
  }

  function isWhatsApp() {
    try {
      return location.hostname === 'web.whatsapp.com';
    } catch (_) {
      return false;
    }
  }

  function isYouTube() {
    try {
      return location.hostname === 'www.youtube.com' || location.hostname === 'youtube.com';
    } catch (_) {
      return false;
    }
  }

  function inferType(storageId, item) {
    const it = item || {};

    // Prefer strong signals over saved `type` (legacy installs may be wrong).
    const id = storageId ? String(storageId) : (it.id ? String(it.id) : '');
    const entry = it.entry ? String(it.entry) : '';
    const target = it.target ? String(it.target) : '';

    const code = it.code ? String(it.code) : '';
    if (code && code.includes('bw-custom-theme')) return 'theme';

    if (id.startsWith('theme-')) return 'theme';
    if (it.themeCss || it.css) return 'theme';
    if (target === 'newtab') return 'theme';
    if (entry.endsWith('.css')) return 'theme';
    if (entry.includes('theme-') || /\/themes?\//.test(entry)) return 'theme';

    const t = (it.type ? String(it.type) : '').toLowerCase();
    if (t === 'theme' || t === 'mod') return t;

    return 'mod';
  }

  // ────────────────────────────────────────────
  // Toast System
  // ────────────────────────────────────────────
  let toastContainer = null;

  function createToastContainer() {
    if (toastContainer) return;
    toastContainer = document.createElement('div');
    toastContainer.id = 'bw-toast-container';
    toastContainer.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:20px',
      'z-index:2147483647',
      'display:flex',
      'flex-direction:column',
      'gap:10px',
      'pointer-events:none'
    ].join(';');
    document.documentElement.appendChild(toastContainer);
  }

  function showToast(msg, type = 'info') {
    if (!toastContainer) createToastContainer();

    const toast = document.createElement('div');
    const colors = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error: 'linear-gradient(135deg, #ef4444, #b91c1c)',
      info: 'linear-gradient(135deg, #4f8fff, #2563eb)'
    };

    const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');

    toast.style.cssText = [
      'background:rgba(10,5,20,0.9)',
      'backdrop-filter:blur(10px)',
      'border:1px solid rgba(255,255,255,0.1)',
      'border-left:4px solid ' + (type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#4f8fff')),
      'color:#fff',
      'padding:12px 16px',
      'border-radius:8px',
      "font-family:'Segoe UI', system-ui, sans-serif",
      'font-size:13px',
      'box-shadow:0 4px 20px rgba(0,0,0,0.4)',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'transform:translateX(100%)',
      'opacity:0',
      'transition:all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      'pointer-events:all',
      'min-width:200px'
    ].join(';');

    toast.innerHTML =
      '<div style="width:20px;height:20px;border-radius:50%;background:' + (colors[type] || colors.info) + ';display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;">' + icon + '</div>' +
      '<span style="font-weight:500">' + escapeHtml(msg) + '</span>';

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // ────────────────────────────────────────────
  // Mod Control UI (Top-right)
  // ────────────────────────────────────────────
  const UI = {
    container: null,
    panel: null,
    currentModId: null,
    lastHash: ''
  };

  function ensureUiStyle() {
    if (document.getElementById('bw-mod-ui-style')) return;

    const s = document.createElement('style');
    s.id = 'bw-mod-ui-style';
    s.textContent = `
      #bw-mod-ui{position:fixed;top:14px;right:14px;z-index:2147483647;display:flex;flex-direction:column;gap:8px;pointer-events:none}
      #bw-mod-ui .bw-mod-btn{pointer-events:auto;width:42px;height:42px;border-radius:12px;background:rgba(10,5,20,0.72);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);box-shadow:0 10px 30px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;transition:transform .18s ease,background .18s ease,border-color .18s ease}
      #bw-mod-ui .bw-mod-btn:hover{transform:translateY(-1px) scale(1.03);background:rgba(10,5,20,0.86);border-color:rgba(255,255,255,0.22)}
      #bw-mod-ui .bw-mod-btn:active{transform:scale(0.98)}
      #bw-mod-ui .bw-mod-ico{font-size:18px;line-height:1}

      #bw-mod-panel{position:fixed;top:14px;right:64px;z-index:2147483647;width:min(360px,calc(100vw - 92px));max-height:min(480px,calc(100vh - 28px));overflow:auto;padding:14px;border-radius:16px;background:rgba(10,5,20,0.86);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.12);box-shadow:0 18px 60px rgba(0,0,0,0.45);pointer-events:auto;font-family:system-ui, -apple-system, 'Segoe UI', sans-serif;color:#fff}
      #bw-mod-panel .bw-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
      #bw-mod-panel .bw-title{display:flex;align-items:center;gap:10px;min-width:0}
      #bw-mod-panel .bw-ico{width:34px;height:34px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
      #bw-mod-panel .bw-name{font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #bw-mod-panel .bw-sub{font-size:11px;color:rgba(255,255,255,0.68);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #bw-mod-panel .bw-x{width:34px;height:34px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
      #bw-mod-panel .bw-x:hover{background:rgba(255,255,255,0.1)}
      #bw-mod-panel .bw-desc{font-size:12px;line-height:1.45;color:rgba(255,255,255,0.75);margin:10px 0 12px}
      #bw-mod-panel .bw-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
      #bw-mod-panel .bw-pill{font-size:11px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.82)}
      #bw-mod-panel .bw-actions{display:flex;gap:8px;flex-wrap:wrap}
      #bw-mod-panel .bw-btn{flex:1;min-width:120px;padding:10px;border-radius:12px;font-weight:800;font-size:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer}
      #bw-mod-panel .bw-btn:hover{background:rgba(255,255,255,0.1)}
      #bw-mod-panel .bw-btn.primary{background:linear-gradient(135deg,#4f8fff,#a855f7);border-color:rgba(255,255,255,0.18)}
      #bw-mod-panel .bw-btn.danger{background:rgba(239,68,68,0.14);border-color:rgba(239,68,68,0.35);color:#fecaca}
      #bw-mod-panel .bw-note{margin-top:10px;font-size:11px;color:rgba(255,255,255,0.6)}
    `;
    document.documentElement.appendChild(s);
  }

  function ensureUiContainer() {
    ensureUiStyle();
    if (UI.container && UI.container.isConnected) return UI.container;

    const c = document.createElement('div');
    c.id = 'bw-mod-ui';
    document.documentElement.appendChild(c);
    UI.container = c;
    return c;
  }

  function closePanel() {
    UI.currentModId = null;
    if (UI.panel) UI.panel.remove();
    UI.panel = null;
  }

  function openPanel(mod) {
    if (!mod || !mod.id) return;

    if (UI.currentModId === mod.id && UI.panel && UI.panel.isConnected) {
      closePanel();
      return;
    }

    closePanel();
    ensureUiStyle();

    const p = document.createElement('div');
    p.id = 'bw-mod-panel';
    p.innerHTML = `
      <div class="bw-hd">
        <div class="bw-title">
          <div class="bw-ico">${escapeHtml(mod.icon || '🧩')}</div>
          <div style="min-width:0">
            <div class="bw-name">${escapeHtml(mod.name || mod.id)}</div>
            <div class="bw-sub">${escapeHtml((mod.publisher || 'Unknown') + ' • v' + (mod.version || '1.0.0'))}</div>
          </div>
        </div>
        <button class="bw-x" type="button" aria-label="Close">✕</button>
      </div>
      <div class="bw-desc">${escapeHtml(mod.description || 'No description.')}</div>
      <div class="bw-meta">
        <span class="bw-pill">${escapeHtml(mod.id)}</span>
        <span class="bw-pill">enabled</span>
      </div>
      <div class="bw-actions">
        <button class="bw-btn primary" type="button" id="bw-run-now">Run now</button>
        <button class="bw-btn danger" type="button" id="bw-disable">Disable</button>
      </div>
      <div class="bw-note">Note: Some mods need a page reload to fully apply / undo.</div>
    `;

    document.documentElement.appendChild(p);

    const xBtn = p.querySelector('.bw-x');
    if (xBtn) xBtn.addEventListener('click', closePanel);

    const runBtn = p.querySelector('#bw-run-now');
    if (runBtn) {
      runBtn.addEventListener('click', async () => {
        runBtn.textContent = 'Running...';
        runBtn.disabled = true;
        const resp = await runtimeSend({ action: 'runModNow', id: mod.id });
        if (resp && resp.success) showToast('Mod executed: ' + (mod.name || mod.id), 'success');
        else showToast('Failed to run mod: ' + ((resp && resp.error) || 'Unknown error'), 'error');
        runBtn.textContent = 'Run now';
        runBtn.disabled = false;
      });
    }

    const disBtn = p.querySelector('#bw-disable');
    if (disBtn) {
      disBtn.addEventListener('click', async () => {
        disBtn.textContent = 'Disabling...';
        disBtn.disabled = true;
        const resp = await runtimeSend({ action: 'toggleExtension', id: mod.id, enabled: false });
        if (resp && resp.success) {
          showToast('Disabled: ' + (mod.name || mod.id), 'success');
          closePanel();
        } else {
          showToast('Failed to disable: ' + ((resp && resp.error) || 'Unknown error'), 'error');
          disBtn.textContent = 'Disable';
          disBtn.disabled = false;
        }
      });
    }

    UI.panel = p;
    UI.currentModId = mod.id;
  }

  function tryOpenCustomUi(mod) {
    try {
      const id = mod && mod.id ? String(mod.id) : '';
      if (!id) return false;
      const map = window.__bwModUiHandlers;
      const h = map && map[id];
      if (h && typeof h.open === 'function') {
        h.open(mod);
        return true;
      }
    } catch (_) {}
    return false;
  }

  function tryCleanupCustomUi(modId) {
    try {
      const id = modId ? String(modId) : '';
      if (!id) return;
      const map = window.__bwModUiHandlers;
      const h = map && map[id];
      if (h && typeof h.cleanup === 'function') h.cleanup();
    } catch (_) {}
  }

  function hashMods(mods) {
    return (mods || []).map((m) => `${m.id}:${m.enabled ? 1 : 0}`).join('|');
  }

  async function refreshModUi() {
    try {
      const data = await storageGet(['installed']);
      const installed = (data && data.installed) ? data.installed : {};

      const enabledMods = Object.entries(installed)
        .map(([storageId, item]) => ({ ...(item || {}), id: storageId }))
        .filter((x) => x && x.id && x.enabled && inferType(x.id, x) === 'mod');

      const h = hashMods(enabledMods);
      if (h === UI.lastHash) return;
      UI.lastHash = h;

      if (!enabledMods.length) {
        if (UI.container) UI.container.remove();
        UI.container = null;
        closePanel();
        return;
      }

      const c = ensureUiContainer();
      c.innerHTML = '';

      enabledMods.forEach((m) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bw-mod-btn';
        btn.title = (m.name || m.id) + ' — controls';
        btn.innerHTML = `<span class="bw-mod-ico">${escapeHtml(m.icon || '🧩')}</span>`;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!tryOpenCustomUi(m)) openPanel(m);
        });
        c.appendChild(btn);
      });

      if (UI.currentModId && !enabledMods.some((m) => m.id === UI.currentModId)) {
        closePanel();
      }
    } catch (_) {
      // ignore
    }
  }

  document.addEventListener('mousedown', (e) => {
    if (!UI.panel) return;
    const t = e.target;
    if (UI.panel.contains(t)) return;
    if (UI.container && UI.container.contains(t)) return;
    closePanel();
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  // ────────────────────────────────────────────
  // Built-in Mod Runner (MV3-safe)
  // ────────────────────────────────────────────
  const ModRunner = {
    initialized: false,
    enabled: new Set(),
    active: new Set()
  };

  function injectStyle(id, cssText) {
    const old = document.getElementById(id);
    if (old) return old;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = String(cssText || '');
    (document.head || document.documentElement).appendChild(s);
    return s;
  }

  function removeEl(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // ── Mod Implementations ──────────────────────
  const MODS = {};

  // 1) Focus Mode
  MODS['mod-focus'] = (function () {
    const SID = 'bw-focus-mode';
    const css = [
      '/* BetterWeb Focus Mode */',
      '/* YouTube */',
      '#related, ytd-watch-next-secondary-results-renderer, ytd-rich-grid-renderer[is-two-columns], ytd-mini-guide-renderer { display:none !important; }',
      '/* Twitter/X */',
      '[aria-label="Timeline: Trending now"], [data-testid="sidebarColumn"], aside[role="complementary"] { display:none !important; }',
      '/* Generic sidebars */',
      'aside, .sidebar, .SideNav, .RightRail { display:none !important; }'
    ].join('\n');

    function apply() { injectStyle(SID, css); }
    function cleanup() { removeEl(SID); }
    return { apply, cleanup };
  })();

  // 2) Force PiP
  MODS['mod-pip'] = (function () {
    const CLS = 'bw-pip-btn';
    let timer = null;

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
        b.className = CLS;
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

    function apply() {
      if (timer) return;
      scan();
      timer = setInterval(scan, 2000);
    }

    function cleanup() {
      if (timer) clearInterval(timer);
      timer = null;
      document.querySelectorAll('.' + CLS).forEach((b) => b.remove());
      document.querySelectorAll('video').forEach((v) => { try { delete v.__bwPipBtn; } catch (_) {} });
    }

    return { apply, cleanup };
  })();

  // 3) WhatsApp Galaxy Look+
  MODS['mod-whatsapp-galaxy'] = (function () {
    const MOD_ID = 'mod-whatsapp-galaxy';
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

        // Broader container selectors (WA UI changes often)
        '#app .app-wrapper-web, #app .two, #app>div, #app>div>div, #app [data-testid="chat-list"], #app [data-testid="conversation-panel-wrapper"]{border:1px solid transparent!important;border-radius:16px!important;overflow:hidden!important;background:linear-gradient(rgba(10,5,20,var(--bw-wa-app-a)),rgba(10,5,20,var(--bw-wa-app-a))) padding-box,linear-gradient(135deg,var(--bw-wa-a1),var(--bw-wa-a2),var(--bw-wa-a3)) border-box!important;backdrop-filter:blur(18px) saturate(130%);box-shadow:0 0 0 1px rgba(255,255,255,0.05),0 0 36px rgba(79,143,255,0.10),0 0 48px rgba(168,85,247,0.10);}',
        '#app header{background:rgba(255,255,255,0.06)!important;backdrop-filter:blur(14px) saturate(130%);border-bottom:1px solid rgba(255,255,255,0.08)!important;}',

        '#' + FAB_ID + '{position:fixed;top:14px;right:14px;z-index:2147483647;width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(10,5,20,0.65);backdrop-filter:blur(14px) saturate(130%);color:#fff;font:800 16px system-ui;cursor:pointer;box-shadow:0 18px 60px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;}',
        '#' + FAB_ID + ':hover{background:rgba(10,5,20,0.82);border-color:rgba(255,255,255,0.22);}',

        '#' + PANEL_ID + '{position:fixed;top:64px;right:14px;z-index:2147483647;width:min(380px,calc(100vw - 28px));max-height:min(520px,calc(100vh - 92px));overflow:auto;padding:14px;border-radius:18px;color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;border:1px solid transparent;background:linear-gradient(rgba(10,5,20,0.76),rgba(10,5,20,0.76)) padding-box,linear-gradient(135deg,var(--bw-wa-a1),var(--bw-wa-a2),var(--bw-wa-a3)) border-box;backdrop-filter:blur(18px) saturate(130%);box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 30px 90px rgba(0,0,0,0.55);display:none;}',
        '#' + PANEL_ID + ' .bw-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}',
        '#' + PANEL_ID + ' .bw-title{display:flex;align-items:center;gap:10px;min-width:0;}',
        '#' + PANEL_ID + ' .bw-ico{width:36px;height:36px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);font-size:18px;flex-shrink:0;}',
        '#' + PANEL_ID + ' .bw-name{font-weight:900;letter-spacing:0.04em;font-size:12px;}',
        '#' + PANEL_ID + ' .bw-sub{font-size:11px;color:rgba(255,255,255,0.70);margin-top:2px;}',
        '#' + PANEL_ID + ' .bw-x{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;}',
        '#' + PANEL_ID + ' .bw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}',
        '#' + PANEL_ID + ' .bw-theme{position:relative;display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#fff;cursor:pointer;text-align:left;}',
        '#' + PANEL_ID + ' .bw-theme:hover{background:rgba(255,255,255,0.08);}',
        '#' + PANEL_ID + ' .bw-prev{height:40px;border-radius:10px;border:1px solid rgba(255,255,255,0.10);}',
        '#' + PANEL_ID + ' .bw-lbl{font-weight:800;font-size:12px;}',
        '#' + PANEL_ID + ' .bw-active{outline:2px solid rgba(255,255,255,0.22);box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 0 24px rgba(79,143,255,0.12);}',
        '#' + PANEL_ID + ' .bw-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}',
        '#' + PANEL_ID + ' .bw-btn{flex:1;min-width:140px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-weight:900;font-size:12px;cursor:pointer;}',
        '#' + PANEL_ID + ' .bw-btn.danger{background:rgba(239,68,68,0.14);border-color:rgba(239,68,68,0.35);color:#fecaca;}',
        '#' + PANEL_ID + ' .bw-note{margin-top:10px;font-size:11px;color:rgba(255,255,255,0.6);line-height:1.35;}'
      ].join('\n');

      injectStyle(STYLE_ID, css);
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

      const x = p.querySelector('.bw-x');
      if (x) x.addEventListener('click', function () { p.style.display = 'none'; });
      const hide = p.querySelector('#bw-wa-hide');
      if (hide) hide.addEventListener('click', function () { p.style.display = 'none'; });

      p.querySelectorAll('.bw-theme').forEach(function (b) {
        b.addEventListener('click', function () { applyTheme(b.getAttribute('data-theme')); });
      });

      const dis = p.querySelector('#bw-wa-disable');
      if (dis) dis.addEventListener('click', function () {
        try { chrome.runtime.sendMessage({ action: 'toggleExtension', id: MOD_ID, enabled: false }, function () {}); } catch (_) {}
        cleanup();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') p.style.display = 'none';
      });
    }

    function ensureFab() {
      if (document.getElementById(FAB_ID)) return;
      const b = document.createElement('button');
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
      ensureStyle();
      ensurePanel();
      const p = document.getElementById(PANEL_ID);
      if (!p) return;
      p.style.display = (getComputedStyle(p).display !== 'none') ? 'none' : 'block';
      applyTheme(document.documentElement.getAttribute('data-bw-wa-theme') || 'galaxy');
    }

    function cleanup() {
      try {
        removeEl(PANEL_ID);
        removeEl(STYLE_ID);
        removeEl(FAB_ID);
        document.documentElement.removeAttribute('data-bw-wa-theme');
        if (window.__bwModUiHandlers && window.__bwModUiHandlers[MOD_ID]) delete window.__bwModUiHandlers[MOD_ID];
      } catch (_) {}
    }

    function apply() {
      if (!isWhatsApp()) return;
      try {
        const saved = localStorage.getItem('bw-wa-theme') || 'galaxy';
        ensureStyle();
        applyTheme(saved);
        ensurePanel();
        ensureFab();
      } catch (_) {
        ensureStyle();
        applyTheme('galaxy');
        ensurePanel();
        ensureFab();
      }

      window.__bwModUiHandlers = window.__bwModUiHandlers || {};
      window.__bwModUiHandlers[MOD_ID] = { open: togglePanel, cleanup };
    }

    return { apply, cleanup, open: togglePanel };
  })();

  // 4) ChatGPT Galaxy Theme
  MODS['mod-chatgpt-galaxy'] = (function () {
    const SID = 'bw-chatgpt-galaxy-style';
    const css = [
      'html,body{background:#030014!important;}',
      'body::before{content:"";position:fixed;inset:0;z-index:-1;background:radial-gradient(ellipse 80% 50% at 20% 30%,rgba(79,143,255,0.08) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 20%,rgba(168,85,247,0.06) 0%,transparent 70%),linear-gradient(180deg,#030014 0%,#05001a 45%,#0b0030 100%);pointer-events:none;}',
      'main,div[class*="react-scroll"]{background:transparent!important;}',
      'nav{background:rgba(3,0,20,0.85)!important;backdrop-filter:blur(12px)!important;border-right:1px solid rgba(255,255,255,0.06)!important;}',
      'nav a,nav button{color:rgba(255,255,255,0.75)!important;}',
      'nav a:hover,nav button:hover{background:rgba(255,255,255,0.06)!important;color:#fff!important;}',
      '.markdown{color:#e2e8f0!important;}',
      '.markdown code{background:rgba(168,85,247,0.12)!important;border:1px solid rgba(168,85,247,0.2)!important;color:#d8b4fe!important;}',
      '.markdown pre{background:rgba(5,5,20,0.9)!important;border:1px solid rgba(255,255,255,0.08)!important;border-radius:12px!important;}',
      'textarea{background:rgba(255,255,255,0.04)!important;border:1px solid rgba(255,255,255,0.1)!important;color:#f1f5f9!important;border-radius:16px!important;}',
      'textarea:focus{border-color:rgba(79,143,255,0.4)!important;box-shadow:0 0 30px rgba(79,143,255,0.08)!important;}',
      'button[data-testid="send-button"]{background:linear-gradient(135deg,#4f8fff,#a855f7)!important;border:none!important;color:#fff!important;}',
      'header,div[class*="sticky"]{background:rgba(3,0,20,0.8)!important;backdrop-filter:blur(12px)!important;border-bottom:1px solid rgba(255,255,255,0.06)!important;}',
      '::selection{background:rgba(168,85,247,0.4)!important;}'
    ].join('\n');

    function apply() { if (!isChatGpt()) return; injectStyle(SID, css); }
    function cleanup() { removeEl(SID); }

    return { apply, cleanup };
  })();

  // 5) ChatGPT Auto-Continue
  MODS['mod-chatgpt-autocontinue'] = (function () {
    let t = null;

    function findBtn() {
      const btns = Array.from(document.querySelectorAll('button'));
      for (const b of btns) {
        const tx = (b.textContent || '').trim();
        const ar = (b.getAttribute('aria-label') || '').trim();
        if (/continue generating/i.test(tx) || /continue generating/i.test(ar)) return b;
        if (/continue/i.test(tx) && /generat/i.test(tx)) return b;
      }
      return null;
    }

    function tick() {
      try {
        const b = findBtn();
        if (b && !b.disabled) b.click();
      } catch (_) {}
    }

    function apply() {
      if (!isChatGpt()) return;
      if (t) return;
      t = setInterval(tick, 1500);
      tick();
    }

    function cleanup() {
      if (t) clearInterval(t);
      t = null;
    }

    return { apply, cleanup };
  })();

  // 6) ChatGPT Project Downloads (NO Builder UI)
  // - On entering ChatGPT: shows a welcome popup with a copyable prompt template
  // - When ChatGPT outputs files in the required format: auto-opens a download popup
  //   (plus keeps a bottom download bar for quick access)
  MODS['mod-chatgpt-project'] = (function () {
    const MOD_ID = 'mod-chatgpt-project';

    const PSID = 'bw-bwp-style';
    const BAR_ID = 'bw-bwp-downloadbar';
    const PROG_ID = 'bw-bwp-progress';
    const WELCOME_ID = 'bw-bwp-welcome';
    const WELCOME_DISMISS_KEY = 'bw-bwp-welcome-dismissed-v1';
    const DLPOP_ID = 'bw-bwp-dlpopup';

    let scanInterval = null;
    let mo = null;
    let scanTimer = null;

    let lastFiles = [];
    let lastHash = '';
    let didShowWelcome = false;

    // We only open the download popup once the assistant finished generating,
    // and the detected file list is stable.
    let candidateFiles = null;
    let candidateHash = '';
    let settleTimer = null;

    function ensureStyle() {
      if (document.getElementById(PSID)) return;
      const s = document.createElement('style');
      s.id = PSID;
      s.textContent = [
        '/* BetterWeb — ChatGPT Project Downloads */',

        /* Bottom download bar */
        '#' + BAR_ID + '{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483647;width:min(980px,calc(100vw - 22px));display:none;gap:10px;align-items:center;padding:12px 12px;border-radius:18px;border:1px solid transparent;background:linear-gradient(rgba(10,5,20,0.72),rgba(10,5,20,0.72)) padding-box,linear-gradient(135deg,#4f8fff,#a855f7,#22d3ee) border-box;backdrop-filter:blur(18px) saturate(130%);box-shadow:0 30px 90px rgba(0,0,0,0.55);}',
        '#' + BAR_ID + ' .b{flex:1;min-width:0;display:flex;gap:10px;align-items:center;}',
        '#' + BAR_ID + ' .tag{flex:0 0 auto;font-weight:950;font-size:12px;letter-spacing:0.06em;color:#a855f7;}',
        '#' + BAR_ID + ' .meta{flex:0 0 auto;font-size:12px;color:rgba(255,255,255,0.66);white-space:nowrap;}',
        '#' + BAR_ID + ' select{flex:1;min-width:0;padding:12px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-weight:850;font-size:12px;outline:none;}',
        '#' + BAR_ID + ' .dl{flex:0 0 auto;padding:12px 16px;border-radius:14px;border:none;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:950;font-size:13px;cursor:pointer;}',
        '#' + BAR_ID + ' .dl:disabled{opacity:0.6;cursor:not-allowed;}',

        /* Fancy progress popup */
        '@keyframes bwpGlow{0%,100%{filter:drop-shadow(0 0 0 rgba(79,143,255,0.0))}50%{filter:drop-shadow(0 0 28px rgba(168,85,247,0.18))}}',
        '@keyframes bwpShimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}',
        '#' + PROG_ID + '{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);}',
        '#' + PROG_ID + ' .card{width:min(520px,calc(100vw - 24px));border-radius:22px;border:1px solid transparent;background:linear-gradient(rgba(8,4,24,0.92),rgba(8,4,24,0.92)) padding-box,linear-gradient(135deg,#4f8fff,#a855f7,#22d3ee) border-box;box-shadow:0 50px 140px rgba(0,0,0,0.65);padding:18px 18px 16px;animation:bwpGlow 2.2s ease-in-out infinite;}',
        '#' + PROG_ID + ' .hd{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;}',
        '#' + PROG_ID + ' .t{font-weight:950;letter-spacing:0.06em;font-size:13px;}',
        '#' + PROG_ID + ' .x{width:36px;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:16px;}',
        '#' + PROG_ID + ' .msg{margin-top:6px;font-size:12px;color:rgba(255,255,255,0.72);line-height:1.45;}',
        '#' + PROG_ID + ' .bar{margin-top:14px;height:10px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.10);}',
        '#' + PROG_ID + ' .bar > div{height:100%;width:0%;border-radius:999px;background:linear-gradient(90deg,#4f8fff,#a855f7,#22d3ee);background-size:200% 200%;animation:bwpShimmer 1.6s ease-in-out infinite;transition:width .12s linear;}',
        '#' + PROG_ID + ' .meta{display:flex;justify-content:space-between;gap:10px;margin-top:10px;font-size:11px;color:rgba(255,255,255,0.6);}',

        /* Welcome popup */
        '#' + WELCOME_ID + '{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);}',
        '#' + WELCOME_ID + ' .card{width:min(760px,calc(100vw - 24px));border-radius:22px;border:1px solid transparent;background:linear-gradient(rgba(8,4,24,0.92),rgba(8,4,24,0.92)) padding-box,linear-gradient(135deg,#4f8fff,#a855f7,#22d3ee) border-box;box-shadow:0 50px 140px rgba(0,0,0,0.65);padding:18px 18px 16px;}',
        '#' + WELCOME_ID + ' .hd{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;}',
        '#' + WELCOME_ID + ' .t{font-weight:950;letter-spacing:0.06em;font-size:13px;}',
        '#' + WELCOME_ID + ' .sub{margin-top:6px;font-size:12px;color:rgba(255,255,255,0.72);line-height:1.45;}',
        '#' + WELCOME_ID + ' .x{width:36px;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:16px;flex:0 0 auto;}',
        '#' + WELCOME_ID + ' .x:hover{background:rgba(255,255,255,0.1);}',
        '#' + WELCOME_ID + ' .code{margin-top:12px;padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;white-space:pre-wrap;word-break:break-word;color:rgba(255,255,255,0.86);}',
        '#' + WELCOME_ID + ' .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;align-items:center;justify-content:space-between;}',
        '#' + WELCOME_ID + ' .btn{padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-weight:950;font-size:13px;cursor:pointer;}',
        '#' + WELCOME_ID + ' .btn.primary{border:none;background:linear-gradient(135deg,#10b981,#059669);}',
        '#' + WELCOME_ID + ' .btn:hover{background:rgba(255,255,255,0.1);}',
        '#' + WELCOME_ID + ' .chk{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,0.65);user-select:none;}',
        '#' + WELCOME_ID + ' input[type="checkbox"]{width:16px;height:16px;}',

        /* Auto download popup (opens when files detected) */
        '#' + DLPOP_ID + '{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);}',
        '#' + DLPOP_ID + ' .card{width:min(760px,calc(100vw - 24px));border-radius:22px;border:1px solid transparent;background:linear-gradient(rgba(8,4,24,0.92),rgba(8,4,24,0.92)) padding-box,linear-gradient(135deg,#4f8fff,#a855f7,#22d3ee) border-box;box-shadow:0 50px 140px rgba(0,0,0,0.65);padding:18px 18px 16px;}',
        '#' + DLPOP_ID + ' .hd{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;}',
        '#' + DLPOP_ID + ' .t{font-weight:950;letter-spacing:0.06em;font-size:13px;}',
        '#' + DLPOP_ID + ' .sub{margin-top:6px;font-size:12px;color:rgba(255,255,255,0.72);line-height:1.45;}',
        '#' + DLPOP_ID + ' .x{width:36px;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:16px;flex:0 0 auto;}',
        '#' + DLPOP_ID + ' .x:hover{background:rgba(255,255,255,0.1);}',
        '#' + DLPOP_ID + ' .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;align-items:center;}',
        '#' + DLPOP_ID + ' select{flex:1;min-width:220px;padding:12px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-weight:850;font-size:12px;outline:none;}',
        '#' + DLPOP_ID + ' .btn{padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-weight:950;font-size:13px;cursor:pointer;}',
        '#' + DLPOP_ID + ' .btn.primary{border:none;background:linear-gradient(135deg,#10b981,#059669);}',
        '#' + DLPOP_ID + ' .btn:hover{background:rgba(255,255,255,0.1);}',
        '#' + DLPOP_ID + ' .pill{display:inline-flex;align-items:center;gap:8px;font-size:11px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.78);}',

        '@media (max-width:560px){',
        '#' + BAR_ID + '{flex-direction:column;align-items:stretch;}',
        '#' + BAR_ID + ' .b{width:100%;}',
        '#' + DLPOP_ID + ' .row{flex-direction:column;align-items:stretch;}',
        '#' + DLPOP_ID + ' select{min-width:0;width:100%;}',
        '}'
      ].join('\n');
      (document.head || document.documentElement).appendChild(s);
    }

    function parseFiles(text) {
      const files = [];
      const re = /---\s*FILENAME:\s*(.+?)\s*---([\s\S]*?)---\s*END FILE\s*---/gi;
      let m;
      while ((m = re.exec(text)) !== null) {
        const name = m[1].trim();
        let content = m[2];
        if (content.charAt(0) === '\n') content = content.substring(1);
        if (content.charAt(content.length - 1) === '\n') content = content.substring(0, content.length - 1);
        files.push({ name, content });
      }
      return files;
    }

    function filesHash(files) {
      const list = Array.isArray(files) ? files : [];
      return list.map((f) => String(f.name || '') + '#' + String((f.content || '').length)).join('|');
    }

    function mimeFromName(name) {
      const n = String(name || '').toLowerCase();
      if (n.endsWith('.html')) return 'text/html';
      if (n.endsWith('.css')) return 'text/css';
      if (n.endsWith('.js')) return 'text/javascript';
      if (n.endsWith('.json')) return 'application/json';
      if (n.endsWith('.md')) return 'text/markdown';
      if (n.endsWith('.txt')) return 'text/plain';
      return 'application/octet-stream';
    }

    function safeDownloadName(path) {
      const p = String(path || 'file.txt').replace(/\\/g, '/');
      return p.split('/').filter(Boolean).pop() || 'file.txt';
    }

    function downloadFile(file) {
      const name = safeDownloadName(file && file.name ? file.name : 'file.txt');
      const blob = new Blob([String(file && file.content ? file.content : '')], { type: mimeFromName(name) });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (_) {} }, 1500);
    }

    function ensureProgressUi() {
      if (document.getElementById(PROG_ID)) return;
      const wrap = document.createElement('div');
      wrap.id = PROG_ID;
      wrap.innerHTML =
        '<div class="card">' +
          '<div class="hd">' +
            '<div class="t" id="bwp-prog-title">Preparing download…</div>' +
            '<button class="x" type="button" aria-label="Close">✕</button>' +
          '</div>' +
          '<div class="msg" id="bwp-prog-msg">—</div>' +
          '<div class="bar"><div id="bwp-prog-bar"></div></div>' +
          '<div class="meta">' +
            '<div id="bwp-prog-left">0%</div>' +
            '<div id="bwp-prog-eta">ETA —</div>' +
          '</div>' +
        '</div>';
      document.documentElement.appendChild(wrap);
      const x = wrap.querySelector('.x');
      if (x) x.addEventListener('click', function () { wrap.style.display = 'none'; });
      wrap.addEventListener('click', function (e) {
        if (e.target === wrap) wrap.style.display = 'none';
      });
    }

    function showProgress(title, msg) {
      ensureProgressUi();
      const w = document.getElementById(PROG_ID);
      if (!w) return;
      w.style.display = 'flex';
      const t = document.getElementById('bwp-prog-title');
      const m = document.getElementById('bwp-prog-msg');
      const b = document.getElementById('bwp-prog-bar');
      const l = document.getElementById('bwp-prog-left');
      const e = document.getElementById('bwp-prog-eta');
      if (t) t.textContent = title || 'Preparing download…';
      if (m) m.textContent = msg || '';
      if (b) b.style.width = '0%';
      if (l) l.textContent = '0%';
      if (e) e.textContent = 'ETA —';
    }

    function setProgress(pct, msg, etaSec) {
      const b = document.getElementById('bwp-prog-bar');
      const m = document.getElementById('bwp-prog-msg');
      const l = document.getElementById('bwp-prog-left');
      const e = document.getElementById('bwp-prog-eta');
      const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
      if (b) b.style.width = p + '%';
      if (l) l.textContent = p + '%';
      if (m && msg != null) m.textContent = String(msg);
      if (e) {
        if (etaSec == null || !isFinite(etaSec)) e.textContent = 'ETA —';
        else if (etaSec < 1) e.textContent = 'ETA < 1s';
        else e.textContent = 'ETA ~ ' + Math.round(etaSec) + 's';
      }
    }

    function buildGuidePrompt() {
      return [
        'Wenn du später als ZIP oder einzelne Dateien downloaden willst, sag ChatGPT es soll EXAKT in diesem Format antworten:',
        '',
        '--- FILENAME: path/to/file.ext ---',
        '(kompletter Dateiinhalt)',
        '--- END FILE ---',
        '',
        'Beispiel-Anfrage (in die Chatleiste einfügen):',
        'Gib mir in der Form eine Webseite (als Dateien im obigen Format):',
        '<< HIER DEIN PROJEKT / DEINE FEATURES >>',
        '',
        'Nur wenn das Format exakt stimmt, kann BetterWeb automatisch Download-Popups öffnen.'
      ].join('\n');
    }

    function ensureWelcomeUi() {
      ensureStyle();
      if (document.getElementById(WELCOME_ID)) return;

      const w = document.createElement('div');
      w.id = WELCOME_ID;
      w.innerHTML =
        '<div class="card">' +
          '<div class="hd">' +
            '<div style="min-width:0">' +
              '<div class="t">BetterWeb — Download (ChatGPT)</div>' +
              '<div class="sub">Wenn du später als <b>ZIP</b> oder <b>einzelne Dateien</b> downloaden willst: sag ChatGPT, es soll exakt im Format <code>--- FILENAME ---</code> / <code>--- END FILE ---</code> antworten.</div>' +
            '</div>' +
            '<button class="x" type="button" aria-label="Close">✕</button>' +
          '</div>' +
          '<div class="code" id="bwp-guide-code"></div>' +
          '<div class="row">' +
            '<label class="chk"><input type="checkbox" id="bwp-guide-dont"> Nicht mehr anzeigen</label>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">' +
              '<button class="btn" type="button" id="bwp-guide-copy">Copy prompt</button>' +
              '<button class="btn primary" type="button" id="bwp-guide-ok">OK</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      document.documentElement.appendChild(w);

      const code = w.querySelector('#bwp-guide-code');
      if (code) code.textContent = buildGuidePrompt();

      function close() {
        w.style.display = 'none';
        const dont = w.querySelector('#bwp-guide-dont');
        if (dont && dont.checked) {
          try { localStorage.setItem(WELCOME_DISMISS_KEY, '1'); } catch (_) {}
        }
      }

      const x = w.querySelector('.x');
      if (x) x.addEventListener('click', close);
      w.addEventListener('click', function (e) { if (e.target === w) close(); });

      const ok = w.querySelector('#bwp-guide-ok');
      if (ok) ok.addEventListener('click', close);

      const copy = w.querySelector('#bwp-guide-copy');
      if (copy) {
        copy.addEventListener('click', async function () {
          const txt = buildGuidePrompt();
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(txt);
              showToast('Prompt copied to clipboard', 'success');
            } else {
              throw new Error('Clipboard not available');
            }
          } catch (_) {
            const ta = document.createElement('textarea');
            ta.value = txt;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); showToast('Prompt copied', 'success'); } catch (e) { showToast('Copy failed', 'error'); }
            ta.remove();
          }
        });
      }
    }

    function showWelcomePopup() {
      try {
        if (localStorage.getItem(WELCOME_DISMISS_KEY) === '1') return;
      } catch (_) {}
      ensureWelcomeUi();
      const w = document.getElementById(WELCOME_ID);
      if (w) w.style.display = 'flex';
    }

    function ensureDownloadPopupUi() {
      ensureStyle();
      if (document.getElementById(DLPOP_ID)) return;

      const w = document.createElement('div');
      w.id = DLPOP_ID;
      w.innerHTML =
        '<div class="card">' +
          '<div class="hd">' +
            '<div style="min-width:0">' +
              '<div class="t">Files detected</div>' +
              '<div class="sub" id="bwp-dl-sub">—</div>' +
            '</div>' +
            '<button class="x" type="button" aria-label="Close">✕</button>' +
          '</div>' +
          '<div class="row">' +
            '<span class="pill" id="bwp-dl-pill">—</span>' +
            '<select id="bwp-dl-select" aria-label="Files">' +
              '<option value="zip">ZIP</option>' +
            '</select>' +
          '</div>' +
          '<div class="row" style="justify-content:flex-end">' +
            '<button class="btn" type="button" id="bwp-dl-close">Close</button>' +
            '<button class="btn primary" type="button" id="bwp-dl-download">Download</button>' +
          '</div>' +
        '</div>';

      document.documentElement.appendChild(w);

      function close() {
        w.style.display = 'none';
      }

      const x = w.querySelector('.x');
      if (x) x.addEventListener('click', close);
      const c = w.querySelector('#bwp-dl-close');
      if (c) c.addEventListener('click', close);
      w.addEventListener('click', function (e) { if (e.target === w) close(); });

      const dl = w.querySelector('#bwp-dl-download');
      if (dl) {
        dl.addEventListener('click', async function () {
          if (!lastFiles || !lastFiles.length) {
            showToast('No files detected yet', 'info');
            return;
          }

          const sel = document.getElementById('bwp-dl-select');
          const v = sel ? String(sel.value || 'zip') : 'zip';

          if (v === 'zip') {
            dl.disabled = true;
            try {
              showProgress('Building ZIP…', 'Packing ' + lastFiles.length + ' files');
              const blob = await buildZipWithProgress(lastFiles, function (pct, msg, eta) {
                setProgress(pct, msg, eta);
              });

              setProgress(100, 'Starting download…', 0);
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'project.zip';
              document.body.appendChild(a);
              a.click();
              a.remove();

              showToast('ZIP downloaded (' + lastFiles.length + ' files)', 'success');
              setTimeout(function () {
                const pw = document.getElementById(PROG_ID);
                if (pw) pw.style.display = 'none';
              }, 650);
            } catch (e) {
              const msg = e && e.message ? e.message : String(e);
              showToast('ZIP failed: ' + msg, 'error');
              setProgress(0, 'ZIP failed: ' + msg, null);
            }
            dl.disabled = false;
            return;
          }

          const idx = parseInt(v, 10);
          const f = lastFiles[idx];
          if (!f) {
            showToast('File not found', 'error');
            return;
          }

          downloadFile(f);
          showToast('Downloaded: ' + safeDownloadName(f.name), 'success');
        });
      }
    }

    function showDownloadPopup(files) {
      ensureDownloadPopupUi();
      lastFiles = Array.isArray(files) ? files : [];

      const w = document.getElementById(DLPOP_ID);
      if (!w) return;

      const sub = document.getElementById('bwp-dl-sub');
      const pill = document.getElementById('bwp-dl-pill');
      const sel = document.getElementById('bwp-dl-select');

      if (sub) sub.textContent = 'BetterWeb found files in the last ChatGPT answer.';
      if (pill) pill.textContent = lastFiles.length + ' files';

      if (sel) {
        sel.innerHTML = '';
        const optZip = document.createElement('option');
        optZip.value = 'zip';
        optZip.textContent = 'ZIP — all files (' + lastFiles.length + ')';
        sel.appendChild(optZip);

        lastFiles.forEach(function (f, i) {
          const o = document.createElement('option');
          o.value = String(i);
          o.textContent = safeDownloadName(f.name);
          sel.appendChild(o);
        });
      }

      w.style.display = 'flex';
    }

    function ensureDownloadBar() {
      ensureStyle();
      if (document.getElementById(BAR_ID)) return;

      const bar = document.createElement('div');
      bar.id = BAR_ID;
      bar.innerHTML =
        '<div class="b">' +
          '<div class="tag">DOWNLOAD</div>' +
          '<div class="meta" id="bwp-bar-meta">No files yet</div>' +
          '<select id="bwp-bar-select" aria-label="Files">' +
            '<option value="zip">ZIP (no files)</option>' +
          '</select>' +
        '</div>' +
        '<button class="dl" type="button" id="bwp-bar-dl">Download</button>';

      document.documentElement.appendChild(bar);

      const dlBtn = bar.querySelector('#bwp-bar-dl');
      if (dlBtn) {
        dlBtn.addEventListener('click', async function () {
          if (!lastFiles || !lastFiles.length) {
            showToast('No files detected yet', 'info');
            return;
          }

          const sel = document.getElementById('bwp-bar-select');
          const v = sel ? String(sel.value || 'zip') : 'zip';

          if (v === 'zip') {
            dlBtn.disabled = true;
            try {
              showProgress('Building ZIP…', 'Packing ' + lastFiles.length + ' files');
              const blob = await buildZipWithProgress(lastFiles, function (pct, msg, eta) {
                setProgress(pct, msg, eta);
              });

              setProgress(100, 'Starting download…', 0);
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'project.zip';
              document.body.appendChild(a);
              a.click();
              a.remove();

              showToast('ZIP downloaded (' + lastFiles.length + ' files)', 'success');
              setTimeout(function () {
                const pw = document.getElementById(PROG_ID);
                if (pw) pw.style.display = 'none';
              }, 650);
            } catch (e) {
              const msg = e && e.message ? e.message : String(e);
              showToast('ZIP failed: ' + msg, 'error');
              setProgress(0, 'ZIP failed: ' + msg, null);
            }
            dlBtn.disabled = false;
            return;
          }

          const idx = parseInt(v, 10);
          const f = lastFiles[idx];
          if (!f) {
            showToast('File not found', 'error');
            return;
          }

          downloadFile(f);
          showToast('Downloaded: ' + safeDownloadName(f.name), 'success');
        });
      }
    }

    function updateDownloadBar(files) {
      ensureDownloadBar();
      const bar = document.getElementById(BAR_ID);
      if (!bar) return;

      lastFiles = Array.isArray(files) ? files : [];

      const meta = document.getElementById('bwp-bar-meta');
      if (meta) meta.textContent = lastFiles.length + ' files ready';

      const sel = document.getElementById('bwp-bar-select');
      if (sel) {
        sel.innerHTML = '';
        const optZip = document.createElement('option');
        optZip.value = 'zip';
        optZip.textContent = 'ZIP — all files (' + lastFiles.length + ')';
        sel.appendChild(optZip);

        lastFiles.forEach(function (f, i) {
          const o = document.createElement('option');
          o.value = String(i);
          o.textContent = safeDownloadName(f.name);
          sel.appendChild(o);
        });
      }

      bar.style.display = 'flex';
    }

    function getLastAssistantText() {
      const assistant = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
      let node = assistant.length ? assistant[assistant.length - 1] : null;
      if (!node) {
        const nodes = document.querySelectorAll('.markdown, .prose');
        node = nodes.length ? nodes[nodes.length - 1] : null;
      }
      if (!node) return '';
      return (node.textContent || node.innerText || '').trim();
    }

    function isGenerating() {
      try {
        const sel = [
          'button[data-testid="stop-button"]',
          'button[aria-label="Stop generating"]',
          'button[aria-label="Stop generating response"]',
          'button[aria-label="Stop"]'
        ];
        for (let i = 0; i < sel.length; i++) {
          const b = document.querySelector(sel[i]);
          if (b && b.offsetParent !== null && !b.disabled) return true;
        }

        // Fallback: look for visible buttons containing “Stop generating” text
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          const tx = String((b.textContent || '')).trim();
          const ar = String((b.getAttribute('aria-label') || '')).trim();
          if (/stop\s+generat/i.test(tx) || /stop\s+generat/i.test(ar)) {
            if (b.offsetParent !== null && !b.disabled) return true;
          }
        }
      } catch (_) {}
      return false;
    }

    function scanOnce() {
      try {
        // Wait until ChatGPT finished generating so we don't capture partial output
        if (isGenerating()) return;

        const text = getLastAssistantText();
        if (!text) return;

        const files = parseFiles(text);
        if (!files.length) return;

        const h = filesHash(files);
        if (!h) return;

        candidateFiles = files;
        candidateHash = h;

        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(function () {
          try {
            if (isGenerating()) return;

            const again = parseFiles(getLastAssistantText());
            const h2 = filesHash(again);
            if (!again.length || !h2 || h2 !== candidateHash) return;
            if (h2 === lastHash) return;

            lastHash = h2;
            updateDownloadBar(again);
            showDownloadPopup(again);
            showToast('Files detected: ' + again.length + ' (Download ready)', 'success');
          } catch (_) {}
        }, 1100);
      } catch (_) {}
    }

    function scheduleScan() {
      if (scanTimer) return;
      scanTimer = setTimeout(function () {
        scanTimer = null;
        scanOnce();
      }, 650);
    }

    function ensureObserver() {
      if (mo) return;
      try {
        mo = new MutationObserver(function () {
          scheduleScan();
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      } catch (_) {
        mo = null;
      }
    }

    // Minimal ZIP builder (store, no compression) + progress callback
    function crc32Table() {
      const table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c >>> 0;
      }
      return table;
    }

    const _crcTable = crc32Table();

    function crc32(buf) {
      let c = 0xFFFFFFFF;
      for (let i = 0; i < buf.length; i++) c = _crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
      return (c ^ 0xFFFFFFFF) >>> 0;
    }

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

    async function buildZipWithProgress(files, onProgress) {
      const list = Array.isArray(files) ? files : [];
      const total = Math.max(1, list.length);
      const encoder = new TextEncoder();
      const now = dosDateTime(new Date());

      const t0 = performance.now();
      let offset = 0;
      const locals = [];
      const centrals = [];

      function emit(pct, msg) {
        if (typeof onProgress !== 'function') return;
        const elapsed = Math.max(1, performance.now() - t0);
        const done = Math.max(1, Math.round((pct / 100) * total));
        const per = elapsed / done;
        const remain = Math.max(0, total - done);
        const etaSec = (per * remain) / 1000;
        onProgress(pct, msg, etaSec);
      }

      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        const name = String(f.name || '').replace(/^\/+/, '').replace(/\\/g, '/');
        const nameBytes = encoder.encode(name);
        const dataBytes = encoder.encode(String(f.content || ''));
        const crc = crc32(dataBytes);

        const local = new Uint8Array(30 + nameBytes.length);
        const dvL = new DataView(local.buffer);
        dvL.setUint32(0, 0x04034b50, true);
        dvL.setUint16(4, 20, true);
        dvL.setUint16(6, 0, true);
        dvL.setUint16(8, 0, true);
        dvL.setUint16(10, now.dosTime, true);
        dvL.setUint16(12, now.dosDate, true);
        dvL.setUint32(14, crc, true);
        dvL.setUint32(18, dataBytes.length, true);
        dvL.setUint32(22, dataBytes.length, true);
        dvL.setUint16(26, nameBytes.length, true);
        dvL.setUint16(28, 0, true);
        local.set(nameBytes, 30);

        locals.push(local);
        locals.push(dataBytes);

        const central = new Uint8Array(46 + nameBytes.length);
        const dvC = new DataView(central.buffer);
        dvC.setUint32(0, 0x02014b50, true);
        dvC.setUint16(4, 20, true);
        dvC.setUint16(6, 20, true);
        dvC.setUint16(8, 0, true);
        dvC.setUint16(10, 0, true);
        dvC.setUint16(12, now.dosTime, true);
        dvC.setUint16(14, now.dosDate, true);
        dvC.setUint32(16, crc, true);
        dvC.setUint32(20, dataBytes.length, true);
        dvC.setUint32(24, dataBytes.length, true);
        dvC.setUint16(28, nameBytes.length, true);
        dvC.setUint16(30, 0, true);
        dvC.setUint16(32, 0, true);
        dvC.setUint16(34, 0, true);
        dvC.setUint16(36, 0, true);
        dvC.setUint32(38, 0, true);
        dvC.setUint32(42, offset, true);
        central.set(nameBytes, 46);

        centrals.push(central);

        offset += local.length + dataBytes.length;

        const pct = ((i + 1) / total) * 92;
        emit(pct, 'Packing ' + (i + 1) + '/' + total + ': ' + safeDownloadName(name));

        if ((i + 1) % 4 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      const centralStart = offset;
      const centralSize = centrals.reduce((a, b) => a + b.length, 0);

      emit(96, 'Finalizing ZIP…');

      const end = new Uint8Array(22);
      const dvE = new DataView(end.buffer);
      dvE.setUint32(0, 0x06054b50, true);
      dvE.setUint16(4, 0, true);
      dvE.setUint16(6, 0, true);
      dvE.setUint16(8, list.length, true);
      dvE.setUint16(10, list.length, true);
      dvE.setUint32(12, centralSize, true);
      dvE.setUint32(16, centralStart, true);
      dvE.setUint16(20, 0, true);

      emit(99, 'Creating blob…');
      const blob = new Blob([...locals, ...centrals, end], { type: 'application/zip' });
      emit(100, 'ZIP ready');

      return blob;
    }

    function cleanup() {
      try {
        if (scanTimer) clearTimeout(scanTimer);
        scanTimer = null;

        if (scanInterval) clearInterval(scanInterval);
        scanInterval = null;

        if (mo) mo.disconnect();
        mo = null;

        lastFiles = [];
        lastHash = '';
        candidateFiles = null;
        candidateHash = '';
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = null;

        removeEl(PSID);
        removeEl(BAR_ID);
        removeEl(PROG_ID);
        removeEl(WELCOME_ID);
        removeEl(DLPOP_ID);

        if (window.__bwModUiHandlers && window.__bwModUiHandlers[MOD_ID]) delete window.__bwModUiHandlers[MOD_ID];
      } catch (_) {}
    }

    function apply() {
      if (!isChatGpt()) return;

      window.__bwModUiHandlers = window.__bwModUiHandlers || {};
      window.__bwModUiHandlers[MOD_ID] = {
        open: function () {
          if (lastFiles && lastFiles.length) showDownloadPopup(lastFiles);
          else showWelcomePopup();
        },
        cleanup
      };

      ensureStyle();
      ensureDownloadBar();
      ensureObserver();

      // Also scan on a small interval to catch edge-cases
      if (!scanInterval) scanInterval = setInterval(scanOnce, 2500);
      setTimeout(scanOnce, 900);

      if (!didShowWelcome) {
        didShowWelcome = true;
        setTimeout(function () {
          try { showWelcomePopup(); } catch (_) {}
        }, 900);
      }
    }

    return { apply, cleanup, open: function () { if (lastFiles && lastFiles.length) showDownloadPopup(lastFiles); else showWelcomePopup(); } };
  })();


  // 7) YouTube Cinema Mode
  MODS['mod-yt-cinema'] = (function () {
    const SID = 'bw-yt-cinema-style';
    const BTN_ID = 'bw-yt-cinema-btn';

    const css = [
      '/* BetterWeb YouTube Cinema Mode */',
      'html[bw-yt-cinema] ytd-watch-flexy:not([theater]) #secondary{display:none!important;}',
      'html[bw-yt-cinema] ytd-watch-flexy:not([theater]) #primary{max-width:100%!important;margin:0 auto!important;}',
      'html[bw-yt-cinema] ytd-watch-flexy:not([theater]) #player-container-outer{max-width:100%!important;}',
      'html[bw-yt-cinema] #masthead-container{background:rgba(0,0,0,0.85)!important;backdrop-filter:blur(10px)!important;}',
      'html[bw-yt-cinema] ytd-app{background:#0a0a0a!important;}',
      'html[bw-yt-cinema] #comments{max-width:900px!important;margin:0 auto!important;}',
      'html[bw-yt-cinema] #below{max-width:900px!important;margin:0 auto!important;}',
      'html[bw-yt-cinema] .ytp-gradient-bottom{opacity:0.3!important;}',
      'html[bw-yt-cinema] #movie_player{box-shadow:0 0 80px rgba(79,143,255,0.08),0 0 160px rgba(168,85,247,0.04)!important;border-radius:12px!important;overflow:hidden!important;}'
    ].join('\n');

    function ensureBtn() {
      if (document.getElementById(BTN_ID)) return;
      const btn = document.createElement('button');
      btn.id = BTN_ID;
      btn.type = 'button';
      btn.textContent = String.fromCodePoint(0x1F3AC) + ' Cinema';
      btn.style.cssText = 'position:fixed;top:70px;right:16px;z-index:2147483647;padding:8px 14px;border-radius:10px;background:rgba(10,5,20,0.8);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);color:#fff;font:700 12px system-ui;cursor:pointer;';
      btn.addEventListener('click', function () {
        document.documentElement.toggleAttribute('bw-yt-cinema');
        btn.style.borderColor = document.documentElement.hasAttribute('bw-yt-cinema') ? 'rgba(79,143,255,0.5)' : 'rgba(255,255,255,0.12)';
      });
      document.documentElement.appendChild(btn);
    }

    function apply() {
      if (!isYouTube()) return;
      injectStyle(SID, css);
      document.documentElement.setAttribute('bw-yt-cinema', '');
      ensureBtn();
    }

    function cleanup() {
      removeEl(SID);
      removeEl(BTN_ID);
      document.documentElement.removeAttribute('bw-yt-cinema');
    }

    return { apply, cleanup };
  })();

  // 8) Speed Reader
  MODS['mod-speed-reader'] = (function () {
    const MOD_ID = 'mod-speed-reader';
    const PID = 'bw-speed-reader';
    const SID = 'bw-speed-reader-style';
    const OVID = 'bw-speed-reader-overlay';

    let words = [];
    let idx = 0;
    let wpm = 300;
    let timer = null;
    let running = false;

    function ensureStyle() {
      if (document.getElementById(SID)) return;
      const s = document.createElement('style');
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
        '#' + OVID + '{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);display:none;}'
      ].join('\n');
      (document.head || document.documentElement).appendChild(s);
    }

    function ensureUi() {
      if (document.getElementById(PID)) return;
      ensureStyle();

      const overlay = document.createElement('div');
      overlay.id = OVID;
      document.documentElement.appendChild(overlay);

      const panel = document.createElement('div');
      panel.id = PID;
      panel.innerHTML =
        '<button class="sr-x" type="button">' + String.fromCodePoint(0x2715) + '</button>' +
        '<div style="font-weight:900;font-size:14px;letter-spacing:0.04em;color:#a855f7">SPEED READER</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px">Select text on any page, then start</div>' +
        '<div class="sr-word" id="sr-word">Select text to begin</div>' +
        '<div class="sr-progress"><div class="sr-progress-bar" id="sr-bar"></div></div>' +
        '<div class="sr-controls">' +
          '<button class="sr-btn" type="button" id="sr-slower">- Slower</button>' +
          '<button class="sr-btn primary" type="button" id="sr-toggle">' + String.fromCodePoint(0x25B6) + ' Start</button>' +
          '<button class="sr-btn" type="button" id="sr-faster">Faster +</button>' +
        '</div>' +
        '<div class="sr-speed" id="sr-info">300 WPM</div>';
      document.documentElement.appendChild(panel);

      function getSelectedText() {
        const sel = window.getSelection();
        return sel ? sel.toString().trim() : '';
      }

      function highlightWord(w) {
        if (!w) return w;
        let mid = Math.floor(w.length / 3);
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
        const text = getSelectedText();
        if (text) {
          words = text.split(/\s+/).filter((w) => w.length > 0);
          idx = 0;
        }
        if (!words.length) {
          document.getElementById('sr-word').innerHTML = 'Select text first!';
          return;
        }
        running = true;
        document.getElementById('sr-toggle').textContent = String.fromCodePoint(0x23F8) + ' Pause';
        timer = setInterval(showWord, 60000 / wpm);
      }

      function stop() {
        running = false;
        if (timer) clearInterval(timer);
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
        const text = getSelectedText();
        if (text) {
          words = text.split(/\s+/).filter((w) => w.length > 0);
          idx = 0;
          document.getElementById('sr-word').innerHTML = words.length + ' words ready';
          document.getElementById('sr-bar').style.width = '0%';
        }
      }

      panel.querySelector('.sr-x').addEventListener('click', close);
      overlay.addEventListener('click', close);
      document.getElementById('sr-toggle').addEventListener('click', function () { running ? stop() : start(); });
      document.getElementById('sr-slower').addEventListener('click', function () {
        wpm = Math.max(100, wpm - 50);
        document.getElementById('sr-info').textContent = wpm + ' WPM';
        if (running) { stop(); start(); }
      });
      document.getElementById('sr-faster').addEventListener('click', function () {
        wpm = Math.min(1000, wpm + 50);
        document.getElementById('sr-info').textContent = wpm + ' WPM';
        if (running) { stop(); start(); }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

      window.__bwModUiHandlers = window.__bwModUiHandlers || {};
      window.__bwModUiHandlers[MOD_ID] = { open, cleanup };

      // Keep helpers accessible for runner
      MODS[MOD_ID].open = open;
      MODS[MOD_ID].cleanup = cleanup;
    }

    function cleanup() {
      try {
        if (timer) clearInterval(timer);
        timer = null;
        running = false;
        removeEl(PID);
        removeEl(OVID);
        removeEl(SID);
        if (window.__bwModUiHandlers && window.__bwModUiHandlers[MOD_ID]) delete window.__bwModUiHandlers[MOD_ID];
      } catch (_) {}
    }

    function apply() {
      ensureUi();
    }

    return { apply, cleanup, open: function () { ensureUi(); const p = document.getElementById(PID); const ov = document.getElementById(OVID); if (p) p.style.display = 'block'; if (ov) ov.style.display = 'block'; } };
  })();

  // 9) Scroll Progress
  MODS['mod-scroll-progress'] = (function () {
    const ID = 'bw-scroll-progress';
    const BAR_ID = 'bw-scroll-progress-bar';
    let raf = null;
    let onScroll = null;

    function ensure() {
      if (document.getElementById(ID)) return;

      const wrap = document.createElement('div');
      wrap.id = ID;
      wrap.style.cssText = 'position:fixed;top:0;left:0;right:0;height:4px;z-index:2147483647;background:rgba(255,255,255,0.06);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;';

      const bar = document.createElement('div');
      bar.id = BAR_ID;
      bar.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#4f8fff,#a855f7,#22d3ee);transition:width 0.08s linear;';
      wrap.appendChild(bar);

      wrap.addEventListener('click', function () {
        wrap.style.opacity = wrap.style.opacity === '0.15' ? '1' : '0.15';
      });

      document.documentElement.appendChild(wrap);
    }

    function update() {
      const el = document.getElementById(BAR_ID);
      if (!el) return;
      const doc = document.documentElement;
      const body = document.body;
      const scrollTop = (doc && doc.scrollTop) ? doc.scrollTop : (body ? body.scrollTop : 0);
      const scrollH = Math.max(doc ? doc.scrollHeight : 0, body ? body.scrollHeight : 0);
      const clientH = doc ? doc.clientHeight : window.innerHeight;
      const denom = Math.max(1, scrollH - clientH);
      const p = Math.min(1, Math.max(0, scrollTop / denom));
      el.style.width = (p * 100).toFixed(2) + '%';
    }

    function apply() {
      ensure();
      if (onScroll) return;
      onScroll = function () {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          update();
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    }

    function cleanup() {
      if (onScroll) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
      onScroll = null;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      removeEl(ID);
    }

    return { apply, cleanup };
  })();

  // 10) Untrack Links
  MODS['mod-untrack-links'] = (function () {
    const TRACK_KEYS = [
      'fbclid', 'gclid', 'igshid', 'mc_cid', 'mc_eid', 'yclid', 'msclkid',
      'ref', 'ref_src', 'spm', 'si', 'scid'
    ];

    let mo = null;
    let onClick = null;

    function cleanUrl(raw) {
      try {
        const u = new URL(raw, location.href);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

        let changed = false;
        const del = [];

        for (const [k] of u.searchParams) {
          if (k.toLowerCase().startsWith('utm_')) del.push(k);
        }

        TRACK_KEYS.forEach((k) => {
          if (u.searchParams.has(k)) del.push(k);
        });

        del.forEach((k) => {
          if (u.searchParams.has(k)) {
            u.searchParams.delete(k);
            changed = true;
          }
        });

        if (!changed) return null;
        return u.toString();
      } catch (_) {
        return null;
      }
    }

    function cleanLink(a) {
      try {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        const cleaned = cleanUrl(href);
        if (cleaned) a.setAttribute('href', cleaned);
      } catch (_) {}
    }

    function scan(root) {
      try {
        const r = root || document;
        r.querySelectorAll('a[href]').forEach(cleanLink);
      } catch (_) {}
    }

    function apply() {
      scan();
      if (!onClick) {
        onClick = function (e) {
          const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
          if (a) cleanLink(a);
        };
        document.addEventListener('click', onClick, true);
      }

      if (!mo) {
        mo = new MutationObserver((mut) => {
          for (const m of mut) {
            for (const n of (m.addedNodes || [])) {
              if (n && n.nodeType === 1) scan(n);
            }
          }
        });
        try { mo.observe(document.documentElement, { childList: true, subtree: true }); } catch (_) {}
      }

      scan();
    }

    function cleanup() {
      if (onClick) document.removeEventListener('click', onClick, true);
      onClick = null;
      if (mo) mo.disconnect();
      mo = null;
    }

    return { apply, cleanup };
  })();

  // 11) Site Notes
  MODS['mod-site-notes'] = (function () {
    const MOD_ID = 'mod-site-notes';
    const FAB_ID = 'bw-notes-fab';
    const PANEL_ID = 'bw-notes-panel';
    const STYLE_ID = 'bw-notes-style';

    function key() {
      return 'bw-notes:' + (location && location.hostname ? location.hostname : 'site');
    }

    function ensureStyle() {
      if (document.getElementById(STYLE_ID)) return;
      injectStyle(STYLE_ID, [
        '#' + FAB_ID + '{position:fixed;bottom:18px;right:18px;z-index:2147483647;width:46px;height:46px;border-radius:16px;border:1px solid rgba(255,255,255,0.14);background:rgba(10,5,20,0.7);backdrop-filter:blur(14px) saturate(130%);color:#fff;font:900 18px system-ui;cursor:pointer;box-shadow:0 18px 60px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;}',
        '#' + FAB_ID + ':hover{background:rgba(10,5,20,0.86);border-color:rgba(255,255,255,0.22);}',
        '#' + PANEL_ID + '{position:fixed;bottom:76px;right:18px;z-index:2147483647;width:min(420px,calc(100vw - 36px));max-height:min(520px,calc(100vh - 120px));overflow:auto;padding:14px;border-radius:18px;color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;border:1px solid rgba(255,255,255,0.12);background:rgba(10,5,20,0.86);backdrop-filter:blur(18px) saturate(130%);box-shadow:0 30px 90px rgba(0,0,0,0.55);display:none;}',
        '#' + PANEL_ID + ' .hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}',
        '#' + PANEL_ID + ' .t{font-weight:900;font-size:12px;letter-spacing:0.06em;color:#a855f7;}',
        '#' + PANEL_ID + ' .x{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;}',
        '#' + PANEL_ID + ' textarea{width:100%;min-height:220px;resize:vertical;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#fff;padding:12px 12px;font-size:13px;line-height:1.45;}',
        '#' + PANEL_ID + ' textarea:focus{outline:none;border-color:rgba(79,143,255,0.4);box-shadow:0 0 24px rgba(79,143,255,0.08);}',
        '#' + PANEL_ID + ' .hint{margin-top:8px;font-size:11px;color:rgba(255,255,255,0.55);}'
      ].join('\n'));
    }

    function ensureUi() {
      ensureStyle();
      if (!document.getElementById(FAB_ID)) {
        const b = document.createElement('button');
        b.id = FAB_ID;
        b.type = 'button';
        b.textContent = '📝';
        b.title = 'Site Notes';
        b.addEventListener('click', function () { toggle(); });
        document.documentElement.appendChild(b);
      }

      if (!document.getElementById(PANEL_ID)) {
        const p = document.createElement('div');
        p.id = PANEL_ID;
        p.innerHTML =
          '<div class="hd"><div><div class="t">SITE NOTES</div><div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:2px">' + escapeHtml(location.hostname || '') + '</div></div><button class="x" type="button">' + String.fromCodePoint(0x2715) + '</button></div>' +
          '<textarea id="bw-notes-ta" placeholder="Notizen für diese Seite..."></textarea>' +
          '<div class="hint">Autosave (localStorage) — nur auf dieser Domain sichtbar.</div>';
        document.documentElement.appendChild(p);

        const x = p.querySelector('.x');
        if (x) x.addEventListener('click', function () { p.style.display = 'none'; });

        const ta = p.querySelector('#bw-notes-ta');
        if (ta) {
          try { ta.value = localStorage.getItem(key()) || ''; } catch (_) {}
          ta.addEventListener('input', function () {
            try { localStorage.setItem(key(), ta.value); } catch (_) {}
          });
        }
      }

      window.__bwModUiHandlers = window.__bwModUiHandlers || {};
      window.__bwModUiHandlers[MOD_ID] = { open, cleanup };
    }

    function open() {
      ensureUi();
      const p = document.getElementById(PANEL_ID);
      if (p) p.style.display = 'block';
    }

    function toggle() {
      ensureUi();
      const p = document.getElementById(PANEL_ID);
      if (!p) return;
      p.style.display = (getComputedStyle(p).display !== 'none') ? 'none' : 'block';
    }

    function cleanup() {
      removeEl(PANEL_ID);
      removeEl(FAB_ID);
      removeEl(STYLE_ID);
      if (window.__bwModUiHandlers && window.__bwModUiHandlers[MOD_ID]) delete window.__bwModUiHandlers[MOD_ID];
    }

    function apply() {
      ensureUi();
    }

    return { apply, cleanup, open };
  })();

  // 12) Dev Mode Ultimate (lightweight HUD)
  MODS['dev-mode-ultimate'] = (function () {
    const MOD_ID = 'dev-mode-ultimate';
    const HUD_ID = 'bw-devmode-hud';
    let t = null;

    function fmtBytes(n) {
      if (!n || n < 1024) return String(n || 0) + ' B';
      const u = ['KB', 'MB', 'GB'];
      let v = n;
      let i = -1;
      do { v /= 1024; i++; } while (v >= 1024 && i < u.length - 1);
      return v.toFixed(1) + ' ' + u[i];
    }

    function ensure() {
      if (document.getElementById(HUD_ID)) return;
      const hud = document.createElement('div');
      hud.id = HUD_ID;
      hud.style.cssText = 'position:fixed;bottom:18px;left:18px;width:340px;max-height:50vh;overflow:auto;z-index:2147483647;background:rgba(5,5,10,0.86);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.14);border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,0.55);color:#e5e7eb;font:12px ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;pointer-events:auto';

      hud.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.08)">' +
          '<div style="font-weight:900;letter-spacing:0.06em;font-size:11px;color:#a855f7">DEV MODE ULTIMATE</div>' +
          '<button type="button" id="bw-dm-x" style="width:28px;height:28px;border-radius:10px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer">' + String.fromCodePoint(0x2715) + '</button>' +
        '</div>' +
        '<div id="bw-dm-body" style="padding:10px 12px"></div>';

      (document.documentElement || document.body).appendChild(hud);

      const x = hud.querySelector('#bw-dm-x');
      if (x) x.addEventListener('click', function () { hud.style.display = 'none'; });
    }

    function update() {
      try {
        const body = document.getElementById('bw-dm-body');
        if (!body) return;

        const media = Array.from(document.querySelectorAll('video,audio'));
        const scripts = Array.from(document.scripts || []);
        const links = Array.from(document.querySelectorAll('link[rel=stylesheet]'));
        const mem = (performance && performance.memory) ? performance.memory.usedJSHeapSize : null;

        const ml = media.slice(0, 10).map((m, i) =>
          '<div style="margin-top:4px;color:#93c5fd">' + m.tagName + '#' + (i + 1) + '</div>' +
          '<div style="opacity:0.8;word-break:break-all">' + escapeHtml(m.currentSrc || m.src || '(no src)') + '</div>'
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
          '<div style="opacity:0.6;margin-top:10px">URL: ' + escapeHtml(location.href) + '</div>';
      } catch (_) {}
    }

    function apply() {
      ensure();
      update();
      if (t) return;
      t = setInterval(update, 1500);
      window.__bwModUiHandlers = window.__bwModUiHandlers || {};
      window.__bwModUiHandlers[MOD_ID] = {
        open: function () { const h = document.getElementById(HUD_ID); if (h) h.style.display = (getComputedStyle(h).display === 'none') ? 'block' : 'none'; },
        cleanup
      };
    }

    function cleanup() {
      if (t) clearInterval(t);
      t = null;
      removeEl(HUD_ID);
      if (window.__bwModUiHandlers && window.__bwModUiHandlers[MOD_ID]) delete window.__bwModUiHandlers[MOD_ID];
    }

    return { apply, cleanup };
  })();

  // ── Runner Core ──────────────────────────────
  function runMod(id, reason) {
    const mod = MODS[id];
    if (!mod || typeof mod.apply !== 'function') return false;
    try {
      mod.apply({ reason: reason || 'sync' });
      ModRunner.active.add(id);
      return true;
    } catch (e) {
      console.warn('[BetterWeb] Mod apply failed:', id, e);
      return false;
    }
  }

  function stopMod(id) {
    const mod = MODS[id];
    try {
      if (mod && typeof mod.cleanup === 'function') mod.cleanup();
    } catch (_) {}
    ModRunner.active.delete(id);
    tryCleanupCustomUi(id);
  }

  async function syncEnabledMods(opts) {
    const o = opts || {};
    const data = await storageGet(['installed']);
    const installed = (data && data.installed) ? data.installed : {};

    const nextEnabled = new Set();
    for (const [id, item] of Object.entries(installed)) {
      if (!item || !item.enabled) continue;
      if (inferType(id, item) !== 'mod') continue;
      nextEnabled.add(id);
    }

    // Apply / cleanup only for mods we actually implement
    const allIds = new Set([...Object.keys(MODS), ...Array.from(ModRunner.active)]);

    for (const id of allIds) {
      const should = nextEnabled.has(id);
      const isOn = ModRunner.active.has(id);

      if (should && !isOn) {
        const ok = runMod(id, 'enable');
        if (ok && ModRunner.initialized && o.toast !== false) {
          showToast('Enabled: ' + id, 'success');
        }
      }

      if (!should && isOn) {
        stopMod(id);
        if (ModRunner.initialized && o.toast !== false) {
          showToast('Disabled: ' + id, 'info');
        }
      }
    }

    ModRunner.enabled = nextEnabled;
    ModRunner.initialized = true;
  }

  // ────────────────────────────────────────────
  // Runtime Messages
  // ────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === 'showToast') {
      showToast(msg.message, msg.type);
    }

    if (msg && msg.action === 'bwModDisabled' && msg.id) {
      stopMod(String(msg.id));
    }

    if (msg && msg.action === 'bwModToggled' && msg.id) {
      // Fast path; still sync from storage so state stays correct
      syncEnabledMods({ toast: true }).catch(() => {});
      refreshModUi();
    }

    if (msg && msg.action === 'bwRunModNow' && msg.id) {
      const id = String(msg.id);
      const ok = runMod(id, 'runNow');
      if (!ok) showToast('Mod not available on this page: ' + id, 'error');
      else showToast('Mod executed: ' + id, 'success');
    }

    if (msg && msg.action === 'bwRefreshMods') {
      syncEnabledMods({ toast: false }).catch(() => {});
      refreshModUi();
    }
  });

  // Keep mod buttons + mods in sync
  safeOnChangedAddListener((changes, area) => {
    if (area === 'local' && changes && changes.installed) {
      refreshModUi();
      syncEnabledMods({ toast: true }).catch(() => {});
    }
  });

  // Initial
  refreshModUi();
  syncEnabledMods({ toast: false }).catch(() => {});

})();
