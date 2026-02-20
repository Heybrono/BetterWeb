// BetterWeb Mod: Focus Mode
(function () {
  'use strict';
  if (window.__bwFocusModeStore) return;
  window.__bwFocusModeStore = true;

  var SID = 'bw-focus-mode';
  if (document.getElementById(SID)) return;

  var css = [
    '/* BetterWeb Focus Mode */',
    '/* YouTube */',
    '#related, ytd-watch-next-secondary-results-renderer, ytd-rich-grid-renderer[is-two-columns], ytd-mini-guide-renderer { display:none !important; }',
    '/* Twitter/X */',
    '[aria-label="Timeline: Trending now"], [data-testid="sidebarColumn"], aside[role="complementary"] { display:none !important; }',
    '/* Generic sidebars */',
    'aside, .sidebar, .SideNav, .RightRail { display:none !important; }'
  ].join('\n');

  var s = document.createElement('style');
  s.id = SID;
  s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
})();
