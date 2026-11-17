/* Abandon 字標：七個幾何形狀（三角、方、圓…）依序變形成 A b a n d o n，只播放一次。
   純 JS + SVG，不需要網路、不依賴 GSAP。形狀 85% 不透明，變成字母時漸變為 100%。
   偏好減少動態或失敗時，直接顯示字母。 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var marks = document.querySelectorAll('[data-wordmark]');
  if (!marks.length) return;

  var N = 240;                       // 輪廓取樣點數
  var DELAY = 500;                   // 開始前延遲 ms
  var DUR = 1000 / 1.875;            // 單一形狀變形時間 ms（速度 = 原速 1.25 × 1.5 倍）
  var STAGGER = 120 / 1.875;         // 相鄰形狀的間隔 ms

  function reveal(svg) { svg.style.visibility = 'visible'; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; } // power2.inOut

  function sample(pathEl, n) {
    var L = pathEl.getTotalLength(), pts = [];
    for (var i = 0; i < n; i++) { var p = pathEl.getPointAtLength(L * i / n); pts.push([p.x, p.y]); }
    return pts;
  }
  function area(pts) {
    var a = 0;
    for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return a / 2;
  }
  function centroid(pts) {
    var x = 0, y = 0; pts.forEach(function (p) { x += p[0]; y += p[1]; });
    return [x / pts.length, y / pts.length];
  }
  // 對齊起點與方向，讓兩個輪廓點對點的移動距離最短
  function align(from, to) {
    if (area(from) * area(to) < 0) to = to.slice().reverse();
    var n = from.length, best = 0, bestD = Infinity;
    for (var s = 0; s < n; s += 2) {
      var d = 0;
      for (var i = 0; i < n; i += 4) {
        var a = from[i], b = to[(i + s) % n];
        d += (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]);
      }
      if (d < bestD) { bestD = d; best = s; }
    }
    return to.map(function (_, i) { return to[(i + best) % n]; });
  }
  function shapeToPath(svg, el) {
    var p = document.createElementNS(NS, 'path'), d = '';
    var t = el.tagName.toLowerCase();
    if (t === 'polygon') d = 'M' + el.getAttribute('points').trim().replace(/\s+/g, ' L') + 'Z';
    else if (t === 'rect') {
      var x = +el.getAttribute('x'), y = +el.getAttribute('y'), w = +el.getAttribute('width'), h = +el.getAttribute('height');
      d = 'M' + x + ' ' + y + 'H' + (x + w) + 'V' + (y + h) + 'H' + x + 'Z';
    } else if (t === 'circle') {
      var cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy'), r = +el.getAttribute('r');
      d = 'M' + (cx - r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 1 0 ' + (cx + r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 1 0 ' + (cx - r) + ' ' + cy + 'Z';
    }
    p.setAttribute('d', d); return p;
  }
  function poly(pts) { return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + 'Z'; }

  function setup(svg) {
    var shapesG = svg.querySelector('.wm-shapes'), lettersG = svg.querySelector('.wm-letters');
    var shapeEls = svg.querySelectorAll('.wm-shape'), letterEls = svg.querySelectorAll('.wm-letter');
    if (!shapeEls.length || shapeEls.length !== letterEls.length) return null;

    var scratch = document.createElementNS(NS, 'g'); scratch.setAttribute('visibility', 'hidden'); svg.appendChild(scratch);
    var items = [];
    shapeEls.forEach(function (sEl, i) {
      var from = sample((function () { var p = shapeToPath(svg, sEl); scratch.appendChild(p); return p; })(), N);
      // 字母可能有多個子路徑（外輪廓 + 內孔）
      var subs = letterEls[i].getAttribute('d').split(/(?=M)/).filter(Boolean).map(function (d) {
        var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); scratch.appendChild(p);
        var b = p.getBBox(); return { el: p, size: b.width * b.height };
      });
      subs.sort(function (a, b) { return b.size - a.size; });
      var outer = align(from, sample(subs[0].el, N));
      var holes = subs.slice(1).map(function (s) { var pts = sample(s.el, N); return { pts: pts, c: centroid(pts) }; });
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('opacity', '0.85');
      path.setAttribute('d', poly(from));
      shapesG.appendChild(path);
      items.push({ from: from, to: outer, holes: holes, path: path });
    });
    svg.removeChild(scratch);
    shapeEls.forEach(function (e) { e.style.display = 'none'; });
    return { shapesG: shapesG, lettersG: lettersG, items: items };
  }

  function run(svg, st) {
    svg.classList.add('wm-anim');            // 顯示形狀群組、隱藏字母群組
    reveal(svg);
    var t0 = performance.now() + DELAY, total = DELAY + STAGGER * (st.items.length - 1) + DUR;

    function frame(now) {
      var elapsed = now - (t0 - DELAY), done = true;
      st.items.forEach(function (it, i) {
        var raw = (elapsed - DELAY - i * STAGGER) / DUR;
        var t = Math.max(0, Math.min(1, raw));
        if (t < 1) done = false;
        var e = ease(t), d = '';
        var pts = it.from.map(function (a, k) {
          var b = it.to[k]; return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
        });
        d = poly(pts);
        // 內孔在變形後半段由中心長出
        var hs = Math.max(0, (e - 0.5) * 2);
        if (hs > 0) it.holes.forEach(function (h) {
          d += poly(h.pts.map(function (p) { return [h.c[0] + (p[0] - h.c[0]) * hs, h.c[1] + (p[1] - h.c[1]) * hs]; }));
        });
        it.path.setAttribute('d', d);
        it.path.setAttribute('opacity', (0.85 + 0.15 * e).toFixed(3));
      });
      if (!done) requestAnimationFrame(frame);
      else { svg.classList.remove('wm-anim'); }   // 完成：換回真正的字母向量（最清晰）
    }
    requestAnimationFrame(frame);
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  marks.forEach(function (svg) {
    if (reduce) { reveal(svg); return; }
    var st;
    try { st = setup(svg); } catch (e) { st = null; }
    if (!st) { reveal(svg); return; }
    run(svg, st);
  });
})();
