// BetterWeb Mod: Speed Reader (RSVP)
(function () {
  'use strict';
  if (window.__bwSpeedReaderStore) return;
  window.__bwSpeedReaderStore = true;

  var PID = 'bw-speed-reader';
  var SID = 'bw-speed-reader-style';
  var OVID = 'bw-speed-reader-overlay';

  var words = [];
  var idx = 0;
  var wpm = 300;
  var timer = null;
  var running = false;

  function ensureStyle() {
    if (document.getElementById(SID)) return;
    var s = document.createElement('style');
    s.id = SID;
    s.textContent = [
      '#' + PID + '{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;width:min(600px,90vw);padding:40px;border-radius:20px;background:rgba(5,5,15,0.92);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);box-shadow:0 30px 80px rgba(0,0,0,0.5);color:#fff;font-family:system-ui,-apple-system,sans-serif;display:none;text-align:center;}',
      '#' + PID + ' .sr-word{font-size:clamp(2rem,6vw,4rem);font-weight:800;letter-spacing:0.02em;min-height:5rem;display:flex;align-items:center;justify-content:center;margin:20px 0;}',
      '#' + PID + ' .sr-word .sr-mid{color:#a855f7;}',
      '#' + PID + ' .sr-controls{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px;flex-wrap:wrap;}',
      '#' + PID + ' .sr-btn{padding:10px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;font-weight:800;font-size:13px;cursor:pointer;}',
      '#' + PID + ' .sr-btn.primary{background:linear-gradient(135deg,#4f8fff,#a855f7);border:none;}',
      '#' + PID + ' .sr-speed{font-size:12px;color:rgba(255,255,255,0.6);margin-top:12px;}',
      '#' + PID + ' .sr-progress{width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,0.08);margin-top:16px;overflow:hidden;}',
      '#' + PID + ' .sr-progress-bar{height:100%;background:linear-gradient(90deg,#4f8fff,#a855f7);transition:width 0.15s linear;width:0%;}',
      '#' + PID + ' .sr-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:16px;}',
      '#' + OVID + '{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);display:none;}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function ensureUi() {
    if (document.getElementById(PID)) return;
    ensureStyle();

    var overlay = document.createElement('div');
    overlay.id = OVID;
    document.documentElement.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = PID;
    panel.innerHTML =
      '<button class="sr-x" type="button">' + String.fromCodePoint(0x2715) + '</button>' +
      '<div style="font-weight:900;font-size:14px;letter-spacing:0.04em;color:#a855f7">SPEED READER</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px">Select text on any page, then start</div>' +
      '<div class="sr-word" id="sr-word">Select text to begin</div>' +
      '<div class="sr-progress"><div class="sr-progress-bar" id="sr-bar"></div></div>' +
      '<div class="sr-controls">' +
        '<button class="sr-btn" type="button" id="sr-slower">- Slower</button>' +
        '<button class="sr-btn primary" type="button" id="sr-toggle">' + String.fromCodePoint(0x25B6) + ' Start</button>' +
        '<button class="sr-btn" type="button" id="sr-faster">Faster +</button>' +
      '</div>' +
      '<div class="sr-speed" id="sr-info">300 WPM</div>';
    document.documentElement.appendChild(panel);

    function getSelectedText() {
      var sel = window.getSelection();
      return sel ? sel.toString().trim() : '';
    }

    function highlightWord(w) {
      if (!w) return w;
      var mid = Math.floor(w.length / 3);
      if (mid < 1) mid = 0;
      return w.substring(0, mid) + '<span class="sr-mid">' + w.charAt(mid) + '</span>' + w.substring(mid + 1);
    }

    function showWord() {
      if (idx >= words.length) { stop(); return; }
      document.getElementById('sr-word').innerHTML = highlightWord(words[idx]);
      document.getElementById('sr-bar').style.width = ((idx + 1) / words.length * 100) + '%';
      idx++;
    }

    function start() {
      var text = getSelectedText();
      if (text) {
        words = text.split(/\s+/).filter(function (w) { return w.length > 0; });
        idx = 0;
      }
      if (!words.length) {
        document.getElementById('sr-word').innerHTML = 'Select text first!';
        return;
      }
      running = true;
      document.getElementById('sr-toggle').textContent = String.fromCodePoint(0x23F8) + ' Pause';
      timer = setInterval(showWord, 60000 / wpm);
    }

    function stop() {
      running = false;
      if (timer) clearInterval(timer);
      timer = null;
      document.getElementById('sr-toggle').textContent = String.fromCodePoint(0x25B6) + (idx >= words.length ? ' Restart' : ' Resume');
      if (idx >= words.length) idx = 0;
    }

    function close() {
      stop();
      panel.style.display = 'none';
      overlay.style.display = 'none';
    }

    function open() {
      panel.style.display = 'block';
      overlay.style.display = 'block';
      var text = getSelectedText();
      if (text) {
        words = text.split(/\s+/).filter(function (w) { return w.length > 0; });
        idx = 0;
        document.getElementById('sr-word').innerHTML = words.length + ' words ready';
        document.getElementById('sr-bar').style.width = '0%';
      }
    }

    panel.querySelector('.sr-x').addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.getElementById('sr-toggle').addEventListener('click', function () { running ? stop() : start(); });

    document.getElementById('sr-slower').addEventListener('click', function () {
      wpm = Math.max(100, wpm - 50);
      document.getElementById('sr-info').textContent = wpm + ' WPM';
      if (running) { stop(); start(); }
    });

    document.getElementById('sr-faster').addEventListener('click', function () {
      wpm = Math.min(1000, wpm + 50);
      document.getElementById('sr-info').textContent = wpm + ' WPM';
      if (running) { stop(); start(); }
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    open();
  }

  ensureUi();
})();
