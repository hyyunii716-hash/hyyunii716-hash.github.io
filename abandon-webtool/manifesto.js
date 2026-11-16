/* 品牌宣言文字動畫（不需要網路、不依賴 GSAP）
   效果同 GSAP「animate-text」：依行切字、每行加遮罩，字元由下往上依序滑出。
   進入視窗時播放一次；視窗縮放換行時自動重切（不重播）。 */
(function () {
  var root = document.documentElement;
  var targets = Array.prototype.slice.call(document.querySelectorAll('.manifesto p'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!targets.length || reduce || !Element.prototype.animate) { root.classList.remove('js'); return; }

  var EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'; // ≈ GSAP power4.out
  var DURATION = 900, STAGGER = 25, GROUP_DELAY = 150;

  targets.forEach(function (p, idx) {
    var original = p.innerHTML;
    var played = false;

    function split() {
      p.innerHTML = original;
      // 第一輪：把文字拆成逐字 span（<br> 保留）以量測換行
      var chars = [];
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            Array.from(n.nodeValue.replace(/\s+/g, ' ')).forEach(function (ch) {
              if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
              var s = document.createElement('span');
              s.className = 'split-char'; s.textContent = ch; frag.appendChild(s); chars.push(s);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
        });
      })(p);

      // 依 offsetTop 分行
      var lines = [], lastTop = null;
      chars.forEach(function (c) {
        var t = c.offsetTop;
        if (lastTop === null || Math.abs(t - lastTop) > 2) { lines.push([]); lastTop = t; }
        lines[lines.length - 1].push(c);
      });

      // 第二輪：每行包進遮罩容器
      p.textContent = '';
      lines.forEach(function (arr) {
        var line = document.createElement('span');
        line.className = 'split-line';
        arr.forEach(function (c) { line.appendChild(c); });
        p.appendChild(line);
      });
      p.setAttribute('aria-label', original.replace(/<br\s*\/?>/g, '').replace(/\s+/g, ' ').trim());
      p.style.visibility = 'visible';
      return chars;
    }

    function play(chars) {
      played = true;
      chars.forEach(function (c, i) {
        c.animate(
          [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
          { duration: DURATION, easing: EASE, delay: idx * GROUP_DELAY + i * STAGGER, fill: 'backwards' }
        );
      });
    }

    function init() {
      var chars = split();
      // 播放前先把字推到遮罩外，避免進入視窗前就可見
      var hold = chars.map(function (c) { c.style.transform = 'translateY(110%)'; return c; });
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        hold.forEach(function (c) { c.style.transform = ''; });
        play(chars);
      }, { rootMargin: '0px 0px -15% 0px' });
      io.observe(p);

      var timer;
      window.addEventListener('resize', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var w = p.getBoundingClientRect().width;
          if (Math.abs(w - (init.w || w)) < 1) return;
          init.w = w;
          if (!played) { io.disconnect(); init(); } else { split(); }
        }, 150);
      });
      init.w = p.getBoundingClientRect().width;
    }

    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(init);
  });

  // 失敗保險：3 秒後一定顯示
  setTimeout(function () { targets.forEach(function (p) { p.style.visibility = 'visible'; }); }, 3000);
})();
