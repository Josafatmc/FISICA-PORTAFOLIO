/* ==========================================================================
   Tema 7 — El coeficiente de restitución en un motor de videojuego:
            por qué la pelota rebota mal
   Recurso prescrito: SIMULACIÓN INTERACTIVA
   Dos pelotas con el mismo coeficiente e: una con la física ideal (analítica) y
   otra integrada como lo hace un motor de juego (paso fijo, combinación de
   materiales y umbral de rebote). Todo se recalcula al mover un control.
   ========================================================================== */
(function () {
  'use strict';
  const tex = String.raw;
  const { eq, ie, tag, varTable, tradeoff, slider, readout, numberField, fmt } = UI;
  const { cite } = Portfolio;
  const P = Physics;

  const PRESETS = [
    { id: 'clay', name: 'Plastilina', e: 0.1 },
    { id: 'tennis', name: 'Tenis (ITF)', e: 0.75 },
    { id: 'basket', name: 'Baloncesto (FIBA)', e: 0.85 },
    { id: 'super', name: 'Superbola', e: 0.92 },
    { id: 'bug', name: 'Error: e = 1,1', e: 1.1 },
  ];
  const MODES = [['avg', 'Promedio (Average, predeterminado)'], ['min', 'Mínimo (Minimum)'], ['mul', 'Producto (Multiply)'], ['max', 'Máximo (Maximum)']];
  const DURATION = 8;

  /** Trayectoria ideal: subpasos muy finos, sin umbral (salvo para cortar la serie infinita de rebotes). */
  function simulate({ h0, e, dt, threshold, g }) {
    let s = { y: h0, vy: 0 }, t = 0, bounces = 0, rest = null;
    const T = [0], Y = [h0], peaks = [];
    let rising = false, acc = 0;
    const sub = dt;
    while (t < DURATION) {
      const prevVy = s.vy;
      s = P.bounceStep(s, { g, e, dt: sub, threshold });
      t += sub; acc += sub;
      if (s.hit) {
        if (s.vy > 0) { bounces++; rising = true; } else if (rest == null) rest = t; // en reposo: el contacto no es un rebote
      }
      if (rising && prevVy > 0 && s.vy <= 0) { peaks.push({ t, y: s.y }); rising = false; }
      if (s.vy === 0 && s.y <= 0) { s = { y: 0, vy: 0 }; if (rest == null) rest = t; }
      if (acc >= 0.01 - 1e-9 || sub >= 0.01) { T.push(+t.toFixed(4)); Y.push(Math.max(0, s.y)); acc = 0; }
      if (s.y > 1e4) break; // e > 1: la energía crece sin límite
    }
    return { t: T, y: Y, peaks, bounces, rest };
  }

  const T = {
    id: 'tema-7', number: 7, accent: 'vel', avance: 'Avance 2',
    title: 'El coeficiente de restitución en un motor de videojuego: por qué la pelota rebota mal',
    resource: 'Simulación interactiva',
    concepts: ['Colisiones elásticas e inelásticas', 'Conservación del momento lineal', 'Coeficiente de restitución'],
    summary: 'Un solo número decide si una pelota de juego se siente de goma, de plastilina o imposible. Y el motor puede cambiarlo sin que usted lo note.',

    html() {
      return String.raw`
      ${Portfolio.head(T)}

      <div class="tblock">
        <h3>Introducción al problema</h3>
        <p>En un juego, un programador le asigna a la pelota un rebote de 0,8, la deja caer… y apenas rebota. O rebota para siempre. O se queda pegada al suelo de golpe en el último bote. Ninguno de esos comportamientos es un error de la física: son consecuencias de <strong>cómo el motor aplica el coeficiente de restitución</strong>. La pregunta es: <strong>¿qué ecuación usa el motor en cada choque y qué decisiones de implementación hacen que la pelota «se sienta mal»?</strong></p>
      </div>

      <div class="tblock">
        <h3>Caso de uso en ingeniería del software</h3>
        <p><strong>Industria:</strong> videojuegos y simulación. <strong>Sistema:</strong> el motor de física de Unity (PhysX) y, en 2D, Box2D, que resuelven los contactos de cada cuadro con un coeficiente de restitución.</p>
        <p>${tag('hecho')} En Unity, cada material físico tiene una propiedad <em>Bounciness</em> (0 = sin rebote, 1 = sin pérdida de energía) y un modo <em>Bounce Combine</em> que decide cómo se combinan los valores de los dos objetos que chocan: promedio, mínimo, producto o máximo ${cite('unity-physmat')}. ${tag('hecho')} La configuración global del motor incluye un <em>Bounce Threshold</em>: si dos objetos chocan con una rapidez relativa menor que ese umbral, no rebotan ${cite('unity-physics')}. ${tag('hecho')} Box2D tiene un umbral equivalente para la restitución y calcula la velocidad de salida con el coeficiente de restitución de cada contacto ${cite('box2d')}.</p>
        <p>El resultado clásico: la pelota tiene <em>Bounciness</em> 0,8, el suelo usa el material predeterminado (0) y el modo es «promedio», así que el motor usa ${ie('e=(0{,}8+0)/2=0{,}4')}. La pelota rebota a ${ie('0{,}4^2=16\\,\\%')} de su altura en vez del 64 % esperado.</p>
      </div>

      <div class="tblock">
        <h3>Concepto físico y ecuaciones</h3>
        <p>En todo choque entre dos cuerpos aislados se <strong>conserva el momento lineal</strong>, porque las fuerzas de contacto son un par acción-reacción ${cite('openstax')}. El coeficiente de restitución mide qué fracción de la velocidad relativa se recupera:</p>
        ${eq(tex`m_1 v_1+m_2 v_2=m_1 v_1'+m_2 v_2' \qquad e=-\frac{v_2'-v_1'}{v_2-v_1}`, 'Conservación del momento lineal (siempre) y definición del coeficiente de restitución.')}
        ${eq(tex`v_1'=\frac{m_1v_1+m_2v_2+m_2\,e\,(v_2-v_1)}{m_1+m_2}\qquad v_2'=\frac{m_1v_1+m_2v_2+m_1\,e\,(v_1-v_2)}{m_1+m_2}`, 'Solución de las dos ecuaciones anteriores. e = 1: choque elástico (se conserva K). e = 0: perfectamente inelástico (salen juntos).')}
        <p>Contra el suelo (masa «infinita», ${ie('v_2=0')}) queda ${ie("v'=-e\\,v")}. Como la altura crece con el cuadrado de la velocidad:</p>
        ${eq(tex`h_{n}=e^{2n}\,h_0\qquad \frac{\Delta K}{K}=1-e^{2}\qquad t_{\text{reposo}}=\sqrt{\frac{2h_0}{g}}\;\frac{1+e}{1-e}`, 'Altura tras n rebotes, fracción de energía cinética perdida en cada choque y tiempo total hasta el reposo (serie geométrica, e < 1).')}
        <p>Lo que hace un motor en cada paso fijo ${ie('\\Delta t')} (Euler semi-implícito y resolución del contacto):</p>
        ${eq(tex`v\leftarrow v-g\,\Delta t,\quad y\leftarrow y+v\,\Delta t;\qquad \text{si } y\le 0:\; y\leftarrow 0,\; v\leftarrow\begin{cases}-e\,v & |v|\ge v_{\text{umbral}}\\ 0 & |v|<v_{\text{umbral}}\end{cases}`)}
        ${varTable([
          ['m_1,\\ m_2', 'masas de los cuerpos que chocan', 'kg'],
          ["v,\\ v'", 'velocidades antes y después del choque', 'm/s'],
          ['e', 'coeficiente de restitución (adimensional)', '—'],
          ['h_0,\\ h_n', 'altura inicial y altura tras n rebotes', 'm'],
          ['K', 'energía cinética ½ m v²', 'J'],
          ['\\Delta t', 'paso fijo de la física del motor', 's'],
          ['v_{\\text{umbral}}', 'rapidez mínima para que el motor aplique rebote', 'm/s'],
        ])}
      </div>

      <div class="tblock">
        <h3>Cómo se usa la física para resolver el problema</h3>
        <p>Con la ecuación ${ie("v'=-e\\,v")} el motor no necesita saber nada de la pelota más que un número: cualquier altura, velocidad o ángulo da un rebote coherente. Y la misma ecuación diagnostica los rebotes «malos»: si el bote es demasiado bajo, el ${ie('e')} efectivo no es el que se escribió (combinación de materiales); si la pelota se detiene de golpe, el último impacto cayó bajo el umbral; si gana altura, ${ie('e>1')} o el paso de integración está inyectando energía.</p>
        ${tradeoff(
          `<ul><li>Un parámetro (e) produce rebotes coherentes para cualquier caída o choque, también entre objetos que el diseñador no previó.</li><li>El momento se conserva: empujar, chocar y lanzar son consistentes entre sí.</li><li>Medir dos alturas basta para calibrar e de un objeto real: ${ie('e=\\sqrt{h_1/h_0}')}.</li></ul>`,
          `<ul><li>e real depende de la velocidad, la temperatura y el ángulo; un e constante es una aproximación.</li><li>La integración por pasos y el umbral cambian el resultado; hay que entender el motor para que coincida con la intención.</li><li>Con muchos contactos simultáneos (pilas de objetos) el solver itera y la restitución puede producir temblores.</li></ul>`
        )}
        <p><strong>Frente a la alternativa no física:</strong> una animación de rebote hecha a mano funciona para una caída concreta, pero no para la pelota que golpea una esquina, otra pelota o una plataforma que se mueve. Las alturas decrecientes «a ojo» además suelen violar la proporción ${ie('h_{n+1}/h_n=e^2')} que el ojo reconoce como natural.</p>
      </div>

      <div class="tblock">
        <h3>Recurso: simulación interactiva</h3>
        <div class="lab">
          <div class="lab-head"><h4>Laboratorio de rebote: física ideal frente a motor de juego</h4><span class="badge">h₀ en metros · g = 9,81 m/s²</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                ${slider({ id: 't7-eb', label: 'Rebote de la pelota (Bounciness)', min: 0, max: 1.2, step: 0.01, value: 0.8, unit: '', dec: 2 })}
                <div class="presets" role="group" aria-label="Pelotas de referencia">${PRESETS.map((p) => `<button type="button" class="btn" data-preset="${p.id}">${p.name}: ${fmt(p.e, 2)}</button>`).join('')}</div>
                ${slider({ id: 't7-ef', label: 'Rebote del suelo', min: 0, max: 1.2, step: 0.01, value: 0, unit: '', dec: 2, hint: 'El material predeterminado de Unity tiene rebote 0: así empieza la simulación.' })}
                <div class="ctrl"><label for="t7-mode">Modo de combinación (Bounce Combine)</label>
                  <select id="t7-mode">${MODES.map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></div>
                ${slider({ id: 't7-h0', label: 'Altura inicial h₀', min: 0.5, max: 10, step: 0.1, value: 4, unit: 'm', dec: 1 })}
                ${slider({ id: 't7-thr', label: 'Umbral de rebote del motor', min: 0, max: 4, step: 0.1, value: 2, unit: 'm/s', dec: 1, hint: 'Unity usa 2 m/s por defecto.' })}
                ${slider({ id: 't7-dt', label: 'Paso fijo de la física Δt', min: 0.002, max: 0.08, step: 0.002, value: 0.02, unit: 's', dec: 3, hint: '0,02 s (50 Hz) es el valor predeterminado de Unity.' })}
                <div class="btns">
                  <button class="btn primary" id="t7-play" type="button">Soltar</button>
                  <button class="btn" id="t7-pause" type="button">Pausar</button>
                  <button class="btn" id="t7-reset" type="button">Reiniciar</button>
                </div>
                <p class="status" id="t7-status" role="status"></p>
              </div>
              <div class="chart-stack">
                <div class="viz"><canvas id="t7-scene" aria-label="Dos pelotas que rebotan: a la izquierda con la física ideal, a la derecha como las integra el motor de juego"></canvas></div>
                <div class="readouts">
                  ${readout({ id: 't7-o-e', label: 'e que usa el motor', unit: '', color: 'vel', big: true })}
                  ${readout({ id: 't7-o-h1', label: 'Altura del 1.er rebote (ideal)', unit: 'm', color: 'pos' })}
                  ${readout({ id: 't7-o-h1m', label: 'Altura del 1.er rebote (motor)', unit: 'm', color: 'acc' })}
                  ${readout({ id: 't7-o-loss', label: 'Energía perdida por choque', unit: '%', color: 'force' })}
                  ${readout({ id: 't7-o-trest', label: 'Tiempo hasta el reposo (ideal)', unit: 's', color: 'result' })}
                  ${readout({ id: 't7-o-n', label: 'Rebotes del motor en 8 s', unit: '', color: 'result' })}
                </div>
              </div>
            </div>
            <div class="chart-wrap tall"><canvas id="t7-chart"></canvas></div>
          </div>
        </div>

        <div class="lab" style="margin-top:18px">
          <div class="lab-head"><h4>Choque frontal entre dos cuerpos</h4><span class="badge">Momento conservado para cualquier e</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                ${numberField({ id: 't7-m1', label: 'Masa 1', min: 0.01, max: 1000, step: 0.1, value: 1, unit: 'kg' })}
                ${numberField({ id: 't7-v1', label: 'Velocidad 1', min: -50, max: 50, step: 0.5, value: 4, unit: 'm/s' })}
                ${numberField({ id: 't7-m2', label: 'Masa 2', min: 0.01, max: 1000, step: 0.1, value: 2, unit: 'kg' })}
                ${numberField({ id: 't7-v2', label: 'Velocidad 2', min: -50, max: 50, step: 0.5, value: -1, unit: 'm/s' })}
                ${slider({ id: 't7-ec', label: 'Coeficiente de restitución e', min: 0, max: 1, step: 0.01, value: 0.6, unit: '', dec: 2 })}
              </div>
              <div class="chart-stack">
                <div class="viz"><canvas id="t7-col" aria-label="Velocidades de los dos cuerpos antes y después del choque"></canvas></div>
                <div class="readouts">
                  ${readout({ id: 't7-o-v1p', label: "v₁' después", unit: 'm/s', color: 'pos' })}
                  ${readout({ id: 't7-o-v2p', label: "v₂' después", unit: 'm/s', color: 'acc' })}
                  ${readout({ id: 't7-o-p', label: 'Momento antes → después', unit: 'kg·m/s', color: 'result' })}
                  ${readout({ id: 't7-o-k', label: 'Energía cinética antes → después', unit: 'J', color: 'force' })}
                </div>
                <p class="status" id="t7-cstatus" role="status"></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="tblock">
        <h3>Interpretación de los resultados</h3>
        <ul>
          <li><strong>Rebote «muerto»:</strong> con la pelota en 0,8 y el suelo en 0 (modo promedio) el motor usa ${ie('e=0{,}4')}: la pelota pierde ${ie('1-0{,}4^2=84\\,\\%')} de su energía en el primer choque. La solución es poner también material al suelo o elegir el modo «máximo».</li>
          <li><strong>La pelota se queda pegada:</strong> con el umbral en 2 m/s, cuando la rapidez de impacto cae debajo de ese valor el motor hace ${ie("v'=0")}. Una pelota que en la física ideal daría varios botes pequeños se detiene de golpe; con umbral 0 los botecitos vuelven.</li>
          <li><strong>Paso de integración:</strong> suba Δt a 0,06 s y compare las dos pelotas. El motor detecta el contacto tarde (la pelota ya atravesó el suelo) y al recolocarla en y = 0 cambia su energía: las alturas dejan de seguir ${ie('e^{2n}h_0')}.</li>
          <li><strong>e &gt; 1:</strong> la pelota sube cada vez más alto: el choque crea energía, algo imposible en un objeto pasivo. Es la marca de un valor mal configurado.</li>
          <li><strong>Choque entre dos cuerpos:</strong> el momento antes y después coincide para cualquier ${ie('e')}; la energía cinética solo se conserva con ${ie('e=1')}. Con ${ie('e=0')} ambos salen con la misma velocidad.</li>
        </ul>
      </div>

      <div class="tblock">
        <h3>Limitaciones, supuestos y clasificación de afirmaciones</h3>
        <ul class="claims">
          <li>${tag('hecho')}<span>Propiedades Bounciness, Bounce Combine y Bounce Threshold de Unity ${cite('unity-physmat', 'unity-physics')}; umbral de restitución de Box2D ${cite('box2d')}. Alturas reglamentarias de rebote de pelotas de tenis ${cite('itf-rules')} y baloncesto ${cite('fiba-equip')}, de donde se estimó ${ie('e=\\sqrt{h_1/h_0}')}.</span></li>
          <li>${tag('calculo')}<span>Alturas, energías, tiempos y velocidades del laboratorio.</span></li>
          <li>${tag('supuesto')}<span>Pelota como partícula, sin aire ni giro, suelo fijo e indeformable, e independiente de la velocidad. El «motor» de la derecha es una reproducción simplificada del esquema de paso fijo, no el código de PhysX.</span></li>
          <li>${tag('hipotesis')}<span>Los valores de plastilina y superbola son ilustrativos. Los e del tenis y del baloncesto son estimaciones a partir de las alturas reglamentarias, no mediciones propias.</span></li>
        </ul>
      </div>

      ${Portfolio.connections([
        { to: 'tema-2', text: 'Entre dos rebotes la pelota es un proyectil: la misma caída libre del salto del personaje, con la misma g del juego.' },
        { to: 'tema-5', text: 'Durante el contacto la pelota se comprime como un resorte (Hooke); e < 1 indica que el resorte no devuelve toda la energía almacenada.' },
        { to: 'tema-6', text: 'La energía que pierde la pelota en cada choque (1 − e²) se va como calor y sonido, igual que la energía que disipan los frenos de fricción.' },
        { to: 'tema-9', text: 'Una asistencia gravitatoria se analiza como un choque elástico (e = 1) entre la sonda y el planeta en el marco del planeta.' },
      ])}
      ${Portfolio.sources(['unity-physmat', 'unity-physics', 'box2d', 'itf-rules', 'fiba-equip', 'openstax'])}
      `;
    },

    init(el) {
      const $ = (id) => el.querySelector('#t7-' + id);
      const cs = $('scene'), ctx = cs.getContext('2d');
      const cc = $('col'), cctx = cc.getContext('2d');
      const col = () => ({ pos: UI.cssVar('--c-pos', '#33a3bf'), vel: UI.cssVar('--c-vel', '#c08801'), acc: UI.cssVar('--c-acc', '#e36574'), force: UI.cssVar('--c-force', '#9882dd'), res: UI.cssVar('--c-result', '#49a980') });
      const chart = new LineChart($('chart'), { title: 'Altura de la pelota en función del tiempo', xLabel: 'Tiempo t', xUnit: 's', yLabel: 'Altura y', yUnit: 'm', includeZeroY: true, decimalsTooltip: 2 });
      const st = { ideal: null, eng: null, t: 0, e: 0.4 };

      function eff() { return P.combineRestitution(+$('eb').value, +$('ef').value, $('mode').value); }
      function recompute() {
        const e = eff(), h0 = +$('h0').value, g = 9.81;
        st.e = e;
        st.ideal = simulate({ h0, e, dt: 0.0005, threshold: 0.02, g });
        st.eng = simulate({ h0, e, dt: +$('dt').value, threshold: +$('thr').value, g });
        const c = col();
        chart.update({ xMin: 0, xMax: DURATION, series: [
          { name: 'Física ideal', color: c.pos, x: st.ideal.t, y: st.ideal.y },
          { name: 'Motor de juego (Δt fijo + umbral)', color: c.acc, x: st.eng.t, y: st.eng.y, dashed: true },
        ] });
        $('o-e').textContent = fmt(e, 2);
        $('o-h1').textContent = fmt(P.bounceHeight(h0, e, 1), 2);
        $('o-h1m').textContent = st.eng.peaks[0] ? fmt(st.eng.peaks[0].y, 2) : '0,00';
        $('o-loss').textContent = fmt((1 - e * e) * 100, 1);
        $('o-trest').textContent = e < 1 ? fmt(P.timeToRest(h0, e, g), 2) : '∞';
        $('o-n').textContent = String(st.eng.bounces);
        const s = $('status');
        s.className = 'status' + (e > 1 || e < 0.45 ? ' warn' : '');
        s.textContent = e > 1 ? 'e > 1: cada choque crea energía. Ninguna pelota real hace esto.'
          : (Math.abs(e - +$('eb').value) > 0.005 ? `El motor combinó ${fmt(+$('eb').value, 2)} y ${fmt(+$('ef').value, 2)} → e = ${fmt(e, 2)}. La pelota no rebota como se configuró.` : '');
        st.t = Math.min(st.t, DURATION); render();
      }

      const idx = (sim, t) => ChartUtils.interpolate(sim.t, sim.y, t) ?? sim.y[sim.y.length - 1];

      function drawScene() {
        const dpr = window.devicePixelRatio || 1, W = cs.clientWidth || 560, H = Math.round(Math.min(380, Math.max(260, W * 0.6)));
        cs.style.height = H + 'px'; if (cs.width !== Math.round(W * dpr) || cs.height !== Math.round(H * dpr)) { cs.width = W * dpr; cs.height = H * dpr; }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        const c = col(), padT = 34, padB = 30, gy = H - padB;
        const maxY = Math.max(+$('h0').value, ...st.ideal.y.slice(0, 400), ...st.eng.y.slice(0, 400)) * 1.08;
        const s = (gy - padT) / Math.max(1, Math.min(maxY, 40));
        const Y = (y) => gy - Math.min(y, 40) * s;
        // regla en metros
        const tk = ChartUtils.niceTicks(0, Math.min(maxY, 40), 6);
        ctx.font = '11px "IBM Plex Mono", monospace'; ctx.fillStyle = UI.cssVar('--text-dim', '#9ab'); ctx.textAlign = 'right';
        for (const v of tk.ticks) { ctx.strokeStyle = UI.cssVar('--grid', 'rgba(255,255,255,.08)'); ctx.beginPath(); ctx.moveTo(40, Y(v)); ctx.lineTo(W - 10, Y(v)); ctx.stroke(); ctx.fillText(fmt(v, tk.step < 1 ? 1 : 0), 34, Y(v) + 4); }
        ctx.textAlign = 'left'; ctx.fillText('y (m)', 4, 14);
        // suelo
        ctx.fillStyle = 'rgba(165,190,235,0.16)'; ctx.fillRect(40, gy, W - 50, 6);
        ctx.strokeStyle = 'rgba(190,210,245,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, gy); ctx.lineTo(W - 10, gy); ctx.stroke();
        const lanes = [{ sim: st.ideal, x: 40 + (W - 50) * 0.3, color: c.pos, name: 'Física ideal' }, { sim: st.eng, x: 40 + (W - 50) * 0.72, color: c.acc, name: 'Motor de juego' }];
        const r = 11;
        for (const L of lanes) {
          ctx.font = '600 12.5px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = UI.cssVar('--text', '#fff'); ctx.fillText(L.name, L.x, 18);
          // marcas de las alturas de los picos ya alcanzados
          ctx.strokeStyle = L.color; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
          for (const p of L.sim.peaks) { if (p.t > st.t) break; ctx.beginPath(); ctx.moveTo(L.x - 34, Y(p.y)); ctx.lineTo(L.x + 34, Y(p.y)); ctx.stroke(); }
          ctx.setLineDash([]); ctx.globalAlpha = 1;
          const y = idx(L.sim, st.t), py = Y(y) - r;
          // sombra en el suelo que crece al acercarse
          const sh = Math.max(0.15, 1 - y / Math.max(1, maxY));
          ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(L.x, gy + 2, r * 1.3 * sh, 3.5 * sh, 0, 0, 6.2832); ctx.fill();
          const grad = ctx.createRadialGradient(L.x - 4, py - 4, 2, L.x, py, r);
          grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.25, L.color); grad.addColorStop(1, L.color);
          ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(L.x, py, r, 0, 6.2832); ctx.fill();
        }
        ctx.font = '11px "IBM Plex Mono", monospace'; ctx.fillStyle = UI.cssVar('--text-dim', '#9ab'); ctx.textAlign = 'right';
        ctx.fillText('t = ' + fmt(st.t, 2) + ' s · e = ' + fmt(st.e, 2), W - 10, H - 8);
      }

      function render() { chart.update({ cursorX: st.t }); drawScene(); }

      const loop = UI.animationLoop((dt) => {
        st.t += dt;
        if (st.t >= DURATION) { st.t = DURATION; render(); $('status').textContent = $('status').textContent || 'Fin de los 8 s simulados. Pulse «Soltar» para repetir.'; return false; }
        render();
      });
      $('play').addEventListener('click', () => { if (st.t >= DURATION) st.t = 0; loop.start(); });
      $('pause').addEventListener('click', () => loop.stop());
      $('reset').addEventListener('click', () => { loop.stop(); st.t = 0; render(); });
      el.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
        const pr = PRESETS.find((x) => x.id === b.dataset.preset);
        UI.setSlider(el, 't7-eb', pr.e); UI.setSlider(el, 't7-ef', pr.e); $('mode').value = 'avg';
        st.t = 0; recompute(); loop.start();
      }));
      $('mode').addEventListener('change', () => { st.t = 0; recompute(); });

      /* ---------- Choque de dos cuerpos ---------- */
      function drawCollision(r, ok) {
        const dpr = window.devicePixelRatio || 1, W = cc.clientWidth || 520, H = 190;
        cc.style.height = H + 'px'; if (cc.width !== Math.round(W * dpr)) { cc.width = W * dpr; cc.height = H * dpr; }
        cctx.setTransform(dpr, 0, 0, dpr, 0, 0); cctx.clearRect(0, 0, W, H);
        if (!ok) return;
        const c = col(), vals = [UI.num(el, 't7-v1'), UI.num(el, 't7-v2'), r.v1p, r.v2p];
        const vmax = Math.max(1, ...vals.map(Math.abs)), cx = W / 2, sc = (W / 2 - 70) / vmax;
        const rows = [['Antes', vals[0], vals[1], 52], ['Después', vals[2], vals[3], 130]];
        cctx.strokeStyle = UI.cssVar('--axis', '#567'); cctx.beginPath(); cctx.moveTo(cx, 20); cctx.lineTo(cx, H - 14); cctx.stroke();
        cctx.font = '600 12px "IBM Plex Sans", sans-serif'; cctx.fillStyle = UI.cssVar('--text-dim', '#9ab'); cctx.textAlign = 'left';
        for (const [name, a, b, y] of rows) {
          cctx.fillText(name, 8, y - 22);
          [[a, c.pos, y - 9, 'v₁'], [b, c.acc, y + 9, 'v₂']].forEach(([v, color, yy, lab]) => {
            const len = v * sc; cctx.strokeStyle = color; cctx.fillStyle = color; cctx.lineWidth = 4;
            cctx.beginPath(); cctx.moveTo(cx, yy); cctx.lineTo(cx + len, yy); cctx.stroke();
            if (Math.abs(len) > 6) { const d = Math.sign(len); cctx.beginPath(); cctx.moveTo(cx + len + d * 6, yy); cctx.lineTo(cx + len - d * 4, yy - 6); cctx.lineTo(cx + len - d * 4, yy + 6); cctx.closePath(); cctx.fill(); }
            cctx.fillStyle = UI.cssVar('--text', '#fff'); cctx.font = '12px "IBM Plex Mono", monospace'; cctx.textAlign = len >= 0 ? 'left' : 'right';
            cctx.fillText(`${lab} = ${fmt(v, 2)} m/s`, cx + len + (len >= 0 ? 12 : -12), yy + 4);
            cctx.font = '600 12px "IBM Plex Sans", sans-serif'; cctx.textAlign = 'left'; cctx.fillStyle = UI.cssVar('--text-dim', '#9ab');
          });
        }
      }
      function updateCollision() {
        const ids = { m1: [0.01, 1000], v1: [-50, 50], m2: [0.01, 1000], v2: [-50, 50] };
        let ok = true;
        for (const [k, [lo, hi]] of Object.entries(ids)) {
          const v = UI.num(el, 't7-' + k), bad = !(v >= lo && v <= hi);
          UI.fieldError(el, 't7-' + k, bad ? `Ingrese un valor entre ${fmt(lo, 2)} y ${fmt(hi, 0)}.` : ''); if (bad) ok = false;
        }
        const m1 = UI.num(el, 't7-m1'), v1 = UI.num(el, 't7-v1'), m2 = UI.num(el, 't7-m2'), v2 = UI.num(el, 't7-v2'), e = +$('ec').value;
        if (ok && v1 <= v2) { ok = false; $('cstatus').className = 'status warn'; $('cstatus').textContent = 'Con v₁ ≤ v₂ los cuerpos no se acercan y no hay choque. Haga v₁ mayor que v₂.'; }
        if (!ok) { ['v1p', 'v2p', 'p', 'k'].forEach((i) => ($('o-' + i).textContent = '—')); drawCollision(null, false); return; }
        const r = P.collide1D(m1, v1, m2, v2, e);
        $('o-v1p').textContent = fmt(r.v1p, 2); $('o-v2p').textContent = fmt(r.v2p, 2);
        $('o-p').textContent = fmt(r.p0, 2) + ' → ' + fmt(r.p1, 2); $('o-k').textContent = fmt(r.K0, 1) + ' → ' + fmt(r.K1, 1);
        $('cstatus').className = 'status';
        $('cstatus').textContent = e === 1 ? 'Choque elástico: se conservan el momento y la energía cinética.'
          : `Se perdió ${fmt(-r.dK, 2)} J (${fmt(r.K0 > 0 ? (-r.dK / r.K0) * 100 : 0, 1)} % de K), convertidos en calor, sonido y deformación. El momento no cambió.`;
        drawCollision(r, true);
      }
      ['m1', 'v1', 'm2', 'v2'].forEach((i) => $(i).addEventListener('input', updateCollision));

      UI.bindSliders(el, (inp) => { if (inp.id === 't7-ec') updateCollision(); else { st.t = 0; recompute(); } });
      window.addEventListener('resize', () => { render(); updateCollision(); });
      recompute(); updateCollision();
    },
  };

  Portfolio.register(T);
})();
