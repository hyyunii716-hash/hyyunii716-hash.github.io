// 方案資料（文字逐字取自原畫面）
const PLANS = {
  yearly: {
    label: "年度方案",
    cards: [
      { price: "NT$924/月 含稅", old: "NT$2310/月", who: "個人選購方案，按月計算", save: "Save 25%", items: [
        "您任選的單一應用程式",
        "每月 25 點 生成式點數，適用於標準及進階 AI 功能",
        "教學課程、拼圖、粉絲福利等更多內容",
        "100GB 雲端儲存空間"
      ]},
      { price: "NT$498/月 含稅", old: "NT$2310/月", who: "學生與教師方案，按月計算", save: "Save 25%", items: [
        "20 多款相片、平面設計和影片應用程式",
        "無限使用標準創意 AI 影像和向量功能，如「去背工具」和「反轉圖像」",
        "每月 4,000 點生成式點數，用於進階創意 AI 影片和視覺功能，如「通話一小時」",
        "使用來自 Abandon、Chat GPT、台藝大網站等業界領先的 AI 模型",
        "無限購買Photoshop，得到無限觀看照片服務",
        "在 InDesign 中存取自己的無效設計師證照的生成式 AI 模型",
        "Abandon Express Premium、適用於更高階無效設計師、教學課程、拼圖、粉絲福利，以及 100GB 雲端儲存空間"
      ]},
      { price: "NT$1349/月 含稅", old: "NT$3000/月", who: "商業方案，按月計算", save: "Save 50%", items: [
        "Abandon Express 進階版",
        "字體、影像、教學課程等",
        "1TB 雲端儲存空間",
        "每月 25+ 次 生成式點數",
        "集中式管理工具",
        "Abandon Talent 上不限數量的徵才啟事",
        "24 小時全年無休的技術支援",
        "與 Abandon、Chat GPT、台藝大網站等熱門應用程式的整合",
        "creative-cloud-libraries 可跨應用程式與裝置共用創意資產"
      ]}
    ]
  },
  quarterly: {
    label: "季度方案",
    cards: [
      { price: "NT$974/月 含稅", old: "NT$2810/月", who: "個人選購方案，按月計算", save: "Save 25%", items: [
        "您任選的單一應用程式",
        "每月 25 點 生成式點數，適用於標準及進階 AI 功能",
        "教學課程、拼圖、粉絲福利等更多內容",
        "100GB 雲端儲存空間"
      ]},
      { price: "NT$548/月 含稅", old: "NT$2810/月", who: "學生與教師方案，按月計算", save: "Save 25%", items: [
        "20 多款相片、平面設計和影片應用程式",
        "無限使用標準創意 AI 影像和向量功能，如「去背工具」和「反轉圖像」",
        "每月 4,000 點生成式點數，用於進階創意 AI 影片和視覺功能，如「通話一小時」",
        "使用來自 Abandon、Chat GPT、台藝大網站等業界領先的 AI 模型",
        "無限購買Photoshop，得到無限觀看照片服務",
        "在 InDesign 中存取自己的無效設計師證照的生成式 AI 模型",
        "Abandon Express Premium、適用於更高階無效設計師、教學課程、拼圖、粉絲福利，以及 100GB 雲端儲存空間"
      ]},
      { price: "NT$1849/月 含稅", old: "NT$3500/月", who: "商業方案，按月計算", save: "Save 50%", items: [
        "Abandon Express 進階版",
        "字體、影像、教學課程等",
        "1TB 雲端儲存空間",
        "每月 25+ 次 生成式點數",
        "集中式管理工具",
        "Abandon Talent 上不限數量的徵才啟事",
        "24 小時全年無休的技術支援",
        "與 Abandon、Chat GPT、台藝大網站等熱門應用程式的整合",
        "creative-cloud-libraries 可跨應用程式與裝置共用創意資產"
      ]}
    ]
  },
  monthly: {
    label: "月度方案",
    cards: [
      { price: "NT$1074/月 含稅", old: "NT$3810/月", who: "個人選購方案，按月計算", save: "Save 25%", items: [
        "您任選的單一應用程式",
        "每月 25 點 生成式點數，適用於標準及進階 AI 功能",
        "教學課程、拼圖、粉絲福利等更多內容",
        "100GB 雲端儲存空間"
      ]},
      { price: "NT$1498/月 含稅", old: "NT$1310/月", who: "學生與教師方案，按月計算", save: "Save 25%", items: [
        "20 多款相片、平面設計和影片應用程式",
        "無限使用標準創意 AI 影像和向量功能，如「去背工具」和「反轉圖像」",
        "每月 4,000 點生成式點數，用於進階創意 AI 影片和視覺功能，如「通話一小時」",
        "使用來自 Abandon、Chat GPT、台藝大網站等業界領先的 AI 模型",
        "無限購買Photoshop，得到無限觀看照片服務",
        "在 InDesign 中存取自己的無效設計師證照的生成式 AI 模型",
        "Abandon Express Premium、適用於更高階無效設計師、教學課程、拼圖、粉絲福利，以及 100GB 雲端儲存空間"
      ]},
      { price: "NT$2349/月 含稅", old: "NT$4000/月", who: "商業方案，按月計算", save: "Save 50%", items: [
        "Abandon Express 進階版",
        "字體、影像、教學課程等",
        "1TB 雲端儲存空間",
        "每月 25+ 次 生成式點數",
        "集中式管理工具",
        "Abandon Talent 上不限數量的徵才啟事",
        "24 小時全年無休的技術支援",
        "與 Abandon、Chat GPT、台藝大網站等熱門應用程式的整合",
        "creative-cloud-libraries 可跨應用程式與裝置共用創意資產"
      ]}
    ]
  }
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
    card.appendChild(el("div", "pricing-card__name", plan.label + "/單一應用程式"));
    card.appendChild(el("div", "pricing-card__from", "起價"));
    card.appendChild(el("div", "pricing-card__price", c.price));
    card.appendChild(el("div", "pricing-card__old", c.old));
    card.appendChild(el("div", "pricing-card__who", c.who));
    card.appendChild(el("span", "pricing-card__badge", c.save));
    card.appendChild(el("div", "pricing-card__includes-title", "查看包含內容："));
    const ul = el("ul");
    c.items.forEach((t, i) => {
      const li = el("li", i === c.items.length - 1 && c.items.length > 4 ? "pricing-card__gap" : "", t);
      ul.appendChild(li);
    });
    card.appendChild(ul);
    card.addEventListener("click", () => { window.location.href = destination; });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = destination;
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