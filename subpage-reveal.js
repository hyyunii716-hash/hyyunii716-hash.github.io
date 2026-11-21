(function () {
  if (document.getElementById("coverTrack")) return;

  const t0 = performance.now();
  function log(msg, extra) {
    console.log(
      `[SR-TRACE +${Math.round(performance.now() - t0)}ms] ${msg}`,
      extra ?? "",
    );
  }

  log("head script executed", {
    readyState: document.readyState,
    hasHead: !!document.head,
    hasBody: !!document.body,
  });

  const style = document.createElement("style");
  style.id = "sr-style";
  style.textContent = `
    [data-sr-item] {
      opacity: 0 !important;
      translate: 0 28px;
      transition: none !important;
      will-change: opacity, translate;
    }

    [data-sr-item].is-sr-in {
      opacity: 1 !important;
      translate: 0 0;
      transition:
        opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1),
        translate 0.85s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }

    .pill-nav[data-sr-item],
    .app-filter[data-sr-item],
    .carousel[data-sr-item],
    .slide[data-sr-item] {
      opacity: 0 !important;
      translate: 0 22px;
      transition: none !important;
      will-change: opacity, translate;
    }

    .pill-nav[data-sr-item].is-sr-in,
    .app-filter[data-sr-item].is-sr-in,
    .carousel[data-sr-item].is-sr-in,
    .slide[data-sr-item].is-sr-in {
      opacity: 1 !important;
      translate: 0 0;
      transition:
        opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
        translate 0.8s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }

    .btn[data-sr-item],
    .donate_btn[data-sr-item] {
      opacity: 0 !important;
      translate: none;
      transition: none !important;
      will-change: opacity;
    }

    .btn[data-sr-item].is-sr-in,
    .donate_btn[data-sr-item].is-sr-in {
      opacity: 1 !important;
      translate: none;
      transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  function initSubpageReveal() {
    if (document.getElementById("coverTrack")) {
      log("aborted: #coverTrack found");
      return;
    }

    const SELECTOR = [
      ".page-head",
      ".apps-features-head",
      "h1",
      "h2",
      "h3",
      ".section-title",
      ".sub-title",
      ".pill-nav",
      ".app-filter",
      ".carousel",
      ".slide",
      ".tools-control",
      ".card",
      ".app-card",
      ".tool-card",
      ".program",
      ".feature",
      ".pricing-card",
      ".qa__item",
      ".donate__list > li",
      ".donate_btn",
      ".disclaimer",
    ].join(", ");

    const items = Array.from(document.querySelectorAll(SELECTOR)).filter(
      (el) => {
        if (
          el.closest("header, .site-header, .site-nav, footer, .site-footer")
        ) {
          return false;
        }
        const insideParent = el.parentElement?.closest(
          ".page-head, .apps-features-head, .feature, .card, .app-card, .tool-card, .program, .pricing-card, .qa__item, .carousel",
        );
        return !insideParent;
      },
    );

    log("initSubpageReveal items found:", items.length);

    items.forEach((el) => {
      el.setAttribute("data-sr-item", "");
    });

    if (items[0]) {
      const cs0 = getComputedStyle(items[0]);
      log("first item right after setting data-sr-item:", {
        tag: items[0].tagName,
        cls: items[0].className,
        opacity: cs0.opacity,
        translate: cs0.translate,
        transition: cs0.transition,
      });
    }

    function checkViewport(source) {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const readyNow = items
        .filter((el) => {
          if (el.dataset.srRevealed === "1") return false;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return false;
          return rect.top < vh * 0.92 && rect.bottom > 0;
        })
        .sort(
          (a, b) =>
            a.getBoundingClientRect().top - b.getBoundingClientRect().top,
        );

      if (readyNow.length) {
        log(`checkViewport (${source}) triggering count:`, readyNow.length);
      }

      readyNow.forEach((el, idx) => {
        el.dataset.srRevealed = "1";
        const delay = idx * 130;
        setTimeout(() => {
          requestAnimationFrame(() => {
            el.classList.add("is-sr-in");
            if (idx === 0) {
              log("first item added .is-sr-in", {
                opacityNow: getComputedStyle(el).opacity,
                translateNow: getComputedStyle(el).translate,
              });
            }
          });
        }, delay);
      });
    }

    setTimeout(() => checkViewport("init-200ms"), 200);
    window.addEventListener("pageshow", (e) => {
      log("pageshow event", { persisted: e.persisted });
      setTimeout(() => checkViewport("pageshow-200ms"), 200);
    });
    window.addEventListener("scroll", () => checkViewport("scroll"), {
      passive: true,
    });
    window.addEventListener("resize", () => checkViewport("resize"), {
      passive: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      log("DOMContentLoaded fired");
      initSubpageReveal();
    });
  } else {
    log("already interactive/complete");
    initSubpageReveal();
  }
})();
