/* tools.html 的捲動行為（取代 subpage-snap.js 與 scroll-reveal.js 在這一頁的工作）

   1. 按「查看更多」→ 快速把畫面帶到展開的選單，選單中心對齊視窗中心
   2. 往下滑超過「更多功能」→ 視窗淡出轉場到全螢幕展示；展示裡再往下滑 → 回到下方三個直排功能
   3. 往上滑時不會有東西消失（標題、功能區塊、文字都只在第一次進入時播放進場，之後保持顯示）
   4. 三個功能「快 → 停 → 快 → 停」逐欄吸附，每次停下來都是該欄的正中間
   5. 三欄的標題與文案進入畫面時，一行一字依序從右下往左上飄入

   視覺數值在 tools-3d.css，節奏數值在下面的 CONFIG。 */
(function () {
  'use strict';

  // ★ 快速調整區 ★
  var CONFIG = {
    duration: 720,          // 吸附到下一欄的時間（毫秒）。越小越「快」
    menuDuration: 620,      // 按「查看更多」帶到選單中心的時間（毫秒）
    hold: 420,              // 每次停下來之後的「停頓」毫秒數：這段時間內的滾輪會被吃掉，才有快→停→快→停的節奏
    gestureGap: 90,         // 滾輪事件中斷超過這個毫秒數，才算「新的一次滑動」（吃掉觸控板的慣性尾巴）
    navGap: 24,             // 「更多功能」標題停在導覽列下方多遠（px）
    snapEps: 14,            // 離吸附點多近就算「已經停在那」（px）
    headStagger: 34,        // 標題逐字間隔（毫秒）
    textStagger: 16         // 內文逐字間隔（毫秒）
  };

  var doc = document.documentElement;
  var more = document.getElementById('more-features');
  var feats = [].slice.call(document.querySelectorAll('.tools-features .feature'));
  var opener = document.querySelector('[data-showcase-open]');
  var trigger = document.getElementById('tools-menu-trigger');
  var menu = document.getElementById('tools-dropdown');
  var wide = window.matchMedia('(min-width: 769px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- 小工具 ---------- */
  function easeInOutQuart(t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function maxScroll() { return Math.max(0, doc.scrollHeight - window.innerHeight); }
  function clamp(y) { return Math.min(Math.max(0, y), maxScroll()); }
  function absTop(el) { return el.getBoundingClientRect().top + window.scrollY; }
  function navH() { return parseFloat(getComputedStyle(doc).getPropertyValue('--nav-h')) || 100; }

  /* 吸附點：[0] = 「更多功能」標題停在導覽列下方；[1..] = 每一欄的正中間 */
  function positions() {
    var vh = window.innerHeight, out = [];
    out.push(clamp(absTop(more) - (navH() + CONFIG.navGap)));
    feats.forEach(function (f) {
      var r = f.getBoundingClientRect();
      out.push(clamp(r.top + window.scrollY + r.height / 2 - vh / 2));
    });
    return out;
  }

  /* ---------- 捲動動畫（同一時間只有一個） ---------- */
  var anim = null;
  function cancelAnim() { if (anim) { cancelAnimationFrame(anim.raf); anim = null; } }
  function run(kind, dur, ease, targetFn) {
    cancelAnim();
    var startY = window.scrollY, t0 = performance.now(), me = { kind: kind, raf: 0 };
    anim = me;
    function tick(now) {
      if (anim !== me) return;
      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, startY + (targetFn() - startY) * ease(p));
      if (p < 1) me.raf = requestAnimationFrame(tick);
      else { anim = null; if (kind === 'snap') holdUntil = Date.now() + CONFIG.hold; }
    }
    me.raf = requestAnimationFrame(tick);
  }

  /* ---------- 1. 查看更多 → 選單中心對齊視窗中心 ---------- */
  if (trigger && menu) {
    trigger.addEventListener('click', function () {
      if (trigger.getAttribute('aria-expanded') !== 'true') return;      // 這次是收合，不用捲
      run('menu', CONFIG.menuDuration, easeOutQuart, function () {
        if (menu.hidden || !menu.offsetHeight) return window.scrollY;     // 還沒開始展開，先不動
        var r = menu.getBoundingClientRect();                             // 每一格重新量：選單長高時，目標跟著走
        return clamp(r.top + window.scrollY + r.height / 2 - window.innerHeight / 2);
      });
    });
  }
  ['touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (anim && anim.kind === 'menu') cancelAnim(); }, { passive: true });
  });

  /* ---------- 2 + 4. 滾輪：逐欄吸附 / 進出全螢幕展示 ---------- */
  var lastWheelT = 0, needFresh = false, holdUntil = 0;

  function goTo(y) {
    needFresh = true;
    if (Math.abs(y - window.scrollY) < 2) return;
    run('snap', CONFIG.duration, easeInOutQuart, function () { return y; });
  }
  function openShowcase() {
    needFresh = true; holdUntil = Date.now() + 900;
    if (opener) opener.click();
    else goTo(positions()[1]);
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || !wide.matches) return;                               // 縮放手勢、手機版：交給瀏覽器
    if (doc.classList.contains('sc-lock')) return;                        // 全螢幕展示開著：它自己處理
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;                // 橫向滑動不管

    var now = Date.now(), gap = now - lastWheelT;
    lastWheelT = now;
    if (anim && anim.kind === 'menu') cancelAnim();                       // 使用者接手，停止自動帶位
    if (anim || now < holdUntil) { e.preventDefault(); return; }          // 吸附動畫進行中、或剛停下來的停頓期間：吃掉所有滾輪
    if (needFresh) {                                                      // 吸附完剛好還有慣性尾巴：吃掉，直到手指停過
      if (gap > CONFIG.gestureGap) needFresh = false;
      else { e.preventDefault(); return; }
    }

    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    if (Math.abs(dy) < 1) return;
    var dir = dy > 0 ? 1 : -1, pos = positions(), last = pos.length - 1, y = window.scrollY, eps = CONFIG.snapEps, at = -1, i;
    for (i = 0; i <= last; i++) if (Math.abs(y - pos[i]) <= eps) at = i;

    if (at >= 0) {                                                        // 正停在某個吸附點上
      if (dir > 0) {
        if (at === 0) { e.preventDefault(); openShowcase(); }             // 「更多功能」再往下 → 全螢幕展示
        else if (at < last) { e.preventDefault(); goTo(pos[at + 1]); }    // 下一欄
        return;                                                           // 最後一欄再往下：自然捲到頁尾
      }
      if (at > 0) { e.preventDefault(); goTo(pos[at - 1]); }              // 上一欄（第一欄往上是「更多功能」標題）
      return;                                                             // 標題再往上：自然捲回上方
    }

    if (dir > 0) {                                                        // 在吸附點之間，往下
      if (y < pos[0]) {                                                   // 還在上方自由區：滑到「更多功能」就直接進全螢幕展示，不先停下來
        if (y + dy >= pos[0] - eps) { e.preventDefault(); openShowcase(); }
        return;
      }
      if (y > pos[last]) return;                                          // 已經過了最後一欄
      for (i = 0; i <= last; i++) if (pos[i] > y) { e.preventDefault(); goTo(pos[i]); return; }
    } else {                                                              // 往上
      if (y > pos[last]) {                                                // 從頁尾往回滑：快到時對準最後一欄
        if (y + dy <= pos[last] + eps) { e.preventDefault(); goTo(pos[last]); }
        return;
      }
      if (y < pos[0]) return;
      for (i = last; i >= 0; i--) if (pos[i] < y) { e.preventDefault(); goTo(pos[i]); return; }
    }
  }, { passive: false });

  /* 全螢幕展示裡直向滑動離開 */
  document.addEventListener('showcase:leave', function (ev) {
    var pos = positions();
    window.scrollTo(0, ev.detail && ev.detail.dir < 0 ? pos[0] : pos[1]);  // 在淡出的展示後面先擺好位置
    needFresh = true; lastWheelT = Date.now(); holdUntil = lastWheelT + CONFIG.hold;
  });

  /* ---------- 3 + 5. 進場動畫：只播一次，往上滑不會消失 ---------- */
  if (reduce.matches || !('IntersectionObserver' in window) || !more || !feats.length) return;

  function splitChars(el, startIdx) {
    var text = el.textContent.trim(), tokens = text.match(/[A-Za-z0-9]+(?:[-'’][A-Za-z0-9]+)*|\s+|[\s\S]/g) || [];
    var closers = /^[，。、；：！？）」』》〉,.!?;:)\]]$/, units = [], idx = startIdx, frag = document.createDocumentFragment();
    tokens.forEach(function (t) {                                         // 結尾標點黏在前一個字上，才不會被擠到行首
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
      if (/^[A-Za-z0-9]/.test(u.t)) {                                     // 英文單字整個不換行，但每個字母各自飄
        var w = document.createElement('span'); w.className = 'fx-word'; w.setAttribute('aria-hidden', 'true');
        u.t.split('').forEach(function (ch) { w.appendChild(charSpan(ch)); });
        frag.appendChild(w);
      } else frag.appendChild(charSpan(u.t));                              // 中文：一字一格（含黏著的標點）
    });
    el.setAttribute('aria-label', text);
    el.textContent = ''; el.appendChild(frag);
    return idx;
  }

  doc.classList.add('js-fx');

  var headItems = [].slice.call(more.querySelectorAll('.tools-more__head > *'));
  headItems.forEach(function (el, i) { el.classList.add('fx-rise'); el.style.setProperty('--i', i); });

  feats.forEach(function (f) {
    var brand = f.querySelector('.feature__brand'), head = f.querySelector('.feature__headline'),
        text = f.querySelector('.feature__text'), link = f.querySelector('.feature__link');
    var nHead = head ? splitChars(head, 0) : 0, nText = 0;
    if (head) head.style.setProperty('--fx-stagger', CONFIG.headStagger + 'ms');
    if (text) {
      text.style.setProperty('--fx-stagger', CONFIG.textStagger + 'ms');
      text.style.setProperty('--fx-delay', (nHead * CONFIG.headStagger + 120) + 'ms');
      nText = splitChars(text, 0);
    }
    if (brand) { brand.classList.add('fx-rise'); brand.style.setProperty('--i', 0); }
    if (link) {
      link.classList.add('fx-rise');
      link.style.setProperty('--fx-delay', (nHead * CONFIG.headStagger + 120 + nText * CONFIG.textStagger) + 'ms');
      link.style.setProperty('--i', 0);
    }
  });

  function reveal(el) { el.classList.add('is-in'); }                     // 只加不拿掉：往上滑時什麼都不會消失

  var headObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { reveal(en.target); headObs.unobserve(en.target); } });
  }, { threshold: 0.35 });
  headObs.observe(more);

  /* 三欄：等那一欄的中心「爬到畫面中間偏下」才播（中心位置 ≤ 視窗高度 64%）。
     這樣在「更多功能」標題那一頁，下面露出來的第一欄不會偷跑，要滑到它、停在正中間時才飄字 */
  var pending = feats.slice(), ticking = false;
  function check() {
    ticking = false;
    var vh = window.innerHeight;
    pending = pending.filter(function (f) {
      var r = f.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh && r.top + r.height / 2 <= vh * 0.64) { reveal(f); return false; }
      return true;
    });
    if (!pending.length) { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  check();
})();