// BetterWeb Mod: Force PiP
(function () {
  'use strict';
  if (window.__bwPipStore) return;
  window.__bwPipStore = true;

  var CLS = 'bw-pip-btn';

  function addBtn(video) {
    try {
      if (!video || video.__bwPipBtn) return;
      video.__bwPipBtn = true;

      var parent = video.parentElement;
      if (!parent) return;
      var cs = getComputedStyle(parent);
      if (cs.position === 'static') parent.style.position = 'relative';

      var b = document.createElement('button');
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

      b.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (!document.pictureInPictureEnabled) return;
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
            return;
          }
          video.requestPictureInPicture();
        } catch (_) {}
      }, true);

      parent.appendChild(b);
    } catch (_) {}
  }

  function scan() {
    document.querySelectorAll('video').forEach(addBtn);
  }

  scan();
  setInterval(scan, 2000);
})();
