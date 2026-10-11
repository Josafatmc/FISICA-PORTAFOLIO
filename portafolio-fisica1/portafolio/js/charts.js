/* ==========================================================================
   charts.js — Gráficas propias sobre <canvas> (sin dependencias).
   Cada gráfica tiene título, ejes con unidades, rejilla, leyenda, cursor
   vertical opcional, bandas sombreadas y tooltip al pasar el ratón.
   Uso:
     const chart = new LineChart(canvas, { title, xLabel, xUnit, yLabel, yUnit, series:[...] });
     chart.update({ series, cursorX, bands });
   Una serie: { name, color, x:[], y:[], dashed?, width?, points? (solo marcadores), fill? }
   ========================================================================== */
(function (root) {
  'use strict';

  const css = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

  /** Cálculo de ticks "bonitos" (1, 2, 5 × 10^k). */
  function niceTicks(min, max, target = 6) {
    if (!(max > min)) { max = min + 1; }
    const span = max - min;
    const rawStep = span / Math.max(1, target);
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    const step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
    const start = Math.ceil(min / step - 1e-9) * step;
    const ticks = [];
    for (let v = start; v <= max + step * 1e-6; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return { ticks, step };
  }

  const fmt = (v, step) => {
    const dec = step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step)));
    return v.toLocaleString('es-CR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  class LineChart {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({
        title: '', xLabel: '', xUnit: '', yLabel: '', yUnit: '',
        series: [], cursorX: null, bands: [], xMin: null, xMax: null, yMin: null, yMax: null,
        includeZeroY: false, equalAspect: false, decimalsTooltip: 2, ariaLabel: '',
      }, opts);
      this.hover = null;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', this.opts.ariaLabel || this.opts.title);
      canvas.addEventListener('mousemove', (e) => this._onMove(e));
      canvas.addEventListener('mouseleave', () => { this.hover = null; this.draw(); });
      canvas.addEventListener('touchmove', (e) => { if (e.touches[0]) this._onMove(e.touches[0]); }, { passive: true });
      if (typeof ResizeObserver !== 'undefined') {
        this._ro = new ResizeObserver(() => this.draw());
        this._ro.observe(canvas);
      }
      this.draw();
    }

    update(partial) { Object.assign(this.opts, partial); this.draw(); }

    _bounds() {
      const o = this.opts;
      let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
      for (const s of o.series) {
        for (let i = 0; i < s.x.length; i++) {
          const xv = s.x[i], yv = s.y[i];
          if (!Number.isFinite(xv) || !Number.isFinite(yv)) continue;
          if (xv < xmin) xmin = xv; if (xv > xmax) xmax = xv;
          if (yv < ymin) ymin = yv; if (yv > ymax) ymax = yv;
        }
      }
      if (!Number.isFinite(xmin)) { xmin = 0; xmax = 1; ymin = 0; ymax = 1; }
      if (o.includeZeroY) { ymin = Math.min(ymin, 0); ymax = Math.max(ymax, 0); }
      if (ymax === ymin) { ymax += 1; ymin -= 1; }
      const padY = (ymax - ymin) * 0.06;
      return {
        xmin: o.xMin ?? xmin, xmax: o.xMax ?? xmax,
        ymin: o.yMin ?? ymin - padY, ymax: o.yMax ?? ymax + padY,
      };
    }

    _layout() {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(200, rect.width), h = Math.max(140, rect.height);
      if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
        this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
      }
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hasTitle = !!this.opts.title;
      const legendRows = this.opts.series.filter((s) => s.name).length > 1 ? 1 : 0;
      const m = { l: 62, r: 16, t: (hasTitle ? 30 : 12) + legendRows * 20, b: 46 };
      return { w, h, m, pw: w - m.l - m.r, ph: h - m.t - m.b };
    }

    draw() {
      const o = this.opts, ctx = this.ctx;
      const L = this._layout();
      const B = this._bounds();
      const colText = css('--text-dim', '#9aa7c0'), colGrid = css('--grid', 'rgba(255,255,255,0.07)');
      const colAxis = css('--axis', 'rgba(255,255,255,0.35)'), colStrong = css('--text', '#e8edf7');
      this._L = L; this._B = B;
      ctx.clearRect(0, 0, L.w, L.h);
      const X = (v) => L.m.l + ((v - B.xmin) / (B.xmax - B.xmin)) * L.pw;
      const Y = (v) => L.m.t + L.ph - ((v - B.ymin) / (B.ymax - B.ymin)) * L.ph;
      this._X = X; this._Y = Y;

      // Título
      if (o.title) {
        ctx.fillStyle = colStrong; ctx.font = '600 13px "IBM Plex Sans", system-ui, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(o.title, L.m.l, 6);
      }
      // Leyenda
      const named = o.series.filter((s) => s.name);
      if (named.length > 1) {
        let lx = L.m.l; const ly = (o.title ? 28 : 8);
        ctx.font = '12px "IBM Plex Sans", system-ui, sans-serif'; ctx.textBaseline = 'middle';
        for (const s of named) {
          ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = 2.5;
          ctx.setLineDash(s.dashed ? [5, 4] : []);
          if (s.points) { ctx.beginPath(); ctx.arc(lx + 8, ly + 6, 3.5, 0, 6.283); ctx.fill(); }
          else { ctx.beginPath(); ctx.moveTo(lx, ly + 6); ctx.lineTo(lx + 16, ly + 6); ctx.stroke(); }
          ctx.setLineDash([]);
          ctx.fillStyle = colText; ctx.textAlign = 'left';
          ctx.fillText(s.name, lx + 21, ly + 6);
          lx += 21 + ctx.measureText(s.name).width + 16;
          if (lx > L.w - 80) break;
        }
      }
      // Rejilla y ticks
      const tx = niceTicks(B.xmin, B.xmax, Math.max(3, Math.floor(L.pw / 80)));
      const ty = niceTicks(B.ymin, B.ymax, Math.max(3, Math.floor(L.ph / 42)));
      ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace'; ctx.lineWidth = 1;
      ctx.textBaseline = 'top'; ctx.textAlign = 'center';
      for (const v of tx.ticks) {
        const px = X(v); if (px < L.m.l - 1 || px > L.m.l + L.pw + 1) continue;
        ctx.strokeStyle = colGrid; ctx.beginPath(); ctx.moveTo(px, L.m.t); ctx.lineTo(px, L.m.t + L.ph); ctx.stroke();
        ctx.fillStyle = colText; ctx.fillText(fmt(v, tx.step), px, L.m.t + L.ph + 6);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const v of ty.ticks) {
        const py = Y(v); if (py < L.m.t - 1 || py > L.m.t + L.ph + 1) continue;
        ctx.strokeStyle = v === 0 ? colAxis : colGrid; ctx.beginPath(); ctx.moveTo(L.m.l, py); ctx.lineTo(L.m.l + L.pw, py); ctx.stroke();
        ctx.fillStyle = colText; ctx.fillText(fmt(v, ty.step), L.m.l - 7, py);
      }
      // Marco
      ctx.strokeStyle = colAxis; ctx.strokeRect(L.m.l, L.m.t, L.pw, L.ph);

      // Etiquetas de ejes con unidades
      ctx.fillStyle = colText; ctx.font = '12px "IBM Plex Sans", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const xl = o.xLabel + (o.xUnit ? ' (' + o.xUnit + ')' : '');
      ctx.fillText(xl, L.m.l + L.pw / 2, L.h - 6);
      ctx.save(); ctx.translate(14, L.m.t + L.ph / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(o.yLabel + (o.yUnit ? ' (' + o.yUnit + ')' : ''), 0, 0); ctx.restore();

      // Recorte del área de trazado
      ctx.save(); ctx.beginPath(); ctx.rect(L.m.l, L.m.t, L.pw, L.ph); ctx.clip();

      // Bandas sombreadas [{from,to,color,label}] en el eje x
      for (const b of o.bands || []) {
        const x0 = X(Math.max(b.from, B.xmin)), x1 = X(Math.min(b.to, B.xmax));
        if (x1 > x0) {
          ctx.fillStyle = b.color || 'rgba(120,200,255,0.12)'; ctx.fillRect(x0, L.m.t, x1 - x0, L.ph);
          if (b.label) { ctx.fillStyle = colText; ctx.font = '11px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(b.label, (x0 + x1) / 2, L.m.t + 4); }
        }
      }
      // Series
      for (const s of o.series) {
        ctx.strokeStyle = s.color; ctx.fillStyle = s.color;
        ctx.lineWidth = s.width || 2.2; ctx.lineJoin = 'round'; ctx.setLineDash(s.dashed ? [6, 4] : []);
        if (s.points) {
          for (let i = 0; i < s.x.length; i++) { ctx.beginPath(); ctx.arc(X(s.x[i]), Y(s.y[i]), s.radius || 4, 0, 6.283); ctx.fill(); }
        } else {
          ctx.beginPath(); let started = false;
          for (let i = 0; i < s.x.length; i++) {
            if (!Number.isFinite(s.y[i])) { started = false; continue; }
            const px = X(s.x[i]), py = Y(s.y[i]);
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
          ctx.stroke();
          if (s.fill) {
            ctx.lineTo(X(s.x[s.x.length - 1]), Y(Math.max(B.ymin, 0))); ctx.lineTo(X(s.x[0]), Y(Math.max(B.ymin, 0))); ctx.closePath();
            ctx.globalAlpha = 0.12; ctx.fill(); ctx.globalAlpha = 1;
          }
        }
        ctx.setLineDash([]);
      }
      // Cursor vertical (p. ej. tiempo actual de la animación)
      if (o.cursorX != null && Number.isFinite(o.cursorX)) {
        const cx = X(o.cursorX);
        ctx.strokeStyle = css('--cursor', '#ffffff'); ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(cx, L.m.t); ctx.lineTo(cx, L.m.t + L.ph); ctx.stroke(); ctx.setLineDash([]);
        for (const s of o.series) {
          if (s.points || !s.x.length) continue;
          const yv = interpolate(s.x, s.y, o.cursorX);
          if (yv == null) continue;
          ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(cx, Y(yv), 4, 0, 6.283); ctx.fill();
        }
      }
      // Hover
      if (this.hover != null) {
        const hx = X(this.hover);
        ctx.strokeStyle = colAxis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, L.m.t); ctx.lineTo(hx, L.m.t + L.ph); ctx.stroke();
      }
      ctx.restore();

      // Tooltip
      if (this.hover != null) this._drawTooltip(L, B, X, Y);
    }

    _drawTooltip(L, B, X, Y) {
      const ctx = this.ctx, o = this.opts, d = o.decimalsTooltip;
      const rows = [];
      for (const s of o.series) {
        if (!s.name) continue;
        const yv = s.points ? nearestY(s.x, s.y, this.hover) : interpolate(s.x, s.y, this.hover);
        if (yv != null) rows.push({ color: s.color, text: s.name + ': ' + yv.toLocaleString('es-CR', { maximumFractionDigits: d }) + (o.yUnit ? ' ' + o.yUnit : '') });
      }
      if (!rows.length) return;
      const head = o.xLabel.split(' ')[0] + ' = ' + this.hover.toLocaleString('es-CR', { maximumFractionDigits: d }) + (o.xUnit ? ' ' + o.xUnit : '');
      ctx.font = '12px "IBM Plex Sans", sans-serif';
      const wBox = Math.max(ctx.measureText(head).width, ...rows.map((r) => ctx.measureText(r.text).width + 14)) + 16;
      const hBox = 22 + rows.length * 17;
      let bx = X(this.hover) + 12; if (bx + wBox > L.w - 4) bx = X(this.hover) - wBox - 12;
      const by = L.m.t + 8;
      ctx.fillStyle = css('--panel-solid', 'rgba(15,20,35,0.95)'); ctx.strokeStyle = css('--axis', '#556'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, wBox, hBox, 6) : ctx.rect(bx, by, wBox, hBox); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = css('--text', '#fff'); ctx.fillText(head, bx + 8, by + 6);
      rows.forEach((r, i) => {
        ctx.fillStyle = r.color; ctx.fillRect(bx + 8, by + 27 + i * 17, 8, 8);
        ctx.fillStyle = css('--text-dim', '#bbb'); ctx.fillText(r.text, bx + 21, by + 23 + i * 17);
      });
    }

    _onMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left, L = this._L, B = this._B;
      if (!L || px < L.m.l || px > L.m.l + L.pw) { this.hover = null; this.draw(); return; }
      this.hover = B.xmin + ((px - L.m.l) / L.pw) * (B.xmax - B.xmin);
      this.draw();
    }
  }

  /** Interpolación lineal de y(x) en una serie con x creciente; null si está fuera de rango. */
  function interpolate(xs, ys, x) {
    const n = xs.length; if (!n || x < xs[0] || x > xs[n - 1]) return null;
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= x) lo = mid; else hi = mid; }
    const dx = xs[hi] - xs[lo]; if (dx === 0) return ys[lo];
    return ys[lo] + ((x - xs[lo]) / dx) * (ys[hi] - ys[lo]);
  }
  function nearestY(xs, ys, x) {
    let best = -1, bd = Infinity;
    for (let i = 0; i < xs.length; i++) { const d = Math.abs(xs[i] - x); if (d < bd) { bd = d; best = i; } }
    return best >= 0 && bd < (Math.max(...xs) - Math.min(...xs)) * 0.04 ? ys[best] : null;
  }

  root.LineChart = LineChart;
  root.ChartUtils = { niceTicks, interpolate, fmt };
})(window);
