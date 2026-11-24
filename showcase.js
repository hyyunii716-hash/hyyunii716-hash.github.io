/* 更多功能 / 網頁程式：滿版橫向輪播（純原生 JS，不需要網路）
   內容直接讀頁面上「更多功能」那三個 .feature，所以改文字只要改 tools.html 原本的區塊就好。
   直接嵌在頁面裡，往下滑就是這個畫面（不需要按任何東西展開）。
   操作：拖曳 / 橫向滾輪 / ← → / 下方箭頭切換，點中間那張（或 Enter）進入詳細，Esc 返回。 */
(function () {
  var mount = document.querySelector('[data-showcase-mount]');
  var feats = document.querySelectorAll('.tools-features .feature, .apps-features .feature');   // 網頁工具「更多功能」與網頁程式介紹列共用
  var isApps = !!document.querySelector('.apps-features');
  if (!mount || !feats.length) return;

  var pills = {'screen-rest':'螢幕保護','core-idea':'核心理念','education':'量身定制'};
  document.querySelectorAll('.tools-more__nav .pill').forEach(function (a) { pills[(a.getAttribute('href') || '').slice(1)] = a.textContent.trim(); });
  var items = Array.prototype.map.call(feats, function (f) {
    var m = f.querySelector('.tools-media') || f.querySelector('.media'), l = f.querySelector('.feature__link'), b = f.querySelector('.tools-wordmark');
    var nm = f.querySelector('.feature__name'), mh = f.querySelector('a.media');      // 網頁程式：軟體名稱、圖片連結（進入該軟體頁面）
    var appName = nm ? nm.textContent.trim() : '';
    var ic = f.querySelector('.app-icon'), ics = ic ? getComputedStyle(ic) : null, icr = ic ? ic.getBoundingClientRect() : null;
    return {
      appName: appName,
      icon: ic && icr.width ? { abbr: ic.textContent.trim(), bg: ics.backgroundColor, fg: ics.color, ff: ics.fontFamily, size: icr.width, radius: parseFloat(ics.borderTopLeftRadius) || icr.width * .2 } : null,
      label: pills[f.id] || appName, brand: b ? b.getAttribute('src') : '',
      ext: !!(mh && mh.target === '_blank'),
      title: f.querySelector('.feature__headline').textContent.trim(),
      text: f.querySelector('.feature__text').textContent.trim(),
      href: mh ? mh.getAttribute('href') : (l ? l.getAttribute('href') : 'pricing.html'),
      linkText: mh ? '前往 ' + appName : (l ? l.textContent.trim() : '瀏覽適用於企業或學生與教師的方案'),
      media: m ? (m.tagName === 'A' ? '<div class="' + m.className + '"></div>' : m.outerHTML) : ''
    };
  });
  var n = items.length;
  var ARROW_R = '<svg viewBox="0 0 60 14" fill="none" stroke="currentColor" stroke-width="1"><path d="M0 7h58M52 1l6 6-6 6"/></svg>';
  var ARROW_S = '<svg viewBox="0 0 22 10" fill="none" stroke="currentColor" stroke-width="1"><path d="M0 5h20M16 1l4 4-4 4"/></svg>';
  var ARROW_V = function (up) { return '<svg viewBox="0 0 18 34" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9 ' + (up ? 33 : 1) + 'V' + (up ? 2 : 32) + 'M2 ' + (up ? 9 : 25) + 'l7 ' + (up ? '-7 7 7' : '7 7 -7') + '"/></svg>'; };
  function pad(i) { return (i < 10 ? '0' : '') + i; }

  var root = document.createElement('section');
  root.className = 'sc sc--inline';
  if (isApps) root.classList.add('sc--apps');
  root.setAttribute('aria-label', isApps ? '網頁程式' : '更多功能');
  root.innerHTML =
    '<div class="sc__inner">' +
    '<div class="sc__bar">' +
      '<img class="sc__brand" src="' + (items[0].brand || 'assets/abandon-wordmark.png') + '" alt="Abandon">' +
      '<span class="sc__label">' + (isApps ? '全部程式' : '全部功能') + '</span>' +
      '<div class="sc__ctrl"><button type="button" class="sc__back">返回</button></div>' +
    '</div>' +
    '<div class="sc__stage">' +
      '<div class="sc__media-box">' + items.map(function (it, k) { return '<div class="sc__media" data-k="' + k + '">' + it.media + '</div>'; }).join('') + '</div>' +
      items.map(function (it, k) { return '<div class="sc__title" data-k="' + k + '">' + it.title + '</div>'; }).join('') +
      '<div class="sc__hint">拖曳或滑動切換</div>' +
      '<button type="button" class="sc__next" aria-label="下一個">' + ARROW_R + '</button>' +
      '<div class="sc__count"></div>' +
    '</div>' +
    '<div class="sc__detail"><section class="sc__panel">' +
      '<div class="sc__d-row"><div class="sc__d-copy"><h3 class="sc__d-title"></h3><p class="sc__d-text"></p></div><div class="sc__logo" aria-hidden="true"></div></div>' +
      '<div class="sc__meta"><dl><dt>分類</dt><dd class="sc__m-cat"></dd></dl><dl><dt>編號</dt><dd class="sc__m-no"></dd></dl><dl><dt>方案</dt><dd>Abandon</dd></dl>' +
      '<a class="sc__go" href="pricing.html"><span></span>' + ARROW_S + '</a></div></section>' +
      '<div class="sc__big"><div class="sc__media-wrap"></div></div></div>' +
    '<button type="button" class="sc__arrow sc__arrow--prev" aria-label="上一個功能">' + ARROW_V(true) + '</button>' +
    '<button type="button" class="sc__arrow sc__arrow--next" aria-label="下一個功能">' + ARROW_V(false) + '</button>' +
    '</div>';
  /* 網頁工具：「更多功能」標題搬進輪播那一屏的上方（同一屏，不再自己佔一段空白）；原本那一塊收成高度 0，但留在頁面裡（其他程式可能還在找它） */
  var more = document.getElementById('more-features'), moreHead = more && more.querySelector('.tools-more__head');
  if (moreHead) {
    var hd = document.createElement('div'); hd.className = 'sc__head'; hd.appendChild(moreHead.cloneNode(true));
    hd.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
    root.querySelector('.sc__inner').appendChild(hd);
    more.style.cssText += ';height:0;min-height:0;padding:0;margin:0;overflow:hidden;visibility:hidden';
  }
  root.style.setProperty('--sc-top', (document.querySelector('[data-subpage-snap-start]') ? 44 : 88) + 'px');   // 頁面吸附時，輪播頂端會停在導覽列下方多少（subpage-snap 44、universal-snap 88）
  mount.replaceWith(root);
  window.dispatchEvent(new Event('resize'));                       // 通知 universal-snap.js 重新抓「停靠點」，輪播才會成為其中一站

  var $ = function (s) { return root.querySelector(s); };
  var stage = $('.sc__stage'), detail = $('.sc__detail');
  var titles = [].slice.call(root.querySelectorAll('.sc__title')), medias = [].slice.call(root.querySelectorAll('.sc__media'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* 字體進場動畫：拆分字符並添加樣式 */
  function splitChars(el, startIdx) {
    var text = el.textContent.trim(), tokens = text.match(/[A-Za-z0-9]+(?:[-''][A-Za-z0-9]+)*|\s+|[\s\S]/g) || [];
    var closers = /^[，。、；：！？）」』》〉,.!?;:)\]]$/, units = [], idx = startIdx, frag = document.createDocumentFragment();
    tokens.forEach(function (t) {
      if (/^\s+$/.test(t)) units.push({ sp: true });
      else if (closers.test(t) && units.length && !units[units.length - 1].sp) units[units.length - 1].t += t;
      else units.push({ t: t });
    });
    function charSpan(ch) {
      var s = document.createElement('span');
      s.className = 'fx-char'; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', idx++); s.textContent = ch; return s;
    }
    units.forEach(function (u) {
      if (u.sp) { frag.appendChild(document.createTextNode(' ')); return; }
      if (/^[A-Za-z0-9]/.test(u.t)) {
        var w = document.createElement('span'); w.className = 'fx-word'; w.setAttribute('aria-hidden', 'true');
        u.t.split('').forEach(function (ch) { w.appendChild(charSpan(ch)); });
        frag.appendChild(w);
      } else frag.appendChild(charSpan(u.t));
    });
    el.setAttribute('aria-label', text);
    el.textContent = ''; el.appendChild(frag);
    return idx;
  }

  /* 設置進場動畫的 CSS 變數 */
  function setupAnimationVars(titleEl, k) {
    titleEl.style.setProperty('--fx-stagger', '34ms');  // 標題逐字間隔
    titleEl.style.setProperty('--fx-delay', (k * 200) + 'ms');  // 每個標題的延遲
  }

  /* 重置進場動畫（移除 is-in 以便重新播放） */
  function resetAnimations() {
    titles.forEach(function (t) { t.classList.remove('is-in'); });
  }

  /* 播放進場動畫 */
  function playEntranceAnimation() {
    if (reduce.matches) return;
    // 稍微延遲，確保動畫能被瀏覽器重新觸發
    setTimeout(function () {
      titles.forEach(function (t) { t.classList.add('is-in'); });
    }, 50);
  }

  var pos = 0, target = 0, S = 800, raf = 0, last = 0, idx = 0, isOpen = true, inDetail = false;
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
      titles[k].style.filter = a < 0.02 ? 'none' : 'blur(' + (Math.min(a, 1) * 2.2).toFixed(2) + 'px)';
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
    var go = $('.sc__go'); go.setAttribute('data-k', k); go.setAttribute('href', it.href); go.firstChild.textContent = it.linkText;
    if (it.ext) { go.target = '_blank'; go.rel = 'noopener noreferrer'; } else { go.removeAttribute('target'); go.removeAttribute('rel'); }
    $('.sc__media-wrap').innerHTML = it.media;
    var lg = $('.sc__logo'), ic = it.icon; lg.innerHTML = '';
    if (ic) { var sp = document.createElement('span'); sp.textContent = ic.abbr; sp.style.cssText = 'background:' + ic.bg + ';color:' + ic.fg + ';font-family:' + ic.ff; lg.appendChild(sp); }
  }
  function swapDetail(dir) {
    var nk = ((idx + dir) % n + n) % n;
    detail.classList.add('is-swap');
    setTimeout(function () { fill(nk); goTo(nk); idx = nk; detail.scrollTop = 0; detail.classList.remove('is-swap'); }, 230);
  }
  function openDetail() { if (inDetail) return; fill(idx); detail.scrollTop = 0; inDetail = true; root.classList.add('is-detail'); }
  function closeDetail() { if (!inDetail) return; inDetail = false; root.classList.remove('is-detail'); }

  /* ---- 嵌在頁面裡：不用「開啟」，滑到就是這個畫面；標題進場動畫在滑進畫面時播一次 ---- */
  root.classList.add('is-open');
  document.documentElement.classList.add('js-fx');
  titles.forEach(function (t, k) { splitChars(t, 0); setupAnimationVars(t, k); });
  measure(); pos = target = 0; idx = -1; render(); updateCount();
  var played = false;
  function playOnce() { if (played) return; played = true; measure(); render(); playEntranceAnimation(); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { playOnce(); io.disconnect(); } }); }, { threshold: 0.35 });
    io.observe(root);
  } else playOnce();
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

  /* ---- 滾輪 / 鍵盤：橫向滾輪切換；直向滾輪照一般頁面往下 / 往上滑（不攔截） ---- */
  var wheelLock = 0;
  window.addEventListener('wheel', function (e) {
    if (!root.contains(e.target) || inDetail) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;           // 直向：交給頁面（往下 / 往上一屏）
    e.preventDefault(); e.stopImmediatePropagation();               // 橫向：只切換，不要讓頁面吸附程式把它當成上下滑
    var now = Date.now();
    if (Math.abs(e.deltaX) < 8 || now - wheelLock < 450) return;
    wheelLock = now; step(e.deltaX > 0 ? 1 : -1);
  }, { passive: false, capture: true });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (inDetail) { e.preventDefault(); closeDetail(); } return; }
    var r = root.getBoundingClientRect(), mid = window.innerHeight / 2;
    if (!(r.top < mid && r.bottom > mid)) return;                    // 輪播在畫面中間時，方向鍵才切換
    if (e.key === 'ArrowRight') { e.preventDefault(); if (inDetail) swapDetail(1); else step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (inDetail) swapDetail(-1); else step(-1); }
    else if (e.key === 'Enter' && !inDetail && document.activeElement === document.body) { openDetail(); }
  });
  window.addEventListener('resize', function () { measure(); render(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); render(); });
})();