// BetterWeb Theme: Midnight Purple
// Marker for BetterWeb theme detection: bw-custom-theme
(function () {
  'use strict';
  var css = ':root{--bg:#0f0518!important;--blue:#6d28d9!important;--purple:#a855f7!important;}body{background:var(--bg)!important;}';
  var s = document.createElement('style');
  s.id = 'bw-custom-theme';
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
})();
