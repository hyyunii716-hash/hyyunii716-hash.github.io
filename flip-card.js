(function () {
  // ★ 快速調整區 ★
  const CONFIG = {
    // 依照卡片順序（第 1 張到第 4 張）填寫各自的 A 面文字：
    frontTexts: [
      "哈哈", // 第 1 張卡片（對應 Photoshop）
      "按不到吧", // 第 2 張卡片（對應 Abandon illustrator）
      "要去那個", // 第 3 張卡片（對應 Lightroom）
      "網站程式喔", // 第 4 張卡片（對應 InDesign）
    ],
    fallbackText: "我超想放棄", // 如果未來新增第 5 張以上的備用預設文字
    triggerRatio: 0.35, // 卡片露出多少比例時翻面（0.1 ~ 0.8）
    staggerDelay: 0.1, // 四張卡片接力翻開的時間差（秒）
  };

  function initProgramFlip() {
    const cards = document.querySelectorAll(".programs__grid .program");
    if (!cards.length) return;

    // 1. 自動包裝原本的 HTML 成為 B 面，並依照順序填入各自的 A 面文字
    cards.forEach((card, index) => {
      if (card.querySelector(".flip-inner")) return;

      const text = CONFIG.frontTexts[index] || CONFIG.fallbackText;
      const originalHTML = card.innerHTML;

      card.innerHTML = `
        <div class="flip-inner" style="transition-delay: ${index * CONFIG.staggerDelay}s">
          <div class="flip-front">${text}</div>
          <div class="flip-back">${originalHTML}</div>
        </div>
      `;
    });

    // 2. 雙向滾動偵測：進入視窗翻到 B 面、離開視窗自動翻回 A 面
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target;
          const inner = card.querySelector(".flip-inner");
          const index = Array.from(cards).indexOf(card);

          if (inner) {
            inner.style.transitionDelay = `${index * CONFIG.staggerDelay}s`;
          }

          if (entry.isIntersecting) {
            card.classList.add("is-flipped");
          } else {
            card.classList.remove("is-flipped");
          }
        });
      },
      {
        threshold: CONFIG.triggerRatio,
      },
    );

    cards.forEach((card) => {
      observer.observe(card);

      // 3. 滑鼠 Hover 翻面（移入切換翻轉、移出翻回原狀態）
      card.addEventListener("mouseenter", () => {
        const inner = card.querySelector(".flip-inner");
        if (inner) inner.style.transitionDelay = "0s";
        card.classList.toggle("is-flipped");
      });

      card.addEventListener("mouseleave", () => {
        const inner = card.querySelector(".flip-inner");
        if (inner) inner.style.transitionDelay = "0s";
        card.classList.toggle("is-flipped");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProgramFlip);
  } else {
    initProgramFlip();
  }
})();
