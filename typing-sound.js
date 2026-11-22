/* =========================================================
   Abandon — 贊助頁打字逐字音效（typing-sound.js）
   用法：在贊助頁引入 <script src="typing-sound.js" defer></script>
   可選屬性：data-type-sound="assets/key.mp3"、data-type-volume="0.45"
   ========================================================= */
(() => {
  const scriptEl = document.currentScript;
  const customSoundRaw =
    scriptEl?.getAttribute('data-type-sound') ||
    document.body?.getAttribute('data-type-sound') ||
    '';

  const volAttr = parseFloat(
    scriptEl?.getAttribute('data-type-volume') ||
    document.body?.getAttribute('data-type-volume') ||
    '0.45'
  );
  const volume = Number.isFinite(volAttr)
    ? Math.min(1, Math.max(0, volAttr))
    : 0.45;

  let templateAudio = null;
  let audioCtx = null;

  if (customSoundRaw.trim()) {
    templateAudio = new Audio(encodeURI(customSoundRaw.trim()));
    templateAudio.preload = 'auto';
    templateAudio.volume = volume;
  }

  function ensureAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        audioCtx = new Ctx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // 內建輕巧按鍵聲備援（帶微幅隨機音高，避免連打太死板）
  function playFallbackKeySound(isBackspace = false) {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const jitter = (Math.random() - 0.5) * 90;
    const startFreq = (isBackspace ? 340 : 620) + jitter;
    const endFreq = (isBackspace ? 180 : 250) + jitter * 0.5;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(Math.max(120, startFreq), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(90, endFreq), now + 0.042);

    gain.gain.setValueAtTime(Math.max(0.03, volume * 0.28), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  function playKeySound(isBackspace = false) {
    ensureAudioContext();

    if (templateAudio) {
      try {
        const clip = templateAudio.cloneNode(true);
        clip.volume = volume;
        const p = clip.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => playFallbackKeySound(isBackspace));
        }
        return;
      } catch (_) {
        // 退回內建按鍵音效
      }
    }

    playFallbackKeySound(isBackspace);
  }

  const inputs = Array.from(
    document.querySelectorAll('#payForm input.control, input[type="text"], input[type="password"], textarea')
  );

  inputs.forEach((input) => {
    let prevVal = input.value;
    let lastInputType = '';

    input.addEventListener('beforeinput', (e) => {
      lastInputType = e.inputType || '';
    });

    input.addEventListener('input', () => {
      const nextVal = input.value;
      if (nextVal === prevVal) return;

      const isDelete =
        nextVal.length < prevVal.length ||
        lastInputType.startsWith('delete');

      prevVal = nextVal;
      playKeySound(isDelete);
    });
  });

  ['pointerdown', 'keydown'].forEach((ev) => {
    window.addEventListener(ev, () => ensureAudioContext(), { passive: true });
  });
})();