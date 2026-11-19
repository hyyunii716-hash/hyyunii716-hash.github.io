/* 拼組圖檔流程的換場特效（影片 B、C）。不修改 flow.js 的流程，只觀察各步驟的顯示狀態。
   步驟：upload → processing → success → startchat → ringing → call / removed */
(function () {
  var main = document.querySelector('main[data-tool="group"]');
  if (!main) return;
  var steps = Array.prototype.slice.call(main.querySelectorAll('[data-step]'));
  if (!steps.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NS = 'http://www.w3.org/2000/svg';
  var prev = current();
  var lastPoint = { x: innerWidth / 2, y: innerHeight / 2, t: 0 };
  var titleInfo = null;
  var busy = null;

  function current() {
    var s = steps.filter(function (e) { return !e.hidden; })[0];
    return s ? s.getAttribute('data-step') : null;
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }   // easeInOutCubic
  function run(ms, tick, done) {
    var start = performance.now();
    (function frame(now) {
      var p = Math.min(1, (now - start) / ms);
      tick(p);
      if (p < 1) requestAnimationFrame(frame); else if (done) done();
    })(start);
  }
  function clear() {
    document.querySelectorAll('.gt-iris, .gt-iris-ring, .gt-text-overlay').forEach(function (e) { e.remove(); });
    busy = null;
  }

  document.addEventListener('pointerdown', function (e) { lastPoint = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target && e.target.getBoundingClientRect && e.target.getBoundingClientRect();
    if (t && t.width) lastPoint = { x: t.left + t.width / 2, y: t.top + t.height / 2, t: Date.now() };
  }, true);

  /* ---- B：圓形光圈展開 ---- */
  function iris() {
    var fresh = Date.now() - lastPoint.t < 1500;
    var x = fresh ? lastPoint.x : innerWidth / 2, y = fresh ? lastPoint.y : innerHeight / 2;
    var maxR = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
    var cover = document.createElement('div'); cover.className = 'gt-iris';
    var ring = document.createElement('div'); ring.className = 'gt-iris-ring';
    document.body.appendChild(cover); document.body.appendChild(ring);
    busy = cover;
    function paint(r) {
      var m = 'radial-gradient(circle at ' + x + 'px ' + y + 'px, transparent ' + r + 'px, #000 ' + (r + 1) + 'px)';
      cover.style.webkitMaskImage = m; cover.style.maskImage = m;
      ring.style.left = x + 'px'; ring.style.top = y + 'px';
      ring.style.width = ring.style.height = (r * 2) + 'px';
    }
    paint(0); ring.style.opacity = '1';
    run(950, function (p) {
      var r = 6 + (maxR - 6) * ease(p);
      paint(r);
      ring.style.opacity = String(p < .75 ? 1 : 1 - (p - .75) / .25);
    }, function () { if (busy === cover) clear(); });
  }

  /* ---- C：文字遮罩放大 ---- */
  function textZoom() {
    var info = titleInfo || { x: innerWidth / 2, y: innerHeight / 2, size: 48, family: 'sans-serif', weight: 700, text: '群組成功！' };
    var W = innerWidth, H = innerHeight, id = 'gt' + Date.now();
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'gt-text-overlay'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('aria-hidden', 'true');
    var bg = getComputedStyle(document.body).backgroundColor;
    svg.innerHTML =
      '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#cfc4ff"/><stop offset="1" stop-color="#9b86ff"/></linearGradient>' +
      '<mask id="' + id + 'm" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="#000"/>' +
      '<text class="gt-t" x="' + info.x + '" y="' + info.y + '" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="' + info.size + '" font-weight="' + info.weight + '"></text></mask></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="' + bg + '"/><rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'g)" mask="url(#' + id + 'm)"/>';
    var text = svg.querySelector('.gt-t'); text.textContent = info.text; text.style.fontFamily = info.family;
    text.style.transformBox = 'fill-box'; text.style.transformOrigin = '50% 50%';
    document.body.appendChild(svg); busy = svg;
    run(1300, function (p) {
      var s = 1 + 17 * ease(p);
      text.style.transform = 'scale(' + s.toFixed(3) + ')';
      svg.style.opacity = String(p < .6 ? 1 : 1 - (p - .6) / .4);
    }, function () { if (busy === svg) clear(); });
  }

  /* 記住「群組成功！」文字的位置，換場時從同一個位置放大 */
  function rememberTitle() {
    var t = main.querySelector('[data-step="success"] .gs-title');
    if (!t) return;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      var r = t.getBoundingClientRect(); if (!r.width) return;
      var cs = getComputedStyle(t);
      titleInfo = { x: r.left + r.width / 2, y: r.top + r.height / 2, size: parseFloat(cs.fontSize), family: cs.fontFamily, weight: cs.fontWeight, text: t.textContent.trim() };
    }); });
  }

  var observer = new MutationObserver(function () {
    var now = current();
    if (!now || now === prev) return;
    var from = prev; prev = now;
    if (busy) clear();
    if (now === 'success') rememberTitle();
    if (reduce.matches) return;
    if (from === 'success' && now === 'startchat') textZoom();
    else if (from === 'ringing' && (now === 'call' || now === 'removed')) iris();
    else if (from === 'call' && now === 'removed') iris();
  });
  steps.forEach(function (s) { observer.observe(s, { attributes: true, attributeFilter: ['hidden'] }); });
  window.addEventListener('resize', function () { if (busy) clear(); });
})();
