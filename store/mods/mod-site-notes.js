// BetterWeb Mod: Site Notes
(function () {
  'use strict';
  if (window.__bwSiteNotes) return;
  window.__bwSiteNotes = true;

  var FAB_ID = 'bw-notes-fab';
  var PANEL_ID = 'bw-notes-panel';
  var STYLE_ID = 'bw-notes-style';

  function key() {
    return 'bw-notes:' + (location && location.hostname ? location.hostname : 'site');
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '#' + FAB_ID + '{position:fixed;bottom:18px;right:18px;z-index:2147483647;width:46px;height:46px;border-radius:16px;border:1px solid rgba(255,255,255,0.14);background:rgba(10,5,20,0.7);backdrop-filter:blur(14px) saturate(130%);color:#fff;font:900 18px system-ui;cursor:pointer;box-shadow:0 18px 60px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;}',
      '#' + FAB_ID + ':hover{background:rgba(10,5,20,0.86);border-color:rgba(255,255,255,0.22);}',
      '#' + PANEL_ID + '{position:fixed;bottom:76px;right:18px;z-index:2147483647;width:min(420px,calc(100vw - 36px));max-height:min(520px,calc(100vh - 120px));overflow:auto;padding:14px;border-radius:18px;color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;border:1px solid rgba(255,255,255,0.12);background:rgba(10,5,20,0.86);backdrop-filter:blur(18px) saturate(130%);box-shadow:0 30px 90px rgba(0,0,0,0.55);display:none;}',
      '#' + PANEL_ID + ' .hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}',
      '#' + PANEL_ID + ' .t{font-weight:900;font-size:12px;letter-spacing:0.06em;color:#a855f7;}',
      '#' + PANEL_ID + ' .x{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;}',
      '#' + PANEL_ID + ' textarea{width:100%;min-height:220px;resize:vertical;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#fff;padding:12px 12px;font-size:13px;line-height:1.45;}',
      '#' + PANEL_ID + ' textarea:focus{outline:none;border-color:rgba(79,143,255,0.4);box-shadow:0 0 24px rgba(79,143,255,0.08);}',
      '#' + PANEL_ID + ' .hint{margin-top:8px;font-size:11px;color:rgba(255,255,255,0.55);}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function ensureUi() {
    injectStyle();

    if (!document.getElementById(FAB_ID)) {
      var b = document.createElement('button');
      b.id = FAB_ID;
      b.type = 'button';
      b.textContent = '📝';
      b.title = 'Site Notes';
      b.addEventListener('click', toggle);
      document.documentElement.appendChild(b);
    }

    if (!document.getElementById(PANEL_ID)) {
      var p = document.createElement('div');
      p.id = PANEL_ID;
      p.innerHTML =
        '<div class="hd"><div><div class="t">SITE NOTES</div><div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:2px">' + String(location.hostname || '') + '</div></div><button class="x" type="button">' + String.fromCodePoint(0x2715) + '</button></div>' +
        '<textarea id="bw-notes-ta" placeholder="Notizen für diese Seite..."></textarea>' +
        '<div class="hint">Autosave (localStorage) — nur auf dieser Domain sichtbar.</div>';
      document.documentElement.appendChild(p);

      var x = p.querySelector('.x');
      if (x) x.addEventListener('click', function () { p.style.display = 'none'; });

      var ta = p.querySelector('#bw-notes-ta');
      if (ta) {
        try { ta.value = localStorage.getItem(key()) || ''; } catch (_) {}
        ta.addEventListener('input', function () {
          try { localStorage.setItem(key(), ta.value); } catch (_) {}
        });
      }
    }
  }

  function toggle() {
    ensureUi();
    var p = document.getElementById(PANEL_ID);
    if (!p) return;
    p.style.display = (getComputedStyle(p).display !== 'none') ? 'none' : 'block';
  }

  ensureUi();
})();
