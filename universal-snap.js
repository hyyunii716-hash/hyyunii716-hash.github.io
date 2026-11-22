(() => {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const CONFIG = {
    duration: 850, // 跳轉動畫時間（毫秒），越長停頓感越明顯
    stepPause: 420, // 每次停靠後的短暫停頓緩衝（毫秒）
    topOffset: 88, // 避開頂部導覽列高度
    minTargetHeight: 80, // 降低門檻，讓較小的區塊也能成為停靠點
  };

  let targets = [];
  let isAnimating = false;
  let stepLocked = false;
  let unlockTimer = null;

  function collectTargets() {
    const raw = Array.from(
      document.querySelectorAll(
        "main .page-head, main > section, main .feature, footer.site-footer",
      ),
    ).filter((el) => {
      if (
        el.closest("[data-snap-ignore]") ||
        el.hasAttribute("data-snap-ignore")
      ) {
        return false;
      }
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }
      return el.getBoundingClientRect().height >= CONFIG.minTargetHeight;
    });

    // 若外層 section 內已經有 .feature 子區塊，優先把 .feature 當作停靠點，分段感更清楚
    targets = raw.filter((el, idx, arr) => {
      if (el.tagName === "SECTION") {
        const hasFeatureChild = arr.some(
          (other, otherIdx) =>
            otherIdx !== idx &&
            el.contains(other) &&
            other.classList.contains("feature"),
        );
        if (hasFeatureChild) return false;
      }
      return true;
    });
  }

  function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  function getScrollTopFor(el) {
    const docTop = el.getBoundingClientRect().top + window.scrollY;
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    return Math.min(Math.max(0, docTop - CONFIG.topOffset), maxScroll);
  }

  function smoothScrollTo(targetY) {
    isAnimating = true;
    stepLocked = true;
    clearTimeout(unlockTimer);

    const startY = window.scrollY;
    const diff = targetY - startY;
    let startTime = null;

    function step(now) {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / CONFIG.duration, 1);
      window.scrollTo(0, startY + diff * easeInOutQuart(progress));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isAnimating = false;
        unlockTimer = setTimeout(() => {
          stepLocked = false;
        }, CONFIG.stepPause);
      }
    }

    requestAnimationFrame(step);
  }

  function findCurrentIndex() {
    if (!targets.length) return -1;
    const currentY = window.scrollY + CONFIG.topOffset + 24;
    let idx = 0;

    for (let i = 0; i < targets.length; i++) {
      const top = targets[i].getBoundingClientRect().top + window.scrollY;
      if (top <= currentY) {
        idx = i;
      }
    }
    return idx;
  }

  function handleWheel(e) {
    if (window.innerWidth <= 768 || e.ctrlKey || e.metaKey) return;
    if (e.defaultPrevented) return; // 已被別的程式處理（例如全螢幕展示離開那一下）：不要再吸附
    if (document.documentElement.classList.contains("sc-lock")) return; // 全螢幕展示開著：由展示自己處理滾輪
    if (!targets.length) return;
    if (Math.abs(e.deltaY) < 8) return; // 忽略極輕微的觸控板餘震

    // 動畫進行中或短暫停頓緩衝期內，攔截多餘滾動，讓停頓更明確
    if (isAnimating || stepLocked) {
      e.preventDefault();
      return;
    }

    const direction = e.deltaY > 0 ? 1 : -1;
    const currentIdx = findCurrentIndex();
    const nextIdx = currentIdx + direction;

    if (nextIdx < 0 || nextIdx >= targets.length) return;

    const nextTop = getScrollTopFor(targets[nextIdx]);
    if (Math.abs(nextTop - window.scrollY) < 10) return;

    e.preventDefault();
    smoothScrollTo(nextTop);
  }

  function init() {
    window.scrollTo(0, 0);
    collectTargets();
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", collectTargets, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
