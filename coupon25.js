(function () {
  var stage = document.getElementById('stage');
  var unit = document.getElementById('unit');
  var hint = document.getElementById('hint');
  var tab = document.getElementById('tab');
  var status = document.getElementById('status');
  var tpl = document.getElementById('art');

  // 四個面板放同一份圖樣，各自裁切自己那 1/4
  document.querySelectorAll('[data-art]').forEach(function (el) {
    el.appendChild(tpl.content.cloneNode(true));
  });

  // 一次點擊 = 連續對折兩次；再點一次 = 依序展開
  function toggle() {
    var folded = stage.classList.toggle('is-folded');
    hint.setAttribute('aria-pressed', String(folded));
    hint.textContent = folded ? '獲取成功(>^ω^<)' : '點擊折價券，獲取折扣';
    tab.inert = folded; // 折起來時下載頁籤被蓋住
  }

  unit.addEventListener('click', function (e) {
    if (e.target.closest('.tab')) return;
    toggle();
  });
  hint.addEventListener('click', toggle);

  tab.addEventListener('click', function () {
    var on = tab.getAttribute('aria-pressed') !== 'true';
    tab.setAttribute('aria-pressed', String(on));
    tab.setAttribute('aria-label', on ? '已儲存折價券' : '儲存折價券');
    toggle();
  });

  document.getElementById('back').addEventListener('click', function () {
    status.textContent = '';
  });
})();
