/* 游標軌跡文字（流星尾跡）＋左下角液態變形滑動開關 */
(function () {
  if (window.__cursorTrail) return;
  window.__cursorTrail = true;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce || !Element.prototype.animate) return;

  // ================= 🎛️ 視覺手感設定區（改這裡的數字就好） =================
  var SPACING = 32; // 【1. 字距】：滑鼠每移動多少 px 出現一個字
  var DURATION = 750; // 【2. 流星消散時間】：尾跡淡出總毫秒數（越小越俐落）
  var FONT_SIZE = 18; // 【3. 字體大小】：流星文字大小
  var TRAIL_LEN = 48; // 【4. 流星尾跡長度】：沿著滑鼠移動方向滑出的 px 距離
  var TEXT_COLOR = "#ffffff"; // 【5. 文字顏色】：純白無發光（可改成 rgba(255,255,255,0.85)）
  var POOL = 32; // 同時存在畫面上的最大字數
  // =========================================================================

  var isEnabled = localStorage.getItem("abandon_cursor_trail") !== "false";

  var CHARS = Array.from("你不能成為設計師");
  var layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(layer);

  var nodes = [],
    idx = 0,
    ci = 0,
    last = null;
  for (var i = 0; i < POOL; i++) {
    var n = document.createElement("span");
    n.style.cssText = [
      "position:absolute",
      "left:0",
      "top:0",
      "opacity:0",
      "white-space:nowrap",
      "font:400 " + FONT_SIZE + 'px/1 "Noto Sans TC","Inter",sans-serif',
      "color:" + TEXT_COLOR,
      "text-shadow:none",
      "filter:blur(0px)",
      "will-change:transform,opacity,filter",
    ].join(";");
    layer.appendChild(n);
    nodes.push(n);
  }

  // 注入關鍵影格樣式
  var styleEl = document.createElement("style");
  styleEl.textContent = [
    "@keyframes abandonPulseRing { 0% { transform: scale(0.95); opacity: 0.75; } 100% { transform: scale(1.65); opacity: 0; } }",
    "@keyframes abandonNeonFlow { 0%, 100% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); } 50% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); } }",
  ].join("\n");
  document.head.appendChild(styleEl);

  // ================= 🔘 左下角「液態變形＋能量波紋」滑動開關 =================
  var wrapper = document.createElement("div");
  wrapper.setAttribute("role", "switch");
  wrapper.setAttribute("tabindex", "0");
  wrapper.setAttribute("aria-label", "切換游標流星文字效果");
  wrapper.style.cssText = [
    "position: fixed",
    "left: 20px",
    "bottom: 20px",
    "z-index: 10000",
    "display: inline-flex",
    "align-items: center",
    "gap: 8px",
    "padding: 6px 10px 6px 13px",
    "border-radius: 999px",
    "border: 1px solid rgba(255, 255, 255, 0.25)",
    "background: rgba(14, 14, 18, 0.85)",
    "backdrop-filter: blur(14px)",
    "-webkit-backdrop-filter: blur(14px)",
    "color: #fff",
    'font: 400 12px/1 "Noto Sans TC", "Inter", sans-serif',
    "letter-spacing: 0.06em",
    "cursor: pointer",
    "user-select: none",
    "will-change: transform",
    "transition: border-color 0.3s ease, opacity 0.3s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
  ].join(";");

  var pulseRing = document.createElement("span");
  pulseRing.style.cssText = [
    "position: absolute",
    "inset: -1px",
    "border-radius: 999px",
    "border: 1.5px solid rgba(255, 255, 255, 0.45)",
    "pointer-events: none",
    "opacity: 0",
  ].join(";");

  var label = document.createElement("span");
  label.textContent = "惡魔低語";
  label.style.transition = "color 0.3s ease";

  var track = document.createElement("span");
  track.style.cssText = [
    "position: relative",
    "width: 34px",
    "height: 18px",
    "border-radius: 999px",
    "transition: background 0.35s ease, box-shadow 0.35s ease",
    "flex-shrink: 0",
    "overflow: hidden",
  ].join(";");

  var thumb = document.createElement("span");
  thumb.style.cssText = [
    "position: absolute",
    "top: 2px",
    "left: 2px",
    "width: 14px",
    "height: 14px",
    "border-radius: 999px",
    "background: #ffffff",
    "box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45)",
    "will-change: transform, width",
  ].join(";");

  track.appendChild(thumb);
  wrapper.appendChild(pulseRing);
  wrapper.appendChild(label);
  wrapper.appendChild(track);
  document.body.appendChild(wrapper);

  function alignBottomWithCsFab() {
    var fab = document.querySelector(".cs-fab");
    if (!fab) {
      wrapper.style.bottom = "20px";
      return;
    }
    var rect = fab.getBoundingClientRect();
    if (rect.height > 0) {
      var bottomOffset = Math.max(
        12,
        Math.round(window.innerHeight - rect.bottom),
      );
      wrapper.style.bottom = bottomOffset + "px";
    }
  }

  alignBottomWithCsFab();
  window.addEventListener("resize", alignBottomWithCsFab, { passive: true });

  function playLiquidMorph(turningOn) {
    pulseRing.style.borderColor = "rgba(255, 255, 255, 0.45)";
    pulseRing.animate(
      [
        { transform: "scale(0.96)", opacity: 0.9 },
        { transform: "scale(1.55)", opacity: 0 },
      ],
      { duration: 480, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );

    if (turningOn) {
      thumb.animate(
        [
          { transform: "translateX(0px) scaleX(1) scaleY(1)", offset: 0 },
          {
            transform: "translateX(4px) scaleX(1.65) scaleY(0.78)",
            offset: 0.35,
          },
          {
            transform: "translateX(17px) scaleX(0.88) scaleY(1.08)",
            offset: 0.72,
          },
          { transform: "translateX(16px) scaleX(1) scaleY(1)", offset: 1 },
        ],
        {
          duration: 380,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          fill: "forwards",
        },
      );
    } else {
      thumb.animate(
        [
          { transform: "translateX(16px) scaleX(1) scaleY(1)", offset: 0 },
          {
            transform: "translateX(12px) scaleX(1.65) scaleY(0.78)",
            offset: 0.35,
          },
          {
            transform: "translateX(-1px) scaleX(0.88) scaleY(1.08)",
            offset: 0.72,
          },
          { transform: "translateX(0px) scaleX(1) scaleY(1)", offset: 1 },
        ],
        {
          duration: 380,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          fill: "forwards",
        },
      );
    }
  }

  function updateToggleUI(animate) {
    wrapper.setAttribute("aria-checked", String(isEnabled));
    if (animate) playLiquidMorph(isEnabled);

    if (isEnabled) {
      track.style.background = "rgba(255, 255, 255, 0.38)";
      track.style.boxShadow = "none";
      wrapper.style.borderColor = "rgba(255, 255, 255, 0.45)";
      wrapper.style.animation = "none";
      wrapper.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.35)";
      label.style.color = "#ffffff";
      label.style.textShadow = "none";
      if (!animate) thumb.style.transform = "translateX(16px)";
    } else {
      track.style.background = "rgba(255, 255, 255, 0.18)";
      track.style.boxShadow = "none";
      wrapper.style.borderColor = "rgba(255, 255, 255, 0.2)";
      wrapper.style.animation = "none";
      wrapper.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.35)";
      label.style.color = "rgba(255, 255, 255, 0.55)";
      label.style.textShadow = "none";
      if (!animate) thumb.style.transform = "translateX(0px)";
      nodes.forEach(function (n) {
        if (n._anim) n._anim.cancel();
        n.style.opacity = "0";
      });
    }
  }

  wrapper.addEventListener("mousemove", function (e) {
    var r = wrapper.getBoundingClientRect();
    var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
    var dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
    wrapper.style.transform =
      "translate(" + dx + "px, " + dy + "px) scale(1.04)";
  });
  wrapper.addEventListener("mouseleave", function () {
    wrapper.style.transform = "translate(0px, 0px) scale(1)";
  });

  function toggleState() {
    isEnabled = !isEnabled;
    localStorage.setItem("abandon_cursor_trail", isEnabled);
    last = null;
    updateToggleUI(true);
  }

  wrapper.addEventListener("click", toggleState);
  wrapper.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleState();
    }
  });

  updateToggleUI(false);
  // =========================================================================

  function spawn(x, y, dx, dy) {
    var n = nodes[(idx = (idx + 1) % POOL)];
    if (n._anim) n._anim.cancel();
    n.textContent = CHARS[(ci = (ci + 1) % CHARS.length)];

    var dist = Math.hypot(dx, dy);
    var dirX = dist > 0.5 ? dx / dist : 0.85;
    var dirY = dist > 0.5 ? dy / dist : -0.52;

    var streakX = dirX * TRAIL_LEN;
    var streakY = dirY * TRAIL_LEN;
    var base = "translate(" + x + "px," + y + "px) translate(-50%,-50%)";

    n._anim = n.animate(
      [
        {
          transform: base + " translate(0px, 0px) scale(0.85)",
          opacity: 0,
          filter: "blur(0px)",
          offset: 0,
        },
        {
          transform: base + " translate(0px, 0px) scale(1)",
          opacity: 1,
          filter: "blur(0px)",
          offset: 0.18,
          easing: "ease-out",
        },
        {
          transform:
            base +
            " translate(" +
            streakX * 0.45 +
            "px, " +
            streakY * 0.45 +
            "px) scale(0.75)",
          opacity: 0.65,
          filter: "blur(1.2px)",
          offset: 0.55,
          easing: "ease-in",
        },
        {
          transform:
            base +
            " translate(" +
            streakX +
            "px, " +
            streakY +
            "px) scale(0.35)",
          opacity: 0,
          filter: "blur(3px)",
          offset: 1,
        },
      ],
      { duration: DURATION, fill: "forwards" },
    );
  }

  var INTERACTIVE =
    'a,button,input,select,textarea,label,summary,details,[role="button"],[role="switch"],[data-href],[data-like],[data-cart],[data-goto],[aria-pressed],.carousel,.media,.slide,.card,.program,.qa__item,.app-card,.price-card,.shop-card,.step-card,.choice,.coupon,.pill,.pill-btn,.btn,.icon-btn,.upload-box,.site-nav,.site-cart,.more-link,.help-pop,.feature__link';
  function onInteractive(t) {
    if (!t || !t.closest) return false;
    if (t.closest(INTERACTIVE)) return true;
    return getComputedStyle(t).cursor === "pointer";
  }

  var NO_TRAIL_PAD = 70;
  function inNoTrail(x, y) {
    var zones = document.querySelectorAll("[data-no-trail]");
    for (var i = 0; i < zones.length; i++) {
      var r = zones[i].getBoundingClientRect();
      if (
        x > r.left - NO_TRAIL_PAD &&
        x < r.right + NO_TRAIL_PAD &&
        y > r.top - NO_TRAIL_PAD &&
        y < r.bottom + NO_TRAIL_PAD
      )
        return true;
    }
    return false;
  }

  window.addEventListener(
    "mousemove",
    function (e) {
      if (!isEnabled) return;
      if (inNoTrail(e.clientX, e.clientY)) {
        last = null;
        return;
      }
      if (onInteractive(e.target)) {
        last = { x: e.clientX, y: e.clientY };
        return;
      }
      if (!last) {
        last = { x: e.clientX, y: e.clientY };
        return;
      }
      var dx = e.clientX - last.x,
        dy = e.clientY - last.y;
      if (Math.hypot(dx, dy) < SPACING) return;
      spawn(e.clientX, e.clientY, dx, dy);
      last = { x: e.clientX, y: e.clientY };
    },
    { passive: true },
  );
  document.addEventListener("mouseleave", function () {
    last = null;
  });
})();
