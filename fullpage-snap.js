(function () {
  // ★ 1. 關閉瀏覽器自動記憶捲動位置，重整永遠從最頂端乾淨開場開始 ★
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  // ★ 2. 首頁專屬防護：阻斷共用腳本在首頁監聽 mousemove 產生掉落字（不改動 localStorage，切去其他頁依然有效）★
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

  // =========================================================================
  // ★ 快速調整區（進場、退場動畫與換頁速度都在這裡改）★
  // =========================================================================
  const CONFIG = {
    duration: 950, // 換頁滑動時間（毫秒）
    cooldown: 300, // 換頁完成後的防連跳冷卻時間（毫秒）
    navOffset: 44, // 中間介紹區塊的垂直置中補償（扣除導覽列高度）

    // --- 第一屏三塊字卡浮出調整 ---
    cardsRevealDelay: 600, // 進到第一屏後，等幾毫秒才開始浮出三塊字卡
    cardsStagger: 0.16, // 第一屏三張字卡錯開的時間差（秒）
    cardsDuration: 0.85, // 第一屏單張字卡浮上來的動畫速度（秒）

    // --- 下方所有 Section（程式卡片、工具、QA）通用進退場調整 ---
    sectionRevealDelay: 180, // 滑進該區塊後，延遲幾毫秒開始浮出（毫秒）
    sectionStagger: 0.12, // 區塊內每個元素錯開進場的時間差（秒）
    sectionDuration: 0.75, // 單一元素進場浮現的動畫速度（秒）

    // --- 退場動畫調整區 ---
    exitDuration: 0.45, // 離開該區塊時的淡出退場速度（秒，建議比進場快一點更俐落）
    exitStagger: 0.05, // 退場時元素錯開淡出的時間差（秒）
    exitDistance: 28, // 退場時向上或向下飄移的距離（px）
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

    const manifestoSec = allSections[0]; // 第 1 區：三行標語
    const valuesSec = allSections[1]; // 第 2 區：三塊理念卡片
    const middleSections = allSections.slice(2, -1); // 中間介紹區塊（不含最後的 QA）
    const qaSec = allSections[allSections.length - 1]; // 最後一區：QA（完全保留原始版面）

    // 自動向下尋找包含 3 個子元素的卡片容器，精準抓出第一屏三塊字卡
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

    // 3. 注入樣式（包含進場、向上退場、向下退場狀態）
    const style = document.createElement("style");
    style.textContent = `
      body.has-cover main.page {
        margin-top: 0 !important;
      }

      /* 首頁第一屏（三行標語 + 三塊理念卡片合為一頁，整體垂直置中） */
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

      /* 第一屏三塊字卡進退場動畫 */
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

      /* ★ 下方所有區塊元素的通用進退場動畫（使用獨立 translate 屬性，不影響 3D 翻轉卡片） ★ */
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
      /* 往下翻頁時的向上退場 */
      .js-reveal-item.is-exit-up {
        opacity: 0;
        translate: 0 -${CONFIG.exitDistance}px;
        transition: opacity ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1),
                    translate ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1);
      }
      /* 往回翻頁時的向下退場 */
      .js-reveal-item.is-exit-down {
        opacity: 0;
        translate: 0 ${CONFIG.exitDistance}px;
        transition: opacity ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1),
                    translate ${CONFIG.exitDuration}s cubic-bezier(0.4, 0, 1, 1);
      }

      /* 中間介紹區塊（第 3 區到倒數第 2 區）：撐滿 100vh 並垂直置中（不影響最後一區 QA） */
      main.page > section:nth-of-type(n+3):not(:last-of-type) {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-sizing: border-box;
        padding-top: calc(88px + ${CONFIG.navOffset}px);
        padding-bottom: 60px;
      }
    
      `;
    document.head.appendChild(style);

    // 4. .cover-stage 滑鼠互動光暈與隱藏彩蛋文字
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

    // 5. 第一屏三塊卡片進退場控制
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

    // 6. ★ 下方所有 Section 通用來回進退場設定 ★
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

      // 先清除退場狀態，讓元素準備好從下方或上方浮入
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

    // 7. 統一平滑翻頁核心（在翻頁出發瞬間觸發當前頁退場、目標頁進場）
    let isAnimating = false;

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

    // 8. 全頁投影片清單（包含最後的 QA 區塊）
    const slides = [manifestoSec, ...middleSections, qaSec];
    let hasStoppedAtTitle = false;

    window.addEventListener(
      "wheel",
      (e) => {
        if (window.innerWidth <= 768) return;

        if (isAnimating) {
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

            if (
              !hasStoppedAtTitle &&
              (!isTitleShown || Math.abs(window.scrollY - titleStopY) > 40)
            ) {
              e.preventDefault();
              hasStoppedAtTitle = true;
              smoothScrollTo(titleStopY, 400);
              return;
            }

            e.preventDefault();
            triggerValueCards();
            smoothScrollTo(manifestoSec.offsetTop);
            return;
          }

          if (
            direction === -1 &&
            window.scrollY > titleStopY + 20 &&
            window.scrollY <= manifestoSec.offsetTop + 80
          ) {
            e.preventDefault();
            // 從第一屏往回滑向藍色主標題時，觸發第一屏三張字卡向下退場
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

            // 觸發當前頁向上退場
            if (currentSec === manifestoSec) {
              exitValueCards(1);
            } else {
              triggerSectionExit(currentSec, 1);
            }
            // 預備目標頁進場
            triggerSectionEnter(nextSec);

            smoothScrollTo(nextSec.offsetTop);
          }
        } else if (direction === -1) {
          if (currentIndex > 0) {
            e.preventDefault();
            const currentSec = slides[currentIndex];
            const prevSec = slides[currentIndex - 1];

            // 觸發當前頁向下退場
            triggerSectionExit(currentSec, -1);
            // 預備上一頁進場
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
