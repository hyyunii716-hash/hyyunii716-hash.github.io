/* 已收到信用卡資訊：進頁面就彈出廣告，3-2-1 倒數後才能關閉（純原生 JS，離線可用） */
(function () {
  var ad = document.getElementById('ad');
  var wrap = document.getElementById('adWrap');
  var btn = document.getElementById('adClose');
  var num = document.getElementById('adNum');
  var label = document.getElementById('adLabel');
  var img = document.getElementById('adImg');
  var fb = document.getElementById('adFallback');
  var page = document.querySelector('.received');
  var left = 3, timer = null;

  function useFallback() { img.hidden = true; fb.hidden = false; }
  img.addEventListener('error', useFallback);
  if (img.complete && img.naturalWidth === 0) useFallback();

  function tick(html) {
    num.innerHTML = html;
    var s = num.firstElementChild || num;
    num.classList.remove('tick'); void num.offsetWidth; num.classList.add('tick');
  }
  function render() {
    if (left > 0) {
      btn.disabled = true;
      btn.setAttribute('aria-label', '廣告倒數 ' + left + ' 秒');
      label.textContent = '廣告倒數';
      tick(String(left));
    } else {
      btn.disabled = false;
      btn.setAttribute('aria-label', '關閉廣告');
      label.textContent = '關閉廣告';
      tick('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>');
    }
  }
  function close() {
    if (left > 0) return;
    ad.classList.add('is-out');
    page.classList.add('is-clear');
    setTimeout(function () { ad.hidden = true; }, 260);
  }
  function start() {
    clearInterval(timer);
    left = 3; ad.hidden = false; ad.classList.remove('is-out'); page.classList.remove('is-clear');
    render();
    timer = setInterval(function () {
      left -= 1; render();
      if (left <= 0) clearInterval(timer);
    }, 1000);
  }
  btn.addEventListener('click', close);
  start();
})();
