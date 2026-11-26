/* nav.js — 全站共用導覽列
 *
 * 用法：在每一頁放
 *   <header class="…該頁原本的 class…" data-site-nav></header>
 *   <script src="nav.js"></script>
 * 腳本會把 logo 與四個連結填進 header，並依照目前網址自動加上 aria-current="page"。
 * header 本身的 class / id 不會被動到（首頁的 cover-nav、id="coverNav" 照舊）。
 *
 * 要改連結文字、新增或刪除頁面：只改下面的 LINKS。
 */
(function () {
  var LOGO = 'assets/abandon-wordmark.png';

  var LINKS = [
    { href: 'index.html',   text: '首頁' },
    { href: 'tools.html',   text: '小工具' },
    { href: 'apps.html',    text: '程式' },
    { href: 'pricing.html', text: '購買方案' }
  ];

  var host = document.querySelector('header[data-site-nav]');
  if (!host) return;

  // 取出目前檔名；網址以 / 結尾或沒有檔名時視為首頁。
  // 不在 LINKS 裡的頁面（photoshop.html、customer service.html…）不會有任何底線。
  var current = '';
  try {
    current = decodeURIComponent(location.pathname.split('/').pop() || '');
  } catch (e) {}
  if (current === '') current = 'index.html';

  var items = LINKS.map(function (link) {
    var cur = link.href === current ? ' aria-current="page"' : '';
    return '<li><a href="' + link.href + '"' + cur + '>' + link.text + '</a></li>';
  }).join('');

  host.innerHTML =
    '<nav class="site-nav" aria-label="主選單">' +
      '<a class="site-nav__brand" href="index.html" aria-label="Abandon 首頁">' +
        '<img class="site-nav__logo" src="' + LOGO + '" alt="Abandon">' +
      '</a>' +
      '<ul class="site-nav__list">' + items + '</ul>' +
    '</nav>';
})();
