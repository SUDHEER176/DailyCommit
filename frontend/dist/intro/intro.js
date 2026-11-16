// Daily Commit intro, drawn live so it stays sharp on every screen (4K, retina, phones).
// The heatmap is a canvas at the screen's pixel density, the lockup is real text.
// Timings match the soundtrack in intro-sound.m4a, so change them together.
// Exposes window.__splashIntro, which resolves when the intro ends or is skipped;
// src/lib/splash.js waits on it before hiding the splash.
(function () {
  var root = document.documentElement, resolve;
  window.__splashIntro = new Promise(function (r) { resolve = r; });
  if (!root.classList.contains('sp-intro')) { resolve(); return; }

  // Timeline, in ms from the start.
  var T = {
    wave: 1100,          // blue cell has woken; the heatmap starts to spread
    waveEnd: 3000,       // heatmap fully revealed
    collapse: 4200,      // cells fly into the logo
    land: [4900, 5050, 5250, 5500], // logo cells land: top-left, top-right, bottom-left, blue last
    lockup: 6000,        // logo slides left, wordmark wipes in
    outro: 9000,         // lockup fades
    end: 9600
  };
  var REVEAL_MS = 350;   // fade-in of each heatmap cell
  // For tuning: ?introAt=5600 freezes the intro at that moment (ms).
  var FREEZE = -1;
  try { var q0 = new URLSearchParams(location.search).get('introAt'); if (q0 !== null) FREEZE = Number(q0) || 0; } catch (e) {}
  var ROWS = 7;

  var light = root.classList.contains('light');
  var BG = light ? '#f5f7fa' : '#0b0d14';
  var GREY = light ? '122,130,150' : '158,165,178';
  var BLUE = '#0066ff';
  var LOGO_ALPHA = [0.45, 0.7, 1, 1];

  var canvas = document.getElementById('intro-canvas');
  var ctx = canvas.getContext('2d');
  var lockup = document.getElementById('intro-lockup');
  var row = lockup.querySelector('.ic-row');
  var nameEl = lockup.querySelector('.ic-name');
  var logoCells = lockup.querySelectorAll('.ic-logo span');
  var skip = document.getElementById('splash-intro-skip');
  var soundBtn = document.getElementById('splash-sound');

  var W, H, dpr, pitch, size, cells, targets = null;
  var start = 0, raf = 0, ended = false, stage = 0, landed = 0;

  // Seeded random so the heatmap looks the same on every visit.
  var seed;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function clamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    pitch = Math.max(12, Math.min(34, W / 71));
    size = pitch * 0.8;
    var cols = Math.ceil(W / pitch) + 6; if (cols % 2 === 0) cols++;
    var c0 = (cols - 1) / 2, r0 = (ROWS - 1) / 2, maxD = 0;
    seed = 7; cells = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < cols; c++) {
        var dx = c - c0, dy = r - r0, v = rnd();
        var cell = {
          x: W / 2 + dx * pitch, y: H / 2 + dy * pitch,
          d: Math.abs(dx + 1.6 * dy) + 0.5 * Math.abs(dy), // diagonal wave, lower-left to upper-right
          a: v < 0.18 ? 0.08 : v < 0.45 ? 0.22 : v < 0.7 ? 0.42 : v < 0.88 ? 0.68 : 0.95,
          blue: rnd() < 0.09, delay: rnd(), logo: -1, anchor: dx === 0 && dy === 0
        };
        // The four cells nearest the center become the logo; the waking blue cell is the blue one.
        if (dx === -1 && dy === -1) cell.logo = 0;
        if (dx === 0 && dy === -1) cell.logo = 1;
        if (dx === -1 && dy === 0) cell.logo = 2;
        if (cell.anchor) { cell.logo = 3; cell.blue = true; cell.a = 1; }
        if (cell.logo >= 0 && cell.logo < 3) cell.blue = false;
        if (cell.d > maxD) maxD = cell.d;
        cells.push(cell);
      }
    }
    for (var i = 0; i < cells.length; i++) {
      cells[i].reveal = T.wave + (cells[i].d / maxD) * (T.waveEnd - T.wave - REVEAL_MS);
    }
    // Center the logo on screen until the wordmark arrives.
    var gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    row.style.setProperty('--shift', ((nameEl.offsetWidth + gap) / 2) + 'px');
    targets = null;
  }

  function measureTargets() {
    var list = [];
    for (var i = 0; i < 4; i++) {
      var b = logoCells[i].getBoundingClientRect();
      list.push({ x: b.left + b.width / 2, y: b.top + b.height / 2, s: b.width });
    }
    targets = { cells: list, cx: (list[0].x + list[3].x) / 2, cy: (list[0].y + list[3].y) / 2 };
  }

  function cell(x, y, s, alpha, blue) {
    if (alpha <= 0.003 || s <= 0.5) return;
    ctx.globalAlpha = blue ? alpha : 1;
    ctx.fillStyle = blue ? BLUE : 'rgba(' + GREY + ',' + alpha + ')';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - s / 2, y - s / 2, s, s, s * 0.26);
    else ctx.rect(x - s / 2, y - s / 2, s, s);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function glow(x, y, r, alpha) {
    if (alpha <= 0.003) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,102,255,' + alpha + ')');
    g.addColorStop(1, 'rgba(0,102,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function frame(now) {
    if (ended) return;
    if (!start) start = now;
    var t = FREEZE >= 0 ? FREEZE : now - start;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // During the collapse the canvas is only partly cleared, which leaves short motion trails.
    var collapsing = t > T.collapse && t < T.land[3] + 120;
    ctx.globalAlpha = collapsing ? 0.45 : 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    if (t > T.collapse && !targets) measureTargets();

    // Slow camera move in while the heatmap plays.
    var k = 0.97 + 0.05 * easeOut(clamp((t - T.wave) / (T.collapse - T.wave)));
    var wake = easeOut(clamp(t / 900));

    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var x = W / 2 + (c.x - W / 2) * k, y = H / 2 + (c.y - H / 2) * k, s = size * k, alpha;
      if (c.anchor) {
        alpha = wake; s *= 0.6 + 0.4 * wake;
        if (t < T.collapse) glow(x, y, s * 3.2, 0.32 * wake * (1 - 0.6 * clamp((t - T.wave) / 1500)));
      } else {
        var p = easeOut(clamp((t - c.reveal) / REVEAL_MS));
        alpha = c.a * p; s *= 0.5 + 0.5 * p;
      }

      if (t > T.collapse && targets) {
        var cs, ce;
        if (c.logo >= 0) { cs = T.collapse + 100; ce = T.land[c.logo]; }
        else { cs = T.collapse + c.delay * 300; ce = cs + 550; }
        var q = clamp((t - cs) / (ce - cs));
        if (c.logo >= 0) {
          if (q >= 1) continue; // the real logo cell has taken over
          var tg = targets.cells[c.logo], e = easeInOut(q);
          x += (tg.x - x) * e; y += (tg.y - y) * e;
          s += (tg.s - s) * e;
          alpha += (LOGO_ALPHA[c.logo] - alpha) * e;
        } else if (q > 0) {
          var e2 = easeIn(q);
          x += (targets.cx - x) * e2; y += (targets.cy - y) * e2;
          s *= 1 - 0.7 * e2; alpha *= 1 - e2;
        }
      }
      cell(x, y, s, alpha, c.blue);
    }

    // Hand the logo cells to the DOM as they land, then run the lockup.
    while (landed < 4 && t >= T.land[landed]) logoCells[landed++].classList.add('on');
    if (stage < 1 && t >= T.lockup) { stage = 1; lockup.classList.add('reveal'); }
    if (stage < 2 && t >= T.outro) { stage = 2; lockup.classList.add('out'); }
    if (t >= T.end && FREEZE < 0) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  // Film grain: a small noise tile, shifted by CSS.
  try {
    var n = document.createElement('canvas'); n.width = n.height = 128;
    var nc = n.getContext('2d'), img = nc.createImageData(128, 128);
    for (var j = 0; j < img.data.length; j += 4) {
      var g = Math.random() * 255;
      img.data[j] = img.data[j + 1] = img.data[j + 2] = g; img.data[j + 3] = 255;
    }
    nc.putImageData(img, 0, 0);
    document.getElementById('intro-grain').style.backgroundImage = 'url(' + n.toDataURL() + ')';
  } catch (e) {}

  // Sound. Browsers usually block sound before the visitor has clicked anything,
  // so the animation runs silently and a "Sound on" button appears.
  var audio = new Audio('/intro/intro-sound.m4a');
  audio.preload = 'auto';
  soundBtn.addEventListener('click', function () {
    soundBtn.hidden = true;
    try { audio.currentTime = start ? (performance.now() - start) / 1000 : 0; } catch (e) {}
    audio.play().catch(function () {});
  });

  function finish() {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', build);
    // Fade the sound out instead of cutting it.
    var fade = setInterval(function () {
      if (audio.volume <= 0.1) { audio.pause(); clearInterval(fade); return; }
      audio.volume = Math.max(0, audio.volume - 0.1);
    }, 30);
    resolve();
    // If the app is ready, the splash fades out now. Otherwise hand off to the loading state.
    setTimeout(function () {
      var splash = document.getElementById('splash');
      if (!splash || !splash.classList.contains('splash-hide')) root.classList.remove('sp-intro');
    }, 50);
  }
  function onKey(e) { if (e.key === 'Escape') finish(); }

  skip.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', build);
  build();

  // Start the picture with the sound so they stay in sync; if sound is blocked, start right away.
  var begun = false;
  function begin() { if (begun) return; begun = true; raf = requestAnimationFrame(frame); }
  audio.addEventListener('playing', begin, { once: true });
  var p = audio.play();
  if (p && p.catch) p.catch(function () { if (!ended) soundBtn.hidden = false; begin(); });
  setTimeout(begin, 600); // sound slow to load: don't hold the picture
})();
