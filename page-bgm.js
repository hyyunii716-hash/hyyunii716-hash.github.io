/* =========================================================
   Abandon — 各頁專屬背景音播放器（page-bgm.js）
   用法：在頁面加上 <script src="page-bgm.js" data-bgm="assets/xxx.mp3" defer></script>
   或給 body / 目標元素加上 data-bgm="assets/xxx.mp3"
   
   淡入淡出時長參數：
   - data-bgm-fade="600" (毫秒，預設 400ms)
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
  
  let audioCtx = null;
  let sourceNode = null;
  let gainNode = null;
  let audio = null;
  let isFading = false;
  let currentGainValue = 0;

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

    const startTime = ctx.currentTime;
    const endTime = startTime + fadeDurationMs / 1000;

    gainNode.gain.setValueAtTime(currentGainValue, startTime);
    gainNode.gain.linearRampToValueAtTime(targetVolume, endTime);
    currentGainValue = targetVolume;

    setTimeout(() => {
      isFading = false;
    }, fadeDurationMs);
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
        promise.catch(() => {
          // 等待使用者首次互動（點擊、按鍵、捲動、觸控）後再播
        });
      }
      // 音頻開始播放後淡入
      setTimeout(() => fadeInAudio(), 100);
    }
  }

  const unlockEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  function handleUnlock() {
    tryPlay();
    if (audio && !audio.paused) {
      unlockEvents.forEach((ev) => window.removeEventListener(ev, handleUnlock));
    }
  }

  unlockEvents.forEach((ev) => {
    window.addEventListener(ev, handleUnlock, { passive: true });
  });

  // 分頁切回前景時若被暫停，視情況接續
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audio && audio.paused) {
      tryPlay();
    }
  });

  // 離開或重新整理頁面時立即停止播放（防止聲音殘留）
  function handlePageLeave() {
    console.log('[page-bgm] 偵測到頁面離開');
    try {
      if (gainNode) {
        // 立即淡出到 0（同步）
        const ctx = ensureAudioContext();
        if (ctx) {
          const now = ctx.currentTime;
          gainNode.gain.cancelScheduledValues(now);
          gainNode.gain.setValueAtTime(currentGainValue, now);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        }
      }
      if (audio) {
        // 300ms 後暫停（給淡出時間）
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, 300);
      }
    } catch (e) {
      console.error('[page-bgm] 頁面離開處理失敗:', e);
    }
  }

  window.addEventListener('pagehide', handlePageLeave);
  window.addEventListener('beforeunload', handlePageLeave);

  tryPlay();
})();