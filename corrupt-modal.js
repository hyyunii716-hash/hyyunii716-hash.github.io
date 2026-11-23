(function () {
  if (window.openCorruptModal) return;

  var modalStyle = document.createElement("style");
  modalStyle.textContent = [
    ".abandon-modal,",
    ".abandon-modal * {",
    "  transition: none !important;",
    "}",
    ".abandon-modal button,",
    ".abandon-modal .abandon-modal__btn,",
    ".abandon-modal .abandon-modal__btn:hover,",
    ".abandon-modal .abandon-modal__btn:active,",
    ".abandon-modal .abandon-modal__btn:focus {",
    "  transform: none !important;",
    "  translate: none !important;",
    "  scale: none !important;",
    "  rotate: none !important;",
    "}",
  ].join("\n");
  document.head.appendChild(modalStyle);

  var backdrop = document.createElement("div");
  backdrop.className = "abandon-modal-backdrop";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-labelledby", "corruptModalTitle");

  backdrop.innerHTML = [
    '<div class="abandon-modal">',
    '  <p class="abandon-modal__eyebrow">NIGHTMARE ERROR //</p>',
    '  <h2 id="corruptModalTitle" class="abandon-modal__title">檔案已毀損</h2>',
    '  <div class="abandon-modal__repeat">',
    "    <span>檔案已毀損</span>",
    "    <span>檔案已毀損</span>",
    "  </div>",
    '  <p class="abandon-modal__body">無法讀取目前工作階段的圖層與自動存檔紀錄，所有變更可能已無法復原。</p>',
    '  <div class="abandon-modal__actions">',
    '    <button type="button" class="abandon-modal__btn" data-modal-close>忽略</button>',
    '    <button type="button" class="abandon-modal__btn abandon-modal__btn--primary" data-modal-retry>重新讀取</button>',
    "  </div>",
    "</div>",
  ].join("");

  document.body.appendChild(backdrop);

  var closeBtn = backdrop.querySelector("[data-modal-close]");
  var retryBtn = backdrop.querySelector("[data-modal-retry]");
  var lastFocused = null;
  var lastTriggered = 0;

  function lockModalButtons() {
    backdrop
      .querySelectorAll("button, .abandon-modal__btn")
      .forEach(function (btn) {
        btn.style.setProperty("transform", "none", "important");
        btn.style.setProperty("translate", "none", "important");
        btn.style.setProperty("transition", "none", "important");
      });
  }

  // 阻止滑鼠在彈窗按鈕上移動時觸發外部的磁吸監聽
  ["mousemove", "pointermove", "mouseenter", "mouseleave"].forEach(
    function (evtName) {
      backdrop.addEventListener(
        evtName,
        function (e) {
          if (e.target.closest("button, .abandon-modal__btn, .abandon-modal")) {
            e.stopPropagation();
            lockModalButtons();
          }
        },
        true,
      );
    },
  );

  function openCorruptModal(customTitle) {
    lastFocused = document.activeElement;
    var titleEl = backdrop.querySelector("#corruptModalTitle");
    if (titleEl && customTitle) titleEl.textContent = customTitle;
    lockModalButtons();
    backdrop.classList.add("is-open");
    lastTriggered = Date.now();
    if (closeBtn) closeBtn.focus();
  }

  function closeCorruptModal() {
    backdrop.classList.remove("is-open");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  closeBtn.addEventListener("click", closeCorruptModal);

  retryBtn.addEventListener("click", function () {
    var repeatBox = backdrop.querySelector(".abandon-modal__repeat");
    if (repeatBox) {
      var line = document.createElement("span");
      line.textContent = "檔案已毀損";
      repeatBox.appendChild(line);
    }
  });

  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeCorruptModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && backdrop.classList.contains("is-open")) {
      closeCorruptModal();
    }
  });

  window.openCorruptModal = openCorruptModal;

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-corrupt-modal]");
    if (!trigger) return;
    e.preventDefault();
    openCorruptModal(trigger.getAttribute("data-corrupt-modal"));
  });

  // ================= 🎲 穩定隨機彈出（定時 ＋ 操作觸發） =================
  var CHECK_INTERVAL_MS = 5000;
  var TIMER_CHANCE = 0.45;
  var ACTION_CHANCE = 0.08;
  var COOLDOWN_MS = 8000;

  function tryRandomCorruptModal() {
    var now = Date.now();
    if (backdrop.classList.contains("is-open")) return;
    if (now - lastTriggered < COOLDOWN_MS) return;

    if (Math.random() < TIMER_CHANCE) {
      openCorruptModal("檔案已毀損");
    }
  }

  setInterval(tryRandomCorruptModal, CHECK_INTERVAL_MS);

  document.addEventListener("click", function (e) {
    if (
      e.target.closest(".abandon-modal, [role='switch'], [data-corrupt-modal]")
    )
      return;
    var now = Date.now();
    if (backdrop.classList.contains("is-open")) return;
    if (now - lastTriggered < COOLDOWN_MS) return;

    if (Math.random() < ACTION_CHANCE) {
      openCorruptModal("檔案已毀損");
    }
  });
  // =========================================================================

  openCorruptModal("檔案已毀損");
})();
