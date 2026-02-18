/* =============================================
   BetterWeb — New Tab
   by leon.cgn.lx
   ============================================= */
(function () {
  'use strict';

  var ENGINES = {
    google:     { name: 'Google',     url: 'https://www.google.com/search?q=',   letter: 'G', color: '#4285f4' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',         letter: 'D', color: '#de5833' },
    yahoo:      { name: 'Yahoo',      url: 'https://search.yahoo.com/search?p=', letter: 'Y', color: '#720e9e' }
  };

  var current = 'google';
  var ddOpen = false;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return document.querySelectorAll(s); };

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, ms || 0);
    };
  }

  function isTypingInInput() {
    var el = document.activeElement;
    if (!el) return false;
    var tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable) return true;
    return false;
  }

  async function copyTextToClipboard(txt) {
    var t = String(txt == null ? '' : txt);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(t);
        return true;
      }
    } catch (_) {}

    try {
      var ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch (_) {
      return false;
    }
  }

  // ────────────────────────────────────────────
  // Toast
  // ────────────────────────────────────────────
  function showToast(message, type) {
    try {
      var root = $('#bw-toast');
      if (!root) return;
      var t = document.createElement('div');
      t.className = 'bw-toast ' + (type || 'info');
      t.innerHTML = '<span class="dot"></span><span style="font-weight:800">' + esc(message || '') + '</span>';
      root.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('show'); });
      setTimeout(function () {
        t.classList.remove('show');
        setTimeout(function () { try { t.remove(); } catch (_) {} }, 260);
      }, 2400);
    } catch (_) {}
  }

  // ────────────────────────────────────────────
  // Settings (merge-safe)
  // ────────────────────────────────────────────
  async function getSettings() {
    try {
      var s = await BetterWebStorage.get('settings');
      if (s && typeof s === 'object') return s;
    } catch (_) {}
    return {};
  }

  async function updateSettings(patch) {
    try {
      var s = await getSettings();
      var next = Object.assign({}, s, patch || {});
      await BetterWebStorage.set('settings', next);
      return next;
    } catch (_) {
      return null;
    }
  }

  // ─── Starfield ───────────────────────────────
  var canvas = $('#starfield');
  var ctx = canvas.getContext('2d');
  var stars = [];
  var W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = [];
    var count = Math.min(Math.floor((W * H) / 4000), 800);
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * 0.5 + 0.2,
        s: Math.random() * 0.01 + 0.004,
        p: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.p += s.s;
      var alpha = s.a * (0.5 + 0.5 * Math.sin(s.p));
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', resize);

  // ─── View Navigation ─────────────────────────
  function goView(viewId) {
    var btn = document.querySelector('.pill[data-view="' + viewId + '"]');
    if (btn) btn.click();
  }

  $$('.pill').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.pill').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      $$('.view').forEach(function (v) { v.classList.remove('active'); });
      var target = $('#view-' + btn.dataset.view);
      if (target) target.classList.add('active');
    });
  });

  // ─── Recents + Apps Dock (stored locally) ────
  // NOTE: This is NOT Chrome history (would require extra permissions).
  var RECENTS_KEY = 'bwRecentsV1';
  var APPS_KEY = 'bwQuickAppsV1';
  var SCRATCHPAD_KEY = 'bwScratchpadV1';
  var WORKSPACES_KEY = 'bwWorkspacesV1';

  function brandIconSvg(id) {
    var k = String(id || '');

    // NOTE: These are simple brand-like SVGs (inline, no external requests)
    // so they look like real logos instead of emojis.
    if (k === 'yt') {
      return (
        '<svg class="bw-app-svg" viewBox="0 0 24 24" aria-hidden="true">' +
          '<rect x="2.2" y="6.8" width="19.6" height="10.4" rx="3.2" fill="#FF0000"/>' +
          '<path d="M10 9.2v5.6l6-2.8-6-2.8z" fill="#ffffff"/>' +
        '</svg>'
      );
    }

    if (k === 'wa') {
      return (
        '<svg class="bw-app-svg" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/>' +
          '<path fill="#ffffff" d="M17.6 14.6c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.6-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1 2.7c.1.2 1.7 2.6 4.1 3.6.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 2-1.3.2-.6.2-1.1.1-1.3-.1-.1-.3-.2-.6-.3z"/>' +
        '</svg>'
      );
    }

    if (k === 'tt') {
      return (
        '<svg class="bw-app-svg" viewBox="0 0 24 24" aria-hidden="true">' +
          '<circle cx="12" cy="12" r="10" fill="#0b0b10"/>' +
          '<path fill="#25F4EE" opacity="0.9" d="M14 7v9.2a2.7 2.7 0 1 1-2-2.6V11a5.2 5.2 0 1 0 4 5V11.3a6 6 0 0 0 3 1V9.6a3.9 3.9 0 0 1-3-2.6z"/>' +
          '<path fill="#FE2C55" opacity="0.85" d="M13.4 6.5v9.2a2.7 2.7 0 1 1-2-2.6v-2.6a5.2 5.2 0 1 0 4 5V8.2a6 6 0 0 0 3 1V6.5a3.9 3.9 0 0 1-3-2.6z"/>' +
          '<path fill="#ffffff" d="M13.8 6.8v9.1a2.6 2.6 0 1 1-2-2.5v-2.3a5 5 0 1 0 4 4.8V8.7a5.8 5.8 0 0 0 3 1V7.4a3.7 3.7 0 0 1-3-2.6z"/>' +
        '</svg>'
      );
    }

    if (k === 'rd') {
      return (
        '<svg class="bw-app-svg" viewBox="0 0 24 24" aria-hidden="true">' +
          '<circle cx="12" cy="12" r="10" fill="#FF4500"/>' +
          '<path fill="#ffffff" d="M8.2 13.1c0-1.6 1.7-2.9 3.8-2.9s3.8 1.3 3.8 2.9-1.7 2.9-3.8 2.9-3.8-1.3-3.8-2.9zm2-.3a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6zm3.6 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6zm-3.1 1.6c.7.7 2.1.7 2.8 0 .2-.2.4-.2.6 0 .2.2.2.4 0 .6-1.2 1.2-3.4 1.2-4.6 0-.2-.2-.2-.4 0-.6.2-.2.4-.2.6 0z"/>' +
          '<path fill="#ffffff" d="M18.2 10.4a2 2 0 0 0-1.2-.4c-.7 0-1.3.3-1.7.8-1-.6-2.3-1-3.7-1.1l.6-2.7 2 .4a1.2 1.2 0 1 0 .2-.8l-2.6-.6a.5.5 0 0 0-.6.4l-.7 3.6c-1.5.1-2.8.5-3.9 1.1a2 2 0 1 0-1.1 3.6v.2c0 2.4 2.8 4.3 6.3 4.3s6.3-1.9 6.3-4.3v-.2a2 2 0 0 0 .8-1.6c0-.8-.4-1.5-1-1.9z"/>' +
        '</svg>'
      );
    }

    if (k === 'gh') {
      return (
        '<svg class="bw-app-svg" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path fill="#e5e7eb" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.9.6-3.5-1.2-3.5-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.3-1.1.6-1.4-2.3-.3-4.7-1.1-4.7-5A3.9 3.9 0 0 1 6.4 8.5a3.6 3.6 0 0 1 .1-2.6s.9-.3 2.8 1a9.6 9.6 0 0 1 5.2 0c1.9-1.3 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.6 3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.7 5 .3.3.6.9.6 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/>' +
        '</svg>'
      );
    }

    return '<span class="bw-app-letter">' + esc(k.substring(0, 1).toUpperCase() || 'A') + '</span>';
  }

  var DEFAULT_APPS = [
    { id: 'wa', name: 'WhatsApp', url: 'https://web.whatsapp.com/', iconHtml: brandIconSvg('wa') },
    { id: 'yt', name: 'YouTube',  url: 'https://www.youtube.com/', iconHtml: brandIconSvg('yt') },
    { id: 'tt', name: 'TikTok',   url: 'https://www.tiktok.com/', iconHtml: brandIconSvg('tt') },
    { id: 'rd', name: 'Reddit',   url: 'https://www.reddit.com/', iconHtml: brandIconSvg('rd') },
    { id: 'gh', name: 'GitHub',   url: 'https://github.com/', iconHtml: brandIconSvg('gh') }
  ];

  function normalizeUrl(raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    return 'https://' + s;
  }

  function isSafeUrl(raw) {
    try {
      var u = new URL(raw);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function nowMs() {
    try { return Date.now(); } catch (_) { return 0; }
  }

  function recentKeyForItem(it) {
    if (!it || !it.t) return '';
    if (it.t === 'q') return 'q:' + String(it.q || '').trim().toLowerCase();
    if (it.t === 'u') return 'u:' + String(it.url || '');
    return '';
  }

  async function loadRecents() {
    try {
      var raw = await BetterWebStorage.get(RECENTS_KEY);
      if (!raw) return [];

      // Migration: allow legacy string[] (queries)
      if (Array.isArray(raw) && (raw.length === 0 || typeof raw[0] === 'string')) {
        return raw
          .map(function (q) { return { t: 'q', q: String(q || '').trim(), at: nowMs() }; })
          .filter(function (x) { return x.q; })
          .slice(0, 12);
      }

      if (Array.isArray(raw)) return raw.slice(0, 20);
      return [];
    } catch (_) {
      return [];
    }
  }

  async function saveRecents(list) {
    try {
      await BetterWebStorage.set(RECENTS_KEY, Array.isArray(list) ? list.slice(0, 20) : []);
    } catch (_) {}
  }

  async function addRecentQuery(q) {
    var text = String(q || '').trim();
    if (!text) return;
    var list = await loadRecents();

    var next = [{ t: 'q', q: text, at: nowMs() }];

    var seen = new Set();
    seen.add(recentKeyForItem(next[0]));

    list.forEach(function (it) {
      if (!it) return;
      var key = recentKeyForItem(it);
      if (!key || seen.has(key)) return;
      seen.add(key);
      next.push(it);
    });

    await saveRecents(next.slice(0, 10));
    renderRecents(next.slice(0, 10));
  }

  async function addRecentUrl(name, url) {
    var n = String(name || '').trim();
    var u = String(url || '').trim();
    if (!n || !u) return;
    var list = await loadRecents();

    var next = [{ t: 'u', name: n, url: u, at: nowMs() }];

    var seen = new Set();
    seen.add(recentKeyForItem(next[0]));

    list.forEach(function (it) {
      if (!it) return;
      var key = recentKeyForItem(it);
      if (!key || seen.has(key)) return;
      seen.add(key);
      next.push(it);
    });

    await saveRecents(next.slice(0, 10));
    renderRecents(next.slice(0, 10));
  }

  async function clearRecents() {
    await saveRecents([]);
    renderRecents([]);
  }

  function renderRecents(list) {
    var wrap = $('#recents-wrap');
    var el = $('#recents-list');
    if (!wrap || !el) return;

    var arr = Array.isArray(list) ? list : [];
    if (!arr.length) {
      wrap.style.display = 'none';
      el.innerHTML = '';
      return;
    }

    wrap.style.display = 'block';
    el.innerHTML = '';

    arr.slice(0, 10).forEach(function (it) {
      if (!it) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'recent-chip';

      if (it.t === 'q') {
        btn.innerHTML = '<span class="k">🔎</span><span class="t">' + esc(it.q) + '</span>';
        btn.title = it.q;
        btn.addEventListener('click', function () {
          var si = $('#search-input');
          if (si) si.value = String(it.q || '');
          doSearch().catch(function () {});
        });
      } else if (it.t === 'u') {
        var nm = it.name || it.url || 'Link';
        btn.innerHTML = '<span class="k">↗</span><span class="t">' + esc(nm) + '</span>';
        btn.title = String(it.url || '');
        btn.addEventListener('click', function () {
          if (it.url) window.location.href = it.url;
        });
      } else {
        return;
      }

      el.appendChild(btn);
    });
  }

  async function loadCustomApps() {
    try {
      var raw = await BetterWebStorage.get(APPS_KEY);
      if (!raw) return [];
      if (!Array.isArray(raw)) return [];
      return raw
        .map(function (a) {
          if (!a) return null;
          return { name: String(a.name || '').trim(), url: String(a.url || '').trim() };
        })
        .filter(function (a) { return a && a.name && a.url; })
        .slice(0, 24);
    } catch (_) {
      return [];
    }
  }

  async function saveCustomApps(list) {
    try {
      await BetterWebStorage.set(APPS_KEY, Array.isArray(list) ? list.slice(0, 24) : []);
    } catch (_) {}
  }

  function customAppIconHtml(name) {
    var n = String(name || '').trim();
    var letter = (n ? n.charAt(0) : '★').toUpperCase();
    return '<span class="bw-app-letter">' + esc(letter) + '</span>';
  }

  function appTile(name, iconHtml, opts) {
    var o = opts || {};
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'app-tile';

    var icon = (o.html ? String(iconHtml || '') : esc(iconHtml || ''));
    btn.innerHTML = '<div class="app-ico">' + icon + '</div><div class="app-name">' + esc(name || 'App') + '</div>';
    return btn;
  }

  function renderApps(defaultApps, customApps) {
    var grid = $('#apps-grid');
    if (!grid) return;

    grid.innerHTML = '';

    (defaultApps || []).forEach(function (a) {
      var btn = appTile(a.name, a.iconHtml || '🌐', { html: true });
      btn.title = a.url;
      btn.addEventListener('click', function () {
        addRecentUrl(a.name, a.url).catch(function () {});
        window.location.href = a.url;
      });
      grid.appendChild(btn);
    });

    (customApps || []).forEach(function (a, idx) {
      var btn = appTile(a.name, customAppIconHtml(a.name), { html: true });
      btn.title = a.url;
      btn.addEventListener('click', function () {
        addRecentUrl(a.name, a.url).catch(function () {});
        window.location.href = a.url;
      });

      // Right click = remove (simple management)
      btn.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        if (!confirm('Remove app "' + a.name + '"?')) return;
        removeCustomApp(idx);
      });

      grid.appendChild(btn);
    });

    var plus = appTile('Add', '<span class="bw-app-plus">+</span>', { html: true });
    plus.classList.add('app-plus');
    plus.title = 'Add custom app';
    plus.addEventListener('click', openAddAppModal);
    grid.appendChild(plus);
  }

  async function removeCustomApp(idx) {
    var list = await loadCustomApps();
    if (idx < 0 || idx >= list.length) return;
    list.splice(idx, 1);
    await saveCustomApps(list);
    renderApps(DEFAULT_APPS, list);
  }

  // Add App Modal
  var appOverlay = $('#app-overlay');
  var appName = $('#app-name');
  var appUrl = $('#app-url');

  function openAddAppModal() {
    if (!appOverlay) return;
    if (appName) appName.value = '';
    if (appUrl) appUrl.value = '';
    appOverlay.classList.add('open');
    setTimeout(function () { if (appName) appName.focus(); }, 60);
  }

  function closeAddAppModal() {
    if (!appOverlay) return;
    appOverlay.classList.remove('open');
  }

  async function saveAddAppModal() {
    var name = appName ? String(appName.value || '').trim() : '';
    var url = appUrl ? String(appUrl.value || '').trim() : '';

    if (!name) {
      if (appName) appName.focus();
      return alert('Please enter a name.');
    }

    url = normalizeUrl(url);
    if (!isSafeUrl(url)) {
      if (appUrl) appUrl.focus();
      return alert('Please enter a valid http(s) URL.');
    }

    var list = await loadCustomApps();

    // Dedupe by URL
    var next = [{ name: name, url: url }];
    list.forEach(function (a) {
      if (!a || !a.name || !a.url) return;
      if (String(a.url) === url) return;
      next.push(a);
    });

    await saveCustomApps(next);
    renderApps(DEFAULT_APPS, next);
    closeAddAppModal();
  }

  if ($('#app-close')) $('#app-close').addEventListener('click', closeAddAppModal);
  if ($('#app-cancel')) $('#app-cancel').addEventListener('click', closeAddAppModal);
  if ($('#app-save')) $('#app-save').addEventListener('click', function () { saveAddAppModal().catch(function () {}); });

  if (appOverlay) {
    appOverlay.addEventListener('click', function (e) {
      if (e.target === appOverlay) closeAddAppModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAddAppModal();
    if (e.key === 'Enter' && appOverlay && appOverlay.classList.contains('open')) {
      var t = e.target;
      if (t && (t.id === 'app-name' || t.id === 'app-url')) {
        e.preventDefault();
        saveAddAppModal().catch(function () {});
      }
    }
  });

  // Recents clear
  var recentsClear = $('#recents-clear');
  if (recentsClear) recentsClear.addEventListener('click', function () { clearRecents().catch(function () {}); });

  // ─── Search ──────────────────────────────────
  var engineToggle = $('#engine-toggle');
  var engineDrop = $('#engine-dropdown');
  var engineLetter = $('#engine-letter');
  var searchInput = $('#search-input');

  function setEngine(key, opts) {
    var o = opts || {};
    if (!ENGINES[key]) key = 'google';
    current = key;
    var eng = ENGINES[key];
    engineLetter.textContent = eng.letter;
    engineLetter.style.background = 'linear-gradient(135deg, ' + eng.color + ', #a855f7)';
    $$('.engine-opt').forEach(function (o2) { o2.classList.toggle('active', o2.dataset.engine === key); });

    if (o.persist !== false) updateSettings({ searchEngine: key }).catch(function () {});
  }

  engineToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    ddOpen = !ddOpen;
    engineDrop.classList.toggle('open', ddOpen);
  });

  $$('.engine-opt').forEach(function (opt) {
    opt.addEventListener('click', function () {
      setEngine(opt.dataset.engine);
      ddOpen = false;
      engineDrop.classList.remove('open');
      searchInput.focus();
    });
  });

  document.addEventListener('click', function () {
    if (ddOpen) { ddOpen = false; engineDrop.classList.remove('open'); }
  });

  function performSearch(q) {
    var query = String(q || '').trim();
    if (!query) return;
    window.location.href = (ENGINES[current] || ENGINES.google).url + encodeURIComponent(query);
  }

  async function doSearch() {
    var q = searchInput.value.trim();
    if (!q) return;
    try { await addRecentQuery(q); } catch (_) {}
    performSearch(q);
  }

  $('#search-btn').addEventListener('click', function () { doSearch().catch(function () {}); });
  searchInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch().catch(function () {}); });

  // ─── Store ───────────────────────────────────
  var storeGrid = $('#store-grid');
  var storeLoading = $('#store-loading');
  var storeEmpty = $('#store-empty');
  var installOverlay = $('#install-overlay');
  var instCheck = $('#inst-check');
  var instConfirm = $('#inst-confirm');
  var currentExt = null;
  var installed = {};

  async function loadStore() {
    storeGrid.innerHTML = '';
    storeLoading.style.display = 'block';
    storeEmpty.style.display = 'none';

    try {
      installed = await BetterWebInstaller.getInstalled();
    } catch (_) {
      installed = {};
    }

    try {
      var result = await BetterWebRegistry.fetch();
      var exts = (result && result.extensions) || [];
      storeLoading.style.display = 'none';
      if (exts.length === 0) { storeEmpty.style.display = 'block'; return; }
      renderExts(exts);
    } catch (err) {
      storeLoading.style.display = 'none';
      storeEmpty.style.display = 'block';
    }
  }

  function renderExts(exts) {
    storeGrid.innerHTML = '';

    exts.forEach(function (ext) {
      var inst = installed[ext.id];
      var isInst = !!inst;
      var isEnabled = inst ? !!inst.enabled : false;

      var isOfficial = (ext.publisher && (ext.publisher.includes('Leon.cgn.lx') || ext.publisher.includes('BetterWeb Official')));

      var card = document.createElement('div');
      card.className = 'ext-card';

      var publisherHtml = esc(ext.publisher);
      if (isOfficial) {
        publisherHtml += ' <span class="official-badge">OFFICIAL</span>';
      }

      var toggleBtnHtml = '';
      if (isInst && (ext.type === 'mod' || (inst && inst.type === 'mod'))) {
        toggleBtnHtml = '<button class="ext-toggle">' + (isEnabled ? 'Disable' : 'Enable') + '</button>';
      }

      card.innerHTML =
        '<div class="ext-card-top">' +
        '<div class="ext-icon">' + esc(ext.icon || '\uD83D\uDCE6') + '</div>' +
        '<div class="ext-info"><h4>' + esc(ext.name) + '</h4><span class="ext-pub">' + publisherHtml + ' \u00B7 v' + esc(ext.version) + '</span></div>' +
        '</div>' +
        '<p class="ext-desc">' + esc(ext.description) + '</p>' +
        '<div class="ext-actions">' +
        '<button class="ext-install' + (isInst ? ' installed' : '') + '">' + (isInst ? '\u2713 Installed' : 'Install') + '</button>' +
        toggleBtnHtml +
        '</div>';

      var installBtn = card.querySelector('.ext-install');
      if (!isInst && installBtn) {
        installBtn.addEventListener('click', function () {
          openInstallModal(ext);
        });
      }

      var toggleBtn = card.querySelector('.ext-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', async function () {
          var next = !isEnabled;
          toggleBtn.textContent = next ? 'Enabling...' : 'Disabling...';
          toggleBtn.disabled = true;

          await BetterWebInstaller.toggle(ext.id, next);

          // Refresh local cache + UI
          installed = await BetterWebInstaller.getInstalled();
          loadStore();
        });
      }

      storeGrid.appendChild(card);
    });
  }

  function openInstallModal(ext) {
    currentExt = ext;
    $('#inst-name').textContent = ext.name;

    var isOfficial = (ext.publisher && (ext.publisher.includes('Leon.cgn.lx') || ext.publisher.includes('BetterWeb Official')));
    var pubHtml = esc(ext.publisher);
    if (isOfficial) pubHtml += ' <span class="official-badge">OFFICIAL</span>';

    $('#inst-publisher').innerHTML = pubHtml;
    $('#inst-version').textContent = 'v' + ext.version;
    $('#inst-desc').textContent = ext.description;
    $('#inst-privacy').textContent = ext.privacy || 'No data stored.';

    var permsEl = $('#inst-perms');
    permsEl.innerHTML = '';
    (ext.permissions || []).forEach(function (p) {
      var s = document.createElement('span');
      s.className = 'perm';
      s.textContent = p;
      permsEl.appendChild(s);
    });

    instCheck.checked = false;
    instConfirm.disabled = true;
    instConfirm.textContent = 'Install';
    instConfirm.style.background = '';

    installOverlay.classList.add('open');
  }

  function closeInstallModal() {
    installOverlay.classList.remove('open');
    currentExt = null;
  }

  $('#inst-close').addEventListener('click', closeInstallModal);
  $('#inst-cancel').addEventListener('click', closeInstallModal);
  installOverlay.addEventListener('click', function (e) {
    if (e.target === installOverlay) closeInstallModal();
  });

  instCheck.addEventListener('change', function () {
    instConfirm.disabled = !instCheck.checked;
  });

  instConfirm.addEventListener('click', async function () {
    if (!currentExt || instConfirm.disabled) return;

    instConfirm.textContent = 'Installing...';
    instConfirm.disabled = true;

    var result = await BetterWebInstaller.install(currentExt);

    if (result && result.success) {
      instConfirm.textContent = 'Success!';
      setTimeout(function () {
        closeInstallModal();
        loadStore();
      }, 700);
    } else {
      instConfirm.textContent = 'Failed: ' + ((result && result.error) || 'Unknown error');
      instConfirm.style.background = '#ef4444';
      setTimeout(function () {
        instConfirm.textContent = 'Install';
        instConfirm.disabled = false;
        instConfirm.style.background = '';
      }, 3000);
    }
  });

  $('#store-refresh').addEventListener('click', loadStore);

  // ─── Tools Toggles ──────────────────────────
  // Media Inspector
  var toggleMedia = $('#toggle-media');
  var btnMediaTop = $('#btn-media-inspector');

  function syncMediaTopBtn() {
    try {
      if (!btnMediaTop || !toggleMedia) return;
      btnMediaTop.classList.toggle('active', !!toggleMedia.checked);
    } catch (_) {}
  }

  if (toggleMedia) {
    toggleMedia.addEventListener('change', function () {
      chrome.runtime.sendMessage({ action: 'toggleMediaInspector', enabled: toggleMedia.checked });
      updateSettings({ mediaInspector: toggleMedia.checked }).catch(function () {});
      syncMediaTopBtn();
    });
  }

  if (btnMediaTop && toggleMedia) {
    btnMediaTop.addEventListener('click', function () {
      toggleMedia.checked = !toggleMedia.checked;
      toggleMedia.dispatchEvent(new Event('change', { bubbles: true }));
      showToast('Media Inspector: ' + (toggleMedia.checked ? 'ON' : 'OFF'), toggleMedia.checked ? 'success' : 'info');
    });
  }

  // ShowMode
  var toggleShowMode = $('#toggle-showmode');
  var btnShowModeTop = $('#btn-showmode');

  function syncShowModeTopBtn() {
    try {
      if (!btnShowModeTop || !toggleShowMode) return;
      btnShowModeTop.classList.toggle('active', !!toggleShowMode.checked);
    } catch (_) {}
  }

  if (toggleShowMode) {
    toggleShowMode.addEventListener('change', function () {
      chrome.runtime.sendMessage({ action: 'toggleShowMode', enabled: toggleShowMode.checked });
      updateSettings({ showMode: toggleShowMode.checked }).catch(function () {});
      syncShowModeTopBtn();
    });
  }

  if (btnShowModeTop && toggleShowMode) {
    btnShowModeTop.addEventListener('click', function () {
      toggleShowMode.checked = !toggleShowMode.checked;
      toggleShowMode.dispatchEvent(new Event('change', { bubbles: true }));
      showToast('ShowMode: ' + (toggleShowMode.checked ? 'ON' : 'OFF'), toggleShowMode.checked ? 'success' : 'info');
    });
  }

  // Input Inspector
  var toggleInput = $('#toggle-input');
  var btnDownloadLogs = $('#btn-download-logs');
  var btnClearLogs = $('#btn-clear-logs');

  if (toggleInput) {
    toggleInput.addEventListener('change', function () {
      chrome.runtime.sendMessage({ action: 'toggleInputLogger', enabled: toggleInput.checked });
      updateSettings({ inputLogger: toggleInput.checked }).catch(function () {});
    });
  }

  if (btnDownloadLogs) {
    btnDownloadLogs.addEventListener('click', function () {
      chrome.runtime.sendMessage({ action: 'getInputLogs' }, function (resp) {
        if (!resp || !resp.success) return alert('Failed to retrieve logs.');
        var logs = resp.logs || [];
        if (logs.length === 0) return alert('No logs captured yet.');

        var blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'input-logs-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    });
  }

  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', function () {
      if (!confirm('Clear all recorded input logs?')) return;
      chrome.runtime.sendMessage({ action: 'clearInputLogs' }, function () {
        var original = btnClearLogs.innerHTML;
        btnClearLogs.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(function () { btnClearLogs.innerHTML = original; }, 1500);
      });
    });
  }

  // ─── Theme Loader (NO eval / new Function) ───
  function injectThemeCss(css) {
    var old = document.getElementById('bw-custom-theme');
    if (old) old.remove();
    if (!css) return;
    var style = document.createElement('style');
    style.id = 'bw-custom-theme';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function triggerThemeFlash() {
    try {
      var root = document.documentElement;
      root.classList.remove('bw-theme-flash');
      void root.offsetWidth;
      root.classList.add('bw-theme-flash');
      setTimeout(function () {
        try { root.classList.remove('bw-theme-flash'); } catch (_) {}
      }, 900);
    } catch (_) {}
  }

  async function applyTheme() {
    try {
      var themeResp = await new Promise(function (r) {
        chrome.runtime.sendMessage({ action: 'getActiveTheme' }, r);
      });
      var themeId = (themeResp && themeResp.themeId) ? themeResp.themeId : 'default';

      try {
        document.documentElement.setAttribute('data-bw-theme', themeId || 'default');
      } catch (_) {}

      if (themeId === 'default') {
        injectThemeCss('');
        triggerThemeFlash();
        return;
      }

      var inst = await BetterWebInstaller.getInstalled();
      var theme = inst && inst[themeId];
      var css = theme && (theme.themeCss || theme.css || '');
      injectThemeCss(css || '');
      triggerThemeFlash();
    } catch (e) {
      // Fail silently
    }
  }

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local' && changes.activeTheme) {
      applyTheme();
    }
  });

  applyTheme();

  // ─── Remote Version / Lock (extension/version.json on GitHub) ───
  var VERSION_REMOTE_URL = 'https://raw.githubusercontent.com/Heybrono/BetterWeb/main/extension/version.json';

  function semverParts(v) {
    return String(v || '0.0.0').trim().split('.').map(function (x) {
      var n = parseInt(x, 10);
      return isNaN(n) ? 0 : n;
    });
  }

  function semverCompare(a, b) {
    var pa = semverParts(a);
    var pb = semverParts(b);
    var len = Math.max(pa.length, pb.length);
    for (var i = 0; i < len; i++) {
      var da = pa[i] || 0;
      var db = pb[i] || 0;
      if (da > db) return 1;
      if (da < db) return -1;
    }
    return 0;
  }

  function setNews(items) {
    var wrap = $('#bw-upd-news-wrap');
    var list = $('#bw-upd-news');
    if (!wrap || !list) return;

    var arr = Array.isArray(items) ? items : [];
    if (!arr.length) {
      wrap.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    wrap.style.display = 'block';
    list.innerHTML = '';

    arr.slice(0, 6).forEach(function (n) {
      var d = document.createElement('div');
      d.style.cssText = 'padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03)';
      var date = n && n.date ? String(n.date) : '';
      var title = n && n.title ? String(n.title) : 'News';
      var body = n && n.body ? String(n.body) : '';
      d.innerHTML = '<div style="display:flex;gap:8px;align-items:baseline;justify-content:space-between"><div style="font-weight:900;font-size:12px">' + esc(title) + '</div><div style="font-size:11px;color:rgba(255,255,255,0.55)">' + esc(date) + '</div></div>' +
        (body ? '<div style="margin-top:6px;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.35">' + esc(body) + '</div>' : '');
      list.appendChild(d);
    });
  }

  function showUpdateModal(opts) {
    var overlay = $('#bw-update-overlay');
    if (!overlay) return;

    var titleEl = $('#bw-upd-title');
    var statusTitleEl = $('#bw-upd-status-title');
    var msgEl = $('#bw-upd-message');
    var actionEl = $('#bw-upd-action');

    var o = opts || {};
    if (titleEl) titleEl.textContent = o.title || 'Update';
    if (statusTitleEl) statusTitleEl.textContent = o.statusTitle || 'Status';
    if (msgEl) msgEl.textContent = o.message || '';

    if (actionEl) {
      actionEl.href = o.actionUrl || 'https://github.com/Heybrono/BetterWeb';
      actionEl.textContent = o.actionText || 'Jetzt aktualisieren';
    }

    setNews(o.news || []);

    overlay.classList.add('open');
  }

  function closeUpdateModal() {
    var overlay = $('#bw-update-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  (function wireUpdateModal() {
    var overlay = $('#bw-update-overlay');
    var x = $('#bw-upd-close');
    var later = $('#bw-upd-later');

    if (x) x.addEventListener('click', closeUpdateModal);
    if (later) later.addEventListener('click', closeUpdateModal);

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeUpdateModal();
      });
    }
  })();

  async function getVersionState() {
    // Ask background to refresh + provide cached state
    try {
      await new Promise(function (r) { chrome.runtime.sendMessage({ action: 'refreshVersionState' }, function () { r(); }); });
    } catch (_) {}

    try {
      var resp = await new Promise(function (r) { chrome.runtime.sendMessage({ action: 'getVersionState' }, r); });
      if (resp && resp.success && resp.state) return resp.state;
    } catch (_) {}

    // Fallback: direct fetch
    try {
      var res = await fetch(VERSION_REMOTE_URL + '?t=' + Date.now(), { cache: 'no-cache' });
      if (res.ok) return await res.json();
    } catch (_) {}

    return null;
  }

  (async function checkRemoteVersion() {
    var localV = (chrome.runtime.getManifest && chrome.runtime.getManifest().version) ? chrome.runtime.getManifest().version : '0.0.0';
    var state = await getVersionState();
    if (!state) return;

    var remoteV = state.version || '0.0.0';
    var github = state.github || 'https://github.com/Heybrono/BetterWeb';
    var locked = !!(state.lock && state.lock.enabled);
    var lockReason = (state.lock && state.lock.reason) ? String(state.lock.reason) : '';
    var msg = state.message ? String(state.message) : '';

    if (locked) {
      showUpdateModal({
        title: 'BetterWeb — Sperre aktiv',
        statusTitle: 'Wartung / Sperre',
        message: (lockReason || 'Die Extension ist aktuell gesperrt.') + (msg ? '\n\n' + msg : ''),
        actionUrl: github,
        actionText: 'GitHub öffnen',
        news: state.news || []
      });
      return;
    }

    if (remoteV && semverCompare(remoteV, localV) > 0) {
      showUpdateModal({
        title: 'Update verfügbar',
        statusTitle: 'Neue Version: v' + remoteV,
        message: 'Du nutzt v' + localV + '. Auf GitHub ist v' + remoteV + ' verfügbar.\n\nÖffne GitHub und aktualisiere dein Projekt (pull/neu zip/extension neu laden).',
        actionUrl: github,
        actionText: 'Jetzt aktualisieren',
        news: state.news || []
      });
      return;
    }

    // Optional: show message banner only if provided (no update required)
    if (msg && msg.trim()) {
      // keep quiet by default
    }
  })();

  // ────────────────────────────────────────────
  // Scratchpad Notes
  // ────────────────────────────────────────────
  var notesOverlay = $('#bw-notes-overlay');
  var notesTa = $('#bw-notes-ta');

  function openNotes() {
    if (!notesOverlay) return;
    notesOverlay.classList.add('open');
    setTimeout(function () { if (notesTa) notesTa.focus(); }, 60);
  }

  function closeNotes() {
    if (!notesOverlay) return;
    notesOverlay.classList.remove('open');
  }

  async function loadNotes() {
    try {
      var t = await BetterWebStorage.get(SCRATCHPAD_KEY);
      if (notesTa) notesTa.value = t ? String(t) : '';
    } catch (_) {}
  }

  var saveNotesDebounced = debounce(function () {
    try {
      if (!notesTa) return;
      BetterWebStorage.set(SCRATCHPAD_KEY, String(notesTa.value || '')).catch(function () {});
    } catch (_) {}
  }, 300);

  if (notesTa) notesTa.addEventListener('input', saveNotesDebounced);

  var notesCopy = $('#bw-notes-copy');
  if (notesCopy) {
    notesCopy.addEventListener('click', async function () {
      var txt = notesTa ? String(notesTa.value || '') : '';
      var ok = await copyTextToClipboard(txt);
      showToast(ok ? 'Notes copied' : 'Copy failed', ok ? 'success' : 'error');
    });
  }

  var notesClear = $('#bw-notes-clear');
  if (notesClear) {
    notesClear.addEventListener('click', async function () {
      if (!confirm('Clear scratchpad notes?')) return;
      try {
        if (notesTa) notesTa.value = '';
        await BetterWebStorage.set(SCRATCHPAD_KEY, '');
        showToast('Notes cleared', 'success');
      } catch (_) {}
    });
  }

  if ($('#bw-notes-close')) $('#bw-notes-close').addEventListener('click', closeNotes);
  if ($('#bw-notes-done')) $('#bw-notes-done').addEventListener('click', closeNotes);
  if (notesOverlay) {
    notesOverlay.addEventListener('click', function (e) {
      if (e.target === notesOverlay) closeNotes();
    });
  }

  // ────────────────────────────────────────────
  // Backup / Restore
  // ────────────────────────────────────────────
  var backupOverlay = $('#bw-backup-overlay');
  var backupFile = $('#bw-backup-file');

  function openBackup() {
    if (!backupOverlay) return;
    backupOverlay.classList.add('open');
  }

  function closeBackup() {
    if (!backupOverlay) return;
    backupOverlay.classList.remove('open');
  }

  function safeDateStamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  async function buildBackupPayload() {
    var keys = ['settings', 'installed', 'activeTheme', 'inputLogs', RECENTS_KEY, APPS_KEY, SCRATCHPAD_KEY, WORKSPACES_KEY];
    var all = {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      try { all[k] = await BetterWebStorage.get(k); } catch (_) { all[k] = null; }
    }

    return {
      schema: 'betterweb-backup-v1',
      createdAt: new Date().toISOString(),
      data: all
    };
  }

  function downloadJson(obj, filename) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { try { URL.revokeObjectURL(url); } catch (_) {} }, 1500);
  }

  var btnBackupExport = $('#bw-backup-export');
  if (btnBackupExport) {
    btnBackupExport.addEventListener('click', async function () {
      try {
        var payload = await buildBackupPayload();
        downloadJson(payload, 'betterweb-backup-' + safeDateStamp() + '.json');
        showToast('Backup downloaded', 'success');
      } catch (e) {
        showToast('Backup failed', 'error');
      }
    });
  }

  async function readBackupFile() {
    if (!backupFile || !backupFile.files || !backupFile.files[0]) return null;
    var file = backupFile.files[0];
    var txt = await file.text();
    var obj = JSON.parse(txt);
    return obj;
  }

  var btnBackupImport = $('#bw-backup-import');
  if (btnBackupImport) {
    btnBackupImport.addEventListener('click', async function () {
      var obj = null;
      try {
        obj = await readBackupFile();
      } catch (e) {
        showToast('Invalid JSON file', 'error');
        return;
      }

      if (!obj || obj.schema !== 'betterweb-backup-v1' || !obj.data) {
        showToast('Not a BetterWeb backup', 'error');
        return;
      }

      if (!confirm('Import backup now? This will overwrite your local BetterWeb data.')) return;

      try {
        var data = obj.data;
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          await BetterWebStorage.set(k, data[k]);
        }

        showToast('Imported. Reloading…', 'success');
        setTimeout(function () { location.reload(); }, 650);
      } catch (e2) {
        showToast('Import failed', 'error');
      }
    });
  }

  var btnBackupReset = $('#bw-backup-reset');
  if (btnBackupReset) {
    btnBackupReset.addEventListener('click', async function () {
      if (!confirm('Reset BetterWeb local data? This will remove installed store items, settings, apps, recents.')) return;
      try {
        await BetterWebStorage.clear();
        showToast('Reset done. Reloading…', 'success');
        setTimeout(function () { location.reload(); }, 650);
      } catch (_) {
        showToast('Reset failed', 'error');
      }
    });
  }

  if ($('#bw-backup-close')) $('#bw-backup-close').addEventListener('click', closeBackup);
  if (backupOverlay) {
    backupOverlay.addEventListener('click', function (e) {
      if (e.target === backupOverlay) closeBackup();
    });
  }

  // Wire tool cards
  if ($('#btn-open-notes')) $('#btn-open-notes').addEventListener('click', function () { loadNotes().catch(function () {}); openNotes(); });
  if ($('#btn-open-backup')) $('#btn-open-backup').addEventListener('click', openBackup);

  // ────────────────────────────────────────────
  // Tabs & Workspaces
  // ────────────────────────────────────────────
  var tabsOverlay = $('#bw-tabs-overlay');
  var tabsClose = $('#bw-tabs-close');
  var tabsFilter = $('#bw-tabs-filter');
  var tabsList = $('#bw-tabs-list');
  var wsName = $('#bw-ws-name');
  var wsSave = $('#bw-ws-save');
  var wsList = $('#bw-ws-list');

  var _tabsCache = [];
  var _wsCache = [];

  function openTabsOverlay(which) {
    if (!tabsOverlay) return;
    tabsOverlay.classList.add('open');
    setInnerTab(which || 'tabs');
    refreshTabsAndWorkspaces().catch(function () {});
    setTimeout(function () {
      if (which === 'workspaces') {
        if (wsName) wsName.focus();
      } else {
        if (tabsFilter) tabsFilter.focus();
      }
    }, 60);
  }

  function closeTabsOverlay() {
    if (!tabsOverlay) return;
    tabsOverlay.classList.remove('open');
  }

  function setInnerTab(tabId) {
    var t = String(tabId || 'tabs');
    $$('.bw-inner-tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === t);
    });
    var viewTabs = $('#bw-inner-view-tabs');
    var viewWs = $('#bw-inner-view-workspaces');
    if (viewTabs) viewTabs.classList.toggle('active', t === 'tabs');
    if (viewWs) viewWs.classList.toggle('active', t === 'workspaces');
  }

  async function queryTabsCurrentWindow() {
    try {
      var tabs = await new Promise(function (r) {
        chrome.tabs.query({ currentWindow: true }, r);
      });
      return Array.isArray(tabs) ? tabs : [];
    } catch (_) {
      return [];
    }
  }

  function safeHttpUrl(u) {
    try {
      var url = new URL(String(u || ''));
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
      return url.toString();
    } catch (_) {
      return '';
    }
  }

  function tabBadges(t) {
    var b = [];
    if (t && t.pinned) b.push('<span class="bw-badge on">PINNED</span>');
    if (t && t.audible) b.push('<span class="bw-badge">AUDIO</span>');
    if (t && t.mutedInfo && t.mutedInfo.muted) b.push('<span class="bw-badge">MUTED</span>');
    if (t && t.active) b.push('<span class="bw-badge">ACTIVE</span>');
    return b.length ? ('<div class="bw-tab-badges">' + b.join('') + '</div>') : '';
  }

  function renderTabsListFiltered() {
    if (!tabsList) return;
    var q = tabsFilter ? String(tabsFilter.value || '').trim().toLowerCase() : '';
    var arr = Array.isArray(_tabsCache) ? _tabsCache : [];

    if (q) {
      var tokens = q.split(/\s+/).filter(Boolean);
      arr = arr.filter(function (t) {
        var hay = (String(t.title || '') + ' ' + String(t.url || '')).toLowerCase();
        return tokens.every(function (tok) { return hay.indexOf(tok) !== -1; });
      });
    }

    tabsList.innerHTML = '';

    if (!arr.length) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:10px 12px;color:rgba(255,255,255,0.6);font-size:12px;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.03);border-radius:14px;';
      empty.textContent = q ? 'No tabs match your filter.' : 'No tabs detected.';
      tabsList.appendChild(empty);
      return;
    }

    arr.slice(0, 80).forEach(function (t) {
      var row = document.createElement('div');
      row.className = 'bw-tab-row';

      var fav = t.favIconUrl ? String(t.favIconUrl) : '';
      var title = String(t.title || t.url || 'Tab');
      var url = String(t.url || '');

      row.innerHTML =
        '<div class="bw-tab-left">' +
          (fav ? '<img class="bw-tab-fav" alt="" src="' + esc(fav) + '" />' : '<div class="bw-tab-fav" style="background:rgba(255,255,255,0.08)"></div>') +
          '<div style="min-width:0;flex:1">' +
            '<div class="bw-tab-title">' + esc(title) + '</div>' +
            '<div class="bw-tab-url">' + esc(url) + '</div>' +
            tabBadges(t) +
          '</div>' +
        '</div>' +
        '<div class="bw-tab-actions">' +
          '<button class="bw-act primary" type="button" title="Activate" data-act="activate">↩</button>' +
          '<button class="bw-act" type="button" title="Pin / Unpin" data-act="pin">📌</button>' +
          '<button class="bw-act" type="button" title="Mute / Unmute" data-act="mute">🔇</button>' +
          '<button class="bw-act" type="button" title="Copy URL" data-act="copy">⧉</button>' +
          '<button class="bw-act danger" type="button" title="Close" data-act="close">✕</button>' +
        '</div>';

      row.querySelectorAll('button[data-act]').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.getAttribute('data-act');
          handleTabAction(t, act).catch(function () {});
        });
      });

      // Click anywhere = activate
      row.addEventListener('click', function (e) {
        var trg = e.target;
        if (trg && trg.closest && trg.closest('button')) return;
        handleTabAction(t, 'activate').catch(function () {});
      });

      tabsList.appendChild(row);
    });
  }

  async function handleTabAction(t, act) {
    if (!t || !t.id) return;
    var a = String(act || 'activate');

    try {
      if (a === 'activate') {
        chrome.tabs.update(t.id, { active: true });
        if (t.windowId) chrome.windows.update(t.windowId, { focused: true });
        closeTabsOverlay();
        return;
      }

      if (a === 'close') {
        chrome.tabs.remove(t.id);
        showToast('Tab closed', 'info');
        setTimeout(function () { refreshTabsOnly().catch(function () {}); }, 80);
        return;
      }

      if (a === 'pin') {
        chrome.tabs.update(t.id, { pinned: !t.pinned });
        showToast(!t.pinned ? 'Pinned' : 'Unpinned', 'success');
        setTimeout(function () { refreshTabsOnly().catch(function () {}); }, 120);
        return;
      }

      if (a === 'mute') {
        var muted = !!(t.mutedInfo && t.mutedInfo.muted);
        chrome.tabs.update(t.id, { muted: !muted });
        showToast(!muted ? 'Muted' : 'Unmuted', 'success');
        setTimeout(function () { refreshTabsOnly().catch(function () {}); }, 120);
        return;
      }

      if (a === 'copy') {
        var ok = await copyTextToClipboard(String(t.url || ''));
        showToast(ok ? 'URL copied' : 'Copy failed', ok ? 'success' : 'error');
        return;
      }
    } catch (_) {
      showToast('Tab action failed', 'error');
    }
  }

  async function loadWorkspaces() {
    try {
      var raw = await BetterWebStorage.get(WORKSPACES_KEY);
      if (!raw) return [];
      if (!Array.isArray(raw)) return [];
      return raw
        .map(function (w) {
          if (!w) return null;
          var name = String(w.name || '').trim();
          var tabs = Array.isArray(w.tabs) ? w.tabs : [];
          return {
            id: String(w.id || ''),
            name: name || 'Workspace',
            createdAt: w.createdAt || '',
            tabs: tabs
              .map(function (t) {
                if (!t) return null;
                var url = safeHttpUrl(t.url);
                if (!url) return null;
                return { url: url, title: String(t.title || ''), pinned: !!t.pinned };
              })
              .filter(Boolean)
          };
        })
        .filter(function (w) { return w && w.id && w.name; })
        .slice(0, 40);
    } catch (_) {
      return [];
    }
  }

  async function saveWorkspaces(list) {
    try {
      await BetterWebStorage.set(WORKSPACES_KEY, Array.isArray(list) ? list.slice(0, 40) : []);
    } catch (_) {}
  }

  function prettyDate(iso) {
    try {
      var d = iso ? new Date(iso) : null;
      if (!d || isNaN(d.getTime())) return '';
      return d.toLocaleString();
    } catch (_) {
      return '';
    }
  }

  async function saveCurrentWorkspaceFromWindow(name) {
    var nm = String(name || '').trim();
    if (!nm) throw new Error('Missing workspace name');

    var tabs = await queryTabsCurrentWindow();
    var cleanedTabs = (tabs || [])
      .map(function (t) {
        if (!t) return null;
        var url = safeHttpUrl(t.url);
        if (!url) return null;
        return { url: url, title: String(t.title || ''), pinned: !!t.pinned };
      })
      .filter(Boolean);

    if (!cleanedTabs.length) throw new Error('No http(s) tabs found');

    var list = await loadWorkspaces();
    var id = 'ws-' + Date.now();
    var ws = { id: id, name: nm, createdAt: new Date().toISOString(), tabs: cleanedTabs };

    // Put on top, dedupe by name
    var next = [ws];
    list.forEach(function (w) {
      if (!w || !w.id) return;
      if (String(w.name || '').trim().toLowerCase() === nm.toLowerCase()) return;
      next.push(w);
    });

    await saveWorkspaces(next);
    _wsCache = next;
    renderWorkspaces();
    return ws;
  }

  async function openWorkspaceNewWindow(ws) {
    var w = ws;
    if (!w || !Array.isArray(w.tabs) || !w.tabs.length) return;

    var urls = w.tabs.map(function (t) { return t.url; }).filter(Boolean);
    if (!urls.length) return;

    var win = await new Promise(function (r) {
      try {
        chrome.windows.create({ url: urls }, r);
      } catch (_) {
        r(null);
      }
    });

    // Best-effort: pin tabs that were pinned in the workspace
    try {
      if (win && win.id) {
        var newTabs = await new Promise(function (r) { chrome.tabs.query({ windowId: win.id }, r); });
        (newTabs || []).forEach(function (t, idx) {
          try {
            var src = w.tabs[idx];
            if (src && src.pinned) chrome.tabs.update(t.id, { pinned: true });
          } catch (_) {}
        });
      }
    } catch (_) {}

    showToast('Workspace opened: ' + w.name, 'success');
  }

  async function openWorkspaceHere(ws) {
    var w = ws;
    if (!w || !Array.isArray(w.tabs) || !w.tabs.length) return;

    // Create tabs in current window (keep New Tab open)
    for (var i = 0; i < w.tabs.length; i++) {
      var t = w.tabs[i];
      if (!t || !t.url) continue;
      try {
        await new Promise(function (r) {
          chrome.tabs.create({ url: t.url, active: i === 0 }, function () { r(); });
        });
      } catch (_) {}
    }

    showToast('Workspace opened here: ' + w.name, 'success');
  }

  async function deleteWorkspace(id) {
    var wsId = String(id || '');
    if (!wsId) return;
    var list = await loadWorkspaces();
    var next = list.filter(function (w) { return w && w.id !== wsId; });
    await saveWorkspaces(next);
    _wsCache = next;
    renderWorkspaces();
  }

  async function copyWorkspaceUrls(ws) {
    var w = ws;
    if (!w || !Array.isArray(w.tabs)) return;
    var txt = w.tabs.map(function (t) { return t.url; }).filter(Boolean).join('\n');
    var ok = await copyTextToClipboard(txt);
    showToast(ok ? 'URLs copied' : 'Copy failed', ok ? 'success' : 'error');
  }

  function renderWorkspaces() {
    if (!wsList) return;
    var arr = Array.isArray(_wsCache) ? _wsCache : [];

    wsList.innerHTML = '';

    if (!arr.length) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:10px 12px;color:rgba(255,255,255,0.6);font-size:12px;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.03);border-radius:14px;';
      empty.textContent = 'No workspaces yet. Save your current window to create one.';
      wsList.appendChild(empty);
      return;
    }

    arr.slice(0, 40).forEach(function (w) {
      var row = document.createElement('div');
      row.className = 'bw-ws-row';

      var count = Array.isArray(w.tabs) ? w.tabs.length : 0;
      var date = prettyDate(w.createdAt);

      row.innerHTML =
        '<div style="min-width:0;flex:1">' +
          '<div class="bw-ws-title">' + esc(w.name) + '</div>' +
          '<div class="bw-ws-sub">' + esc(count + ' tabs') + (date ? (' • ' + esc(date)) : '') + '</div>' +
        '</div>' +
        '<div class="bw-ws-actions">' +
          '<button class="bw-act primary" type="button" title="Open in new window" data-act="open">↗</button>' +
          '<button class="bw-act" type="button" title="Open here" data-act="here">＋</button>' +
          '<button class="bw-act" type="button" title="Copy URLs" data-act="copy">⧉</button>' +
          '<button class="bw-act danger" type="button" title="Delete" data-act="del">✕</button>' +
        '</div>';

      row.querySelectorAll('button[data-act]').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.getAttribute('data-act');
          (async function () {
            if (act === 'open') return openWorkspaceNewWindow(w);
            if (act === 'here') return openWorkspaceHere(w);
            if (act === 'copy') return copyWorkspaceUrls(w);
            if (act === 'del') {
              if (!confirm('Delete workspace "' + w.name + '"?')) return;
              return deleteWorkspace(w.id);
            }
          })().catch(function () {});
        });
      });

      wsList.appendChild(row);
    });
  }

  async function refreshTabsOnly() {
    _tabsCache = await queryTabsCurrentWindow();
    renderTabsListFiltered();
  }

  async function refreshTabsAndWorkspaces() {
    _tabsCache = await queryTabsCurrentWindow();
    _wsCache = await loadWorkspaces();
    renderTabsListFiltered();
    renderWorkspaces();
  }

  // Wire modal
  if (tabsClose) tabsClose.addEventListener('click', closeTabsOverlay);
  if (tabsOverlay) {
    tabsOverlay.addEventListener('click', function (e) {
      if (e.target === tabsOverlay) closeTabsOverlay();
    });
  }

  $$('.bw-inner-tab').forEach(function (b) {
    b.addEventListener('click', function () {
      setInnerTab(b.getAttribute('data-tab'));
      if (b.getAttribute('data-tab') === 'workspaces') {
        refreshTabsAndWorkspaces().catch(function () {});
        setTimeout(function () { if (wsName) wsName.focus(); }, 50);
      }
      if (b.getAttribute('data-tab') === 'tabs') {
        refreshTabsOnly().catch(function () {});
        setTimeout(function () { if (tabsFilter) tabsFilter.focus(); }, 50);
      }
    });
  });

  if (tabsFilter) {
    tabsFilter.addEventListener('input', debounce(function () {
      renderTabsListFiltered();
    }, 80));
  }

  if (wsSave) {
    wsSave.addEventListener('click', function () {
      (async function () {
        try {
          var nm = wsName ? String(wsName.value || '').trim() : '';
          if (!nm) {
            showToast('Please enter a workspace name', 'error');
            if (wsName) wsName.focus();
            return;
          }
          wsSave.disabled = true;
          var old = wsSave.textContent;
          wsSave.textContent = 'Saving…';
          await saveCurrentWorkspaceFromWindow(nm);
          wsSave.textContent = old;
          wsSave.disabled = false;
          showToast('Workspace saved', 'success');
        } catch (e) {
          wsSave.disabled = false;
          wsSave.textContent = 'Save current window';
          showToast(e && e.message ? e.message : 'Save failed', 'error');
        }
      })().catch(function () {});
    });
  }

  if (wsName) {
    wsName.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (wsSave) wsSave.click();
      }
    });
  }

  // Tool card button
  if ($('#btn-open-tabs')) $('#btn-open-tabs').addEventListener('click', function () { openTabsOverlay('tabs'); });

  // ────────────────────────────────────────────
  // Command Palette
  // ────────────────────────────────────────────
  var paletteOverlay = $('#bw-palette-overlay');
  var paletteInput = $('#bw-palette-input');
  var paletteList = $('#bw-palette-list');

  var paletteItems = [];
  var paletteActive = 0;

  function closePalette() {
    if (!paletteOverlay) return;
    paletteOverlay.classList.remove('open');
  }

  function openPalette() {
    if (!paletteOverlay) return;
    paletteOverlay.classList.add('open');
    setTimeout(function () {
      if (paletteInput) {
        paletteInput.value = '';
        paletteInput.focus();
      }
      rebuildPalette().catch(function () {});
    }, 60);
  }

  function paletteRawQuery() {
    return paletteInput ? String(paletteInput.value || '') : '';
  }

  function queryTokens(raw) {
    var q = String(raw || '').trim().toLowerCase();
    if (!q) return [];
    return q.split(/\s+/).map(function (t) { return t.trim(); }).filter(Boolean);
  }

  function matchesTokens(item, raw) {
    var tokens = queryTokens(raw);
    if (!tokens.length) return true;
    var hay = ((item.title || '') + ' ' + (item.sub || '') + ' ' + (item.kind || '')).toLowerCase();
    return tokens.every(function (tok) { return hay.indexOf(tok) !== -1; });
  }

  function setPaletteActive(idx) {
    paletteActive = Math.max(0, Math.min(idx, Math.max(0, paletteItems.length - 1)));
    renderPalette();
    try {
      var el = paletteList && paletteList.children ? paletteList.children[paletteActive] : null;
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    } catch (_) {}
  }

  function renderPalette() {
    if (!paletteList) return;
    paletteList.innerHTML = '';

    if (!paletteItems.length) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:10px 12px;color:rgba(255,255,255,0.6);font-size:12px;';
      empty.textContent = 'No results.';
      paletteList.appendChild(empty);
      return;
    }

    paletteItems.forEach(function (it, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bw-palette-item' + (idx === paletteActive ? ' active' : '');
      b.innerHTML =
        '<div style="min-width:0">' +
          '<div class="bw-palette-title">' + esc(it.title || '') + '</div>' +
          (it.sub ? '<div class="bw-palette-sub">' + esc(it.sub) + '</div>' : '') +
        '</div>' +
        (it.kind ? '<div class="bw-palette-k">' + esc(it.kind) + '</div>' : '');

      b.addEventListener('click', function () {
        runPaletteItem(idx).catch(function () {});
      });

      paletteList.appendChild(b);
    });
  }

  async function runPaletteItem(idx) {
    var it = paletteItems[idx];
    if (!it || typeof it.run !== 'function') return;
    closePalette();
    try {
      await it.run();
    } catch (e) {
      showToast('Action failed', 'error');
    }
  }

  function isLikelyUrlInput(raw) {
    var s = String(raw || '').trim();
    if (!s) return false;
    if (/^https?:\/\//i.test(s)) return true;
    if (s.indexOf(' ') !== -1) return false;
    return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[\/\?#].*)?$/i.test(s);
  }

  // Safe calculator (no eval)
  function calcTokenize(expr) {
    var s = String(expr || '').replace(/\s+/g, '');
    var tokens = [];
    var i = 0;

    function isDigit(ch) { return ch >= '0' && ch <= '9'; }

    while (i < s.length) {
      var ch = s[i];

      if (isDigit(ch) || ch === '.') {
        var j = i + 1;
        while (j < s.length && (isDigit(s[j]) || s[j] === '.')) j++;
        var num = s.slice(i, j);
        if (num === '.' || num.split('.').length > 2) throw new Error('Invalid number');
        tokens.push({ t: 'num', v: parseFloat(num) });
        i = j;
        continue;
      }

      if (ch === '(' || ch === ')') {
        tokens.push({ t: 'par', v: ch });
        i++;
        continue;
      }

      if ('+-*/%^'.indexOf(ch) !== -1) {
        tokens.push({ t: 'op', v: ch });
        i++;
        continue;
      }

      throw new Error('Invalid character');
    }

    // Insert unary minus as 0 - x
    var out = [];
    for (var k = 0; k < tokens.length; k++) {
      var tok = tokens[k];
      if (tok.t === 'op' && tok.v === '-') {
        var prev = out.length ? out[out.length - 1] : null;
        var isUnary = !prev || (prev.t === 'op') || (prev.t === 'par' && prev.v === '(');
        if (isUnary) {
          out.push({ t: 'num', v: 0 });
        }
      }
      out.push(tok);
    }

    return out;
  }

  function calcToRpn(tokens) {
    var prec = { '^': 4, '*': 3, '/': 3, '%': 3, '+': 2, '-': 2 };
    var rightAssoc = { '^': true };

    var out = [];
    var st = [];

    tokens.forEach(function (tok) {
      if (tok.t === 'num') out.push(tok);
      else if (tok.t === 'op') {
        while (st.length) {
          var top = st[st.length - 1];
          if (top.t !== 'op') break;
          var p1 = prec[tok.v];
          var p2 = prec[top.v];
          if (p2 > p1 || (p2 === p1 && !rightAssoc[tok.v])) out.push(st.pop());
          else break;
        }
        st.push(tok);
      } else if (tok.t === 'par' && tok.v === '(') st.push(tok);
      else if (tok.t === 'par' && tok.v === ')') {
        while (st.length && !(st[st.length - 1].t === 'par' && st[st.length - 1].v === '(')) {
          out.push(st.pop());
        }
        if (!st.length) throw new Error('Mismatched parentheses');
        st.pop();
      }
    });

    while (st.length) {
      var x = st.pop();
      if (x.t === 'par') throw new Error('Mismatched parentheses');
      out.push(x);
    }

    return out;
  }

  function calcEvalRpn(rpn) {
    var st = [];
    rpn.forEach(function (tok) {
      if (tok.t === 'num') st.push(tok.v);
      else if (tok.t === 'op') {
        var b = st.pop();
        var a = st.pop();
        if (a == null || b == null) throw new Error('Invalid expression');
        var r;
        if (tok.v === '+') r = a + b;
        else if (tok.v === '-') r = a - b;
        else if (tok.v === '*') r = a * b;
        else if (tok.v === '/') r = a / b;
        else if (tok.v === '%') r = a % b;
        else if (tok.v === '^') r = Math.pow(a, b);
        else throw new Error('Unknown op');
        st.push(r);
      }
    });
    if (st.length !== 1) throw new Error('Invalid expression');
    return st[0];
  }

  function tryCalculate(raw) {
    var s = String(raw || '').trim();
    if (!s) return null;
    if (!/^[0-9+\-*/().%\s^]+$/.test(s)) return null;
    if (!/[+\-*/%^]/.test(s)) return null;

    try {
      var tokens = calcTokenize(s);
      var rpn = calcToRpn(tokens);
      var val = calcEvalRpn(rpn);
      if (!isFinite(val)) return null;
      return val;
    } catch (_) {
      return null;
    }
  }

  function formatCalcNumber(n) {
    if (Number.isInteger(n)) return String(n);
    var s = String(Math.round(n * 1000000000000) / 1000000000000);
    return s;
  }

  async function rebuildPalette() {
    var raw = paletteRawQuery();
    var qLower = String(raw || '').trim().toLowerCase();

    // Always compute fresh state on open/typing (installed items can change)
    var apps = await loadCustomApps();
    var inst = {};
    try { inst = await BetterWebInstaller.getInstalled(); } catch (_) { inst = {}; }

    var s = {};
    try { s = await getSettings(); } catch (_) { s = {}; }

    var workspaces = [];
    try { workspaces = await loadWorkspaces(); } catch (_) { workspaces = []; }

    var items = [];

    // Always present:
    items.push({ title: 'Open: Tabs & Workspaces', sub: 'Manage tabs + save/reopen workspaces', kind: 'tool', run: async function () { openTabsOverlay('tabs'); } });

    // URL quick-open
    if (qLower && isLikelyUrlInput(qLower)) {
      items.push({
        title: 'Open URL: ' + qLower,
        sub: 'Open directly (no search)',
        kind: 'url',
        run: async function () {
          var u = normalizeUrl(qLower);
          if (!isSafeUrl(u)) { showToast('Invalid URL', 'error'); return; }
          addRecentUrl(u, u).catch(function () {});
          window.location.href = u;
        }
      });
    }

    // Calculator
    if (qLower) {
      var calc = tryCalculate(qLower);
      if (calc != null) {
        items.push({
          title: 'Calculate: ' + qLower + ' = ' + formatCalcNumber(calc),
          sub: 'Enter to copy result',
          kind: 'calc',
          run: async function () {
            var ok = await copyTextToClipboard(formatCalcNumber(calc));
            showToast(ok ? 'Result copied' : 'Copy failed', ok ? 'success' : 'error');
          }
        });
      }
    }

    // Workspaces
    items.push({
      title: 'Save workspace: current window',
      sub: 'Opens Workspaces and focuses the name input',
      kind: 'workspace',
      run: async function () {
        openTabsOverlay('workspaces');
        setTimeout(function () { if (wsName) wsName.focus(); }, 80);
      }
    });

    items.push({ title: 'Open: Workspaces', sub: 'Save or open saved tab sets', kind: 'workspace', run: async function () { openTabsOverlay('workspaces'); } });
    workspaces.slice(0, 12).forEach(function (w) {
      var count = Array.isArray(w.tabs) ? w.tabs.length : 0;
      items.push({
        title: 'Open workspace: ' + w.name,
        sub: count + ' tabs',
        kind: 'workspace',
        run: async function () { await openWorkspaceNewWindow(w); }
      });
    });

    // Web search
    if (qLower) {
      items.push({
        title: 'Search the web: ' + qLower,
        sub: (ENGINES[current] ? ENGINES[current].name : 'Search') + ' • Enter',
        kind: 'search',
        run: async function () {
          try { await addRecentQuery(qLower); } catch (_) {}
          performSearch(qLower);
        }
      });
    }

    // Tab command mode
    var tokens = queryTokens(qLower);
    var tabMode = null;
    var tabNeedle = qLower;
    if (tokens.length && (tokens[0] === 'tab' || tokens[0] === 'close' || tokens[0] === 'pin' || tokens[0] === 'mute')) {
      tabMode = tokens[0];
      tabNeedle = tokens.slice(1).join(' ');
    }

    // Tab results when query is typed
    if (qLower && qLower.length >= 2) {
      try {
        var tabs = await new Promise(function (r) { chrome.tabs.query({ currentWindow: true }, r); });
        var qq = (tabNeedle || qLower).toLowerCase();
        var qTokens = queryTokens(qq);

        var filtered = (tabs || []).filter(function (t) {
          if (!t) return false;
          var hay = (String(t.title || '') + ' ' + String(t.url || '')).toLowerCase();
          if (!qTokens.length) return true;
          return qTokens.every(function (tok) { return hay.indexOf(tok) !== -1; });
        }).slice(0, 10);

        filtered.forEach(function (t) {
          var title = String(t.title || t.url || 'Tab');
          if (tabMode === 'close') {
            items.push({
              title: 'Close tab: ' + title,
              sub: String(t.url || ''),
              kind: 'tab',
              run: async function () { chrome.tabs.remove(t.id); showToast('Tab closed', 'info'); }
            });
            return;
          }

          if (tabMode === 'pin') {
            items.push({
              title: (t.pinned ? 'Unpin tab: ' : 'Pin tab: ') + title,
              sub: String(t.url || ''),
              kind: 'tab',
              run: async function () { chrome.tabs.update(t.id, { pinned: !t.pinned }); showToast(t.pinned ? 'Unpinned' : 'Pinned', 'success'); }
            });
            return;
          }

          if (tabMode === 'mute') {
            var muted = !!(t.mutedInfo && t.mutedInfo.muted);
            items.push({
              title: (muted ? 'Unmute tab: ' : 'Mute tab: ') + title,
              sub: String(t.url || ''),
              kind: 'tab',
              run: async function () { chrome.tabs.update(t.id, { muted: !muted }); showToast(muted ? 'Unmuted' : 'Muted', 'success'); }
            });
            return;
          }

          // default: switch
          items.push({
            title: 'Switch to tab: ' + title,
            sub: String(t.url || ''),
            kind: 'tab',
            run: async function () {
              try { chrome.tabs.update(t.id, { active: true }); } catch (_) {}
              try { chrome.windows.update(t.windowId, { focused: true }); } catch (_) {}
            }
          });
        });
      } catch (_) {}
    }

    // Navigation
    items.push({ title: 'Go to: Home', sub: 'Switch view', kind: 'nav', run: async function () { goView('home'); } });
    items.push({ title: 'Go to: Store', sub: 'Mods + Themes', kind: 'nav', run: async function () { goView('store'); } });
    items.push({ title: 'Go to: Tools', sub: 'Developer tools', kind: 'nav', run: async function () { goView('tools'); } });

    // Notes / Backup
    items.push({ title: 'Open: Scratchpad Notes', sub: 'Quick notes with autosave', kind: 'tool', run: async function () { await loadNotes(); openNotes(); } });
    items.push({ title: 'Open: Backup & Restore', sub: 'Export/import BetterWeb data', kind: 'tool', run: async function () { openBackup(); } });

    // Quick toggles
    items.push({ title: (s.mediaInspector ? 'Disable: Media Inspector' : 'Enable: Media Inspector'), sub: 'Dev tool overlay', kind: 'toggle', run: async function () {
      var next = !s.mediaInspector;
      if (toggleMedia) { toggleMedia.checked = next; toggleMedia.dispatchEvent(new Event('change', { bubbles: true })); }
    } });

    items.push({ title: (s.showMode ? 'Disable: ShowMode' : 'Enable: ShowMode'), sub: 'Element inspector overlay', kind: 'toggle', run: async function () {
      var next = !s.showMode;
      if (toggleShowMode) { toggleShowMode.checked = next; toggleShowMode.dispatchEvent(new Event('change', { bubbles: true })); }
    } });

    items.push({ title: (s.inputLogger ? 'Disable: Input Inspector' : 'Enable: Input Inspector'), sub: 'Logs input events (dev)', kind: 'toggle', run: async function () {
      var next = !s.inputLogger;
      if (toggleInput) { toggleInput.checked = next; toggleInput.dispatchEvent(new Event('change', { bubbles: true })); }
    } });

    // Default apps
    DEFAULT_APPS.forEach(function (a) {
      items.push({
        title: 'Open app: ' + a.name,
        sub: a.url,
        kind: 'app',
        run: async function () {
          addRecentUrl(a.name, a.url).catch(function () {});
          window.location.href = a.url;
        }
      });
    });

    // Custom apps
    apps.forEach(function (a) {
      items.push({
        title: 'Open app: ' + a.name,
        sub: a.url,
        kind: 'app',
        run: async function () {
          addRecentUrl(a.name, a.url).catch(function () {});
          window.location.href = a.url;
        }
      });
    });

    // Default theme
    items.push({
      title: 'Activate theme: Default',
      sub: 'Reset to BetterWeb default',
      kind: 'theme',
      run: async function () {
        await new Promise(function (r) {
          chrome.runtime.sendMessage({ action: 'setActiveTheme', themeId: 'default' }, function () { r(); });
        });
        showToast('Theme activated: Default', 'success');
      }
    });

    // Installed mods/themes
    Object.entries(inst || {}).forEach(function (entry) {
      var id = entry[0];
      var it = entry[1] || {};
      var name = String(it.name || id);
      var type = String(it.type || '');

      if (type === 'mod') {
        items.push({
          title: (it.enabled ? 'Disable mod: ' : 'Enable mod: ') + name,
          sub: id,
          kind: 'mod',
          run: async function () {
            var next = !it.enabled;
            await BetterWebInstaller.toggle(id, next);
            showToast((next ? 'Enabled: ' : 'Disabled: ') + name, next ? 'success' : 'info');
          }
        });

        items.push({
          title: 'Run mod now: ' + name,
          sub: id,
          kind: 'mod',
          run: async function () {
            await new Promise(function (r) {
              chrome.runtime.sendMessage({ action: 'runModNow', id: id }, function () { r(); });
            });
            showToast('Run now: ' + name, 'success');
          }
        });
      }

      if (type === 'theme') {
        items.push({
          title: 'Activate theme: ' + name,
          sub: id,
          kind: 'theme',
          run: async function () {
            await new Promise(function (r) {
              chrome.runtime.sendMessage({ action: 'setActiveTheme', themeId: id }, function () { r(); });
            });
            showToast('Theme activated: ' + name, 'success');
          }
        });
      }
    });

    if (qLower) {
      items = items.filter(function (it) { return matchesTokens(it, qLower); });
    }

    paletteItems = items.slice(0, 30);
    paletteActive = 0;
    renderPalette();
  }

  if ($('#bw-palette-close')) $('#bw-palette-close').addEventListener('click', closePalette);
  if (paletteOverlay) {
    paletteOverlay.addEventListener('click', function (e) {
      if (e.target === paletteOverlay) closePalette();
    });
  }

  if (paletteInput) {
    paletteInput.addEventListener('input', debounce(function () {
      rebuildPalette().catch(function () {});
    }, 80));

    paletteInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setPaletteActive(paletteActive + 1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setPaletteActive(paletteActive - 1); }
      if (e.key === 'Enter') { e.preventDefault(); runPaletteItem(paletteActive).catch(function () {}); }
      if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
    });
  }

  var btnCommand = $('#btn-command');
  if (btnCommand) btnCommand.addEventListener('click', openPalette);

  // ────────────────────────────────────────────
  // Global shortcuts
  // ────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    var key = String(e.key || '');
    var lower = key.toLowerCase();

    // Cmd/Ctrl+K
    if ((e.ctrlKey || e.metaKey) && lower === 'k') {
      e.preventDefault();
      openPalette();
      return;
    }

    // Cmd/Ctrl+Shift+L = Tabs & Workspaces
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && lower === 'l') {
      e.preventDefault();
      openTabsOverlay('tabs');
      return;
    }

    // '/' focuses search (like many apps)
    if (key === '/' && !isTypingInInput()) {
      e.preventDefault();
      goView('home');
      var si = $('#search-input');
      if (si) si.focus();
      return;
    }

    // Esc closes overlays
    if (key === 'Escape') {
      closePalette();
      closeNotes();
      closeBackup();
      closeTabsOverlay();
    }
  }, true);

  // ─── Init state from storage ─────────────────
  (async function () {
    try {
      var s = await getSettings();
      if (toggleMedia) toggleMedia.checked = !!s.mediaInspector;
      if (toggleShowMode) toggleShowMode.checked = !!s.showMode;
      if (toggleInput) toggleInput.checked = !!s.inputLogger;
      try { syncMediaTopBtn(); } catch (_) {}
      try { syncShowModeTopBtn(); } catch (_) {}

      setEngine(s.searchEngine || 'google', { persist: false });
      await loadNotes();
    } catch (_) {
      setEngine('google', { persist: false });
    }
  })();

  // ─── Init ────────────────────────────────────
  (async function initHomeEnhancements() {
    try {
      var recents = await loadRecents();
      renderRecents(recents);

      var custom = await loadCustomApps();
      renderApps(DEFAULT_APPS, custom);
    } catch (_) {}
  })();

  loadStore();
  setTimeout(function () { try { searchInput.focus(); } catch (_) {} }, 200);

})();
