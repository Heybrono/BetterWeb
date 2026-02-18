// BetterWeb Mod: Scroll Progress
(function () {
  'use strict';
  if (window.__bwScrollProgress) return;
  window.__bwScrollProgress = true;

  var ID = 'bw-scroll-progress';
  var BAR_ID = 'bw-scroll-progress-bar';

  function ensure() {
    if (document.getElementById(ID)) return;

    var wrap = document.createElement('div');
    wrap.id = ID;
    wrap.style.cssText = 'position:fixed;top:0;left:0;right:0;height:4px;z-index:2147483647;background:rgba(255,255,255,0.06);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;';

    var bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#4f8fff,#a855f7,#22d3ee);transition:width 0.08s linear;';

    wrap.appendChild(bar);
    wrap.addEventListener('click', function () {
      wrap.style.opacity = wrap.style.opacity === '0.15' ? '1' : '0.15';
    });

    document.documentElement.appendChild(wrap);
  }

  function update() {
    var el = document.getElementById(BAR_ID);
    if (!el) return;
    var doc = document.documentElement;
    var body = document.body;
    var scrollTop = (doc && doc.scrollTop) ? doc.scrollTop : (body ? body.scrollTop : 0);
    var scrollH = Math.max(doc ? doc.scrollHeight : 0, body ? body.scrollHeight : 0);
    var clientH = doc ? doc.clientHeight : window.innerHeight;
    var denom = Math.max(1, scrollH - clientH);
    var p = Math.min(1, Math.max(0, scrollTop / denom));
    el.style.width = (p * 100).toFixed(2) + '%';
  }

  ensure();
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();
