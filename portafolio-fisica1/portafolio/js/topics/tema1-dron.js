/* ==========================================================================
   Tema 1 — Rastreo y navegación de un dron de reparto
   Recurso prescrito: VISUALIZACIÓN DE DATOS
   Los datos se GENERAN a partir de una ruta declarada (tabla de waypoints):
   no son telemetría de un dron real.
   ========================================================================== */
(function () {
  'use strict';
  const tex = String.raw;
  const { eq, ie, tag, varTable, tradeoff, callout, slider, readout, fmt } = UI;
  const { cite } = Portfolio;
  const P = Physics;

  /* Rutas declaradas (metros, plano local x-este, y-norte, origen en la base). */
  const ROUTES = {
    L: { name: 'Entrega urbana (calles y diagonal)', pts: [[0, 0], [120, 0], [180, 60], [180, 140], [260, 200], [380, 200]] },
    Z: { name: 'Zigzag entre manzanas', pts: [[0, 0], [70, 50], [140, 0], [210, 50], [280, 0], [350, 50]] },
    R: { name: 'Circuito con regreso a la base', pts: [[0, 0], [160, 0], [160, 120], [0, 120], [0, 15]] },
  };
  const DT = 0.1; // s — intervalo de muestreo de la telemetría simulada (10 Hz)

  const T = {
    id: 'tema-1', number: 1, accent: 'pos',
    title: 'Rastreo y navegación de un dron de reparto',
    resource: 'Visualización de datos',
    concepts: ['Cinemática en 2D', 'Vectores r, v, a', 'Componentes x–y'],
    summary: 'Cómo un autopilotaje obtiene velocidad y aceleración a partir de posiciones, y qué dicen los perfiles de una ruta.',

    html() {
      return String.raw`
      ${Portfolio.head(T)}

      <div class="tblock">
        <h3>Introducción al problema</h3>
        <p>Un dron de reparto recibe una ruta: una lista de puntos por los que debe pasar. Pero llegar a esos puntos no basta. Debe hacerlo sin sacudidas, sin pedirle a los motores una aceleración que no pueden dar y sabiendo, en cada instante, hacia dónde se mueve y qué tan rápido. El problema es que el sistema de navegación trabaja con <em>posiciones</em> (dónde está el dron), mientras que lo que necesita para controlarlo son <em>velocidades</em> y <em>aceleraciones</em>. La cinemática es el puente entre ambas.</p>
      </div>

      <div class="tblock">
        <h3>Caso de uso en ingeniería del software</h3>
        <p><strong>Sistema:</strong> el autopilotaje de código abierto <strong>PX4</strong> para multicópteros, en la industria del reparto y la inspección con vehículos aéreos no tripulados.</p>
        <p>${tag('hecho')} Según su guía de usuario, en modo misión PX4 genera siempre una trayectoria limitada en <em>jerk</em> (la derivada de la aceleración): a partir de un setpoint demandado calcula un setpoint deseado cuya velocidad y aceleración respetan límites configurables, y ese setpoint es el que recibe el controlador ${cite('px4-trajectory')}. En la investigación de cuadricópteros, las trayectorias se planifican como funciones suaves del tiempo —por ejemplo polinomios que minimizan el <em>snap</em>— de modo que posición, velocidad y aceleración salen de derivar esa función ${cite('mellinger')}.</p>
        <p>La idea de software es la misma en ambos casos: <strong>la ruta es una función del tiempo, r(t)</strong>, y todo lo demás se obtiene derivando.</p>
      </div>

      <div class="tblock">
        <h3>Concepto físico y ecuaciones</h3>
        <p>La posición del dron en el plano es un vector que depende del tiempo; su velocidad es su derivada y su aceleración es la derivada de la velocidad ${cite('openstax')}:</p>
        ${eq(tex`\vec r(t)=x(t)\,\hat\imath+y(t)\,\hat\jmath \qquad \vec v(t)=\frac{d\vec r}{dt}=v_x\,\hat\imath+v_y\,\hat\jmath \qquad \vec a(t)=\frac{d\vec v}{dt}=a_x\,\hat\imath+a_y\,\hat\jmath`, 'Definiciones. Cada componente se trata por separado: el movimiento en x y en y son independientes en el cálculo.')}
        ${eq(tex`|\vec v|=\sqrt{v_x^{2}+v_y^{2}} \qquad \theta=\operatorname{atan2}(v_y,v_x) \qquad |\vec a|^{2}=a_t^{2}+a_n^{2},\quad a_t=\frac{d|\vec v|}{dt},\quad a_n=\frac{|\vec v|^{2}}{\rho}`, 'Rapidez, rumbo y descomposición de la aceleración: a_t cambia la rapidez; a_n (con ρ el radio de curvatura) cambia la dirección.')}
        <p>Con las posiciones muestreadas cada ${ie(String.raw`\Delta t`)}, un sistema de navegación no deriva analíticamente: usa <strong>diferencias finitas centrales</strong>. Eso es exactamente lo que hace esta página con los datos generados:</p>
        ${eq(tex`v_{x,i}\approx\frac{x_{i+1}-x_{i-1}}{2\,\Delta t} \qquad a_{x,i}\approx\frac{v_{x,i+1}-v_{x,i-1}}{2\,\Delta t}\qquad(\text{ídem para } y)`)}
        <p>La rapidez a lo largo de la ruta sigue un perfil trapezoidal: acelera con ${ie('a_{\\max}')} hasta ${ie('v_{c}')}, mantiene y frena. Con distancia recorrida ${ie('s(t)')}:</p>
        ${eq(tex`s(t)=\begin{cases}\tfrac12 a_{\max}t^{2} & 0\le t<t_a\\[2pt] \tfrac12 a_{\max}t_a^{2}+v_c\,(t-t_a) & t_a\le t<t_a+t_c\\[2pt] L-\tfrac12 a_{\max}(T-t)^{2} & t\ge t_a+t_c\end{cases}\qquad t_a=\frac{v_c}{a_{\max}}`, 'Si la ruta es demasiado corta para alcanzar v_c, el perfil es triangular con v_pico = √(a_max·L).')}
        ${varTable([
          ['\\vec r,\\ x,\\ y', 'posición del dron en el plano local', 'm'],
          ['\\vec v,\\ v_x,\\ v_y', 'velocidad y sus componentes', 'm/s'],
          ['\\vec a,\\ a_x,\\ a_y', 'aceleración y sus componentes', 'm/s²'],
          ['a_t,\\ a_n', 'aceleración tangencial y normal a la trayectoria', 'm/s²'],
          ['\\rho', 'radio de curvatura de la trayectoria', 'm'],
          ['v_c,\\ a_{\\max}', 'rapidez de crucero y aceleración tangencial máxima (parámetros del perfil)', 'm/s, m/s²'],
          ['L,\\ T', 'longitud de la ruta y duración total', 'm, s'],
          ['\\Delta t', 'intervalo de muestreo de la telemetría (0,1 s)', 's'],
        ])}
      </div>

      <div class="tblock">
        <h3>Cómo se usa la física para resolver el problema</h3>
        <ol>
          <li>La ruta declarada (tabla de waypoints) se convierte en una curva suave que pasa por todos ellos (spline de Catmull-Rom centrípeta ${cite('yuksel')}).</li>
          <li>Un perfil de rapidez decide <em>cuándo</em> se está en cada punto de la curva: así queda definida r(t).</li>
          <li>Se muestrea r(t) a 10 Hz y se derivan v y a por diferencias finitas, como lo haría un módulo de navegación con posiciones sucesivas.</li>
          <li>Con v y a se comprueba la <em>factibilidad</em>: un multicóptero inclinado un ángulo ${ie('\\theta_{tilt}')} produce una aceleración horizontal aproximada ${ie('a\\approx g\\tan\\theta_{tilt}')}; por tanto, una aceleración total grande exige una inclinación grande (ver indicador en el laboratorio).</li>
        </ol>
        ${tradeoff(
          `<ul><li>Cualquier ruta, rapidez o límite de aceleración produce un movimiento coherente sin animar cada caso.</li><li>Velocidad y aceleración salen «gratis» y se pueden verificar contra los límites del vehículo antes de volar.</li><li>Se detectan curvas donde la aceleración normal ${ie('v^2/\\rho')} se dispara.</li></ul>`,
          `<ul><li>Hay que declarar un modelo (masa puntual, sin viento) y validarlo contra vuelos reales.</li><li>Derivar amplifica el ruido: con posiciones ruidosas, la aceleración calculada se vuelve poco fiable.</li><li>Es más costoso que reproducir una animación o una lista de puntos fijos.</li></ul>`
        )}
        <p><strong>Frente a la alternativa no física:</strong> una ruta «guionizada» (saltar de waypoint en waypoint a velocidad fija, o animar una trayectoria precalculada) no dice nada sobre la aceleración: el dron «teletransportaría» su velocidad en cada esquina. Modelar r(t) permite exigir continuidad y respetar los límites de los motores.</p>
      </div>

      <div class="tblock">
        <h3>Recurso: visualización de datos</h3>
        <div class="callout supuesto"><strong>Procedencia de los datos</strong>
          <p>Los datos de esta visualización son <strong>generados por este portafolio</strong> a partir de la ruta declarada en la tabla de waypoints y de los parámetros que usted elija. <strong>No son telemetría de un dron real.</strong> Puede descargar la serie completa (CSV) con su encabezado de procedencia.</p></div>
        <div class="lab">
          <div class="lab-head"><h4>Telemetría simulada de una entrega</h4><span class="badge">Muestreo 10 Hz · modelo de masa puntual en 2D</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                <div class="ctrl"><label for="t1-route">Ruta declarada</label>
                  <select id="t1-route">${Object.entries(ROUTES).map(([k, r]) => `<option value="${k}">${r.name}</option>`).join('')}</select></div>
                ${slider({ id: 't1-scale', label: 'Escala de la ruta', min: 0.5, max: 2, step: 0.1, value: 1, unit: '×', dec: 1, hint: 'Multiplica todas las coordenadas de los waypoints.' })}
                ${slider({ id: 't1-vc', label: 'Rapidez de crucero v_c', min: 3, max: 25, step: 0.5, value: 10, unit: 'm/s', dec: 1 })}
                ${slider({ id: 't1-am', label: 'Aceleración tangencial máx. a_max', min: 0.5, max: 6, step: 0.1, value: 2.5, unit: 'm/s²', dec: 1 })}
                ${slider({ id: 't1-rate', label: 'Velocidad de reproducción', min: 0.5, max: 8, step: 0.5, value: 2, unit: '×', dec: 1 })}
                <div class="btns">
                  <button class="btn primary" id="t1-play" type="button">Reproducir</button>
                  <button class="btn" id="t1-pause" type="button">Pausar</button>
                  <button class="btn" id="t1-reset" type="button">Reiniciar</button>
                </div>
                <div class="btns"><button class="btn" id="t1-csv" type="button">Descargar CSV de los datos</button></div>
                <p class="status" id="t1-status" role="status"></p>
                <details><summary>Waypoints de la ruta (m)</summary><div class="table-wrap"><table class="data" id="t1-wp"></table></div></details>
              </div>
              <div class="chart-stack">
                <div class="viz"><canvas id="t1-map" aria-label="Plano de la ruta con el dron y sus vectores de velocidad y aceleración"></canvas></div>
                <div class="scrub"><span>t = <b id="t1-tnow">0,0</b> s</span><input type="range" id="t1-scrub" min="0" max="100" step="0.05" value="0" aria-label="Tiempo de la simulación"><span>T = <b id="t1-ttot">0</b> s</span></div>
              </div>
            </div>
            <div class="readouts">
              ${readout({ id: 't1-x', label: 'Posición x', unit: 'm', color: 'pos' })}
              ${readout({ id: 't1-y', label: 'Posición y', unit: 'm', color: 'pos' })}
              ${readout({ id: 't1-vx', label: 'Velocidad v_x', unit: 'm/s', color: 'vel' })}
              ${readout({ id: 't1-vy', label: 'Velocidad v_y', unit: 'm/s', color: 'vel' })}
              ${readout({ id: 't1-sp', label: 'Rapidez |v|', unit: 'm/s', color: 'vel' })}
              ${readout({ id: 't1-th', label: 'Rumbo θ (desde +x)', unit: '°', color: 'vel' })}
              ${readout({ id: 't1-ax', label: 'Aceleración a_x', unit: 'm/s²', color: 'acc' })}
              ${readout({ id: 't1-ay', label: 'Aceleración a_y', unit: 'm/s²', color: 'acc' })}
              ${readout({ id: 't1-at', label: 'a tangencial a_t', unit: 'm/s²', color: 'acc' })}
              ${readout({ id: 't1-an', label: 'a normal a_n', unit: 'm/s²', color: 'acc' })}
              ${readout({ id: 't1-tilt', label: 'Inclinación equivalente', unit: '°', color: 'force' })}
            </div>
            <div class="chart-stack">
              <div class="chart-wrap"><canvas id="t1-cpos"></canvas></div>
              <div class="chart-wrap"><canvas id="t1-cvel"></canvas></div>
              <div class="chart-wrap"><canvas id="t1-cacc"></canvas></div>
            </div>
            <div class="readouts" aria-label="Resumen de la ruta">
              ${readout({ id: 't1-L', label: 'Longitud L de la ruta', unit: 'm', color: 'result' })}
              ${readout({ id: 't1-T', label: 'Duración T', unit: 's', color: 'result' })}
              ${readout({ id: 't1-vmax', label: 'Rapidez máxima alcanzada', unit: 'm/s', color: 'result' })}
              ${readout({ id: 't1-amax', label: 'Aceleración total máxima', unit: 'm/s²', color: 'result' })}
            </div>
          </div>
        </div>
        <details class="tblock" style="margin-top:14px"><summary><strong>¿Cómo se obtuvieron los datos y qué ecuación genera cada curva?</strong></summary>
          <ul>
            <li><strong>x(t), y(t)</strong>: se evalúa el spline en la distancia s(t) del perfil trapezoidal.</li>
            <li><strong>v_x(t), v_y(t), |v|</strong>: diferencias centrales de la posición (Δt = 0,1 s); el dron parte y termina en reposo, por lo que v(0)=v(T)=0 se impone como condición de contorno.</li>
            <li><strong>a_x(t), a_y(t), |a|</strong>: diferencias centrales de la velocidad. La curva |a| supera a a_max en las curvas porque suma la parte normal ${ie('v^2/\\rho')} a la tangencial.</li>
          </ul></details>
      </div>

      <div class="tblock">
        <h3>Interpretación de los resultados</h3>
        <ul>
          <li><strong>Arranque y frenado:</strong> la aceleración es tangencial, constante y de signo opuesto; la velocidad crece y decrece linealmente. Es el tramo donde ${ie('a_t')} domina.</li>
          <li><strong>Crucero:</strong> |v| es casi constante, pero ${ie('\\vec v')} no: en cada curva cambia de dirección y aparece ${ie('a_n=v^2/\\rho')}. Un dron puede ir «a velocidad constante» y aun así acelerar.</li>
          <li><strong>Picos de |a| en las esquinas:</strong> cuanto más cerrada la curva (ρ pequeño) o mayor la rapidez, más aceleración lateral se exige y más se inclina el multicóptero. Pruebe la ruta en zigzag con v_c alta y observe cómo sube la «inclinación equivalente».</li>
          <li><strong>Componentes:</strong> v_x y v_y pueden cambiar de signo en curvas mientras |v| apenas varía: son proyecciones sobre los ejes, no la «rapidez».</li>
        </ul>
        <p>${tag('calculo')} Todos los valores numéricos mostrados son resultados calculados a partir de la ruta y los parámetros elegidos.</p>
      </div>

      <div class="tblock">
        <h3>Limitaciones, supuestos y clasificación de afirmaciones</h3>
        <ul class="claims">
          <li>${tag('hecho')}<span>PX4 usa trayectorias limitadas en jerk en modo misión ${cite('px4-trajectory')}; los planificadores de cuadricópteros pueden derivar estados completos de r(t) ${cite('mellinger')}.</span></li>
          <li>${tag('calculo')}<span>Perfiles, picos y tiempos del laboratorio.</span></li>
          <li>${tag('supuesto')}<span>Masa puntual en un plano (se ignora la altura), sin viento ni arrastre; ruta suave tipo spline elegida por conveniencia, no un planificador óptimo; rapidez que no se reduce en las curvas.</span></li>
          <li>${tag('supuesto')}<span>Inclinación equivalente = arctan(|a|/g): vale para un multicóptero que mantiene la altura y sin arrastre.</span></li>
          <li>${tag('hipotesis')}<span>Un sistema real combina la posición medida con otros sensores en un estimador de estado y sufre ruido y retardo; aquí la «medición» es exacta, de modo que la aceleración calculada es más limpia que en la práctica.</span></li>
        </ul>
      </div>

      ${Portfolio.connections([
        { to: 'tema-2', text: 'Aquí la aceleración cambia a lo largo de la ruta; en el salto es constante (−g) y de ahí sale la parábola. Es el mismo formalismo con un caso particular.' },
        { to: 'tema-3', text: 'La aceleración normal ' + ie('v^2/\\rho') + ' de una curva del dron es la aceleración centrípeta ' + ie('v^2/r') + ' del hábitat: una curva es, instante a instante, un arco de círculo.' },
        { to: 'tema-4', text: 'En una llanta, la aceleración lateral máxima en curva la limita la fricción (' + ie('a_n\\le\\mu g') + '); en el dron la limita la inclinación que admiten los motores.' },
      ])}
      ${Portfolio.sources(['px4-trajectory', 'mellinger', 'yuksel', 'openstax'])}
      `;
    },

    init(el) {
      const $ = (id) => el.querySelector('#t1-' + id);
      const state = { data: null, t: 0, playing: false, route: 'L' };
      const map = $('map'), mctx = map.getContext('2d');
      const charts = {
        pos: new LineChart($('cpos'), { title: 'Posición en función del tiempo', xLabel: 'Tiempo t', xUnit: 's', yLabel: 'Posición', yUnit: 'm', includeZeroY: true, ariaLabel: 'Gráfica de las componentes x e y de la posición contra el tiempo' }),
        vel: new LineChart($('cvel'), { title: 'Velocidad en función del tiempo', xLabel: 'Tiempo t', xUnit: 's', yLabel: 'Velocidad', yUnit: 'm/s', includeZeroY: true, ariaLabel: 'Gráfica de las componentes de la velocidad y la rapidez contra el tiempo' }),
        acc: new LineChart($('cacc'), { title: 'Aceleración en función del tiempo', xLabel: 'Tiempo t', xUnit: 's', yLabel: 'Aceleración', yUnit: 'm/s²', includeZeroY: true, ariaLabel: 'Gráfica de las componentes de la aceleración y su magnitud contra el tiempo' }),
      };
      const css = UI.cssVar;
      const colors = () => ({ pos: css('--c-pos', '#5ec8e5'), vel: css('--c-vel', '#f2b544'), acc: css('--c-acc', '#f0717f') });

      function waypoints() {
        const k = parseFloat($('scale').value);
        return ROUTES[state.route].pts.map(([x, y]) => ({ x: x * k, y: y * k }));
      }

      function rebuild() {
        const vc = parseFloat($('vc').value), am = parseFloat($('am').value);
        if (!(vc > 0) || !(am > 0)) { $('status').textContent = 'Parámetros inválidos: v_c y a_max deben ser positivos.'; return; }
        state.wp = waypoints();
        state.data = P.generateDroneData(state.wp, vc, am, DT);
        const d = state.data, c = colors();
        $('scrub').max = d.duration.toFixed(2); $('ttot').textContent = fmt(d.duration, 1);
        $('wp').innerHTML = '<thead><tr><th>Punto</th><th>x (m)</th><th>y (m)</th></tr></thead><tbody>' +
          state.wp.map((p, i) => `<tr><td>P${i}</td><td>${fmt(p.x, 1)}</td><td>${fmt(p.y, 1)}</td></tr>`).join('') + '</tbody>';
        charts.pos.update({ xMin: 0, xMax: d.duration, series: [
          { name: 'x(t)', color: c.pos, x: d.t, y: d.x }, { name: 'y(t)', color: c.pos, dashed: true, x: d.t, y: d.y }] });
        charts.vel.update({ xMin: 0, xMax: d.duration, series: [
          { name: 'v_x', color: c.vel, x: d.t, y: d.vx }, { name: 'v_y', color: c.vel, dashed: true, x: d.t, y: d.vy },
          { name: '|v|', color: '#ffffff', width: 1.4, x: d.t, y: d.speed }] });
        charts.acc.update({ xMin: 0, xMax: d.duration, series: [
          { name: 'a_x', color: c.acc, x: d.t, y: d.ax }, { name: 'a_y', color: c.acc, dashed: true, x: d.t, y: d.ay },
          { name: '|a|', color: '#ffffff', width: 1.4, x: d.t, y: d.accMag }] });
        $('L').textContent = fmt(d.length, 1); $('T').textContent = fmt(d.duration, 1);
        $('vmax').textContent = fmt(Math.max(...d.speed), 2); $('amax').textContent = fmt(Math.max(...d.accMag), 2);
        $('status').textContent = d.vPeak < vc - 1e-6
          ? `Ruta corta: el perfil es triangular, la rapidez pico es ${fmt(d.vPeak, 2)} m/s (< v_c).`
          : 'Datos recalculados a partir de la ruta declarada.';
        state.t = Math.min(state.t, d.duration);
        sizeMap(); render();
      }

      /* Interpolación lineal de una serie muestreada en el instante t. */
      function at(arr, t) {
        const f = t / DT, i = Math.min(arr.length - 2, Math.max(0, Math.floor(f))), u = Math.min(1, f - i);
        return arr[i] + u * (arr[i + 1] - arr[i]);
      }

      function sizeMap() {
        const dpr = window.devicePixelRatio || 1, w = map.clientWidth || 600;
        const h = Math.round(Math.min(430, Math.max(260, w * 0.62)));
        map.style.height = h + 'px'; map.width = w * dpr; map.height = h * dpr;
        mctx.setTransform(dpr, 0, 0, dpr, 0, 0); state.mw = w; state.mh = h;
      }

      function drawMap() {
        const d = state.data; if (!d) return;
        const W = state.mw, H = state.mh, c = colors(), ctx = mctx, pad = 38;
        ctx.clearRect(0, 0, W, H);
        const xs = d.poly.map((p) => p.x), ys = d.poly.map((p) => p.y);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const sc = Math.min((W - 2 * pad) / Math.max(1, x1 - x0), (H - 2 * pad) / Math.max(1, y1 - y0));
        const ox = (W - sc * (x1 - x0)) / 2, oy = (H - sc * (y1 - y0)) / 2;
        const X = (x) => ox + (x - x0) * sc, Y = (y) => H - oy - (y - y0) * sc;
        // rejilla en metros
        const tk = ChartUtils.niceTicks(0, Math.max(x1 - x0, y1 - y0), 6);
        ctx.strokeStyle = css('--grid', 'rgba(255,255,255,.08)'); ctx.lineWidth = 1; ctx.fillStyle = css('--text-dim', '#9ab'); ctx.font = '11px "IBM Plex Mono", monospace';
        for (let g = Math.floor(x0 / tk.step) * tk.step; g <= x1 + tk.step; g += tk.step) { ctx.beginPath(); ctx.moveTo(X(g), 0); ctx.lineTo(X(g), H); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(fmt(g, 0), X(g), H - 6); }
        for (let g = Math.floor(y0 / tk.step) * tk.step; g <= y1 + tk.step; g += tk.step) { ctx.beginPath(); ctx.moveTo(0, Y(g)); ctx.lineTo(W, Y(g)); ctx.stroke(); ctx.textAlign = 'left'; ctx.fillText(fmt(g, 0), 4, Y(g) - 3); }
        ctx.textAlign = 'right'; ctx.fillText('x (m)', W - 6, H - 20); ctx.textAlign = 'left'; ctx.fillText('y (m)', 4, 14);
        // ruta completa y tramo recorrido
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(165,190,235,.35)'; ctx.setLineDash([5, 5]); ctx.beginPath();
        d.poly.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)))); ctx.stroke(); ctx.setLineDash([]);
        const n = Math.floor(state.t / DT);
        ctx.strokeStyle = c.pos; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i <= n; i++) i ? ctx.lineTo(X(d.x[i]), Y(d.y[i])) : ctx.moveTo(X(d.x[0]), Y(d.y[0]));
        ctx.lineTo(X(at(d.x, state.t)), Y(at(d.y, state.t))); ctx.stroke();
        // waypoints
        state.wp.forEach((p, i) => {
          ctx.fillStyle = css('--bg', '#0a0f1b'); ctx.strokeStyle = '#cdd8ee'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 5, 0, 6.2832); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#cdd8ee'; ctx.textAlign = 'left'; ctx.fillText('P' + i, X(p.x) + 8, Y(p.y) - 8);
        });
        // estado actual
        const px = at(d.x, state.t), py = at(d.y, state.t), vx = at(d.vx, state.t), vy = at(d.vy, state.t), ax = at(d.ax, state.t), ay = at(d.ay, state.t);
        const sx = X(px), sy = Y(py);
        const arrow = (x, y, dx, dy, col, w, dash) => {
          const len = Math.hypot(dx, dy); if (len < 1.5) return;
          ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke(); ctx.setLineDash([]);
          if (!dash) { const a = Math.atan2(dy, dx); ctx.beginPath(); ctx.moveTo(x + dx, y + dy); ctx.lineTo(x + dx - 9 * Math.cos(a - 0.4), y + dy - 9 * Math.sin(a - 0.4)); ctx.lineTo(x + dx - 9 * Math.cos(a + 0.4), y + dy - 9 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill(); }
        };
        const kv = 5, ka = 26; // px por m/s y px por m/s² (solo escala visual)
        // componentes (discontinuas) y vector v
        arrow(sx, sy, vx * kv, 0, c.vel, 1.5, [3, 3]); arrow(sx + vx * kv, sy, 0, -vy * kv, c.vel, 1.5, [3, 3]); arrow(sx, sy, vx * kv, -vy * kv, c.vel, 3);
        arrow(sx, sy, ax * ka, 0, c.acc, 1.5, [3, 3]); arrow(sx + ax * ka, sy, 0, -ay * ka, c.acc, 1.5, [3, 3]); arrow(sx, sy, ax * ka, -ay * ka, c.acc, 3);
        // dron (cuerpo + 4 rotores orientados al rumbo)
        const hd = Math.atan2(-vy, vx) || 0; ctx.save(); ctx.translate(sx, sy); ctx.rotate(hd);
        ctx.strokeStyle = '#e8edf7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, 8); ctx.moveTo(-8, 8); ctx.lineTo(8, -8); ctx.stroke();
        ctx.fillStyle = c.pos; [[-8, -8], [8, 8], [-8, 8], [8, -8]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 3.2, 0, 6.2832); ctx.fill(); });
        ctx.fillStyle = '#e8edf7'; ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, 6.2832); ctx.fill(); ctx.restore();
        // leyenda
        ctx.font = '12px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'left';
        ctx.fillStyle = c.vel; ctx.fillText('— v (1 m/s = 5 px)', W - 150, 20); ctx.fillStyle = c.acc; ctx.fillText('— a (1 m/s² = 26 px)', W - 150, 38);
      }

      function updateReadouts() {
        const d = state.data; if (!d) return; const t = state.t;
        const g = (a) => at(a, t);
        const sp = g(d.speed);
        $('x').textContent = fmt(g(d.x), 1); $('y').textContent = fmt(g(d.y), 1);
        $('vx').textContent = fmt(g(d.vx), 2); $('vy').textContent = fmt(g(d.vy), 2); $('sp').textContent = fmt(sp, 2);
        $('th').textContent = sp > 0.05 ? fmt((Math.atan2(g(d.vy), g(d.vx)) * 180) / Math.PI, 0) : '—';
        $('ax').textContent = fmt(g(d.ax), 2); $('ay').textContent = fmt(g(d.ay), 2);
        $('at').textContent = fmt(g(d.aTan), 2); $('an').textContent = fmt(g(d.aNor), 2);
        $('tilt').textContent = fmt((Math.atan(g(d.accMag) / P.G0) * 180) / Math.PI, 1);
        $('tnow').textContent = fmt(t, 1); $('scrub').value = t;
      }

      function render() {
        Object.values(charts).forEach((ch) => ch.update({ cursorX: state.t }));
        drawMap(); updateReadouts();
      }

      const loop = UI.animationLoop((dt) => {
        const rate = parseFloat($('rate').value);
        state.t += dt * rate;
        if (state.t >= state.data.duration) { state.t = state.data.duration; state.playing = false; render(); $('status').textContent = 'Entrega completada. Pulse «Reiniciar» o «Reproducir» para repetir.'; return false; }
        render();
      });

      $('play').addEventListener('click', () => { if (state.t >= state.data.duration) state.t = 0; state.playing = true; $('status').textContent = ''; loop.start(); });
      $('pause').addEventListener('click', () => { state.playing = false; loop.stop(); });
      $('reset').addEventListener('click', () => { state.playing = false; loop.stop(); state.t = 0; $('status').textContent = ''; render(); });
      $('scrub').addEventListener('input', (e) => { loop.stop(); state.playing = false; state.t = parseFloat(e.target.value); render(); });
      $('route').addEventListener('change', (e) => { state.route = e.target.value; state.t = 0; rebuild(); });
      $('csv').addEventListener('click', () => {
        const d = state.data;
        UI.downloadCSV('dron-telemetria-simulada.csv',
          { 't_s': d.t.map((v) => v.toFixed(2)), 'x_m': d.x.map((v) => v.toFixed(3)), 'y_m': d.y.map((v) => v.toFixed(3)), 'vx_m_s': d.vx.map((v) => v.toFixed(3)), 'vy_m_s': d.vy.map((v) => v.toFixed(3)), 'ax_m_s2': d.ax.map((v) => v.toFixed(3)), 'ay_m_s2': d.ay.map((v) => v.toFixed(3)) },
          `DATOS SIMULADOS (no son telemetría real). Ruta: ${ROUTES[state.route].name}. Generados con spline Catmull-Rom + perfil trapezoidal; v y a por diferencias centrales, dt=${DT} s.`);
      });
      UI.bindSliders(el, (inp) => { if (inp.id !== 't1-rate') { state.t = 0; rebuild(); } });
      window.addEventListener('resize', () => { sizeMap(); render(); });
      rebuild();
    },
  };

  Portfolio.register(T);
})();
