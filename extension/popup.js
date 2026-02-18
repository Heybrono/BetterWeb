/* =============================================
   BetterWeb — Popup Logic (Themes + Mods)
   Fixes:
   - Robustly separates Themes vs Mods (uses storage key as source of truth)
   - Toggles are clickable (label-based)
   - Safer message calls (callback wrapper)
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
  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach((b) => b.classList.remove('active'));
      $$('.view').forEach((v) => v.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // ─── Data ────────────────────────────────────
  let installedById = {};
  let activeThemeId = 'default';

  async function refreshData() {
    try {
      const iRes = await send({ action: 'getInstalled' });
      installedById = (iRes && iRes.installed) ? iRes.installed : {};

      const tRes = await send({ action: 'getActiveTheme' });
      activeThemeId = (tRes && tRes.themeId) ? tRes.themeId : 'default';

      renderThemes();
      renderMods();
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
    // Do NOT allow item.id to override the key (corrupted legacy data can break toggles).
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

        // Reload active tab to apply/unapply (best-effort)
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const t = tabs && tabs[0];
            if (t && t.id && t.url && !t.url.startsWith('chrome://')) chrome.tabs.reload(t.id);
          });
        } catch (_) {}
      });
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
