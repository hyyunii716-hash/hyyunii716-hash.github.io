/* =========================================================
   Abandon — 全站按鈕點擊音效（button-sound.js）
   用法：在各頁引入 <script src="button-sound.js" data-click-sound="audio/click.mp3" defer></script>
   可選屬性：data-click-sound="audio/click.mp3"、data-click-volume="1.0"
   支持多個點擊音同時疊加播放
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
  let audioCtx = null;
  let isLoading = false;

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

  function isTargetButton(el) {
    if (!el || !(el instanceof Element)) return false;
    const btn = el.closest('button, .btn, [role="button"]');
    if (!btn) return false;
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
    if (btn.closest('header, .site-header, .site-nav')) return false;
    return true;
  }

  // 用 pointerdown 觸發，點擊瞬間就出聲，就算緊接著跳頁也比較不會被切斷
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (isTargetButton(e.target)) {
      console.log('[button-sound] 偵測到按鈕點擊');
      playButtonSound();
    }
  }, { capture: true, passive: true });

  // 也監聽 click 事件作為備援
  document.addEventListener('click', (e) => {
    if (isTargetButton(e.target)) {
      console.log('[button-sound] click 事件備援');
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
    }, { passive: true, once: true });
  });

  // 主動嘗試立即加載
  if (soundUrl) {
    console.log('[button-sound] 頁面加載完成，立即載入聲音檔...');
    loadClickBuffer();
  }

  console.log('[button-sound] 初始化完成！');
})();