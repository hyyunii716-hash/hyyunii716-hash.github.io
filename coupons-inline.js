// 定價頁內嵌折價券：支援多張（25% 對折兩次、50% 對折一次），每張各自獨立運作
(function () {
  var hint = document.getElementById("pricing-coupon-hint");

  function updateHint() {
    if (!hint) return;
    var hasClaimedCoupon = Array.from(
      document.querySelectorAll(".coupon-slot .stage"),
    ).some(function (stage) {
      return stage.classList.contains("is-folded");
    });
    hint.textContent = hasClaimedCoupon
      ? "獲取成功(>^ω^<)"
      : "點擊折價券，獲取折扣";
  }

  document.querySelectorAll(".coupon-slot").forEach(function (root) {
    var pct = root.dataset.pct;
    var stage = root.querySelector(".stage");
    var unit = root.querySelector("[data-unit]");
    var tab = root.querySelector(".tab");
    if (!stage || !unit || !tab) return;

    // 每個裁切面板放同一份圖樣
    root.querySelectorAll("[data-art]").forEach(function (el) {
      var title = document.createElement("div");
      title.className = "title";
      title.textContent = "折扣優惠卷";
      var save = document.createElement("div");
      save.className = "save";
      var lead = document.createElement("span");
      lead.className = "lead";
      lead.textContent = "立即省下";
      var num = document.createElement("span");
      num.className = "pct";
      num.textContent = pct + "%";
      save.appendChild(lead);
      save.appendChild(num);
      el.appendChild(title);
      el.appendChild(save);
    });

    function toggle() {
      var folded = stage.classList.toggle("is-folded");
      tab.inert = folded; // 折起來時下載頁籤被蓋住
      updateHint();
    }

    unit.addEventListener("click", function (e) {
      if (e.target.closest(".tab")) return;
      toggle();
    });
    tab.addEventListener("click", function () {
      var on = tab.getAttribute("aria-pressed") !== "true";
      tab.setAttribute("aria-pressed", String(on));
      tab.setAttribute("aria-label", on ? "已儲存折價券" : "儲存折價券");
      toggle();
    });
  });
})();
