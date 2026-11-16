/* 游標軌跡文字（參考 GSAP cursor-trail 效果；純 JS，不需要網路）
   滑鼠每移動一段距離，就依序冒出一個字：你、不、能、成、為、設、計、師，循環排列成軌跡。
   每個字有隨機「遠近」：近的又大又清楚、蓋在上面；遠的又小又淡、略帶模糊、在下面，形成前後透視感。
   只在有滑鼠的裝置啟用；偏好減少動態時不啟用。 */
(function () {
  if (window.__cursorTrail) return; window.__cursorTrail = true;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce || !Element.prototype.animate) return;

  var CHARS = Array.from('你不能成為設計師');
  var THRESHOLD = 72;      // 每移動多少 px 產生一個字
  var POOL = 18;           // 同時最多幾個字
  var IN = 300, HOLD = 250, OUT = 400;
  var layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(layer);

  var nodes = [], idx = 0, ci = 0, last = null;
  for (var i = 0; i < POOL; i++) {
    var n = document.createElement('span');
    n.style.cssText = 'position:absolute;left:0;top:0;opacity:0;white-space:nowrap;font:300 28px/1 "Noto Sans TC","Inter",sans-serif;color:#fff;will-change:transform,opacity,filter';
    layer.appendChild(n); nodes.push(n);
  }

  function spawn(x, y, dx, dy) {
    var n = nodes[idx = (idx + 1) % POOL];
    if (n._anim) n._anim.cancel();
    n.textContent = CHARS[ci = (ci + 1) % CHARS.length];

    var d = Math.random();                        // 0 = 最遠、1 = 最近
    var scale = 0.45 + d * 1.55;                  // 近大遠小
    n.style.zIndex = Math.round(d * 100);         // 近的蓋住遠的
    n.style.filter = 'blur(' + ((1 - d) * 2.2).toFixed(2) + 'px)';
    var peak = 0.4 + d * 0.6;                     // 遠的較淡
    var drift = 10 + d * 40;                      // 近的飄得遠（視差）
    var ox = (Math.random() - 0.5) * 24 * (0.5 + d), oy = (Math.random() - 0.5) * 24 * (0.5 + d);
    var rot = (Math.random() - 0.5) * 16;
    var base = 'translate(' + (x + ox) + 'px,' + (y + oy) + 'px) translate(-50%,-50%) rotate(' + rot + 'deg)';
    var total = IN + HOLD + OUT;
    n._anim = n.animate([
      { transform: base + ' scale(' + scale * 0.3 + ')', opacity: 0, offset: 0, easing: 'cubic-bezier(.16,1,.3,1)' },
      { transform: base + ' scale(' + scale + ')', opacity: peak, offset: IN / total },
      { transform: base + ' scale(' + scale + ')', opacity: peak, offset: (IN + HOLD) / total, easing: 'cubic-bezier(.7,0,.84,0)' },
      { transform: base + ' translateY(-' + drift + 'px) scale(' + scale * 0.6 + ')', opacity: 0, offset: 1 }
    ], { duration: total, fill: 'forwards' });
  }

  // 有互動效果的元素（連結、按鈕、表單、輪播、卡片、游標為手指者）上不產生文字
  var INTERACTIVE = 'a,button,input,select,textarea,label,summary,details,[role="button"],[data-href],[data-like],[data-cart],[data-goto],[aria-pressed],.carousel,.media,.slide,.card,.program,.qa__item,.app-card,.price-card,.shop-card,.step-card,.choice,.coupon,.pill,.pill-btn,.btn,.icon-btn,.upload-box,.site-nav,.site-cart,.more-link,.help-pop,.feature__link';
  function onInteractive(t) {
    if (!t || !t.closest) return false;
    if (t.closest(INTERACTIVE)) return true;
    return getComputedStyle(t).cursor === 'pointer';
  }

  window.addEventListener('mousemove', function (e) {
    if (onInteractive(e.target)) { last = { x: e.clientX, y: e.clientY }; return; }
    if (!last) { last = { x: e.clientX, y: e.clientY }; return; }
    var dx = e.clientX - last.x, dy = e.clientY - last.y;
    if (Math.hypot(dx, dy) < THRESHOLD) return;
    spawn(e.clientX, e.clientY, dx, dy);
    last = { x: e.clientX, y: e.clientY };
  }, { passive: true });
  document.addEventListener('mouseleave', function () { last = null; });
})();
