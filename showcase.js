/* 更多功能：全螢幕展示（純原生 JS，不需要網路）
   內容直接讀頁面上「更多功能」那三個 .feature，所以改文字只要改 tools.html 原本的區塊就好。
   操作：拖曳 / 滾輪 / ← → 切換，點中間那張（或 Enter）進入詳細，Esc 返回，再按 Esc 離開。 */
(function () {
  var openers = document.querySelectorAll('[data-showcase-open]');
  var feats = document.querySelectorAll('.tools-features .feature, .apps-features .feature');   // 網頁工具「更多功能」與網頁程式介紹列共用
  var isApps = !!document.querySelector('.apps-features');
  if (!openers.length || !feats.length) return;

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

  var root = document.createElement('div');
  root.className = 'sc'; root.hidden = true;
  if (isApps) root.classList.add('sc--apps');
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', isApps ? '網頁程式全螢幕展示' : '更多功能全螢幕展示');
  root.innerHTML =
    '<div class="sc__bar">' +
      '<img class="sc__brand" src="' + (items[0].brand || 'assets/abandon-wordmark.png') + '" alt="Abandon">' +
      '<span class="sc__label">' + (isApps ? '全部程式' : '全部功能') + '</span>' +
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

  var pos = 0, target = 0, S = 800, raf = 0, last = 0, idx = 0, isOpen = false, inDetail = false, lastFocus = null;
  var lastWheelT = 0, fresh = false;                              // 判斷「新的一次滑動」用（見滾輪段落）
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
    var go = $('.sc__go'); go.setAttribute('data-k', k); go.setAttribute('href', it.href); go.firstChild.textContent = it.linkText;
    if (it.ext) { go.target = '_blank'; go.rel = 'noopener noreferrer'; } else { go.removeAttribute('target'); go.removeAttribute('rel'); }
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
    lastWheelT = Date.now(); fresh = false;                        // 從頁面滑進來的那一下慣性，不算「再往下滑」
    root.hidden = false; document.documentElement.classList.add('sc-lock');
    measure(); pos = target = typeof startK === 'number' ? startK : 0; idx = -1; render(); updateCount();
    requestAnimationFrame(function () { root.classList.add('is-open'); });
    $('.sc__exit').focus({ preventScroll: true });
    
    /* 重新設置並播放字體進場動畫 */
    document.documentElement.classList.add('js-fx');
    titles.forEach(function (t, k) {
      t.classList.remove('is-in');  // 重置動畫狀態
      splitChars(t, 0);  // 重新拆分字符
      setupAnimationVars(t, k);  // 設置 CSS 變數
    });
    playEntranceAnimation();  // 播放進場動畫
  }
  /* 直向滑動離開展示：dir = 1 往下（回到下方三個直排功能）、-1 往上（回到「更多功能」標題）。
     先照一般關閉淡出，再發出 showcase:leave，讓頁面（tools-scroll.js）把捲動位置擺好 */
  function leave(dir) {
    close(); afterLeave = true; leaveT = Date.now();
    document.dispatchEvent(new CustomEvent('showcase:leave', { detail: { dir: dir } }));
    /* 直排介紹已收起（只能從展示看）：往下滑 → 接到頁尾；往上滑 → 回到「全螢幕展示」按鈕 */
    if (getComputedStyle(feats[0]).visibility === 'hidden') {
      if (dir > 0) { afterFooter = true; window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); }
      else if (openers[0]) openers[0].scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }
  function close() {
    if (!isOpen) return; isOpen = false; closeDetail();
    root.classList.remove('is-open'); document.documentElement.classList.remove('sc-lock');
    setTimeout(function () { if (!isOpen) root.hidden = true; }, 480);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  openers.forEach(function (b) { b.addEventListener('click', function () { open(0); }); });

  /* ---- 下滑進入：提示文字停在畫面中、頁面靜止一下之後，再「用力」往下滑一次（滾輪 / 手指上推）才展開；展示裡往上滑則退出 ----
     不要太靈敏：落在提示上的那一下慣性不算，頁面要先靜止 REST 毫秒，再在 WIN 毫秒內累積滑動量超過 PUSH 才展開 */
  var REST = 450, WIN = 250, PUSH = 100, FOOTER_BLOCK = 2000;     // ★ 調整區：靜止時間 / 統計視窗 / 需要的滑動量 / 離開後多久不重進
  var hint = openers[0], wLast = 0, lastScrollT = 0, leaveT = 0, push = [], afterFooter = false, afterLeave = false;
  window.addEventListener('scroll', function () { lastScrollT = Date.now(); }, { passive: true });
  function hintBox() { var r = hint.getBoundingClientRect(); return (r.bottom > 0 && r.top < window.innerHeight) ? r : null; }
  function inZone(r) { return r && (r.top + r.height / 2 <= window.innerHeight * 0.62); }
  /* capture：搶在 universal-snap.js 之前處理，否則它會直接把頁面吸到頁尾、跳過提示 */
  window.addEventListener('wheel', function (e) {
    var now = Date.now(), gap = now - wLast; wLast = now;
    if (isOpen || e.ctrlKey || window.innerWidth <= 768 || getComputedStyle(feats[0]).visibility !== 'hidden') return;
    if (afterLeave) {                                               // 剛離開展示：那一下滑動的慣性不要再被頁面吸附吃掉
      if (gap <= 140) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      afterLeave = false;
    }
    if (e.deltaY < 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { afterFooter = false; push = []; return; }
    if (e.deltaY <= 0 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    var r = hintBox();
    if (!r) { afterFooter = false; push = []; return; }
    if (!inZone(r)) { push = []; return; }                          // 提示還沒到畫面中：照一般方式往下滑 / 吸附
    if (afterFooter && now - leaveT < FOOTER_BLOCK) return;         // 剛從展示往下離開、正在看頁尾：不要馬上又彈回展示
    e.preventDefault(); e.stopImmediatePropagation();               // 提示停在畫面中後，頁面不再自己往下吸
    push.push([now, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY]);
    push = push.filter(function (p) { return now - p[0] <= WIN; });
    var sum = push.reduce(function (a, p) { return a + p[1]; }, 0);
    if (now - lastScrollT >= REST && sum >= PUSH) { push = []; open(0); }
  }, { passive: false, capture: true });
  var ht = null;
  window.addEventListener('touchstart', function (e) { ht = (!isOpen && e.touches.length === 1) ? { x: e.touches[0].clientX, y: e.touches[0].clientY, vis: !!hintBox() } : null; }, { passive: true });
  window.addEventListener('touchend', function (e) {
    if (!ht || isOpen || getComputedStyle(feats[0]).visibility !== 'hidden') { ht = null; return; }
    var ht0 = ht, t = e.changedTouches[0], dx = t.clientX - ht.x, dy = t.clientY - ht.y; ht = null;
    if (dy > 70 && Math.abs(dy) > Math.abs(dx) * 1.6) { afterFooter = false; return; }
    if (-dy > 70 && Math.abs(dy) > Math.abs(dx) * 1.6 && !afterFooter && ht0.vis) open(0);
  }, { passive: true });
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
  /* 手機：直向滑動離開（往上滑 = 往下看 → 頁尾；往下滑 → 回到按鈕）。橫向仍然是切換 */
  var tch = null;
  stage.addEventListener('touchstart', function (e) { var t = e.touches[0]; tch = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!tch || !isOpen) return; var t = e.changedTouches[0], dx = t.clientX - tch.x, dy = t.clientY - tch.y; tch = null;
    if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.6) leave(dy < 0 ? 1 : -1);
  }, { passive: true });

  /* ---- 滾輪 / 鍵盤 ---- */
  var wheelLock = 0;
  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (!isOpen) return;
    var now = Date.now(), gap = now - lastWheelT; lastWheelT = now;
    if (gap > 140) fresh = true;                                  // 手指停過再滑，才算新的一次
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {                // 直向：離開展示（橫向仍然是左右切換）
      if (!fresh || Math.abs(e.deltaY) < 8) return;
      fresh = false; leave(e.deltaY > 0 ? 1 : -1); return;
    }
    if (Math.abs(e.deltaX) < 8 || now - wheelLock < 450) return;
    wheelLock = now; step(e.deltaX > 0 ? 1 : -1);
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