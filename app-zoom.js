/* 網頁程式：點選軟體卡片 → 卡片放大成全螢幕，圖示與名稱飛到畫面中央，再進入該軟體頁面；
   新頁面一開始就是同樣的畫面，接著圖示縮小淡出、內容由小放大浮現。
   apps.html（離開）與 photoshop / indesign / lightroom（抵達）都要載入這支檔案。 */
(function () {
  'use strict';
  var KEY = 'abandon-app-zoom';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var BG = '#0c0c0c';
  var EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var EASE_IO = 'cubic-bezier(0.76, 0, 0.24, 1)';
  var EASE_POP = 'cubic-bezier(0.2, 0.9, 0.25, 1.15)';
  var NAME_SCALE = 2.1;

  function rgba(color, a) {
    var m = String(color).match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/);
    return m ? 'rgba(' + m[1] + ',' + m[2] + ',' + m[3] + ',' + a + ')' : 'rgba(80,120,255,' + a + ')';
  }
  function iconTarget() { return Math.round(Math.max(110, Math.min(200, Math.min(innerWidth, innerHeight) * 0.22))); }
  function centerPoint() { return { x: innerWidth / 2, y: innerHeight / 2 - 28 }; }

  function styleTag() {
    if (document.getElementById('az-style')) return;
    var s = document.createElement('style'); s.id = 'az-style';
    s.textContent =
      '.az{position:fixed;inset:0;z-index:9500;overflow:hidden;pointer-events:auto}' +
      '.az__base{position:absolute;background:' + BG + ';overflow:hidden;will-change:left,top,width,height,border-radius}' +
      '.az__glow{position:absolute;inset:-20%;opacity:0;will-change:opacity,transform}' +
      '.az__icon{position:fixed;margin:0;display:grid;place-items:center;line-height:1;will-change:transform;transform-origin:0 0}' +
      '.az__name{position:fixed;margin:0;white-space:nowrap;font-weight:700;color:#fff;will-change:transform,opacity;transform-origin:50% 0}' +
      'html.az-leaving .app-card.is-az-source{visibility:hidden}';
    document.head ? document.head.appendChild(s) : document.documentElement.appendChild(s);
  }
  function glowCss(fg) { return 'radial-gradient(circle at 50% 46%, ' + rgba(fg, .55) + ' 0%, ' + rgba(fg, .18) + ' 34%, transparent 62%)'; }

  function buildIcon(st, size) {
    var el = document.createElement('div'); el.className = 'az__icon'; el.textContent = st.abbr; el.setAttribute('aria-hidden', 'true');
    el.style.cssText += ';width:' + size + 'px;height:' + size + 'px;border-radius:' + (st.radius / st.size * size) + 'px;background:' + st.bg + ';color:' + st.fg +
      ';font-family:' + st.ff + ';font-weight:700;letter-spacing:-.04em;font-size:' + (size * .69) + 'px;padding:0 .04em .06em 0;box-sizing:border-box';
    return el;
  }

  /* ---------- 抵達：新頁面 ---------- */
  function arrive() {
    var st; try { st = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (_) { st = null; }
    if (!st || Date.now() - st.t > 6000 || reduce.matches) return;
    styleTag();
    var root = document.createElement('div'); root.className = 'az'; root.setAttribute('aria-hidden', 'true');
    var base = document.createElement('div'); base.className = 'az__base'; base.style.cssText += ';left:0;top:0;width:100%;height:100%;border-radius:0';
    var glow = document.createElement('div'); glow.className = 'az__glow'; glow.style.background = glowCss(st.fg); glow.style.opacity = '1';
    base.appendChild(glow);
    var T = iconTarget(), c = centerPoint();
    var icon = buildIcon(st, T); icon.style.left = (c.x - T / 2) + 'px'; icon.style.top = (c.y - T / 2) + 'px'; icon.style.transformOrigin = '50% 50%';
    var name = document.createElement('p'); name.className = 'az__name'; name.textContent = st.name;
    name.style.fontFamily = st.nameFf; name.style.fontSize = (st.nameSize * NAME_SCALE) + 'px'; name.style.fontWeight = st.nameWeight; name.style.letterSpacing = st.nameLs;
    name.style.left = c.x + 'px'; name.style.top = (c.y + T / 2 + 22) + 'px'; name.style.transform = 'translateX(-50%)';
    root.appendChild(base); root.appendChild(icon); root.appendChild(name);
    document.documentElement.appendChild(root);

    var finished = false;
    function finish() {
      if (finished) return; finished = true;
      var main = document.querySelector('main');
      if (main) main.animate([{ opacity: 0, transform: 'scale(.94)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 900, easing: EASE_OUT });
      icon.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.55)', opacity: 0 }], { duration: 520, easing: EASE_IO, fill: 'forwards' });
      name.animate([{ opacity: 1, transform: 'translateX(-50%) translateY(0)' }, { opacity: 0, transform: 'translateX(-50%) translateY(-18px)' }], { duration: 420, easing: EASE_IO, fill: 'forwards' });
      glow.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.8)', opacity: 0 }], { duration: 760, easing: EASE_IO, fill: 'forwards' });
      var out = base.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 560, delay: 260, easing: 'ease-out', fill: 'forwards' });
      out.onfinish = function () { root.remove(); };
      setTimeout(function () { root.remove(); }, 1600);
    }
    function ready() { setTimeout(finish, 180); }
    if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready, { once: true });
    setTimeout(finish, 3500);                                     // 保險：載入太慢也要離開
  }

  /* ---------- 離開：apps.html ---------- */
  function leave(card, link, external) {
    if (document.documentElement.classList.contains('az-leaving')) return;
    styleTag();
    var icon0 = card.querySelector('.app-icon'), nameEl = card.querySelector('.app-card__name');
    if (!icon0 || !nameEl) return false;
    var ics = getComputedStyle(icon0), ns = getComputedStyle(nameEl), cs = getComputedStyle(card);
    var ir = icon0.getBoundingClientRect(), nr = nameEl.getBoundingClientRect(), cr = card.getBoundingClientRect();
    var rng = document.createRange(); rng.selectNodeContents(nameEl);
    var tr = rng.getBoundingClientRect();
    nr = { left: tr.left, top: nr.top, width: tr.width };            // 文字實際寬度，放大後才會真正置中
    var st = { abbr: icon0.textContent.trim(), name: nameEl.textContent.trim(), bg: ics.backgroundColor, fg: ics.color, ff: ics.fontFamily,
      size: ir.width, radius: parseFloat(ics.borderTopLeftRadius) || ir.width * .0864, nameFf: ns.fontFamily, nameSize: parseFloat(ns.fontSize), nameWeight: ns.fontWeight, nameLs: ns.letterSpacing, t: Date.now() };

    var root = document.createElement('div'); root.className = 'az'; root.setAttribute('aria-hidden', 'true');
    var base = document.createElement('div'); base.className = 'az__base';
    var bgNow = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#121212' : cs.backgroundColor;
    base.style.cssText += ';left:' + cr.left + 'px;top:' + cr.top + 'px;width:' + cr.width + 'px;height:' + cr.height + 'px;border-radius:' + cs.borderTopLeftRadius + ';background:' + bgNow + ';border:' + cs.borderTopWidth + ' solid ' + cs.borderTopColor + ';box-sizing:border-box';
    var glow = document.createElement('div'); glow.className = 'az__glow'; glow.style.background = glowCss(st.fg);
    base.appendChild(glow);
    var T = iconTarget(), c = centerPoint();
    var icon = buildIcon(st, ir.width); icon.style.left = ir.left + 'px'; icon.style.top = ir.top + 'px';
    var name = document.createElement('p'); name.className = 'az__name'; name.textContent = st.name;
    name.style.fontFamily = st.nameFf; name.style.fontSize = st.nameSize + 'px'; name.style.fontWeight = st.nameWeight; name.style.letterSpacing = st.nameLs; name.style.left = nr.left + 'px'; name.style.top = nr.top + 'px'; name.style.transformOrigin = '0 0';
    root.appendChild(base); root.appendChild(icon); root.appendChild(name);
    document.documentElement.appendChild(root);
    card.classList.add('is-az-source'); document.documentElement.classList.add('az-leaving');

    /* 其他卡片退到後面 */
    Array.prototype.forEach.call(document.querySelectorAll('.app-card'), function (o) {
      if (o === card) return;
      o.animate([{ opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(.9)', filter: 'blur(6px)' }], { duration: 420, easing: EASE_IO, fill: 'forwards' });
    });

    var D = 780;
    base.animate([
      { left: cr.left + 'px', top: cr.top + 'px', width: cr.width + 'px', height: cr.height + 'px', borderRadius: cs.borderTopLeftRadius },
      { left: '0px', top: '0px', width: innerWidth + 'px', height: innerHeight + 'px', borderRadius: '0px' }
    ], { duration: D, easing: EASE_IO, fill: 'forwards' });
    base.animate([{ backgroundColor: bgNow }, { backgroundColor: BG }], { duration: D, easing: 'ease-out', fill: 'forwards' });
    glow.animate([{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)' }], { duration: D, delay: 120, easing: EASE_OUT, fill: 'forwards' });
    var s = T / ir.width, dx = (c.x - T / 2) - ir.left, dy = (c.y - T / 2) - ir.top;
    icon.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }], { duration: D, easing: EASE_POP, fill: 'forwards' });
    var nw = name.getBoundingClientRect().width * NAME_SCALE, tx = c.x - nw / 2 - nr.left, ty = (c.y + T / 2 + 22) - nr.top;
    name.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(' + NAME_SCALE + ')' }], { duration: D, easing: EASE_IO, fill: 'forwards' });

    if (external) {
      /* 外部連結（Illustrator）：放大動畫播完後在新分頁開啟，原頁面淡出動畫、恢復原狀；被擋彈窗就改用本頁開啟 */
      setTimeout(function () {
        var w = null;
        try { w = window.open(link.href, '_blank'); if (w) w.opener = null; } catch (_) {}
        if (!w) { location.href = link.href; return; }
        setTimeout(function () {
          var fade = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' });
          fade.onfinish = cleanupLeave;
          setTimeout(cleanupLeave, 900);
        }, 250);
      }, D + 40);
      return true;
    }
    try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { return false; }
    setTimeout(function () { location.href = link.href; }, D + 40);
    return true;
  }

  function cleanupLeave() {
    document.querySelectorAll('.az').forEach(function (e) { e.remove(); });
    document.documentElement.classList.remove('az-leaving');
    document.querySelectorAll('.is-az-source').forEach(function (e) { e.classList.remove('is-az-source'); });
    document.querySelectorAll('.app-card').forEach(function (e) { e.getAnimations().forEach(function (a) { a.cancel(); }); });
  }

  document.addEventListener('click', function (e) {
    if (reduce.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var card = e.target.closest && e.target.closest('.app-card');
    if (!card) return;
    var hit = e.target.closest('a');
    if (hit && hit.getAttribute('href') && /pricing\.html/.test(hit.getAttribute('href'))) return;      // 「購買」照常
    var link = card.querySelector('a.btn--outline[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var external = /^https?:\/\//i.test(href) && link.target === '_blank';   // Illustrator：外部連結，新分頁開啟
    if (!external && (link.target === '_blank' || !/^[\w.-]+\.html?$/i.test(href))) return;
    if (hit && hit !== link) return;
    e.preventDefault();
    if (leave(card, link, external) === false) { if (external) window.open(link.href, '_blank'); else location.href = link.href; }
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) cleanupLeave(); });
  arrive();
})();
