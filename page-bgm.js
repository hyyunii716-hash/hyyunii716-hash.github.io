/* =========================================================
   Abandon — 各頁專屬背景音播放器（page-bgm.js）
   用法：在頁面加上 <script src="page-bgm.js" data-bgm="assets/xxx.mp3" defer></script>
   或給 body / 目標元素加上 data-bgm="assets/xxx.mp3"
   
   淡入淡出時長參數：
   - data-bgm-fade="600" (毫秒，預設 400ms)

   換頁時背景音銜接（不中斷、不重複）：
   - 舊頁的背景音「不淡出、不暫停」，一直播到瀏覽器真的換頁為止
   - 播放位置每 0.4 秒、以及離開頁面的瞬間都會記在 sessionStorage
   - 新的一頁如果是同一首，就從「記住的位置 + 換頁花掉的時間」接著播，等於音樂一直在播，只是換了個播放器
   - 這支檔案不處理轉場動畫，page-transition.js / .css 完全沒動
   ========================================================= */
(() => {
  const currentScript = document.currentScript;
  const rawSrc =
    currentScript?.getAttribute('data-bgm') ||
    document.body?.getAttribute('data-bgm') ||
    document.querySelector('[data-bgm]')?.getAttribute('data-bgm') ||
    '';

  if (!rawSrc.trim()) return;

  const volumeAttr = parseFloat(
    currentScript?.getAttribute('data-bgm-volume') ||
    document.body?.getAttribute('data-bgm-volume') ||
    '0.75'
  );
  const targetVolume = Number.isFinite(volumeAttr)
    ? Math.min(1, Math.max(0, volumeAttr))
    : 0.5;

  const fadeMsAttr = parseInt(
    currentScript?.getAttribute('data-bgm-fade') ||
    document.body?.getAttribute('data-bgm-fade') ||
    '400',
    10
  );
  const fadeDurationMs = isNaN(fadeMsAttr) ? 400 : Math.max(50, fadeMsAttr);

  const src = encodeURI(rawSrc.trim());

  // ---- 換頁接續播放 ----
  const RESUME_KEY = 'abandon-bgm-resume';
  const RESUME_MAX_AGE_MS = 12000;      // 超過這個時間才換到下一頁，就當作重新開始
  const RESUME_FADE_MS = 120;           // 接續播放時的淡入（很短，因為是接著播，不是重新開始）
  const SAVE_EVERY_MS = 400;

  function readResume() {
    try {
      const rec = JSON.parse(sessionStorage.getItem(RESUME_KEY) || 'null');
      if (rec && rec.src === src && Date.now() - rec.ts < RESUME_MAX_AGE_MS && Number.isFinite(rec.t)) return rec;
    } catch (_) {}
    return null;
  }
  function saveResume() {
    try {
      if (audio && Number.isFinite(audio.currentTime)) {
        sessionStorage.setItem(RESUME_KEY, JSON.stringify({ src, t: audio.currentTime, ts: Date.now() }));
      }
    } catch (_) {}
  }
  
  let audioCtx = null;
  let sourceNode = null;
  let gainNode = null;
  let audio = null;
  let isFading = false;
  let currentGainValue = 0;
  let resumed = false;

  function ensureAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function setupAudio() {
    if (audio) return;
    
    audio = new Audio(src);
    audio.preload = 'auto';

    const rec = readResume();                         // 上一頁是同一首 → 接著它的位置播
    if (rec) {
      resumed = true;
      audio.addEventListener('loadedmetadata', () => {
        let t = rec.t + (Date.now() - rec.ts) / 1000;
        if (Number.isFinite(audio.duration) && audio.duration > 0) t = t % audio.duration;
        try { audio.currentTime = t; } catch (_) {}
      }, { once: true });
    }
    
    const ctx = ensureAudioContext();
    if (ctx) {
      try {
        sourceNode = ctx.createMediaElementSource(audio);
        gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        currentGainValue = 0;
        
        sourceNode.connect(gainNode);
        gainNode.connect(ctx.destination);
      } catch (e) {
        // 如果無法建立 Web Audio API 路徑，使用原生音量控制
        audio.volume = targetVolume;
      }
    } else {
      audio.volume = targetVolume;
    }

    audio.addEventListener('error', () => {
      console.warn('[page-bgm] 無法讀取或播放背景音:', src);
    });

    // 當音頻到達末尾時，淡出後重新淡入
    audio.addEventListener('ended', () => {
      if (audio.loop) {
        fadeOutThenRestartLoop();
      }
    });
  }

  function fadeInAudio() {
    if (!gainNode) {
      audio.volume = targetVolume;
      return;
    }

    if (isFading) return;
    isFading = true;

    const ctx = ensureAudioContext();
    if (!ctx) return;

    const ms = resumed ? RESUME_FADE_MS : fadeDurationMs;
    const startTime = ctx.currentTime;
    const endTime = startTime + ms / 1000;

    gainNode.gain.setValueAtTime(currentGainValue, startTime);
    gainNode.gain.linearRampToValueAtTime(targetVolume, endTime);
    currentGainValue = targetVolume;

    setTimeout(() => {
      isFading = false;
    }, ms);
  }

  function fadeOutAudio(callback) {
    if (!gainNode) {
      if (callback) callback();
      return;
    }

    if (isFading) {
      if (callback) callback();
      return;
    }

    isFading = true;

    const ctx = ensureAudioContext();
    if (!ctx) {
      if (callback) callback();
      return;
    }

    const startTime = ctx.currentTime;
    const endTime = startTime + fadeDurationMs / 1000;

    gainNode.gain.setValueAtTime(currentGainValue, startTime);
    gainNode.gain.linearRampToValueAtTime(0, endTime);
    currentGainValue = 0;

    setTimeout(() => {
      isFading = false;
      if (callback) callback();
    }, fadeDurationMs);
  }

  function fadeOutThenRestartLoop() {
    fadeOutAudio(() => {
      if (audio && audio.loop) {
        audio.currentTime = 0;
        fadeInAudio();
      }
    });
  }

  function tryPlay() {
    setupAudio();
    if (audio.paused) {
      audio.loop = true;
      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch((err) => {
          // 等待使用者首次互動（點擊、按鍵、捲動、觸控）後再播
          console.log('[page-bgm] 瀏覽器先擋住自動播放，等第一次點擊／按鍵／滾輪後再播：', err && err.name);
        });
      }
      // 音頻開始播放後淡入
      setTimeout(() => fadeInAudio(), resumed ? 0 : 100);
    }
  }

  const unlockEvents = ['pointerdown', 'mousedown', 'click', 'keydown', 'wheel', 'touchstart'];
  function handleUnlock() {
    ensureAudioContext();      // 要在使用者操作當下喚醒：音檔有播但 AudioContext 還在 suspended 的話，會是「有播、沒聲音」
    tryPlay();
    // 音檔真的在播、而且 AudioContext 也醒了，才拿掉監聽（以前只看音檔，容易卡在沒聲音）
    if (audio && !audio.paused && (!audioCtx || audioCtx.state === 'running')) {
      unlockEvents.forEach((ev) => window.removeEventListener(ev, handleUnlock));
    }
  }

  unlockEvents.forEach((ev) => {
    window.addEventListener(ev, handleUnlock, { passive: true });
  });

  // 播放位置記下來給下一頁接續（舊頁自己不淡出、不暫停，播到換頁為止）
  setInterval(() => { if (audio && !audio.paused) saveResume(); }, SAVE_EVERY_MS);
  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('a[href]')) saveResume();
  }, { capture: true, passive: true });

  // 分頁切回前景時若被暫停，視情況接續
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audio && audio.paused) {
      tryPlay();
    }
  });

  // 離開頁面的瞬間再記一次最準的位置；不淡出、不暫停（瀏覽器換頁時會自己停掉）
  function handlePageLeave() { saveResume(); }

  // 從上一頁（bfcache）回來：瀏覽器會把音樂暫停，這裡接著播
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { isFading = false; tryPlay(); }
  });

  window.addEventListener('pagehide', handlePageLeave);
  window.addEventListener('beforeunload', handlePageLeave);

  tryPlay();
})();