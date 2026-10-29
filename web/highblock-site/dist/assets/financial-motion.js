(() => {
  'use strict';
  const render = window.HighBlockMotionRenderers?.flow;
  class FinancialMotionBackground {
    constructor(container) {
      this.container = container;
      this.canvas = container.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d', { alpha: false });
      if (!this.ctx) throw new Error('Canvas is unavailable');
      if (typeof render !== 'function') throw new Error('Capital flow renderer is unavailable');
      container.dataset.motion = 'flow';
      container.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Capital flow — abstract financial technology animation' : '資本流場——抽象金融科技動畫');
      this.time = 0;
      this.last = 0;
      this.frame = 0;
      this.paused = false;
      this.destroyed = false;
      this.pointer = { x: 0, y: 0 };
      this.target = { x: 0, y: 0 };
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.tick = this.tick.bind(this);
      this.onMotion = () => this.sync();
      this.onVisibility = () => this.sync();
      this.onPointer = e => {
        if (e.pointerType === 'touch' || this.reduced.matches) return;
        const r = this.container.getBoundingClientRect();
        this.target.x = Math.max(-1, Math.min(1, (e.clientX-r.left)/r.width*2-1));
        this.target.y = Math.max(-1, Math.min(1, (e.clientY-r.top)/r.height*2-1));
      };
      this.onLeave = () => { this.target.x = 0; this.target.y = 0; };
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(container);
      this.reduced.addEventListener('change', this.onMotion);
      document.addEventListener('visibilitychange', this.onVisibility);
      container.addEventListener('pointermove', this.onPointer, { passive: true });
      container.addEventListener('pointerleave', this.onLeave);
      this.resize();
      this.sync();
    }
    resize() {
      const r = this.container.getBoundingClientRect();
      this.width = Math.max(1, r.width);
      this.height = Math.max(1, r.height);
      this.ratio = Math.min(devicePixelRatio || 1, this.width < 780 ? 1.5 : 2);
      this.canvas.width = Math.round(this.width * this.ratio);
      this.canvas.height = Math.round(this.height * this.ratio);
      this.draw();
    }
    draw() {
      if (this.destroyed) return;
      const c = this.ctx;
      c.setTransform(this.ratio,0,0,this.ratio,0,0);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      c.fillStyle = '#0a0e17';
      c.fillRect(0,0,this.width,this.height);
      render(c,this.width,this.height,this.time,this.pointer,this.width<560);
    }
    tick(now) {
      this.frame = 0;
      if (this.destroyed || this.paused || document.hidden || this.reduced.matches) return;
      if (!this.last) this.last = now;
      const dt = Math.min((now-this.last)/1000,.05);
      // Cap drawing to 30fps while keeping motion speed independent of frame rate.
      if (now-this.last >= 30) {
        this.time += dt;
        this.last = now;
        this.pointer.x += (this.target.x-this.pointer.x)*.075;
        this.pointer.y += (this.target.y-this.pointer.y)*.075;
        this.draw();
      }
      this.frame = requestAnimationFrame(this.tick);
    }
    sync() {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.last = 0;
      if (!this.destroyed && !this.paused && !document.hidden && !this.reduced.matches) this.frame=requestAnimationFrame(this.tick);
      else this.draw();
    }
    setPaused(value) { this.paused=Boolean(value); this.sync(); }
    destroy() {
      this.destroyed=true;
      cancelAnimationFrame(this.frame);
      this.observer.disconnect();
      this.reduced.removeEventListener('change',this.onMotion);
      document.removeEventListener('visibilitychange',this.onVisibility);
      this.container.removeEventListener('pointermove',this.onPointer);
      this.container.removeEventListener('pointerleave',this.onLeave);
    }
  }
  window.FinancialMotionBackground = FinancialMotionBackground;
})();
