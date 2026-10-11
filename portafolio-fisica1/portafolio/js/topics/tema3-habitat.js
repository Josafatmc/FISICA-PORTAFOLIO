/* ==========================================================================
   Tema 3 — Gravedad artificial por rotación en hábitats espaciales
   Recurso prescrito: DIAGRAMA (esquema original en SVG, dibujado por código)
   + caso numérico trabajado + calculadora interactiva.
   ========================================================================== */
(function () {
  'use strict';
  const tex = String.raw;
  const { eq, ie, tag, varTable, tradeoff, readout, numberField, fmt } = UI;
  const { cite } = Portfolio;
  const P = Physics;

  /* ---------- Geometría del diagrama (vista frontal: el eje sale de la página) ---------- */
  function frontDiagram() {
    const cx = 245, cy = 262, Ro = 188, Ri = 138, phi = (35 * Math.PI) / 180;
    const pt = (rad, ang) => [cx + rad * Math.cos(ang), cy - rad * Math.sin(ang)]; // ángulo matemático (antihorario)
    const ur = [Math.cos(phi), -Math.sin(phi)];       // radial hacia afuera (pantalla)
    const ut = [-Math.sin(phi), -Math.cos(phi)];      // tangente en sentido antihorario (pantalla)
    const f = (n) => n.toFixed(1);
    const arrow = (x, y, dx, dy, col, w = 3) => {
      const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, ex = x + dx, ey = y + dy;
      const hx = ex - ux * 11, hy = ey - uy * 11;
      return `<line x1="${f(x)}" y1="${f(y)}" x2="${f(hx)}" y2="${f(hy)}" stroke="${col}" stroke-width="${w}"/>
              <polygon points="${f(ex)},${f(ey)} ${f(hx - uy * 5.5)},${f(hy + ux * 5.5)} ${f(hx + uy * 5.5)},${f(hy - ux * 5.5)}" fill="${col}"/>`;
    };
    // arco de sentido de giro (antihorario) alrededor del eje
    const arcPts = []; for (let a = 25; a <= 300; a += 5) { const [x, y] = pt(46, (a * Math.PI) / 180); arcPts.push(f(x) + ',' + f(y)); }
    const [ax1, ay1] = pt(46, (300 * Math.PI) / 180), [ax0, ay0] = pt(46, (295 * Math.PI) / 180);
    const spokes = [0, 90, 180, 270].map((a) => { const [x1, y1] = pt(16, (a * Math.PI) / 180), [x2, y2] = pt(Ri, (a * Math.PI) / 180); return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="var(--axis)" stroke-width="3"/>`; }).join('');
    const feet = [cx + Ro * ur[0], cy + Ro * ur[1]];
    const body = [cx + (Ro - 22) * ur[0], cy + (Ro - 22) * ur[1]];
    const head = [cx + (Ro - 40) * ur[0], cy + (Ro - 40) * ur[1]];
    const mid = [cx + (Ro / 2) * ur[0], cy + (Ro / 2) * ur[1]];
    const off = (p, k) => [p[0] + ut[0] * k, p[1] + ut[1] * k];
    const tanEnd = [body[0] + ut[0] * 130, body[1] + ut[1] * 130];
    return `<svg viewBox="0 0 640 650" role="img" aria-labelledby="t3-fa-t t3-fa-d">
      <title id="t3-fa-t">Hábitat giratorio en vista frontal</title>
      <desc id="t3-fa-d">Rueda con eje de giro perpendicular a la página, radio r hasta el piso del anillo, sentido de rotación antihorario, velocidad tangencial v y aceleración centrípeta hacia el eje, con las ecuaciones anotadas.</desc>
      <text x="20" y="28" class="svg-label" font-weight="600">Vista frontal (el eje de giro sale de la página)</text>
      <circle cx="${cx}" cy="${cy}" r="${(Ro + Ri) / 2}" fill="none" stroke="rgba(94,200,229,0.12)" stroke-width="${Ro - Ri}"/>
      <circle cx="${cx}" cy="${cy}" r="${Ro}" fill="none" stroke="var(--axis)" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${Ri}" fill="none" stroke="var(--axis)" stroke-width="1.2"/>
      ${spokes}
      <circle cx="${cx}" cy="${cy}" r="16" fill="var(--panel-2)" stroke="var(--text)" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="4.5" fill="var(--text)"/>
      <text x="${cx + 22}" y="${cy + 38}" class="svg-small">eje de giro ⊙</text>
      <polyline points="${arcPts.join(' ')}" fill="none" stroke="var(--c-pos)" stroke-width="2.4"/>
      ${arrow(+ax0, +ay0, +ax1 - +ax0, +ay1 - +ay0 > 0 ? (+ay1 - +ay0) : (+ay1 - +ay0), 'var(--c-pos)', 2.4)}
      <text x="${cx - 120}" y="${cy + 62}" class="svg-label" fill="var(--c-pos)">ω (antihorario)</text>
      <line x1="${cx}" y1="${cy}" x2="${f(feet[0])}" y2="${f(feet[1])}" stroke="var(--text)" stroke-width="1.6" stroke-dasharray="6 5"/>
      <text x="${f(mid[0] - 8)}" y="${f(mid[1] - 10)}" class="svg-label" font-style="italic" fill="var(--text)">r</text>
      <!-- persona (fuera de escala) -->
      <line x1="${f(feet[0])}" y1="${f(feet[1])}" x2="${f(head[0])}" y2="${f(head[1])}" stroke="var(--text)" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${f(head[0] + (head[0] - body[0]) * 0.35)}" cy="${f(head[1] + (head[1] - body[1]) * 0.35)}" r="6" fill="var(--text)"/>
      <!-- trayectoria recta si faltara el piso -->
      <line x1="${f(body[0])}" y1="${f(body[1])}" x2="${f(tanEnd[0])}" y2="${f(tanEnd[1])}" stroke="var(--c-vel)" stroke-width="1.2" stroke-dasharray="3 5" opacity="0.65"/>
      ${arrow(body[0], body[1], ut[0] * 96, ut[1] * 96, 'var(--c-vel)', 3.4)}
      ${arrow(...off(body, 0), -ur[0] * 100, -ur[1] * 100, 'var(--c-acc)', 3.4)}
      ${arrow(...off(feet, -16), -ur[0] * 56, -ur[1] * 56, 'var(--c-force)', 2.6)}
      ${arrow(...off(body, 16), ur[0] * 46, ur[1] * 46, 'var(--axis)', 2)}
      <text x="${f(body[0] + ut[0] * 100 - 20)}" y="${f(body[1] + ut[1] * 100 - 8)}" class="svg-label" fill="var(--c-vel)">v (tangente)</text>
      <text x="${f(body[0] - ur[0] * 100 - 106)}" y="${f(body[1] - ur[1] * 100 - 8)}" class="svg-label" fill="var(--c-acc)">a_c (hacia el eje)</text>
      <text x="${f(feet[0] + 18)}" y="${f(feet[1] + 22)}" class="svg-small" fill="var(--c-force)">N: empuje del piso</text>
      <text x="${f(feet[0] + 18)}" y="${f(feet[1] + 38)}" class="svg-small">«peso»: hacia los pies</text>
      <text x="${f(feet[0] + 18)}" y="${f(feet[1] + 8 - 28)}" class="svg-small">(fuera de escala)</text>
      <!-- ecuaciones anotadas -->
      <rect x="20" y="500" width="600" height="134" rx="10" fill="var(--panel)" stroke="var(--line)"/>
      <text x="36" y="528" class="svg-eq" fill="var(--c-acc)">a_c = v² / r = ω² r</text>
      <text x="36" y="552" class="svg-eq" fill="var(--c-vel)">v = ω r        ω = 2π·rpm / 60</text>
      <text x="36" y="576" class="svg-eq" fill="var(--text)">T = 2π / ω        f = 1 / T</text>
      <text x="36" y="606" class="svg-small" id="t3-da1">r = — m · ω = — rad/s (— rpm)</text>
      <text x="36" y="624" class="svg-small" id="t3-da2">v = — m/s · a_c = — m/s² = — g</text>
    </svg>`;
  }

  function sideDiagram() {
    const top = 70, bot = 290, axisY = 180, x0 = 50, x1 = 470, px = 330;
    const arrow = (x, y, dx, dy, col, w = 3) => {
      const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, ex = x + dx, ey = y + dy, hx = ex - ux * 10, hy = ey - uy * 10;
      return `<line x1="${x}" y1="${y}" x2="${hx}" y2="${hy}" stroke="${col}" stroke-width="${w}"/><polygon points="${ex},${ey} ${hx - uy * 5},${hy + ux * 5} ${hx + uy * 5},${hy - ux * 5}" fill="${col}"/>`;
    };
    return `<svg viewBox="0 0 640 650" role="img" aria-labelledby="t3-fb-t t3-fb-d">
      <title id="t3-fb-t">Hábitat giratorio en vista lateral</title>
      <desc id="t3-fb-d">Vista lateral con el eje de giro en el plano, el radio hasta el piso y un habitante cuyos pies, más lejos del eje, sienten más aceleración centrípeta que su cabeza.</desc>
      <text x="20" y="28" class="svg-label" font-weight="600">Vista lateral (el eje de giro está en el plano)</text>
      <rect x="${x0}" y="${top}" width="${x1 - x0}" height="${bot - top}" rx="14" fill="rgba(94,200,229,0.07)" stroke="var(--axis)" stroke-width="2"/>
      <line x1="${x0 - 30}" y1="${axisY}" x2="${x1 + 30}" y2="${axisY}" stroke="var(--text)" stroke-width="1.6" stroke-dasharray="14 5 3 5"/>
      <text x="${x0 - 28}" y="${axisY - 8}" class="svg-small">eje de giro</text>
      <path d="M ${x1 + 6} ${axisY - 60} A 60 60 0 0 1 ${x1 + 6} ${axisY + 60}" fill="none" stroke="var(--c-pos)" stroke-width="2.4"/>
      ${arrow(x1 + 6, axisY + 60, -4, 6, 'var(--c-pos)', 2.4)}
      <text x="${x1 - 40}" y="${axisY - 74}" class="svg-label" fill="var(--c-pos)">ω</text>
      <!-- radio r -->
      <line x1="150" y1="${axisY}" x2="150" y2="${bot}" stroke="var(--text)" stroke-width="1.6"/>
      <line x1="140" y1="${axisY}" x2="160" y2="${axisY}" stroke="var(--text)"/><line x1="140" y1="${bot}" x2="160" y2="${bot}" stroke="var(--text)"/>
      <text x="162" y="${(axisY + bot) / 2 + 5}" class="svg-label" font-style="italic">r</text>
      <!-- habitante: pies en el piso (r), cabeza hacia el eje (r − h) -->
      <line x1="${px}" y1="${bot}" x2="${px}" y2="${bot - 56}" stroke="var(--text)" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="${px}" cy="${bot - 66}" r="7" fill="var(--text)"/>
      ${arrow(px - 46, bot, 0, -(bot - axisY) * 0.62, 'var(--c-acc)', 3.2)}
      ${arrow(px + 46, bot - 56, 0, -(bot - axisY) * 0.62 * ((bot - axisY - 56) / (bot - axisY)), 'var(--c-acc)', 3.2)}
      <line x1="${px - 70}" y1="${bot}" x2="${px - 70}" y2="${bot - 56}" stroke="var(--c-force)" stroke-width="1.4"/>
      <text x="${px - 138}" y="${bot - 24}" class="svg-small" fill="var(--c-force)">h ≈ 1,8 m</text>
      <text x="${px - 150}" y="${bot + 24}" class="svg-small" fill="var(--c-acc)">a_c(pies) = ω² r</text>
      <text x="${px + 56}" y="${bot - 8}" class="svg-small" fill="var(--c-acc)">a_c(cabeza) = ω² (r − h)</text>
      <text x="${x0 + 6}" y="${bot + 54}" class="svg-small">la flecha de la cabeza es más corta: hay un gradiente de «peso»</text>
      <rect x="20" y="360" width="600" height="274" rx="10" fill="var(--panel)" stroke="var(--line)"/>
      <text x="36" y="390" class="svg-eq" fill="var(--c-acc)">Gradiente: Δa / a_c = h / r</text>
      <text x="36" y="420" class="svg-eq" fill="var(--c-force)">Coriolis (movimiento a rapidez u): a_cor = 2 ω u</text>
      <text x="36" y="450" class="svg-eq" fill="var(--text)">Cociente Coriolis / centrípeta = 2u / (ω r) = 2u / v</text>
      <text x="36" y="486" class="svg-small" id="t3-db1">Con los valores de la calculadora:</text>
      <text x="36" y="508" class="svg-small" id="t3-db2">gradiente (h = 1,8 m): — %</text>
      <text x="36" y="530" class="svg-small" id="t3-db3">a_cor para u = 1 m/s: — m/s² (— % de a_c)</text>
      <text x="36" y="566" class="svg-small">Estas dos correcciones son las que limitan cuánto se puede achicar el radio.</text>
      <text x="36" y="588" class="svg-small">Criterios: Hall (1994), NASA NTRS, Globus y Hall.</text>
    </svg>`;
  }

  /* ---------- Caso numérico trabajado (cifras calculadas con Physics) ---------- */
  function workedCase() {
    const A_rpm = 2, wA = P.rpmToOmega(A_rpm), rA = P.radiusForG(wA, 1), sA = P.spinState(rA, wA);
    const B_r = 100, wB = P.omegaForG(B_r, 1), sB = P.spinState(B_r, wB);
    return { A_rpm, wA, rA, sA, B_r, wB, sB };
  }

  const T = {
    id: 'tema-3', number: 3, accent: 'acc',
    title: 'Gravedad artificial por rotación en hábitats espaciales',
    resource: 'Diagrama',
    concepts: ['Movimiento circular uniforme', 'Aceleración centrípeta', 'Período y frecuencia angular'],
    summary: 'Qué radio y cuántas revoluciones por minuto reproducen 1 g, y qué se siente (y qué no) al vivir en una rueda.',

    html() {
      const w = workedCase();
      return String.raw`
      ${Portfolio.head(T)}

      <div class="tblock">
        <h3>Introducción al problema</h3>
        <p>Una estancia larga en microgravedad deteriora el cuerpo humano. ${tag('hecho')} Un resumen técnico de la NASA señala pérdida ósea, atrofia muscular y desacondicionamiento cardiovascular, y que los ejercicios y otras contramedidas empleadas hasta ahora no lograron evitarlo; propone la rotación del vehículo como alternativa ${cite('ntrs-ag')}. La pregunta de ingeniería es concreta: <strong>¿qué radio y qué velocidad de giro hacen falta para que el suelo empuje a una persona con la misma fuerza que lo hace en la Tierra?</strong></p>
      </div>

      <div class="tblock">
        <h3>Caso de uso en ingeniería del software</h3>
        <p><strong>Industria:</strong> diseño de hábitats y vehículos espaciales. <strong>Sistema concreto:</strong> las herramientas de cálculo y visualización de gravedad artificial de Theodore Hall, entre ellas «SpinCalc», que relaciona radio, velocidad de rotación, nivel de gravedad y gradiente, y compara cada combinación con las «zonas de confort» propuestas por varios autores ${cite('hall-spincalc')}.</p>
        <p>${tag('hecho')} La tesis doctoral de Hall explica por qué el diseño no es libre: la rotación causa incomodidad que impone límites al radio y a la velocidad angular, y el movimiento dentro de un entorno que gira introduce aceleraciones de Coriolis que perjudican la habitabilidad ${cite('hall-1994')}. No existe todavía un hábitat giratorio operativo: es un concepto de ingeniería, y lo que se programa son modelos para explorar su espacio de diseño.</p>
        <p><strong>Por qué modelar la física y no usar valores fijos:</strong> la relación ${ie('a_c=\\omega^2 r')} deja intercambiar radio por velocidad angular, y ese compromiso es el corazón del problema. El resumen de la NASA lo plantea así: aumentar el radio es mucho más caro que aumentar la rotación, así que importa saber la rotación más alta que los humanos toleran ${cite('ntrs-ag')}. Una tabla de «tamaños recomendados» fija no permite evaluar ese compromiso ni responder preguntas como «¿y con 0,38 g, la gravedad marciana?».</p>
      </div>

      <div class="tblock">
        <h3>Concepto físico y ecuaciones</h3>
        <p>Una persona en el piso de una estructura que gira con velocidad angular constante ${ie('\\omega')} describe un movimiento circular uniforme de radio ${ie('r')}. Su rapidez es constante pero su velocidad cambia de dirección, y eso requiere una aceleración dirigida al eje ${cite('openstax')}:</p>
        ${eq(tex`a_c=\frac{v^{2}}{r}=\omega^{2}r \qquad v=\omega r \qquad T=\frac{2\pi}{\omega} \qquad f=\frac{1}{T}=\frac{\omega}{2\pi}`, 'Aceleración centrípeta, rapidez tangencial, período y frecuencia.')}
        ${eq(tex`\omega=\frac{2\pi\,N_{\text{rpm}}}{60} \qquad r_{1g}=\frac{g}{\omega^{2}} \qquad \omega_{1g}=\sqrt{\frac{g}{r}} \qquad g=9{,}80665\ \mathrm{m/s^{2}}`, 'Conversión de rpm y condición de 1 g (g estándar, ' + Portfolio.cite('nist-g') + ').')}
        ${varTable([
          ['r', 'radio de rotación: distancia del eje al piso donde está la persona', 'm'],
          ['\\omega', 'velocidad angular', 'rad/s'],
          ['N_{\\text{rpm}}', 'revoluciones por minuto', 'rpm (1 rpm = 2π/60 rad/s)'],
          ['v', 'rapidez tangencial', 'm/s'],
          ['a_c', 'aceleración centrípeta (dirigida al eje)', 'm/s²'],
          ['T,\\ f', 'período y frecuencia de rotación', 's, Hz'],
          ['g', 'aceleración de la gravedad estándar', 'm/s²'],
        ])}
        <div class="callout calculo"><strong>Aceleración centrípeta vs. gravedad aparente</strong>
          <p>Desde un sistema inercial (fuera del hábitat), nada «empuja hacia afuera»: la persona tendería a seguir recto, tangente a la circunferencia, y el piso la desvía empujándola hacia el eje con una fuerza normal ${ie('N=m\\,a_c')}. Ese empuje del piso es lo que el cuerpo percibe como «peso». Para un habitante que gira con el hábitat, es como si hubiera una gravedad ${ie('g_{ap}=\\omega^2 r')} dirigida hacia el piso, pero es un efecto del sistema de referencia que gira, no una fuerza gravitatoria.</p>
          <p>Por eso la analogía con la gravedad es imperfecta: la «gravedad» depende de la distancia al eje (gradiente cabeza-pies) y los movimientos relativos sufren desviaciones de Coriolis ${cite('hall-1994')}. Dejar caer una pelota no la hace «caer» en línea recta: ella sigue recto en el sistema inercial mientras el piso gira hacia ella.</p></div>
      </div>

      <div class="tblock">
        <h3>Recurso: diagrama original del hábitat</h3>
        <p>Diagrama dibujado por código SVG para este portafolio (no es una imagen descargada). Muestra la estructura, el eje de giro, el radio, el sentido de rotación, la velocidad tangencial, la aceleración centrípeta y las ecuaciones anotadas; el texto inferior de cada panel se actualiza con la calculadora de más abajo.</p>
        <div class="grid-2">
          <figure class="figure">${frontDiagram()}<figcaption>Figura 1. Vista frontal. Amarillo: velocidad tangencial v. Coral: aceleración centrípeta a_c, dirigida al eje. Violeta: fuerza normal N del piso sobre la persona. Gris: sensación de «peso» (hacia los pies). La persona está fuera de escala.</figcaption></figure>
          <figure class="figure">${sideDiagram()}<figcaption>Figura 2. Vista lateral. El eje está en el plano. Los pies están a distancia r del eje y la cabeza a r − h, por lo que la aceleración sentida es menor arriba (flechas coral, longitud exagerada).</figcaption></figure>
        </div>
      </div>

      <div class="tblock">
        <h3>Caso numérico trabajado: ¿qué radio y qué rpm dan 1 g?</h3>
        <p>La condición es ${ie('a_c=g')}, es decir ${ie('\\omega^2 r=g')}. Hay una ecuación y dos incógnitas (${ie('r')} y ${ie('\\omega')}), así que se elige una y se calcula la otra. Dos elecciones:</p>
        <p><strong>Caso A — elegir la rotación: ${w.A_rpm} rpm.</strong></p>
        <ol class="worked">
          <li>${ie(String.raw`\omega=\dfrac{2\pi\,(2)}{60}=${fmt(w.wA, 4)}\ \mathrm{rad/s}`)}</li>
          <li>${ie(String.raw`r=\dfrac{g}{\omega^{2}}=\dfrac{9{,}80665}{(${fmt(w.wA, 4)})^{2}}=${fmt(w.rA, 1)}\ \mathrm{m}`)}</li>
          <li>${ie(String.raw`v=\omega r=${fmt(w.sA.v, 1)}\ \mathrm{m/s}\ (\approx ${fmt(w.sA.v * 3.6, 0)}\ \mathrm{km/h})`)} y ${ie(String.raw`T=\dfrac{2\pi}{\omega}=${fmt(w.sA.T, 1)}\ \mathrm{s}`)}, ${ie(String.raw`f=${fmt(w.sA.f, 4)}\ \mathrm{Hz}`)}.</li>
          <li>Comprobación: ${ie(String.raw`a_c=v^{2}/r=${fmt(w.sA.v ** 2 / w.rA, 3)}\ \mathrm{m/s^{2}}=${fmt(w.sA.aG, 3)}\,g`)}.</li>
        </ol>
        <p><strong>Caso B — elegir el radio: ${w.B_r} m.</strong></p>
        <ol class="worked">
          <li>${ie(String.raw`\omega=\sqrt{g/r}=\sqrt{9{,}80665/${w.B_r}}=${fmt(w.wB, 4)}\ \mathrm{rad/s}`)}</li>
          <li>${ie(String.raw`N_{\text{rpm}}=\dfrac{60\,\omega}{2\pi}=${fmt(P.omegaToRpm(w.wB), 2)}\ \mathrm{rpm}`)}, ${ie(String.raw`v=${fmt(w.sB.v, 1)}\ \mathrm{m/s}`)}, ${ie(String.raw`T=${fmt(w.sB.T, 1)}\ \mathrm{s}`)}.</li>
        </ol>
        <p>${tag('calculo')} Un radio de unos 224 m a 2 rpm, o unos 100 m a unas 3 rpm, producen 1 g.</p>
        <p>${tag('hecho')} Estas cifras concuerdan con las que citan Globus y Hall: 4 rpm corresponden a unos 56 m de radio y 6 rpm a unos 25 m ${cite('globus-hall')}. Y cuánto es «tolerable» no es un número universal: el resumen de la NASA recuerda que estudios tempranos sugerían 3 rpm como límite y que quizá 7,5–10 rpm sean factibles, mientras que Globus y Hall estiman que hasta unas 4 rpm sería aceptable en general y hasta unas 6 rpm para residentes ${cite('ntrs-ag', 'globus-hall')}.</p>
      </div>

      <div class="tblock">
        <h3>Calculadora interactiva</h3>
        <div class="lab">
          <div class="lab-head"><h4>Radio · velocidad angular · aceleración centrípeta · rpm</h4><span class="badge">Elija qué magnitud calcular</span></div>
          <div class="lab-body">
            <div class="lab-split">
              <div class="controls">
                <fieldset><legend>¿Qué desea calcular?</legend>
                  <label><input type="radio" name="t3-mode" value="ac" checked> a_c a partir de r y rpm</label>
                  <label><input type="radio" name="t3-mode" value="rpm"> rpm a partir de r y g objetivo</label>
                  <label><input type="radio" name="t3-mode" value="r"> r a partir de rpm y g objetivo</label>
                </fieldset>
                ${numberField({ id: 't3-r', label: 'Radio r', min: 5, max: 5000, step: 1, value: 224, unit: 'm' })}
                ${numberField({ id: 't3-rpm', label: 'Rotación', min: 0.05, max: 60, step: 0.1, value: 2, unit: 'rpm' })}
                ${numberField({ id: 't3-gt', label: 'Gravedad objetivo', min: 0.01, max: 3, step: 0.01, value: 1, unit: 'g' })}
                <div class="presets" role="group" aria-label="Valores de gravedad objetivo">
                  <button type="button" class="btn" data-gt="1">1 g</button><button type="button" class="btn" data-gt="0.378">Marte 0,38 g</button><button type="button" class="btn" data-gt="0.165">Luna 0,17 g</button>
                </div>
                <p class="status" id="t3-status" role="status"></p>
              </div>
              <div class="readouts">
                ${readout({ id: 't3-o-w', label: 'Velocidad angular ω', unit: 'rad/s', color: 'pos' })}
                ${readout({ id: 't3-o-v', label: 'Rapidez tangencial v', unit: 'm/s', color: 'vel' })}
                ${readout({ id: 't3-o-ac', label: 'Aceleración centrípeta a_c', unit: 'm/s²', color: 'acc' })}
                ${readout({ id: 't3-o-g', label: 'a_c en múltiplos de g', unit: 'g', color: 'acc', big: true })}
                ${readout({ id: 't3-o-T', label: 'Período T', unit: 's', color: 'result' })}
                ${readout({ id: 't3-o-f', label: 'Frecuencia f', unit: 'Hz', color: 'result' })}
                ${readout({ id: 't3-o-rpm', label: 'Rotación', unit: 'rpm', color: 'pos' })}
                ${readout({ id: 't3-o-r', label: 'Radio', unit: 'm', color: 'pos' })}
                ${readout({ id: 't3-o-gr', label: 'Gradiente cabeza-pies (h = 1,8 m)', unit: '%', color: 'force' })}
                ${readout({ id: 't3-o-cor', label: 'Coriolis al moverse a 1 m/s', unit: '% de a_c', color: 'force' })}
              </div>
            </div>
            <div class="chart-wrap tall"><canvas id="t3-chart"></canvas></div>
            <p class="chart-note">Curvas generadas con ${ie('N_{\\text{rpm}}=\\tfrac{60}{2\\pi}\\sqrt{n\\,g/r}')} para tres niveles de gravedad. El punto blanco es la combinación actual. La línea discontinua marca 4 rpm, un valor que Globus y Hall consideran aceptable en general ${cite('globus-hall')}; no es un límite universal.</p>
          </div>
        </div>
      </div>

      <div class="tblock">
        <h3>Interpretación de los resultados</h3>
        <ul>
          <li><strong>El radio manda:</strong> como ${ie('N_{\\text{rpm}}\\propto 1/\\sqrt r')}, reducir a la cuarta parte el radio obliga a duplicar la rotación. De ahí que los hábitats «cómodos» sean grandes.</li>
          <li><strong>Gradiente:</strong> con ${ie('r=224\\,\\mathrm{m}')} la diferencia entre pies y cabeza de una persona de 1,8 m es solo de aproximadamente 0,8 %; con ${ie('r=25\\,\\mathrm{m}')} sube a algo más de 7 %. Un radio pequeño hace que la «gravedad» cambie de forma notable con la postura.</li>
          <li><strong>Coriolis:</strong> al desplazarse a rapidez ${ie('u')}, aparece una aceleración aparente ${ie('2\\omega u')}; su fracción respecto a ${ie('a_c')} es ${ie('2u/v')}. A mayor rotación (menor radio), más se desvía lo que se lanza o se camina, que es una de las razones del límite de confort ${cite('hall-1994')}.</li>
          <li><strong>Gravedad parcial:</strong> para 0,38 g (valor lunar/marciano de referencia ${cite('nasa-factsheet')}) basta con menos rotación o con menos radio, lo que conecta con la gravedad ajustable del Tema 2.</li>
        </ul>
      </div>

      <div class="tblock">
        <h3>Limitaciones, supuestos y clasificación de afirmaciones</h3>
        <ul class="claims">
          <li>${tag('hecho')}<span>La microgravedad prolongada causa efectos fisiológicos adversos ${cite('ntrs-ag')}; la rotación impone límites de radio y velocidad angular y genera Coriolis ${cite('hall-1994')}.</span></li>
          <li>${tag('calculo')}<span>Todas las cifras de los casos A y B y de la calculadora.</span></li>
          <li>${tag('supuesto')}<span>Rotación uniforme (ω constante) alrededor de un eje fijo, hábitat rígido y simétrico, persona como punto a distancia r del eje, g estándar 9,80665 m/s².</span></li>
          <li>${tag('hipotesis')}<span>Los valores de confort (2–6 rpm, etc.) varían entre autores y siguen en discusión; el diagrama y la calculadora no los validan.</span></li>
        </ul>
        <div class="callout supuesto"><strong>Lo que NO cubre este cálculo (ingeniería de un hábitat real)</strong>
          <p>Resistencia estructural del casco bajo presión y rotación, blindaje contra radiación, acoplamiento en el eje donde no hay gravedad, estabilidad dinámica del giro ante cambios de masa, consumo de propelente para ponerlo en rotación, y adaptación humana a largo plazo. Son consideraciones de ingeniería que van más allá de ${ie('a_c=\\omega^2r')}.</p></div>
      </div>

      ${Portfolio.connections([
        { to: 'tema-1', text: 'Una curva del dron es, en cada instante, un arco de círculo: su aceleración normal ' + ie('v^2/\\rho') + ' es esta misma aceleración centrípeta.' },
        { to: 'tema-2', text: 'La gravedad «de juego» se elige; aquí la «gravedad» se fabrica con ' + ie('\\omega^2 r') + '. En ambos casos el diseñador escoge el valor de g que quiere experimentar.' },
        { to: 'tema-4', text: 'En una curva, el coche necesita una fuerza centrípeta que pone la fricción: ' + ie('\\mu m g\\ge m v^2/r') + ', es decir ' + ie('v_{\\max}=\\sqrt{\\mu g r}') + '. Es el mismo ' + ie('v^2/r') + '.' },
      ])}
      ${Portfolio.sources(['ntrs-ag', 'hall-1994', 'hall-spincalc', 'globus-hall', 'nist-g', 'nasa-factsheet', 'openstax'])}
      `;
    },

    init(el) {
      const $ = (id) => el.querySelector('#t3-' + id);
      const field = (id) => $(id);
      const ranges = { r: [5, 5000], rpm: [0.05, 60], gt: [0.01, 3] };
      const chart = new LineChart($('chart'), { title: 'Rotación necesaria en función del radio', xLabel: 'Radio r', xUnit: 'm', yLabel: 'Rotación', yUnit: 'rpm', xMin: 0, xMax: 1000, yMin: 0, yMax: 15 });
      const mode = () => el.querySelector('input[name="t3-mode"]:checked').value;
      const setIfDisabled = (id, v) => { field(id).value = Number.isFinite(v) ? +v.toPrecision(4) : ''; };

      function validate() {
        let ok = true;
        const used = { ac: ['r', 'rpm'], rpm: ['r', 'gt'], r: ['rpm', 'gt'] }[mode()];
        for (const k of ['r', 'rpm', 'gt']) {
          const v = parseFloat(field(k).value), [lo, hi] = ranges[k];
          const bad = used.includes(k) && !(v >= lo && v <= hi);
          UI.fieldError(el, 't3-' + k, bad ? `Ingrese un valor entre ${fmt(lo, 2)} y ${fmt(hi, 0)}.` : '');
          if (bad) ok = false;
        }
        return ok;
      }

      function update() {
        const m = mode();
        field('r').readOnly = m === 'r'; field('rpm').readOnly = m === 'rpm'; field('gt').readOnly = m === 'ac';
        if (!validate()) { $('status').className = 'status warn'; $('status').textContent = 'Corrija los campos marcados para recalcular.'; return; }
        let r = parseFloat(field('r').value), rpm = parseFloat(field('rpm').value), gt = parseFloat(field('gt').value);
        let w;
        if (m === 'ac') { w = P.rpmToOmega(rpm); }
        else if (m === 'rpm') { w = P.omegaForG(r, gt); rpm = P.omegaToRpm(w); setIfDisabled('rpm', rpm); }
        else { w = P.rpmToOmega(rpm); r = P.radiusForG(w, gt); setIfDisabled('r', r); }
        const s = P.spinState(r, w);
        if (m === 'ac') setIfDisabled('gt', s.aG);
        $('o-w').textContent = fmt(s.omega, 4); $('o-v').textContent = fmt(s.v, 1); $('o-ac').textContent = fmt(s.ac, 2);
        $('o-g').textContent = fmt(s.aG, 3); $('o-T').textContent = fmt(s.T, 1); $('o-f').textContent = fmt(s.f, 4);
        $('o-rpm').textContent = fmt(s.rpm, 2); $('o-r').textContent = fmt(s.r, 1);
        const grad = P.gravityGradientPct(r), cor = (2 * 1 / s.v) * 100;
        $('o-gr').textContent = fmt(grad, 2); $('o-cor').textContent = fmt(cor, 1);
        // texto vivo de los diagramas
        $('da1').textContent = `r = ${fmt(s.r, 1)} m · ω = ${fmt(s.omega, 4)} rad/s (${fmt(s.rpm, 2)} rpm)`;
        $('da2').textContent = `v = ${fmt(s.v, 1)} m/s · a_c = ${fmt(s.ac, 2)} m/s² = ${fmt(s.aG, 2)} g`;
        $('db2').textContent = `gradiente (h = 1,8 m): ${fmt(grad, 2)} %`;
        $('db3').textContent = `a_cor para u = 1 m/s: ${fmt(P.coriolis(s.omega, 1), 3)} m/s² (${fmt(cor, 1)} % de a_c)`;
        // curvas
        const rs = P.linspace(20, 1000, 120), c = { a: '#f0717f', b: '#b7a1ff', c: '#7ddbb0' };
        const curve = (n) => rs.map((x) => P.omegaToRpm(P.omegaForG(x, n)));
        chart.update({
          series: [
            { name: '1 g', color: c.a, x: rs, y: curve(1) },
            { name: '0,38 g', color: c.b, x: rs, y: curve(0.378) },
            { name: '0,17 g', color: c.c, x: rs, y: curve(0.165) },
            { name: '4 rpm', color: '#a4b3cf', dashed: true, width: 1.4, x: [0, 1000], y: [4, 4] },
            { name: 'Actual', color: '#ffffff', points: true, radius: 6, x: [Math.min(s.r, 1000)], y: [Math.min(s.rpm, 15)] },
          ],
        });
        const warn = s.rpm > 6 ? `A ${fmt(s.rpm, 1)} rpm se supera con holgura el rango de confort citado (≈ 4–6 rpm).` : s.rpm > 4 ? `A ${fmt(s.rpm, 1)} rpm se supera el valor de 4 rpm considerado aceptable en general por Globus y Hall.` : '';
        $('status').className = 'status' + (warn ? ' warn' : ''); $('status').textContent = warn || (s.r > 1000 ? 'El radio excede el eje del gráfico (1000 m); los números siguen siendo válidos.' : '');
      }

      el.querySelectorAll('input[name="t3-mode"]').forEach((i) => i.addEventListener('change', () => { if (mode() !== 'ac') field('gt').value = (Math.round(parseFloat(field('gt').value) * 100) / 100) || 1; update(); }));
      ['r', 'rpm', 'gt'].forEach((k) => field(k).addEventListener('input', update));
      el.querySelectorAll('[data-gt]').forEach((b) => b.addEventListener('click', () => { field('gt').value = b.dataset.gt; if (mode() === 'ac') el.querySelector('input[name="t3-mode"][value="rpm"]').checked = true; update(); }));
      update();
    },
  };

  Portfolio.register(T);
})();
