/* =============================================
   BetterWeb — Popup Logic (Themes + Mods + Active)
   - Themes: select active newtab theme
   - Mods: enable/disable installed mods
   - Active: single place to see what is actually running on the current page
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // Version badge
  try {
    const v = (chrome.runtime && chrome.runtime.getManifest) ? chrome.runtime.getManifest().version : '';
    const vEl = document.getElementById('bw-popup-version');
    if (vEl) vEl.textContent = v ? ('v' + v) : 'v—';
  } catch (_) {}

  const send = (msg) => new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(msg, (resp) => resolve(resp || null));
    } catch (e) {
      resolve(null);
    }
  });

  const getActiveTab = () => new Promise((resolve) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve((tabs && tabs[0]) ? tabs[0] : null);
      });
    } catch (_) {
      resolve(null);
    }
  });

  const sendToTab = (tabId, msg) => new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, msg, (resp) => {
        const err = chrome.runtime && chrome.runtime.lastError ? chrome.runtime.lastError : null;
        if (err) resolve(null);
        else resolve(resp || null);
      });
    } catch (_) {
      resolve(null);
    }
  });

  const isInjectableUrl = (url) => {
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
  };

  const inferType = (storageId, item) => {
    const it = item || {};

    // IMPORTANT: Prefer strong signals over saved `type`.
    // Legacy/corrupt data can have themes stored with type:"mod".
    const id = storageId ? String(storageId) : (it.id ? String(it.id) : '');
    const entry = it.entry ? String(it.entry) : '';
    const target = it.target ? String(it.target) : '';

    // Strong theme signal: themes often inject a style tag with id "bw-custom-theme"
    if (it.code && String(it.code).includes('bw-custom-theme')) return 'theme';

    // Strong theme signals
    if (id.startsWith('theme-')) return 'theme';
    if (it.themeCss || it.css) return 'theme';
    if (target === 'newtab') return 'theme';
    if (entry.endsWith('.css')) return 'theme';
    if (entry.includes('theme-') || /\/themes?\//.test(entry)) return 'theme';

    // Explicit type (only after strong signals)
    const t = (it.type ? String(it.type) : '').toLowerCase();
    if (t === 'theme' || t === 'mod') return t;

    if (target === 'content') return 'mod';

    return 'mod';
  };

  // ─── Tabs ────────────────────────────────────
  function setActiveTabUi(key) {
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === key));
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === `tab-${key}`));
  }

  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveTabUi(btn.dataset.tab);
      if (btn.dataset.tab === 'active') refreshActivePage();
    });
  });

  // ─── Data ────────────────────────────────────
  let installedById = {};
  let activeThemeId = 'default';
  let _lastActivePageIds = [];

  async function refreshData() {
    try {
      const iRes = await send({ action: 'getInstalled' });
      installedById = (iRes && iRes.installed) ? iRes.installed : {};

      const tRes = await send({ action: 'getActiveTheme' });
      activeThemeId = (tRes && tRes.themeId) ? tRes.themeId : 'default';

      renderThemes();
      renderMods();

      // If user already sits on the Active tab: refresh
      const activeBtn = document.querySelector('.nav-btn.active');
      if (activeBtn && activeBtn.dataset.tab === 'active') refreshActivePage();
    } catch (e) {
      console.error('[BetterWeb Popup] refreshData failed:', e);
      const grid = $('#theme-grid');
      if (grid) grid.innerHTML = '<div class="empty-state">Error loading data.</div>';
    }
  }

  // ─── Themes ──────────────────────────────────
  function getThemeGradient(id) {
    if (id === 'theme-midnight') return 'linear-gradient(135deg, #0f0518, #4c1d95)';
    if (id === 'theme-matrix') return 'linear-gradient(135deg, #000, #003300)';
    if (id === 'theme-sunset') return 'linear-gradient(135deg, #2a1015, #f59e0b)';
    return 'linear-gradient(135deg, #030014, #4f8fff)';
  }

  function renderThemes() {
    const themeGrid = $('#theme-grid');
    if (!themeGrid) return;

    // IMPORTANT: Use storage key as source of truth.
    const installedItems = Object.entries(installedById).map(([storageId, item]) => ({
      storageId,
      ...(item || {})
    }));

    const themes = installedItems.filter((x) => inferType(x.storageId, x) === 'theme');

    const allThemes = [
      { storageId: 'default', name: 'Galaxy (Default)', publisher: 'Leon.cgn.lx', icon: '🌌' },
      ...themes
    ];

    themeGrid.innerHTML = allThemes.map((t) => {
      const tid = t.storageId || t.id || 'default';
      const name = t.name || tid;
      const publisher = t.publisher || '';
      return `
        <div class="theme-card ${tid === activeThemeId ? 'active' : ''}" data-id="${esc(tid)}">
          <div class="theme-preview" style="background:${getThemeGradient(tid)}"></div>
          <div class="theme-info">
            <div class="theme-name">${esc(name)}</div>
            <div class="theme-author">${esc(publisher)}</div>
          </div>
        </div>
      `;
    }).join('');

    $$('.theme-card').forEach((card) => {
      card.addEventListener('click', async () => {
        const id = card.dataset.id;
        if (!id) return;

        // Optimistic UI
        $$('.theme-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        activeThemeId = id;

        await send({ action: 'setActiveTheme', themeId: id });
      });
    });
  }

  // ─── Mods ────────────────────────────────────
  function renderMods() {
    const modList = $('#mod-list');
    const noMods = $('#no-mods');
    if (!modList) return;

    const installedItems = Object.entries(installedById).map(([storageId, item]) => ({
      storageId,
      ...(item || {})
    }));

    const mods = installedItems.filter((x) => inferType(x.storageId, x) === 'mod');

    if (mods.length === 0) {
      if (noMods) noMods.style.display = 'block';
      modList.innerHTML = '';
      return;
    }

    if (noMods) noMods.style.display = 'none';

    modList.innerHTML = mods.map((m) => {
      const enabled = !!m.enabled;
      const id = m.storageId || m.id || '';
      return `
        <div class="mod-item">
          <div class="mod-info">
            <div class="mod-icon">${esc(m.icon || '🧩')}</div>
            <div class="mod-text">
              <h4>${esc(m.name || id || 'Mod')}</h4>
              <p>${esc(m.version || '')} • ${esc(m.publisher || '')}</p>
            </div>
          </div>
          <div class="mod-controls">
            <label class="toggle-switch" title="Enable / Disable">
              <input type="checkbox" class="mod-toggle" data-id="${esc(id)}" ${enabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `;
    }).join('');

    // Toggle handlers
    $$('.mod-toggle').forEach((chk) => {
      chk.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        const enabled = !!e.target.checked;

        const resp = await send({ action: 'toggleExtension', id, enabled });
        if (resp && resp.success === false) {
          // Rollback UI if background rejects
          e.target.checked = !enabled;
          return;
        }

        // Keep local cache consistent
        if (installedById[id]) installedById[id].enabled = enabled;

        // If user is on Active tab: refresh list (mods may start/stop instantly)
        const activeBtn = document.querySelector('.nav-btn.active');
        if (activeBtn && activeBtn.dataset.tab === 'active') {
          setTimeout(refreshActivePage, 180);
        }
      });
    });
  }

  // ─── Active (current page) ───────────────────
  function renderActiveList(activeIds, openableMap) {
    const list = document.getElementById('active-mod-list');
    const empty = document.getElementById('active-empty');
    if (!list) return;

    const ids = Array.isArray(activeIds) ? activeIds.slice() : [];
    _lastActivePageIds = ids;

    if (!ids.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';

    list.innerHTML = ids.map((id) => {
      const it = installedById[id] || {};
      const name = it.name || id;
      const publisher = it.publisher || '';
      const version = it.version || '';
      const icon = it.icon || '🧩';
      const openable = !!(openableMap && openableMap[id]);

      return `
        <div class="mod-item">
          <div class="mod-info">
            <div class="mod-icon">${esc(icon)}</div>
            <div class="mod-text">
              <h4>${esc(name)}</h4>
              <p>${esc(version)} • ${esc(publisher)}</p>
            </div>
          </div>
          <div class="mod-controls">
            ${openable ? `<button class="mod-config-btn" title="Open mod UI" data-open="${esc(id)}">Open</button>` : ''}
            <label class="toggle-switch" title="Disable">
              <input type="checkbox" class="active-toggle" data-id="${esc(id)}" checked>
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `;
    }).join('');

    // Open UI
    document.querySelectorAll('[data-open]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-open');
        const tab = await getActiveTab();
        if (!tab || !tab.id) return;
        await sendToTab(tab.id, { action: 'bwOpenModUi', id });
      });
    });

    // Disable
    document.querySelectorAll('.active-toggle').forEach((chk) => {
      chk.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;
        const enabled = !!e.target.checked;
        // In this view, checkbox being unchecked means disable
        const resp = await send({ action: 'toggleExtension', id, enabled });
        if (resp && resp.success === false) {
          e.target.checked = !enabled;
          return;
        }
        if (installedById[id]) installedById[id].enabled = enabled;
        setTimeout(refreshActivePage, 180);
      });
    });
  }

  async function refreshActivePage() {
    const meta = document.getElementById('bw-active-meta');
    const list = document.getElementById('active-mod-list');
    const empty = document.getElementById('active-empty');

    if (meta) meta.textContent = 'Loading current page…';
    if (list) list.innerHTML = '';
    if (empty) empty.style.display = 'none';

    const tab = await getActiveTab();
    const url = tab && tab.url ? String(tab.url) : '';

    if (!tab || !tab.id || !isInjectableUrl(url)) {
      if (meta) meta.textContent = url ? ('Not supported: ' + url) : 'No active tab';
      renderActiveList([], null);
      return;
    }

    let host = url;
    try { host = (new URL(url)).hostname; } catch (_) {}
    if (meta) meta.textContent = host;

    const resp = await sendToTab(tab.id, { action: 'bwGetActiveMods' });
    if (!resp || resp.success === false) {
      if (meta) meta.textContent = host + ' • (Bridge not responding)';
      renderActiveList([], null);
      return;
    }

    const active = Array.isArray(resp.active) ? resp.active : [];
    const openable = resp.openable && typeof resp.openable === 'object' ? resp.openable : {};

    if (meta) meta.textContent = host + ' • ' + active.length + ' active';
    renderActiveList(active, openable);
  }

  const refreshBtn = document.getElementById('bw-active-refresh');
  if (refreshBtn) refreshBtn.addEventListener('click', refreshActivePage);

  const disableAllBtn = document.getElementById('bw-active-disable-all');
  if (disableAllBtn) {
    disableAllBtn.addEventListener('click', async () => {
      const ids = Array.isArray(_lastActivePageIds) ? _lastActivePageIds.slice() : [];
      if (!ids.length) return;
      for (const id of ids) {
        try { await send({ action: 'toggleExtension', id, enabled: false }); } catch (_) {}
      }
      setTimeout(refreshActivePage, 220);
    });
  }

  // ─── Open Dashboard ──────────────────────────
  const openNt = $('#open-newtab');
  if (openNt) {
    openNt.addEventListener('click', () => {
      try {
        chrome.tabs.create({ url: 'chrome://newtab' });
      } catch (e) {
        // ignore
      }
    });
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  refreshData();
});
