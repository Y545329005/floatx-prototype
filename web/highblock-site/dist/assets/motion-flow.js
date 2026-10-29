/* Capital flow — original gold-filament field over deep navy, sampled in CSS pixels. */
(() => {
  'use strict';
  const registry = window.HighBlockMotionRenderers ||= {};
  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  registry.flow = function capitalFlow(ctx, w, h, t, pointer, mobile) {
    ctx.save();
    const px = clamp(pointer?.x || 0, -1, 1);
    const py = clamp(pointer?.y || 0, -1, 1);
    const size = mobile ? Math.min(w * 1.17, h * 0.66) : Math.min(w * 0.48, h * 0.88);
    const cx = w * (mobile ? 0.77 : 0.745) + px * size * 0.017;
    const cy = h * (mobile ? 0.71 : 0.515) + py * size * 0.012;
    const breath = Math.sin(t * 0.18);

    // A broad wash lights the material without introducing a visible light source.
    const atmosphere = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.95);
    atmosphere.addColorStop(0, 'rgba(33,42,65,0.31)');
    atmosphere.addColorStop(0.55, 'rgba(15,21,36,0.18)');
    atmosphere.addColorStop(1, 'rgba(10,14,23,0)');
    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, 0, w, h);

    // The section turns through space as it rises: one continuous, open fold.
    function point(u, v, layer) {
      const turn = u * 5.05 - 1.45 + breath * 0.15 + layer * 0.23;
      const wave = Math.sin(u * TAU - 0.68 + layer * 0.16);
      const taper = 0.15 + 0.85 * Math.pow(Math.sin(Math.PI * u), 0.62);
      const ribbonWidth = (layer ? 0.12 : 0.205) * taper;
      const x = 0.30 * wave + 0.11 * (u - 0.5) + v * ribbonWidth * Math.cos(turn);
      const y = 0.72 - 1.44 * u + v * ribbonWidth * Math.sin(turn) * 0.57;
      const z = 0.16 * Math.cos(u * TAU - 0.5) + v * ribbonWidth * Math.sin(turn);
      const perspective = 1 / (1 - z * 0.39);
      return {
        x: cx + size * (x * perspective + layer * 0.09 + px * z * 0.035),
        y: cy + size * (y * perspective + layer * 0.025 + py * z * 0.025),
        z
      };
    }

    function trace(u0, u1, v, layer, samples) {
      for (let j = 0; j <= samples; j++) {
        const p = point(u0 + (u1 - u0) * j / samples, v, layer);
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    }

    function ribbon(layer, strands, samples) {
      // A restrained translucent body anchors the individual silk filaments.
      const body = ctx.createLinearGradient(cx - size * 0.28, cy - size * 0.6, cx + size * 0.3, cy + size * 0.6);
      body.addColorStop(0, 'rgba(21,29,48,0)');
      body.addColorStop(0.26, `rgba(92,73,48,${layer ? 0.08 : 0.19})`);
      body.addColorStop(0.52, `rgba(136,109,74,${layer ? 0.06 : 0.14})`);
      body.addColorStop(0.78, `rgba(28,37,58,${layer ? 0.1 : 0.23})`);
      body.addColorStop(1, 'rgba(15,21,36,0)');
      ctx.beginPath();
      trace(0, 1, -1, layer, samples);
      for (let j = samples; j >= 0; j--) {
        const p = point(j / samples, 1, layer);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = body;
      ctx.fill();

      for (let i = 0; i < strands; i++) {
        const v = i / (strands - 1) * 2 - 1;
        const edge = Math.pow(Math.abs(v), 6);
        const sheen = Math.pow(Math.max(0, Math.cos(v * 3.1 + t * 0.12)), 10);
        const a = (layer ? 0.10 : 0.23) + edge * 0.30 + sheen * 0.25;
        const champagne = !layer && (i === strands - 1 || i === strands - 3);
        const ink = layer ? '52,65,90' : (champagne ? '224,196,154' : '201,168,124');
        const light = layer ? '77,88,111' : (champagne ? '232,207,171' : '224,196,154');
        const gradient = ctx.createLinearGradient(cx, cy - size * 0.77, cx, cy + size * 0.81);
        gradient.addColorStop(0, `rgba(${ink},0)`);
        gradient.addColorStop(0.13, `rgba(${ink},${a * 0.39})`);
        gradient.addColorStop(0.34, `rgba(${light},${a})`);
        gradient.addColorStop(0.47, `rgba(${ink},${a * 0.19})`);
        gradient.addColorStop(0.63, `rgba(${light},${a * 1.18})`);
        gradient.addColorStop(0.87, `rgba(${ink},${a * 0.37})`);
        gradient.addColorStop(1, `rgba(${ink},0)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = champagne ? 1.08 : (i % 7 === 0 ? 0.9 : 0.55);
        ctx.beginPath();
        trace(0, 1, v, layer, samples);
        ctx.stroke();
      }
    }

    ribbon(1, 31, 63);
    ribbon(0, 112, 83);

    // Sparse moving reflections trace the same geometry: motion belongs to the material.
    ctx.globalCompositeOperation = 'screen';
    for (let k = 0; k < 5; k++) {
      const u = ((t * (0.026 + k * 0.0017) + 0.12 + k * 0.197) % 1);
      const v = [-0.94, -0.58, 0.16, 0.69, 0.97][k];
      const envelope = Math.sin(Math.PI * u) ** 2;
      const start = Math.max(0, u - 0.026);
      const end = Math.min(1, u + 0.026);
      const p0 = point(start, v, 0);
      const p1 = point(end, v, 0);
      const shine = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      const rgb = k === 4 ? '232,207,171' : '224,196,154';
      shine.addColorStop(0, `rgba(${rgb},0)`);
      shine.addColorStop(0.5, `rgba(${rgb},${0.56 * envelope})`);
      shine.addColorStop(1, `rgba(${rgb},0)`);
      ctx.strokeStyle = shine;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      trace(start, end, v, 0, 14);
      ctx.stroke();
    }

    // Keep the editorial side quiet even when the viewport changes shape.
    ctx.globalCompositeOperation = 'source-over';
    const quiet = ctx.createLinearGradient(0, 0, w * (mobile ? 0.83 : 0.65), 0);
    quiet.addColorStop(0, 'rgba(10,14,23,0.98)');
    quiet.addColorStop(0.48, 'rgba(10,14,23,0.72)');
    quiet.addColorStop(1, 'rgba(10,14,23,0)');
    ctx.fillStyle = quiet;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };
})();
