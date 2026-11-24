/* =========================================================
   Abandon — 去背結果頁互動與細小單色粒子撞擊消散（remover-effect.js）
   ========================================================= */
(() => {
  // ===== 速度與手感快速調整區（想更快/更慢改這裡） =====
  const BOUNCE_BASE_VX = 9.5; // 圖片水平基礎速度（原本約 2.6）
  const BOUNCE_BASE_VY = 7.8; // 圖片垂直基礎速度（原本約 2.0）
  const BOUNCE_RANDOM_JITTER = 3.5; // 每次觸發的隨機速度浮動幅度
  const COLLISION_KEYWORDS = ["惡魔低語", "耳機客服"]; // 圖片碰到時會直接消散的目標文字
  // =======================================================

  const fileInput = document.querySelector("[data-file-input]");
  const previewBtn = document.querySelector("[data-result-preview]");
  const previewImg = document.querySelector("[data-remover-img]");
  const backBtn = document.querySelector("[data-remover-back]");
  const downloadSection = document.querySelector('[data-step="download"]');
  const particleCanvas = document.getElementById("removerParticleCanvas");
  if (!previewBtn || !previewImg || !downloadSection) return;

  const ctx = particleCanvas ? particleCanvas.getContext("2d") : null;
  const PARTICLE_LIFETIME_MS = 3000;
  let uploadedSrc = "";
  let resultEntered = false;
  let bgDissolveTriggered = false;
  let dissolveDelayTimerId = null;
  let bgParticleIntervalId = null;
  let chaosStarted = false;
  let bounceRafId = null;
  let particleRafId = null;
  let vanishTimers = [];
  let restoreTimerId = null;
  let collisionTargets = [];
  const particles = [];

  function resizeCanvas() {
    if (!particleCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    particleCanvas.width = Math.floor(window.innerWidth * dpr);
    particleCanvas.height = Math.floor(window.innerHeight * dpr);
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  resizeCanvas();

  function pushTinyMonochromeParticle(x, y, vx, vy, radius, decay, hitCooldown = 0, maxAge = PARTICLE_LIFETIME_MS) {
    const shade = Math.random();
    const color = shade > 0.55 ? "#ffffff" : shade > 0.22 ? "#d4d4d4" : "#7a7a7a";
    particles.push({
      x,
      y,
      vx,
      vy,
      radius,
      alpha: 0.95,
      decay,
      color,
      hitCooldown,
      bornAt: performance.now(),
      maxAge
    });
  }

  // 僅圍繞指定目標元件生成粒子（避免在螢幕莫名處出現）
  function spawnAroundTargetBatch(targetEl = previewBtn, count = 48) {
    if (!ctx || !targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;

    for (let i = 0; i < count; i++) {
      const x = rect.left + Math.random() * rect.width;
      const y = rect.top + Math.random() * rect.height;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = 0.65 + Math.random() * 1.25;
      const radius = 0.75 + Math.random() * 1.1;

      pushTinyMonochromeParticle(
        x,
        y,
        (dx / dist) * speed + (Math.random() - 0.5) * 0.6,
        (dy / dist) * speed - 0.15 + (Math.random() - 0.5) * 0.6,
        radius,
        0.018 + Math.random() * 0.012,
        0,
        PARTICLE_LIFETIME_MS
      );
    }

    if (!particleRafId) {
      runParticleLoop();
    }
  }

  // 元件消散粒子
  function spawnParticlesFromElement(el, count = 64) {
    if (!el || !ctx) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;

    for (let i = 0; i < count; i++) {
      const x = rect.left + Math.random() * rect.width;
      const y = rect.top + Math.random() * rect.height;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = 10 + Math.random() * 10;
      const radius = 0.75 + Math.random() * 1;

      pushTinyMonochromeParticle(
        x,
        y,
        (dx / dist) * speed + (Math.random() - 0.5) * 0.75,
        (dy / dist) * speed - 0.2 + (Math.random() - 0.5) * 0.75,
        radius,
        0.018 + Math.random() * 0.012,
        0,
        PARTICLE_LIFETIME_MS
      );
    }

    if (!particleRafId) {
      runParticleLoop();
    }
  }

  function emitCollisionBurst(x, y, parentBornAt) {
    for (let b = 0; b < 3; b++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.5 + Math.random() * 1.1;
      const shade = Math.random();
      const color = shade > 0.55 ? "#ffffff" : shade > 0.22 ? "#d4d4d4" : "#7a7a7a";
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 0.65 + Math.random() * 0.7,
        alpha: 0.85,
        decay: 0.032 + Math.random() * 0.02,
        color,
        hitCooldown: 6,
        bornAt: parentBornAt,
        maxAge: PARTICLE_LIFETIME_MS
      });
    }
  }

  function runParticleLoop() {
    if (!ctx || !particleCanvas) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.986;
      p.vy = p.vy * 0.986 - 0.01;
      if (p.hitCooldown > 0) p.hitCooldown -= 1;

      if (p.x < p.radius) {
        p.x = p.radius;
        p.vx = Math.abs(p.vx) * 0.82;
        p.alpha -= 0.06;
      } else if (p.x > window.innerWidth - p.radius) {
        p.x = window.innerWidth - p.radius;
        p.vx = -Math.abs(p.vx) * 0.82;
        p.alpha -= 0.06;
      }
      if (p.y < p.radius) {
        p.y = p.radius;
        p.vy = Math.abs(p.vy) * 0.82;
        p.alpha -= 0.06;
      } else if (p.y > window.innerHeight - p.radius) {
        p.y = window.innerHeight - p.radius;
        p.vy = -Math.abs(p.vy) * 0.82;
        p.alpha -= 0.06;
      }
    }

    const maxPairChecks = Math.min(particles.length, 260);
    for (let i = 0; i < maxPairChecks; i++) {
      const a = particles[i];
      if (!a || a.alpha <= 0) continue;
      for (let j = i + 1; j < maxPairChecks; j++) {
        const b = particles[j];
        if (!b || b.alpha <= 0) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = (a.radius + b.radius) * 1.65;
        const distSq = dx * dx + dy * dy;

        if (distSq > 0 && distSq < minDist * minDist && a.hitCooldown === 0 && b.hitCooldown === 0) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) * 0.5;

          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          const tempVx = a.vx;
          const tempVy = a.vy;
          a.vx = b.vx * 0.9;
          a.vy = b.vy * 0.9;
          b.vx = tempVx * 0.9;
          b.vy = tempVy * 0.9;

          a.alpha -= 0.14;
          b.alpha -= 0.14;
          a.hitCooldown = 5;
          b.hitCooldown = 5;

          if (particles.length < 380) {
            emitCollisionBurst((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, Math.min(a.bornAt, b.bornAt));
          }
        }
      }
    }

    const now = performance.now();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = now - p.bornAt;
      const lifeRatio = age / p.maxAge;

      // 滿 3 秒強制消散移除
      if (age >= p.maxAge) {
        particles.splice(i, 1);
        continue;
      }

      // 最後 0.6 秒平滑收斂至透明，確保 3 秒時完全消散
      if (lifeRatio > 0.8) {
        const tailProgress = (lifeRatio - 0.8) / 0.2;
        p.alpha = Math.min(p.alpha, 0.95 * (1 - tailProgress));
      } else {
        p.alpha -= p.decay;
      }

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (particles.length > 0) {
      particleRafId = requestAnimationFrame(runParticleLoop);
    } else {
      particleRafId = null;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  // 配合黑底消散，僅在圖片周圍噴灑細小單色粒子（3 秒內完全消散）
  function triggerBackgroundDissolve() {
    if (bgDissolveTriggered) return;
    bgDissolveTriggered = true;
    document.body.classList.add("is-remover-bg-dissolving");

    spawnAroundTargetBatch(previewBtn, 48);
    let waves = 0;
    bgParticleIntervalId = setInterval(() => {
      waves += 1;
      spawnAroundTargetBatch(previewBtn, 36);
      if (waves >= 2) {
        clearInterval(bgParticleIntervalId);
        bgParticleIntervalId = null;
      }
    }, 650);
  }

  function fitCardToImage(imgEl, cardEl, maxWLimit = Math.min(420, window.innerWidth * 0.76), maxHLimit = window.innerHeight * 0.46) {
    const nw = imgEl.naturalWidth || 400;
    const nh = imgEl.naturalHeight || 300;
    const ratio = nw / nh;

    let w = maxWLimit;
    let h = w / ratio;
    if (h > maxHLimit) {
      h = maxHLimit;
      w = h * ratio;
    }
    cardEl.style.width = `${Math.round(w)}px`;
    cardEl.style.height = `${Math.round(h)}px`;
    return { w: Math.round(w), h: Math.round(h) };
  }

  function applyUploadedImage(src) {
    if (!src) return;
    uploadedSrc = src;
    previewImg.onload = () => {
      if (!chaosStarted) {
        fitCardToImage(previewImg, previewBtn);
      }
    };
    previewImg.src = src;
    if (previewImg.complete && previewImg.naturalWidth && !chaosStarted) {
      fitCardToImage(previewImg, previewBtn);
    }
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          applyUploadedImage(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function handleDownloadSectionVisible() {
    const isVisible = !downloadSection.hidden && downloadSection.offsetParent !== null;
    if (isVisible && !resultEntered) {
      resultEntered = true;
      document.body.classList.add("is-remover-result");
      dissolveDelayTimerId = setTimeout(() => {
        triggerBackgroundDissolve();
      }, 1000);
    }

    const flowImg = previewBtn.querySelector("img:not([data-remover-img])");
    if (flowImg && flowImg.src) {
      applyUploadedImage(flowImg.src);
    }
  }

  const sectionObserver = new MutationObserver(handleDownloadSectionVisible);
  sectionObserver.observe(downloadSection, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["hidden", "style", "class", "src"]
  });
  handleDownloadSectionVisible();

  // 收集頁面中需要被撞擊消散的目標（「惡魔低語」、「耳機客服」與 [data-thanos-item]）
  function collectCollisionTargets() {
    const targetSet = new Set(document.querySelectorAll("[data-thanos-item]"));
    const candidates = document.querySelectorAll("a, button, li, [role='button'], [data-nav-item], nav *, header *");

    candidates.forEach((el) => {
      if (el === previewBtn || previewBtn.contains(el) || el.contains(previewBtn)) return;
      const text = (el.textContent || "").trim();
      if (!text || text.length > 24) return;
      if (COLLISION_KEYWORDS.some((kw) => text.includes(kw))) {
        // 優先取按鈕或連結外層，避免只讓裡面的 span 消失而外框還在
        const clickable = el.closest("a, button, li, [role='button']") || el;
        if (!clickable.contains(previewBtn)) {
          targetSet.add(clickable);
        }
      }
    });

    return Array.from(targetSet);
  }

  // 讓單一元件立刻消散並噴出粒子
  function dissolveTargetElement(el) {
    if (!el || el.classList.contains("thanos-gone")) return;
    el.classList.remove("is-restored");
    el.classList.add("thanos-gone");
    el.style.pointerEvents = "none";
    spawnParticlesFromElement(el, 64);
  }

  // 檢查飛行圖片是否與目標元件重疊碰撞
  function checkImageCollisions(imgLeft, imgTop, imgRight, imgBottom) {
    if (!collisionTargets.length) return;
    for (let i = collisionTargets.length - 1; i >= 0; i--) {
      const el = collisionTargets[i];
      if (!el || el.classList.contains("thanos-gone")) {
        collisionTargets.splice(i, 1);
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;

      const isHit =
        imgLeft < r.right &&
        imgRight > r.left &&
        imgTop < r.bottom &&
        imgBottom > r.top;

      if (isHit) {
        dissolveTargetElement(el);
        collisionTargets.splice(i, 1);
      }
    }
  }

  // 精準銜接原本卡片位置與尺寸，並以較快的速度反彈亂飄
  function startBouncing() {
    const rect = previewBtn.getBoundingClientRect();
    const currentW = Math.round(rect.width) || previewBtn.offsetWidth || 240;
    const currentH = Math.round(rect.height) || previewBtn.offsetHeight || 180;

    // 停掉 idle 呼吸動畫與 CSS transition 干擾，避免位移變慢或卡頓
    previewBtn.style.animation = "none";
    previewBtn.style.transition = "none";
    previewBtn.style.width = `${currentW}px`;
    previewBtn.style.height = `${currentH}px`;
    previewBtn.style.maxWidth = "none";
    previewBtn.style.maxHeight = "none";
    previewBtn.classList.add("is-bouncing");

    collisionTargets = collectCollisionTargets();

    let x = Math.max(0, Math.min(window.innerWidth - currentW, rect.left));
    let y = Math.max(0, Math.min(window.innerHeight - currentH, rect.top));
    let vx = (Math.random() > 0.5 ? 1 : -1) * (BOUNCE_BASE_VX + Math.random() * BOUNCE_RANDOM_JITTER);
    let vy = (Math.random() > 0.5 ? 1 : -1) * (BOUNCE_BASE_VY + Math.random() * BOUNCE_RANDOM_JITTER);

    previewBtn.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    const tick = () => {
      const w = previewBtn.offsetWidth || currentW;
      const h = previewBtn.offsetHeight || currentH;
      const limitX = Math.max(0, window.innerWidth - w);
      const limitY = Math.max(0, window.innerHeight - h);

      x += vx;
      y += vy;

      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx);
      } else if (x >= limitX) {
        x = limitX;
        vx = -Math.abs(vx);
      }

      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy);
      } else if (y >= limitY) {
        y = limitY;
        vy = -Math.abs(vy);
      }

      previewBtn.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      checkImageCollisions(x, y, x + w, y + h);
      bounceRafId = requestAnimationFrame(tick);
    };

    bounceRafId = requestAnimationFrame(tick);
  }

  function startStaggeredVanishAndRestore() {
    vanishTimers.forEach((id) => clearTimeout(id));
    vanishTimers = [];
    if (restoreTimerId) clearTimeout(restoreTimerId);

    const items = Array.from(document.querySelectorAll("[data-thanos-item]"));
    const spanMs = 5000;
    const stepMs = items.length > 1 ? spanMs / (items.length - 1) : 0;

    items.forEach((el, i) => {
      const tid = setTimeout(() => {
        dissolveTargetElement(el);
      }, Math.round(i * stepMs));
      vanishTimers.push(tid);
    });

    restoreTimerId = setTimeout(() => {
      if (backBtn) {
        backBtn.classList.remove("thanos-gone");
        backBtn.classList.add("is-restored");
        backBtn.style.pointerEvents = "";
      }
    }, 10000);
  }

  previewBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (chaosStarted) return;
    chaosStarted = true;

    triggerBackgroundDissolve();
    document.body.classList.add("is-remover-chaotic");
    startBouncing();
    startStaggeredVanishAndRestore();
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    if (!chaosStarted && uploadedSrc) {
      fitCardToImage(previewImg, previewBtn);
    }
  });

  window.addEventListener("pagehide", () => {
    sectionObserver.disconnect();
    if (dissolveDelayTimerId) clearTimeout(dissolveDelayTimerId);
    if (bgParticleIntervalId) clearInterval(bgParticleIntervalId);
    if (bounceRafId) cancelAnimationFrame(bounceRafId);
    if (particleRafId) cancelAnimationFrame(particleRafId);
    vanishTimers.forEach((id) => clearTimeout(id));
    if (restoreTimerId) clearTimeout(restoreTimerId);
  });
})();