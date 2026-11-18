/* 更多功能：全螢幕展示（純原生 JS，不需要網路）
   內容直接讀頁面上「更多功能」那三個 .feature，所以改文字只要改 tools.html 原本的區塊就好。
   操作：拖曳 / 滾輪 / ← → 切換，點中間那張（或 Enter）進入詳細，Esc 返回，再按 Esc 離開。 */
(function () {
  var openers = document.querySelectorAll('[data-showcase-open]');
  var feats = document.querySelectorAll('.tools-features .feature');
  if (!openers.length || !feats.length) return;

  var pills = {};
  document.querySelectorAll('.tools-more__nav .pill').forEach(function (a) { pills[(a.getAttribute('href') || '').slice(1)] = a.textContent.trim(); });
  var items = Array.prototype.map.call(feats, function (f) {
    var m = f.querySelector('.tools-media'), l = f.querySelector('.feature__link'), b = f.querySelector('.tools-wordmark');
    return {
      label: pills[f.id] || '', brand: b ? b.getAttribute('src') : '',
      title: f.querySelector('.feature__headline').textContent.trim(),
      text: f.querySelector('.feature__text').textContent.trim(),
      href: l ? l.getAttribute('href') : 'pricing.html',
      linkText: l ? l.textContent.trim() : '瀏覽適用於企業或學生與教師的方案',
      media: m ? m.outerHTML : ''
    };
  });
  var n = items.length;
  var ARROW_R = '<svg viewBox="0 0 60 14" fill="none" stroke="currentColor" stroke-width="1"><path d="M0 7h58M52 1l6 6-6 6"/></svg>';
  var ARROW_S = '<svg viewBox="0 0 22 10" fill="none" stroke="currentColor" stroke-width="1"><path d="M0 5h20M16 1l4 4-4 4"/></svg>';
  var ARROW_V = function (up) { return '<svg viewBox="0 0 18 34" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9 ' + (up ? 33 : 1) + 'V' + (up ? 2 : 32) + 'M2 ' + (up ? 9 : 25) + 'l7 ' + (up ? '-7 7 7' : '7 7 -7') + '"/></svg>'; };
  function pad(i) { return (i < 10 ? '0' : '') + i; }

  var root = document.createElement('div');
  root.className = 'sc'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', '更多功能全螢幕展示');
  root.innerHTML =
    '<div class="sc__bar">' +
      '<img class="sc__brand" src="' + (items[0].brand || 'assets/abandon-wordmark.png') + '" alt="Abandon">' +
      '<span class="sc__label">全部功能</span>' +
      '<div class="sc__ctrl"><button type="button" class="sc__back">返回</button>' +
      '<button type="button" class="sc__exit" aria-label="離開全螢幕展示">離開<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 2l12 12M14 2L2 14"/></svg></button></div>' +
    '</div>' +
    '<div class="sc__stage">' +
      '<div class="sc__media-box">' + items.map(function (it, k) { return '<div class="sc__media" data-k="' + k + '">' + it.media + '</div>'; }).join('') + '</div>' +
      items.map(function (it, k) { return '<div class="sc__title" data-k="' + k + '">' + it.title + '</div>'; }).join('') +
      '<div class="sc__hint">拖曳或滑動切換</div>' +
      '<button type="button" class="sc__next" aria-label="下一個">' + ARROW_R + '</button>' +
      '<div class="sc__count"></div>' +
    '</div>' +
    '<div class="sc__detail"><section class="sc__panel">' +
      '<h3 class="sc__d-title"></h3><p class="sc__d-text"></p>' +
      '<div class="sc__meta"><dl><dt>分類</dt><dd class="sc__m-cat"></dd></dl><dl><dt>編號</dt><dd class="sc__m-no"></dd></dl><dl><dt>方案</dt><dd>Abandon</dd></dl>' +
      '<a class="sc__go" href="pricing.html"><span></span>' + ARROW_S + '</a></div></section>' +
      '<div class="sc__big"><div class="sc__media-wrap"></div></div></div>' +
    '<button type="button" class="sc__arrow sc__arrow--prev" aria-label="上一個功能">' + ARROW_V(true) + '</button>' +
    '<button type="button" class="sc__arrow sc__arrow--next" aria-label="下一個功能">' + ARROW_V(false) + '</button>';
  document.body.appendChild(root);

  var $ = function (s) { return root.querySelector(s); };
  var stage = $('.sc__stage'), detail = $('.sc__detail');
  var titles = [].slice.call(root.querySelectorAll('.sc__title')), medias = [].slice.call(root.querySelectorAll('.sc__media'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var pos = 0, target = 0, S = 800, raf = 0, last = 0, idx = 0, isOpen = false, inDetail = false, lastFocus = null;
  function wrap(d) { var h = n / 2; return ((d + h) % n + n) % n - h; }
  function measure() {
    var W = root.clientWidth || window.innerWidth, avg = 0;
    titles.forEach(function (t) { avg += t.offsetWidth; }); avg /= n;
    S = Math.max(220, W / 2 - 64 + avg / 2);                       // 相鄰標題只露出邊邊
  }
  function render() {
    for (var k = 0; k < n; k++) {
      var d = wrap(k - pos), a = Math.abs(d);
      titles[k].style.transform = 'translate(-50%,-50%) translateX(' + (d * S).toFixed(1) + 'px)';
      titles[k].style.opacity = String(Math.max(0, 1 - Math.min(a, 1) * 0.52 - Math.max(0, a - 1) * 1.2).toFixed(3));
      medias[k].style.opacity = String(Math.max(0, 1 - a * 1.7).toFixed(3));
      medias[k].style.transform = 'scale(' + (1 + 0.05 * a).toFixed(3) + ')';
      medias[k].style.pointerEvents = a < 0.5 ? 'auto' : 'none';
    }
    var i = ((Math.round(pos) % n) + n) % n;
    if (i !== idx) { idx = i; updateCount(); }
  }
  function updateCount() { $('.sc__count').textContent = pad(idx + 1) + ' / ' + pad(n); }
  function tickLoop(t) {
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    var diff = target - pos;
    if (Math.abs(diff) < 0.0008) { pos = target; render(); raf = 0; return; }
    pos += diff * (1 - Math.exp(-dt * 8.5));
    render(); raf = requestAnimationFrame(tickLoop);
  }
  function animate() { if (reduce.matches) { pos = target; render(); return; } if (!raf) { last = performance.now(); raf = requestAnimationFrame(tickLoop); } }
  function goTo(k) { var base = Math.round(target); target = base + wrap(k - (((base % n) + n) % n)); animate(); }
  function step(dir) { target = Math.round(target) + dir; animate(); }

  /* ---- 詳細內容 ---- */
  function fill(k) {
    var it = items[k];
    $('.sc__d-title').textContent = it.title; $('.sc__d-text').textContent = it.text;
    $('.sc__m-cat').textContent = it.label; $('.sc__m-no').textContent = pad(k + 1) + ' / ' + pad(n);
    var go = $('.sc__go'); go.setAttribute('href', it.href); go.firstChild.textContent = it.linkText;
    $('.sc__media-wrap').innerHTML = it.media;
  }
  function swapDetail(dir) {
    var nk = ((idx + dir) % n + n) % n;
    detail.classList.add('is-swap');
    setTimeout(function () { fill(nk); goTo(nk); idx = nk; detail.scrollTop = 0; detail.classList.remove('is-swap'); }, 230);
  }
  function openDetail() { if (inDetail) return; fill(idx); detail.scrollTop = 0; inDetail = true; root.classList.add('is-detail'); }
  function closeDetail() { if (!inDetail) return; inDetail = false; root.classList.remove('is-detail'); }

  /* ---- 開啟 / 關閉 ---- */
  function open(startK) {
    if (isOpen) return; isOpen = true; lastFocus = document.activeElement;
    root.hidden = false; document.documentElement.classList.add('sc-lock');
    measure(); pos = target = typeof startK === 'number' ? startK : 0; idx = -1; render(); updateCount();
    requestAnimationFrame(function () { root.classList.add('is-open'); });
    $('.sc__exit').focus({ preventScroll: true });
  }
  function close() {
    if (!isOpen) return; isOpen = false; closeDetail();
    root.classList.remove('is-open'); document.documentElement.classList.remove('sc-lock');
    setTimeout(function () { if (!isOpen) root.hidden = true; }, 480);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  openers.forEach(function (b) { b.addEventListener('click', function () { open(0); }); });
  $('.sc__exit').addEventListener('click', close);
  $('.sc__back').addEventListener('click', closeDetail);
  $('.sc__next').addEventListener('click', function () { step(1); });
  $('.sc__arrow--prev').addEventListener('click', function () { swapDetail(-1); });
  $('.sc__arrow--next').addEventListener('click', function () { swapDetail(1); });

  /* ---- 拖曳 / 點擊 ---- */
  var drag = null;
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { id: e.pointerId, x: e.clientX, p: pos, moved: false, t: e.target, vx: 0, lx: e.clientX, lt: performance.now() };
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; stage.classList.add('is-drag'); }
    if (!drag.moved) return;
    var now = performance.now(); drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.lt); drag.lx = e.clientX; drag.lt = now;
    pos = target = drag.p - dx / S; render();
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null; stage.classList.remove('is-drag');
    if (d.moved) { target = Math.round(pos - d.vx * 0.9 / 1); animate(); return; }
    var hit = d.t.closest && d.t.closest('[data-k]');
    if (hit) { var k = +hit.getAttribute('data-k'); if (k === idx) openDetail(); else goTo(k); }
  }
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);

  /* ---- 滾輪 / 鍵盤 ---- */
  var wheelLock = 0;
  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, now = Date.now();
    if (Math.abs(d) < 8 || now - wheelLock < 450) return;
    wheelLock = now; step(d > 0 ? 1 : -1);
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); if (inDetail) closeDetail(); else close(); }
    else if (e.key === 'ArrowRight' || (inDetail && e.key === 'ArrowDown' && false)) { e.preventDefault(); if (inDetail) swapDetail(1); else step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (inDetail) swapDetail(-1); else step(-1); }
    else if (e.key === 'Enter' && !inDetail && document.activeElement === document.body) { openDetail(); }
    else if (e.key === 'Tab') {                                   // 焦點留在展示裡
      var f = [].slice.call(root.querySelectorAll('button, a[href]')).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var a = document.activeElement, i = f.indexOf(a);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.addEventListener('resize', function () { if (isOpen) { measure(); render(); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (isOpen) { measure(); render(); } });
})();
