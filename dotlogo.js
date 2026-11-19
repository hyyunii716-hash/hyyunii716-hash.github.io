/* 互動點陣字標：把 <img data-dot-logo> 變成由小圓點組成的圖，滑鼠 / 手指靠近時點會被推開、再彈回。
   原圖仍保留在頁面上（隱藏），所以沒有 JS、減少動態或讀螢幕時依然有字標。 */
(function () {
  var imgs = document.querySelectorAll('img[data-dot-logo]');
  if (!imgs.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = document.createElement('style');
  st.textContent = '.dot-logo-wrap{position:relative;display:block;width:fit-content;max-width:100%;margin-inline:auto}' +
    '.dot-logo-wrap>img{display:block;transition:opacity .3s}.dot-logo-wrap.is-dots>img{opacity:0}' +
    '.dot-logo-wrap>canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}';
  document.head.appendChild(st);

  imgs.forEach(function (img) {
    var wrap = document.createElement('span');
    wrap.className = 'dot-logo-wrap';
    img.parentNode.insertBefore(wrap, img); wrap.appendChild(img);
    var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); wrap.appendChild(cv);
    var ctx = cv.getContext('2d');
    var dots = [], W = 0, H = 0, dpr = 1, visible = true, raf = 0, ptr = { x: -9999, y: -9999 }, R = 90;

    function build() {
      var r = img.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height);
      if (!W || !H || !img.naturalWidth) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      var off = document.createElement('canvas'); off.width = W; off.height = H;
      var o = off.getContext('2d'); o.drawImage(img, 0, 0, W, H);
      var data; try { data = o.getImageData(0, 0, W, H).data; } catch (e) { return; }  // 跨來源被擋時維持原圖
      var step = Math.max(3, Math.round(W / 150)); dots = [];
      for (var y = step / 2; y < H; y += step) for (var x = step / 2; x < W; x += step) {
        if (data[((y | 0) * W + (x | 0)) * 4 + 3] > 128) dots.push({ bx: x, by: y, x: x, y: y, vx: 0, vy: 0 });
      }
      R = Math.max(60, Math.min(120, W * 0.12));
      wrap.classList.add('is-dots'); r = step * 0.44; dots.size = r; draw();
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#fff';
      ctx.beginPath(); var s = dots.size || 1.4;
      for (var i = 0; i < dots.length; i++) { var p = dots[i]; ctx.moveTo(p.x + s, p.y); ctx.arc(p.x, p.y, s, 0, 6.2832); }
      ctx.fill();
    }
    function tick() {
      var moving = false;
      for (var i = 0; i < dots.length; i++) {
        var p = dots[i], dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 0.01) { var d = Math.sqrt(d2), f = (R - d) / R; p.vx += dx / d * f * 5; p.vy += dy / d * f * 5; }
        p.vx += (p.bx - p.x) * 0.05; p.vy += (p.by - p.y) * 0.05;
        p.vx *= 0.8; p.vy *= 0.8; p.x += p.vx; p.y += p.vy;
        if (Math.abs(p.vx) > 0.02 || Math.abs(p.vy) > 0.02 || Math.abs(p.bx - p.x) > 0.05 || Math.abs(p.by - p.y) > 0.05) moving = true;
      }
      draw(); raf = moving && visible ? requestAnimationFrame(tick) : 0;
    }
    function kick() { if (!raf && visible && dots.length) raf = requestAnimationFrame(tick); }

    if (!reduce) {
      window.addEventListener('pointermove', function (e) {
        var r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
        if (ptr.x > -R && ptr.x < W + R && ptr.y > -R && ptr.y < H + R) kick();
      }, { passive: true });
      document.addEventListener('pointerleave', function () { ptr.x = ptr.y = -9999; kick(); });
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(wrap);
    if ('ResizeObserver' in window) { var t; new ResizeObserver(function () { clearTimeout(t); t = setTimeout(build, 120); }).observe(wrap); }
    if (img.complete) build(); else img.addEventListener('load', build);
  });
})();
