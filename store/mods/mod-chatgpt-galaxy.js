// BetterWeb Mod: ChatGPT Galaxy Theme
(function () {
  'use strict';

  function isChatGpt() {
    try { return location.hostname === 'chatgpt.com' || location.hostname === 'chat.openai.com'; } catch (_) { return false; }
  }
  if (!isChatGpt()) return;

  var SID = 'bw-chatgpt-galaxy-style';
  if (document.getElementById(SID)) return;

  var css = [
    'html,body{background:#030014!important;}',
    'body::before{content:"";position:fixed;inset:0;z-index:-1;background:radial-gradient(ellipse 80% 50% at 20% 30%,rgba(79,143,255,0.08) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 20%,rgba(168,85,247,0.06) 0%,transparent 70%),linear-gradient(180deg,#030014 0%,#05001a 45%,#0b0030 100%);pointer-events:none;}',
    'main,div[class*="react-scroll"]{background:transparent!important;}',
    'nav{background:rgba(3,0,20,0.85)!important;backdrop-filter:blur(12px)!important;border-right:1px solid rgba(255,255,255,0.06)!important;}',
    'nav a,nav button{color:rgba(255,255,255,0.75)!important;}',
    'nav a:hover,nav button:hover{background:rgba(255,255,255,0.06)!important;color:#fff!important;}',
    '.markdown{color:#e2e8f0!important;}',
    '.markdown code{background:rgba(168,85,247,0.12)!important;border:1px solid rgba(168,85,247,0.2)!important;color:#d8b4fe!important;}',
    '.markdown pre{background:rgba(5,5,20,0.9)!important;border:1px solid rgba(255,255,255,0.08)!important;border-radius:12px!important;}',
    'textarea{background:rgba(255,255,255,0.04)!important;border:1px solid rgba(255,255,255,0.1)!important;color:#f1f5f9!important;border-radius:16px!important;}',
    'textarea:focus{border-color:rgba(79,143,255,0.4)!important;box-shadow:0 0 30px rgba(79,143,255,0.08)!important;}',
    'button[data-testid="send-button"]{background:linear-gradient(135deg,#4f8fff,#a855f7)!important;border:none!important;color:#fff!important;}',
    'header,div[class*="sticky"]{background:rgba(3,0,20,0.8)!important;backdrop-filter:blur(12px)!important;border-bottom:1px solid rgba(255,255,255,0.06)!important;}',
    '::selection{background:rgba(168,85,247,0.4)!important;}'
  ].join('\n');

  var s = document.createElement('style');
  s.id = SID;
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
})();
