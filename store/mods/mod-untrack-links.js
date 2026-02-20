// BetterWeb Mod: Untrack Links
(function () {
  'use strict';
  if (window.__bwUntrackLinks) return;
  window.__bwUntrackLinks = true;

  var TRACK_KEYS = [
    'fbclid', 'gclid', 'igshid', 'mc_cid', 'mc_eid', 'yclid', 'msclkid',
    'ref', 'ref_src', 'spm', 'si', 'scid'
  ];

  function cleanUrl(raw) {
    try {
      var u = new URL(raw, location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

      var changed = false;
      var del = [];
      u.searchParams.forEach(function (_, k) {
        if (String(k).toLowerCase().indexOf('utm_') === 0) del.push(k);
      });
      TRACK_KEYS.forEach(function (k) {
        if (u.searchParams.has(k)) del.push(k);
      });

      del.forEach(function (k) {
        if (u.searchParams.has(k)) {
          u.searchParams.delete(k);
          changed = true;
        }
      });

      return changed ? u.toString() : null;
    } catch (_) {
      return null;
    }
  }

  function cleanLink(a) {
    try {
      var href = a.getAttribute('href');
      if (!href || href.indexOf('#') === 0) return;
      if (href.indexOf('javascript:') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      var cleaned = cleanUrl(href);
      if (cleaned) a.setAttribute('href', cleaned);
    } catch (_) {}
  }

  function scan(root) {
    try {
      (root || document).querySelectorAll('a[href]').forEach(cleanLink);
    } catch (_) {}
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var a = t && t.closest ? t.closest('a[href]') : null;
    if (a) cleanLink(a);
  }, true);

  var mo = new MutationObserver(function (mut) {
    mut.forEach(function (m) {
      (m.addedNodes || []).forEach(function (n) {
        if (n && n.nodeType === 1) scan(n);
      });
    });
  });
  try { mo.observe(document.documentElement, { childList: true, subtree: true }); } catch (_) {}

  scan();
})();
