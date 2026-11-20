(function () {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  const origAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (
      type === "mousemove" &&
      (this === window || this === document || this === document.body)
    ) {
      return;
    }
    return origAddEventListener.call(this, type, listener, options);
  };

  const CONFIG = {
    duration: 950,
    cooldown: 350,
    navOffset: 44,
    cardsRevealDelay: 250,
    cardsStagger: 0.16,
    cardsDuration: 0.85,
    sectionRevealDelay: 180,
    sectionStagger: 0.12,
    sectionDuration: 0.75,
    exitDuration: 0.45,
    exitStagger: 0.08,
    exitDistance: 28,
  };

  function initFullpageSnap() {
    window.scrollTo(0, 0);

    const allSections = Array.from(
      document.querySelectorAll("main.page > section"),
    );
    const coverTrack = document.getElementById("coverTrack");
    const coverStage = document.querySelector(".cover-stage");
    const coverTitle = document.querySelector(".cover-title");
    if (allSections.length < 2) return;

    const manifestoSec = allSections[0];
    const valuesSec = allSections[1];
    const middleSections = allSections.slice(2, -1);
    const qaSec = allSections[allSections.length - 1];

    let valueCards = Array.from(
      valuesSec.querySelectorAll(".card--value, .value-card, article"),
    );
    if (valueCards.length !== 3) {
      const containers = [valuesSec, ...valuesSec.querySelectorAll("div")];
      const threeCardWrapper = containers.find(
        (el) => el.children.length === 3,
      );
      if (threeCardWrapper) {
        valueCards = Array.from(threeCardWrapper.children);
      }
    }
    valueCards.forEach((card) => {
      card.classList.add("js-value-card");
      card.setAttribute("data-spotlight", "");
    });
    document
      .querySelectorAll("main.page .card, main.page .flip-card")
      .forEach((card) => {
        card.setAttribute("data-spotlight", "");
      });

    const style = document.createElement("style");
    style.textContent = `
      body.has-cover main.page {
        margin-top: 0 !important;
      }

      main.page > section:nth-of-type(1) {
        min-height: 52vh;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        text-align: center;
        box-sizing: border-box;
        padding-top: calc(88px + ${CONFIG.navOffset}px);
        padding-bottom: 36px;
      }

      main.page > section:nth-of-type(2) {
        min-height: 48vh;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        box-sizing: border-box;
        padding-top: 0;
        padding-bottom: 60px;
      }

      .js-value-card {
        opacity: 0 !important;
        transform: translateY(36px) scale(0.97) !important;
        transition: opacity ${CONFIG.cardsDuration}s cubic-bezier(0.22, 1, 0.36, 1),
                    transform ${CONFIG.cardsDuration}s cubic-bezier(0.22, 1, 0.36, 1) !important;
      }
      .js-value-card.is-card-shown {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }
      .js-value-card.is-card-exit-up {
        opacity: 0 !important;
        transform: translateY(-${CONFIG.exitDistance}px) scale(0.98) !important;
        transition: opacity ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1),
                    transform ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1) !important;
      }
      .js-value-card.is-card-exit-down {
        opacity: 0 !important;
        transform: translateY(${CONFIG.exitDistance}px) scale(0.98) !important;
        transition: opacity ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1),
                    transform ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1) !important;
      }

      .js-reveal-item {
        opacity: 0;
        translate: 0 32px;
        transition: opacity ${CONFIG.sectionDuration}s cubic-bezier(0.22, 1, 0.36, 1),
                    translate ${CONFIG.sectionDuration}s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .js-reveal-item.is-revealed {
        opacity: 1;
        translate: 0 0;
      }
      .js-reveal-item.is-exit-up {
        opacity: 0;
        translate: 0 -${CONFIG.exitDistance}px;
        transition: opacity ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1),
                    translate ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1);
      }
      .js-reveal-item.is-exit-down {
        opacity: 0;
        translate: 0 ${CONFIG.exitDistance}px;
        transition: opacity ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1),
                    translate ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1);
      }

      main.page > section:nth-of-type(n+3):not(:last-of-type) {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-sizing: border-box;
        padding-top: calc(88px + ${CONFIG.navOffset}px);
        padding-bottom: 60px;
      }

      main.page > section:last-of-type {
        padding-top: calc(88px + ${CONFIG.navOffset}px);
        padding-bottom: 120px;
      }
      #qa-title {
        margin-top: 0 !important;
        padding-top: 0 !important;
        line-height: 1.15 !important;
        transform: translateY(-6px);
      }
      #qa-title,
      #qa-title * {
        overflow: visible !important;
      }
      main.page > section:last-of-type h1,
      main.page > section:last-of-type h2,
      main.page > section:last-of-type .section-title,
      main.page > section:last-of-type [class*="title"] {
        line-height: 1.38 !important;
        padding-top: 0.1em !important;
        padding-bottom: 0.25em !important;
        margin-bottom: 0.4em !important;
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
      }
      main.page > section:last-of-type > div:first-child,
      main.page > section:last-of-type header {
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
      }
    `;
    document.head.appendChild(style);

    if (coverStage) {
      const secretLayer = document.createElement("div");
      secretLayer.className = "cover-secret-text";
      secretLayer.innerHTML = `
        <span style="left: 14%; top: 24%;">找到謝雨芯</span>
        <span style="left: 68%; top: 22%;">找到洪郁雅</span>
        <span style="left: 18%; top: 74%;">找到許岑優</span>
        <span style="left: 62%; top: 80%;">找到游叡臻</span>
        <span style="left: 42%; top: 34%;">找到昱萱老師</span>
      `;
      coverStage.prepend(secretLayer);

      coverStage.addEventListener(
        "mousemove",
        (e) => {
          const rect = coverStage.getBoundingClientRect();
          coverStage.style.setProperty("--mx", `${e.clientX - rect.left}px`);
          coverStage.style.setProperty("--my", `${e.clientY - rect.top}px`);
          coverStage.style.setProperty("--grid-opacity", "1");
        },
        { passive: true },
      );

      coverStage.addEventListener("mouseleave", () => {
        coverStage.style.setProperty("--grid-opacity", "0");
      });
    }

    let revealTimer = null;

    function triggerValueCards() {
      clearTimeout(revealTimer);
      valueCards.forEach((card) => {
        card.classList.remove("is-card-exit-up", "is-card-exit-down");
      });
      revealTimer = setTimeout(() => {
        valueCards.forEach((card, index) => {
          card.style.transitionDuration = `${CONFIG.cardsDuration}s`;
          card.style.transitionDelay = `${index * CONFIG.cardsStagger}s`;
          card.classList.add("is-card-shown");
        });
      }, CONFIG.cardsRevealDelay);
    }

    function exitValueCards(direction) {
      clearTimeout(revealTimer);
      const exitClass =
        direction === 1 ? "is-card-exit-up" : "is-card-exit-down";
      valueCards.forEach((card, index) => {
        card.classList.remove(
          "is-card-shown",
          "is-card-exit-up",
          "is-card-exit-down",
        );
        card.style.transitionDelay = `${index * CONFIG.exitStagger}s`;
        card.classList.add(exitClass);
      });
    }

    const firstSlideObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            triggerValueCards();
          }
        });
      },
      { threshold: 0.2 },
    );
    firstSlideObserver.observe(manifestoSec);

    const lowerSections = [...middleSections, qaSec];
    const sectionItemsMap = new Map();
    const sectionTimersMap = new Map();

    lowerSections.forEach((sec) => {
      const items = [];
      const walkChildren = (parent) => {
        Array.from(parent.children).forEach((child) => {
          const isWrapperContainer =
            ["DIV", "UL", "OL"].includes(child.tagName) &&
            child.children.length >= 2 &&
            !child.classList.contains("card") &&
            !child.classList.contains("flip-card") &&
            !child.classList.contains("qa-item") &&
            !child.classList.contains("faq-item");

          if (isWrapperContainer) {
            walkChildren(child);
          } else {
            child.classList.add("js-reveal-item");
            items.push(child);
          }
        });
      };

      walkChildren(sec);
      sectionItemsMap.set(sec, items);
    });

    function triggerSectionEnter(sec) {
      const items = sectionItemsMap.get(sec) || [];
      clearTimeout(sectionTimersMap.get(sec));

      items.forEach((item) => {
        item.classList.remove("is-exit-up", "is-exit-down");
      });

      const timer = setTimeout(() => {
        items.forEach((item, idx) => {
          item.style.transitionDuration = `${CONFIG.sectionDuration}s`;
          item.style.transitionDelay = `${idx * CONFIG.sectionStagger}s`;
          item.classList.add("is-revealed");
        });
      }, CONFIG.sectionRevealDelay);
      sectionTimersMap.set(sec, timer);
    }

    function triggerSectionExit(sec, direction) {
      const items = sectionItemsMap.get(sec) || [];
      clearTimeout(sectionTimersMap.get(sec));
      const exitClass = direction === 1 ? "is-exit-up" : "is-exit-down";

      items.forEach((item, idx) => {
        item.classList.remove("is-revealed", "is-exit-up", "is-exit-down");
        item.style.transitionDelay = `${idx * CONFIG.exitStagger}s`;
        item.classList.add(exitClass);
      });
    }

    const lowerSectionsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            triggerSectionEnter(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    lowerSections.forEach((sec) => lowerSectionsObserver.observe(sec));

    let isAnimating = false;
    let lockUntil = 0;

    function easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    function smoothScrollTo(rawTargetY, extraLock = 0) {
      isAnimating = true;
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const targetY = Math.min(Math.max(0, rawTargetY), maxScroll);
      const startY = window.scrollY;
      const diff = targetY - startY;
      let startTime = null;

      function step(currentTime) {
        if (!startTime) startTime = currentTime;
        const progress = Math.min(
          (currentTime - startTime) / CONFIG.duration,
          1,
        );
        window.scrollTo(0, startY + diff * easeInOutQuart(progress));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          lockUntil = Date.now() + CONFIG.cooldown + extraLock;
          setTimeout(() => {
            isAnimating = false;
          }, CONFIG.cooldown + extraLock);
        }
      }
      requestAnimationFrame(step);
    }

    if (coverTrack) {
      document.body.classList.add("has-cover");
    } else {
      triggerValueCards();
    }

    const slides = [manifestoSec, ...middleSections, qaSec];
    let hasStoppedAtTitle = false;

    if (coverTitle) {
      const titleObserver = new MutationObserver(() => {
        if (coverTitle.classList.contains("show")) {
          hasStoppedAtTitle = true;
          lockUntil = Date.now() + 650;
        }
      });
      titleObserver.observe(coverTitle, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    window.addEventListener(
      "wheel",
      (e) => {
        if (window.innerWidth <= 768) return;

        if (isAnimating || Date.now() < lockUntil) {
          e.preventDefault();
          return;
        }

        const direction = e.deltaY > 0 ? 1 : -1;

        if (coverTrack) {
          const trackRect = coverTrack.getBoundingClientRect();
          const titleStopY = Math.max(
            0,
            coverTrack.offsetTop + coverTrack.offsetHeight - window.innerHeight,
          );

          if (direction === 1 && trackRect.bottom > 10) {
            const isTitleShown = coverTitle
              ? coverTitle.classList.contains("show")
              : false;

            if (!hasStoppedAtTitle && !isTitleShown) {
              e.preventDefault();
              hasStoppedAtTitle = true;
              smoothScrollTo(titleStopY, 650);
              return;
            }

            e.preventDefault();
            triggerValueCards();
            smoothScrollTo(manifestoSec.offsetTop, 400);
            return;
          }

          if (
            direction === -1 &&
            window.scrollY > titleStopY + 20 &&
            window.scrollY <= manifestoSec.offsetTop + 80
          ) {
            e.preventDefault();
            exitValueCards(-1);
            smoothScrollTo(titleStopY);
            return;
          }
          if (
            direction === -1 &&
            window.scrollY <= titleStopY + 20 &&
            window.scrollY > 10
          ) {
            e.preventDefault();
            hasStoppedAtTitle = false;
            smoothScrollTo(0);
            return;
          }
        }

        const viewportCenter = window.scrollY + window.innerHeight * 0.5;
        let currentIndex = 0;
        let minDistance = Infinity;

        slides.forEach((sec, idx) => {
          const top = sec.offsetTop;
          const bottom =
            sec === manifestoSec
              ? valuesSec.offsetTop + valuesSec.offsetHeight
              : top + sec.offsetHeight;
          const center = (top + bottom) / 2;
          const dist = Math.abs(viewportCenter - center);

          if (dist < minDistance) {
            minDistance = dist;
            currentIndex = idx;
          }
        });

        if (direction === 1) {
          if (currentIndex < slides.length - 1) {
            e.preventDefault();
            const currentSec = slides[currentIndex];
            const nextSec = slides[currentIndex + 1];

            if (currentSec === manifestoSec) {
              exitValueCards(1);
            } else {
              triggerSectionExit(currentSec, 1);
            }
            triggerSectionEnter(nextSec);

            smoothScrollTo(nextSec.offsetTop);
          }
        } else if (direction === -1) {
          if (currentIndex > 0) {
            e.preventDefault();
            const currentSec = slides[currentIndex];
            const prevSec = slides[currentIndex - 1];

            triggerSectionExit(currentSec, -1);
            if (prevSec === manifestoSec) {
              triggerValueCards();
            } else {
              triggerSectionEnter(prevSec);
            }

            smoothScrollTo(prevSec.offsetTop);
          }
        }
      },
      { passive: false },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFullpageSnap);
  } else {
    initFullpageSnap();
  }
})();
