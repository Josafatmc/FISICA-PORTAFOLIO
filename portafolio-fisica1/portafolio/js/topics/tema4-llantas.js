/* ==========================================================================
   Tema 4 — Llantas de Fórmula 1: la ventana de temperatura y el agarre
   Recurso prescrito: VISUALIZACIÓN DE DATOS
   IMPORTANTE: no se encontraron datos públicos fiables de una curva específica
   de un neumático de F1. Las curvas son un CONJUNTO ILUSTRATIVO HIPOTÉTICO,
   generado por fórmulas declaradas y marcado como tal en pantalla y en el CSV.
   ========================================================================== */
(function () {
  'use strict';
  const tex = String.raw;
  const { eq, ie, tag, varTable, tradeoff, slider, readout, numberField, fmt } = UI;
  const { cite } = Portfolio;
  const P = Physics;

  const T = {
    id: 'tema-4', number: 4, accent: 'force',
    title: 'Llantas de Fórmula 1: la ventana de temperatura y el agarre',
    resource: 'Visualización de datos',
    concepts: ['Fricción estática y cinética', 'Fuerza normal', 'Límites del modelo simple'],
    summary: 'Por qué el agarre real no es proporcional a la carga ni constante, y qué muestra una curva de agarre contra temperatura.',

    html() {
      return String.raw`
      ${Portfolio.head(T)}

      <div class="tblock">
        <h3>Introducción al problema</h3>
        <p>Los libros de física enseñan que la fricción máxima es ${ie('\\mu N')}, con ${ie('\\mu')} una constante. Un neumático de Fórmula 1 la desmiente: su agarre cambia con la temperatura y con la carga. Un simulador de conducción que usara un ${ie('\\mu')} fijo daría vueltas «demasiado perfectas»: el coche tendría el mismo agarre en la vuelta de salida con la goma fría que con la goma a punto o sobrecalentada. <strong>El problema es cómo representar, con pocas ecuaciones, que el agarre depende del estado del neumático.</strong></p>
      </div>

      <div class="tblock">
        <h3>Caso de uso en ingeniería del software</h3>
        <p><strong>Industria:</strong> automovilismo de competición y su software: simuladores de conducción y herramientas de dinámica vehicular. <strong>Sistema:</strong> el neumático de Fórmula 1 suministrado por Pirelli, tratado como un componente del modelo del coche.</p>
        <p>${tag('hecho')} Pirelli explica que cada compuesto tiene un rango de trabajo en el que rinde al máximo: por debajo no se aprovecha todo su potencial y por encima el rendimiento cae y el desgaste puede volverse crítico; lo que define ese rango es, esencialmente, la temperatura ${cite('pirelli-window')}. Su ingeniero jefe, Simone Berra, precisa que la «ventana» es una definición: se fija un porcentaje de pérdida de agarre respecto del pico y se llama ventana al intervalo donde no se supera ${cite('motorsportweek-berra')}. Pirelli distingue además el sobrecalentamiento superficial por deslizamiento de la degradación térmica, que cambia los enlaces químicos de la banda y causa una pérdida irreversible de agarre ${cite('f1technical-deg')}.</p>
        <p>En el software de dinámica vehicular, esto se traduce en un modelo con la fuerza normal y la temperatura como entradas y la fuerza máxima del neumático como salida (por ejemplo, el enfoque de «fórmula mágica» y similares ${cite('pacejka')}).</p>
      </div>

      <div class="tblock">
        <h3>Concepto físico y ecuaciones</h3>
        <p>El modelo simple de Coulomb para una superficie seca relaciona la fricción con la fuerza normal ${cite('openstax')}:</p>
        ${eq(tex`F_f\le \mu_s N \qquad F_k=\mu_k N \qquad N=m g\ \ (\text{superficie horizontal})`, 'Mientras no hay deslizamiento, la fricción estática iguala la fuerza aplicada hasta un máximo μ_s N; al deslizar, actúa la cinética μ_k N, normalmente menor.')}
        <p>Lo que predice: que la fuerza lateral máxima del neumático sea <em>proporcional</em> a la carga, ${ie('F_{y,\\max}=\\mu N')}, y que ${ie('\\mu')} no dependa de la temperatura. Un neumático real es más complejo: la goma es un material viscoelástico cuyo agarre depende de la temperatura y de la velocidad de deslizamiento, y su coeficiente efectivo disminuye al aumentar la carga vertical (sensibilidad a la carga) ${cite('pacejka', 'milliken')}.</p>
        <p>Para ilustrar estas dos desviaciones, el laboratorio usa funciones sencillas (<strong>hipotéticas</strong>):</p>
        ${eq(tex`\mu(T)=\mu_{\text{pico}}\,e^{-\left(\frac{T-T_{\text{opt}}}{w}\right)^{2}},\quad w=\begin{cases}w_{\text{frío}}&T<T_{\text{opt}}\\ w_{\text{cal}}&T\ge T_{\text{opt}}\end{cases}\qquad T_{\text{ventana}}:\ \mu\ge(1-p)\,\mu_{\text{pico}}`, 'Campana asimétrica (más empinada del lado caliente, donde la degradación es irreversible). La ventana se define como en la cita de Berra: pérdida admitida p respecto del pico.')}
        ${eq(tex`\mu(N)=\mu_0-b\,N \qquad F_{y,\max}(N)=\mu(N)\,N=\mu_0N-bN^{2}`, 'Sensibilidad a la carga: μ decrece con N (b = 0 recupera el modelo simple).')}
        ${varTable([
          ['F_f,\\ F_k', 'fuerza de fricción (estática, cinética)', 'N'],
          ['\\mu_s,\\ \\mu_k', 'coeficientes de fricción estático y cinético', 'adimensional'],
          ['N', 'fuerza normal (carga vertical sobre el neumático)', 'N (en gráficas, kN)'],
          ['T,\\ T_{\\text{opt}}', 'temperatura de operación y temperatura de agarre máximo', '°C'],
          ['\\mu_{\\text{pico}},\\ w_{\\text{frío}},\\ w_{\\text{cal}}', 'agarre máximo y anchos de la campana (hipotéticos)', 'adimensional, °C'],
          ['p', 'pérdida de agarre admitida para definir la ventana', '% del pico'],
          ['\\mu_0,\\ b', 'coeficiente a carga nula y sensibilidad a la carga (hipotéticos)', 'adimensional, 1/kN'],
          ['F_{y,\\max}', 'fuerza lateral máxima del neumático', 'kN'],
        ])}
      </div>

      <div class="tblock">
        <h3>Cómo se usa la física para resolver el problema</h3>
        <p>Un simulador mantiene la temperatura del neumático como variable de estado (se calienta por deformación y deslizamiento ${cite('f1technical-deg')}) y cada paso de tiempo consulta un coeficiente de agarre que depende de ella y de la carga. Con esa fuerza máxima se decide si el neumático adhiere o desliza, y la velocidad máxima en una curva plana de radio ${ie('r')} sigue de igualar la fuerza centrípeta con la fricción: ${ie('\\mu m g=m v^2/r\\Rightarrow v_{\\max}=\\sqrt{\\mu g r}')}.</p>
        ${tradeoff(
          `<ul><li>Reproduce que una goma fría o sobrecalentada rinde menos: aparece la estrategia (calentar, gestionar) sin escribirla a mano.</li><li>La sensibilidad a la carga explica por qué la transferencia de peso en curva reduce el agarre total.</li><li>Permite ajustar el modelo a datos medidos cuando se dispone de ellos.</li></ul>`,
          `<ul><li>Hacen falta datos de ensayo del neumático, que los fabricantes y equipos rara vez publican.</li><li>Más estados (temperatura de banda y de carcasa, desgaste, presión) y más parámetros a calibrar.</li><li>Un ajuste a una curva no se transfiere a otro compuesto ni a otra pista.</li></ul>`
        )}
        <p><strong>Frente a la alternativa no física:</strong> un μ fijo por compuesto, o un tiempo por vuelta precalculado, no puede reproducir la vuelta de salida, la caída de rendimiento al sobrecalentar ni el efecto de cambiar la carga aerodinámica o el combustible.</p>
      </div>

      <div class="tblock">
        <h3>Recurso: visualización de datos</h3>
        <div class="callout hipotesis"><strong>Datos hipotéticos, no medidos</strong>
          <p>No encontré datos públicos suficientemente fiables de una curva de agarre específica de un neumático de Fórmula 1, por lo que las curvas de abajo son un <strong>conjunto ilustrativo generado con las fórmulas de arriba y parámetros que usted puede cambiar</strong>. No provienen de Pirelli ni de ningún experimento y no deben leerse como cifras reales. Lo que sí está documentado es el comportamiento cualitativo: existe una ventana de temperatura con pérdida por ambos lados ${cite('pirelli-window')}, y la ventana se define por un porcentaje de pérdida ${cite('motorsportweek-berra')}.</p></div>
        <div class="lab">
          <div class="lab-head"><h4>Agarre en función de la temperatura</h4><span class="badge">Conjunto ILUSTRATIVO (hipotético)</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                ${slider({ id: 't4-mup', label: 'Agarre máximo μ_pico', min: 1, max: 2.5, step: 0.05, value: 1.8, unit: '', dec: 2 })}
                ${slider({ id: 't4-topt', label: 'Temperatura óptima T_opt', min: 60, max: 130, step: 1, value: 100, unit: '°C', dec: 0 })}
                ${slider({ id: 't4-wc', label: 'Ancho del lado frío w_frío', min: 8, max: 45, step: 1, value: 22, unit: '°C', dec: 0 })}
                ${slider({ id: 't4-wh', label: 'Ancho del lado caliente w_cal', min: 5, max: 35, step: 1, value: 14, unit: '°C', dec: 0 })}
                ${slider({ id: 't4-p', label: 'Pérdida admitida en la ventana p', min: 1, max: 20, step: 1, value: 5, unit: '%', dec: 0 })}
                ${slider({ id: 't4-T', label: 'Temperatura actual del neumático', min: 30, max: 170, step: 1, value: 85, unit: '°C', dec: 0 })}
                <button class="btn" id="t4-csv" type="button">Descargar datos (CSV)</button>
              </div>
              <div class="chart-stack">
                <div class="chart-wrap tall"><canvas id="t4-c1"></canvas></div>
                <div class="readouts">
                  ${readout({ id: 't4-o-mu', label: 'μ a la temperatura actual', unit: '', color: 'force', big: true })}
                  ${readout({ id: 't4-o-pct', label: 'Agarre respecto al pico', unit: '%', color: 'result' })}
                  ${readout({ id: 't4-o-lo', label: 'Ventana: límite inferior', unit: '°C', color: 'pos' })}
                  ${readout({ id: 't4-o-hi', label: 'Ventana: límite superior', unit: '°C', color: 'acc' })}
                  ${readout({ id: 't4-o-v', label: 'v máx. en curva plana de 100 m', unit: 'm/s', color: 'vel' })}
                </div>
                <p class="status" id="t4-s1" role="status"></p>
              </div>
            </div>
          </div>
        </div>

        <div class="lab" style="margin-top:18px">
          <div class="lab-head"><h4>Fuerza lateral máxima en función de la carga vertical</h4><span class="badge">Conjunto ILUSTRATIVO (hipotético)</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                ${slider({ id: 't4-mu0', label: 'Coeficiente a carga nula μ₀', min: 1.5, max: 3.5, step: 0.05, value: 2.4, unit: '', dec: 2 })}
                ${slider({ id: 't4-b', label: 'Sensibilidad a la carga b', min: 0, max: 0.25, step: 0.01, value: 0.12, unit: '1/kN', dec: 2, hint: 'b = 0 equivale al modelo simple (proporcional).' })}
                ${slider({ id: 't4-n0', label: 'Carga media por neumático N₀', min: 1, max: 6, step: 0.1, value: 3, unit: 'kN', dec: 1 })}
                ${slider({ id: 't4-dn', label: 'Transferencia de carga ΔN (curva)', min: 0, max: 2.5, step: 0.1, value: 1.2, unit: 'kN', dec: 1, hint: 'Un neumático gana ΔN y el opuesto la pierde.' })}
              </div>
              <div class="chart-stack">
                <div class="chart-wrap tall"><canvas id="t4-c2"></canvas></div>
                <div class="readouts">
                  ${readout({ id: 't4-o-fy', label: 'F_y máx. de los dos neumáticos (con transferencia)', unit: 'kN', color: 'force' })}
                  ${readout({ id: 't4-o-fi', label: 'F_y máx. sin transferencia', unit: 'kN', color: 'result' })}
                  ${readout({ id: 't4-o-loss', label: 'Pérdida por transferencia', unit: '%', color: 'acc', big: true })}
                </div>
                <p class="status" id="t4-s2" role="status"></p>
              </div>
            </div>
          </div>
        </div>

        <div class="lab" style="margin-top:18px">
          <div class="lab-head"><h4>El modelo simple en acción: bloque que se desliza</h4><span class="badge">Fricción estática vs. cinética</span></div>
          <div class="lab-body"><div class="lab-split">
            <div class="controls">
              ${numberField({ id: 't4-m', label: 'Masa m', min: 0.1, max: 5000, step: 0.1, value: 10, unit: 'kg' })}
              ${numberField({ id: 't4-ms', label: 'Coeficiente estático μ_s', min: 0, max: 3, step: 0.01, value: 0.6, unit: '' })}
              ${numberField({ id: 't4-mk', label: 'Coeficiente cinético μ_k', min: 0, max: 3, step: 0.01, value: 0.4, unit: '' })}
              ${numberField({ id: 't4-F', label: 'Fuerza horizontal aplicada F', min: 0, max: 100000, step: 1, value: 50, unit: 'N' })}
            </div>
            <div><div class="readouts">
              ${readout({ id: 't4-b-N', label: 'Fuerza normal N = m g', unit: 'N', color: 'force' })}
              ${readout({ id: 't4-b-max', label: 'Fricción estática máxima μ_s N', unit: 'N', color: 'pos' })}
              ${readout({ id: 't4-b-f', label: 'Fricción que actúa', unit: 'N', color: 'acc' })}
              ${readout({ id: 't4-b-a', label: 'Aceleración del bloque', unit: 'm/s²', color: 'vel' })}
            </div><p class="status" id="t4-s3" role="status"></p></div>
          </div></div>
        </div>
        <details class="tblock" style="margin-top:14px"><summary><strong>¿Cómo se obtuvieron los datos y qué ecuación genera cada curva?</strong></summary>
          <ul><li><strong>μ(T)</strong>: campana asimétrica de la ecuación anterior, con los parámetros de los controles. Línea discontinua: modelo simple (μ constante = μ_pico). Banda: temperaturas con μ ≥ (1 − p) μ_pico.</li>
          <li><strong>F_y(N)</strong>: μ(N) N con μ(N)= μ₀ − bN (curva «hipotética»); la recta discontinua es el modelo simple con el μ que corresponde a N₀.</li>
          <li><strong>Transferencia de carga</strong>: se suman F_y(N₀ − ΔN) + F_y(N₀ + ΔN) y se compara con 2 F_y(N₀). Con curva cóncava (b &gt; 0) la suma es menor; con el modelo simple sería igual.</li></ul></details>
      </div>

      <div class="tblock">
        <h3>Interpretación de los resultados</h3>
        <ul>
          <li><strong>Ventana:</strong> el intervalo es más estrecho del lado caliente en la curva de ejemplo, lo que refleja la idea documentada de que sobrecalentar penaliza más y de forma irreversible ${cite('f1technical-deg')}. Aumentar p ensancha la ventana: la «ventana» depende de cuánta pérdida se tolere ${cite('motorsportweek-berra')}.</li>
          <li><strong>Modelo simple vs. curva:</strong> la línea de μ constante sobreestima el agarre fuera de la ventana y no puede reproducir una vuelta de salida con goma fría.</li>
          <li><strong>Sensibilidad a la carga:</strong> si ${ie('F_y')} es cóncava respecto de ${ie('N')}, pasar peso de un neumático a otro reduce la fuerza lateral total. Es la razón por la que un coche con más transferencia de carga en curva tiene menos agarre disponible, aunque la carga total sea la misma.</li>
          <li><strong>Fricción cinética:</strong> si el neumático desliza, actúa μ_k N, normalmente menor que μ_s N; por eso se busca operar cerca del límite sin sobrepasarlo.</li>
        </ul>
      </div>

      <div class="tblock">
        <h3>Limitaciones, supuestos y clasificación de afirmaciones</h3>
        <ul class="claims">
          <li>${tag('hecho')}<span>Existe una ventana de trabajo definida por la temperatura ${cite('pirelli-window')}; se define por un porcentaje de pérdida de agarre ${cite('motorsportweek-berra')}; existe degradación térmica irreversible ${cite('f1technical-deg')}; el agarre de goma depende de temperatura y su coeficiente depende de la carga ${cite('pacejka', 'milliken')}.</span></li>
          <li>${tag('calculo')}<span>Ventana, μ a la temperatura actual, pérdida por transferencia de carga y velocidad máxima: se derivan de las fórmulas con los parámetros elegidos.</span></li>
          <li>${tag('hipotesis')}<span>Las formas funcionales (campana asimétrica, μ lineal en N) y todos los valores numéricos son ilustrativos; no existe una única curva universal para todos los neumáticos de F1, y estos números no representan a ninguno.</span></li>
          <li>${tag('supuesto')}<span>Temperatura uniforme, sin desgaste, presión ni velocidad de deslizamiento; superficie plana y seca; sin carga aerodinámica en la velocidad de curva.</span></li>
        </ul>
      </div>

      ${Portfolio.connections([
        { to: 'tema-1', text: 'La aceleración lateral máxima en una curva es el análogo de la que limita al dron: aquí viene de μ g, allí de la inclinación admisible.' },
        { to: 'tema-3', text: 'Una curva exige aceleración centrípeta ' + ie('v^2/r') + '; el neumático la entrega con fricción. Cuando ' + ie('v^2/r>\\mu g') + ' el coche sale de la trayectoria.' },
        { to: 'tema-5', text: 'En ambos casos un modelo lineal (F = μN, F = −kx) funciona en un rango y falla fuera de él: saturación, no linealidad y dependencia del estado.' },
      ])}
      ${Portfolio.sources(['pirelli-window', 'pirelli-graining', 'motorsportweek-berra', 'f1technical-deg', 'pacejka', 'milliken', 'openstax'])}
      `;
    },

    init(el) {
      const $ = (id) => el.querySelector('#t4-' + id);
      const val = (id) => parseFloat($(id).value);
      const c1 = new LineChart($('c1'), { title: 'Coeficiente de agarre en función de la temperatura (HIPOTÉTICO)', xLabel: 'Temperatura del neumático T', xUnit: '°C', yLabel: 'Coeficiente de agarre μ', yUnit: '', yMin: 0, decimalsTooltip: 2 });
      const c2 = new LineChart($('c2'), { title: 'Fuerza lateral máxima en función de la carga vertical (HIPOTÉTICO)', xLabel: 'Carga vertical N', xUnit: 'kN', yLabel: 'Fuerza lateral máx. F_y', yUnit: 'kN', yMin: 0, xMin: 0, xMax: 8, decimalsTooltip: 2 });
      const state = { temps: [], mus: [], Ns: [], fy: [] };

      function update1() {
        const p = { muPeak: val('mup'), tOpt: val('topt'), wCold: val('wc'), wHot: val('wh') }, loss = val('p') / 100, Tnow = val('T');
        let win; try { win = P.operatingWindow(p, loss); } catch (e) { $('s1').textContent = e.message; return; }
        const Ts = P.linspace(30, 170, 281), mus = Ts.map((t) => P.gripVsTemperature(t, p));
        state.temps = Ts; state.mus = mus;
        const mu = P.gripVsTemperature(Tnow, p);
        c1.update({
          xMin: 30, xMax: 170, yMax: Math.max(2.6, p.muPeak * 1.15), cursorX: Tnow,
          bands: [{ from: win.low, to: win.high, color: 'rgba(125,219,176,0.14)', label: `ventana (pérdida ≤ ${fmt(loss * 100, 0)} %)` }],
          series: [
            { name: 'μ(T) hipotético', color: UI.cssVar('--c-force', '#b7a1ff'), x: Ts, y: mus },
            { name: 'Modelo simple: μ constante', color: '#a4b3cf', dashed: true, width: 1.6, x: [30, 170], y: [p.muPeak, p.muPeak] },
          ],
        });
        $('o-mu').textContent = fmt(mu, 2); $('o-pct').textContent = fmt((mu / p.muPeak) * 100, 0);
        $('o-lo').textContent = fmt(win.low, 0); $('o-hi').textContent = fmt(win.high, 0);
        $('o-v').textContent = fmt(P.maxCornerSpeed(mu, 100), 1);
        const where = Tnow < win.low ? 'por debajo de la ventana (goma fría)' : Tnow > win.high ? 'por encima de la ventana (sobrecalentada)' : 'dentro de la ventana';
        $('s1').className = 'status' + (Tnow >= win.low && Tnow <= win.high ? '' : ' warn');
        $('s1').textContent = `A ${fmt(Tnow, 0)} °C el neumático está ${where}. Recuerde: curva ilustrativa.`;
      }

      function update2() {
        const p = { mu0: val('mu0'), b: val('b') }, N0 = val('n0'), dN = Math.min(val('dn'), N0);
        const Ns = P.linspace(0, 8, 161), fy = Ns.map((n) => P.lateralForce(n, p));
        state.Ns = Ns; state.fy = fy;
        const muRef = P.muVsLoad(N0, p), simple = Ns.map((n) => muRef * n);
        const L = P.loadTransferLoss(N0, dN, p), lo = Math.max(0, N0 - dN), hi = N0 + dN;
        c2.update({
          yMax: Math.max(...fy, ...simple) * 1.1,
          series: [
            { name: 'F_y = μ(N)·N (hipotético)', color: UI.cssVar('--c-force', '#b7a1ff'), x: Ns, y: fy },
            { name: 'Modelo simple: μ(N₀)·N', color: '#a4b3cf', dashed: true, width: 1.6, x: Ns, y: simple },
            { name: 'N₀ ± ΔN', color: '#ffffff', points: true, radius: 5, x: [lo, hi], y: [P.lateralForce(lo, p), P.lateralForce(hi, p)] },
            { name: 'N₀', color: UI.cssVar('--c-result', '#7ddbb0'), points: true, radius: 5, x: [N0], y: [P.lateralForce(N0, p)] },
          ],
        });
        $('o-fy').textContent = fmt(L.total, 2); $('o-fi').textContent = fmt(L.ideal, 2); $('o-loss').textContent = fmt(L.lossPct, 2);
        $('s2').textContent = p.b === 0 ? 'Con b = 0 el modelo es lineal y la transferencia de carga no cambia la fuerza total.' : (dN < val('dn') ? 'ΔN se limitó a N₀ (un neumático no puede tener carga negativa).' : '');
      }

      function update3() {
        const ids = { m: [0.1, 5000], ms: [0, 3], mk: [0, 3], F: [0, 100000] };
        let ok = true;
        for (const [k, [lo, hi]] of Object.entries(ids)) {
          const v = val(k), bad = !(v >= lo && v <= hi);
          UI.fieldError(el, 't4-' + k, bad ? `Ingrese un valor entre ${fmt(lo, 1)} y ${fmt(hi, 0)}.` : ''); if (bad) ok = false;
        }
        if (!ok) { $('s3').className = 'status warn'; $('s3').textContent = 'Corrija los campos marcados.'; return; }
        const warnMu = val('mk') > val('ms');
        const r = P.blockFriction({ m: val('m'), muS: val('ms'), muK: val('mk'), applied: val('F') });
        $('b-N').textContent = fmt(r.N, 1); $('b-max').textContent = fmt(r.fMaxStatic, 1); $('b-f').textContent = fmt(r.friction, 1); $('b-a').textContent = fmt(r.a, 2);
        $('s3').className = 'status' + (warnMu ? ' warn' : '');
        $('s3').textContent = (r.state === 'static' ? 'F ≤ μ_s N: el bloque NO se mueve y la fricción iguala a F.' : 'F > μ_s N: el bloque desliza; actúa μ_k N y sobra fuerza neta.') + (warnMu ? ' Aviso: normalmente μ_k < μ_s.' : '');
      }

      ['mup', 'topt', 'wc', 'wh', 'p', 'T'].forEach((id) => $(id).addEventListener('input', update1));
      ['mu0', 'b', 'n0', 'dn'].forEach((id) => $(id).addEventListener('input', update2));
      ['m', 'ms', 'mk', 'F'].forEach((id) => $(id).addEventListener('input', update3));
      UI.bindSliders(el);
      $('csv').addEventListener('click', () => {
        UI.downloadCSV('llantas-datos-ilustrativos.csv',
          { T_C: state.temps.map((v) => v.toFixed(1)), mu_hipotetico: state.mus.map((v) => v.toFixed(4)) },
          'DATOS HIPOTETICOS ILUSTRATIVOS, NO MEDIDOS. No provienen de Pirelli ni de ningun experimento. mu(T)=mu_pico*exp(-((T-Topt)/w)^2) con parametros elegidos por el usuario.');
      });
      update1(); update2(); update3();
    },
  };

  Portfolio.register(T);
})();
