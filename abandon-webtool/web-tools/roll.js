/* Abandon 滾輪文字（純 JS，不需要網路、不依賴 GSAP）
   每個字母上下疊兩份往上捲動形成老虎機效果；進入畫面時播放，點擊重播。
   時間曲線同 GSAP 原版：整體 4 秒 power4.inOut，字母錯開 0.05、各捲 9 個字高。 */
(function () {
  var title = document.getElementById('rollTitle');
  if (!title) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var text = title.textContent;
  title.innerHTML = Array.from(text).map(function (ch) {
    return '<span class="roll__char" aria-hidden="true"><span>' + ch + '</span><span>' + ch + '</span></span>';
  }).join('');
  var chars = Array.prototype.slice.call(title.querySelectorAll('.roll__char'));

  var CYCLES = 9, STEP = 0.05, TOTAL = CYCLES + STEP * (chars.length - 1), DURATION = 4000;
  function inOut4(t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; } // power4.inOut

  var raf = 0;
  function render(p) {
    var head = p * TOTAL;
    chars.forEach(function (c, i) {
      var local = Math.max(0, Math.min(CYCLES, head - STEP * i));
      var y = local >= CYCLES ? 0 : -(local % 1) * 100;
      c.children[0].style.transform = c.children[1].style.transform = 'translateY(' + y + '%)';
    });
  }
  function play() {
    cancelAnimationFrame(raf);
    var t0 = performance.now();
    (function step(now) {
      var t = Math.min(1, (now - t0) / DURATION);
      render(inOut4(t));
      if (t < 1) raf = requestAnimationFrame(step);
    })(t0);
  }

  var started = false;
  function start() { if (!started) { started = true; play(); } }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { start(); io.disconnect(); }
      }, { threshold: 0.6 });
      io.observe(title);
    } else { start(); }
  });
  title.addEventListener('click', play);
})();
