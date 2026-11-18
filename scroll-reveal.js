(function () {
  function initScrollReveal() {
    const style = document.createElement("style");
    style.textContent = `
      [data-reveal] {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        will-change: opacity, transform;
      }
      [data-reveal].is-visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    const targets = document.querySelectorAll(
      ".app-card, .feature, .media, .pricing-card, [data-reveal]",
    );

    targets.forEach((el, index) => {
      el.setAttribute("data-reveal", "");
      el.style.transitionDelay = `${(index % 4) * 0.08}s`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 進入視窗：加上 class 浮現
            entry.target.classList.add("is-visible");
          } else {
            // 滾出視窗：移除 class 退回隱形下沉狀態，下次滑回來會再浮現一次
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -30px 0px",
      },
    );

    targets.forEach((el) => observer.observe(el));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollReveal);
  } else {
    initScrollReveal();
  }
})();
