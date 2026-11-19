(function () {
  'use strict';

  var stateKey = 'abandon-page-transition';
  var easing = 'cubic-bezier(0.76, 0, 0.24, 1)';
  var page = document.querySelector('main.page[data-tool]');
  var tool = page && page.getAttribute('data-tool');
  var toolsPage = !!document.querySelector('[data-carousel]');
  var homePage = !!document.querySelector('.card--tool');
  var supportsPageTransitions = !!(document.startViewTransition && window.CSS && CSS.supports('view-transition-name: none'));

  function readState() {
    try { return JSON.parse(sessionStorage.getItem(stateKey) || 'null'); }
    catch (_) { return null; }
  }

  function writeState(slug, direction, destination, rect, source) {
    var current = readState();
    var next = { tool: slug, direction: direction, destination: destination };
    if (direction === 'forward') {
      next.rect = rect || null;
      next.source = source || null;
    } else if (current && current.tool === slug) {
      next.rect = current.rect || null;
      next.source = current.source || null;
    }
    try { sessionStorage.setItem(stateKey, JSON.stringify(next)); }
    catch (_) { /* Keep normal link navigation available when storage is disabled. */ }
  }

  function slugFromLink(link) {
    try {
      var path = new URL(link.href, location.href).pathname;
      var slug = path.substring(path.lastIndexOf('/') + 1).replace(/\.html?$/i, '');
      return /^(compress|remover|flip|group)$/.test(slug) ? slug : null;
    } catch (_) { return null; }
  }

  function readRect(rect) {
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }

  function removeName(element) {
    if (element) element.style.removeProperty('view-transition-name');
  }

  function nameElement(element, name) {
    if (element) element.style.viewTransitionName = name;
  }

  function clearToolTargets() {
    document.querySelectorAll('.slide.is-transition-target, .card--tool.is-transition-target, .tool-option.is-transition-target')
      .forEach(function (element) { element.classList.remove('is-transition-target'); });
    document.querySelectorAll('.slide__link, .slide__title, .slide__icon, .card--tool, .card--tool .card__title, .tool-option, .tool-option__title, .tool-option__icon')
      .forEach(removeName);
  }

  function setCardTarget(slug) {
    clearToolTargets();
    var candidates = Array.prototype.slice.call(document.querySelectorAll('[data-carousel] .slide__link, .card--tool, .tool-option'));
    var link = candidates.find(function (candidate) { return slugFromLink(candidate) === slug; });
    if (!link) return false;
    var card = link.closest('.slide, .card--tool, .tool-option') || link;
    card.classList.add('is-transition-target');
    nameElement(link, 'tool-surface');
    nameElement(link.querySelector('.slide__title, .card__title, .tool-option__title'), 'tool-heading');
    nameElement(link.querySelector('.slide__icon, .tool-option__icon'), 'tool-icon');
    return true;
  }

  function setUploadTargets() {
    if (!tool) return;
    nameElement(document.querySelector('.upload-box'), 'tool-surface');
    nameElement(document.querySelector('.flow-title'), 'tool-heading');
    nameElement(document.querySelector('.upload-box .up-icon'), 'tool-icon');
  }

  function uploadTargetRect() {
    var width = window.innerWidth;
    var gutter = Math.min(144, Math.max(20, width * 0.08333));
    var frameWidth = Math.min(720, (width - gutter * 2) * 0.8);
    var titleTop = Math.min(197, Math.max(110, width * 0.114));
    var titleSize = Math.min(74, Math.max(32, width * 0.04282));
    var sectionGap = Math.min(76, Math.max(32, width * 0.044));
    var top = titleTop + titleSize * 1.35 + sectionGap;
    return { left: (width - frameWidth) / 2, top: top, width: frameWidth, height: frameWidth * 590 / 900 };
  }

  function fallbackNavigate(url, sourceElement, targetRect, slug, direction, destination) {
    if (!sourceElement || !targetRect || !sourceElement.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      location.href = url;
      return;
    }
    var from = readRect(sourceElement.getBoundingClientRect());
    var dx = targetRect.left - from.left;
    var dy = targetRect.top - from.top;
    var sx = targetRect.width / from.width;
    var sy = targetRect.height / from.height;
    var overlay = sourceElement.cloneNode(true);
    overlay.classList.remove('is-transition-target', 'page-transition-source');
    overlay.classList.add('page-transition-overlay');
    overlay.removeAttribute('id');
    Object.assign(overlay.style, {
      position: 'fixed', left: from.left + 'px', top: from.top + 'px',
      width: from.width + 'px', height: from.height + 'px', margin: '0',
      zIndex: '2147483000', pointerEvents: 'none', transformOrigin: '0 0',
      willChange: 'transform, opacity'
    });
    var outline = document.createElement('span');
    outline.className = 'page-transition-outline';
    outline.setAttribute('aria-hidden', 'true');
    overlay.appendChild(outline);
    sourceElement.classList.add('page-transition-source');
    document.body.appendChild(overlay);
    document.documentElement.classList.add('page-transition-fallback-out');
    overlay.animate([
      { transform: 'perspective(1200px) translate3d(0,0,0) scale(1) rotateY(6deg)', opacity: 1 },
      { transform: 'perspective(1200px) translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + sx + ',' + sy + ') rotateY(0deg)', opacity: .96 }
    ], { duration: 850, easing: easing, fill: 'forwards' });
    var content = overlay.querySelector('.slide__link, .card--tool, .tool-option, .upload-box');
    if (content && content.animate) content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 300, easing: easing, fill: 'forwards' });
    outline.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 350, easing: easing, fill: 'forwards' });
    writeState(slug, direction, destination, direction === 'forward' ? from : null, direction === 'forward' ? (homePage ? 'home' : 'tools') : null);
    window.setTimeout(function () { location.href = url; }, 870);
  }

  function revealAfterTransition(className) {
    var shown = false;
    function reveal() {
      if (shown) return;
      shown = true;
      document.documentElement.classList.remove('page-transition-enter-tool', 'page-transition-enter-tools', 'page-transition-enter-home');
      document.documentElement.classList.add(className);
      window.setTimeout(function () { document.documentElement.classList.remove(className); }, 750);
    }
    document.addEventListener('pagereveal', function (event) {
      if (event.viewTransition && event.viewTransition.finished) event.viewTransition.finished.then(reveal, reveal);
    }, { once: true });
    window.setTimeout(reveal, supportsPageTransitions ? 280 : 0);
  }

  var state = readState();
  if (tool) {
    if (state && state.direction === 'forward' && state.tool === tool) {
      document.documentElement.classList.add('page-transition-enter-tool');
      if (supportsPageTransitions) setUploadTargets();
      revealAfterTransition('page-transition-reveal-tool');
    } else {
      try { sessionStorage.removeItem(stateKey); } catch (_) {}
    }
  } else if (toolsPage && state && state.direction === 'back' && state.destination === 'tools') {
    document.documentElement.classList.add('page-transition-enter-tools');
    if (supportsPageTransitions) setCardTarget(state.tool);
    revealAfterTransition('page-transition-reveal-tools');
  } else if (homePage && state && state.direction === 'back' && state.destination === 'home') {
    document.documentElement.classList.add('page-transition-enter-home');
    if (supportsPageTransitions) setCardTarget(state.tool);
    revealAfterTransition('page-transition-reveal-home');
  } else if (!tool) {
    try { sessionStorage.removeItem(stateKey); } catch (_) {}
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;

    var slug = slugFromLink(link);
    if (slug) {
      var source = link.closest('.slide, .card--tool, .tool-option') || link;
      var rect = readRect(source.getBoundingClientRect());
      if (!supportsPageTransitions) {
        event.preventDefault();
        fallbackNavigate(link.href, source, uploadTargetRect(), slug, 'forward', 'tool');
        return;
      }
      writeState(slug, 'forward', 'tool', rect, homePage ? 'home' : 'tools');
      if (toolsPage || homePage) {
        clearToolTargets();
        source.classList.add('is-transition-target');
        nameElement(link, 'tool-surface');
        nameElement(link.querySelector('.slide__title, .card__title, .tool-option__title'), 'tool-heading');
        nameElement(link.querySelector('.slide__icon, .tool-option__icon'), 'tool-icon');
      }
      return;
    }

    if (tool && /(?:^|\/)tools\.html(?:$|[?#])/.test(link.href)) {
      if (supportsPageTransitions) {
        writeState(tool, 'back', 'tools');
        setUploadTargets();
      } else if (state && state.rect && state.source === 'tools') {
        event.preventDefault();
        fallbackNavigate(link.href, document.querySelector('.upload-box'), state.rect, tool, 'back', 'tools');
      }
    } else if (tool && /(?:^|\/)index\.html(?:$|[?#])/.test(link.href)) {
      if (supportsPageTransitions) {
        writeState(tool, 'back', 'home');
        setUploadTargets();
      } else if (state && state.rect && state.source === 'home') {
        event.preventDefault();
        fallbackNavigate(link.href, document.querySelector('.upload-box'), state.rect, tool, 'back', 'home');
      }
    } else if (!link.href.startsWith(location.origin + location.pathname)) {
      try { sessionStorage.removeItem(stateKey); } catch (_) {}
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.querySelector(".carousel");
    if (!carousel) return;

    function goPrev() {
      carousel.dispatchEvent(new CustomEvent("carousel:step", { detail: 1 }));
    }

    function goNext() {
      carousel.dispatchEvent(new CustomEvent("carousel:step", { detail: -1 }));
    }

    const isDesktop = window.matchMedia("(min-width: 901px)");
    let isDragging = false;
    let movedDistance = 0;
    let startX = 0;
    let startY = 0;
    let lockDirection = null; // "x" | "y" | null
    let pointerId = null;
    const threshold = 55; // 拖曳超過多少 px 算切換一張，可微調（45～80）
    let suppressClick = false;
    let clickSuppressionTimer;

    carousel.style.userSelect = "none";

    function onPointerDown(e) {
      if (isDesktop.matches) return;
      // 只處理滑鼠左鍵或觸控
      if (e.pointerType === "mouse" && e.button !== 0) return;

      isDragging = true;
      pointerId = e.pointerId;
      movedDistance = 0;
      lockDirection = null;
      startX = e.clientX;
      startY = e.clientY;
      carousel.classList.add("is-dragging");
    }

    function onPointerMove(e) {
      if (!isDragging || e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // 判斷使用者主要是水平拖曳還是垂直滑動頁面
      if (!lockDirection && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        lockDirection = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }

      if (lockDirection === "x") {
        movedDistance = Math.abs(dx);
        if (e.cancelable) e.preventDefault();
      }
    }

    function onPointerUp(e) {
      if (!isDragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const shouldPreventClick = movedDistance > 6;

      isDragging = false;
      pointerId = null;
      carousel.classList.remove("is-dragging");

      if (lockDirection === "x" && Math.abs(dx) >= threshold) {
        // 往右拉（dx > 0）看左邊卡片；往左拉（dx < 0）看右邊卡片
        if (dx > 0) {
          goPrev();
        } else {
          goNext();
        }
      }

      // 若有明顯拖曳，攔截緊接著的 click 事件避免誤觸連結。
      if (shouldPreventClick) {
        suppressClick = true;
        clearTimeout(clickSuppressionTimer);
        clickSuppressionTimer = setTimeout(() => {
          suppressClick = false;
        }, 50);
      }

      lockDirection = null;
      movedDistance = 0;
    }

    function onPointerCancel(e) {
      if (!isDragging || e.pointerId !== pointerId) return;
      isDragging = false;
      pointerId = null;
      carousel.classList.remove("is-dragging");
      lockDirection = null;
      movedDistance = 0;
    }

    carousel.addEventListener("click", (e) => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    }, true);

    carousel.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  });
})();
