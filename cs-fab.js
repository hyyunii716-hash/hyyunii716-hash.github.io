/* =========================================================
   Abandon — 右下角固定「詢問客服」按鈕（cs-fab.js）
   - 固定在視窗右下角，不隨頁面捲動；點擊前往 customer service.html（功能與原本的「詢問客服」連結相同）
   - 全螢幕展示（html.sc-lock）開啟時自動淡出，避免擋到展示畫面
   - 只要在頁面最後面加一行 <script src="cs-fab.js"></script> 即可
   ========================================================= */
(() => {
  'use strict';

  // ★ 快速調整區 ★
  const HREF = 'customer%20service.html';   // 連結目標
  const LABEL_PRE = '更多問題？';             // 底線前的文字；不想要就設成 ''
  const LABEL_LINK = '詢問客服';
  const ICON_SRC = 'assets/耳機.png';        // 耳機圖示（客服頁用的同一張）；載入失敗會自動換成內建的線條耳機
  const RIGHT = 'clamp(16px, 2.4vw, 40px)';  // 離右邊／下邊的距離
  const BOTTOM = 'clamp(16px, 3vh, 36px)';

  if (document.querySelector('.cs-fab')) return;

  const css = `
.cs-fab{position:fixed;right:${RIGHT};bottom:${BOTTOM};z-index:60;display:inline-flex;align-items:center;gap:.7em;
  padding:.7em 1.15em .7em 1.3em;border-radius:999px;color:#fff;text-decoration:none;white-space:nowrap;
  font:500 clamp(14px,1.15vw,18px)/1.2 var(--font-zh,"Noto Sans TC",sans-serif);letter-spacing:.04em;
  background:rgba(12,12,12,.72);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  box-shadow:0 0 0 1px rgba(255,255,255,.14),0 10px 30px rgba(0,0,0,.45);
  transition:opacity .35s ease,transform .35s cubic-bezier(.22,1,.36,1),box-shadow .25s ease,background-color .25s ease}
.cs-fab:hover,.cs-fab:focus-visible{background:rgba(28,28,28,.88);box-shadow:0 0 0 1px rgba(255,255,255,.4),0 12px 34px rgba(0,0,0,.55);transform:translateY(-2px)}
.cs-fab:focus-visible{outline:2px solid #fff;outline-offset:3px}
.cs-fab__link{border-bottom:2px solid currentColor;padding-bottom:.12em}
.cs-fab svg,.cs-fab__icon{width:1.7em;height:1.7em;flex:none;object-fit:contain;display:block}
html.sc-lock .cs-fab{opacity:0;pointer-events:none;transform:translateY(8px)}
@media (max-width:600px){.cs-fab__pre{display:none}.cs-fab{padding:.7em 1em}}
@media print{.cs-fab{display:none}}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const a = document.createElement('a');
  a.className = 'cs-fab';
  a.href = HREF;
  a.setAttribute('aria-label', '詢問客服');
  const SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="2.5" y="14" width="4" height="6" rx="1.5"/><rect x="17.5" y="14" width="4" height="6" rx="1.5"/></svg>';
  a.innerHTML =
    (LABEL_PRE ? `<span class="cs-fab__pre">${LABEL_PRE}</span>` : '') +
    `<span class="cs-fab__link">${LABEL_LINK}</span>` +
    `<img class="cs-fab__icon" src="${encodeURI(ICON_SRC)}" alt="" aria-hidden="true" draggable="false">`;
  const img = a.querySelector('.cs-fab__icon');
  img.addEventListener('error', () => img.replaceWith(Object.assign(document.createElement('span'), { innerHTML: SVG }).firstChild), { once: true });
  document.body.appendChild(a);
})();
