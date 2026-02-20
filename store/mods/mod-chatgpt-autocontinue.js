// BetterWeb Mod: ChatGPT Auto-Continue
(function () {
  'use strict';
  if (window.__bwChatGptAutoContinue) return;
  window.__bwChatGptAutoContinue = true;

  function isChatGpt() {
    try {
      return location.hostname === 'chatgpt.com' || location.hostname === 'chat.openai.com';
    } catch (_) {
      return false;
    }
  }

  if (!isChatGpt()) return;

  function findBtn() {
    var btns = Array.from(document.querySelectorAll('button'));
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var tx = String(b.textContent || '').trim();
      var ar = String(b.getAttribute('aria-label') || '').trim();
      if (/continue generating/i.test(tx) || /continue generating/i.test(ar)) return b;
      if (/continue/i.test(tx) && /generat/i.test(tx)) return b;
    }
    return null;
  }

  setInterval(function () {
    try {
      var b = findBtn();
      if (b && !b.disabled) b.click();
    } catch (_) {}
  }, 1500);
})();
