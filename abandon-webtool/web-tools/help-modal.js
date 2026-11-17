/* 「還是不會用？更多資訊」→ 在原頁面彈出方案卡片（不跳轉頁面）。按 ESC、點卡片外或「×」關閉。 */
(function () {
  var links = document.querySelectorAll('.more-link');
  if (!links.length) return;

  var wrap = document.createElement('div');
  wrap.className = 'help-pop'; wrap.hidden = true;
  wrap.innerHTML =
    '<div class="help-pop__scrim" data-close></div>' +
    '<section class="help-pop__card" role="dialog" aria-modal="true" aria-labelledby="help-pop-title" tabindex="-1">' +
      '<button type="button" class="help-pop__x" data-close aria-label="關閉">×</button>' +
      '<h2 id="help-pop-title" class="help-pop__title">選擇你喜歡的方案以了解更多</h2>' +
      '<ul class="help-pop__plans">' +
        '<li class="help-pop__plan"><p class="help-pop__kind">月度方案/單一應用程式</p><p class="help-pop__from">起價</p>' +
          '<p class="help-pop__price">NT$1498/月 含稅</p><p class="help-pop__was">NT$1310/月</p><p class="help-pop__note">學生與教師方案，按月計算</p></li>' +
        '<li class="help-pop__plan"><p class="help-pop__kind">月度方案/單一應用程式</p><p class="help-pop__from">起價</p>' +
          '<p class="help-pop__price">NT$1074/月 含稅</p><p class="help-pop__was">NT$3810/月</p><p class="help-pop__note">個人選購方案，按月計算</p></li>' +
      '</ul>' +
      '<a class="help-pop__cta" href="pricing.html">查看更多方案</a>' +
    '</section>';
  document.body.appendChild(wrap);
  var card = wrap.querySelector('.help-pop__card'), opener = null;

  function open(from) {
    opener = from || null; wrap.hidden = false;
    requestAnimationFrame(function () { wrap.classList.add('is-open'); card.focus(); });
  }
  function close() {
    wrap.classList.remove('is-open');
    setTimeout(function () { wrap.hidden = true; }, 220);
    if (opener) opener.focus();
  }
  links.forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); open(a); });
  });
  wrap.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !wrap.hidden) close(); });
})();
