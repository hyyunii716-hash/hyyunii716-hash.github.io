// 方案資料（文字逐字取自原畫面）
const PLANS = {
  yearly: {
    label: "年度方案",
    cards: [
      {
        price: "NT$924/月 含稅",
        old: "NT$2310/月",
        who: "新手設計師方案，按月計算",
        save: "Save 25%",
        items: [
          "每月 25 次免費修改機會，客戶永遠不會滿意",
          "每日收到 10 則「有空幫我改一下嗎？」訊息",
          "免費體驗一次「客戶突然消失」服務",
          "AI 自動生成不符合需求的參考圖片",
        ],
      },
      {
        price: "NT$498/月 含稅",
        old: "NT$2310/月",
        who: "資深設計師方案，按月計算",
        save: "Save 25%",
        items: [
          "每月 50 次免費修改機會，客戶永遠不會滿意",
          "每天 24 小時收到客戶的深夜訊息",
          "免費提供 20 種無法使用的字體",
          "讓每一張圖片都自動變成低解析度",
          "無限次修改完後，客戶仍然選擇第一版",
          "附贈「老闆說這個禮拜一定要交」倒數計時器",
          "每月一次免費重新排版，但不得增加預算",
        ],
      },
      {
        price: "NT$1349/月 含稅",
        old: "NT$3000/月",
        who: "創意總監方案，按月計算",
        save: "Save 50%",
        items: [
          "24 小時全年無休修改服務",
          "客戶擁有無限次推翻設計的權利",
          "所有字體隨機替換成新細明體",
          "自動將 300MB 的 AI 檔案壓縮成無法開啟的格式",
          "免費獲得 365 天無法請假的設計師行事曆",
          "無限次收到「這個感覺不太對」的語音訊息",
          "AI 自動生成一份永遠不會通過的設計提案",
          "即使辭職，專案仍會自動追蹤你",
          "任何設計完成後，自動收到「還是第一版比較好」",
        ],
      },
    ],
  },
  quarterly: {
    label: "季度方案",
    cards: [
      {
        price: "NT$974/月 含稅",
        old: "NT$2810/月",
        who: "新手設計師方案，按月計算",
        save: "Save 25%",
        items: [
         "每月 25 次免費修改機會，客戶永遠不會滿意",
          "每日收到 10 則「有空幫我改一下嗎？」訊息",
          "免費體驗一次「客戶突然消失」服務",
          "AI 自動生成不符合需求的參考圖片",
        ],
      },
      {
        price: "NT$548/月 含稅",
        old: "NT$2810/月",
        who: "資深設計師方案，按月計算",
        save: "Save 25%",
        items: [
         "每月 50 次免費修改機會，客戶永遠不會滿意",
          "每天 24 小時收到客戶的深夜訊息",
          "免費提供 20 種無法使用的字體",
          "讓每一張圖片都自動變成低解析度",
          "無限次修改完後，客戶仍然選擇第一版",
          "附贈「老闆說這個禮拜一定要交」倒數計時器",
          "每月一次免費重新排版，但不得增加預算",
        ],
      },
      {
        price: "NT$1849/月 含稅",
        old: "NT$3500/月",
        who: "創意總監方案，按月計算",
        save: "Save 50%",
        items: [
        "24 小時全年無休修改服務",
          "客戶擁有無限次推翻設計的權利",
          "所有字體隨機替換成新細明體",
          "自動將 300MB 的 AI 檔案壓縮成無法開啟的格式",
          "免費獲得 365 天無法請假的設計師行事曆",
          "無限次收到「這個感覺不太對」的語音訊息",
          "AI 自動生成一份永遠不會通過的設計提案",
          "即使辭職，專案仍會自動追蹤你",
          "任何設計完成後，自動收到「還是第一版比較好」",
        ],
      },
    ],
  },
  monthly: {
    label: "月度方案",
    cards: [
      {
        price: "NT$1074/月 含稅",
        old: "NT$3810/月",
        who: "新手設計師方案，按月計算",
        save: "Save 25%",
        items: [
         "每月 25 次免費修改機會，客戶永遠不會滿意",
          "每日收到 10 則「有空幫我改一下嗎？」訊息",
          "免費體驗一次「客戶突然消失」服務",
          "AI 自動生成不符合需求的參考圖片",
        ],
      },
      {
        price: "NT$1498/月 含稅",
        old: "NT$1310/月",
        who: "資深設計師方案，按月計算",
        save: "Save 25%",
        items: [
         "每月 50 次免費修改機會，客戶永遠不會滿意",
          "每天 24 小時收到客戶的深夜訊息",
          "免費提供 20 種無法使用的字體",
          "讓每一張圖片都自動變成低解析度",
          "無限次修改完後，客戶仍然選擇第一版",
          "附贈「老闆說這個禮拜一定要交」倒數計時器",
          "每月一次免費重新排版，但不得增加預算",
        ],
      },
      {
        price: "NT$2349/月 含稅",
        old: "NT$4000/月",
        who: "創意總監方案，按月計算",
        save: "Save 50%",
        items: [
         "24 小時全年無休修改服務",
          "客戶擁有無限次推翻設計的權利",
          "所有字體隨機替換成新細明體",
          "自動將 300MB 的 AI 檔案壓縮成無法開啟的格式",
          "免費獲得 365 天無法請假的設計師行事曆",
          "無限次收到「這個感覺不太對」的語音訊息",
          "AI 自動生成一份永遠不會通過的設計提案",
          "即使辭職，專案仍會自動追蹤你",
          "任何設計完成後，自動收到「還是第一版比較好」",
        ],
      },
    ],
  },
};

const cardsEl = document.getElementById("pricing-cards");
const tabs = document.querySelectorAll(".pricing-tab");
const buyButton = document.getElementById("pricing-buy");
const successDialog = document.getElementById("pricing-success");
let current = null;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function render(key) {
  const plan = PLANS[key];
  cardsEl.innerHTML = "";
  plan.cards.forEach((c, index) => {
    const card = el("article", "pricing-card");
    const destination = index === 2 ? "discount-50.html" : "discount-25.html";
    card.dataset.href = destination;
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `${c.who}，前往購買`);
    card.appendChild(
      el("div", "pricing-card__name", plan.label + "/單一應用程式"),
    );
    card.appendChild(el("div", "pricing-card__from", "起價"));
    card.appendChild(el("div", "pricing-card__price", c.price));
    card.appendChild(el("div", "pricing-card__old", c.old));
    card.appendChild(el("div", "pricing-card__who", c.who));
    card.appendChild(el("span", "pricing-card__badge", c.save));
    card.appendChild(
      el("div", "pricing-card__includes-title", "查看包含內容："),
    );
    const ul = el("ul");
    c.items.forEach((t, i) => {
      const li = el(
        "li",
        i === c.items.length - 1 && c.items.length > 4
          ? "pricing-card__gap"
          : "",
        t,
      );
      ul.appendChild(li);
    });
    card.appendChild(ul);
    card.addEventListener("click", () => {
      window.open(destination, "_blank", "noopener,noreferrer");
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.open(destination, "_blank", "noopener,noreferrer");
      }
    });
    cardsEl.appendChild(card);
  });
}

function select(key, animate = true) {
  if (key === current) return;
  tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.plan === key));
  if (!animate || current === null) {
    render(key);
    current = key;
    return;
  }
  current = key;
  cardsEl.classList.add("is-switching");
  setTimeout(() => {
    render(key);
    cardsEl.classList.remove("is-switching");
  }, 280);
}

if (buyButton && successDialog) {
  buyButton.addEventListener("click", () => successDialog.showModal());
  successDialog
    .querySelector(".pricing-success__close")
    .addEventListener("click", () => successDialog.close());
  successDialog.addEventListener("click", (event) => {
    if (event.target === successDialog) successDialog.close();
  });
}

tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.plan)));

// 預設顯示「月度方案」（與影片開頭相同）
select("monthly", false);

// 尚未設定連結的項目（href="#"）：點擊時不跳回頁面最上方
document.querySelectorAll('a[href="#"]').forEach((a) => {
  a.addEventListener("click", (e) => e.preventDefault());
});

// Smoothly move a colored gradient bubble with the pointer, like the CodePen demo.
const pricingHero = document.querySelector(".pricing-hero");
const interactiveBlob = document.querySelector(".pricing-blob--interactive");
if (pricingHero && interactiveBlob) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  pricingHero.addEventListener("pointermove", (event) => {
    const bounds = pricingHero.getBoundingClientRect();
    targetX = event.clientX - bounds.left - bounds.width / 2;
    targetY = event.clientY - bounds.top - bounds.height / 2;
  });

  pricingHero.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
  });

  function moveInteractiveBlob() {
    currentX += (targetX - currentX) / 7;
    currentY += (targetY - currentY) / 7;
    interactiveBlob.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    requestAnimationFrame(moveInteractiveBlob);
  }

  requestAnimationFrame(moveInteractiveBlob);
}

// Read the arrival marker written by the shared page transition handler.
let shouldAssemblePricingCover = false;
try {
  shouldAssemblePricingCover = sessionStorage.getItem("pricing-cover-assemble") === "1";
  sessionStorage.removeItem("pricing-cover-assemble");
} catch (_) {}
if (new URLSearchParams(location.search).get("pricingEnter") === "1") {
  shouldAssemblePricingCover = true;
  const cleanUrl = new URL(location.href);
  cleanUrl.searchParams.delete("pricingEnter");
  history.replaceState(history.state, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
}

if (pricingHero && shouldAssemblePricingCover && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const logoStage = pricingHero.querySelector(".pricing-brand-stage");
  const logo = logoStage?.querySelector(".pricing-brand");

  // Let the destination begin rendering before assembling the cover.
  window.setTimeout(() => {
    if (!logoStage || !logo) return;
    pricingHero.classList.add("is-assembling");
    logoStage.classList.add("is-assembling");
    const columns = 8;
    const rows = 4;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const shard = logo.cloneNode();
        shard.removeAttribute("alt");
        shard.classList.add("pricing-brand-shard");
        shard.style.clipPath = `inset(${row * 25}% ${(columns - column - 1) * 12.5}% ${(rows - row - 1) * 25}% ${column * 12.5}%)`;
        shard.style.setProperty("--shard-delay", `${Math.random() * 120}ms`);
        shard.style.setProperty("--shard-x", `${Math.round(Math.random() * 900 - 450)}px`);
        shard.style.setProperty("--shard-y", `${Math.round(Math.random() * 700 - 350)}px`);
        shard.style.setProperty("--shard-z", `${Math.round(Math.random() * -2200 - 300)}px`);
        shard.style.setProperty("--shard-rx", `${Math.round(Math.random() * 720 - 360)}deg`);
        shard.style.setProperty("--shard-ry", `${Math.round(Math.random() * 720 - 360)}deg`);
        shard.style.setProperty("--shard-rz", `${Math.round(Math.random() * 180 - 90)}deg`);
        logoStage.append(shard);
      }
    }
    window.setTimeout(() => {
      logoStage.querySelectorAll(".pricing-brand-shard").forEach((shard) => shard.remove());
      logoStage.classList.remove("is-assembling");
      pricingHero.classList.remove("is-assembling");
    }, 1650);
  }, 80);
}
