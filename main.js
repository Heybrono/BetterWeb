/* =============================================
   BetterWeb — Advanced Browser Intelligence
   by leon.cgn.lx
   Full production JS
   ============================================= */

(function () {
  'use strict';

  // ─── Config ──────────────────────────────────
  var ENGINES = {
    google:     { name: 'Google',     url: 'https://www.google.com/search?q=',   letter: 'G', color: '#4285f4' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',         letter: 'D', color: '#de5833' },
    yahoo:      { name: 'Yahoo',      url: 'https://search.yahoo.com/search?p=', letter: 'Y', color: '#720e9e' },
  };

  // Whole program is BETA (Early Access)
  var GITIGNORE_TXT = [
    '# BetterWeb (Builder)',
    '# Helper scripts are one-time setup tools and should not be committed',
    'setup-github.cmd',
    'setup-github.bat',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# Common',
    'node_modules/',
    'dist/',
    '.env'
  ].join('\n');

  // Expanded Demo Extensions List
  var DEMO_EXTENSIONS = [
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
      target: 'content'
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
      target: 'content'
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
      target: 'content'
    },
    {
      id: 'mod-whatsapp-galaxy',
      name: 'WhatsApp Galaxy Look+',
      publisher: 'Leon.cgn.lx',
      version: '1.0.1',
      description: 'Galaxy glass UI + RGB outline + theme switcher for WhatsApp Web (with panel button).',
      privacy: 'Runs locally on web.whatsapp.com.',
      permissions: ['activeTab'],
      icon: '💬',
      type: 'mod',
      target: 'content'
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
      target: 'content'
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
      target: 'content'
    },
    {
      id: 'mod-chatgpt-autocontinue',
      name: 'ChatGPT Auto-Continue',
      publisher: 'Leon.cgn.lx',
      version: '1.0.0',
      description: 'Auto-clicks “Continue generating” when ChatGPT pauses mid-answer.',
      privacy: 'Runs locally on chatgpt.com.',
      permissions: ['activeTab'],
      icon: '⏭️',
      type: 'mod',
      target: 'content'
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
      target: 'content'
    },
    {
      id: 'mod-speed-reader',
      name: 'Speed Reader',
      publisher: 'Leon.cgn.lx',
      version: '1.0.0',
      description: 'RSVP speed reading — select text, read at 100-1000 WPM with focus highlighting.',
      privacy: 'Runs locally.',
      permissions: ['activeTab'],
      icon: '📖',
      type: 'mod',
      target: 'content'
    },
    {
      id: 'mod-scroll-progress',
      name: 'Scroll Progress',
      publisher: 'Leon.cgn.lx',
      version: '1.0.0',
      description: 'Top progress bar showing how far you scrolled. Click to hide/show.',
      privacy: 'Runs locally.',
      permissions: ['activeTab'],
      icon: '📊',
      type: 'mod',
      target: 'content'
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
      target: 'content'
    },
    {
      id: 'mod-site-notes',
      name: 'Site Notes',
      publisher: 'Leon.cgn.lx',
      version: '1.0.0',
      description: 'Floating notes per website (saved to localStorage). Great for research.',
      privacy: 'Saved locally per site.',
      permissions: ['activeTab'],
      icon: '📝',
      type: 'mod',
      target: 'content'
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
      target: 'newtab'
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
      target: 'newtab'
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
      target: 'newtab'
    }
  ];

  var README_MD = [
    '# BetterWeb 🌌',
    '',
    '<div align="center">',
    '',
    '<a href="https://github.com/Heybrono/BetterWeb"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-BetterWeb-181717?style=for-the-badge&logo=github"></a>',
    '<img alt="Chrome Manifest V3" src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white">',
    '<img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge">',
    '',
    '**Advanced Browser Intelligence**',
    '',
    'Galaxy New Tab · Mod Store · Dev Tools · MV3-safe Mods (no eval)',
    '',
    '</div>',
    '',
    '---',
    '',
    '## Inhaltsverzeichnis',
    '',
    '- [⬇️ Download & Installation](#️-download--installation)',
    '- [✨ Features](#-features)',
    '- [🧩 Mods & Themes](#-mods--themes)',
    '- [🏗️ ChatGPT Project Builder (Mod)](#️-chatgpt-project-builder-mod)',
    '- [🔔 Update- & Wartungs-System](#-update--wartungs-system)',
    '- [🧱 Architektur (kurz)](#-architektur-kurz)',
    '- [🛡️ Sicherheit / Privacy](#️-sicherheit--privacy)',
    '- [📜 License](#-license)',
    '',
    '---',
    '',
    '## ⬇️ Download & Installation',
    '',
    '### Option A (empfohlen): Download als ZIP (Builder)',
    '',
    'Wenn du den **BetterWeb Extension Builder** nutzt:',
    '',
    '1. Im Builder auf **Download Extension** klicken',
    '2. ZIP entpacken (z.B. `BetterWeb-Extension.zip`)',
    '3. In Chrome: `chrome://extensions`',
    '4. **Entwicklermodus** aktivieren',
    '5. **Entpackte Erweiterung laden** → Ordner `extension/` auswählen',
    '',
    '### Option B: Direkt von GitHub',
    '',
    '- Repo ZIP: https://github.com/Heybrono/BetterWeb/archive/refs/heads/main.zip',
    '- Oder: GitHub → **Code** → **Download ZIP**',
    '',
    'Danach genauso installieren (Ordner `extension/` laden).',
    '',
    '---',
    '',
    '## ✨ Features',
    '',
    '| Bereich | Was du bekommst |',
    '|---|---|',
    '| 🌌 New Tab | Starfield, Galaxy-Gradient, Glass UI, Search Engine Switcher |',
    '| 🧩 Mod Store (BETA) | Installieren/Aktivieren von Mods & Themes (lokal gespeichert) |',
    '| 🛠️ Dev Tools | ShowMode / Media Inspector / Input Tools (erweiterbar) |',
    '| 🔔 Updates | Update-Popup bei neuer Version + Remote-Wartungssperre via GitHub |',
    '',
    '**Wichtig (Manifest V3):** Chrome MV3 blockiert `eval` / `new Function` für Remote-JS.',
    'BetterWeb führt deshalb Mods **MV3-safe** aus (als eingebaute Module im Content Script).',
    '',
    '---',
    '',
    '## 🧩 Mods & Themes',
    '',
    '> **BETA-Hinweis:** Der Store ist aktuell experimentell. Manche Mods/Themes können noch Bugs haben oder sich je nach Website ändern.',
    '',
    '- **Registry:** `store/extensions.json`',
    '- **Mods:** laufen auf Webseiten (Content Script) und werden per ID verwaltet (z.B. `mod-whatsapp-galaxy`).',
    '- **Themes:** sind CSS und werden im New Tab als `<style id="bw-custom-theme">` injiziert.',
    '',
    '### Enthaltene Mods (Auszug)',
    '',
    '| Mod | ID |',
    '|---|---|',
    '| WhatsApp Galaxy Look+ | `mod-whatsapp-galaxy` |',
    '| ChatGPT Galaxy Theme | `mod-chatgpt-galaxy` |',
    '| ChatGPT Project Builder | `mod-chatgpt-project` |',
    '| ChatGPT Auto-Continue | `mod-chatgpt-autocontinue` |',
    '| YouTube Cinema Mode | `mod-yt-cinema` |',
    '| Speed Reader | `mod-speed-reader` |',
    '| Scroll Progress | `mod-scroll-progress` |',
    '| Untrack Links | `mod-untrack-links` |',
    '| Site Notes | `mod-site-notes` |',
    '',
    '---',
    '',
    '## 🏗️ ChatGPT Project Builder (Mod)',
    '',
    'Der Mod hängt sich an **chatgpt.com** und macht aus einer 1-Zeilen-Projektbeschreibung einen Prompt.',
    '',
    '### Workflow',
    '',
    '1. Mod aktivieren',
    '2. Builder öffnen',
    '3. Mode wählen:',
    '   - **Standard**: nur Files',
    '   - **Agent Mode+**: Plan + Build',
    '4. Beschreibung in eine Zeile tippen → **Enter** oder **Send**',
    '5. Sobald ChatGPT Dateien im Format unten ausgibt, erscheint unten automatisch die Download-Leiste:',
    '   - Dropdown: **ZIP (alle Files)** oder **einzelne Datei**',
    '   - Button **Download**',
    '   - Fancy Progress Popup + Auto-Download',
    '',
    '### Erwartetes Ausgabeformat von ChatGPT',
    '',
    '```text',
    '--- FILENAME: path/to/file.ext ---',
    '(inhalt)',
    '--- END FILE ---',
    '```',
    '',
    '---',
    '',
    '## 🔔 Update- & Wartungs-System',
    '',
    'BetterWeb lädt beim Start remote diese Datei:',
    '- `extension/version.json`',
    '',
    'Damit kannst du:',
    '- **Version hochsetzen** → New Tab zeigt Update-Popup',
    '- **Wartungssperre aktivieren** → Install/Toggle/Run wird blockiert + Grund wird angezeigt',
    '',
    '### Beispiel: `extension/version.json`',
    '',
    '```json',
    '{',
    '  "version": "1.2.0",',
    '  "github": "https://github.com/Heybrono/BetterWeb",',
    '  "lock": {',
    '    "enabled": false,',
    '    "reason": "Wartung: WhatsApp Mod Fix"',
    '  },',
    '  "message": "Kurze Info, z.B. bekannte Bugs oder Hinweise",',
    '  "news": [',
    '    { "date": "2026-02-17", "title": "Update", "body": "Neue Mods + Fixes" }',
    '  ]',
    '}',
    '```',
    '',
    '---',
    '',
    '## 🧱 Architektur (kurz)',
    '',
    '- `extension/background.js` — Service Worker (Store/Registry, Install/Toggle/Sync/Version-Lock)',
    '- `extension/content-bridge.js` — Content Script: Mod Runner + UI + MV3-safe Implementierungen',
    '- `extension/newtab.html|css|js` — Galaxy New Tab UI',
    '- `store/extensions.json` — Registry (GitHub-hosted)',
    '',
    '---',
    '',
    '## 🛡️ Sicherheit / Privacy',
    '',
    '- Keine Account-Cookies/Session-Cookies werden genutzt.',
    '- Mods laufen lokal im Browser.',
    '- `mod-untrack-links` verändert Links (entfernt Tracking-Parameter).',
    '- `mod-site-notes` speichert Notizen **pro Domain** in `localStorage`.',
    '',
    '---',
    '',
    '## 📜 License',
    '',
    'MIT — © 2026 leon.cgn.lx / Heybrono'
  ].join('\n');

  var currentEngine = 'google';
  var dropdownOpen = false;
  var installedExts = {};

  // ─── Persistence ─────────────────────────────
  function loadInstalled() {
    try {
      var raw = localStorage.getItem('betterweb-installed');
      if (raw) installedExts = JSON.parse(raw);
    } catch (_) { /* ignore */ }
  }

  function saveInstalled() {
    try {
      localStorage.setItem('betterweb-installed', JSON.stringify(installedExts));
    } catch (_) { /* ignore */ }
  }

  loadInstalled();

  // ─── DOM helpers ─────────────────────────────
  var $ = function (s, p) { return (p || document).querySelector(s); };
  var $$ = function (s, p) { return (p || document).querySelectorAll(s); };

  // ─── Starfield ───────────────────────────────
  var canvas = $('#starfield');
  var ctx = canvas.getContext('2d');
  var stars = [], shootingStars = [];
  var W, H;
  var mouseX = 0, mouseY = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    var count = Math.min(Math.floor((W * H) / 3200), 1000);
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.2,
        baseAlpha: Math.random() * 0.55 + 0.2,
        alpha: 0,
        speed: Math.random() * 0.012 + 0.004,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random() * 3 + 1,
        hue: Math.random() > 0.88 ? (Math.random() > 0.5 ? 220 : 270) : 0,
      });
    }
  }

  function spawnShootingStar() {
    if (shootingStars.length >= 2) return;
    shootingStars.push({
      x: Math.random() * W * 0.7,
      y: Math.random() * H * 0.3,
      len: Math.random() * 90 + 50,
      speed: Math.random() * 5 + 3,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4,
      alpha: 1,
      life: 0,
      maxLife: 55 + Math.random() * 35,
    });
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    var px = (mouseX - W / 2) * 0.015;
    var py = (mouseY - H / 2) * 0.015;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.phase += s.speed;
      s.alpha = s.baseAlpha * (0.45 + 0.55 * Math.sin(s.phase));
      var ox = s.x + px * s.depth * 0.3;
      var oy = s.y + py * s.depth * 0.3;
      ctx.fillStyle = s.hue
        ? 'hsla(' + s.hue + ',80%,75%,' + s.alpha + ')'
        : 'rgba(255,255,255,' + s.alpha + ')';
      ctx.beginPath();
      ctx.arc(((ox % W) + W) % W, ((oy % H) + H) % H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var j = shootingStars.length - 1; j >= 0; j--) {
      var ss = shootingStars[j];
      ss.life++;
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.alpha = 1 - ss.life / ss.maxLife;
      var tx = ss.x - Math.cos(ss.angle) * ss.len;
      var ty = ss.y - Math.sin(ss.angle) * ss.len;
      var g = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(255,255,255,' + (ss.alpha * 0.75) + ')');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(ss.x, ss.y);
      ctx.stroke();
      if (ss.life >= ss.maxLife) shootingStars.splice(j, 1);
    }

    requestAnimationFrame(drawFrame);
  }

  resize();
  requestAnimationFrame(drawFrame);
  setInterval(spawnShootingStar, 4500);
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', function (e) { mouseX = e.clientX; mouseY = e.clientY; });

  // ─── Particles ───────────────────────────────
  (function initParticles() {
    var el = $('#particles');
    if (!el) return;
    if (!document.getElementById('particle-kf')) {
      var s = document.createElement('style');
      s.id = 'particle-kf';
      s.textContent = '@keyframes particleUp{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:0.5}90%{opacity:0.15}100%{transform:translateY(-110vh) translateX(var(--drift));opacity:0}}';
      document.head.appendChild(s);
    }
    var count = Math.min(Math.floor(window.innerWidth / 65), 24);
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      var sz = Math.random() * 2.5 + 0.6;
      var x = Math.random() * 100;
      var dur = Math.random() * 28 + 18;
      var del = Math.random() * 20;
      var drift = (Math.random() - 0.5) * 200;
      p.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:' + x + '%;bottom:-10px;opacity:0;animation:particleUp ' + dur + 's ' + del + 's linear infinite;--drift:' + drift + 'px;';
      el.appendChild(p);
    }
  })();

  // ─── Cursor Glow ─────────────────────────────
  if (window.matchMedia('(pointer:fine)').matches) {
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    document.addEventListener('mousemove', function (e) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
  }

  // ─── Search Engine ───────────────────────────
  var engineToggle = $('#hero-engine-toggle');
  var engineDrop = $('#hero-engine-dropdown');
  var engineLetter = $('#hero-engine-letter');
  var engineNameEl = $('#hero-engine-name');
  var searchInput = $('#hero-search-input');
  var searchBtn = $('#hero-search-btn');

  function setEngine(key) {
    if (!ENGINES[key]) return;
    currentEngine = key;
    var eng = ENGINES[key];
    engineLetter.textContent = eng.letter;
    engineLetter.style.background = 'linear-gradient(135deg, ' + eng.color + ', #a855f7)';
    if (engineNameEl) engineNameEl.textContent = eng.name;
    $$('.engine-option').forEach(function (o) {
      o.classList.toggle('active', o.dataset.engine === key);
    });
  }

  function toggleDropdown(show) {
    dropdownOpen = typeof show === 'boolean' ? show : !dropdownOpen;
    engineDrop.classList.toggle('open', dropdownOpen);
    var chev = $('.chevron-icon', engineToggle);
    if (chev) chev.classList.toggle('open', dropdownOpen);
  }

  function doSearch() {
    var q = searchInput.value.trim();
    if (!q) { searchInput.focus(); return; }
    var eng = ENGINES[currentEngine] || ENGINES.google;
    window.open(eng.url + encodeURIComponent(q), '_blank');
  }

  if (engineToggle) engineToggle.addEventListener('click', function (e) { e.stopPropagation(); toggleDropdown(); });

  $$('.engine-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      setEngine(opt.dataset.engine);
      toggleDropdown(false);
      searchInput.focus();
    });
  });

  document.addEventListener('click', function (e) {
    if (dropdownOpen && engineDrop && !engineDrop.contains(e.target) && !engineToggle.contains(e.target)) {
      toggleDropdown(false);
    }
  });

  if (searchBtn) searchBtn.addEventListener('click', doSearch);
  if (searchInput) searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') { searchInput.blur(); toggleDropdown(false); }
  });

  if (engineToggle) setEngine('google');

  // ─── Mobile Menu ─────────────────────────────
  var mobileBtn = $('#mobile-menu-btn');
  var mobileMenu = $('#mobile-menu');
  var mobileOpen = false;

  if (mobileBtn) {
    mobileBtn.addEventListener('click', function () {
      mobileOpen = !mobileOpen;
      mobileBtn.classList.toggle('active', mobileOpen);
      mobileMenu.classList.toggle('open', mobileOpen);
    });
  }

  $$('.mobile-nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileOpen = false;
      mobileBtn.classList.remove('active');
      mobileMenu.classList.remove('open');
    });
  });

  // ─── Nav Active State ────────────────────────
  var navLinks = $$('.nav-link');
  var sections = ['hero', 'features', 'architecture', 'store'];

  function updateActiveNav() {
    var scrollY = window.scrollY + 200;
    for (var i = sections.length - 1; i >= 0; i--) {
      var sec = document.getElementById(sections[i]);
      if (sec && sec.offsetTop <= scrollY) {
        navLinks.forEach(function (l) { l.classList.remove('active'); });
        var active = document.querySelector('.nav-link[data-section="' + sections[i] + '"]');
        if (active) active.classList.add('active');
        break;
      }
    }
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ─── Scroll Reveals ──────────────────────────
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var delay = parseInt(entry.target.dataset.delay) || 0;
        setTimeout(function () { entry.target.classList.add('visible'); }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(function (el) { revealObserver.observe(el); });

  // ─── Stat Counters ───────────────────────────
  var statObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  $$('.stat-number').forEach(function (el) { statObserver.observe(el); });

  function animateCounter(el) {
    var textVal = el.dataset.text;
    if (textVal) {
      el.textContent = textVal;
      return;
    }
    var target = parseFloat(el.dataset.target);
    var duration = 2000;
    var start = performance.now();

    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - t, 4);
      var val = ease * target;
      el.textContent = Math.floor(val) + '%';
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ─── Feature Card Tilt ───────────────────────
  $$('.feature-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var rotX = (y - 0.5) * -10;
      var rotY = (x - 0.5) * 10;
      card.style.transform = 'perspective(600px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
    });
  });

  // ─── Code Copy Buttons ───────────────────────
  $$('.code-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = 'Example code snippet';
      navigator.clipboard.writeText(text).then(function () {
        btn.classList.add('copied');
        setTimeout(function () { btn.classList.remove('copied'); }, 2000);
      });
    });
  });

  // ─── Import Modal ────────────────────────────
  var importOverlay = $('#import-modal-overlay');
  var importCloseBtn = $('#import-modal-close');
  var importBtn = $('#import-btn');
  var currentStep = 1;

  function openImportModal() {
    currentStep = 1;
    updateImportStep();
    importOverlay.classList.add('open');
  }

  function closeImportModal() {
    importOverlay.classList.remove('open');
  }

  function updateImportStep() {
    $$('.step-dot').forEach(function (dot) {
      var s = parseInt(dot.dataset.step);
      dot.classList.remove('active', 'completed');
      if (s === currentStep) dot.classList.add('active');
      else if (s < currentStep) dot.classList.add('completed');
    });
    var line1 = $('#step-line-1');
    var line2 = $('#step-line-2');
    if (line1) line1.style.width = currentStep > 1 ? '100%' : '0%';
    if (line2) line2.style.width = currentStep > 2 ? '100%' : '0%';
    for (var i = 1; i <= 3; i++) {
      var step = $('#import-step-' + i);
      if (step) step.classList.toggle('active', i === currentStep);
    }
  }

  if (importBtn) importBtn.addEventListener('click', openImportModal);
  if (importCloseBtn) importCloseBtn.addEventListener('click', closeImportModal);
  if (importOverlay) importOverlay.addEventListener('click', function (e) {
    if (e.target === importOverlay) closeImportModal();
  });

  var nextBtn1 = $('#import-next-1');
  var nextBtn2 = $('#import-next-2');
  var prevBtn2 = $('#import-prev-2');
  var prevBtn3 = $('#import-prev-3');

  if (nextBtn1) nextBtn1.addEventListener('click', function () { currentStep = 2; updateImportStep(); });
  if (nextBtn2) nextBtn2.addEventListener('click', function () { currentStep = 3; updateImportStep(); });
  if (prevBtn2) prevBtn2.addEventListener('click', function () { currentStep = 1; updateImportStep(); });
  if (prevBtn3) prevBtn3.addEventListener('click', function () { currentStep = 2; updateImportStep(); });

  var copyReadmeBtn = $('#copy-readme-btn');
  if (copyReadmeBtn) {
    copyReadmeBtn.addEventListener('click', async function () {
      try {
        var txt = '';
        try {
          var r = await fetch('README.md');
          if (r && r.ok) txt = await r.text();
        } catch (_) {}

        if (!txt) txt = README_MD;
        await navigator.clipboard.writeText(txt);

        copyReadmeBtn.classList.add('copied');
        setTimeout(function () { copyReadmeBtn.classList.remove('copied'); }, 2500);
      } catch (_) {}
    });
  }

  // ─── Mod Source Code (for ZIP generation) ────
  // Stored as plain strings to avoid template literal escaping issues.

  function getModCode(id) {
    if (id === 'dev-mode-ultimate') {
      return [
        '(function(){',
        'if(window.__devModeActive)return;',
        'window.__devModeActive=true;',
        'console.log("[DevMode] Spy Active");',
        'var p=document.createElement("div");',
        'p.style.cssText="position:fixed;bottom:20px;left:20px;width:320px;height:240px;background:rgba(5,5,10,0.9);color:#0f0;font-family:monospace;font-size:11px;z-index:999999;border:1px solid #0f0;overflow:auto;padding:10px;pointer-events:all;box-shadow:0 0 20px #000;border-radius:8px;backdrop-filter:blur(5px);";',
        'p.innerHTML=\'<div style="border-bottom:1px solid #333;margin-bottom:5px;font-weight:bold;color:#fff;display:flex;justify-content:space-between"><span>DEV MODE ULTIMATE</span><button onclick="this.parentElement.parentElement.remove();window.__devModeActive=false" style="border:none;background:none;color:#f00;cursor:pointer">x</button></div><div id="dm-logs"></div>\';',
        'document.body.appendChild(p);',
        'var l=p.querySelector("#dm-logs");',
        'function log(t,m){var d=document.createElement("div");d.style.marginBottom="2px";d.style.borderBottom="1px solid rgba(255,255,255,0.05)";d.innerHTML=\'<span style="color:#a855f7">[\'+ t +\']</span> <span style="color:#ddd">\'+m+\'</span>\';l.prepend(d);if(l.children.length>60)l.lastChild.remove();}',
        'var X=window.XMLHttpRequest;',
        'window.XMLHttpRequest=function(){var x=new X();var o=x.open;x.open=function(m,u){log("XHR",m+" "+u);return o.apply(this,arguments);};return x;};',
        'var F=window.fetch;',
        'window.fetch=async function(){var u=arguments[0]instanceof Request?arguments[0].url:arguments[0];log("FETCH",u);return F.apply(this,arguments);};',
        'var WS=window.WebSocket;',
        'window.WebSocket=function(u,pr){log("WS","Connect: "+u);return new WS(u,pr);};',
        'setInterval(function(){document.querySelectorAll("video,audio").forEach(function(m){if(m.d)return;m.d=true;log("MEDIA",m.tagName+": "+m.src);});},2000);',
        '})();'
      ].join('\n');
    }

    if (id === 'mod-focus') {
      return [
        'var c="ytd-browse[page-subtype=\\"home\\"] #contents,#secondary-inner,#related,.feed-item-container,[aria-label=\\"Timeline: Trending now\\"],aside[aria-label=\\"Sidebar\\"]{display:none!important;opacity:0!important;}";',
        'var s=document.createElement("style");',
        's.textContent=c;',
        'document.head.appendChild(s);',
        'console.log("[Focus] Active");'
      ].join('\n');
    }

    if (id === 'mod-pip') {
      return [
        'setInterval(function(){',
        '  document.querySelectorAll("video").forEach(function(v){',
        '    if(v.hasAttribute("d-p"))return;',
        '    v.setAttribute("d-p","t");',
        '    var b=document.createElement("button");',
        '    b.textContent="\uD83D\uDCFA";',
        '    b.style.cssText="position:absolute;top:10px;right:10px;z-index:9999;background:rgba(0,0,0,0.5);color:#fff;border:none;padding:5px;cursor:pointer;border-radius:4px;";',
        '    b.onclick=function(e){e.preventDefault();e.stopPropagation();v.requestPictureInPicture();};',
        '    v.parentElement.appendChild(b);',
        '  });',
        '},2000);'
      ].join('\n');
    }

    if (id === 'mod-whatsapp-galaxy') {
      return `
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
    '#app, #app>div, #app>div>div{background:transparent!important;}',

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
  ].join('\n');

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
`;
    }

    if (id === 'theme-midnight') {
      return 'var s=document.createElement("style");s.id="bw-custom-theme";s.textContent=":root{--bg:#0f0518!important;--blue:#6d28d9;}body{background:#0f0518!important;}";document.head.appendChild(s);';
    }

    if (id === 'theme-matrix') {
      return 'var s=document.createElement("style");s.id="bw-custom-theme";s.textContent=":root{--bg:#000!important;--text-1:#0f0;--blue:#0f0;}body{background:#000!important;font-family:monospace!important;}";document.head.appendChild(s);';
    }

    if (id === 'theme-sunset') {
      return 'var s=document.createElement("style");s.id="bw-custom-theme";s.textContent=":root{--bg:#2a1015!important;--blue:#f59e0b;}body{background:linear-gradient(#2a1015,#1f0b12)!important;}";document.head.appendChild(s);';
    }

    return 'console.log("[BetterWeb] ' + id + ' loaded");';
  }

  function buildCmdScript() {
    var lines = [
      '@echo off',
      'setlocal EnableExtensions',
      'chcp 65001 >nul',
      'title BetterWeb Project Sync',
      'color 0A',
      '',
      'set "BW_DIR=%~dp0"',
      'set "BW_CMD=%BW_DIR%setup-github.cmd"',
      'set "BW_BAT=%BW_DIR%setup-github.bat"',
      '',
      'echo.',
      'echo ========================================================',
      'echo   BetterWeb Project Sync Tool (BETA)',
      'echo ========================================================',
      'echo.',
      'echo [INFO] This script uploads this project to YOUR GitHub repository.',
      'echo [INFO] It also ensures setup scripts are NOT committed (via .gitignore)',
      'echo       and cleans them up after a successful upload.',
      'echo.',
      'echo STEP 1: Create a repository on GitHub (can be empty or existing)',
      'echo         Go to: https://github.com/new',
      'echo STEP 2: Copy the HTTPS URL',
      'echo         Example: https://github.com/YourName/BetterWeb.git',
      'echo.',
      'set /p REPO_URL=Paste your repository URL here: ',
      'if "%REPO_URL%"=="" (',
      '    echo.',
      '    echo [ERROR] No URL entered.',
      '    pause',
      '    exit /b 1',
      ')',
      '',
      'echo [0/5] Ensuring .gitignore (so helper scripts are NOT committed)...',
      'if not exist ".gitignore" (',
      '    echo setup-github.cmd>>.gitignore',
      '    echo setup-github.bat>>.gitignore',
      ')',
      'findstr /i /c:"setup-github.cmd" .gitignore >nul || echo setup-github.cmd>>.gitignore',
      'findstr /i /c:"setup-github.bat" .gitignore >nul || echo setup-github.bat>>.gitignore',
      '',
      'echo [1/5] Initializing Git...',
      'git init',
      'git branch -M main',
      '',
      'echo [2/5] Setting remote...',
      'git remote remove origin 2>nul',
      'git remote add origin "%REPO_URL%"',
      '',
      'echo [3/5] Adding all files...',
      'git add -A',
      '',
      'echo [4/5] Creating commit...',
      'git commit -m "BetterWeb update from Builder"',
      '',
      'echo [5/5] Pushing to GitHub...',
      'echo       If a browser window opens, please sign in.',
      '',
      'git push -u origin main',
      'if errorlevel 1 goto TRYFORCEPUSH',
      'goto DONE',
      '',
      ':TRYFORCEPUSH',
      'echo.',
      'echo [WARN] Normal push failed (repo probably has existing content).',
      'echo.',
      'set /p FORCE=Do you want to FORCE push? This overwrites the remote! (y/n): ',
      'if /i "%FORCE%"=="y" (',
      '    echo.',
      '    echo [5/5] Force pushing...',
      '    git push -u origin main --force',
      '    if errorlevel 1 goto FAIL',
      '    goto DONE',
      ')',
      'echo.',
      'echo [INFO] Push cancelled. You can also try:',
      'echo        git pull origin main --rebase',
      'echo        git push -u origin main',
      'echo.',
      'pause',
      'exit /b 0',
      '',
      ':FAIL',
      'color 0C',
      'echo.',
      'echo [ERROR] Push failed. Make sure:',
      'echo   - You have Git installed',
      'echo   - The URL is correct',
      'echo   - You have permission to push',
      'echo.',
      'pause',
      'exit /b 1',
      '',
      ':DONE',
      'color 0A',
      'echo.',
      'echo ========================================================',
      'echo   [SUCCESS] Project uploaded!',
      'echo   View it at: %REPO_URL%',
      'echo ========================================================',
      'echo.',
      'pause',
      '',
      'echo.',
      'echo [CLEANUP] Removing helper scripts (setup-github.cmd / .bat)...',
      'start "" /b cmd /c "timeout /t 2 /nobreak >nul & del /f /q \"%BW_CMD%\" 2>nul & del /f /q \"%BW_BAT%\" 2>nul"',
      'endlocal',
      'exit /b 0'
    ];
    return lines.join('\r\n');
  }

  // ─── Project Download (ZIP) ────────────────
  // Note: GitHub "Code → Download ZIP" always downloads the whole repo.
  // If you want an extension-only ZIP from GitHub, use the auto-built Release asset
  // generated by .github/workflows/release-extension.yml.
  var downloadBtn = $('#download-project-btn');
  
  function generateIcon(size) {
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    var cx = c.getContext('2d');
    var grad = cx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#4f8fff');
    grad.addColorStop(1, '#a855f7');
    cx.fillStyle = 'rgba(0,0,0,0)';
    cx.clearRect(0, 0, size, size);

    // Outer orb (gradient)
    cx.fillStyle = grad;
    cx.beginPath();
    cx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    cx.fill();

    // Inner core
    cx.fillStyle = 'rgba(255,255,255,0.92)';
    cx.beginPath();
    cx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
    cx.fill();

    return c.toDataURL('image/png').split(',')[1];
  }

  async function downloadProject() {
    if (!window.JSZip) {
      alert('Download module loading...');
      return;
    }

    if (!downloadBtn) return;
    var btnContent = downloadBtn.innerHTML;
    downloadBtn.innerHTML = 'Packaging project...';
    downloadBtn.style.opacity = 0.7;

    try {
      var zip = new JSZip();

      function getCurrentIndexHtmlSnapshot() {
        try {
          var dt = document.doctype ? ('<!DOCTYPE ' + document.doctype.name + '>\n') : '<!DOCTYPE html>\n';
          return dt + document.documentElement.outerHTML;
        } catch (_) {
          try {
            return '<!DOCTYPE html>\n' + (document.documentElement ? document.documentElement.outerHTML : '');
          } catch (_2) {
            return '<!DOCTYPE html>\n<html><head><meta charset="utf-8"></head><body></body></html>';
          }
        }
      }

      async function fetchText(path) {
        var p = String(path || '');
        var lastStatus = null;
        var tried = [];

        function add(u) {
          if (!u) return;
          if (tried.indexOf(u) !== -1) return;
          tried.push(u);
        }

        add(p);
        add('./' + p.replace(/^\.?\//, ''));
        try { add(new URL(p, location.href).toString()); } catch (_) {}

        for (var i = 0; i < tried.length; i++) {
          var u = tried[i];
          try {
            var res = await fetch(u, { cache: 'no-cache' });
            if (res && res.ok) return await res.text();
            lastStatus = res ? res.status : null;
          } catch (_) {
            // keep trying
          }
        }

        // Miniapps preview sometimes blocks direct fetch('index.html') with 403.
        // Fallback: snapshot the current document.
        if (p === 'index.html') {
          return getCurrentIndexHtmlSnapshot();
        }

        throw new Error('Failed ' + p + (lastStatus ? ' (HTTP ' + lastStatus + ')' : ''));
      }

      // Root files (website + repo root)
      zip.file('index.html', await fetchText('index.html'));
      zip.file('styles.css', await fetchText('styles.css'));
      zip.file('main.js', await fetchText('main.js'));
      zip.file('manifest.json', await fetchText('manifest.json'));

      // Helper script (one-click GitHub upload)
      // Safe: if the file is missing in some environments, ZIP still builds.
      try { zip.file('bw-upload.cmd', await fetchText('bw-upload.cmd')); } catch (_) {}

      // Optional docs
      try { zip.file('README.md', await fetchText('README.md')); } catch (_) {}
      try { zip.file('LICENSE', await fetchText('LICENSE')); } catch (_) {}
      try { zip.file('.gitignore', await fetchText('.gitignore')); } catch (_) {}

      // Optional but useful for GitHub automation / packaging
      try { zip.file('.github/workflows/release-extension.yml', await fetchText('.github/workflows/release-extension.yml')); } catch (_) {}
      try { zip.file('scripts/package-extension.mjs', await fetchText('scripts/package-extension.mjs')); } catch (_) {}

      // Icons referenced by manifest.json
      var iconsFolder = zip.folder('icons');
      iconsFolder.file('icon16.png', generateIcon(16), { base64: true });
      iconsFolder.file('icon48.png', generateIcon(48), { base64: true });
      iconsFolder.file('icon128.png', generateIcon(128), { base64: true });

      // Extension folder
      var extFolder = zip.folder('extension');
      var extFiles = [
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

      for (var i = 0; i < extFiles.length; i++) {
        var f = extFiles[i];
        extFolder.file(f, await fetchText('extension/' + f));
      }

      // Store (registry + mod/theme entries for GitHub)
      var storeFolder = zip.folder('store');
      storeFolder.file('extensions.json', await fetchText('store/extensions.json'));

      var storeMods = storeFolder.folder('mods');
      var storeFiles = [
        'dev-mode-ultimate.js',
        'mod-focus.js',
        'mod-pip.js',
        'mod-whatsapp-galaxy.js',
        'mod-chatgpt-galaxy.js',
        'mod-chatgpt-project.js',
        'mod-chatgpt-autocontinue.js',
        'mod-yt-cinema.js',
        'mod-speed-reader.js',
        'mod-scroll-progress.js',
        'mod-untrack-links.js',
        'mod-site-notes.js',
        'theme-midnight.js',
        'theme-matrix.js',
        'theme-sunset.js'
      ];

      for (var j = 0; j < storeFiles.length; j++) {
        var sf = storeFiles[j];
        storeMods.file(sf, await fetchText('store/mods/' + sf));
      }

      var content = await zip.generateAsync({ type: 'blob' });
      var url = URL.createObjectURL(content);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'BetterWeb-Project.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () {
        try { URL.revokeObjectURL(url); } catch (_) {}
      }, 2500);

      setTimeout(function () {
        downloadBtn.innerHTML = btnContent;
        downloadBtn.style.opacity = 1;
      }, 300);

    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
      downloadBtn.innerHTML = btnContent;
      downloadBtn.style.opacity = 1;
    }
  }

  if (downloadBtn) downloadBtn.addEventListener('click', downloadProject);
  
  // ─── Registry ────────────────────────────────
  var grid = $('#extensions-grid');
  var loadingEl = $('#extensions-loading');
  var emptyEl = $('#extensions-empty');
  var fetchBtn = $('#registry-fetch-btn');
  var registryInput = $('#registry-url');

  function renderExtensions(exts) {
    if(!grid) return;
    grid.innerHTML = '';
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'none';
    
    exts.forEach(function (ext) {
      var isInstalled = !!installedExts[ext.id];
      var isOfficial = (ext.publisher && (ext.publisher.includes('Leon.cgn.lx') || ext.publisher.includes('Official')));
      
      var card = document.createElement('div');
      card.className = 'ext-card glass-box';
      
      var badge = isOfficial ? ' <span style="background:rgba(16,185,129,0.2);color:#10b981;padding:2px 6px;border-radius:4px;font-size:10px;border:1px solid rgba(16,185,129,0.3);font-weight:bold;margin-left:4px">OFFICIAL</span>' : '';
      
      card.innerHTML = 
        '<div class="ext-card-header">' +
          '<div class="ext-card-icon">' + (ext.icon || '📦') + '</div>' +
          '<div class="ext-card-info">' +
            '<h4>' + ext.name + '</h4>' +
            '<span class="ext-pub">' + ext.publisher + badge + '</span>' +
            '<span class="ext-ver">' + 'v' + ext.version + '</span>' +
          '</div>' +
        '</div>' +
        '<p class="ext-card-desc">' + ext.description + '</p>' +
        '<div class="ext-card-actions">' +
          '<button class="ext-btn-install' + (isInstalled ? ' installed' : '') + '">' +
            (isInstalled ? '✓ Installed' : 'Install') +
          '</button>' +
        '</div>';
        
       var btn = card.querySelector('.ext-btn-install');
       btn.addEventListener('click', function() {
         if(isInstalled) return;
         installedExts[ext.id] = { ...ext, installedAt: new Date().toISOString() };
         saveInstalled();
         btn.textContent = '✓ Installed';
         btn.classList.add('installed');
       });

      grid.appendChild(card);
    });
  }

  async function fetchRegistry() {
    var url = registryInput ? registryInput.value.trim() : '';
    if (!url || !grid) return;

    grid.innerHTML = '';
    if (loadingEl) loadingEl.style.display = 'block';

    try {
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var data = await resp.json();
      renderExtensions(data.extensions || []);
    } catch (err) {
      if (loadingEl) loadingEl.style.display = 'none';
      renderExtensions(DEMO_EXTENSIONS);
    }
  }

  if (fetchBtn) fetchBtn.addEventListener('click', fetchRegistry);
  renderExtensions(DEMO_EXTENSIONS);

  // Focus search on load
  if (searchInput) setTimeout(function () { searchInput.focus(); }, 600);

})();
