/* ==========================================================================
   Tema 8 — Ruedas de reacción: cómo un satélite se gira sin empujarse contra nada
   Recurso prescrito: DIAGRAMA (esquemas originales en SVG, dibujados por código)
   Diagrama 1: satélite y rueda con el intercambio de momento angular (animado).
   Diagrama 2: acumulación de momento hasta la saturación y desaturación.
   ========================================================================== */
(function () {
  'use strict';
  const tex = String.raw;
  const { eq, ie, tag, varTable, tradeoff, slider, readout, fmt } = UI;
  const { cite } = Portfolio;
  const P = Physics;

  // Microsatélite ILUSTRATIVO (supuesto declarado en el texto)
  const IS = 12, IW = 0.0012, RPM_MAX = 6000, TAU = 0.02;

  const arrow = (x, y, dx, dy, col, w = 3) => {
    const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, ex = x + dx, ey = y + dy, hx = ex - ux * 11, hy = ey - uy * 11;
    return `<line x1="${x}" y1="${y}" x2="${hx}" y2="${hy}" stroke="${col}" stroke-width="${w}"/><polygon points="${ex},${ey} ${hx - uy * 5.5},${hy + ux * 5.5} ${hx + uy * 5.5},${hy - ux * 5.5}" fill="${col}"/>`;
  };
  /** Arco con punta de flecha (sentido: +1 antihorario en pantalla). */
  function arcArrow(cx, cy, r, a0, a1, col, w = 2.6) {
    const pts = []; const n = 40;
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy - r * Math.sin(a)).toFixed(1)}`); }
    const a = a1, d = Math.sign(a1 - a0), ex = cx + r * Math.cos(a), ey = cy - r * Math.sin(a);
    const tx = -Math.sin(a) * d, ty = -Math.cos(a) * d; // tangente en pantalla
    const hx = ex - tx * 10, hy = ey - ty * 10, nx = -ty, ny = tx;
    return `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="${w}"/>
      <polygon points="${ex.toFixed(1)},${ey.toFixed(1)} ${(hx + nx * 5.5).toFixed(1)},${(hy + ny * 5.5).toFixed(1)} ${(hx - nx * 5.5).toFixed(1)},${(hy - ny * 5.5).toFixed(1)}" fill="${col}"/>`;
  }

  function mainDiagram() {
    const cx = 230, cy = 250;
    return `<svg viewBox="0 0 680 640" role="img" aria-labelledby="t8-d1-t t8-d1-d">
      <title id="t8-d1-t">Satélite con rueda de reacción: intercambio de momento angular</title>
      <desc id="t8-d1-d">Vista frontal de un satélite con una rueda de reacción en su centro, ambos girando alrededor del mismo eje perpendicular a la página. El motor aplica un torque a la rueda y la rueda aplica un torque igual y opuesto al cuerpo; el momento angular de la rueda y el del cuerpo son iguales y opuestos y su suma no cambia.</desc>
      <text x="20" y="30" class="svg-label" font-weight="600">Vista frontal: el eje de giro sale de la página (⊙)</text>
      <g id="t8-body" style="transform-origin:${cx}px ${cy}px">
        <rect x="${cx - 250}" y="${cy - 28}" width="120" height="56" rx="4" fill="rgba(51,163,191,0.18)" stroke="var(--c-pos)" stroke-width="1.6"/>
        <rect x="${cx + 130}" y="${cy - 28}" width="120" height="56" rx="4" fill="rgba(51,163,191,0.18)" stroke="var(--c-pos)" stroke-width="1.6"/>
        ${[0, 1, 2].map((k) => `<line x1="${cx - 250 + 40 * (k + 1)}" y1="${cy - 28}" x2="${cx - 250 + 40 * (k + 1)}" y2="${cy + 28}" stroke="var(--c-pos)" stroke-width="0.8" opacity="0.6"/><line x1="${cx + 130 + 40 * (k + 1)}" y1="${cy - 28}" x2="${cx + 130 + 40 * (k + 1)}" y2="${cy + 28}" stroke="var(--c-pos)" stroke-width="0.8" opacity="0.6"/>`).join('')}
        <line x1="${cx - 130}" y1="${cy}" x2="${cx - 95}" y2="${cy}" stroke="var(--axis)" stroke-width="3"/><line x1="${cx + 95}" y1="${cy}" x2="${cx + 130}" y2="${cy}" stroke="var(--axis)" stroke-width="3"/>
        <rect x="${cx - 95}" y="${cy - 95}" width="190" height="190" rx="14" fill="var(--panel-2)" stroke="var(--text)" stroke-width="2"/>
        <path d="M ${cx - 30} ${cy - 95} L ${cx - 20} ${cy - 125} L ${cx + 20} ${cy - 125} L ${cx + 30} ${cy - 95}" fill="none" stroke="var(--text)" stroke-width="1.6"/>
        <text x="${cx}" y="${cy - 104}" class="svg-small" text-anchor="middle">antena</text>
      </g>
      <g id="t8-wheel" style="transform-origin:${cx}px ${cy}px">
        <circle cx="${cx}" cy="${cy}" r="56" fill="rgba(192,136,1,0.14)" stroke="var(--c-vel)" stroke-width="3"/>
        ${[0, 60, 120, 180, 240, 300].map((a) => { const r = (a * Math.PI) / 180; return `<line x1="${cx}" y1="${cy}" x2="${(cx + 52 * Math.cos(r)).toFixed(1)}" y2="${(cy - 52 * Math.sin(r)).toFixed(1)}" stroke="var(--c-vel)" stroke-width="1.4"/>`; }).join('')}
        <circle cx="${cx + 44}" cy="${cy}" r="6" fill="var(--c-vel)"/>
      </g>
      <circle cx="${cx}" cy="${cy}" r="9" fill="var(--bg)" stroke="var(--text)" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3" fill="var(--text)"/>
      ${arcArrow(cx, cy, 76, -0.6, 2.2, 'var(--c-vel)')}
      <text x="${cx + 52}" y="${cy - 70}" class="svg-label" fill="var(--c-vel)">ω_w (rueda)</text>
      ${arcArrow(cx, cy, 140, 2.7, 1.2, 'var(--c-pos)')}
      <text x="${cx - 160}" y="${cy - 128}" class="svg-label" fill="var(--c-pos)">ω_s (satélite)</text>
      <!-- par de torques acción-reacción -->
      ${arrow(cx - 30, cy + 70, 46, 0, 'var(--c-force)', 2.6)}
      <text x="${cx - 36}" y="${cy + 90}" class="svg-small" fill="var(--c-force)">τ sobre la rueda</text>
      ${arrow(cx + 40, cy + 112, -46, 0, 'var(--c-acc)', 2.6)}
      <text x="${cx - 40}" y="${cy + 132}" class="svg-small" fill="var(--c-acc)">−τ sobre el cuerpo</text>
      <text x="40" y="${cy + 166}" class="svg-small">El motor está fijo al cuerpo: empuja la rueda</text>
      <text x="40" y="${cy + 184}" class="svg-small">y la rueda lo empuja a él (3.ª ley de Newton).</text>
      <!-- vectores de momento angular (fuera de la página = arriba en este esquema) -->
      <g transform="translate(486 70)">
        <text x="-6" y="0" class="svg-label" font-weight="600">Momento angular</text>
        <text x="-6" y="18" class="svg-small">(componente sobre el eje)</text>
        <line x1="-6" y1="180" x2="156" y2="180" stroke="var(--axis)"/>
        <rect id="t8-bar-w" x="0" y="180" width="34" height="0" fill="var(--c-vel)" rx="3"/>
        <rect id="t8-bar-s" x="58" y="180" width="34" height="0" fill="var(--c-pos)" rx="3"/>
        <rect id="t8-bar-t" x="116" y="180" width="34" height="0" fill="var(--c-result)" rx="3"/>
        <text x="17" y="350" class="svg-small" text-anchor="middle">L_w</text>
        <text x="75" y="350" class="svg-small" text-anchor="middle">L_s</text>
        <text x="133" y="350" class="svg-small" text-anchor="middle">total</text>
        <text id="t8-lab-w" x="17" y="368" class="svg-small" text-anchor="middle" fill="var(--c-vel)">0</text>
        <text id="t8-lab-s" x="75" y="368" class="svg-small" text-anchor="middle" fill="var(--c-pos)">0</text>
        <text id="t8-lab-t" x="133" y="368" class="svg-small" text-anchor="middle" fill="var(--c-result)">0</text>
        <text x="-6" y="386" class="svg-small">en N·m·s</text>
      </g>
      <!-- ecuaciones anotadas sobre el dibujo -->
      <rect x="20" y="460" width="640" height="164" rx="10" fill="var(--panel)" stroke="var(--line)"/>
      <text x="36" y="490" class="svg-eq" fill="var(--c-result)">L = I_s ω_s + I_w ω_w = constante   (sin torque externo)</text>
      <text x="36" y="516" class="svg-eq" fill="var(--c-force)">τ_rueda = I_w α_w = −τ_cuerpo  ⇒  I_s α_s = −I_w α_w</text>
      <text x="36" y="542" class="svg-eq" fill="var(--c-pos)">ω_s = −(I_w / I_s) · ω_w     (si todo parte del reposo)</text>
      <text x="36" y="568" class="svg-eq" fill="var(--c-acc)">saturación: |ω_w| = ω_máx  ⇒  |L_w| = I_w ω_máx = h_máx</text>
      <text x="36" y="598" class="svg-small" id="t8-live1">ω_w = — rpm · ω_s = — °/s</text>
      <text x="36" y="614" class="svg-small" id="t8-live2">I_s = ${fmt(IS, 0)} kg·m² · I_w = ${fmt(IW, 4)} kg·m² (microsatélite ilustrativo)</text>
    </svg>`;
  }

  function saturationDiagram() {
    // Esquema (no a escala) de h_rueda(t) bajo un torque externo constante.
    const x0 = 70, x1 = 620, yMid = 200, hMax = 120;
    const X = (u) => x0 + (x1 - x0) * u, Y = (h) => yMid - h;
    const path = `M ${X(0)} ${Y(0)} L ${X(0.36)} ${Y(hMax)} L ${X(0.46)} ${Y(hMax)} L ${X(0.52)} ${Y(-10)} L ${X(0.86)} ${Y(hMax - 20)} L ${X(1)} ${Y(hMax - 20)}`;
    return `<svg viewBox="0 0 680 470" role="img" aria-labelledby="t8-d2-t t8-d2-d">
      <title id="t8-d2-t">Saturación y desaturación de la rueda</title>
      <desc id="t8-d2-d">Esquema del momento angular almacenado en la rueda en función del tiempo bajo un torque externo constante: crece linealmente hasta el límite de saturación, se mantiene, y un torque externo de desaturación lo devuelve cerca de cero.</desc>
      <text x="20" y="30" class="svg-label" font-weight="600">Qué pasa cuando la rueda llega a su velocidad máxima (esquema, no a escala)</text>
      <line x1="${x0}" y1="${Y(-60)}" x2="${x0}" y2="${Y(hMax + 40)}" stroke="var(--axis)" stroke-width="1.4"/>
      <line x1="${x0}" y1="${yMid}" x2="${x1}" y2="${yMid}" stroke="var(--axis)" stroke-width="1.4"/>
      <text x="${x0 - 8}" y="${Y(hMax + 46)}" class="svg-small" text-anchor="start">h_rueda = I_w ω_w</text>
      <text x="${x1}" y="${yMid + 18}" class="svg-small" text-anchor="end">tiempo</text>
      <line x1="${x0}" y1="${Y(hMax)}" x2="${x1}" y2="${Y(hMax)}" stroke="var(--c-acc)" stroke-dasharray="6 5" stroke-width="1.4"/>
      <text x="${x1}" y="${Y(hMax) - 8}" class="svg-small" text-anchor="end" fill="var(--c-acc)">h_máx = I_w ω_máx (saturación)</text>
      <rect x="${X(0.36)}" y="${Y(hMax + 30)}" width="${X(0.46) - X(0.36)}" height="${hMax + 90}" fill="rgba(227,101,116,0.12)"/>
      <rect x="${X(0.46)}" y="${Y(hMax + 30)}" width="${X(0.52) - X(0.46)}" height="${hMax + 90}" fill="rgba(73,169,128,0.14)"/>
      <path d="${path}" fill="none" stroke="var(--c-vel)" stroke-width="3" stroke-linejoin="round"/>
      <text x="${X(0.06)}" y="${Y(56)}" class="svg-small" fill="var(--c-vel)" transform="rotate(-30 ${X(0.06)} ${Y(56)})">pendiente = τ_perturbación</text>
      <text x="${X(0.41)}" y="${Y(-26)}" class="svg-small" text-anchor="middle" fill="var(--c-acc)">saturada:</text>
      <text x="${X(0.41)}" y="${Y(-42)}" class="svg-small" text-anchor="middle" fill="var(--c-acc)">sin control</text>
      <text x="${X(0.49)}" y="${Y(-58)}" class="svg-small" text-anchor="middle" fill="var(--c-result)">desaturación</text>
      ${arrow(X(0.49), Y(hMax + 22), 0, 34, 'var(--c-result)', 2.4)}
      <text x="${X(0.53)}" y="${Y(hMax + 34)}" class="svg-small" fill="var(--c-result)">τ_externo (magnetorques o propulsores)</text>
      <rect x="20" y="300" width="640" height="150" rx="10" fill="var(--panel)" stroke="var(--line)"/>
      <text x="36" y="328" class="svg-eq" fill="var(--c-vel)">dh_rueda/dt = τ_perturbación   (la rueda absorbe el torque externo)</text>
      <text x="36" y="354" class="svg-eq" fill="var(--c-acc)">en saturación: α_w = 0  ⇒  τ_cuerpo = 0  ⇒  se pierde el control</text>
      <text x="36" y="380" class="svg-eq" fill="var(--c-result)">desaturar: Δh = ∫ τ_externo dt   (sale momento del sistema)</text>
      <text x="36" y="410" class="svg-small">Las ruedas solo intercambian momento con el cuerpo; nunca pueden sacarlo del satélite.</text>
      <text x="36" y="428" class="svg-small">Para «vaciar» la rueda hace falta un torque EXTERNO: el campo magnético terrestre o un propulsor.</text>
    </svg>`;
  }

  const T = {
    id: 'tema-8', number: 8, accent: 'force', avance: 'Avance 2',
    title: 'Ruedas de reacción: cómo un satélite se gira sin empujarse contra nada',
    resource: 'Diagrama',
    concepts: ['Conservación del momento angular', 'Torque', 'Tercera ley de Newton en rotación'],
    summary: 'Hacer girar una rueda dentro del satélite lo hace girar a él en sentido contrario. Y cuando la rueda ya no puede girar más rápido, el satélite pierde el control.',

    html() {
      const sl = P.slewTime(Math.PI / 2, IS, TAU);
      const rpmPeak = P.omegaToRpm(sl.hPeak / IW);
      return String.raw`
      ${Portfolio.head(T)}

      <div class="tblock">
        <h3>Introducción al problema</h3>
        <p>Un telescopio espacial tiene que apuntar a una estrella durante horas con una precisión enorme y, cuando termina, girar hacia otra. En el vacío no hay nada contra qué empujar, y gastar combustible en cada giro acabaría la misión en pocos años. La pregunta es: <strong>¿cómo cambia su orientación un satélite sin expulsar masa y sin apoyarse en nada?</strong> La respuesta es una rueda que gira dentro de él.</p>
      </div>

      <div class="tblock">
        <h3>Caso de uso en ingeniería del software</h3>
        <p><strong>Industria:</strong> aeroespacial. <strong>Sistema:</strong> el software de control de actitud (ADCS) de satélites como el telescopio Hubble y la misión Kepler, que en cada ciclo calcula el torque que debe dar cada rueda para llevar el satélite a la orientación pedida.</p>
        <p>${tag('hecho')} El Hubble no usa propulsores para apuntar: su sistema de control de apuntamiento usa ruedas de reacción; al hacer girar las ruedas en un sentido, el telescopio gira en el sentido contrario ${cite('nasa-hubble-pointing')}. ${tag('hecho')} El telescopio Kepler tenía cuatro ruedas y necesitaba tres para apuntar con precisión; tras la falla de una segunda rueda en 2013 la misión original terminó, y la misión K2 usó la presión de la radiación solar como «tercera rueda» para estabilizarse ${cite('nasa-k2')}.</p>
        <p>El software modela la física: con la conservación del momento angular sabe qué velocidad debe ordenar a cada rueda para conseguir un giro, vigila cuánto momento acumulan las ruedas y planifica cuándo descargarlas con torques externos antes de que se saturen ${cite('markley')}.</p>
      </div>

      <div class="tblock">
        <h3>Concepto físico y ecuaciones</h3>
        <p>Si sobre un sistema no actúa ningún torque externo, su <strong>momento angular total se conserva</strong> ${cite('openstax')}. El satélite (cuerpo) y la rueda forman ese sistema: lo que gana uno lo pierde el otro.</p>
        ${eq(tex`\vec L=I_s\,\vec\omega_s+I_w\,\vec\omega_w=\text{constante}\qquad\Longrightarrow\qquad \omega_s=-\frac{I_w}{I_s}\,\omega_w\;\;(\text{si } L=0)`, 'Conservación del momento angular en un eje.')}
        ${eq(tex`\tau=I\,\alpha\qquad \tau_{\text{rueda}}=I_w\,\alpha_w=-\tau_{\text{cuerpo}}=-I_s\,\alpha_s`, 'Segunda ley de Newton para la rotación y su par acción-reacción: el motor está montado en el cuerpo.')}
        ${eq(tex`\frac{d\vec L}{dt}=\vec\tau_{\text{ext}}\qquad h_{\max}=I_w\,\omega_{w,\max}`, 'Solo un torque externo cambia el momento total. La rueda puede almacenar como máximo h_max.')}
        ${varTable([
          ['I_s,\\ I_w', 'momentos de inercia del cuerpo y de la rueda respecto al eje', 'kg·m²'],
          ['\\omega_s,\\ \\omega_w', 'velocidades angulares del cuerpo y de la rueda', 'rad/s'],
          ['\\alpha', 'aceleración angular', 'rad/s²'],
          ['\\tau', 'torque', 'N·m'],
          ['L,\\ h', 'momento angular (total y almacenado en la rueda)', 'N·m·s = kg·m²/s'],
        ])}
      </div>

      <div class="tblock">
        <h3>Cómo se usa la física para resolver el problema</h3>
        <p><strong>Caso numérico trabajado.</strong> ${tag('supuesto')} Un microsatélite ilustrativo con ${ie(`I_s=${IS}\\,\\mathrm{kg\\,m^2}`)} y una rueda con ${ie('I_w=0{,}0012\\,\\mathrm{kg\\,m^2}')}, ${ie('\\omega_{w,\\max}=6000\\,\\mathrm{rpm}')} y torque máximo ${ie('\\tau=0{,}02\\,\\mathrm{N\\,m}')} debe girar 90°.</p>
        <ol class="worked">
          <li>Aceleración angular del cuerpo: ${ie(`\\alpha_s=\\tau/I_s=0{,}02/12=${fmt(TAU / IS, 5).replace('.', '{,}').replace(',', '{,}')}\\,\\mathrm{rad/s^2}`)}.</li>
          <li>Se acelera la mitad del ángulo y se frena la otra mitad: ${ie('\\theta/2=\\tfrac12\\alpha_s t_{1/2}^2')} ⇒ ${ie(`t=2\\sqrt{\\theta I_s/\\tau}=${fmt(sl.t, 1).replace(',', '{,}')}\\,\\mathrm{s}`)}.</li>
          <li>Velocidad angular máxima del cuerpo: ${ie(`\\omega_s=\\alpha_s t_{1/2}=${fmt(sl.wPeak, 4).replace(',', '{,}')}\\,\\mathrm{rad/s}`)} (${fmt(sl.wPeak * 180 / Math.PI, 2)} °/s).</li>
          <li>Momento que absorbe la rueda: ${ie(`h=I_s\\omega_s=${fmt(sl.hPeak, 3).replace(',', '{,}')}\\,\\mathrm{N\\,m\\,s}`)}, frente a ${ie(`h_{\\max}=I_w\\omega_{\\max}=${fmt(IW * P.rpmToOmega(RPM_MAX), 3).replace(',', '{,}')}\\,\\mathrm{N\\,m\\,s}`)}. ${tag('calculo')} La rueda llega a ${fmt(rpmPeak, 0)} rpm: la maniobra cabe, con un margen de ${fmt((1 - rpmPeak / RPM_MAX) * 100, 0)} %.</li>
        </ol>
        ${tradeoff(
          `<ul><li>No gasta combustible: la energía viene de los paneles solares, así que se puede reorientar miles de veces.</li><li>El control es fino y continuo: la velocidad de la rueda se ajusta con precisión, sin los pulsos de un propulsor.</li><li>El modelo permite predecir con antelación cuándo habrá que desaturar.</li></ul>`,
          `<ul><li>Las ruedas solo redistribuyen el momento: los torques externos (radiación solar, gravedad, arrastre) se acumulan hasta saturarlas.</li><li>Tienen piezas que se desgastan: los rodamientos fallan, como le pasó a Kepler.</li><li>Hacen falta ruedas en tres ejes (más una de repuesto) y un software que reparta el torque entre ellas.</li></ul>`
        )}
        <p><strong>Frente a la alternativa no física:</strong> una secuencia fija de comandos («girar la rueda a tal velocidad durante tantos segundos») guardada de antemano no corrige perturbaciones ni sabe cuánto momento queda en las ruedas. Sin el balance ${ie('I_s\\omega_s+I_w\\omega_w')} el software no podría anticipar la saturación.</p>
      </div>

      <div class="tblock">
        <h3>Recurso: diagrama</h3>
        <figure class="figure">${mainDiagram()}
          <figcaption>Figura 8.1 (elaboración propia). Rueda de reacción en el centro de un satélite. El motor está fijo al cuerpo: aplica τ a la rueda y recibe −τ. Los momentos angulares de la rueda (L_w) y del cuerpo (L_s) son iguales y opuestos y el total no cambia. Mueva el control para ver el intercambio: el satélite gira en el dibujo (su giro está acelerado ×6 y el de la rueda muy ralentizado, para que ambos se vean).</figcaption>
        </figure>
        <div class="lab">
          <div class="lab-head"><h4>Mueva la rueda y observe el satélite</h4><span class="badge">ω_s = −(I_w/I_s)·ω_w</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                ${slider({ id: 't8-rpm', label: 'Velocidad ordenada a la rueda ω_w', min: -6000, max: 6000, step: 50, value: 3000, unit: 'rpm', dec: 0 })}
                <label class="switch"><input type="checkbox" id="t8-dist"><span>Aplicar perturbación externa (presión solar)</span></label>
                <div class="btns"><button class="btn" id="t8-dump" type="button">Desaturar (torque externo)</button><button class="btn" id="t8-zero" type="button">Rueda a 0</button></div>
                <p class="status" id="t8-status" role="status"></p>
              </div>
              <div class="readouts">
                ${readout({ id: 't8-o-ws', label: 'Giro del satélite ω_s', unit: '°/s', color: 'pos', big: true })}
                ${readout({ id: 't8-o-hw', label: 'Momento en la rueda L_w', unit: 'N·m·s', color: 'vel' })}
                ${readout({ id: 't8-o-hs', label: 'Momento en el cuerpo L_s', unit: 'N·m·s', color: 'pos' })}
                ${readout({ id: 't8-o-sat', label: 'Uso de la capacidad de la rueda', unit: '%', color: 'acc' })}
              </div>
            </div>
          </div>
        </div>
        <figure class="figure">${saturationDiagram()}
          <figcaption>Figura 8.2 (elaboración propia). Una perturbación externa constante se acumula en la rueda hasta su velocidad máxima. Saturada, la rueda ya no puede acelerar, deja de aplicar torque al cuerpo y el satélite queda a merced de la perturbación. La desaturación aplica un torque externo mientras la rueda frena, sacando ese momento del sistema.</figcaption>
        </figure>
        <div class="callout supuesto"><strong>¿Qué ocurre cuando la rueda llega a su velocidad máxima?</strong>
          <p>Para seguir girando el cuerpo en el mismo sentido, la rueda tendría que acelerar más, y no puede: ${ie('\\alpha_w=0\\Rightarrow\\tau_{\\text{cuerpo}}=0')}. Al saturarse se pierde el control en ese eje. Como las ruedas solo intercambian momento con el cuerpo, la única salida es un <strong>torque externo</strong>: magnetorquers que empujan contra el campo magnético terrestre, propulsores o, como en K2, la presión de la radiación solar. Con ese torque aplicado, el software frena la rueda sin que el cuerpo gire (${ie('\\Delta L=\\int\\tau_{\\text{ext}}dt')}). Esta maniobra se llama desaturación o «descarga de momento» ${cite('markley')}.</p></div>
      </div>

      <div class="tblock">
        <h3>Interpretación de los resultados</h3>
        <ul>
          <li><strong>Proporción de inercias:</strong> como ${ie('I_w/I_s=10^{-4}')}, la rueda debe girar diez mil veces más rápido que el cuerpo. Por eso las ruedas giran a miles de rpm para mover el satélite unos pocos grados por segundo.</li>
          <li><strong>Sentidos opuestos:</strong> en el diagrama, la barra de L_w y la de L_s siempre tienen igual tamaño y signo contrario; la barra del total queda en cero mientras no haya perturbación.</li>
          <li><strong>Perturbación:</strong> al activarla aparece un torque externo; para mantener el satélite quieto, la rueda debe absorberlo y su velocidad crece sin parar hasta saturarse, como en la Figura 8.2.</li>
          <li><strong>Lección de Kepler:</strong> perder ruedas quita ejes de control; la solución de K2 fue usar un torque externo natural (la presión solar) en vez de la rueda que faltaba.</li>
        </ul>
      </div>

      <div class="tblock">
        <h3>Limitaciones, supuestos y clasificación de afirmaciones</h3>
        <ul class="claims">
          <li>${tag('hecho')}<span>Uso de ruedas de reacción en el Hubble ${cite('nasa-hubble-pointing')}; fallas de ruedas de Kepler y la solución de K2 ${cite('nasa-k2')}; desaturación con torques externos ${cite('markley')}.</span></li>
          <li>${tag('calculo')}<span>Tiempos, velocidades y momentos del caso trabajado y del control interactivo.</span></li>
          <li>${tag('supuesto')}<span>Un solo eje de giro, cuerpo rígido, rueda alineada con un eje principal y sin fricción en los rodamientos. Los valores de I_s, I_w, ω_max y τ son ilustrativos de un microsatélite, no de un satélite real concreto.</span></li>
          <li>${tag('hipotesis')}<span>Los satélites reales combinan tres o cuatro ruedas en ejes distintos y efectos giroscópicos que este esquema de un eje no representa.</span></li>
        </ul>
      </div>

      ${Portfolio.connections([
        { to: 'tema-3', text: 'El hábitat del Tema 3 usa la rotación para crear «gravedad»; aquí la rotación se usa para orientar. Las dos usan ω, I y el movimiento circular.' },
        { to: 'tema-5', text: 'El motor y la rueda forman un par acción-reacción, como el dedo y el gatillo háptico: la tercera ley de Newton, ahora en rotación.' },
        { to: 'tema-7', text: 'En los choques se conserva el momento lineal; aquí, el angular. Es el mismo principio: sin agentes externos, lo que gana una parte lo pierde la otra.' },
        { to: 'tema-9', text: 'La Voyager usaba propulsores y giroscopios para orientarse; su cambio de velocidad, en cambio, vino de la gravedad de los planetas.' },
      ])}
      ${Portfolio.sources(['nasa-hubble-pointing', 'nasa-k2', 'markley', 'openstax'])}
      `;
    },

    init(el) {
      const $ = (id) => el.querySelector('#t8-' + id);
      const body = $('body'), wheel = $('wheel');
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const hMax = IW * P.rpmToOmega(RPM_MAX);
      const st = { Lext: 0, angS: 0, angW: 0, dist: false };

      function state() {
        // El momento externo acumulado (perturbación) se suma al total; la rueda lo absorbe si puede.
        const rpm = +$('rpm').value;
        const r = P.reactionWheel({ Is: IS, Iw: IW, wheelRpm: rpm });
        return { rpm, ws: r.ws + st.Lext / IS, hw: r.hWheel, hs: r.hBody + st.Lext, L: st.Lext };
      }
      function setBar(id, val, labId) {
        const scale = 140 / hMax, h = Math.min(150, Math.abs(val) * scale), b = $(id);
        b.setAttribute('height', h.toFixed(1)); b.setAttribute('y', val >= 0 ? (180 - h).toFixed(1) : '180');
        $(labId).textContent = fmt(val, 3);
      }
      function update() {
        const s = state();
        $('o-ws').textContent = fmt((s.ws * 180) / Math.PI, 3);
        $('o-hw').textContent = fmt(s.hw, 3); $('o-hs').textContent = fmt(s.hs, 3);
        const use = (Math.abs(s.hw) / hMax) * 100;
        $('o-sat').textContent = fmt(use, 0);
        setBar('bar-w', s.hw, 'lab-w'); setBar('bar-s', s.hs, 'lab-s'); setBar('bar-t', s.hw + s.hs, 'lab-t');
        $('live1').textContent = `ω_w = ${fmt(s.rpm, 0)} rpm · ω_s = ${fmt((s.ws * 180) / Math.PI, 3)} °/s · L_w + L_s = ${fmt(s.hw + s.hs, 3)} N·m·s`;
        const stEl = $('status');
        if (use >= 99.5) { stEl.className = 'status warn'; stEl.textContent = 'Rueda SATURADA: ya no puede acelerar más. Use «Desaturar».'; }
        else if (st.dist) { stEl.className = 'status'; stEl.textContent = 'La perturbación externa se acumula en la rueda para mantener quieto el satélite.'; }
        else { stEl.className = 'status'; stEl.textContent = ''; }
        return s;
      }
      // Perturbación: el torque externo entra al sistema (L total crece) y el control acelera la rueda
      // para absorberlo, de modo que ω_s no cambia. Saturada, la rueda ya no absorbe y el cuerpo empieza a girar.
      const loop = UI.animationLoop((dt) => {
        if (st.dist) {
          const tauD = 0.004; // N·m, exagerado para verlo en segundos
          st.Lext += tauD * dt;
          const next = +$('rpm').value + P.omegaToRpm((tauD * dt) / IW);
          UI.setSlider(el, 't8-rpm', Math.min(RPM_MAX, next));
        }
        const s = update();
        st.angS += ((s.ws * 180) / Math.PI) * dt * 6;           // ×6 para que se perciba (indicado en el texto de la figura)
        st.angW += ((s.rpm * 6) * dt) / 60;                     // la rueda, muy ralentizada para que sea visible
        if (!reduce) { body.style.transform = `rotate(${-st.angS}deg)`; wheel.style.transform = `rotate(${-st.angW}deg)`; }
        return true;
      });
      let visible = true;
      if ('IntersectionObserver' in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) loop.start(); else loop.stop(); }).observe($('body').closest('svg'));
      $('dist').addEventListener('change', () => { st.dist = $('dist').checked; update(); });
      $('dump').addEventListener('click', () => { st.Lext = 0; UI.setSlider(el, 't8-rpm', 0); st.dist = false; $('dist').checked = false; update(); $('status').textContent = 'Desaturada: un torque externo sacó el momento acumulado y la rueda volvió a 0 rpm.'; });
      $('zero').addEventListener('click', () => { UI.setSlider(el, 't8-rpm', 0); update(); });
      UI.bindSliders(el, update);
      update(); if (visible) loop.start();
    },
  };

  Portfolio.register(T);
})();
