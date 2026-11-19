/* 品牌宣言與全站 Section 主標題文字動畫（不需要網路、不依賴 GSAP）
   效果同 GSAP「animate-text」：依行切字、每行加遮罩，字元由下往上依序滑出。
   每次進入視窗時重播；視窗縮放換行時自動重切。 */
(function () {
  var root = document.documentElement;
  // ★ 同時抓取「品牌宣言 (.manifesto p)」與「後方各個 section 的主標題 (main.page > section h2)」
  var targets = Array.prototype.slice.call(
    document.querySelectorAll(".manifesto p, main.page > section h2"),
  );
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!targets.length || reduce || !Element.prototype.animate) {
    root.classList.remove("js");
    return;
  }

  // 確保所有目標元素都吃得到遮罩樣式（即使原本 CSS 只寫了 .manifesto p .split-line）
  var maskStyle = document.createElement("style");
  maskStyle.textContent = `
    .split-line {
      display: block;
      overflow: hidden;
    }
    .split-char {
      display: inline-block;
      will-change: transform;
    }
  `;
  document.head.appendChild(maskStyle);

  var EASE = "cubic-bezier(0.23, 1, 0.32, 1)"; // ≈ GSAP power4.out
  var DURATION = 900,
    STAGGER = 25;

  targets.forEach(function (el) {
    var original = el.innerHTML;
    var played = false;
    // 只有品牌宣言的第二句（「不再解釋，直接執行。」）需要等第一句播完延遲 800ms
    var isManifestoSecondLine = Boolean(
      el.closest(".manifesto") &&
      el.previousElementSibling &&
      el.previousElementSibling.tagName === "P",
    );

    function split() {
      el.innerHTML = original;
      // 第一輪：把文字拆成逐字 span（<br> 保留）以量測換行
      var chars = [];
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            Array.from(n.nodeValue.replace(/\s+/g, " ")).forEach(function (ch) {
              if (ch === " ") {
                frag.appendChild(document.createTextNode(" "));
                return;
              }
              var s = document.createElement("span");
              s.className = "split-char";
              s.textContent = ch;
              frag.appendChild(s);
              chars.push(s);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
        });
      })(el);

      // 依 offsetTop 分行
      var lines = [],
        lastTop = null;
      chars.forEach(function (c) {
        var t = c.offsetTop;
        if (lastTop === null || Math.abs(t - lastTop) > 2) {
          lines.push([]);
          lastTop = t;
        }
        lines[lines.length - 1].push(c);
      });

      // 第二輪：每行包進遮罩容器
      el.textContent = "";
      lines.forEach(function (arr) {
        var line = document.createElement("span");
        line.className = "split-line";
        arr.forEach(function (c) {
          line.appendChild(c);
        });
        el.appendChild(line);
      });
      el.setAttribute(
        "aria-label",
        original
          .replace(/<br\s*\/?>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      );
      el.style.visibility = "visible";
      return chars;
    }

    function play(chars) {
      played = true;
      var firstLineDelay = isManifestoSecondLine ? 800 : 120;
      chars.forEach(function (c, i) {
        if (c._manifestoAnimation) c._manifestoAnimation.cancel();
        c.style.transform = "translateY(110%)";
        var animation = c.animate(
          [{ transform: "translateY(110%)" }, { transform: "translateY(0)" }],
          {
            duration: DURATION,
            easing: EASE,
            delay: firstLineDelay + i * STAGGER,
            fill: "both",
          },
        );
        c._manifestoAnimation = animation;
        animation.onfinish = function () {
          c.style.transform = "";
        };
      });
    }

    function resetChars(chars) {
      chars.forEach(function (c) {
        if (c._manifestoAnimation) c._manifestoAnimation.cancel();
        c.style.transform = "translateY(110%)";
      });
    }

    function init() {
      var chars = split();
      resetChars(chars);

      var wasIntersecting = false;
      var io = new IntersectionObserver(
        function (es) {
          var isIntersecting = es[0].isIntersecting;
          if (isIntersecting && !wasIntersecting) {
            play(chars);
          } else if (!isIntersecting && wasIntersecting) {
            // 離開視窗時立刻推回遮罩下方，確保來回滑動再進入時乾淨重播
            resetChars(chars);
          }
          wasIntersecting = isIntersecting;
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(el);

      var timer;
      window.addEventListener("resize", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var w = el.getBoundingClientRect().width;
          if (Math.abs(w - (init.w || w)) < 1) return;
          init.w = w;
          if (!played) {
            io.disconnect();
            init();
          } else {
            chars = split();
          }
        }, 150);
      });
      init.w = el.getBoundingClientRect().width;
    }

    (document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve()
    ).then(init);
  });

  // 失敗保險：3 秒後一定顯示
  setTimeout(function () {
    targets.forEach(function (el) {
      el.style.visibility = "visible";
    });
  }, 3000);
})();
