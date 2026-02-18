// BetterWeb Mod: YouTube Cinema Mode
(function () {
  'use strict';

  function isYouTube() {
    try { return location.hostname === 'www.youtube.com' || location.hostname === 'youtube.com'; } catch (_) { return false; }
  }
  if (!isYouTube()) return;

  var SID = 'bw-yt-cinema-style';
  var BTN_ID = 'bw-yt-cinema-btn';

  if (!document.getElementById(SID)) {
    var css = [
      '/* BetterWeb YouTube Cinema Mode */',
      'html[bw-yt-cinema] ytd-watch-flexy:not([theater]) #secondary{display:none!important;}',
      'html[bw-yt-cinema] ytd-watch-flexy:not([theater]) #primary{max-width:100%!important;margin:0 auto!important;}',
      'html[bw-yt-cinema] ytd-watch-flexy:not([theater]) #player-container-outer{max-width:100%!important;}',
      'html[bw-yt-cinema] #masthead-container{background:rgba(0,0,0,0.85)!important;backdrop-filter:blur(10px)!important;}',
      'html[bw-yt-cinema] ytd-app{background:#0a0a0a!important;}',
      'html[bw-yt-cinema] #comments{max-width:900px!important;margin:0 auto!important;}',
      'html[bw-yt-cinema] #below{max-width:900px!important;margin:0 auto!important;}',
      'html[bw-yt-cinema] .ytp-gradient-bottom{opacity:0.3!important;}',
      'html[bw-yt-cinema] #movie_player{box-shadow:0 0 80px rgba(79,143,255,0.08),0 0 160px rgba(168,85,247,0.04)!important;border-radius:12px!important;overflow:hidden!important;}'
    ].join('\n');

    var s = document.createElement('style');
    s.id = SID;
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  document.documentElement.setAttribute('bw-yt-cinema', '');

  if (!document.getElementById(BTN_ID)) {
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.textContent = String.fromCodePoint(0x1F3AC) + ' Cinema';
    btn.style.cssText = 'position:fixed;top:70px;right:16px;z-index:2147483647;padding:8px 14px;border-radius:10px;background:rgba(10,5,20,0.8);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);color:#fff;font:700 12px system-ui;cursor:pointer;';
    btn.addEventListener('click', function () {
      document.documentElement.toggleAttribute('bw-yt-cinema');
      btn.style.borderColor = document.documentElement.hasAttribute('bw-yt-cinema') ? 'rgba(79,143,255,0.5)' : 'rgba(255,255,255,0.12)';
    });
    document.documentElement.appendChild(btn);
  }
})();
