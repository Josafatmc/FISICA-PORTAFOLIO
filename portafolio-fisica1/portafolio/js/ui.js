/* ==========================================================================
   ui.js — Componentes de interfaz reutilizables por todos los temas.
   Los temas generan HTML con estas funciones y luego enlazan eventos en init().
   ========================================================================== */
(function (root) {
  'use strict';

  const fmt = (n, dec = 2) =>
    Number.isFinite(n) ? n.toLocaleString('es-CR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '—';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /** Control deslizante accesible con valor y unidad visibles. */
  function slider({ id, label, min, max, step, value, unit = '', dec = 2, hint = '' }) {
    return `<div class="ctrl">
      <label for="${id}">${label}</label>
      <div class="ctrl-row">
        <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"
               data-unit="${esc(unit)}" data-dec="${dec}" ${hint ? `aria-describedby="${id}-hint"` : ''}>
        <output id="${id}-out" for="${id}">${fmt(+value, dec)} ${unit}</output>
      </div>
      ${hint ? `<small id="${id}-hint" class="hint">${hint}</small>` : ''}
    </div>`;
  }

  /** Campo numérico con validación (min/max) y unidad. */
  function numberField({ id, label, min, max, step, value, unit = '', hint = '' }) {
    return `<div class="ctrl">
      <label for="${id}">${label}${unit ? ` <span class="unit">(${unit})</span>` : ''}</label>
      <input type="number" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" inputmode="decimal"
             ${hint ? `aria-describedby="${id}-hint"` : ''}>
      ${hint ? `<small id="${id}-hint" class="hint">${hint}</small>` : ''}
      <small class="field-error" id="${id}-err" role="alert" hidden></small>
    </div>`;
  }

  /** Indicador numérico (valor calculado). color: pos | vel | acc | force | result */
  function readout({ id, label, unit = '', color = 'result', big = false }) {
    return `<div class="readout c-${color}${big ? ' big' : ''}">
      <span class="ro-label">${label}</span>
      <span class="ro-value"><strong id="${id}">—</strong><span class="ro-unit"> ${unit}</span></span>
    </div>`;
  }

  /** Bloque de ecuación (TeX, KaTeX lo renderiza al cargar). */
  const eq = (tex, caption = '') =>
    `<div class="eq" role="math"><div class="eq-tex">$$${tex}$$</div>${caption ? `<div class="eq-cap">${caption}</div>` : ''}</div>`;

  /** Ecuación en línea. */
  const ie = (tex) => `\\(${tex}\\)`;

  /** Etiqueta de tipo de afirmación. */
  const TAGS = {
    hecho: 'Hecho documentado', calculo: 'Resultado calculado',
    supuesto: 'Supuesto del modelo', hipotesis: 'Hipótesis / ilustrativo',
  };
  const tag = (kind) => `<span class="tag ${kind}">${TAGS[kind]}</span>`;

  /** Tabla de variables: filas [símbolo TeX, significado, unidad]. */
  function varTable(rows) {
    return `<div class="table-wrap"><table class="var-table">
      <caption class="sr-only">Variables y unidades</caption>
      <thead><tr><th scope="col">Variable</th><th scope="col">Significado</th><th scope="col">Unidad (SI)</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>\\(${r[0]}\\)</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  /** Bloque de la ficha "qué se gana / qué cuesta" al modelar la física. */
  const tradeoff = (gain, cost) =>
    `<div class="tradeoff"><div class="gain"><h4>Qué se gana modelando la física</h4>${gain}</div>
     <div class="cost"><h4>Qué cuesta</h4>${cost}</div></div>`;

  const callout = (kind, title, html) =>
    `<aside class="callout ${kind}"><strong>${title}</strong>${html}</aside>`;

  /** Lee un input numérico de forma segura. */
  function num(root_, id) {
    const el = root_.querySelector('#' + id);
    return el ? parseFloat(el.value) : NaN;
  }
  /** Muestra u oculta un mensaje de validación debajo de un campo. */
  function fieldError(root_, id, msg) {
    const err = root_.querySelector('#' + id + '-err');
    const el = root_.querySelector('#' + id);
    if (!err || !el) return;
    err.hidden = !msg; err.textContent = msg || '';
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  /** Actualiza el <output> asociado a cada slider del contenedor y llama a cb en cada cambio. */
  function bindSliders(container, cb) {
    container.querySelectorAll('input[type="range"]').forEach((inp) => {
      const out = container.querySelector('#' + inp.id + '-out');
      const refresh = () => { if (out) out.textContent = fmt(parseFloat(inp.value), +inp.dataset.dec) + (inp.dataset.unit ? ' ' + inp.dataset.unit : ''); };
      inp.addEventListener('input', () => { refresh(); cb && cb(inp); });
      inp.refreshOutput = refresh; refresh();
    });
  }
  /** Fija un slider por código y refresca su salida. */
  function setSlider(container, id, value) {
    const el = container.querySelector('#' + id); if (!el) return;
    el.value = value; el.refreshOutput && el.refreshOutput();
  }
  const setText = (container, id, text) => { const el = container.querySelector('#' + id); if (el) el.textContent = text; };

  /** Descarga de datos como CSV (columnas: objeto {nombre: array}). */
  function downloadCSV(filename, columns, header = '') {
    const names = Object.keys(columns);
    const n = Math.max(...names.map((k) => columns[k].length));
    const lines = names.length ? [names.join(',')] : [];
    for (let i = 0; i < n; i++) lines.push(names.map((k) => (columns[k][i] ?? '')).join(','));
    const blob = new Blob([(header ? header.split('\n').map((l) => '# ' + l).join('\n') + '\n' : '') + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /** Lee el color CSS actual (para canvas). */
  const cssVar = (name, fb) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;

  /** Bucle de animación con dt acotado; devuelve {start, stop}. Respeta pestañas en segundo plano. */
  function animationLoop(step) {
    let id = null, last = 0;
    const frame = (ts) => {
      const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
      const keep = step(dt);
      id = keep === false ? null : requestAnimationFrame(frame);
    };
    return {
      start() { if (id == null) { last = performance.now(); id = requestAnimationFrame(frame); } },
      stop() { if (id != null) { cancelAnimationFrame(id); id = null; } },
      get running() { return id != null; },
    };
  }

  root.UI = { fmt, esc, slider, numberField, readout, eq, ie, tag, varTable, tradeoff, callout, num, fieldError, bindSliders, setSlider, setText, downloadCSV, cssVar, animationLoop };
})(window);
