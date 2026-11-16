/* 無效設計師證照 3D 預覽（three.js，完全離線）
   模型：IDcard_03.glb（內嵌於 assets/idcard-glb.js）。姓名 / 日期 / 大頭照三個平面在「確認生成」後貼上畫布文字貼圖。
   拖曳可旋轉（含翻到背面），雙擊回正；下載檔案＝把目前角度輸出成 1440×802 的 PNG。 */
(function () {
  var cv = document.getElementById('license');
  var form = document.getElementById('id-form'), nameInput = document.getElementById('id-name');
  var make = document.getElementById('id-make'), dl = document.getElementById('id-download');
  if (!cv || !window.THREE || !window.THREE_ADDONS || !window.IDCARD_GLB_B64) return;

  var T = window.THREE, A = window.THREE_ADDONS;
  var FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  var OUT_W = 1440, OUT_H = 802;

  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true }); }
  catch (e) { cv.insertAdjacentHTML('afterend', '<p class="stage-sub" style="text-align:center">此瀏覽器無法顯示 3D 證照（需要 WebGL）。</p>'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new T.Scene();
  scene.background = new T.Color('#ffffff');
  scene.environment = new T.PMREMGenerator(renderer).fromScene(new A.RoomEnvironment(), 0.04).texture;
  var key = new T.DirectionalLight(0xffffff, 1.2); key.position.set(-3, 8, 4); scene.add(key);

  var camera = new T.PerspectiveCamera(35, OUT_W / OUT_H, 0.1, 100);
  camera.up.set(0, 0, -1); camera.position.set(0, 10.2, 0); camera.lookAt(0, 0, 0);

  var pivot = new T.Group(); scene.add(pivot);
  var planes = {};                       // photo / date / name
  var cardReady = false;

  function b64ToBuf(b) { var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
  new A.GLTFLoader().parse(b64ToBuf(window.IDCARD_GLB_B64), '', function (gltf) {
    pivot.add(gltf.scene);
    gltf.scene.traverse(function (o) {
      if (o.name === 'photo' || o.name === 'date' || o.name === 'name') { planes[o.name] = o; o.visible = false; }
    });
    cardReady = true; resize(); renderOnce();
  }, function (err) { console.error('證照模型載入失敗', err); });

  /* ---------- 文字貼圖 ---------- */
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'); draw(g, w, h);
    var t = new T.CanvasTexture(c);
    t.flipY = false;                                // glTF 的 UV 方向
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
    return t;
  }
  function applyTex(plane, tex) {
    plane.traverse(function (m) {
      if (!m.isMesh) return;
      m.material = new T.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: T.DoubleSide });
    });
  }
  function fitText(g, text, maxW, size, weight) {
    var s = size; g.font = weight + ' ' + s + 'px ' + FONT;
    while (g.measureText(text).width > maxW && s > 20) { s -= 2; g.font = weight + ' ' + s + 'px ' + FONT; }
    return s;
  }
  function buildTextures(n) {
    var d = new Date(), ds = d.getFullYear() + ' / ' + (d.getMonth() + 1) + ' / ' + d.getDate();
    applyTex(planes.name, canvasTex(1350, 200, function (g, w, h) {
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'left';
      fitText(g, n, w - 20, 150, 700); g.fillText(n, 10, h / 2 + 6);
    }));
    applyTex(planes.date, canvasTex(700, 200, function (g, w, h) {
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'left';
      fitText(g, ds, w - 20, 120, 400); g.fillText(ds, 10, h / 2 + 4);
    }));
    applyTex(planes.photo, canvasTex(512, 512, function (g, w, h) {
      g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b4b4b4'; g.beginPath(); g.arc(w / 2, h * 0.38, h * 0.17, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(w / 2, h * 0.95, w * 0.34, h * 0.34, 0, Math.PI, 0); g.fill();
    }));
  }

  /* ---------- 旋轉（拖曳）、待機輕微擺動、渲染迴圈 ---------- */
  var drag = null, interacted = false, vel = { x: 0, y: 0 }, appear = 1, appearT0 = 0, t0 = performance.now();
  var AX = new T.Vector3(1, 0, 0), AZ = new T.Vector3(0, 0, 1);
  var restQ = new T.Quaternion(), qTmp = new T.Quaternion();

  cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
  cv.addEventListener('pointerdown', function (e) {
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; interacted = true; vel.x = vel.y = 0;
    try { cv.setPointerCapture(e.pointerId); } catch (_) {} cv.style.cursor = 'grabbing';
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    vel.x = dx * 0.006; vel.y = dy * 0.006; spin(vel.x, vel.y);
  });
  function endDrag(e) { if (drag && e.pointerId === drag.id) { drag = null; cv.style.cursor = 'grab'; } }
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('dblclick', function () { interacted = true; reset = performance.now(); vel.x = vel.y = 0; });
  var reset = 0;
  function spin(dx, dy) {                                 // 水平拖曳＝繞螢幕垂直軸（Z）、垂直拖曳＝繞螢幕水平軸（X）
    qTmp.setFromAxisAngle(AZ, dx); pivot.quaternion.premultiply(qTmp);
    qTmp.setFromAxisAngle(AX, dy); pivot.quaternion.premultiply(qTmp);
  }

  function resize() {
    var w = cv.clientWidth || OUT_W; var h = Math.round(w * OUT_H / OUT_W);
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', function () { resize(); renderOnce(); });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!cardReady) return;
    if (reset) {                                           // 雙擊：平滑轉回正面
      var k = Math.min(1, (now - reset) / 400); pivot.quaternion.slerp(restQ, 0.15 + 0.2 * k);
      if (pivot.quaternion.angleTo(restQ) < 0.002) { pivot.quaternion.copy(restQ); reset = 0; }
    } else if (!drag) {
      if (Math.abs(vel.x) + Math.abs(vel.y) > 0.0005) { spin(vel.x, vel.y); vel.x *= 0.93; vel.y *= 0.93; }   // 慣性
      else if (!interacted) {                              // 待機：輕微擺動，暗示可以拖曳
        var s = (now - t0) / 1000;
        pivot.rotation.set(Math.sin(s * 0.9) * 0.12, 0, Math.sin(s * 0.6) * 0.18);
      }
    }
    if (appear < 1) {                                      // 生成時：姓名 / 照片 / 日期淡入並微放大
      appear = Math.min(1, (now - appearT0) / 700); var e = 1 - Math.pow(1 - appear, 3);
      Object.keys(planes).forEach(function (k) {
        var p = planes[k]; p.scale.setScalar(0.85 + 0.15 * e);
        p.traverse(function (m) { if (m.isMesh && m.material) m.material.opacity = e; });
      });
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  function renderOnce() { if (cardReady) renderer.render(scene, camera); }

  /* ---------- 表單：確認生成 → 下載 ---------- */
  var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = nameInput.value.trim(); if (!n || !cardReady) return;
    ready.then(function () {
      buildTextures(n);
      Object.keys(planes).forEach(function (k) { planes[k].visible = true; });
      appear = 0; appearT0 = performance.now();
      nameInput.hidden = true; nameInput.closest('.field').hidden = true; make.hidden = true; dl.hidden = false; dl.focus();
    });
  });
  dl.addEventListener('click', function () {
    var pr = renderer.getPixelRatio(), w = cv.width, h = cv.height;
    renderer.setPixelRatio(1); renderer.setSize(OUT_W, OUT_H, false); renderer.render(scene, camera);
    cv.toBlob(function (b) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(b);
      a.download = 'abandon-license.png'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    renderer.setPixelRatio(pr); resize(); renderOnce();
  });
})();
