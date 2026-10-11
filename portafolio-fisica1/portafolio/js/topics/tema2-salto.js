/* ==========================================================================
   Tema 2 — El salto del personaje: cómo los motores de juego falsean la gravedad
   Recurso prescrito: SIMULACIÓN INTERACTIVA
   La trayectoria se recalcula con las ecuaciones del tiro parabólico cada vez
   que cambia un control (impulso v0, gravedad g, multiplicador de caída k, vx).
   ========================================================================== */
(function () {
  'use strict';
  const tex = String.raw;
  const { eq, ie, tag, varTable, tradeoff, slider, readout, numberField, fmt } = UI;
  const { cite } = Portfolio;
  const P = Physics;

  const PRESETS = [
    { id: 'earth', name: 'Tierra', g: 9.81 },
    { id: 'mars', name: 'Marte', g: 3.71 },
    { id: 'moon', name: 'Luna', g: 1.62 },
    { id: 'game', name: 'Plataformero (3 m en 0,4 s)', g: 37.5 },
  ];

  const T = {
    id: 'tema-2', number: 2, accent: 'vel',
    title: 'El salto del personaje: cómo los motores de juego falsean la gravedad',
    resource: 'Simulación interactiva',
    concepts: ['Caída libre', 'Tiro parabólico', 'Altura y tiempo de vuelo'],
    summary: 'Por qué casi ningún juego usa 9,81 m/s² y cómo se eligen el impulso y la gravedad para que un salto se sienta bien.',

    html() {
      return String.raw`
      ${Portfolio.head(T)}

      <div class="tblock">
        <h3>Introducción al problema</h3>
        <p>Un personaje de videojuego debe saltar tres metros, quedarse en el aire menos de un segundo y responder al instante al botón. Si se usa la gravedad terrestre, 9,81 m/s², el salto sale lento y flotante o no llega a la plataforma. El problema de diseño es: <strong>¿qué impulso y qué gravedad dan la altura y el tiempo en el aire que el nivel necesita?</strong> La respuesta es física elemental, pero con los parámetros elegidos por el diseñador y no por la Tierra.</p>
      </div>

      <div class="tblock">
        <h3>Caso de uso en ingeniería del software</h3>
        <p><strong>Industria:</strong> videojuegos de plataformas 2D y 3D. <strong>Sistema:</strong> el código de movimiento del personaje dentro de un motor de juego.</p>
        <p>${tag('hecho')} En su charla «Math for Game Programmers: Building a Better Jump» (GDC 2016), Kyle Pittman, de Minor Key Games, muestra cómo construir trayectorias de salto de aspecto natural a partir de datos que un diseñador entiende, como la altura y la distancia deseadas, y cómo extenderlas a saltos no parabólicos, por ejemplo variando la altura según el botón o cayendo más rápido tras el pico ${cite('pittman-gdc')}. Una reseña de la charla reporta que, en el ejemplo de Mario, la gravedad se triplica después de alcanzar la altura máxima ${cite('patterson-gdc')}; es una fuente secundaria y no se trata aquí como un valor medido.</p>
        <p>En ese sistema, la posición vertical del personaje se calcula con las ecuaciones de la caída libre. Cualquier combinación de impulso y gravedad produce un salto coherente sin tener que animar cada caso a mano.</p>
      </div>

      <div class="tblock">
        <h3>Concepto físico y ecuaciones</h3>
        <p>Con aceleración constante ${ie('-g')} en vertical, el movimiento es el de un proyectil ${cite('openstax')}:</p>
        ${eq(tex`y(t)=y_0+v_{0y}\,t-\tfrac12\,g\,t^{2} \qquad v_y(t)=v_{0y}-g\,t \qquad x(t)=x_0+v_x\,t`, 'Posición y velocidad verticales y movimiento horizontal uniforme.')}
        ${eq(tex`t_{\text{subida}}=\frac{v_{0y}}{g}\qquad h_{\max}=y_0+\frac{v_{0y}^{2}}{2g}\qquad t_{\text{vuelo}}=\frac{2\,v_{0y}}{g}\qquad R=v_x\,t_{\text{vuelo}}`, 'Válidas si el salto parte y regresa a la misma altura (y₀ = 0 en el suelo), con g constante y sin resistencia del aire.')}
        <p><strong>Diseño inverso.</strong> Los diseñadores piden altura ${ie('H')} y tiempo hasta el pico ${ie('t_p')}; el programa deduce el resto despejando de las ecuaciones anteriores:</p>
        ${eq(tex`g=\frac{2H}{t_p^{2}}\qquad v_{0y}=\frac{2H}{t_p}`)}
        <p><strong>Gravedad asimétrica.</strong> Una técnica común de diseño es usar ${ie('g')} al subir y ${ie('k\\,g')} al bajar. Con ${ie('k>1')} el tiempo de caída es ${ie(String.raw`t_{\text{caída}}=\sqrt{2h_{\max}/(k g)}`)}; con ${ie('k=1')} se recupera la parábola simétrica.</p>
        ${varTable([
          ['y,\\ y_0', 'altura del personaje y altura inicial (suelo = 0)', 'm'],
          ['v_{0y},\\ v_y', 'velocidad vertical inicial (impulso) y en el instante t', 'm/s'],
          ['g', 'aceleración de la gravedad del juego (hacia abajo)', 'm/s²'],
          ['k', 'multiplicador de gravedad en la caída (adimensional)', '—'],
          ['h_{\\max},\\ t_{\\text{vuelo}}', 'altura máxima y tiempo total en el aire', 'm, s'],
          ['v_x,\\ R', 'velocidad horizontal constante y alcance', 'm/s, m'],
          ['H,\\ t_p', 'altura deseada y tiempo hasta el pico (datos de diseño)', 'm, s'],
        ])}
      </div>

      <div class="tblock">
        <h3>Cómo se usa la física para resolver el problema</h3>
        <p>Por qué casi ningún juego usa 9,81 m/s²: porque las unidades del juego no tienen que ser metros terrestres y porque la sensación importa más que la fidelidad. Un ejemplo calculado: para que el personaje alcance ${ie('H=3\\,\\mathrm{m}')} en ${ie('t_p=0{,}4\\,\\mathrm{s}')} se necesita ${ie('g=2H/t_p^2=37{,}5\\,\\mathrm{m/s^2}')} y ${ie('v_{0y}=15\\,\\mathrm{m/s}')}, es decir, unas 3,8 veces la gravedad terrestre ${cite('nist-g')}. Con 9,81 m/s² el mismo pico en 0,4 s es imposible: llegar a 3 m con esa gravedad tardaría ${ie(String.raw`\sqrt{2\cdot 3/9{,}81}\approx 0{,}78\,\mathrm{s}`)} solo en subir.</p>
        <p>Ajustar el salto se reduce a elegir dos números. Aumentar ${ie('v_{0y}')} sube la altura con su cuadrado; aumentar ${ie('g')} acorta el vuelo y la altura. Un multiplicador ${ie('k')} de caída da la sensación «ágil» de subir despacio y aterrizar rápido.</p>
        ${tradeoff(
          `<ul><li>Altura y tiempo en el aire quedan bajo control con dos parámetros y se ajustan en vivo.</li><li>Funciona igual para cualquier plataforma, sin una animación por cada altura.</li><li>Permite mecánicas derivadas: salto variable, doble salto, gravedad lunar en un nivel.</li></ul>`,
          `<ul><li>La gravedad «de juego» no es físicamente realista y hay que cuidar que el resto del mundo (rampas, proyectiles, fricción) sea coherente con ella.</li><li>La integración numérica por pasos introduce error según la tasa de cuadros, que los motores deben controlar.</li><li>El modelo parabólico puro no siempre se siente bien: de ahí la gravedad asimétrica.</li></ul>`
        )}
        <p><strong>Frente a la alternativa no física:</strong> una animación guionizada por salto (altura fija, duración fija) obliga a crear un clip por cada altura posible, no se adapta al cambiar la gravedad del nivel y rompe la colisión con plataformas intermedias. La ecuación resuelve todos los casos con las mismas dos líneas.</p>
      </div>

      <div class="tblock">
        <h3>Recurso: simulación interactiva</h3>
        <div class="lab">
          <div class="lab-head"><h4>Laboratorio de salto</h4><span class="badge">Posición analítica y(t) · personaje de referencia de 1 m de alto</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                ${slider({ id: 't2-v0', label: 'Impulso del salto v₀y', min: 1, max: 25, step: 0.1, value: 6, unit: 'm/s', dec: 1 })}
                ${slider({ id: 't2-g', label: 'Gravedad g', min: 0.5, max: 60, step: 0.01, value: 9.81, unit: 'm/s²', dec: 2 })}
                <div class="presets" role="group" aria-label="Valores de gravedad predefinidos">${PRESETS.map((p) => `<button type="button" class="btn" data-preset="${p.id}">${p.name}: ${fmt(p.g, 2)}</button>`).join('')}</div>
                ${slider({ id: 't2-k', label: 'Multiplicador de gravedad al caer k', min: 1, max: 4, step: 0.1, value: 1, unit: '×', dec: 1, hint: 'k = 1 es la parábola simétrica.' })}
                ${slider({ id: 't2-vx', label: 'Velocidad horizontal v_x', min: 0, max: 12, step: 0.5, value: 3, unit: 'm/s', dec: 1 })}
                ${slider({ id: 't2-rate', label: 'Velocidad de reproducción', min: 0.1, max: 2, step: 0.1, value: 1, unit: '×', dec: 1 })}
                <div class="btns">
                  <button class="btn primary" id="t2-play" type="button">Saltar</button>
                  <button class="btn" id="t2-pause" type="button">Pausar</button>
                  <button class="btn" id="t2-reset" type="button">Reiniciar</button>
                </div>
                <label><input type="checkbox" id="t2-loop"> Repetir el salto automáticamente</label>
                <p class="status" id="t2-status" role="status"></p>
              </div>
              <div class="chart-stack">
                <div class="viz"><canvas id="t2-scene" aria-label="Escena lateral del salto con trayectoria, altura máxima y alcance"></canvas></div>
                <div class="readouts">
                  ${readout({ id: 't2-hmax', label: 'Altura máxima h_max', unit: 'm', color: 'result', big: true })}
                  ${readout({ id: 't2-tup', label: 'Tiempo de subida', unit: 's', color: 'result' })}
                  ${readout({ id: 't2-tfl', label: 'Tiempo total de vuelo', unit: 's', color: 'result' })}
                  ${readout({ id: 't2-rng', label: 'Alcance R', unit: 'm', color: 'result' })}
                  ${readout({ id: 't2-gr', label: 'g relativa a la Tierra', unit: '× g⊕', color: 'force' })}
                  ${readout({ id: 't2-y', label: 'Altura actual y', unit: 'm', color: 'pos' })}
                  ${readout({ id: 't2-vy', label: 'Velocidad vertical v_y', unit: 'm/s', color: 'vel' })}
                  ${readout({ id: 't2-t', label: 'Tiempo transcurrido', unit: 's', color: 'result' })}
                </div>
              </div>
            </div>
            <div class="grid-2">
              <div class="chart-wrap"><canvas id="t2-cy"></canvas></div>
              <div class="chart-wrap"><canvas id="t2-cv"></canvas></div>
            </div>
            <div>
              <h4>Comparación entre valores de gravedad (mismo impulso v₀y, k = 1)</h4>
              <div class="chart-wrap tall"><canvas id="t2-ccmp"></canvas></div>
              <div class="table-wrap"><table class="data" id="t2-table"></table></div>
            </div>
            <div class="lab" style="margin:0">
              <div class="lab-head"><h4>Diseño inverso: de la sensación deseada a (g, v₀y)</h4><span class="badge">g = 2H/t_p² · v₀y = 2H/t_p</span></div>
              <div class="lab-body">
                <div class="lab-split">
                  <div class="controls">
                    ${numberField({ id: 't2-H', label: 'Altura deseada H', min: 0.2, max: 30, step: 0.1, value: 3, unit: 'm' })}
                    ${numberField({ id: 't2-tp', label: 'Tiempo hasta el pico t_p', min: 0.05, max: 3, step: 0.05, value: 0.4, unit: 's' })}
                    <button class="btn" id="t2-apply" type="button">Aplicar a la simulación</button>
                  </div>
                  <div class="readouts">
                    ${readout({ id: 't2-dg', label: 'Gravedad necesaria g', unit: 'm/s²', color: 'result' })}
                    ${readout({ id: 't2-dv', label: 'Impulso necesario v₀y', unit: 'm/s', color: 'result' })}
                    ${readout({ id: 't2-dr', label: 'Equivale a', unit: '× g⊕', color: 'force' })}
                  </div>
                </div>
                <p class="status" id="t2-dstatus" role="status"></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="tblock">
        <h3>Interpretación de los resultados</h3>
        <ul>
          <li><strong>Escalas:</strong> ${ie('h_{\\max}\\propto v_{0y}^2/g')}: duplicar el impulso cuadruplica la altura, mientras que duplicar la gravedad la reduce a la mitad. El tiempo de vuelo ${ie('\\propto v_{0y}/g')} crece solo linealmente con el impulso.</li>
          <li><strong>Comparación de gravedades:</strong> con el mismo impulso, el salto en la Luna es unas 6 veces más alto y largo que en la Tierra (cociente de gravedades), lo que se ve en la tabla y en las curvas de comparación. Los valores lunar y marciano provienen de las fichas planetarias de la NASA ${cite('nasa-factsheet')}.</li>
          <li><strong>Efecto en la jugabilidad:</strong> gravedad alta con impulso alto da saltos rápidos y precisos (el jugador controla el aterrizaje); gravedad baja da saltos «flotantes» donde el jugador se compromete durante más tiempo. El multiplicador k permite subir con calma y caer con decisión.</li>
          <li><strong>Velocidad de impacto:</strong> en la parábola simétrica coincide con el impulso (con signo contrario). Con k &gt; 1 el personaje aterriza más rápido que como despegó.</li>
        </ul>
      </div>

      <div class="tblock">
        <h3>Limitaciones, supuestos y clasificación de afirmaciones</h3>
        <ul class="claims">
          <li>${tag('hecho')}<span>La charla de Pittman trata la construcción de saltos a partir de altura y distancia deseadas ${cite('pittman-gdc')}; una reseña reporta gravedad aumentada tras el pico en un ejemplo de Mario ${cite('patterson-gdc')}.</span></li>
          <li>${tag('calculo')}<span>Alturas, tiempos, g de diseño y comparaciones del laboratorio.</span></li>
          <li>${tag('supuesto')}<span>g constante, sin resistencia del aire, personaje como partícula, suelo plano, el salto parte de y₀ = 0 y termina al regresar a esa altura. La posición se evalúa de forma analítica, sin error de integración.</span></li>
          <li>${tag('hipotesis')}<span>No todos los juegos usan este modelo: muchos combinan variantes (salto variable, «tiempo coyote», límites de velocidad de caída). Este portafolio no afirma lo contrario.</span></li>
        </ul>
      </div>

      ${Portfolio.connections([
        { to: 'tema-1', text: 'Es el mismo formalismo r(t), v(t), a(t) con aceleración constante: de ahí sale la parábola. El dron del Tema 1 tiene una aceleración que varía en la ruta.' },
        { to: 'tema-3', text: 'En el hábitat giratorio la «g» la fabrica la rotación: ' + ie('g_{\\text{aparente}}=\\omega^2 r') + '. Elegir ω y r es elegir g, igual que el diseñador elige g aquí.' },
        { to: 'tema-4', text: 'Si cambia la gravedad del juego, cambia también la fuerza normal N = m g y, con ella, la fricción máxima ' + ie('\\mu N') + ': la «física» del mundo debe ser coherente.' },
      ])}
      ${Portfolio.sources(['pittman-gdc', 'patterson-gdc', 'openstax', 'nist-g', 'nasa-factsheet'])}
      `;
    },

    init(el) {
      const $ = (id) => el.querySelector('#t2-' + id);
      const st = { model: null, t: 0, playing: false, wait: 0 };
      const cs = $('scene'), ctx = cs.getContext('2d');
      const colors = () => ({ pos: UI.cssVar('--c-pos', '#5ec8e5'), vel: UI.cssVar('--c-vel', '#f2b544'), res: UI.cssVar('--c-result', '#7ddbb0') });
      const chY = new LineChart($('cy'), { title: 'Altura en función del tiempo', xLabel: 'Tiempo t', xUnit: 's', yLabel: 'Altura y', yUnit: 'm', includeZeroY: true });
      const chV = new LineChart($('cv'), { title: 'Velocidad vertical en función del tiempo', xLabel: 'Tiempo t', xUnit: 's', yLabel: 'Velocidad v_y', yUnit: 'm/s', includeZeroY: true });
      const chC = new LineChart($('ccmp'), { title: 'Altura y(t) con distintas gravedades (mismo v₀y)', xLabel: 'Tiempo t', xUnit: 's', yLabel: 'Altura y', yUnit: 'm', includeZeroY: true });

      const params = () => ({ v0: parseFloat($('v0').value), g: parseFloat($('g').value), k: parseFloat($('k').value), vx: parseFloat($('vx').value) });

      function curve(model, n = 240) {
        const ts = P.linspace(0, model.tFlight, n);
        return { t: ts, y: ts.map(model.y), vy: ts.map(model.vy) };
      }

      function recompute() {
        const p = params();
        try { st.model = P.jumpModel({ v0: p.v0, g: p.g, fallMultiplier: p.k, vx: p.vx }); }
        catch (e) { $('status').textContent = e.message; return; }
        const m = st.model, c = colors();
        const cv = curve(m);
        chY.update({ xMin: 0, xMax: m.tFlight, series: [{ name: 'y(t)', color: c.pos, x: cv.t, y: cv.y }] });
        chV.update({ xMin: 0, xMax: m.tFlight, series: [{ name: 'v_y(t)', color: c.vel, x: cv.t, y: cv.vy }] });
        // comparación (k = 1)
        const list = PRESETS.map((pr, i) => ({ pr, color: ['#5ec8e5', '#f0717f', '#b7a1ff', '#7ddbb0'][i] }));
        const series = list.map(({ pr, color }) => {
          const mm = P.jumpModel({ v0: p.v0, g: pr.g }); const q = curve(mm, 200);
          return { name: `${pr.name.split(' (')[0]} (${fmt(pr.g, 2)})`, color, x: q.t, y: q.y };
        });
        series.push({ name: `Actual (${fmt(p.g, 2)})`, color: '#ffffff', dashed: true, width: 2, ...(() => { const mm = P.jumpModel({ v0: p.v0, g: p.g }); const q = curve(mm, 200); return { x: q.t, y: q.y }; })() });
        const xmax = Math.max(...series.map((s) => s.x[s.x.length - 1]));
        chC.update({ xMin: 0, xMax: xmax, series });
        // tabla
        const rows = PRESETS.map((pr) => ({ name: pr.name.split(' (')[0], g: pr.g })).concat([{ name: 'Valor actual', g: p.g }]).map((r) => {
          const mm = P.jumpModel({ v0: p.v0, g: r.g });
          return `<tr><td>${r.name}</td><td>${fmt(r.g, 2)}</td><td>${fmt(r.g / P.G0, 2)}</td><td>${fmt(mm.hMax, 2)}</td><td>${fmt(mm.tUp, 2)}</td><td>${fmt(mm.tFlight, 2)}</td></tr>`;
        });
        $('table').innerHTML = '<thead><tr><th>Caso</th><th>g (m/s²)</th><th>g / g⊕</th><th>h_max (m)</th><th>t subida (s)</th><th>t vuelo (s)</th></tr></thead><tbody>' + rows.join('') + '</tbody>';
        $('hmax').textContent = fmt(m.hMax, 2); $('tup').textContent = fmt(m.tUp, 2); $('tfl').textContent = fmt(m.tFlight, 2);
        $('rng').textContent = fmt(m.range, 2); $('gr').textContent = fmt(p.g / P.G0, 2);
        $('status').textContent = p.k > 1 ? `Gravedad asimétrica: sube con g y cae con ${fmt(p.g * p.k, 2)} m/s². Velocidad de impacto ${fmt(m.vImpact, 1)} m/s.` : '';
        st.t = 0; st.wait = 0; render();
      }

      function drawScene() {
        const m = st.model; if (!m) return;
        const dpr = window.devicePixelRatio || 1, W = cs.clientWidth || 600, H = Math.round(Math.min(380, Math.max(240, W * 0.55)));
        cs.style.height = H + 'px'; if (cs.width !== Math.round(W * dpr) || cs.height !== Math.round(H * dpr)) { cs.width = W * dpr; cs.height = H * dpr; }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        const c = colors(), padL = 40, padB = 34, padT = 24, padR = 18;
        const worldW = Math.max(8, m.range + 3), worldH = Math.max(3, m.hMax * 1.3 + 1.2);
        const s = Math.min((W - padL - padR) / worldW, (H - padT - padB) / worldH);
        const gx = padL, gy = H - padB;
        const X = (x) => gx + (x + 1) * s, Y = (y) => gy - y * s;
        // rejilla de metros
        const tk = ChartUtils.niceTicks(0, Math.max(worldW, worldH), 8);
        ctx.strokeStyle = UI.cssVar('--grid', 'rgba(255,255,255,.08)'); ctx.lineWidth = 1; ctx.fillStyle = UI.cssVar('--text-dim', '#9ab'); ctx.font = '11px "IBM Plex Mono", monospace';
        for (let v = 0; v <= worldH; v += tk.step) { ctx.beginPath(); ctx.moveTo(gx, Y(v)); ctx.lineTo(W - padR, Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(fmt(v, tk.step < 1 ? 1 : 0), gx - 6, Y(v) + 4); }
        for (let v = 0; v <= worldW - 1; v += tk.step) { ctx.beginPath(); ctx.moveTo(X(v), gy); ctx.lineTo(X(v), padT); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(fmt(v, tk.step < 1 ? 1 : 0), X(v), gy + 16); }
        ctx.textAlign = 'left'; ctx.fillText('y (m)', 4, 14); ctx.textAlign = 'right'; ctx.fillText('x (m)', W - 6, H - 6);
        // suelo
        ctx.fillStyle = 'rgba(165,190,235,0.16)'; ctx.fillRect(gx, gy, W - gx - padR, 6);
        ctx.strokeStyle = 'rgba(190,210,245,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
        // trayectoria prevista
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(165,190,235,.55)'; ctx.lineWidth = 1.6; ctx.beginPath();
        const N = 160; for (let i = 0; i <= N; i++) { const t = (m.tFlight * i) / N; const px = X(m.x(t)), py = Y(m.y(t)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.setLineDash([]);
        // pico y aterrizaje
        const tx = X(m.x(m.tUp)), ty = Y(m.hMax);
        ctx.strokeStyle = c.res; ctx.fillStyle = c.res; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, gy); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(tx, ty, 4, 0, 6.2832); ctx.fill(); ctx.textAlign = 'left'; ctx.font = '12px "IBM Plex Sans", sans-serif'; ctx.fillText('h_max = ' + fmt(m.hMax, 2) + ' m', tx + 8, ty - 6);
        ctx.beginPath(); ctx.arc(X(m.range), gy, 4, 0, 6.2832); ctx.fill();
        // recorrido hasta ahora
        ctx.strokeStyle = c.pos; ctx.lineWidth = 3; ctx.beginPath();
        const n = Math.max(2, Math.floor((st.t / m.tFlight) * N)); for (let i = 0; i <= n; i++) { const t = Math.min(st.t, (m.tFlight * i) / N); const px = X(m.x(t)), py = Y(m.y(t)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
        // personaje (1 m de alto, 0,6 m de ancho): pies en la posición
        const cx = X(m.x(st.t)), cyy = Y(m.y(st.t)), w = 0.6 * s, h = 1.0 * s;
        ctx.fillStyle = c.vel; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - w / 2, cyy - h, w, h, Math.min(8, w / 3)) : ctx.rect(cx - w / 2, cyy - h, w, h); ctx.fill();
        ctx.fillStyle = '#0a0f1b'; const ey = cyy - h * 0.7; ctx.beginPath(); ctx.arc(cx - w * 0.16, ey, Math.max(1.5, w * 0.07), 0, 6.2832); ctx.arc(cx + w * 0.16, ey, Math.max(1.5, w * 0.07), 0, 6.2832); ctx.fill();
        // vector de velocidad vertical
        const vy = m.vy(st.t);
        if (Math.abs(vy) > 0.05) {
          const len = Math.max(-70, Math.min(70, -vy * 5)); ctx.strokeStyle = c.vel; ctx.fillStyle = c.vel; ctx.lineWidth = 2.5;
          const ax = cx + w / 2 + 12, a0 = cyy - h / 2; ctx.beginPath(); ctx.moveTo(ax, a0); ctx.lineTo(ax, a0 + len); ctx.stroke();
          const dir = Math.sign(len); ctx.beginPath(); ctx.moveTo(ax, a0 + len); ctx.lineTo(ax - 5, a0 + len - dir * 9); ctx.lineTo(ax + 5, a0 + len - dir * 9); ctx.closePath(); ctx.fill();
        }
      }

      function render() {
        const m = st.model; if (!m) return; const t = st.t;
        chY.update({ cursorX: t }); chV.update({ cursorX: t });
        drawScene();
        $('y').textContent = fmt(m.y(t), 2); $('vy').textContent = fmt(m.vy(t), 2); $('t').textContent = fmt(t, 2);
      }

      const loop = UI.animationLoop((dt) => {
        const m = st.model; const rate = parseFloat($('rate').value);
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) { st.t = 0; } render(); return true; }
        st.t += dt * rate;
        if (st.t >= m.tFlight) {
          st.t = m.tFlight; render();
          if ($('loop').checked) { st.wait = 0.5; return true; }
          st.playing = false; $('status').textContent = 'Aterrizó. Cambie un control y vuelva a saltar.'; return false;
        }
        render();
      });

      $('play').addEventListener('click', () => { if (st.t >= st.model.tFlight) st.t = 0; st.playing = true; $('status').textContent = ''; loop.start(); });
      $('pause').addEventListener('click', () => { st.playing = false; loop.stop(); });
      $('reset').addEventListener('click', () => { st.playing = false; loop.stop(); st.t = 0; st.wait = 0; $('status').textContent = ''; render(); });
      el.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
        const pr = PRESETS.find((x) => x.id === b.dataset.preset); UI.setSlider(el, 't2-g', pr.g); recompute(); if (st.playing) loop.start();
      }));
      UI.bindSliders(el, (inp) => { if (inp.id !== 't2-rate') { recompute(); if (st.playing) loop.start(); } });

      // Diseño inverso con validación
      function updateDesign() {
        const H = UI.num(el, 't2-H'), tp = UI.num(el, 't2-tp');
        const okH = H >= 0.2 && H <= 30, okT = tp >= 0.05 && tp <= 3;
        UI.fieldError(el, 't2-H', okH ? '' : 'Ingrese una altura entre 0,2 y 30 m.');
        UI.fieldError(el, 't2-tp', okT ? '' : 'Ingrese un tiempo entre 0,05 y 3 s.');
        $('apply').disabled = !(okH && okT);
        if (!(okH && okT)) { ['dg', 'dv', 'dr'].forEach((i) => ($(i).textContent = '—')); return null; }
        const d = P.jumpFromDesign(H, tp);
        $('dg').textContent = fmt(d.g, 2); $('dv').textContent = fmt(d.v0, 2); $('dr').textContent = fmt(d.g / P.G0, 2);
        return d;
      }
      ['H', 'tp'].forEach((i) => $(i).addEventListener('input', updateDesign));
      $('apply').addEventListener('click', () => {
        const d = updateDesign(); if (!d) return;
        const gs = $('g'), vs = $('v0');
        const outG = d.g > +gs.max || d.g < +gs.min, outV = d.v0 > +vs.max || d.v0 < +vs.min;
        UI.setSlider(el, 't2-g', P.clamp(d.g, +gs.min, +gs.max)); UI.setSlider(el, 't2-v0', P.clamp(d.v0, +vs.min, +vs.max));
        $('dstatus').className = 'status' + (outG || outV ? ' warn' : '');
        $('dstatus').textContent = outG || outV ? 'Los valores exceden el rango de los controles; se aplicaron los límites, así que H y t_p no se cumplen exactamente.' : 'Aplicado: la simulación usa g y v₀y calculados. Pulse «Saltar» para verlo.';
        recompute();
      });
      window.addEventListener('resize', () => render());
      updateDesign(); recompute();
    },
  };

  Portfolio.register(T);
})();
