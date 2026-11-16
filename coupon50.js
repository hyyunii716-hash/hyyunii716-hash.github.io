(function () {
  var stage = document.getElementById('stage');
  var unit = document.getElementById('unit');
  var hint = document.getElementById('hint');
  var tab = document.getElementById('tab');
  var status = document.getElementById('status');
  var tpl = document.getElementById('art');

  // same artwork in both halves; each half crops its own side
  document.querySelectorAll('[data-art]').forEach(function (el) {
    el.appendChild(tpl.content.cloneNode(true));
  });

  function toggle() {
    var folded = stage.classList.toggle('is-folded');
    hint.setAttribute('aria-pressed', String(folded));
    hint.textContent = folded ? '獲取成功(>^ω^<)' : '點擊折價券，獲取折扣';
    tab.inert = folded; // the download tab is under the flap while folded
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
   var folded = stage.classList.toggle('is-folded');
    hint.setAttribute('aria-pressed', String(folded));
  });

  document.getElementById('back').addEventListener('click', function () {
    status.textContent = '';
  });
})();
