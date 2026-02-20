// BetterWeb Mod: Dev Mode Ultimate
(function () {
  'use strict';
  if (window.__bwDevModeUltimateStore) return;
  window.__bwDevModeUltimateStore = true;

  var HUD_ID = 'bw-devmode-hud';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function fmtBytes(n) {
    if (!n || n < 1024) return String(n || 0) + ' B';
    var u = ['KB', 'MB', 'GB'];
    var v = n;
    var i = -1;
    do { v /= 1024; i++; } while (v >= 1024 && i < u.length - 1);
    return v.toFixed(1) + ' ' + u[i];
  }

  function ensure() {
    if (document.getElementById(HUD_ID)) return;

    var hud = document.createElement('div');
    hud.id = HUD_ID;
    hud.style.cssText = 'position:fixed;bottom:18px;left:18px;width:340px;max-height:50vh;overflow:auto;z-index:2147483647;background:rgba(5,5,10,0.86);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.14);border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,0.55);color:#e5e7eb;font:12px ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;pointer-events:auto';

    hud.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.08)">' +
        '<div style="font-weight:900;letter-spacing:0.06em;font-size:11px;color:#a855f7">DEV MODE ULTIMATE</div>' +
        '<button type="button" id="bw-dm-x" style="width:28px;height:28px;border-radius:10px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer">' + String.fromCodePoint(0x2715) + '</button>' +
      '</div>' +
      '<div id="bw-dm-body" style="padding:10px 12px"></div>';

    (document.documentElement || document.body).appendChild(hud);

    var x = hud.querySelector('#bw-dm-x');
    if (x) x.addEventListener('click', function () { hud.remove(); });
  }

  function update() {
    var body = document.getElementById('bw-dm-body');
    if (!body) return;

    var media = Array.from(document.querySelectorAll('video,audio'));
    var scripts = Array.from(document.scripts || []);
    var links = Array.from(document.querySelectorAll('link[rel=stylesheet]'));
    var mem = (performance && performance.memory) ? performance.memory.usedJSHeapSize : null;

    var ml = media.slice(0, 8).map(function (m, i) {
      return '<div style="margin-top:4px;color:#93c5fd">' + m.tagName + '#' + (i + 1) + '</div>' +
             '<div style="opacity:0.8;word-break:break-all">' + esc(m.currentSrc || m.src || '(no src)') + '</div>';
    }).join('');

    body.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">' +
        '<span style="padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05)">scripts: <b>' + scripts.length + '</b></span>' +
        '<span style="padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05)">styles: <b>' + links.length + '</b></span>' +
        '<span style="padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05)">media: <b>' + media.length + '</b></span>' +
        (mem ? '<span style="padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05)">heap: <b>' + fmtBytes(mem) + '</b></span>' : '') +
      '</div>' +
      '<div style="font-weight:800;color:#10b981;margin-top:4px">Media (top)</div>' +
      (ml || '<div style="opacity:0.7;margin-top:6px">No media detected.</div>') +
      '<div style="opacity:0.6;margin-top:10px">URL: ' + esc(location.href) + '</div>';
  }

  ensure();
  update();
  setInterval(update, 1500);
})();
