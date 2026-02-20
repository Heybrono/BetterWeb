/* =============================================
   BetterWeb — Storage Manager
   Abstraction over chrome.storage.local
   ============================================= */

const BetterWebStorage = {
  async get(key) {
    const data = await chrome.storage.local.get(key);
    return data[key] !== undefined ? data[key] : null;
  },

  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
  },

  async remove(key) {
    await chrome.storage.local.remove(key);
  },

  async getAll() {
    return await chrome.storage.local.get(null);
  },

  async clear() {
    await chrome.storage.local.clear();
  },

  async getUsage() {
    return new Promise((resolve) => {
      chrome.storage.local.getBytesInUse(null, resolve);
    });
  }
};

if (typeof module !== 'undefined') module.exports = BetterWebStorage;
