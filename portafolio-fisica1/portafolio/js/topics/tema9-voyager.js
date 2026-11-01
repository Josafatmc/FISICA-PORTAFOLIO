/* ==========================================================================
   Tema 9 — Asistencia gravitatoria: cómo la Voyager ganó velocidad sin gastar combustible
   Recurso prescrito: VISUALIZACIÓN DE DATOS
   Datos reales: rapidez heliocéntrica de Voyager 1 y 2 (NASA/JPL Horizons),
   con la rapidez de escape del Sol calculada a la distancia de la sonda.
   ========================================================================== */
(function () {
  'use strict';
  const tex = String.raw;
  const { eq, ie, tag, varTable, tradeoff, slider, readout, fmt } = UI;
  const { cite } = Portfolio;
  const P = Physics;

  // Fechas de máximo acercamiento (NASA). Año decimal aproximado para las bandas de la gráfica.
  const ENCOUNTERS = {
    v1: [{ name: 'Júpiter', date: '5 mar 1979', t: 1979.17 }, { name: 'Saturno', date: '12 nov 1980', t: 1980.87 }],
    v2: [{ name: 'Júpiter', date: '9 jul 1979', t: 1979.52 }, { name: 'Saturno', date: '25 ago 1981', t: 1981.65 }, { name: 'Urano', date: '24 ene 1986', t: 1986.07 }, { name: 'Neptuno', date: '25 ago 1989', t: 1989.65 }],
  };
  // Datos planetarios (ficha de la NASA): μ = GM (km³/s²), radio ecuatorial (km), velocidad orbital media (km/s)
  const PLANETS = {
    jupiter: { name: 'Júpiter', mu: 1.26687e8, R: 71492, U: 13.06 },
    saturn: { name: 'Saturno', mu: 3.7931e7, R: 60268, U: 9.68 },
    uranus: { name: 'Urano', mu: 5.794e6, R: 25559, U: 6.80 },
    neptune: { name: 'Neptuno', mu: 6.8351e6, R: 24764, U: 5.43 },
  };

  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  /** Año decimal → «mes año» para el tooltip. */
  const fmtYear = (y) => MONTHS[Math.min(11, Math.floor((y % 1) * 12))] + ' ' + Math.floor(y);

  /** Rapidez antes y después de un encuentro, leída de los datos (promedio de ±window días fuera del pico). */
  function jumpAt(d, tEnc, before = 0.12, after = 0.12) {
    const at = (t) => ChartUtils.interpolate(d.t, d.v, t);
    const ra = (t) => ChartUtils.interpolate(d.t, d.r, t);
    const t0 = tEnc - before, t1 = tEnc + after;
    return { v0: at(t0), v1: at(t1), r0: ra(t0), r1: ra(t1), e0: P.specificEnergy(at(t0), ra(t0)), e1: P.specificEnergy(at(t1), ra(t1)) };
  }

  const T = {
    id: 'tema-9', number: 9, accent: 'pos', avance: 'Avance 2',
    title: 'Asistencia gravitatoria: cómo la Voyager ganó velocidad sin gastar combustible',
    resource: 'Visualización de datos',
    concepts: ['Gravitación universal', 'Energía potencial gravitatoria', 'Conservación del momento en el marco del planeta'],
    summary: 'Los datos reales de la NASA muestran saltos de varios km/s en cada planeta. La física explica de dónde sale esa energía: del propio planeta.',

    html() {
      return String.raw`
      ${Portfolio.head(T)}

      <div class="tblock">
        <h3>Introducción al problema</h3>
        <p>Para llegar a Neptuno con un cohete de 1977, una sonda tendría que salir de la Tierra con muchísima más energía de la que podía darle cualquier lanzador. Además, al alejarse del Sol, su gravedad la frena continuamente. Sin embargo, la Voyager 2 visitó Júpiter, Saturno, Urano y Neptuno en doce años y la Voyager 1 salió del Sistema Solar. La pregunta es: <strong>¿de dónde sacaron las sondas la energía para acelerar varios kilómetros por segundo sin encender motores?</strong></p>
      </div>

      <div class="tblock">
        <h3>Caso de uso en ingeniería del software</h3>
        <p><strong>Industria:</strong> exploración espacial. <strong>Sistema:</strong> el software de diseño y navegación de trayectorias del Jet Propulsion Laboratory (JPL), que integra numéricamente la gravitación de todos los cuerpos del Sistema Solar y que hoy se expone al público como el sistema de efemérides Horizons ${cite('jpl-horizons')}.</p>
        <p>${tag('hecho')} Las trayectorias de las Voyager se diseñaron para aprovechar una alineación de los planetas exteriores que ocurre aproximadamente cada 175 años, de modo que la gravedad de cada planeta desviara a la sonda hacia el siguiente ${cite('nasa-voyager')}. ${tag('hecho')} La técnica, llamada asistencia gravitatoria, usa el movimiento orbital del planeta para cambiar la rapidez y la dirección de la nave respecto al Sol sin gastar combustible ${cite('jpl-basics')}. ${tag('hecho')} Flandro (1966) calculó que esa alineación permitía visitar todos los planetas exteriores con energía extraída del campo gravitatorio de Júpiter ${cite('flandro')}.</p>
        <p>El software busca la fecha de lanzamiento y la distancia de paso por cada planeta resolviendo las ecuaciones de la gravitación; la gráfica de abajo usa justamente los vectores de estado que produce ese software.</p>
      </div>

      <div class="tblock">
        <h3>Concepto físico y ecuaciones</h3>
        <p>La <strong>ley de gravitación universal</strong> y la energía potencial gravitatoria ${cite('openstax')}:</p>
        ${eq(tex`F=\frac{G\,M\,m}{r^{2}}\qquad U=-\frac{G\,M\,m}{r}\qquad \varepsilon=\frac{v^{2}}{2}-\frac{G M_{\odot}}{r}`, 'Fuerza, energía potencial y energía orbital específica (por unidad de masa) respecto al Sol. Si ε ≥ 0, la sonda escapa del Sistema Solar.')}
        ${eq(tex`v_{\text{esc}}(r)=\sqrt{\frac{2\,G M_{\odot}}{r}}`, 'Rapidez de escape del Sol a la distancia r: es la frontera entre ε < 0 (ligada) y ε ≥ 0 (escapa).')}
        <p><strong>En el marco del planeta</strong> el sobrevuelo es como un choque elástico: la gravedad del planeta es conservativa, así que la sonda sale con la misma rapidez con la que llegó, ${ie('|\\vec v_\\infty^{\\,\\text{salida}}|=|\\vec v_\\infty^{\\,\\text{llegada}}|')}; solo cambia la dirección, un ángulo ${ie('\\delta')}:</p>
        ${eq(tex`\sin\frac{\delta}{2}=\frac{1}{1+r_p\,v_\infty^{2}/\mu}\qquad \vec v_{\text{Sol}}=\vec U+\vec v_\infty\qquad \Delta v_{\max}=2\,v_\infty\sin\frac{\delta}{2}`, 'μ = GM del planeta, r_p distancia de máximo acercamiento, U velocidad orbital del planeta. Al girar v∞, la suma vectorial con U cambia de tamaño.')}
        <p>El momento lineal total de sonda y planeta se conserva: lo que gana la sonda lo pierde el planeta, cuya masa es tan grande que su órbita cambia de forma imperceptible.</p>
        ${varTable([
          ['G', 'constante de gravitación universal', 'N·m²/kg²'],
          ['M_\\odot,\\ \\mu', 'masa del Sol; parámetro gravitacional GM de un planeta', 'kg; km³/s²'],
          ['r,\\ r_p', 'distancia al Sol; distancia de paso al centro del planeta', 'UA o km'],
          ['v,\\ v_\\infty', 'rapidez respecto al Sol; rapidez lejos del planeta en su marco', 'km/s'],
          ['\\vec U', 'velocidad orbital del planeta respecto al Sol', 'km/s'],
          ['\\delta', 'ángulo que gira la velocidad en el marco del planeta', 'grados'],
          ['\\varepsilon', 'energía orbital específica', 'km²/s² (= MJ/kg)'],
        ])}
      </div>

      <div class="tblock">
        <h3>Cómo se usa la física para resolver el problema</h3>
        <p>La clave es el cambio de marco de referencia. Visto desde Júpiter, la sonda llega y se va con la misma rapidez: no hay energía gratis. Visto desde el Sol, Júpiter se mueve a unos 13 km/s y «arrastra» a la sonda: si la sonda pasa por detrás del planeta, su velocidad de salida queda más alineada con la de Júpiter y la suma vectorial es mayor. Esa ganancia es energía cinética que Júpiter cede de su órbita.</p>
        ${tradeoff(
          `<ul><li>Cambios de velocidad de varios km/s sin combustible, imposibles con los cohetes de la época.</li><li>Un solo modelo (gravitación de N cuerpos) sirve para diseñar, navegar y predecir la llegada con años de anticipación.</li><li>Las ecuaciones dicen exactamente qué distancia de paso da el desvío necesario para llegar al siguiente planeta.</li></ul>`,
          `<ul><li>Depende de alineaciones planetarias que no se eligen: la ventana de las Voyager fue única en 175 años.</li><li>El paso debe ser muy preciso; un error pequeño en r_p cambia el desvío y la llegada al siguiente planeta.</li><li>La integración numérica de muchos cuerpos durante años exige mucho cómputo y modelos de perturbaciones finas.</li></ul>`
        )}
        <p><strong>Frente a la alternativa no física:</strong> una trayectoria precalculada «a mano» o un ajuste de curvas no puede predecir dónde estará la sonda dentro de doce años ni cómo corregir el rumbo tras una maniobra. Solo integrando la ley de la gravitación se obtienen fechas de encuentro con precisión de minutos.</p>
      </div>

      <div class="tblock">
        <h3>Recurso: visualización de datos</h3>
        <div class="callout hecho"><strong>Fuente de los datos</strong>
          <p>Vectores de estado de Voyager 1 (−31) y Voyager 2 (−32) respecto al Sol, obtenidos por mí del <strong>sistema Horizons de NASA/JPL</strong> ${cite('jpl-horizons')} (centro 500@10, plano de la eclíptica, km y km/s; 1977-09-06 a 1990-01-01, consulta del 31-10-2026). La rapidez es ${ie('|\\vec v|')} de esos vectores. La rapidez de escape es un <strong>resultado calculado</strong> con ${ie('\\sqrt{2GM_\\odot/r}')} a la distancia real de cada fecha. Fechas de encuentro: NASA ${cite('nasa-voyager')}.</p></div>
        <div class="lab">
          <div class="lab-head"><h4>Rapidez de las sondas respecto al Sol, 1977–1990</h4><span class="badge">Datos reales: NASA/JPL Horizons</span></div>
          <div class="lab-body">
            <div class="seg" role="group" aria-label="Sonda a mostrar">
              <button type="button" class="seg-btn" data-probe="v2" aria-pressed="true">Voyager 2</button>
              <button type="button" class="seg-btn" data-probe="v1" aria-pressed="false">Voyager 1</button>
              <button type="button" class="seg-btn" data-probe="both" aria-pressed="false">Ambas</button>
            </div>
            <label class="switch"><input type="checkbox" id="t9-esc" checked><span>Mostrar la rapidez de escape del Sol</span></label>
            <div class="chart-wrap tall"><canvas id="t9-chart"></canvas></div>
            <p class="chart-note">Bandas: máximo acercamiento a cada planeta. Donde la línea continua queda por encima de la discontinua, la sonda ya no está ligada al Sol (ε ≥ 0).</p>
            <div class="table-wrap"><table class="data" id="t9-table"></table></div>
            <button class="btn" id="t9-csv" type="button">Descargar datos (CSV)</button>
          </div>
        </div>

        <div class="lab" style="margin-top:18px">
          <div class="lab-head"><h4>¿De dónde sale el salto? Sobrevuelo en dos marcos de referencia</h4><span class="badge">|v∞| igual antes y después en el marco del planeta</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                <div class="ctrl"><label for="t9-planet">Planeta</label><select id="t9-planet">${Object.entries(PLANETS).map(([k, p]) => `<option value="${k}">${p.name} (U = ${fmt(p.U, 2)} km/s)</option>`).join('')}</select></div>
                ${slider({ id: 't9-vinf', label: 'Rapidez de llegada en el marco del planeta v∞', min: 2, max: 20, step: 0.1, value: 10, unit: 'km/s', dec: 1 })}
                ${slider({ id: 't9-rp', label: 'Distancia de paso r_p', min: 1.1, max: 40, step: 0.1, value: 4.5, unit: 'radios', dec: 1 })}
                ${slider({ id: 't9-phi', label: 'Dirección de llegada respecto a U', min: 90, max: 180, step: 1, value: 145, unit: '°', dec: 0 })}
                <label class="switch"><input type="checkbox" id="t9-side" checked><span>Pasar por detrás del planeta (gana rapidez)</span></label>
              </div>
              <div class="chart-stack">
                <div class="viz"><canvas id="t9-vec" aria-label="Diagrama vectorial: velocidad del planeta U, velocidad relativa de llegada y de salida, y las velocidades respecto al Sol antes y después"></canvas></div>
                <div class="readouts">
                  ${readout({ id: 't9-o-dv', label: 'Cambio de rapidez respecto al Sol', unit: 'km/s', color: 'result', big: true })}
                  ${readout({ id: 't9-o-d', label: 'Desvío δ en el marco del planeta', unit: '°', color: 'force' })}
                  ${readout({ id: 't9-o-in', label: 'Rapidez heliocéntrica de llegada', unit: 'km/s', color: 'pos' })}
                  ${readout({ id: 't9-o-out', label: 'Rapidez heliocéntrica de salida', unit: 'km/s', color: 'vel' })}
                </div>
                <p class="status" id="t9-status" role="status"></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="tblock">
        <h3>Interpretación de los resultados</h3>
        <ul id="t9-interp">
          <li><strong>Entre planetas la sonda frena:</strong> la curva baja suavemente porque se aleja del Sol y convierte energía cinética en potencial (${ie('\\varepsilon')} constante). Es la misma caída libre del Tema 2, a escala del Sistema Solar.</li>
          <li><strong>En cada planeta hay un salto:</strong> la tabla mide la rapidez 45 días antes y 45 días después de cada encuentro, leída directamente de los datos de Horizons.</li>
          <li><strong>Júpiter cambió el destino:</strong> antes de Júpiter la rapidez de la Voyager 2 estaba por debajo de la de escape (órbita ligada al Sol); después quedó por encima: la sonda ya no volverá.</li>
          <li><strong>No todos los encuentros aceleran:</strong> en Neptuno la Voyager 2 se desvió para pasar cerca de la luna Tritón y su rapidez respecto al Sol bajó. El signo de Δv depende de por dónde se pase, como muestra el segundo laboratorio.</li>
        </ul>
      </div>

      <div class="tblock">
        <h3>Limitaciones, supuestos y clasificación de afirmaciones</h3>
        <ul class="claims">
          <li>${tag('hecho')}<span>Vectores de estado de las sondas ${cite('jpl-horizons')}; alineación, fechas y objetivos de la misión ${cite('nasa-voyager')}; definición de la asistencia gravitatoria ${cite('jpl-basics')}; análisis de Flandro ${cite('flandro')}; parámetros planetarios ${cite('nasa-factsheet')}.</span></li>
          <li>${tag('calculo')}<span>Rapidez de escape, energías específicas, saltos de la tabla y el sobrevuelo del segundo laboratorio.</span></li>
          <li>${tag('supuesto')}<span>El laboratorio de sobrevuelo usa el modelo de «parches cónicos»: el planeta se mueve en línea recta durante el encuentro, sin la gravedad del Sol, en el plano. Las fechas de encuentro se marcan con precisión de días en la gráfica.</span></li>
          <li>${tag('hipotesis')}<span>Los valores de v∞, r_p y ángulo del laboratorio son ilustrativos; no reproducen la geometría exacta de ningún encuentro de las Voyager.</span></li>
        </ul>
      </div>

      ${Portfolio.connections([
        { to: 'tema-7', text: 'En el marco del planeta, el sobrevuelo es un choque elástico (e = 1): la rapidez relativa se conserva y solo cambia la dirección, igual que en el rebote ideal.' },
        { to: 'tema-2', text: 'Entre planetas, la sonda sube por el «pozo» gravitatorio del Sol y frena, como el personaje que sube frenado por g.' },
        { to: 'tema-6', text: 'El balance de energía es el mismo teorema trabajo-energía: aquí el trabajo lo hace la gravedad de Júpiter, allá el motor-generador.' },
        { to: 'tema-1', text: 'Componer U + v∞ es la misma suma de vectores en componentes que la velocidad del dron.' },
      ])}
      ${Portfolio.sources(['jpl-horizons', 'nasa-voyager', 'jpl-basics', 'flandro', 'nasa-factsheet', 'openstax'])}
      `;
    },

    init(el) {
      const $ = (id) => el.querySelector('#t9-' + id);
      const D = window.VOYAGER;
      const col = () => ({ pos: UI.cssVar('--c-pos', '#33a3bf'), vel: UI.cssVar('--c-vel', '#c08801'), acc: UI.cssVar('--c-acc', '#e36574'), force: UI.cssVar('--c-force', '#9882dd'), res: UI.cssVar('--c-result', '#49a980') });
      const chart = new LineChart($('chart'), { title: 'Rapidez respecto al Sol en función del tiempo', xLabel: 'Año', xUnit: '', yLabel: 'Rapidez heliocéntrica', yUnit: 'km/s', yMin: 0, decimalsTooltip: 2, xFormat: (v, long) => long ? fmtYear(v) : String(Math.round(v)), ariaLabel: 'Rapidez de las sondas Voyager respecto al Sol entre 1977 y 1990, con saltos en cada encuentro planetario' });
      let probe = 'v2';
      if (!D) { $('table').innerHTML = '<tbody><tr><td>No se cargaron los datos (data/voyager.js).</td></tr></tbody>'; return; }

      function drawChart() {
        const c = col(), showEsc = $('esc').checked, series = [], bands = [];
        const add = (key, name, color) => {
          const d = D[key];
          series.push({ name, color, x: d.t, y: d.v, width: 2.4 });
          if (showEsc) series.push({ name: 'Escape del Sol (' + name + ')', color, x: d.t, y: d.r.map(P.solarEscape), dashed: true, width: 1.4 });
          ENCOUNTERS[key].forEach((e) => bands.push({ from: e.t - 0.03, to: e.t + 0.03, color: 'rgba(152,130,221,0.22)', label: e.name.slice(0, 3) }));
        };
        if (probe === 'v2' || probe === 'both') add('v2', 'Voyager 2', c.pos);
        if (probe === 'v1' || probe === 'both') add('v1', 'Voyager 1', c.vel);
        chart.update({ series, bands, xMin: 1977.6, xMax: 1990 });
      }
      function buildTable() {
        const rows = [];
        for (const key of ['v1', 'v2']) {
          ENCOUNTERS[key].forEach((e) => {
            const j = jumpAt(D[key], e.t);
            rows.push(`<tr><td>${key === 'v1' ? 'Voyager 1' : 'Voyager 2'} · ${e.name} (${e.date})</td><td>${fmt(j.v0, 2)}</td><td>${fmt(j.v1, 2)}</td><td>${(j.v1 - j.v0 >= 0 ? '+' : '') + fmt(j.v1 - j.v0, 2)}</td><td>${fmt(j.e0, 0)} → ${fmt(j.e1, 0)}</td><td>${j.e0 < 0 && j.e1 >= 0 ? 'pasa a escapar' : j.e1 >= 0 ? 'escapa' : 'ligada'}</td></tr>`);
          });
        }
        $('table').innerHTML = '<thead><tr><th>Encuentro</th><th>v antes (km/s)</th><th>v después (km/s)</th><th>Δv (km/s)</th><th>ε (km²/s²)</th><th>Estado</th></tr></thead><tbody>' + rows.join('') + '</tbody>';
      }
      el.querySelectorAll('[data-probe]').forEach((b) => b.addEventListener('click', () => {
        probe = b.dataset.probe;
        el.querySelectorAll('[data-probe]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        drawChart();
      }));
      $('esc').addEventListener('change', drawChart);
      $('csv').addEventListener('click', () => {
        UI.downloadCSV('voyager-rapidez-heliocentrica.csv',
          { v1_anio: D.v1.t, v1_v_kms: D.v1.v, v1_r_UA: D.v1.r, v2_anio: D.v2.t, v2_v_kms: D.v2.v, v2_r_UA: D.v2.r },
          'Fuente: NASA/JPL Horizons System, vectores de estado heliocentricos (500@10, ecliptica), consulta 2026-10-31.\nv = |v| respecto al Sol. Muestreo cada 2 dias cerca de los encuentros y cada 10 dias en el resto.');
      });

      /* ---------- Laboratorio de sobrevuelo ---------- */
      const cv = $('vec'), ctx = cv.getContext('2d');
      function drawVectors(f, U) {
        const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 520, H = Math.round(Math.min(340, Math.max(240, W * 0.6)));
        cv.style.height = H + 'px'; if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = W * dpr; cv.height = H * dpr; }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        const c = col();
        const pts = [[0, 0], [U, 0], [f.vin.x, f.vin.y], [f.vout.x, f.vout.y]];
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        const s = Math.min((W - 60) / Math.max(1, maxX - minX), (H - 70) / Math.max(1, maxY - minY));
        const ox = 30 - minX * s, oy = 40 + maxY * s;
        const X = (x) => ox + x * s, Y = (y) => oy - y * s;
        const arr = (x0, y0, x1, y1, color, w, label, dash) => {
          ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash ? [6, 4] : []);
          ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke(); ctx.setLineDash([]);
          const a = Math.atan2(Y(y1) - Y(y0), X(x1) - X(x0));
          ctx.beginPath(); ctx.moveTo(X(x1), Y(y1)); ctx.lineTo(X(x1) - 10 * Math.cos(a - 0.4), Y(y1) - 10 * Math.sin(a - 0.4)); ctx.lineTo(X(x1) - 10 * Math.cos(a + 0.4), Y(y1) - 10 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
          if (label) { ctx.font = '12px "IBM Plex Sans", sans-serif'; ctx.fillStyle = UI.cssVar('--text', '#fff'); ctx.textAlign = 'left'; ctx.fillText(label, X((x0 + x1) / 2) + 6, Y((y0 + y1) / 2) - 6); }
        };
        // círculo de radio v∞ centrado en la punta de U: todas las salidas posibles en el marco del planeta
        ctx.strokeStyle = UI.cssVar('--grid', 'rgba(255,255,255,.1)'); ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.arc(X(U), Y(0), Math.hypot(f.vin.x - U, f.vin.y) * s, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
        arr(0, 0, U, 0, c.force, 3, 'U (planeta)');
        arr(U, 0, f.vin.x, f.vin.y, c.pos, 1.6, 'v∞ llegada', true);
        arr(U, 0, f.vout.x, f.vout.y, c.vel, 1.6, 'v∞ salida', true);
        arr(0, 0, f.vin.x, f.vin.y, c.pos, 2.6, 'v llegada (Sol)');
        arr(0, 0, f.vout.x, f.vout.y, c.vel, 2.6, 'v salida (Sol)');
        ctx.font = '11px "IBM Plex Mono", monospace'; ctx.fillStyle = UI.cssVar('--text-dim', '#9ab'); ctx.textAlign = 'left';
        ctx.fillText('El círculo punteado: |v∞| no cambia en el marco del planeta', 10, H - 10);
      }
      function updateFlyby() {
        const p = PLANETS[$('planet').value];
        const f = P.flyby({ mu: p.mu, rp: +$('rp').value * p.R, vinf: +$('vinf').value, U: p.U, phiIn: +$('phi').value, side: $('side').checked ? 1 : -1 });
        $('o-dv').textContent = (f.dv >= 0 ? '+' : '') + fmt(f.dv, 2); $('o-d').textContent = fmt(f.deltaDeg, 1);
        $('o-in').textContent = fmt(f.sIn, 2); $('o-out').textContent = fmt(f.sOut, 2);
        $('status').className = 'status' + (f.dv < 0 ? ' warn' : '');
        $('status').textContent = f.dv >= 0 ? `La sonda gana ${fmt(f.dv, 2)} km/s respecto al Sol; ${p.name} pierde la misma cantidad de momento (imperceptible para su masa).` : 'Al pasar por delante, la sonda cede energía al planeta y frena respecto al Sol (como Voyager 2 en Neptuno).';
        drawVectors(f, p.U);
      }
      ['planet', 'side'].forEach((id) => $(id).addEventListener('change', updateFlyby));
      UI.bindSliders(el, updateFlyby);
      window.addEventListener('resize', updateFlyby);
      drawChart(); buildTable(); updateFlyby();
    },
  };

  Portfolio.register(T);
})();
