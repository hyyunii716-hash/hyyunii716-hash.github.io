// 工具流程：同一頁內切換 步驟（上傳 → 製作中 → 完成），對應 prototype 的多個畫面。
// data-goto="步驟名" 的按鈕會切換；data-auto="下一步" + data-ms 是 prototype 的「延遲後自動前往」。
(function () {
  var steps = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
  if (!steps.length) return;
  var timer;

  function show(name) {
    var target = steps.filter(function (s) { return s.getAttribute('data-step') === name; })[0];
    if (!target) return;
    clearTimeout(timer);
    steps.forEach(function (s) { s.hidden = s !== target; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var h = target.querySelector('h1');
    if (h) h.focus({ preventScroll: true });
    var next = target.getAttribute('data-auto');
    if (next) timer = setTimeout(function () { show(next); }, +target.getAttribute('data-ms') || 3500);
  }

  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-goto]');
    if (go) { show(go.getAttribute('data-goto')); return; }
    if (e.target.closest('[data-download]')) {
      // 沒有真的處理檔案：下載一張示意用的棋盤格 PNG
      var c = document.createElement('canvas'); c.width = 800; c.height = 450;
      var x = c.getContext('2d');
      for (var i = 0; i < 17; i++) for (var j = 0; j < 10; j++) { x.fillStyle = (i + j) % 2 ? '#f7f7f7' : '#e6e6e6'; x.fillRect(i * 48, j * 48, 48, 48); }
      c.toBlob(function (b) {
        var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'abandon-result.png'; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      });
    }
  });
})();
