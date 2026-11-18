/* 網頁程式：分類篩選動畫（FLIP）
   效果參考 GSAP Flip「Smooth Flexbox Filtering」：點分類後，留下的卡片平滑滑到新位置、
   新出現的卡片從 0 放大淡入、被篩掉的卡片縮小淡出，卡片依序（stagger）動起來。
   純原生 JS（Web Animations API），不需要 GSAP，離線也能用。 */
(function () {
  var grid = document.querySelector('.app-grid');
  var buttons = document.querySelectorAll('[data-filter]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.app-card'));
  if (!grid || !buttons.length || !cards.length || !grid.animate) return;

  var DUR = 700, STAGGER = 80, LEAVE = 500;
  var EASE = 'cubic-bezier(0.45, 0, 0.55, 1)';              // ≈ GSAP power1.inOut
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var running = [];

  function matches(card, f) {
    var cats = (card.getAttribute('data-category') || '').split(' ');
    return f === 'all' || cats.indexOf(f) !== -1;
  }
  function cleanup() {                                       // 上一輪還沒播完就直接收尾
    running.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    running = [];
    cards.forEach(function (c) {
      if (c._leaving) { c.hidden = true; c._leaving = false; }
      c.style.position = c.style.left = c.style.top = c.style.width = c.style.height = c.style.margin = c.style.zIndex = '';
    });
    grid.style.position = '';
  }

  function apply(f, animate) {
    cleanup();
    var before = {}, i;
    var gr = grid.getBoundingClientRect();
    if (animate) cards.forEach(function (c, k) { if (!c.hidden) before[k] = c.getBoundingClientRect(); });
    var oldH = gr.height;

    var leaving = [], entering = [], staying = [];
    cards.forEach(function (c, k) {
      var was = !c.hidden, now = matches(c, f);
      if (was && now) staying.push(k);
      else if (was && !now) leaving.push(k);
      else if (!was && now) entering.push(k);
    });

    if (!animate) { cards.forEach(function (c) { c.hidden = !matches(c, f); }); return; }

    // 離開的卡片：釘在原位，讓版面先空出來
    grid.style.position = 'relative';
    leaving.forEach(function (k) {
      var c = cards[k], r = before[k];
      c._leaving = true;
      c.style.position = 'absolute'; c.style.margin = '0'; c.style.zIndex = '0';
      c.style.left = (r.left - gr.left - grid.clientLeft) + 'px';
      c.style.top = (r.top - gr.top - grid.clientTop) + 'px';
      c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
    });
    entering.forEach(function (k) { cards[k].hidden = false; });

    var newH = grid.getBoundingClientRect().height;
    var order = 0;
    function track(a) { running.push(a); return a; }

    // 留下的卡片：從舊位置滑到新位置（連大小一起縮放）
    staying.forEach(function (k) {
      var c = cards[k], a = before[k], b = c.getBoundingClientRect();
      var dx = a.left - b.left, dy = a.top - b.top, sx = a.width / b.width, sy = a.height / b.height;
      var delay = order++ * STAGGER;
      if (!dx && !dy && Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;
      track(c.animate(
        [{ transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
         { transformOrigin: '0 0', transform: 'none' }],
        { duration: DUR, delay: delay, easing: EASE, fill: 'backwards' }));
    });
    // 新出現的卡片：從 0 放大、淡入
    entering.forEach(function (k) {
      var delay = order++ * STAGGER;
      track(cards[k].animate(
        [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: DUR + 200, delay: delay, easing: EASE, fill: 'backwards' }));
    });
    // 被篩掉的卡片：縮小、淡出，結束後才真正隱藏
    leaving.forEach(function (k) {
      var c = cards[k];
      var a = track(c.animate(
        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0)' }],
        { duration: LEAVE, easing: EASE, fill: 'forwards' }));
      a.onfinish = function () {
        if (!c._leaving) return;
        c.hidden = true; c._leaving = false;
        c.style.position = c.style.left = c.style.top = c.style.width = c.style.height = c.style.margin = c.style.zIndex = '';
      };
    });
    // 整個區塊的高度也平滑變化，下面的頁尾才不會突然跳動
    if (Math.abs(oldH - newH) > 1) {
      var g = track(grid.animate([{ height: oldH + 'px' }, { height: newH + 'px' }], { duration: DUR, easing: EASE }));
      g.onfinish = function () { if (!leaving.some(function (k) { return cards[k]._leaving; })) grid.style.position = ''; };
    }
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      apply(f, !reduce.matches);
    });
  });
})();
