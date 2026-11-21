(() => {
  const WORDS = [
    "我不想做了",
    "你們要被AI取代了",
    "出社會領底薪",
    "沒存到檔",
    "期末開始了喔",
    "檔案已毀損",
    "我叫AI做一做就好了啊",
    "評圖七取三喔",
    "這邊沒對齊",
    "沒有靈感",
    "Illustrator 已停止回應",
    "很～棒～",
    "這是CMYK檔嗎",
    "設計選擇我設計是我的使命",
  ];

  const CONFIG = {
    spawnInterval: 2200,
    maxWords: 5,
    minSpeedY: 0.55,
    maxSpeedY: 1.15,
    scrollFollowFactor: 0.45,
  };

  function initFloatingWords() {
    const layer = document.createElement("div");
    layer.className = "floating-words-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    const footer = document.querySelector("footer.site-footer");
    const activeItems = new Set();
    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let pendingScrollDelta = 0;

    window.addEventListener(
      "scroll",
      () => {
        const currentY = window.scrollY || window.pageYOffset || 0;
        // 往下捲（currentY 增加）時，pendingScrollDelta 為負值，讓字相對往上跑
        pendingScrollDelta +=
          -(currentY - lastScrollY) * CONFIG.scrollFollowFactor;
        lastScrollY = currentY;
      },
      { passive: true },
    );

    function getSpawnY() {
      if (footer) {
        const fRect = footer.getBoundingClientRect();
        // 如果 footer 頂部在視窗內或偏下方，就從 footer 頂緣略下方冒出
        if (fRect.top < window.innerHeight + 60) {
          return Math.min(window.innerHeight + 10, fRect.top + 24);
        }
      }
      return window.innerHeight + 16;
    }

    function spawnWord() {
      if (document.hidden || activeItems.size >= CONFIG.maxWords) return;

      const text = WORDS[Math.floor(Math.random() * WORDS.length)];
      const el = document.createElement("span");
      el.className = "floating-word";
      el.textContent = text;
      layer.appendChild(el);

      const rect = el.getBoundingClientRect();
      const margin = 48;
      const startX =
        margin +
        Math.random() *
          Math.max(20, window.innerWidth - rect.width - margin * 2);
      const startY = getSpawnY();

      const item = {
        el,
        x: startX,
        y: startY,
        vx: 0,
        vy: -(
          CONFIG.minSpeedY +
          Math.random() * (CONFIG.maxSpeedY - CONFIG.minSpeedY)
        ),
        swayAmp: 0.2 + Math.random() * 0.35,
        swayFreq: 0.0014 + Math.random() * 0.0018,
        phase: Math.random() * Math.PI * 2,
        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        lastMouseX: 0,
      };

      el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
      activeItems.add(item);

      el.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        item.isDragging = true;
        item.dragOffsetX = e.clientX - item.x;
        item.dragOffsetY = e.clientY - item.y;
        item.lastMouseX = e.clientX;
        item.vx = 0;
        el.classList.add("is-dragging");
        el.setPointerCapture(e.pointerId);
      });

      el.addEventListener("pointermove", (e) => {
        if (!item.isDragging) return;
        item.x = e.clientX - dragOffsetX;
        item.y = e.clientY - dragOffsetY;
        item.vx = (e.clientX - lastMouseX) * 0.22;
        item.lastMouseX = e.clientX;
        el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
      });

      const releaseDrag = (e) => {
        if (!item.isDragging) return;
        item.isDragging = false;
        el.classList.remove("is-dragging");
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      };

      el.addEventListener("pointerup", releaseDrag);
      el.addEventListener("pointercancel", releaseDrag);
    }

    function tick(now) {
      const scrollDelta = pendingScrollDelta;
      pendingScrollDelta = 0;

      activeItems.forEach((item) => {
        if (item.isDragging) return;

        item.x +=
          item.vx + Math.sin(now * item.swayFreq + item.phase) * item.swayAmp;
        item.y += item.vy + scrollDelta;
        item.vx *= 0.94;

        if (item.y < 140) {
          item.el.style.opacity = Math.max(0, item.y / 140).toFixed(2);
        } else {
          item.el.style.opacity = "1";
        }

        if (item.y < -80 || item.y > window.innerHeight + 240) {
          item.el.remove();
          activeItems.delete(item);
          return;
        }

        item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
      });

      requestAnimationFrame(tick);
    }

    setTimeout(spawnWord, 200);
    setTimeout(spawnWord, 1200);
    setInterval(spawnWord, CONFIG.spawnInterval);
    requestAnimationFrame(tick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFloatingWords);
  } else {
    initFloatingWords();
  }
})();
