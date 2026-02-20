// BetterWeb Theme: Sunset Bliss
// Marker for BetterWeb theme detection: bw-custom-theme
(function () {
  'use strict';
  var css = ':root{--bg:#2a1015!important;--blue:#f59e0b!important;--purple:#ec4899!important;}body{background:linear-gradient(#2a1015,#1f0b12)!important;}';
  var s = document.createElement('style');
  s.id = 'bw-custom-theme';
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
})();
