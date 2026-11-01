/* ==========================================================================
   Tema 6 — Frenado regenerativo en un vehículo eléctrico
   Recurso prescrito: VISUALIZACIÓN DE DATOS
   Datos reales de entrada: ciclo urbano UDDS de la EPA (velocidad cada segundo).
   El balance de energía se calcula con el teorema trabajo-energía en cada segundo.
   ========================================================================== */
(function () {
  'use strict';
  const tex = String.raw;
  const { eq, ie, tag, varTable, tradeoff, slider, readout, fmt } = UI;
  const { cite } = Portfolio;
  const P = Physics;

  const T = {
    id: 'tema-6', number: 6, accent: 'result', avance: 'Avance 2',
    title: 'Frenado regenerativo en un vehículo eléctrico',
    resource: 'Visualización de datos',
    concepts: ['Trabajo', 'Energía cinética', 'Transformación de energía'],
    summary: 'Cuánta de la energía de cada frenada vuelve a la batería y cuánta se pierde como calor, segundo a segundo en un ciclo de manejo real.',

    html() {
      return String.raw`
      ${Portfolio.head(T)}

      <div class="tblock">
        <h3>Introducción al problema</h3>
        <p>Un auto de combustión que frena convierte toda su energía cinética en calor en las pastillas y discos. Un vehículo eléctrico puede usar su motor como generador: el mismo campo que lo impulsa lo frena, y la corriente inducida carga la batería. La pregunta de ingeniería es cuantitativa: <strong>en un trayecto urbano real, ¿cuánta energía de frenado hay disponible, cuánta se recupera y cuánta termina inevitablemente como calor?</strong> De esa respuesta depende la autonomía que el software del auto le promete al conductor.</p>
      </div>

      <div class="tblock">
        <h3>Caso de uso en ingeniería del software</h3>
        <p><strong>Industria:</strong> automotriz (vehículos eléctricos). <strong>Sistema:</strong> la unidad de control del vehículo y su algoritmo de <em>brake blending</em>, que reparte cada frenada entre el motor-generador y los frenos de fricción, y el estimador de autonomía que se muestra en el tablero.</p>
        <p>${tag('hecho')} La EPA usa el ciclo de manejo urbano UDDS, una serie de velocidades segundo a segundo, para medir en dinamómetro el consumo en ciudad de los vehículos ${cite('epa-dds')}. ${tag('hecho')} Los vehículos eléctricos recuperan parte de la energía del frenado con frenado regenerativo y la devuelven a la batería ${cite('doe-ev')}. Fabricantes como Nissan (e-Pedal del Leaf) y Tesla permiten que el conductor frene casi solo con el pedal del acelerador, porque al soltarlo el software ordena al motor un torque de regeneración ${cite('nissan-epedal')}.</p>
        <p>En cada ciclo de control, el software calcula la potencia que hay que quitarle al vehículo, ${ie('P=F\\,v')}, y decide qué parte puede absorber el motor (limitado por su potencia máxima y por cuánto acepta la batería) y qué parte deben disipar los frenos de fricción.</p>
      </div>

      <div class="tblock">
        <h3>Concepto físico y ecuaciones</h3>
        <p>El <strong>teorema trabajo-energía</strong> dice que el trabajo neto sobre el vehículo es igual a su cambio de energía cinética ${cite('openstax')}:</p>
        ${eq(tex`W_{\text{neto}}=\Delta K=\tfrac12\,m\,v_f^{2}-\tfrac12\,m\,v_i^{2}`, 'Al frenar, ΔK < 0: alguien tiene que hacer trabajo negativo sobre el auto. Ese trabajo es energía que se recupera o se disipa.')}
        <p>En cada segundo del ciclo, la fuerza que deben dar las ruedas es la necesaria para acelerar la masa más la que vencen la rodadura y el aire. Multiplicada por la velocidad da la potencia en la rueda:</p>
        ${eq(tex`P_{\text{rueda}}=\Big(m\,a+C_{rr}\,m\,g+\tfrac12\,\rho\,C_d A\,v^{2}\Big)\,v`, 'P > 0: tracción (la batería entrega P/η). P < 0: hay que frenar.')}
        ${eq(tex`P_{\text{recuperada}}=\eta_{\text{regen}}\cdot\min\!\big(|P_{\text{rueda}}|,\;P_{\max}\big)\qquad P_{\text{fricción}}=|P_{\text{rueda}}|-\min\!\big(|P_{\text{rueda}}|,\;P_{\max}\big)`, 'El motor absorbe hasta P_max; lo que excede va a los frenos de fricción. De lo absorbido, solo η_regen llega a la batería.')}
        ${eq(tex`E=\sum_i P_i\,\Delta t\qquad \text{balance: } E_{\text{batería}}=E_{\text{rodadura+aire}}+E_{\text{frenado}}+E_{\text{pérdidas de tracción}}`, 'Integrando la potencia en el tiempo se obtiene la energía; en un ciclo que empieza y termina detenido, ΔK = 0.')}
        ${varTable([
          ['m', 'masa del vehículo con ocupantes', 'kg'],
          ['v,\\ a', 'velocidad y aceleración del ciclo en cada segundo', 'm/s, m/s²'],
          ['K', 'energía cinética ½ m v²', 'J (kWh = 3,6 × 10⁶ J)'],
          ['C_{rr}', 'coeficiente de resistencia a la rodadura', '—'],
          ['\\rho,\\ C_d A', 'densidad del aire y área aerodinámica equivalente', 'kg/m³, m²'],
          ['P_{\\max}', 'potencia máxima de regeneración que acepta el sistema', 'W'],
          ['\\eta_{\\text{regen}},\\ \\eta', 'eficiencias de regeneración y de tracción', '—'],
        ])}
      </div>

      <div class="tblock">
        <h3>Cómo se usa la física para resolver el problema</h3>
        <p>La energía que se puede recuperar <strong>no</strong> es toda la energía cinética que el auto alcanza: una parte se la llevan el aire y la rodadura mientras el auto se desacelera. Solo cuando ${ie('P_{\\text{rueda}}<0')} sobra energía que alguien debe absorber. El modelo calcula esa cantidad segundo a segundo sobre el ciclo UDDS real, con los parámetros de un sedán eléctrico típico que usted puede cambiar.</p>
        <p>${tag('calculo')} Con los valores iniciales (1850 kg, ${ie('C_dA=0{,}51\\,\\mathrm{m^2}')}, ${ie('C_{rr}=0{,}009')}, ${ie('\\eta_{\\text{regen}}=0{,}70')}), en los 12 km del ciclo hacen falta unos 0,81 kWh de frenado; el motor devuelve 0,57 kWh a la batería y el consumo neto baja de unos 146 a 99 Wh/km, cerca de un tercio menos que frenando solo con fricción.</p>
        ${tradeoff(
          `<ul><li>El estimador de autonomía responde al estilo de manejo real: el mismo trayecto en ciudad rinde más que en autopista, como en la vida real.</li><li>El reparto regeneración/fricción se decide con un límite físico (P_max, carga de la batería) y no con una tabla fija.</li><li>El mismo modelo sirve para dimensionar el motor y la batería antes de construirlos.</li></ul>`,
          `<ul><li>Hay que conocer masa, C_dA, C_rr y eficiencias, que cambian con la carga, la temperatura y el estado de la batería.</li><li>Con la batería llena o fría la regeneración se limita y el modelo debe saberlo, o la autonomía estimada se equivoca.</li><li>Las eficiencias reales dependen del punto de operación del motor; un η constante es una simplificación.</li></ul>`
        )}
        <p><strong>Frente a la alternativa no física:</strong> un consumo fijo en Wh/km o un «porcentaje de recuperación» constante no distingue entre una ciudad con semáforos (muchas frenadas, mucha recuperación) y una autopista (casi ninguna), ni explica por qué frenar fuerte desperdicia energía cuando se supera P_max.</p>
      </div>

      <div class="tblock">
        <h3>Recurso: visualización de datos</h3>
        <div class="callout hecho"><strong>Fuente de los datos</strong>
          <p>La velocidad es la del ciclo <strong>UDDS de la U.S. EPA</strong> (archivo <code>uddscol.txt</code>, 1370 s, una muestra por segundo) ${cite('epa-dds')}: es un dato real y público. Las energías son <strong>resultados calculados</strong> por mí a partir de esa velocidad con las ecuaciones de arriba y los parámetros del vehículo declarados en los controles, que son típicos de un sedán eléctrico, no de un modelo comercial concreto.</p></div>
        <div class="lab">
          <div class="lab-head"><h4>Balance de energía a lo largo del ciclo urbano UDDS</h4><span class="badge">Velocidad real (EPA) · energía calculada</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                ${slider({ id: 't6-m', label: 'Masa del vehículo m', min: 1000, max: 3000, step: 50, value: 1850, unit: 'kg', dec: 0 })}
                ${slider({ id: 't6-eta', label: 'Eficiencia de regeneración η_regen', min: 0, max: 95, step: 1, value: 70, unit: '%', dec: 0, hint: 'Fracción de lo que absorbe el motor que llega a la batería.' })}
                ${slider({ id: 't6-pmax', label: 'Potencia máxima de regeneración P_max', min: 5, max: 150, step: 5, value: 60, unit: 'kW', dec: 0, hint: 'Lo que exceda este límite lo disipan los frenos de fricción.' })}
                ${slider({ id: 't6-cda', label: 'Área aerodinámica C_d·A', min: 0.3, max: 1.2, step: 0.01, value: 0.51, unit: 'm²', dec: 2 })}
                ${slider({ id: 't6-crr', label: 'Resistencia a la rodadura C_rr', min: 0.005, max: 0.02, step: 0.001, value: 0.009, unit: '', dec: 3 })}
                <label class="switch"><input type="checkbox" id="t6-regen" checked><span>Frenado regenerativo activado</span></label>
                <button class="btn" id="t6-csv" type="button">Descargar datos (CSV)</button>
              </div>
              <div class="chart-stack">
                <div class="chart-wrap"><canvas id="t6-cv"></canvas></div>
                <div class="readouts">
                  ${readout({ id: 't6-o-rec', label: 'Energía devuelta a la batería', unit: 'kWh', color: 'result', big: true })}
                  ${readout({ id: 't6-o-fric', label: 'Disipada en frenos de fricción', unit: 'kWh', color: 'acc' })}
                  ${readout({ id: 't6-o-pct', label: 'Del frenado, recuperado', unit: '%', color: 'result' })}
                  ${readout({ id: 't6-o-whkm', label: 'Consumo neto', unit: 'Wh/km', color: 'vel' })}
                  ${readout({ id: 't6-o-save', label: 'Ahorro frente a no regenerar', unit: '%', color: 'pos' })}
                </div>
              </div>
            </div>
            <div class="chart-wrap tall"><canvas id="t6-ce"></canvas></div>
            <div>
              <h4>Balance final del ciclo (kWh)</h4>
              <div class="balance" id="t6-balance" role="img" aria-label="Barras con el destino de la energía al final del ciclo"></div>
              <p class="chart-note">Las barras suman la energía que salió de la batería (tracción) y muestran a dónde fue: vencer aire y rodadura, pérdidas del motor, y el frenado, que se divide en lo recuperado y lo disipado como calor.</p>
            </div>
            <div class="table-wrap"><table class="data" id="t6-table"></table></div>
          </div>
        </div>
      </div>

      <div class="tblock">
        <h3>Interpretación de los resultados</h3>
        <ul>
          <li><strong>Dónde aparece la recuperación:</strong> en la gráfica acumulada, la curva verde sube en escalones justo cuando la velocidad cae. Cada escalón es una frenada en un semáforo del ciclo urbano: ahí ${ie('\\Delta K<0')} y la energía cinética se transforma en energía química de la batería.</li>
          <li><strong>Por qué no se recupera todo:</strong> la energía cinética máxima del auto a 91 km/h (la rapidez máxima del ciclo) es de unos 0,16 kWh, pero no toda queda disponible al frenar: el aire y la rodadura se llevan su parte en el camino. De lo que sí llega al motor, el factor ${ie('\\eta_{\\text{regen}}')} representa las pérdidas eléctricas y mecánicas.</li>
          <li><strong>El límite de potencia importa:</strong> baje ${ie('P_{\\max}')} a 20 kW y aparecerá energía disipada en fricción: las frenadas fuertes piden más potencia de la que el motor acepta. Por eso el software combina ambos frenos.</li>
          <li><strong>La masa:</strong> un auto más pesado necesita más energía para acelerar, pero también devuelve más al frenar; el saldo neto empeora porque la rodadura crece con ${ie('m')} y la recuperación nunca es del 100 %.</li>
        </ul>
      </div>

      <div class="tblock">
        <h3>Limitaciones, supuestos y clasificación de afirmaciones</h3>
        <ul class="claims">
          <li>${tag('hecho')}<span>El ciclo UDDS y su uso en las pruebas de la EPA ${cite('epa-dds')}; la existencia del frenado regenerativo en los vehículos eléctricos ${cite('doe-ev')}.</span></li>
          <li>${tag('calculo')}<span>Todas las energías, porcentajes y consumos del recurso, a partir de la velocidad real y los parámetros declarados.</span></li>
          <li>${tag('supuesto')}<span>Eficiencias constantes, sin consumo de accesorios (aire acondicionado, electrónica), calle plana, sin viento, ${ie('\\rho=1{,}2\\,\\mathrm{kg/m^3}')}, ${ie('\\eta_{\\text{tracción}}=0{,}90')}. La batería acepta toda la potencia hasta P_max (no está llena ni fría).</span></li>
          <li>${tag('hipotesis')}<span>Los valores de masa, C_dA y C_rr son típicos de un sedán eléctrico, no los de un modelo comercial concreto; los consumos absolutos son por eso orientativos, mientras que las comparaciones (con y sin regeneración) son más robustas.</span></li>
        </ul>
      </div>

      ${Portfolio.connections([
        { to: 'tema-4', text: 'Los frenos de fricción convierten la energía en calor por el mismo mecanismo que calienta una llanta; el agarre limita además cuánta fuerza de frenado se puede aplicar sin deslizar.' },
        { to: 'tema-1', text: 'La aceleración a(t) del ciclo se obtiene por diferencias finitas de la velocidad, igual que con la telemetría del dron.' },
        { to: 'tema-7', text: 'Un choque inelástico también «pierde» energía cinética, pero la conserva como calor y deformación: la energía nunca desaparece, cambia de forma.' },
        { to: 'tema-9', text: 'La Voyager gana energía cinética sin combustible; aquí el auto la recupera sin desperdiciarla. En ambos casos el balance ΔK = W cuadra.' },
      ])}
      ${Portfolio.sources(['epa-dds', 'doe-ev', 'nissan-epedal', 'openstax'])}
      `;
    },

    init(el) {
      const $ = (id) => el.querySelector('#t6-' + id);
      const v = (window.UDDS_MPH || []).map((x) => x * P.MPH);
      const tAxis = v.map((_, i) => i);
      const c = () => ({ pos: UI.cssVar('--c-pos', '#33a3bf'), vel: UI.cssVar('--c-vel', '#c08801'), acc: UI.cssVar('--c-acc', '#e36574'), force: UI.cssVar('--c-force', '#9882dd'), res: UI.cssVar('--c-result', '#49a980') });
      const chV = new LineChart($('cv'), { title: 'Velocidad del ciclo UDDS (EPA)', xLabel: 'Tiempo t', xUnit: 's', yLabel: 'Velocidad', yUnit: 'km/h', includeZeroY: true, decimalsTooltip: 1 });
      const chE = new LineChart($('ce'), { title: 'Energía acumulada a lo largo del ciclo', xLabel: 'Tiempo t', xUnit: 's', yLabel: 'Energía', yUnit: 'kWh', includeZeroY: true, decimalsTooltip: 3, ariaLabel: 'Energía acumulada entregada por la batería, recuperada por regeneración, disipada en frenos de fricción y consumo neto a lo largo del ciclo UDDS' });
      let last = null;
      if (!v.length) { $('o-rec').textContent = 'sin datos'; return; }

      function params(regen) {
        return { m: +$('m').value, etaRegen: +$('eta').value / 100, pRegenMaxKW: +$('pmax').value, cdA: +$('cda').value, crr: +$('crr').value, regen };
      }
      function update() {
        const on = $('regen').checked;
        const r = P.regenCycle(v, params(on)), off = P.regenCycle(v, params(false));
        last = r;
        const k = c();
        // bandas: tramos de frenado (P_rueda < 0) ~ donde la energía de frenado crece
        const bands = []; let start = null;
        for (let i = 1; i < r.t.length; i++) {
          const braking = (r.rec[i] - r.rec[i - 1]) + (r.fric[i] - r.fric[i - 1]) > 1e-7;
          if (braking && start == null) start = r.t[i - 1];
          if (!braking && start != null) { bands.push({ from: start, to: r.t[i - 1], color: 'rgba(73,169,128,0.13)' }); start = null; }
        }
        chV.update({ xMin: 0, xMax: tAxis[tAxis.length - 1], bands, series: [{ name: 'Velocidad', color: k.pos, x: tAxis, y: v.map((x) => x * 3.6) }] });
        chE.update({
          xMin: 0, xMax: r.t[r.t.length - 1],
          series: [
            { name: 'Entregada por la batería', color: k.vel, x: r.t, y: r.bat },
            { name: 'Recuperada (regeneración)', color: k.res, x: r.t, y: r.rec },
            { name: 'Disipada en frenos', color: k.acc, x: r.t, y: r.fric },
            { name: 'Consumo neto', color: k.force, x: r.t, y: r.net, dashed: true },
          ],
        });
        const T = r.totals;
        $('o-rec').textContent = fmt(T.rec, 3); $('o-fric').textContent = fmt(T.fric, 3);
        $('o-pct').textContent = fmt(r.recoveredPct, 1); $('o-whkm').textContent = fmt(r.whPerKm, 1);
        $('o-save').textContent = fmt(off.totals.net > 0 ? (1 - T.net / off.totals.net) * 100 : 0, 1);
        // balance final: barras horizontales en una sola escala
        const tractionLoss = T.bat - T.loss - T.brake;
        const rows = [
          { name: 'Entregada por la batería (tracción)', val: T.bat, color: k.vel },
          { name: 'Para vencer aire y rodadura', val: T.loss, color: k.pos },
          { name: 'Pérdidas del motor en tracción', val: Math.max(0, tractionLoss), color: k.force },
          { name: 'Energía de frenado disponible', val: T.brake, color: 'var(--text-dim)' },
          { name: '↳ recuperada a la batería', val: T.rec, color: k.res },
          { name: '↳ pérdidas de la regeneración', val: T.brake - T.rec - T.fric, color: 'var(--axis)' },
          { name: '↳ calor en frenos de fricción', val: T.fric, color: k.acc },
        ];
        const max = Math.max(...rows.map((x) => x.val));
        $('balance').innerHTML = rows.map((x) => `<div class="bal-row"><span class="bal-name">${x.name}</span><span class="bal-track"><span class="bal-bar" style="--w:${max > 0 ? (x.val / max) * 100 : 0}%;background:${x.color}"></span></span><span class="bal-val">${fmt(x.val, 3)}</span></div>`).join('');
        const withR = on ? r : P.regenCycle(v, params(true));
        $('table').innerHTML = `<thead><tr><th>Escenario</th><th>Batería (kWh)</th><th>Recuperada (kWh)</th><th>Fricción (kWh)</th><th>Neto (Wh/km)</th></tr></thead><tbody>
          <tr><td>Con regeneración (P_max = ${fmt(+$('pmax').value, 0)} kW)</td><td>${fmt(withR.totals.bat, 3)}</td><td>${fmt(withR.totals.rec, 3)}</td><td>${fmt(withR.totals.fric, 3)}</td><td>${fmt(withR.whPerKm, 1)}</td></tr>
          <tr><td>Solo frenos de fricción</td><td>${fmt(off.totals.bat, 3)}</td><td>0</td><td>${fmt(off.totals.fric, 3)}</td><td>${fmt(off.whPerKm, 1)}</td></tr></tbody>`;
      }
      ['m', 'eta', 'pmax', 'cda', 'crr', 'regen'].forEach((id) => $(id).addEventListener('input', update));
      $('regen').addEventListener('change', update);
      UI.bindSliders(el);
      $('csv').addEventListener('click', () => {
        if (!last) return;
        UI.downloadCSV('frenado-regenerativo-udds.csv',
          { t_s: last.t, v_kmh: last.t.map((t) => (v[t] * 3.6).toFixed(2)), bateria_kWh: last.bat.map((x) => x.toFixed(5)), recuperada_kWh: last.rec.map((x) => x.toFixed(5)), friccion_kWh: last.fric.map((x) => x.toFixed(5)), neto_kWh: last.net.map((x) => x.toFixed(5)) },
          'Velocidad: ciclo UDDS de la U.S. EPA (uddscol.txt). Energias CALCULADAS con el modelo P=(ma+Crr m g+0.5 rho CdA v^2) v y los parametros elegidos en la pagina.');
      });
      update();
    },
  };

  Portfolio.register(T);
})();
