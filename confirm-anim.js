/* 確認成功後：信用卡移到畫面中央，其他資訊淡出。
   需放在 pay.js 之後載入：pay.js 的 submit 處理會先執行，
   驗證成功時它會替按鈕加上 .done，這裡就以此作為播放動畫的條件。 */
(function () {
  var form = document.getElementById('payForm');
  var stage = document.getElementById('stage');
  var confirmBtn = document.getElementById('confirm');
  if (!form || !stage || !confirmBtn) return;

  var played = false;

  // 量出卡片目前（未位移）的中心點，算出要移到視窗中央的位移量
  function setOffsets() {
    var body = document.body;
    var wasOn = body.classList.contains('is-confirmed');
    var prevTransition = stage.style.transition;

    stage.style.transition = 'none';
    body.classList.remove('is-confirmed');
    var r = stage.getBoundingClientRect();
    var dx = window.innerWidth / 2 - (r.left + r.width / 2);
    var dy = window.innerHeight / 2 - (r.top + r.height / 2);
    body.style.setProperty('--dx', dx + 'px');
    body.style.setProperty('--dy', dy + 'px');
    if (wasOn) body.classList.add('is-confirmed');
    void stage.offsetWidth; // 強制重排，避免把這次還原也播成動畫
    stage.style.transition = prevTransition;
  }

  form.addEventListener('submit', function () {
    if (played) return;
    if (!confirmBtn.classList.contains('done')) return; // 驗證沒過就不播
    played = true;
    if (document.activeElement) document.activeElement.blur();
    window.scrollTo(0, 0);
    setOffsets();
    document.body.classList.add('is-confirmed');
  });

  var returning = false;
  function goToPricing() {
    if (!played || returning) return;
    returning = true;
    var scaleToCover = Math.max(
      window.innerWidth / stage.offsetWidth,
      window.innerHeight / stage.offsetHeight
    ) * 1.12;
    document.body.style.setProperty('--exit-scale', scaleToCover);
    document.body.classList.add('is-returning');
    window.setTimeout(function () {
      window.location.href = 'pricing.html';
    }, 1550);
  }

  window.addEventListener('wheel', function (event) {
    if (played && event.deltaY > 0) goToPricing();
  }, { passive: true });

  var touchStartY = null;
  window.addEventListener('touchstart', function (event) {
    if (played && event.touches.length) touchStartY = event.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', function (event) {
    if (!played || touchStartY === null || !event.changedTouches.length) return;
    var swipeDistance = touchStartY - event.changedTouches[0].clientY;
    if (swipeDistance > 40) goToPricing();
    touchStartY = null;
  }, { passive: true });

  window.addEventListener('keydown', function (event) {
    if (played && ['ArrowDown', 'PageDown', ' '].includes(event.key)) goToPricing();
  });

  window.addEventListener('resize', function () {
    if (played) setOffsets();
  });
})();
