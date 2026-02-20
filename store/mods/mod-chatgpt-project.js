// BetterWeb Mod: ChatGPT Project Downloads
// Note: The full downloader UI is embedded MV3-safe in extension/content-bridge.js.
// This store file exists so the GitHub registry has a stable entry URL.
(function () {
  'use strict';

  function isChatGpt() {
    try { return location.hostname === 'chatgpt.com' || location.hostname === 'chat.openai.com'; } catch (_) { return false; }
  }

  if (!isChatGpt()) return;

  console.log('[BetterWeb] ChatGPT Project Downloads (store placeholder). Enable the mod in BetterWeb to use the full downloader UI.');
})();
