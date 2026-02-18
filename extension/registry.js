/* =============================================
   BetterWeb — Registry Manager
   Communicates with background for store data
   ============================================= */

const BetterWebRegistry = {
  async fetch() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'fetchRegistry' }, (resp) => {
        resolve(resp || { success: false, error: 'No response' });
      });
    });
  },

  async getExtensions() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getRegistry' }, (resp) => {
        resolve(resp && resp.extensions ? resp.extensions : []);
      });
    });
  },

  async getCached() {
    const data = await chrome.storage.local.get(['registry', 'registryFetchedAt']);
    return {
      extensions: data.registry || [],
      fetchedAt: data.registryFetchedAt || null,
      isCached: !!data.registryFetchedAt
    };
  }
};

if (typeof module !== 'undefined') module.exports = BetterWebRegistry;
