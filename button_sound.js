/* =========================================================
   Abandon — 全站按鈕點擊音效（button-sound.js）
   用法：在各頁引入 <script src="button-sound.js" data-click-sound="audio/click.mp3" defer></script>
   可選屬性：data-click-sound="audio/click.mp3"、data-click-volume="1.0"
   支持多個點擊音同時疊加播放
   nav 按鈕播放 shiny.mp3
   ========================================================= */
(() => {
  'use strict';
  console.log('[button-sound] 開始初始化...');
  
  const currentScript = document.currentScript;
  const customSoundRaw =
    currentScript?.getAttribute('data-click-sound') ||
    document.body?.getAttribute('data-click-sound') ||
    'audio/click.mp3';

  const volAttr = parseFloat(
    currentScript?.getAttribute('data-click-volume') ||
    document.body?.getAttribute('data-click-volume') ||
    '0.85'
  );
  const volume = Number.isFinite(volAttr)
    ? Math.min(1, Math.max(0, volAttr))
    : 0.85;

  const soundUrl = encodeURI(customSoundRaw.trim());
  console.log('[button-sound] 聲音文件:', soundUrl, '音量:', volume);
  
  let clickBuffer = null;
  let shinyBuffer = null;
  let audioCtx = null;
  let isLoading = false;
  let isLoadingShiny = false;

  function ensureAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        audioCtx = new Ctx();
        console.log('[button-sound] AudioContext 已建立，狀態:', audioCtx.state);
      } else {
        console.warn('[button-sound] 瀏覽器不支持 Web Audio API');
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch((e) => {
        console.warn('[button-sound] AudioContext 解鎖失敗:', e);
      });
    }
    return audioCtx;
  }

  async function loadClickBuffer() {
    if (clickBuffer || isLoading || !soundUrl) return;
    isLoading = true;
    console.log('[button-sound] 開始加載聲音...');
    
    const ctx = ensureAudioContext();
    if (!ctx) {
      console.error('[button-sound] 無法取得 AudioContext');
      isLoading = false;
      return;
    }

    try {
      const res = await fetch(soundUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${soundUrl}`);
      
      const arrayBuf = await res.arrayBuffer();
      console.log('[button-sound] 音檔已載入，大小:', arrayBuf.byteLength, 'bytes');
      
      clickBuffer = await ctx.decodeAudioData(arrayBuf);
      console.log('[button-sound] 音檔解碼成功，時長:', clickBuffer.duration, '秒');
    } catch (err) {
      console.error('[button-sound] 無法載入點擊音:', err);
    } finally {
      isLoading = false;
    }
  }

  async function loadShinyBuffer() {
    if (shinyBuffer || isLoadingShiny) return;
    isLoadingShiny = true;
    console.log('[button-sound] 開始加載 shiny.mp3...');
    
    const ctx = ensureAudioContext();
    if (!ctx) {
      console.error('[button-sound] 無法取得 AudioContext');
      isLoadingShiny = false;
      return;
    }

    try {
      const res = await fetch('audio/shiny.mp3', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: audio/shiny.mp3`);
      
      const arrayBuf = await res.arrayBuffer();
      console.log('[button-sound] shiny.mp3 已載入，大小:', arrayBuf.byteLength, 'bytes');
      
      shinyBuffer = await ctx.decodeAudioData(arrayBuf);
      console.log('[button-sound] shiny.mp3 解碼成功，時長:', shinyBuffer.duration, '秒');
    } catch (err) {
      console.error('[button-sound] 無法載入 shiny.mp3:', err);
    } finally {
      isLoadingShiny = false;
    }
  }

  // 當找不到或尚未載入 MP3 時的輕巧合成點擊聲備援
  function playFallbackSynthClick() {
    const ctx = ensureAudioContext();
    if (!ctx) {
      console.warn('[button-sound] 備援：無法播放合成聲');
      return;
    }

    console.log('[button-sound] 播放備援合成聲...');
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.055);

    // 增大合成音音量
    gain.gain.setValueAtTime(Math.max(0.08, volume * 0.6), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.075);
  }

  function playButtonSound() {
    const ctx = ensureAudioContext();
    if (!ctx) {
      console.warn('[button-sound] 無法播放：AudioContext 不可用');
      return;
    }

    // 如果還在加載，使用備援
    if (isLoading && !clickBuffer) {
      console.log('[button-sound] 音檔還在加載中，使用備援...');
      playFallbackSynthClick();
      return;
    }

    // 有 Buffer 就用 Web Audio API 播放（支持同時疊加）
    if (clickBuffer) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = clickBuffer;
        
        const gain = ctx.createGain();
        gain.gain.value = volume;
        
        src.connect(gain);
        gain.connect(ctx.destination);
        
        src.start(ctx.currentTime);
        console.log('[button-sound] 播放 click.mp3，音量:', volume);
        
        // 自動清理
        src.onended = () => {
          try {
            src.disconnect();
            gain.disconnect();
          } catch (_) {}
        };
        return;
      } catch (err) {
        console.error('[button-sound] 播放失敗:', err);
      }
    }

    // 備援方案
    console.log('[button-sound] 音檔不可用，使用備援...');
    playFallbackSynthClick();
  }

  function playShinySound() {
    const ctx = ensureAudioContext();
    if (!ctx) {
      console.warn('[button-sound] 無法播放 shiny：AudioContext 不可用');
      return;
    }

    // 如果還在加載，等待
    if (isLoadingShiny && !shinyBuffer) {
      console.log('[button-sound] shiny.mp3 還在加載中...');
      return;
    }

    // 【可調整參數】
    const SHINY_GAIN_MIN = 2.2;         // ← 音量倍增最小值
    const SHINY_GAIN_MAX = 4.8;         // ← 音量倍增最大值
    const SHINY_FADE_IN = 0.05;         // ← 淡入時間（秒）
    const SHINY_FADE_OUT = 0.15;        // ← 淡出時間（秒）

    // 有 Buffer 就播放完整音檔
    if (shinyBuffer) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = shinyBuffer;
        
        // 播放完整音檔（從 0 秒開始，播到結尾）
        const sliceStart = 0;
        const sliceEnd = shinyBuffer.duration;
        const duration = sliceEnd - sliceStart;
        
        // 隨機音量
        const randomGain = SHINY_GAIN_MIN + Math.random() * (SHINY_GAIN_MAX - SHINY_GAIN_MIN);
        
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        
        // 淡入淡出效果
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(randomGain * 0.5, now + SHINY_FADE_IN);
        gain.gain.linearRampToValueAtTime(0, now + duration - SHINY_FADE_OUT);
        
        src.connect(gain);
        gain.connect(ctx.destination);
        
        src.start(ctx.currentTime, sliceStart);
        console.log('[button-sound] 播放完整 shiny.mp3：', {
          長度: duration.toFixed(2) + '秒',
          淡入: SHINY_FADE_IN + '秒',
          淡出: SHINY_FADE_OUT + '秒',
          音量: (randomGain * 0.5).toFixed(2)
        });
        
        // 自動清理
        src.onended = () => {
          try {
            src.disconnect();
            gain.disconnect();
          } catch (_) {}
        };
        return;
      } catch (err) {
        console.error('[button-sound] 播放 shiny 失敗:', err);
      }
    }
  }

  function isTargetButton(el) {
    if (!el || !(el instanceof Element)) return false;
    const btn = el.closest('button, .btn, [role="button"], a[href]');
    if (!btn) return false;
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
    return true;
  }

  function isNavButton(el) {
    if (!el || !(el instanceof Element)) return false;
    const btn = el.closest('button, .btn, [role="button"], a[href]');
    if (!btn) return false;
    // 檢查是否在導航中
    return btn.closest('.site-nav, [role="navigation"], nav') !== null;
  }

  // 用 pointerdown 觸發，點擊瞬間就出聲，就算緊接著跳頁也比較不會被切斷
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (!isTargetButton(e.target)) return;
    
    console.log('[button-sound] 偵測到按鈕點擊');
    
    if (isNavButton(e.target)) {
      console.log('[button-sound] nav 按鈕，播放 shiny.mp3');
      playShinySound();
    } else {
      console.log('[button-sound] 普通按鈕，播放 click.mp3');
      playButtonSound();
    }
  }, { capture: true, passive: true });

  // 預先加載點擊音（在首次互動時觸發）
  ['pointerdown', 'keydown', 'click', 'wheel'].forEach((ev) => {
    window.addEventListener(ev, () => {
      if (!clickBuffer && !isLoading) {
        console.log('[button-sound] 首次互動，開始預加載...');
        loadClickBuffer();
      }
      if (!shinyBuffer && !isLoadingShiny) {
        console.log('[button-sound] 首次互動，開始預加載 shiny.mp3...');
        loadShinyBuffer();
      }
    }, { passive: true, once: true });
  });

  // 主動嘗試立即加載
  if (soundUrl) {
    console.log('[button-sound] 頁面加載完成，立即載入聲音檔...');
    loadClickBuffer();
    loadShinyBuffer();
  }

  console.log('[button-sound] 初始化完成！');

})();
// processing.bgm
(() => {
  const CANDIDATE_SRCS = [
    'audio/process.mp3',
    'audio/processing.mp3',
    './audio/process.mp3',
    './audio/processing.mp3',
    'assets/process.mp3',
    'assets/processing.mp3'
  ];
  const PROCESSING_VOLUME = 0.7;

  let processingAudio = null;
  let resolvedSrc = null;
  let isPlayingProcessing = false;

  async function resolveSoundUrl() {
    if (resolvedSrc) return resolvedSrc;
    for (const raw of CANDIDATE_SRCS) {
      const url = encodeURI(raw);
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          resolvedSrc = url;
          return resolvedSrc;
        }
      } catch (_) {}
    }
    resolvedSrc = encodeURI(CANDIDATE_SRCS[0]);
    return resolvedSrc;
  }

  async function ensureProcessingAudio() {
    const src = await resolveSoundUrl();
    if (!processingAudio) {
      processingAudio = new Audio(src);
      processingAudio.loop = true;
      processingAudio.preload = 'auto';
      processingAudio.volume = PROCESSING_VOLUME;
      processingAudio.addEventListener('error', () => {
        console.warn('[processing-sound] 找不到或無法播放音檔:', src);
      });
    }
    return processingAudio;
  }

  async function startProcessingAudio() {
    if (isPlayingProcessing) return;
    isPlayingProcessing = true;
    const audio = await ensureProcessingAudio();
    if (!isPlayingProcessing) return; // 期間若已離開 processing 就不要播
    try {
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch (_) {}
  }

  function stopProcessingAudio() {
    isPlayingProcessing = false;
    if (processingAudio) {
      try {
        processingAudio.pause();
        processingAudio.currentTime = 0;
      } catch (_) {}
    }
  }

  function isProcessingVisible() {
    const stepEl = document.querySelector('[data-step="processing"]');
    if (!stepEl) return false;
    if (stepEl.hasAttribute('hidden')) return false;
    const style = window.getComputedStyle(stepEl);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function syncProcessingSound() {
    if (isProcessingVisible()) {
      startProcessingAudio();
    } else {
      stopProcessingAudio();
    }
  }

  const observer = new MutationObserver(syncProcessingSound);
  const startObserving = () => {
    const root = document.querySelector('main') || document.body;
    if (root) {
      observer.observe(root, {
        attributes: true,
        subtree: true,
        attributeFilter: ['hidden', 'style', 'class']
      });
    }
    syncProcessingSound();
    setInterval(syncProcessingSound, 150);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving, { once: true });
  } else {
    startObserving();
  }

  window.addEventListener('pagehide', stopProcessingAudio);
})();