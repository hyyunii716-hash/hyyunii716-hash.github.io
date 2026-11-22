/* =========================================================
   Abandon — 首頁漣漪封面雙軌音效（cover-dream-audio.js）
   - 底層：神秘首頁.mp3 循環播放
   - 疊加：滑鼠移動時，shiny.mp3 以「隨機音量 + 隨機間隔 + 前後交疊淡入淡出」連續播放；
           滑鼠停下來就收尾，離開封面（漣漪淡出）也會停

   為什麼之前聽不到 shiny：
   1. fullpage-snap.js 為了擋掉別處的「掉落字」，把 window / document / body 上的 mousemove
      監聽整個丟掉了，所以原本 window.addEventListener('mousemove') 根本沒有生效。
      → 改用 pointermove（漣漪 liquid-water-dream.js 也是用它）。
   2. 就算觸發了，備援播放用 audio.volume = 1~5，瀏覽器只收 0~1，會丟錯誤把整個循環中斷。
   3. shiny.mp3 前 0.3 秒幾乎無聲（約 -50dB），每 90~230ms 就從頭重播並馬上切掉，等於一直在播靜音。
      → 現在每一聲從檔案的「聲音本體」隨機切一段，前後疊著淡入淡出。
   ========================================================= */
(() => {
  'use strict';

  // ★ 快速調整區 ★
  const BGM_CANDIDATES = [
    'audio/神秘森林.mp3',
    './audio/神秘森林.mp3',
    '神秘森林.mp3',
    './神秘森林.mp3'
  ];
  const SHINY_CANDIDATES = [
    'audio/shiny.mp3',
    './audio/shiny.mp3',
    'shiny.mp3',
    './shiny.mp3'
  ];

  const BGM_VOLUME = 0.95;       // 背景音樂音量（0~1）
  const MIN_GAIN = 2.2;          // 每一聲 shiny 的隨機音量下限／上限。
  const MAX_GAIN = 4.8;          //   shiny.mp3 本身偏小聲（最大約 -10.8dB）；高頻收掉之後整體會小一些，所以比之前大
  const LOWPASS_HZ = 6000;       // 柔化：高於這個頻率的聲音會被快速削掉（24dB/oct）。
                                 //   shiny.mp3 約 70% 的能量在 6kHz 以上、最強的一根在 9.4kHz，連續疊起來就是「割玻璃」的感覺。
                                 //   覺得太悶就調高（7000、8000），還是尖就調低（5000、4500）
  const MIN_GAP_MS = 90;         // 兩聲之間的隨機間隔
  const MAX_GAP_MS = 230;
  const SLICE_MIN = 0.6;         // 每一聲播放的長度（秒，隨機）
  const SLICE_MAX = 1.1;
  const OFFSET_MIN = 0.25;       // 從 shiny.mp3 第幾秒開始切（隨機；前 0.3 秒幾乎無聲所以避開）
  const OFFSET_MAX = 1.6;
  const FADE_IN = 0.12;          // 每一聲的淡入／淡出（秒），疊起來就是順暢的銜接
  const FADE_OUT = 0.4;
  const MAX_VOICES = 3;          // 同時最多疊幾聲，超過就把最舊的快速淡掉（疊越多越刺耳）
  const RATE_JITTER = 0;         // 每一聲音高隨機偏移幅度。預設關閉：音高只差一點點的高頻疊在一起會互相「拍頻」，變得很尖；想要更多變化可設 0.01
  const IDLE_MS = 220;           // 滑鼠停超過這麼久就不再觸發
  const COVER_FADE_END = 0.34;   // 捲動到封面的這個比例後（漣漪已淡出）就停

  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- 工具 ---------- */
  async function firstAvailable(candidates, method) {
    for (const raw of candidates) {
      const url = encodeURI(raw);
      try {
        const res = await fetch(url, { method, cache: 'no-store' });
        if (res.ok) return url;
      } catch (_) { /* 試下一個路徑 */ }
    }
    return encodeURI(candidates[0]);
  }

  // 只下載一次 shiny.mp3 的原始資料（解碼等 AudioContext 建好再做）
  const shinyData = (async () => {
    for (const raw of SHINY_CANDIDATES) {
      try {
        const res = await fetch(encodeURI(raw));
        if (res.ok) return await res.arrayBuffer();
      } catch (_) { /* 試下一個路徑 */ }
    }
    console.warn('[cover-dream-audio] 找不到 shiny.mp3，已嘗試：', SHINY_CANDIDATES.join('、'));
    return null;
  })();

  function decode(ctx, ab) {
    return new Promise((resolve, reject) => {
      const p = ctx.decodeAudioData(ab, resolve, reject);   // 舊版 Safari 只支援 callback
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    });
  }

  /* ---------- 背景音樂（用原生 audio，不經過 AudioContext，互不影響） ---------- */
  let bgmEl = null;
  let bgmPlaying = false;

  async function initBgm() {
    const url = await firstAvailable(BGM_CANDIDATES, 'HEAD');
    bgmEl = new Audio(url);
    bgmEl.loop = true;
    bgmEl.preload = 'auto';
    bgmEl.volume = BGM_VOLUME;
    bgmEl.addEventListener('error', () => {
      console.warn('[cover-dream-audio] 找不到或無法讀取音檔:', url);
    });
    tryPlayBgm();
  }

  function tryPlayBgm() {
    if (!bgmEl || bgmPlaying) return;
    const p = bgmEl.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { bgmPlaying = true; maybeDone(); }).catch(() => { /* 等使用者互動解鎖 */ });
    }
  }

  /* ---------- shiny：WebAudio ---------- */
  let ctx = null;
  let master = null;
  let shinyBuffer = null;
  let decoding = false;
  const voices = [];            // { fader, endT }

  function ensureCtx() {
    if (ctx) return ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();

    master = ctx.createGain();
    master.gain.value = 0.9;
    const limiter = ctx.createDynamicsCompressor();       // 多聲疊起來時防爆音
    limiter.threshold.value = -10;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    // 柔化：兩級低通疊起來 = 24dB/oct，把 shiny.mp3 偏刺耳的 6~12kHz 收掉，保留中高頻的閃爍感
    const lp1 = ctx.createBiquadFilter();
    const lp2 = ctx.createBiquadFilter();
    [lp1, lp2].forEach((f) => { f.type = 'lowpass'; f.frequency.value = LOWPASS_HZ; f.Q.value = 0.707; });
    master.connect(lp1);
    lp1.connect(lp2);
    lp2.connect(limiter);
    limiter.connect(ctx.destination);

    prepareBuffer();
    return ctx;
  }

  async function prepareBuffer() {
    if (shinyBuffer || decoding || !ctx) return;
    decoding = true;
    try {
      const data = await shinyData;
      if (data) shinyBuffer = await decode(ctx, data.slice(0));
    } catch (err) {
      console.warn('[cover-dream-audio] shiny.mp3 解碼失敗：', err);
    } finally {
      decoding = false;
    }
  }

  function resumeCtx() {
    const c = ensureCtx();
    if (c && c.state !== 'running') c.resume().catch(() => {});
  }

  function playVoice() {
    const now = ctx.currentTime;
    const start = now + 0.005;
    const len = Math.min(rand(SLICE_MIN, SLICE_MAX), shinyBuffer.duration - 0.1);
    const offset = rand(OFFSET_MIN, Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, shinyBuffer.duration - len - 0.05)));
    const peak = rand(MIN_GAIN, MAX_GAIN);                 // 這一聲的隨機音量

    const src = ctx.createBufferSource();
    src.buffer = shinyBuffer;
    src.playbackRate.value = 1 + rand(-RATE_JITTER, RATE_JITTER);

    const env = ctx.createGain();                           // 這一聲自己的淡入淡出
    const fadeIn = Math.min(FADE_IN, len / 3), fadeOut = Math.min(FADE_OUT, len / 2);
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(peak, start + fadeIn);
    env.gain.setValueAtTime(peak, start + len - fadeOut);
    env.gain.linearRampToValueAtTime(0, start + len);

    const fader = ctx.createGain();                         // 另外一層：被擠掉時才動它，不跟 env 的排程打架
    src.connect(env);
    env.connect(fader);
    fader.connect(master);

    src.start(start, offset, len + 0.05);
    src.stop(start + len + 0.1);

    const voice = { fader, endT: start + len };
    voices.push(voice);
    src.onended = () => {
      const i = voices.indexOf(voice);
      if (i >= 0) voices.splice(i, 1);
      try { src.disconnect(); env.disconnect(); fader.disconnect(); } catch (_) {}
    };

    // 疊太多聲：把最舊的那聲快速淡掉（交叉淡出，不是硬切）
    const active = voices.filter((v) => v.endT > now && !v.dying);
    if (active.length > MAX_VOICES) {
      const oldest = active[0];
      oldest.dying = true;
      oldest.fader.gain.setTargetAtTime(0.0001, now, 0.05);
    }
  }

  /* ---------- 觸發：滑鼠移動 ---------- */
  const track = document.getElementById('coverTrack');
  function coverActive() {
    if (!track) return true;
    const max = Math.max(1, track.offsetHeight - window.innerHeight);
    return Math.min(1, Math.max(0, (window.scrollY || 0) / max)) < COVER_FADE_END;
  }

  let lastMoveT = -1e9;
  let timer = null;

  function shouldPlay() {
    return !!(ctx && ctx.state === 'running' && shinyBuffer && !document.hidden &&
              performance.now() - lastMoveT < IDLE_MS && coverActive());
  }

  function loop() {
    timer = null;
    if (!shouldPlay()) return;                              // 滑鼠停了／離開封面：不再排下一聲，已在播的自然收尾
    playVoice();
    timer = setTimeout(loop, rand(MIN_GAP_MS, MAX_GAP_MS)); // 隨機間隔
  }

  let lastResumeTry = 0;
  window.addEventListener('pointermove', () => {
    const now = performance.now();
    lastMoveT = now;
    if (!ctx || ctx.state !== 'running') {                  // 還沒解鎖：順便試著喚醒（有些瀏覽器不需要點擊）
      if (now - lastResumeTry > 400) { lastResumeTry = now; resumeCtx(); }
    }
    if (!timer) loop();
  }, { passive: true });

  /* 離開頁面時淡出音聲 */
  function fadeOutAll() {
    if (!ctx) return;
    const now = ctx.currentTime;
    const fadeTime = 0.6; // 淡出時長 600ms
    
    // 淡出 BGM
    if (bgmGain) {
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
      bgmGain.gain.linearRampToValueAtTime(0.00001, now + fadeTime);
    }
    
    // 淡出所有 shiny 聲源
    voices.forEach((v) => {
      if (v && v.gain) {
        try {
          v.gain.gain.setValueAtTime(v.gain.gain.value, now);
          v.gain.gain.linearRampToValueAtTime(0.00001, now + fadeTime);
        } catch (_) {}
      }
    });
  }

  function handlePageLeave() {
    console.log('[cover-dream-audio] 偵測到頁面離開');
    fadeOutAll();
    if (bgmEl) {
      setTimeout(() => {
        try { bgmEl.pause(); bgmEl.currentTime = 0; } catch (_) {}
      }, 650);
    }
  }

  window.addEventListener('pagehide', handlePageLeave);
  window.addEventListener('beforeunload', handlePageLeave);

  // 【關鍵】攔截所有導航，提前淡出音樂（防止 pagehide 太晚觸發）
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link) {
      // 排除 nav 中的鏈接（nav 鏈接會播 shiny.mp3，不需要淡出背景音樂）
      if (link.closest('.site-nav, [role="navigation"], nav')) {
        console.log('[cover-dream-audio] 點擊 nav 鏈接，不觸發淡出');
        return;
      }
      
      const href = link.getAttribute('href');
      // 只攔截本站導航（不攔截外部鏈接、#、或 javascript:）
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('http')) {
        console.log('[cover-dream-audio] 偵測到本站導航:', href);
        handlePageLeave();
      }
    }
  }, { capture: true, passive: true });

  /* ---------- 解鎖自動播放限制 ---------- */
  const UNLOCK_EVENTS = ['pointerdown', 'mousedown', 'keydown', 'touchend', 'click', 'wheel', 'touchstart'];
  function unlock() {
    resumeCtx();
    tryPlayBgm();
    maybeDone();
  }
  function maybeDone() {
    if (bgmPlaying && ctx && ctx.state === 'running') {
      UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, unlock));
    }
  }
  UNLOCK_EVENTS.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));

  initBgm();
})();
