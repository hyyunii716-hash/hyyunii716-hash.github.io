// subpage-snap.js - 通用分頁「全頁阻力吸附＋區塊來回進退場動畫」腳本
(function () {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  // =========================================================================
  // ★ 快速調整區（數值與首頁 fullpage-snap.js 完全一致）★
  // =========================================================================
  const CONFIG = {
    duration: 950, // 換頁滑動時間（毫秒）
    cooldown: 300, // 換頁完成後的防連跳冷卻時間（毫秒）
    navOffset: 44, // 區塊頂部導覽列補償高度（px）

    // --- Section 通用進退場調整 ---
    sectionRevealDelay: 180, // 滑進該區塊後，延遲幾毫秒開始浮出（毫秒）
    sectionStagger: 0.12, // 區塊內每個元素錯開進場的時間差（秒）
    sectionDuration: 0.75, // 單一元素進場浮現的動畫速度（秒）

    // --- 退場動畫調整區 ---
    exitDuration: 0.45, // 離開該區塊時的淡出退場速度（秒）
    exitStagger: 0.05, // 退場時元素錯開淡出的時間差（秒）
    exitDistance: 28, // 退場時向上或向下飄移的距離（px）
  };

  function initSubpageSnap() {
    window.scrollTo(0, 0);

    // 有 data-subpage-snap-start 時，只吸附起點及後續區塊。
    // 沒有起點時保留原本的全頁吸附行為。
    const snapStart = document.querySelector("[data-subpage-snap-start]");
    const sections = Array.from(document.querySelectorAll("main > section"));
    const slides = [];

    if (snapStart) {
      const startIndex = sections.indexOf(snapStart);
      sections.slice(startIndex >= 0 ? startIndex : 0).forEach((sec) => {
        if (sec.offsetHeight > 40) slides.push(sec);
      });
    } else {
      const pageHead = document.querySelector(
        "main.page > .page-head, main > .page-head",
      );
      if (pageHead && pageHead.offsetHeight > 60) {
        slides.push(pageHead);
      }
      sections.forEach((sec) => {
        if (sec.offsetHeight > 40) slides.push(sec);
      });
    }

    if (slides.length < 2) return;

    // 1. 注入通用進退場動畫樣式（與首頁完全相同的曲線與位移）
    const style = document.createElement("style");
    style.textContent = `
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
    `;
    document.head.appendChild(style);

    // 2. 自動幫每個區塊內的子元件加上進退場動畫追蹤
    const sectionItemsMap = new Map();
    const sectionTimersMap = new Map();

    slides.forEach((sec) => {
      const items = [];
      const walkChildren = (parent) => {
        Array.from(parent.children).forEach((child) => {
          const isWrapperContainer =
            ["DIV", "UL", "OL"].includes(child.tagName) &&
            child.children.length >= 2 &&
            !child.classList.contains("card") &&
            !child.classList.contains("app-card") &&
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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            triggerSectionEnter(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    slides.forEach((sec) => observer.observe(sec));

    // 一進頁面先觸發第一屏顯示
    triggerSectionEnter(slides[0]);

    // 3. 與首頁完全相同的平滑翻頁核心 (easeInOutQuart + 950ms + 300ms cooldown)
    let isAnimating = false;

    function easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    function getTargetScrollY(el, idx) {
      if (!snapStart && idx === 0) return 0; // 原本模式：第一屏永遠對齊最頂端
      return Math.max(0, el.offsetTop - CONFIG.navOffset);
    }

    function smoothScrollTo(rawTargetY) {
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
          setTimeout(() => {
            isAnimating = false;
          }, CONFIG.cooldown);
        }
      }
      requestAnimationFrame(step);
    }

    // 4. 滾輪吸附監聽（支援不同分頁的長短區塊自動適應）
    window.addEventListener(
      "wheel",
      (e) => {
        if (window.innerWidth <= 768) return;

        const snapStartTop = snapStart
          ? snapStart.offsetTop - CONFIG.navOffset
          : 0;
        const atSnapRegion =
          !snapStart || window.scrollY + 20 >= snapStartTop;
        if (!atSnapRegion) return;

        if (isAnimating) {
          e.preventDefault();
          return;
        }

        const direction = e.deltaY > 0 ? 1 : -1;
        const viewportCenter = window.scrollY + window.innerHeight * 0.5;
        let currentIndex = 0;
        let minDistance = Infinity;

        slides.forEach((sec, idx) => {
          const top = sec.offsetTop;
          const bottom = top + sec.offsetHeight;
          const center = (top + bottom) / 2;
          const dist = Math.abs(viewportCenter - center);

          if (dist < minDistance) {
            minDistance = dist;
            currentIndex = idx;
          }
        });

        const currentSec = slides[currentIndex];
        const rect = currentSec.getBoundingClientRect();

        // 若組員某個 section 內容超過一個視窗高（例如很多張卡片），允許先在該區內自然捲動到底/頂再換頁
        const isTallSection = currentSec.offsetHeight > window.innerHeight + 60;
        if (isTallSection) {
          if (direction === 1 && rect.bottom > window.innerHeight + 20) return;
          if (direction === -1 && rect.top < -20) return;
        }

        if (direction === 1 && currentIndex < slides.length - 1) {
          e.preventDefault();
          const nextSec = slides[currentIndex + 1];
          triggerSectionExit(currentSec, 1);
          triggerSectionEnter(nextSec);
          smoothScrollTo(getTargetScrollY(nextSec, currentIndex + 1));
        } else if (direction === -1 && currentIndex > 0) {
          e.preventDefault();
          const prevSec = slides[currentIndex - 1];
          triggerSectionExit(currentSec, -1);
          triggerSectionEnter(prevSec);
          smoothScrollTo(getTargetScrollY(prevSec, currentIndex - 1));
        }
      },
      { passive: false },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSubpageSnap);
  } else {
    initSubpageSnap();
  }
})();
