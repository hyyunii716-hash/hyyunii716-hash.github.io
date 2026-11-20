/* ==========================================================================
   Three.js 水波物理模擬 + #mark 水紋扭曲 + 隨 scroll 淡出的副標與彩蛋小字
   ========================================================================== */
(() => {
  if (typeof THREE === "undefined") return;

  const domWrap = document.getElementById("dreamSubtitleWrap");
  const domText = domWrap ? domWrap.querySelector(".dream-subtitle") : null;
  const mainMark = document.getElementById("mark");

  let container = document.querySelector(".dream-water-canvas-wrap");
  if (!container) {
    container = document.createElement("div");
    container.className = "dream-water-canvas-wrap";
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);
  }
  container.innerHTML = "";
  container.style.cssText =
    "position:fixed;inset:0;z-index:25;pointer-events:none;overflow:hidden;";

  const simScale = window.innerWidth < 768 ? 0.35 : 0.45;
  const waveSpeed = 0.9;
  const rippleSize = 24;

  const SUBTITLE_Y_RATIO = 0.68;
  const INTRO_AUTO_WAVE_MS = 3800;
  const MARK_RIPPLE_MS = 1800;

  const rawMouse = { x: -9999, y: -9999 };
  const introStartTime = performance.now();
  let userHasMovedMouse = false;
  let lastAmbientPulseTime = -9999;

  /* --- 0. #mark 水紋扭曲與由中往外清晰 --- */
  let svgFilterHost = null;
  let feTurb = null;
  let feDisp = null;
  let feBlur = null;
  let markEffectCleaned = false;
  const filterId = "abandon-mark-water-wave";

  if (mainMark) {
    svgFilterHost = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    svgFilterHost.setAttribute("aria-hidden", "true");
    svgFilterHost.style.cssText =
      "position:fixed;width:0;height:0;overflow:hidden;pointer-events:none;";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const filter = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "filter",
    );
    filter.setAttribute("id", filterId);
    filter.setAttribute("x", "-20%");
    filter.setAttribute("y", "-40%");
    filter.setAttribute("width", "140%");
    filter.setAttribute("height", "180%");

    feTurb = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feTurbulence",
    );
    feTurb.setAttribute("type", "fractalNoise");
    feTurb.setAttribute("baseFrequency", "0.012 0.045");
    feTurb.setAttribute("numOctaves", "2");
    feTurb.setAttribute("seed", "7");
    feTurb.setAttribute("result", "noise");

    feDisp = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feDisplacementMap",
    );
    feDisp.setAttribute("in", "SourceGraphic");
    feDisp.setAttribute("in2", "noise");
    feDisp.setAttribute("scale", "24");
    feDisp.setAttribute("xChannelSelector", "R");
    feDisp.setAttribute("yChannelSelector", "G");
    feDisp.setAttribute("result", "displaced");

    feBlur = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feGaussianBlur",
    );
    feBlur.setAttribute("in", "displaced");
    feBlur.setAttribute("stdDeviation", "5");

    filter.appendChild(feTurb);
    filter.appendChild(feDisp);
    filter.appendChild(feBlur);
    defs.appendChild(filter);
    svgFilterHost.appendChild(defs);
    document.body.appendChild(svgFilterHost);
  }

  function cleanupMarkEffect() {
    if (!mainMark || markEffectCleaned) return;
    markEffectCleaned = true;
    mainMark.style.filter = "";
    mainMark.style.webkitMaskImage = "";
    mainMark.style.maskImage = "";
    if (svgFilterHost && svgFilterHost.parentNode) {
      svgFilterHost.parentNode.removeChild(svgFilterHost);
    }
  }

  function updateExistingMarkWave(elapsedMs) {
    if (!mainMark || markEffectCleaned) return;

    const p = Math.min(1, Math.max(0, elapsedMs / MARK_RIPPLE_MS));
    if (p >= 1) {
      cleanupMarkEffect();
      return;
    }

    const eased = 1 - Math.pow(1 - p, 2.2);
    const remain = 1 - eased;

    if (feTurb && feDisp && feBlur) {
      const phaseX = 0.01 + Math.sin(elapsedMs * 0.004) * 0.003;
      const phaseY = 0.032 + Math.cos(elapsedMs * 0.006) * 0.01;
      feTurb.setAttribute(
        "baseFrequency",
        `${phaseX.toFixed(4)} ${phaseY.toFixed(4)}`,
      );
      feDisp.setAttribute("scale", (remain * 28).toFixed(1));
      feBlur.setAttribute("stdDeviation", (remain * 6).toFixed(2));
    }

    const spreadX = 12 + eased * 125;
    const spreadY = 18 + eased * 125;
    const softEdge = Math.min(150, spreadX + remain * 28 + 12);
    const maskVal = `radial-gradient(ellipse ${softEdge}% ${Math.min(150, spreadY + remain * 24)}% at 50% 50%, #000 ${spreadX * 0.45}%, rgba(0,0,0,${(0.35 + eased * 0.65).toFixed(2)}) ${spreadX}%, transparent ${softEdge}%)`;

    mainMark.style.filter = `url(#${filterId})`;
    mainMark.style.webkitMaskImage = maskVal;
    mainMark.style.maskImage = maskVal;
  }

  /* --- 1. 文字 Canvas（夢境副標 + 彩蛋小字） --- */
  const textCanvas = document.createElement("canvas");
  const textCtx = textCanvas.getContext("2d");

  function drawContent(timeSec = 0) {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    textCanvas.width = Math.max(1, Math.floor(w * dpr));
    textCanvas.height = Math.max(1, Math.floor(h * dpr));
    textCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    textCtx.clearRect(0, 0, w, h);

    const secretSpans = document.querySelectorAll(".cover-secret-text span");
    secretSpans.forEach((span, idx) => {
      const label = (span.textContent || "").trim();
      if (!label) return;
      const rect = span.getBoundingClientRect();
      if (!rect.width && !rect.height) return;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(rawMouse.x - cx, rawMouse.y - cy);
      const reveal = Math.max(0, Math.min(1, 1 - dist / 220));
      if (reveal <= 0.02) return;

      const floatX = Math.sin(timeSec * 0.8 + idx * 1.4) * 5;
      const floatY = Math.cos(timeSec * 0.65 + idx * 1.7) * 6;

      const cs = getComputedStyle(span);
      textCtx.save();
      textCtx.font = `${cs.fontWeight || "500"} ${cs.fontSize || "13px"} ${cs.fontFamily || "sans-serif"}`;
      textCtx.textAlign = "left";
      textCtx.textBaseline = "top";
      textCtx.globalAlpha = reveal * 0.9;
      textCtx.fillStyle = "rgba(220, 234, 255, 0.95)";
      textCtx.fillText(label, rect.left + floatX, rect.top + floatY);
      textCtx.restore();
    });

    const bodyStyle = getComputedStyle(document.body);
    const subStyle = domText ? getComputedStyle(domText) : bodyStyle;
    const fontFamily =
      subStyle.fontFamily && subStyle.fontFamily !== "inherit"
        ? subStyle.fontFamily
        : bodyStyle.fontFamily || '"Noto Sans TC", sans-serif';
    const fontWeight = bodyStyle.fontWeight || "500";

    const text =
      (domText && domText.textContent.trim()) || "您已進入設計師的夢魘";
    const fs = Math.min(34, Math.max(22, w * 0.02));
    const tx = w * 0.5;
    const ty = h * SUBTITLE_Y_RATIO;

    textCtx.font = `${fontWeight} ${fs}px ${fontFamily}`;
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";

    textCtx.save();
    textCtx.shadowColor = "rgba(155, 130, 255, 0.55)";
    textCtx.shadowBlur = 18;
    textCtx.fillStyle = "rgba(255, 255, 255, 0.96)";
    textCtx.fillText(text, tx, ty);
    textCtx.restore();
  }

  /* --- 2. Three.js WebGL 初始化 --- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  } catch (err) {
    cleanupMarkEffect();
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const isWebGL2 = Boolean(
    renderer.capabilities && renderer.capabilities.isWebGL2,
  );
  let rtType = THREE.UnsignedByteType;
  if (isWebGL2) {
    try {
      rtType = THREE.FloatType;
    } catch (e) {
      rtType = THREE.UnsignedByteType;
    }
  } else if (THREE.HalfFloatType !== undefined) {
    rtType = THREE.HalfFloatType;
  }

  let resolution = new THREE.Vector2(
    Math.max(1, Math.floor(window.innerWidth * simScale)),
    Math.max(1, Math.floor(window.innerHeight * simScale)),
  );

  const rtOptions = {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: rtType,
    depthBuffer: false,
    stencilBuffer: false,
  };

  let renderTargetA = new THREE.WebGLRenderTarget(
    resolution.x,
    resolution.y,
    rtOptions,
  );
  let renderTargetB = new THREE.WebGLRenderTarget(
    resolution.x,
    resolution.y,
    rtOptions,
  );

  drawContent(0);
  const textTexture = new THREE.CanvasTexture(textCanvas);
  textTexture.minFilter = THREE.LinearFilter;
  textTexture.magFilter = THREE.LinearFilter;
  textTexture.needsUpdate = true;

  /* --- 3. 水波模擬 Shader --- */
  const simMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: null },
      uResolution: { value: new THREE.Vector2(resolution.x, resolution.y) },
      uMouse: { value: new THREE.Vector3(-1, -1, 0) },
      uDelta: { value: waveSpeed },
      uDamping: { value: 0.985 },
      uRippleSize: { value: rippleSize },
      uStrength: { value: 1.1 },
      uShockwave: { value: 0.0 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform vec2 uResolution;
      uniform vec3 uMouse;
      uniform float uDelta;
      uniform float uDamping;
      uniform float uRippleSize;
      uniform float uStrength;
      uniform float uShockwave;
      varying vec2 vUv;

      void main(){
        vec2 texel = 1.0 / uResolution;
        vec2 coord = vUv;
        vec4 data = texture2D(uTexture, coord);
        float pressure = data.x;
        float velocity = data.y;

        float p_right = texture2D(uTexture, coord + vec2(texel.x, 0.0)).x;
        float p_left  = texture2D(uTexture, coord + vec2(-texel.x, 0.0)).x;
        float p_up    = texture2D(uTexture, coord + vec2(0.0, texel.y)).x;
        float p_down  = texture2D(uTexture, coord + vec2(0.0, -texel.y)).x;
        float p_tr    = texture2D(uTexture, coord + vec2(texel.x, texel.y)).x;
        float p_tl    = texture2D(uTexture, coord + vec2(-texel.x, texel.y)).x;
        float p_br    = texture2D(uTexture, coord + vec2(texel.x, -texel.y)).x;
        float p_bl    = texture2D(uTexture, coord + vec2(-texel.x, -texel.y)).x;

        if (coord.x < texel.x) p_left = p_right;
        if (coord.x > 1.0 - texel.x) p_right = p_left;
        if (coord.y < texel.y) p_down = p_up;
        if (coord.y > 1.0 - texel.y) p_up = p_down;

        float laplacian = (p_right + p_left + p_up + p_down) * 0.2 +
                          (p_tr + p_tl + p_br + p_bl) * 0.05 -
                          pressure;

        velocity += uDelta * laplacian * 2.0;
        pressure += uDelta * velocity;

        pressure = mix(pressure, (p_right + p_left + p_up + p_down) * 0.3, 0.05);

        velocity -= 0.002 * uDelta * pressure;
        velocity *= 1.0 - 0.01 * uDelta;
        pressure *= uDamping;

        if (uMouse.z > 0.5) {
          float dist = distance(coord * uResolution, uMouse.xy);
          float force = exp(-dist * dist / (uRippleSize * uRippleSize * 0.55));
          pressure += force * uStrength;
        }

        if (uShockwave > 0.1) {
          float dist = distance(coord * uResolution, uMouse.xy);
          float shockwaveRadius = uRippleSize * 3.8;
          float shockwaveThickness = 75.0;
          float distFromShockwave = abs(dist - shockwaveRadius);
          if (distFromShockwave < shockwaveThickness) {
            float shockStrength = smoothstep(shockwaveThickness, 0.0, distFromShockwave);
            pressure += pow(shockStrength, 5.5) * 0.45;
          }
        }

        pressure = clamp(pressure, -1.5, 1.5);
        velocity = clamp(velocity, -1.5, 1.5);

        float gradX = (p_right - p_left) / 2.0;
        float gradY = (p_up - p_down) / 2.0;

        gl_FragColor = vec4(pressure, velocity, gradX, gradY);
      }
    `,
  });

  /* --- 4. 顯示 Shader --- */
  const displayMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: null },
      uContentTexture: { value: textTexture },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uIsMobile: { value: window.innerWidth < 768 },
      uFade: { value: 1.0 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform sampler2D uContentTexture;
      uniform vec2 uResolution;
      uniform bool uIsMobile;
      uniform float uFade;
      varying vec2 vUv;

      void main(){
        vec4 data = texture2D(uTexture, vUv);
        vec2 distortion = data.zw * 0.36;
        float waveHeight = data.x;

        vec4 texR = texture2D(uContentTexture, vUv + distortion * 0.95);
        vec4 texG = texture2D(uContentTexture, vUv + distortion * 0.90);
        vec4 texB = texture2D(uContentTexture, vUv + distortion * 0.85);

        vec3 color = vec3(texR.r, texG.g, texB.b);
        float textAlpha = max(texR.a, max(texG.a, texB.a));

        vec3 normal = normalize(vec3(-data.z * 4.5, 0.5, -data.w * 4.5));
        vec3 lightDir = normalize(vec3(-2.0, 5.0, 3.0));
        float spec = pow(max(0.0, dot(normal, lightDir)), 320.0);
        color += vec3(1.0, 1.0, 1.0) * spec * 1.1;

        vec3 backLightDir = normalize(vec3(2.0, 5.0, -3.0));
        float backSpec = pow(max(0.0, dot(normal, backLightDir)), 140.0);
        color += vec3(0.75, 0.85, 1.0) * backSpec * 0.25;

        color += vec3(0.32, 0.52, 0.98) * abs(waveHeight) * 0.55;

        if (!uIsMobile) {
          float spec2 = pow(max(0.0, dot(normal, lightDir)), 55.0);
          color += vec3(0.88, 0.94, 1.0) * spec2 * 0.5;
        }

        float waterAlpha = abs(waveHeight) * 0.26 + spec * 0.75 + length(distortion) * 0.42;
        waterAlpha = clamp(waterAlpha, 0.0, 0.55);
        float finalAlpha = clamp(max(textAlpha, waterAlpha) * uFade, 0.0, 1.0);

        gl_FragColor = vec4(color, finalAlpha);
      }
    `,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const simScene = new THREE.Scene();
  const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  simScene.add(new THREE.Mesh(geometry, simMaterial));

  const dispScene = new THREE.Scene();
  const dispCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  dispScene.add(new THREE.Mesh(geometry, displayMaterial));

  let currentTarget = renderTargetA;
  let previousTarget = renderTargetB;

  const mouse = new THREE.Vector2(-1, -1);
  const prevMouse = new THREE.Vector2(-1, -1);
  const prevPrevMouse = new THREE.Vector2(-1, -1);
  let isMouseActive = false;
  let shouldTriggerShockwave = false;
  let shockwaveTime = 0;
  let lastSecretUpdate = 0;

  const ambientSpots = [
    { xRatio: 0.36, yRatio: SUBTITLE_Y_RATIO },
    { xRatio: 0.5, yRatio: SUBTITLE_Y_RATIO },
    { xRatio: 0.64, yRatio: SUBTITLE_Y_RATIO },
  ];
  let ambientSpotIndex = 0;

  function updateMouseFromCoords(clientX, clientY) {
    rawMouse.x = clientX;
    rawMouse.y = clientY;
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    mouse.x = (clientX - rect.left) * simScale;
    mouse.y = (rect.height - (clientY - rect.top)) * simScale;
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      userHasMovedMouse = true;
      isMouseActive = true;
      updateMouseFromCoords(e.clientX, e.clientY);
    },
    { passive: true },
  );

  window.addEventListener(
    "pointerleave",
    () => {
      isMouseActive = false;
    },
    { passive: true },
  );

  if (domWrap) {
    domWrap.style.opacity = "0";
    domWrap.style.pointerEvents = "none";
  }

  function animateWater(currentTime) {
    requestAnimationFrame(animateWater);

    const maxScroll = Math.max(
      1,
      (document.getElementById("coverTrack")?.offsetHeight ||
        window.innerHeight * 2) - window.innerHeight,
    );
    const scrollP = Math.min(1, Math.max(0, (window.scrollY || 0) / maxScroll));
    const fade = Math.max(0, 1 - Math.min(1, scrollP / 0.35));

    const elapsedIntro = currentTime - introStartTime;
    updateExistingMarkWave(elapsedIntro);

    if (fade <= 0.01) {
      container.style.visibility = "hidden";
      return;
    }
    container.style.visibility = "visible";

    if (currentTime - lastSecretUpdate > 200) {
      lastSecretUpdate = currentTime;
      drawContent(currentTime * 0.001);
      textTexture.needsUpdate = true;
    }

    const inAutoIntro = !userHasMovedMouse && elapsedIntro < INTRO_AUTO_WAVE_MS;

    let activeInput = false;
    let inputX = mouse.x;
    let inputY = mouse.y;
    let currentDamping = 0.985;
    let currentStrength = 1.1;

    if (inAutoIntro) {
      currentDamping = 0.99;
      currentStrength = 0.55;

      if (
        elapsedIntro < INTRO_AUTO_WAVE_MS * 0.72 &&
        currentTime - lastAmbientPulseTime > 600
      ) {
        lastAmbientPulseTime = currentTime;
        const spot = ambientSpots[ambientSpotIndex % ambientSpots.length];
        ambientSpotIndex++;
        const sx = window.innerWidth * spot.xRatio;
        const sy = window.innerHeight * spot.yRatio;
        inputX = sx * simScale;
        inputY = (window.innerHeight - sy) * simScale;
        activeInput = true;
      }
    } else if (isMouseActive) {
      const mouseMoved =
        Math.abs(mouse.x - prevMouse.x) > 0.4 ||
        Math.abs(mouse.y - prevMouse.y) > 0.4;
      activeInput = mouseMoved;
    }

    if (isMouseActive) {
      const dx = mouse.x - prevMouse.x;
      const dy = mouse.y - prevMouse.y;
      const prevDx = prevMouse.x - prevPrevMouse.x;
      const prevDy = prevMouse.y - prevPrevMouse.y;
      const movement = Math.sqrt(dx * dx + dy * dy);
      const prevMovement = Math.sqrt(prevDx * prevDx + prevDy * prevDy);

      if (prevMovement > 2 && movement < 1) {
        shouldTriggerShockwave = true;
        shockwaveTime = 0;
      }
      if (movement > 1 && prevMovement > 1) {
        const dot = dx * prevDx + dy * prevDy;
        const denom = Math.max(0.0001, movement * prevMovement);
        const angle = Math.acos(Math.min(1, Math.max(-1, dot / denom)));
        if (angle > Math.PI / 3) {
          shouldTriggerShockwave = true;
          shockwaveTime = 0;
        }
      }
    }

    if (shockwaveTime < 10) shockwaveTime++;

    simMaterial.uniforms.uTexture.value = previousTarget.texture;
    simMaterial.uniforms.uMouse.value.set(inputX, inputY, activeInput ? 1 : 0);
    simMaterial.uniforms.uDelta.value = waveSpeed;
    simMaterial.uniforms.uDamping.value = currentDamping;
    simMaterial.uniforms.uRippleSize.value = rippleSize;
    simMaterial.uniforms.uStrength.value = currentStrength;
    simMaterial.uniforms.uShockwave.value =
      shouldTriggerShockwave && shockwaveTime < 2 ? 1.0 : 0.0;

    renderer.setRenderTarget(currentTarget);
    renderer.render(simScene, simCamera);

    displayMaterial.uniforms.uTexture.value = currentTarget.texture;
    displayMaterial.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight,
    );
    displayMaterial.uniforms.uFade.value = fade;
    renderer.setRenderTarget(null);
    renderer.render(dispScene, dispCamera);

    [currentTarget, previousTarget] = [previousTarget, currentTarget];
    prevPrevMouse.copy(prevMouse);
    prevMouse.copy(mouse);

    if (shockwaveTime > 3) shouldTriggerShockwave = false;
  }

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    displayMaterial.uniforms.uIsMobile.value = w < 768;

    resolution.set(
      Math.max(1, Math.floor(w * simScale)),
      Math.max(1, Math.floor(h * simScale)),
    );
    renderTargetA.setSize(resolution.x, resolution.y);
    renderTargetB.setSize(resolution.x, resolution.y);
    simMaterial.uniforms.uResolution.value.copy(resolution);

    drawContent(performance.now() * 0.001);
    textTexture.needsUpdate = true;
  }

  window.addEventListener("resize", onResize, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      drawContent(performance.now() * 0.001);
      textTexture.needsUpdate = true;
    });
  }

  requestAnimationFrame(animateWater);
})();
