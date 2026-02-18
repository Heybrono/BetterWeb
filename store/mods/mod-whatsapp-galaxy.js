// BetterWeb Mod: WhatsApp Galaxy Look+
// Note: The full MV3-safe implementation is embedded in extension/content-bridge.js.
(function () {
  'use strict';

  function isWhatsApp() {
    try { return location && location.hostname === 'web.whatsapp.com'; } catch (_) { return false; }
  }
  if (!isWhatsApp()) return;

  var STYLE_ID = 'bw-wa-galaxy-style';
  if (document.getElementById(STYLE_ID)) return;

  var css = [
    'html{background:radial-gradient(ellipse 80% 50% at 20% 30%,rgba(79,143,255,0.10) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 20%,rgba(168,85,247,0.10) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 60% 90%,rgba(34,211,238,0.08) 0%,transparent 66%),linear-gradient(180deg,#030014 0%,#05001a 45%,#0b0030 100%)!important;background-attachment:fixed!important;}',
    'body{background:transparent!important;}',
    '#app, #app>div{background:transparent!important;}'
  ].join('\n');

  var s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
})();
