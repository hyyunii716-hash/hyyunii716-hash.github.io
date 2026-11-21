/* ==========================================================================
   「夢越做越沉」背景層：收斂後的低調霧氣＋細緻底片顆粒（不碰文字、不搶戲）
   ========================================================================== */
(() => {
  if (window.__dreamSinkDepthReady) return;
  window.__dreamSinkDepthReady = true;

  function makeGrainUrl() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(c.width, c.height);
    const d = img.data;

    for (let i = 0; i < d.length; i += 4) {
      const v = Math.floor(175 + Math.random() * 65);
      const a = Math.random() > 0.62 ? Math.floor(8 + Math.random() * 10) : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = Math.min(255, v + 10);
      d[i + 3] = a;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL("image/png");
  }

  function initDreamSinkDepth() {
    if (!document.body || document.querySelector(".dream-sink-depth-layer")) {
      return;
    }

    const grainUrl = makeGrainUrl();

    const layer = document.createElement("div");
    layer.className = "dream-sink-depth-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = [
      "position:fixed",
      "inset:-8%",
      "z-index:12",
      "pointer-events:none",
      "overflow:hidden",
    ].join(";");

    const mist = document.createElement("div");
    mist.style.cssText = [
      "position:absolute",
      "inset:0",
      "background:radial-gradient(ellipse 70% 50% at 50% 24%, rgba(92, 114, 255, 0.09) 0%, rgba(36, 46, 110, 0.04) 52%, rgba(2, 3, 7, 0.42) 100%)",
      "transition:transform 260ms ease-out, background 260ms ease-out",
      "will-change:transform,background",
    ].join(";");

    const grain = document.createElement("div");
    grain.style.cssText = [
      "position:absolute",
      "inset:0",
      `background-image:url("${grainUrl}")`,
      "background-repeat:repeat",
      "background-size:128px 128px",
      "opacity:0.24",
      "transition:opacity 260ms ease-out",
      "will-change:opacity",
    ].join(";");

    layer.appendChild(mist);
    layer.appendChild(grain);
    document.body.appendChild(layer);

    function updateDepth() {
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      const depth =
        maxScroll > 0
          ? Math.min(1, Math.max(0, window.scrollY / maxScroll))
          : 0;

      const sinkPx = Math.round(depth * 24);
      const lightY = Math.round(24 - depth * 14);
      const topAlpha = (0.09 - depth * 0.06).toFixed(3);
      const edgeAlpha = (0.42 + depth * 0.22).toFixed(2);

      mist.style.transform = `translate3d(0, ${sinkPx}px, 0)`;
      mist.style.background = `radial-gradient(ellipse 70% 50% at 50% ${lightY}%, rgba(92, 114, 255, ${topAlpha}) 0%, rgba(36, 46, 110, 0.03) 55%, rgba(2, 3, 7, ${edgeAlpha}) 100%)`;
      grain.style.opacity = (0.2 + depth * 0.14).toFixed(2);
    }

    updateDepth();
    window.addEventListener("scroll", updateDepth, { passive: true });
    window.addEventListener("resize", updateDepth, { passive: true });
  }

  if (document.body) {
    initDreamSinkDepth();
  } else {
    document.addEventListener("DOMContentLoaded", initDreamSinkDepth, {
      once: true,
    });
  }
})();
