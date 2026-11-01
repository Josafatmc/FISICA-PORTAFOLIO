/* ==========================================================================
   Tema 5 — El resorte virtual detrás de un control háptico
   Recurso prescrito: MULTIMEDIA CON ANÁLISIS
   Video incrustado (TronicsFix, desarme del DualSense) + análisis escrito propio
   + curva fuerza-desplazamiento interactiva.
   ========================================================================== */
(function () {
  'use strict';
  const tex = String.raw;
  const { eq, ie, tag, varTable, tradeoff, slider, readout, fmt } = UI;
  const { cite } = Portfolio;
  const P = Physics;

  const VIDEO_ID = '4rNITneXnCo';
  const VIDEO_WATCH = 'https://www.youtube.com/watch?v=' + VIDEO_ID;

  /** Trabajo del dedo (área bajo la curva F–x) en N·mm = mJ, con zona muerta y saturación. */
  function workMilliJoule(x, { k, x0, fMax }) {
    if (x <= x0) return 0;
    const xs = fMax / k, d = x - x0;
    return d <= xs ? 0.5 * k * d * d : 0.5 * k * xs * xs + fMax * (d - xs);
  }

  const T = {
    id: 'tema-5', number: 5, accent: 'result',
    title: 'El resorte virtual detrás de un control háptico',
    resource: 'Multimedia con análisis',
    concepts: ['Ley de Hooke', 'Fuerza elástica', 'Tercera ley de Newton'],
    summary: 'Cómo un motor y un programa hacen que un gatillo se sienta como un resorte que no existe.',

    html() {
      return String.raw`
      ${Portfolio.head(T)}

      <div class="tblock">
        <h3>Introducción al problema</h3>
        <p>Al tensar el arco de un videojuego, la mano debería sentir que cada milímetro cuesta más fuerza, aunque no haya cuerda ni resorte alguno. Un control con gatillo adaptativo debe fabricar esa sensación con un motor. <strong>¿Qué ecuación le dice al motor cuánta fuerza hacer en cada posición del gatillo?</strong> La respuesta es la ley de Hooke, evaluada por software en lugar de por una pieza de metal.</p>
      </div>

      <div class="tblock">
        <h3>Caso de uso en ingeniería del software</h3>
        <p><strong>Producto:</strong> el mando DualSense de PlayStation 5, de Sony, y sus gatillos adaptativos. <strong>Industria:</strong> videojuegos y periféricos hápticos.</p>
        <p>${tag('hecho')} Los gatillos del DualSense pueden variar su resistencia según lo que ocurra en el juego; un ejemplo citado es simular la resistencia de los pedales de distintos coches en Gran Turismo 7, o el tensado de un arco, que se vuelve más duro cuanto más se presiona. El mecanismo combina un motor, una espiral y un engranaje, y el comportamiento lo controla el software ${cite('notebookcheck-ds')}. Otra reseña describe el efecto sentido: poder notar cómo aumenta la tensión de la cuerda al tirar de ella, algo que el mando anterior no permitía ${cite('tomsguide-ds')}.</p>
        <p><strong>Por qué modelar la física:</strong> si cada arma o vehículo tuviera una «sensación» grabada, habría que producir un perfil por cada caso y no habría coherencia con el estado del juego. Con ${ie('F=-kx')} basta cambiar ${ie('k')} (más duro, más blando) y el punto de contacto para obtener un perfil nuevo, y el valor se puede ajustar en vivo según el arma, el cansancio del personaje o la cuerda del arco.</p>
        ${tradeoff(
          `<ul><li>Un solo modelo (${ie('k')}, punto de contacto y fuerza máxima) genera cualquier «sensación» nueva sin grabar perfiles.</li><li>La fuerza responde al estado del juego en cada cuadro: un arco más tenso, un freno que se bloquea.</li><li>La tercera ley queda garantizada: el dedo siente exactamente la fuerza que el motor aplica.</li></ul>`,
          `<ul><li>El motor tiene un torque máximo: el resorte virtual satura y no puede imitar objetos muy rígidos.</li><li>Hay que ajustar k a mano por juego y por arma; un valor físico «real» suele sentirse demasiado duro o blando.</li><li>Más fuerza implica más consumo de batería y más ruido del mecanismo.</li></ul>`
        )}
        <p><strong>Frente a la alternativa no física:</strong> una vibración pregrabada o una resistencia fija no cambia con la posición del gatillo, por lo que no se siente como tensar algo; la fuerza restauradora proporcional al desplazamiento es justamente lo que el cerebro reconoce como un resorte.</p>
      </div>

      <div class="tblock">
        <h3>Concepto físico y ecuaciones</h3>
        <p>Un resorte ideal ejerce una fuerza proporcional a su deformación y de sentido contrario a ella ${cite('openstax')}:</p>
        ${eq(tex`F=-k\,x \qquad |F|=k\,|x| \qquad U=\tfrac12\,k\,x^{2}`, 'Ley de Hooke y energía elástica almacenada.')}
        <ul>
          <li><strong>El signo negativo:</strong> la fuerza es <em>restauradora</em>; apunta hacia la posición de equilibrio. Si el dedo empuja el gatillo en el sentido +x, el resorte empuja en −x.</li>
          <li><strong>La constante k:</strong> mide la rigidez, cuánta fuerza por unidad de desplazamiento. Un k alto es un resorte duro.</li>
          <li><strong>El desplazamiento x:</strong> distancia desde la posición de equilibrio (aquí, gatillo suelto), no la posición absoluta.</li>
        </ul>
        <p>Un resorte <em>virtual</em> programado puede añadir lo que un resorte físico no tiene: un punto de contacto ${ie('x_0')} antes del cual no hay fuerza, y una fuerza máxima ${ie('F_{\\max}')} limitada por el motor:</p>
        ${eq(tex`F_{\text{virtual}}(x)=\begin{cases}0 & x\le x_0\\ \min\!\big(k\,(x-x_0),\,F_{\max}\big) & x>x_0\end{cases}\qquad F_{\text{sobre el dedo}}=-F_{\text{virtual}}`, 'La parte lineal es Hooke con el origen desplazado a x₀; la saturación refleja el límite del actuador.')}
        ${varTable([
          ['F', 'fuerza restauradora del resorte (real o virtual)', 'N'],
          ['k', 'constante elástica (rigidez)', 'N/m (en el laboratorio, N/mm)'],
          ['x,\\ x_0', 'desplazamiento del gatillo y punto de contacto', 'm (en el laboratorio, mm)'],
          ['F_{\\max}', 'fuerza máxima que puede entregar el actuador', 'N'],
          ['U,\\ W', 'energía elástica almacenada y trabajo hecho por el dedo', 'J (en el laboratorio, mJ)'],
        ])}
        <div class="callout supuesto"><strong>Tercera ley de Newton: no es la ley de Hooke</strong>
          <p>La tercera ley dice que las fuerzas entre dos cuerpos forman un <em>par acción–reacción</em>: si el dedo empuja el gatillo con ${ie('\\vec F_{d\\to g}')}, el gatillo empuja el dedo con ${ie('\\vec F_{g\\to d}=-\\vec F_{d\\to g}')}; actúan sobre cuerpos distintos y valen siempre lo mismo, se mueva o no el gatillo. La ley de Hooke, en cambio, dice cuánta fuerza hace el resorte en función del desplazamiento. En equilibrio el gatillo está quieto porque el dedo y el motor lo empujan con fuerzas iguales y opuestas <em>sobre él</em> (primera ley), y eso <strong>no</strong> es un par acción–reacción. Observe el esquema del laboratorio.</p></div>
      </div>

      <div class="tblock">
        <h3>Recurso: video incrustado con análisis</h3>
        <div class="video-frame">
          <iframe src="https://www.youtube-nocookie.com/embed/${VIDEO_ID}" title="Desarme del mando DualSense: motor, espiral y engranaje del gatillo adaptativo (TronicsFix)" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <p class="video-fallback"><strong>Fuente del video:</strong> canal TronicsFix, desarme del DualSense ${cite('tronicsfix')}; identificado a través del artículo de Notebookcheck que lo incrusta ${cite('notebookcheck-ds')}. Si el video no carga en su navegador (bloqueo de contenido, red restringida), ábralo directamente en <a href="${VIDEO_WATCH}" target="_blank" rel="noopener noreferrer">YouTube</a>. Alternativa de texto: el análisis siguiente describe lo que muestra.</p>

        <h4 style="margin-top:20px">Análisis escrito</h4>
        <ol class="worked">
          <li><strong>Momento analizado: alrededor de 09:15.</strong> Notebookcheck indica que a partir de ese minuto el video muestra el mecanismo que regula el gatillo ${cite('notebookcheck-ds')}. Ahí se ve la cadena física: un motor, una espiral y un engranaje ligados al gatillo.</li>
          <li><strong>Qué ocurre físicamente.</strong> El motor, a través del engranaje y la espiral, aplica una fuerza (o par) al gatillo que se opone al movimiento del dedo. Con el motor apagado, el gatillo se siente como uno normal; con el motor activo, ofrece resistencia ${cite('notebookcheck-ds')}. El video enseña la causa mecánica; el efecto sentido (la cuerda que se tensa) lo describen las reseñas ${cite('tomsguide-ds')}, porque una persona que mira no puede percibir la fuerza.</li>
          <li><strong>Relación con una ecuación.</strong> Mientras el usuario presiona el gatillo desde el reposo, la resistencia que siente puede describirse por ${ie('F=-kx')}: cuanto más profundo (mayor ${ie('x')}), más fuerza restauradora. En el efecto del arco, ${ie('k')} es la «dureza de la cuerda». La curva del laboratorio de abajo es exactamente ese perfil.</li>
          <li><strong>Papel del software.</strong> El software decide el perfil de fuerza para cada situación del juego (qué arma, qué coche) y lo traduce en órdenes al motor; el hardware solo ejecuta ${cite('notebookcheck-ds')}. Cómo se codifica exactamente cada efecto en el mando no se verificó en una documentación pública, y aquí se trata como un modelo (ver la clasificación de afirmaciones).</li>
          <li><strong>Real vs. simulado.</strong> Un resorte real es pasivo: la fuerza existe sin energía externa, es conservativa y su ${ie('k')} lo fija la geometría del metal. El resorte virtual es activo: requiere sensor, controlador y motor, puede tener cualquier perfil (no lineal, con topes, con vibración), tiene una fuerza máxima y una frecuencia de actualización limitadas, y no almacena energía elástica sino que la «representa» consumiendo corriente.</li>
        </ol>
        <p class="hint">El minuto aproximado proviene de la reseña citada (Brecher, 2020).</p>
      </div>

      <div class="tblock">
        <h3>Curva fuerza–desplazamiento: el resorte virtual</h3>
        <div class="callout supuesto"><strong>Escala ilustrativa</strong><p>Los valores de k, x₀, F_max y el recorrido del gatillo son <strong>parámetros de ejemplo</strong>; no son las especificaciones del DualSense, que no se verificaron. Lo que muestra el laboratorio es la forma de la relación F(x).</p></div>
        <div class="lab">
          <div class="lab-head"><h4>Resorte virtual con zona muerta y saturación</h4><span class="badge">F = −k·(x − x₀), limitada a F_max</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                ${slider({ id: 't5-x', label: 'Desplazamiento del gatillo x', min: 0, max: 12, step: 0.1, value: 5, unit: 'mm', dec: 1 })}
                ${slider({ id: 't5-k', label: 'Constante elástica k', min: 0.1, max: 3, step: 0.05, value: 0.8, unit: 'N/mm', dec: 2 })}
                ${slider({ id: 't5-x0', label: 'Punto de contacto x₀', min: 0, max: 6, step: 0.1, value: 1, unit: 'mm', dec: 1 })}
                ${slider({ id: 't5-fm', label: 'Fuerza máxima del actuador F_max', min: 1, max: 12, step: 0.5, value: 6, unit: 'N', dec: 1 })}
                <p class="status" id="t5-status" role="status"></p>
              </div>
              <div class="chart-stack">
                <div class="chart-wrap tall"><canvas id="t5-chart"></canvas></div>
                <div class="readouts">
                  ${readout({ id: 't5-o-f', label: 'Fuerza del resorte virtual |F|', unit: 'N', color: 'force', big: true })}
                  ${readout({ id: 't5-o-fd', label: 'Fuerza sobre el dedo (con signo)', unit: 'N', color: 'acc' })}
                  ${readout({ id: 't5-o-id', label: 'Hooke ideal k·x (sin x₀ ni tope)', unit: 'N', color: 'pos' })}
                  ${readout({ id: 't5-o-w', label: 'Trabajo hecho por el dedo (área bajo la curva)', unit: 'mJ', color: 'vel' })}
                </div>
              </div>
            </div>
            <figure class="figure">
              <svg viewBox="0 0 640 270" role="img" aria-labelledby="t5-d-t t5-d-d">
                <title id="t5-d-t">Fuerzas sobre el gatillo y par acción-reacción</title>
                <desc id="t5-d-d">Un dedo empuja un gatillo hacia la derecha; el motor lo empuja hacia la izquierda con la fuerza del resorte virtual. Abajo, el par acción-reacción entre dedo y gatillo.</desc>
                <text x="16" y="24" class="svg-label" font-weight="600">Diagrama de fuerzas (el desplazamiento y las fuerzas se actualizan con los controles)</text>
                <line x1="90" y1="120" x2="90" y2="60" stroke="var(--axis)" stroke-dasharray="4 4"/><text x="40" y="52" class="svg-small">x = 0</text>
                <rect x="60" y="150" width="520" height="8" rx="4" fill="var(--panel-2)" stroke="var(--line)"/>
                <g id="t5-trig"><rect x="90" y="78" width="70" height="50" rx="10" fill="var(--panel-2)" stroke="var(--text)" stroke-width="2"/><text x="102" y="108" class="svg-label">gatillo</text>
                  <line id="t5-a-finger" x1="82" y1="103" x2="40" y2="103" stroke="var(--c-vel)" stroke-width="3.5"/><polygon id="t5-ah-finger" points="90,103 80,98 80,108" fill="var(--c-vel)"/>
                  <line id="t5-a-motor" x1="160" y1="103" x2="200" y2="103" stroke="var(--c-force)" stroke-width="3.5"/><polygon id="t5-ah-motor" points="160,103 170,98 170,108" fill="var(--c-force)"/>
                </g>
                <text x="16" y="180" class="svg-small" fill="var(--c-vel)">F del dedo sobre el gatillo (→ +x)</text>
                <text x="330" y="180" class="svg-small" fill="var(--c-force)">F del motor (resorte virtual) sobre el gatillo (← −x)</text>
                <text x="16" y="204" class="svg-small">Equilibrio: las dos actúan sobre el MISMO cuerpo y se cancelan (1.ª ley). No es un par de la 3.ª ley.</text>
                <text x="16" y="236" class="svg-small" fill="var(--c-vel)">3.ª ley: dedo → gatillo  ⟷  gatillo → dedo (cuerpos distintos, siempre iguales y opuestas)</text>
                <text x="16" y="256" class="svg-small" id="t5-dtext">|F| = — N</text>
              </svg>
              <figcaption>Figura. El gatillo en equilibrio: la fuerza del dedo y la del motor son iguales y opuestas sobre el gatillo. El par acción–reacción de la tercera ley es otro: dedo sobre gatillo y gatillo sobre dedo.</figcaption>
            </figure>
          </div>
        </div>
      </div>

      <div class="tblock">
        <h3>Interpretación de los resultados</h3>
        <ul>
          <li><strong>Recta con origen desplazado:</strong> la pendiente de la parte lineal es k: cada milímetro extra cuesta k newtons más. Si la curva es una recta, la sensación es la de un resorte; si se curva o se aplana, la de otro objeto (cuerda que se rinde, tope).</li>
          <li><strong>Zona muerta:</strong> antes de x₀ el gatillo se mueve sin resistencia, como el «aire» antes de que la cuerda se tense.</li>
          <li><strong>Saturación:</strong> cuando k·(x − x₀) supera F_max, el motor ya no puede dar más y la curva se aplana: el «resorte» se vuelve un tope blando. Un resorte real no tendría ese límite.</li>
          <li><strong>Trabajo:</strong> el área bajo la curva es la energía que el dedo entrega. En un resorte real queda almacenada y se devuelve; en uno virtual, el motor gestiona esa energía con electrónica.</li>
        </ul>
      </div>

      <div class="tblock">
        <h3>Limitaciones, supuestos y clasificación de afirmaciones</h3>
        <ul class="claims">
          <li>${tag('hecho')}<span>Los gatillos adaptativos del DualSense varían su resistencia por software con un motor, una espiral y un engranaje ${cite('notebookcheck-ds')}; el efecto de tensado de un arco se describe en reseñas ${cite('tomsguide-ds')}.</span></li>
          <li>${tag('calculo')}<span>Fuerzas, trabajo y la curva del laboratorio salen de las ecuaciones con los parámetros elegidos.</span></li>
          <li>${tag('supuesto')}<span>Movimiento unidimensional, sin masa del gatillo, sin fricción ni amortiguamiento, sin retardo del lazo de control; x medido desde el gatillo suelto.</span></li>
          <li>${tag('hipotesis')}<span>Que el perfil del arco sea exactamente lineal (puede ser cualquier curva programada); que el sistema cierre un lazo de control con un sensor de posición; los valores k, x₀ y F_max del ejemplo. No se verificó una especificación pública.</span></li>
        </ul>
      </div>

      ${Portfolio.connections([
        { to: 'tema-4', text: 'F = μN y F = −kx son modelos lineales que valen en un rango y se saturan o cambian de forma fuera de él: la zona muerta y el tope aquí son el equivalente al límite de agarre allí.' },
        { to: 'tema-2', text: 'Un motor de juego integra paso a paso las fuerzas, incluida la elástica; el salto es el caso de fuerza constante y el resorte, el de fuerza dependiente de la posición.' },
        { to: 'tema-3', text: 'En el hábitat, la fuerza normal del piso ' + ie('N=m\\,a_c') + ' es la que se percibe como peso; en el gatillo, la fuerza del motor es la que se percibe como resistencia. En ambos se «siente» una fuerza de contacto.' },
      ])}
      ${Portfolio.sources(['notebookcheck-ds', 'tronicsfix', 'tomsguide-ds', 'openstax'])}
      `;
    },

    init(el) {
      const $ = (id) => el.querySelector('#t5-' + id);
      const val = (id) => parseFloat($(id).value);
      const chart = new LineChart($('chart'), { title: 'Fuerza en función del desplazamiento del gatillo', xLabel: 'Desplazamiento x', xUnit: 'mm', yLabel: 'Fuerza |F|', yUnit: 'N', xMin: 0, xMax: 12, yMin: 0, decimalsTooltip: 2 });

      function update() {
        const p = { k: val('k'), x0: val('x0'), fMax: val('fm') }, x = val('x');
        const xs = P.linspace(0, 12, 241);
        const virt = xs.map((v) => P.virtualSpringForce(v, p)), ideal = xs.map((v) => p.k * v);
        const F = P.virtualSpringForce(x, p);
        chart.update({
          yMax: Math.max(p.fMax * 1.2, 4), cursorX: x,
          series: [
            { name: 'Resorte virtual', color: UI.cssVar('--c-force', '#b7a1ff'), x: xs, y: virt },
            { name: 'Hooke ideal F = kx', color: '#a4b3cf', dashed: true, width: 1.5, x: xs, y: ideal },
          ],
        });
        $('o-f').textContent = fmt(F, 2); $('o-fd').textContent = fmt(-F, 2);
        $('o-id').textContent = fmt(p.k * x, 2); $('o-w').textContent = fmt(workMilliJoule(x, p), 1);
        const sat = x > p.x0 && p.k * (x - p.x0) >= p.fMax;
        $('status').className = 'status' + (sat ? ' warn' : '');
        $('status').textContent = x <= p.x0 ? 'Antes del punto de contacto: el gatillo se mueve libre (F = 0).' : sat ? 'El actuador saturó en F_max: el resorte virtual ya no sigue a Hooke.' : 'Zona lineal: F = k (x − x₀).';
        // esquema de fuerzas
        const dx = Math.min(x, 12) * 14, trig = $('trig');
        trig.setAttribute('transform', `translate(${dx.toFixed(1)} 0)`);
        const len = Math.min(70, 8 + F * 9);
        const f = (n) => n.toFixed(1);
        $('a-finger').setAttribute('x1', f(82)); $('a-finger').setAttribute('x2', f(82 - len));
        $('ah-finger').setAttribute('points', `90,103 80,98 80,108`);
        $('a-motor').setAttribute('x2', f(160 + len));
        $('dtext').textContent = `|F| = ${fmt(F, 2)} N  ·  x = ${fmt(x, 1)} mm`;
      }
      UI.bindSliders(el, update);
      update();
    },
  };

  Portfolio.register(T);
})();
