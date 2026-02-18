/* =============================================
   BetterWeb — Extension Installer
   Install, uninstall, toggle
   (MV3-safe: no dynamic code execution)
   ============================================= */

const BetterWebInstaller = {
  async install(ext) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'installExtension', ext }, (resp) => {
        resolve(resp || { success: false, error: 'No response' });
      });
    });
  },

  async uninstall(id) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'uninstallExtension', id }, (resp) => {
        resolve(resp || { success: false, error: 'No response' });
      });
    });
  },

  async toggle(id, enabled) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'toggleExtension', id, enabled }, (resp) => {
        resolve(resp || { success: false, error: 'No response' });
      });
    });
  },

  async getInstalled() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getInstalled' }, (resp) => {
        resolve(resp && resp.installed ? resp.installed : {});
      });
    });
  }
};

if (typeof module !== 'undefined') module.exports = BetterWebInstaller;
