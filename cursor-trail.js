/* 游標軌跡文字＋右下角液態變形能量滑動開關（純 JS，不需要網路，自動記憶開關狀態） */
(function () {
  if (window.__cursorTrail) return;
  window.__cursorTrail = true;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce || !Element.prototype.animate) return;

  // ================= 🎛️ 視覺手感設定區（改這裡的數字就好） =================
  var SPACING = 45; // 【1. 字距】：滑鼠每移動多少 px 掉出一個字
  var DURATION = 1600; // 【2. 掉落速度】：動畫總毫秒數（數字越大掉越慢）
  var MAX_ROTATE = 45; // 【3. 旋轉角度】：最大歪斜度數
  var POOL = 28; // 同時存在畫面上的最大字數
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
    n.style.cssText =
      'position:absolute;left:0;top:0;opacity:0;white-space:nowrap;font:300 28px/1 "Noto Sans TC","Inter",sans-serif;color:#fff;will-change:transform,opacity,filter';
    layer.appendChild(n);
    nodes.push(n);
  }

  // 注入關鍵影格與微光樣式
  var styleEl = document.createElement("style");
  styleEl.textContent = [
    "@keyframes abandonPulseRing { 0% { transform: scale(0.95); opacity: 0.75; } 100% { transform: scale(1.65); opacity: 0; } }",
    "@keyframes abandonNeonFlow { 0%, 100% { box-shadow: 0 0 12px rgba(124,77,255,0.45), inset 0 0 8px rgba(124,77,255,0.25); } 50% { box-shadow: 0 0 20px rgba(167,139,250,0.75), inset 0 0 12px rgba(167,139,250,0.45); } }",
  ].join("\n");
  document.head.appendChild(styleEl);

  // ================= 🔘 右下角「液態變形＋能量波紋」滑動開關 =================
  var wrapper = document.createElement("div");
  wrapper.setAttribute("role", "switch");
  wrapper.setAttribute("tabindex", "0");
  wrapper.setAttribute("aria-label", "切換游標掉落文字效果");
  wrapper.style.cssText = [
    "position: fixed",
    "right: 20px",
    "bottom: 20px",
    "z-index: 10000",
    "display: inline-flex",
    "align-items: center",
    "gap: 8px",
    "padding: 6px 10px 6px 13px",
    "border-radius: 999px",
    "border: 1px solid rgba(255, 255, 255, 0.18)",
    "background: rgba(14, 14, 18, 0.82)",
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

  // 衝擊波光環層
  var pulseRing = document.createElement("span");
  pulseRing.style.cssText = [
    "position: absolute",
    "inset: -1px",
    "border-radius: 999px",
    "border: 1.5px solid #a78bfa",
    "pointer-events: none",
    "opacity: 0",
  ].join(";");

  var label = document.createElement("span");
  label.textContent = "掉落";
  label.style.transition = "color 0.3s ease, text-shadow 0.3s ease";

  // 滑動軌道
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

  // 液態水滴圓鈕
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

  // 觸發液態水滴拉伸＋衝擊波動畫
  function playLiquidMorph(turningOn) {
    // 1. 衝擊波擴散
    pulseRing.style.borderColor = turningOn
      ? "#a78bfa"
      : "rgba(255,255,255,0.45)";
    pulseRing.animate(
      [
        { transform: "scale(0.96)", opacity: 0.85 },
        { transform: "scale(1.55)", opacity: 0 },
      ],
      { duration: 480, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );

    // 2. 水滴撥桿橫向拉伸再回彈
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
      track.style.background =
        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #c084fc 100%)";
      track.style.boxShadow = "0 0 10px rgba(139, 92, 246, 0.65)";
      wrapper.style.borderColor = "rgba(167, 139, 250, 0.55)";
      wrapper.style.animation = "abandonNeonFlow 3s ease-in-out infinite";
      label.style.color = "#ffffff";
      label.style.textShadow = "0 0 8px rgba(167, 139, 250, 0.7)";
      if (!animate) thumb.style.transform = "translateX(16px)";
    } else {
      track.style.background = "rgba(255, 255, 255, 0.18)";
      track.style.boxShadow = "none";
      wrapper.style.borderColor = "rgba(255, 255, 255, 0.14)";
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

  // 微磁吸懸浮手感
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

    var spin =
      (Math.random() > 0.5 ? 1 : -1) *
      (MAX_ROTATE * 0.4 + Math.random() * MAX_ROTATE * 0.6);
    var dropY = window.innerHeight - y + 120;
    var scale = 0.8 + Math.random() * 0.6;
    var base = "translate(" + x + "px," + y + "px) translate(-50%,-50%)";

    n._anim = n.animate(
      [
        { transform: base + " scale(0) rotate(0deg)", opacity: 0, offset: 0 },
        {
          transform:
            base +
            " scale(" +
            scale * 1.25 +
            ") rotate(" +
            spin * 0.15 +
            "deg)",
          opacity: 1,
          offset: 0.15,
          easing: "ease-out",
        },
        {
          transform:
            base +
            " scale(" +
            scale * 0.92 +
            ") rotate(" +
            spin * 0.25 +
            "deg)",
          opacity: 1,
          offset: 0.25,
          easing: "ease-in-out",
        },
        {
          transform:
            base + " scale(" + scale + ") rotate(" + spin * 0.35 + "deg)",
          opacity: 1,
          offset: 0.35,
          easing: "cubic-bezier(0.6, -0.28, 0.735, 0.045)",
        },
        {
          transform:
            base +
            " translateY(" +
            dropY +
            "px) scale(" +
            scale * 0.8 +
            ") rotate(" +
            spin +
            "deg)",
          opacity: 0.9,
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

  // 標記 data-no-trail 的區塊（含外圍 NO_TRAIL_PAD px）不掉落文字，例如點陣字標標題
  var NO_TRAIL_PAD = 70;
  function inNoTrail(x, y) {
    var zones = document.querySelectorAll("[data-no-trail]");
    for (var i = 0; i < zones.length; i++) {
      var r = zones[i].getBoundingClientRect();
      if (x > r.left - NO_TRAIL_PAD && x < r.right + NO_TRAIL_PAD && y > r.top - NO_TRAIL_PAD && y < r.bottom + NO_TRAIL_PAD) return true;
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
