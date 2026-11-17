(function () {
  function initSpotlight() {
    // 加上你專案實際使用的 .app-card
    const autoSelectors = [
      ".app-card",
      ".media",
      "[data-spotlight]",
      ".feature-card",
      ".pricing-card",
      ".card",
      ".bento-item",
      ".tool-card",
    ];

    const candidates = Array.from(
      document.querySelectorAll(autoSelectors.join(",")),
    );
    // 放寬尺寸限制，只要有抓到 .app-card 就直接納入，避免寬版卡片被過濾掉
    const cards = candidates.filter((el) => {
      if (
        el.classList.contains("app-card") ||
        el.hasAttribute("data-spotlight")
      ) {
        return true;
      }
      const rect = el.getBoundingClientRect();
      return rect.width >= 140 && rect.width <= 1200 && rect.height >= 80;
    });

    if (!cards.length) return;

    cards.forEach((card) => {
      card.setAttribute("data-spotlight", "");
    });

    let rafId = null;
    let mouseX = -9999;
    let mouseY = -9999;

    function updateCards() {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = mouseX - rect.left;
        const y = mouseY - rect.top;

        const proximity = 180;
        const isNear =
          mouseX >= rect.left - proximity &&
          mouseX <= rect.right + proximity &&
          mouseY >= rect.top - proximity &&
          mouseY <= rect.bottom + proximity;

        if (isNear) {
          card.style.setProperty("--spot-x", `${x}px`);
          card.style.setProperty("--spot-y", `${y}px`);
          card.style.setProperty("--spot-opacity", "1");
        } else {
          card.style.setProperty("--spot-opacity", "0");
        }
      });
      rafId = null;
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!rafId) {
          rafId = requestAnimationFrame(updateCards);
        }
      },
      { passive: true },
    );

    document.addEventListener("pointerleave", () => {
      cards.forEach((card) => card.style.setProperty("--spot-opacity", "0"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSpotlight);
  } else {
    initSpotlight();
  }
})();
