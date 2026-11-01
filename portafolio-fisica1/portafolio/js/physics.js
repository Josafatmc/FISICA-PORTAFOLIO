/* ==========================================================================
   physics.js — Funciones de cálculo físico puras (sin DOM).
   Unidades SI salvo que se indique lo contrario.
   Se expone en window.Physics y también en Node (module.exports) para pruebas.
   ========================================================================== */
(function (root) {
  'use strict';

  /** Aceleración estándar de la gravedad (m/s²), valor convencional. */
  const G0 = 9.80665;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

  /* ====================== TEMA 1 — Cinemática 2D (dron) ====================== */

  /**
   * Spline de Catmull-Rom centrípeta (alpha = 0.5) por una lista de waypoints.
   * Devuelve una polilínea densa [{x,y}] que pasa por todos los puntos.
   */
  function catmullRomPath(points, samplesPerSegment = 200) {
    if (points.length < 2) throw new Error('Se necesitan al menos 2 puntos de ruta.');
    const first = points[0], second = points[1];
    const last = points[points.length - 1], prev = points[points.length - 2];
    const P = [
      { x: 2 * first.x - second.x, y: 2 * first.y - second.y }, // punto fantasma inicial
      ...points,
      { x: 2 * last.x - prev.x, y: 2 * last.y - prev.y },       // punto fantasma final
    ];
    const alpha = 0.5;
    const knot = (ti, a, b) => ti + Math.pow(Math.hypot(b.x - a.x, b.y - a.y) || 1e-9, alpha);
    const out = [];
    for (let i = 0; i < P.length - 3; i++) {
      const p0 = P[i], p1 = P[i + 1], p2 = P[i + 2], p3 = P[i + 3];
      const t0 = 0, t1 = knot(t0, p0, p1), t2 = knot(t1, p1, p2), t3 = knot(t2, p2, p3);
      for (let k = 0; k < samplesPerSegment; k++) {
        const t = t1 + ((t2 - t1) * k) / samplesPerSegment;
        const lerp = (a, b, ta, tb) => ({
          x: ((tb - t) / (tb - ta)) * a.x + ((t - ta) / (tb - ta)) * b.x,
          y: ((tb - t) / (tb - ta)) * a.y + ((t - ta) / (tb - ta)) * b.y,
        });
        const A1 = lerp(p0, p1, t0, t1), A2 = lerp(p1, p2, t1, t2), A3 = lerp(p2, p3, t2, t3);
        const B1 = lerp(A1, A2, t0, t2), B2 = lerp(A2, A3, t1, t3);
        out.push(lerp(B1, B2, t1, t2));
      }
    }
    out.push({ x: last.x, y: last.y });
    return out;
  }

  /** Longitud de arco acumulada de una polilínea. */
  function cumulativeLength(poly) {
    const s = [0];
    for (let i = 1; i < poly.length; i++) {
      s.push(s[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y));
    }
    return s;
  }

  /** Posición sobre la polilínea tras recorrer una distancia s. */
  function pointAtArcLength(poly, cum, s) {
    const L = cum[cum.length - 1];
    s = clamp(s, 0, L);
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= s) lo = mid; else hi = mid;
    }
    const seg = cum[hi] - cum[lo] || 1e-12;
    const u = (s - cum[lo]) / seg;
    return { x: poly[lo].x + u * (poly[hi].x - poly[lo].x), y: poly[lo].y + u * (poly[hi].y - poly[lo].y) };
  }

  /**
   * Perfil trapezoidal de rapidez a lo largo de la ruta: acelera con a_max hasta
   * v_crucero, mantiene y frena con a_max (o triangular si la ruta es corta).
   */
  function trapezoidalProfile(length, vCruise, aMax) {
    if (!(length > 0) || !(vCruise > 0) || !(aMax > 0)) throw new Error('Parámetros del perfil inválidos.');
    const dAccel = (vCruise * vCruise) / (2 * aMax);
    let vPeak = vCruise, tA, tC;
    if (2 * dAccel >= length) {
      vPeak = Math.sqrt(aMax * length); tA = vPeak / aMax; tC = 0;
    } else {
      tA = vCruise / aMax; tC = (length - 2 * dAccel) / vCruise;
    }
    const T = 2 * tA + tC;
    const s = (t) => {
      t = clamp(t, 0, T);
      if (t < tA) return 0.5 * aMax * t * t;
      if (t < tA + tC) return 0.5 * aMax * tA * tA + vPeak * (t - tA);
      const td = T - t;
      return length - 0.5 * aMax * td * td;
    };
    return { s, T, vPeak, tA, tC };
  }

  /**
   * Genera la "telemetría" simulada a partir de la ruta declarada. Se muestrea r(t)
   * cada dt y se obtiene v y a por diferencias finitas centrales, como haría un
   * sistema de navegación con posiciones muestreadas:
   *   v_i ≈ (r_{i+1} − r_{i−1}) / (2Δt),   a_i ≈ (v_{i+1} − v_{i−1}) / (2Δt)
   */
  function generateDroneData(waypoints, vCruise, aMax, dt = 0.1) {
    const poly = catmullRomPath(waypoints, 250);
    const cum = cumulativeLength(poly);
    const L = cum[cum.length - 1];
    const prof = trapezoidalProfile(L, vCruise, aMax);
    const n = Math.ceil(prof.T / dt) + 1;
    const t = [], x = [], y = [];
    for (let i = 0; i < n; i++) {
      const ti = Math.min(i * dt, prof.T);
      const p = pointAtArcLength(poly, cum, prof.s(ti));
      t.push(ti); x.push(p.x); y.push(p.y);
    }
    const vx = [], vy = [], ax = [], ay = [];
    for (let i = 0; i < n; i++) {
      const im = Math.max(0, i - 1), ip = Math.min(n - 1, i + 1);
      const h = t[ip] - t[im] || dt;
      vx.push((x[ip] - x[im]) / h); vy.push((y[ip] - y[im]) / h);
    }
    for (let i = 0; i < n; i++) { ax.push(0); ay.push(0); }
    // Condición de contorno: el dron parte y termina en reposo; evita el sesgo de la
    // diferencia unilateral en los extremos (que daría v ≈ a·Δt/2 en lugar de 0).
    vx[0] = vy[0] = 0; vx[n - 1] = vy[n - 1] = 0;
    for (let i = 0; i < n; i++) {
      const im = Math.max(0, i - 1), ip = Math.min(n - 1, i + 1);
      const h = t[ip] - t[im] || dt;
      ax[i] = (vx[ip] - vx[im]) / h; ay[i] = (vy[ip] - vy[im]) / h;
    }
    const speed = vx.map((v, i) => Math.hypot(v, vy[i]));
    const accMag = ax.map((a, i) => Math.hypot(a, ay[i]));
    // Descomposición de a en tangencial (a·v̂) y normal (a·n̂), útil para navegación.
    const aTan = [], aNor = [];
    for (let i = 0; i < n; i++) {
      const sp = speed[i];
      if (sp > 1e-6) {
        const ux = vx[i] / sp, uy = vy[i] / sp;
        aTan.push(ax[i] * ux + ay[i] * uy);
        aNor.push(-ax[i] * uy + ay[i] * ux);
      } else { aTan.push(0); aNor.push(0); }
    }
    return { t, x, y, vx, vy, ax, ay, speed, accMag, aTan, aNor, length: L, duration: prof.T, vPeak: prof.vPeak, poly };
  }

  /* ====================== TEMA 2 — Salto / tiro parabólico ====================== */

  /**
   * Salto desde el suelo (y0 = 0) con gravedad g en ascenso y k·g en descenso
   * (k = 1 → parábola simétrica). vx constante da el tiro parabólico.
   */
  function jumpModel({ v0, g, fallMultiplier = 1, vx = 0 }) {
    if (!(v0 > 0) || !(g > 0) || !(fallMultiplier > 0)) throw new Error('v0, g y k deben ser positivos.');
    const tUp = v0 / g;                          // t_subida = v0y / g
    const hMax = (v0 * v0) / (2 * g);            // h_max = v0y² / (2g)
    const gDown = g * fallMultiplier;
    const tDown = Math.sqrt((2 * hMax) / gDown); // caída libre desde h_max con g_desc
    const tFlight = tUp + tDown;
    const y = (t) => {
      if (t <= 0 || t >= tFlight) return 0;
      if (t <= tUp) return v0 * t - 0.5 * g * t * t;
      const td = t - tUp;
      return hMax - 0.5 * gDown * td * td;
    };
    const vy = (t) => {
      if (t <= 0) return v0;
      if (t >= tFlight) return -gDown * tDown;
      if (t <= tUp) return v0 - g * t;
      return -gDown * (t - tUp);
    };
    const x = (t) => vx * clamp(t, 0, tFlight);
    return { tUp, tDown, tFlight, hMax, range: vx * tFlight, vImpact: gDown * tDown, y, vy, x, gDown };
  }

  /** Diseño inverso: dada la altura H y el tiempo al pico t_p → g = 2H/t_p², v0 = 2H/t_p. */
  function jumpFromDesign(height, timeToApex) {
    if (!(height > 0) || !(timeToApex > 0)) throw new Error('H y t_pico deben ser positivos.');
    return { g: (2 * height) / (timeToApex * timeToApex), v0: (2 * height) / timeToApex };
  }

  /* ====================== TEMA 3 — Gravedad por rotación ====================== */

  const rpmToOmega = (rpm) => (rpm * 2 * Math.PI) / 60;
  const omegaToRpm = (w) => (w * 60) / (2 * Math.PI);

  /** Magnitudes del movimiento circular uniforme a partir de r y ω. */
  function spinState(r, omega) {
    if (!(r > 0) || !(omega > 0)) throw new Error('r y ω deben ser positivos.');
    const v = omega * r;
    const ac = omega * omega * r;      // = v²/r
    const T = (2 * Math.PI) / omega;
    return { r, omega, rpm: omegaToRpm(omega), v, ac, aG: ac / G0, T, f: 1 / T };
  }
  /** ω necesaria para n·g a radio r:  ω = √(n g / r) */
  const omegaForG = (r, nG) => Math.sqrt((nG * G0) / r);
  /** r necesario para n·g a velocidad angular ω:  r = n g / ω² */
  const radiusForG = (omega, nG) => (nG * G0) / (omega * omega);
  /** Diferencia relativa de aceleración entre pies (r) y cabeza (r − h), en %. */
  const gravityGradientPct = (r, h = 1.8) => (h / r) * 100;
  /** Aceleración de Coriolis (m/s²) para un movimiento a rapidez u en el marco rotante: 2ωu. */
  const coriolis = (omega, u) => 2 * omega * u;

  /* ====================== TEMA 4 — Fricción y neumáticos ====================== */

  /** Fricción de un bloque con el modelo simple de Coulomb. */
  function blockFriction({ m, muS, muK, applied, g = G0 }) {
    if (!(m > 0) || !(muS >= 0) || !(muK >= 0)) throw new Error('Parámetros de fricción inválidos.');
    const N = m * g;
    const fMaxStatic = muS * N;
    if (Math.abs(applied) <= fMaxStatic) {
      return { N, fMaxStatic, state: 'static', friction: Math.abs(applied), net: 0, a: 0 };
    }
    const fk = muK * N;
    const net = Math.abs(applied) - fk;
    return { N, fMaxStatic, state: 'sliding', friction: fk, net, a: net / m };
  }

  /**
   * μ(T) ILUSTRATIVO (hipotético, no es una medición): campana asimétrica
   *   μ(T) = μ_pico · exp(−((T − T_opt)/w)²),  w = w_frío si T < T_opt, w_caliente si no.
   */
  function gripVsTemperature(T, { muPeak, tOpt, wCold, wHot }) {
    const w = T < tOpt ? wCold : wHot;
    return muPeak * Math.exp(-Math.pow((T - tOpt) / w, 2));
  }
  /** Ventana de operación: T donde μ ≥ (1 − p)·μ_pico (definición por % de pérdida de agarre). */
  function operatingWindow({ tOpt, wCold, wHot }, lossFraction) {
    if (!(lossFraction > 0 && lossFraction < 1)) throw new Error('La pérdida debe estar entre 0 y 1.');
    const d = Math.sqrt(-Math.log(1 - lossFraction));
    return { low: tOpt - wCold * d, high: tOpt + wHot * d };
  }
  /** μ(N) con sensibilidad a la carga ILUSTRATIVA: μ(N) = μ0 − b·N (N en kN). */
  const muVsLoad = (Nk, { mu0, b }) => Math.max(0, mu0 - b * Nk);
  /** Fuerza lateral máxima Fy(N) = μ(N)·N (kN). */
  const lateralForce = (Nk, p) => muVsLoad(Nk, p) * Nk;
  /** Pérdida de fuerza lateral al transferir ΔN entre dos neumáticos de carga media N0 (kN). */
  function loadTransferLoss(N0, dN, p) {
    const lo = Math.max(0, N0 - dN), hi = N0 + dN;
    const total = lateralForce(lo, p) + lateralForce(hi, p);
    const ideal = 2 * lateralForce(N0, p);
    return { total, ideal, lossPct: ideal > 0 ? (1 - total / ideal) * 100 : 0 };
  }
  /** Rapidez máxima en curva plana con fricción pura: v = √(μ g r). */
  const maxCornerSpeed = (mu, r, g = G0) => Math.sqrt(mu * g * r);

  /* ====================== TEMA 5 — Ley de Hooke / resorte virtual ====================== */

  /**
   * Resorte virtual con punto de contacto y saturación (x en mm, k en N/mm):
   *   F = min( k·(x − x0), F_max )  si x > x0;  0 si no.
   * La fuerza sobre el dedo es −F (restauradora, opuesta al desplazamiento).
   */
  function virtualSpringForce(x, { k, x0 = 0, fMax = Infinity }) {
    if (x <= x0) return 0;
    return Math.min(k * (x - x0), fMax);
  }
  /** Energía de un resorte lineal ideal: ½ k x² (J con k en N/m y x en m). */
  const springEnergy = (k, x) => 0.5 * k * x * x;

  /* ====================== TEMA 6 — Frenado regenerativo ====================== */

  const MPH = 0.44704; // m/s por mph (exacto)

  /**
   * Balance de energía de un vehículo eléctrico sobre un ciclo de manejo muestreado cada dt.
   * En cada intervalo, con v̄ = (v_i + v_{i+1})/2 y a = (v_{i+1} − v_i)/dt:
   *   P_rueda = (m a + C_rr m g + ½ ρ C_d A v̄²) · v̄
   * P_rueda > 0 → la batería entrega P/η_tracción.
   * P_rueda < 0 → hay que frenar: el motor recupera min(|P|, P_max)·η_regen y el resto
   * lo disipan los frenos de fricción como calor.
   * Devuelve series acumuladas en kWh y totales.
   */
  function regenCycle(v, { m, cdA, crr, rho = 1.2, etaDrive = 0.9, etaRegen = 0.7, pRegenMaxKW = 60, regen = true, dt = 1 }) {
    if (!(m > 0) || !(cdA >= 0) || !(crr >= 0)) throw new Error('Parámetros del vehículo inválidos.');
    const J2kWh = 1 / 3.6e6, pMax = pRegenMaxKW * 1000;
    let eBat = 0, eRec = 0, eFric = 0, eLoss = 0, eBrake = 0, dist = 0;
    const t = [0], bat = [0], rec = [0], fric = [0], loss = [0], net = [0], kin = [0];
    for (let i = 0; i < v.length - 1; i++) {
      const vb = (v[i] + v[i + 1]) / 2, a = (v[i + 1] - v[i]) / dt;
      const fRes = vb > 0 ? crr * m * G0 + 0.5 * rho * cdA * vb * vb : 0;
      const pWheel = (m * a + fRes) * vb;
      eLoss += fRes * vb * dt;
      if (pWheel >= 0) eBat += (pWheel / etaDrive) * dt;
      else {
        const pb = -pWheel, toMotor = regen ? Math.min(pb, pMax) : 0;
        eBrake += pb * dt; eRec += toMotor * etaRegen * dt; eFric += (pb - toMotor) * dt;
      }
      dist += vb * dt;
      t.push((i + 1) * dt); bat.push(eBat * J2kWh); rec.push(eRec * J2kWh); fric.push(eFric * J2kWh);
      loss.push(eLoss * J2kWh); net.push((eBat - eRec) * J2kWh); kin.push(0.5 * m * v[i + 1] * v[i + 1] / 1000);
    }
    return {
      t, bat, rec, fric, loss, net, kin, distKm: dist / 1000,
      totals: { bat: eBat * J2kWh, rec: eRec * J2kWh, fric: eFric * J2kWh, brake: eBrake * J2kWh, loss: eLoss * J2kWh, net: (eBat - eRec) * J2kWh },
      recoveredPct: eBrake > 0 ? (eRec / eBrake) * 100 : 0,
      whPerKm: dist > 0 ? ((eBat - eRec) / 3600) / (dist / 1000) : 0,
    };
  }
  /** Energía cinética ½ m v² (J). */
  const kineticEnergy = (m, v) => 0.5 * m * v * v;

  /* ====================== TEMA 7 — Coeficiente de restitución ====================== */

  /**
   * Choque frontal en 1D con coeficiente de restitución e = −(v2' − v1')/(v2 − v1).
   * Conserva el momento lineal para cualquier e; la energía cinética solo si e = 1.
   */
  function collide1D(m1, v1, m2, v2, e) {
    if (!(m1 > 0) || !(m2 > 0) || !(e >= 0)) throw new Error('Masas positivas y e ≥ 0.');
    const M = m1 + m2, p = m1 * v1 + m2 * v2;
    const v1p = (p + m2 * e * (v2 - v1)) / M, v2p = (p + m1 * e * (v1 - v2)) / M;
    const K0 = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2, K1 = 0.5 * m1 * v1p * v1p + 0.5 * m2 * v2p * v2p;
    return { v1p, v2p, p0: p, p1: m1 * v1p + m2 * v2p, K0, K1, dK: K1 - K0 };
  }
  /** Altura del rebote n (analítica, sin aire): h_n = e^{2n} h_0. */
  const bounceHeight = (h0, e, n) => h0 * Math.pow(e, 2 * n);
  /** Tiempo total hasta el reposo para 0 ≤ e < 1:  t = √(2h₀/g)·(1 + e)/(1 − e). */
  const timeToRest = (h0, e, g = G0) => (e < 1 ? Math.sqrt((2 * h0) / g) * ((1 + e) / (1 - e)) : Infinity);
  /** Cómo combina un motor tipo Unity el rebote de dos materiales. */
  function combineRestitution(a, b, mode) {
    switch (mode) {
      case 'min': return Math.min(a, b);
      case 'max': return Math.max(a, b);
      case 'mul': return a * b;
      default: return (a + b) / 2;
    }
  }
  /**
   * Un paso de motor de juego: Euler semi-implícito con paso fijo y resolución de contacto
   * con el suelo (y = r). Si la rapidez de llegada es menor que el umbral, la pelota se detiene.
   */
  function bounceStep(s, { g, e, dt, threshold = 0, radius = 0 }) {
    let { y, vy } = s;
    vy -= g * dt; y += vy * dt;
    let hit = false;
    if (y <= radius && vy < 0) {
      hit = true; y = radius;
      vy = -vy < threshold ? 0 : -e * vy;
    }
    return { y, vy, hit };
  }

  /* ====================== TEMA 8 — Ruedas de reacción ====================== */

  /**
   * Conservación del momento angular de un eje: I_s ω_s + I_w ω_w = L (constante).
   * Si la rueda pasa de ω_w0 a ω_w, el cuerpo cambia ω_s = (L − I_w ω_w)/I_s.
   */
  function reactionWheel({ Is, Iw, wheelRpm, wheelRpm0 = 0, bodyRate0 = 0 }) {
    if (!(Is > 0) || !(Iw > 0)) throw new Error('Los momentos de inercia deben ser positivos.');
    const w0 = rpmToOmega(wheelRpm0), w = rpmToOmega(wheelRpm);
    const L = Is * bodyRate0 + Iw * w0;
    const ws = (L - Iw * w) / Is;
    return { L, ws, wheelOmega: w, hWheel: Iw * w, hBody: Is * ws };
  }
  /** Torque que la rueda ejerce sobre el satélite: τ = −I_w α_w (tercera ley de Newton). */
  const wheelTorque = (Iw, alpha) => -Iw * alpha;
  /** Maniobra «bang-bang» de un ángulo θ (rad) con torque máximo τ: acelera la mitad, frena la otra.
   *  t = 2√(θ I_s / τ),  ω_pico = α·t/2,  momento que debe absorber la rueda h = I_s ω_pico. */
  function slewTime(theta, Is, tau) {
    if (!(theta > 0) || !(Is > 0) || !(tau > 0)) throw new Error('θ, I y τ deben ser positivos.');
    const alpha = tau / Is, tHalf = Math.sqrt(theta / alpha);
    return { t: 2 * tHalf, wPeak: alpha * tHalf, hPeak: Is * alpha * tHalf };
  }

  /* ====================== TEMA 9 — Asistencia gravitatoria ====================== */

  const GM_SUN = 1.32712440018e11; // km³/s²
  const AU_KM = 149597870.7;
  /** Rapidez de escape del Sol a la distancia r (UA), km/s:  v_esc = √(2 GM / r). */
  const solarEscape = (rAU) => Math.sqrt((2 * GM_SUN) / (rAU * AU_KM));
  /** Energía orbital específica ε = v²/2 − GM/r (km²/s²); ε ≥ 0 → trayectoria no ligada al Sol. */
  const specificEnergy = (vKms, rAU) => (vKms * vKms) / 2 - GM_SUN / (rAU * AU_KM);

  /**
   * Sobrevuelo en el plano: en el marco del planeta la rapidez de llegada y salida es la
   * misma (v∞); solo gira un ángulo δ dado por  sin(δ/2) = 1 / (1 + r_p v∞² / μ).
   * En el marco del Sol: v = U + v∞ (vectores), con U la velocidad orbital del planeta.
   * phiIn: ángulo de v∞ de llegada respecto a U (grados). side: +1 pasa por detrás del planeta.
   */
  function flyby({ mu, rp, vinf, U, phiIn, side = 1 }) {
    if (!(mu > 0) || !(rp > 0) || !(vinf > 0)) throw new Error('μ, r_p y v∞ deben ser positivos.');
    const delta = 2 * Math.asin(1 / (1 + (rp * vinf * vinf) / mu));
    const a0 = (phiIn * Math.PI) / 180, a1 = a0 + side * delta;
    const vin = { x: U + vinf * Math.cos(a0), y: vinf * Math.sin(a0) };
    const vout = { x: U + vinf * Math.cos(a1), y: vinf * Math.sin(a1) };
    const sIn = Math.hypot(vin.x, vin.y), sOut = Math.hypot(vout.x, vout.y);
    return { delta, deltaDeg: (delta * 180) / Math.PI, vin, vout, sIn, sOut, dv: sOut - sIn, a0, a1 };
  }

  const api = {
    G0, clamp, isNum, linspace,
    catmullRomPath, cumulativeLength, pointAtArcLength, trapezoidalProfile, generateDroneData,
    jumpModel, jumpFromDesign,
    rpmToOmega, omegaToRpm, spinState, omegaForG, radiusForG, gravityGradientPct, coriolis,
    blockFriction, gripVsTemperature, operatingWindow, muVsLoad, lateralForce, loadTransferLoss, maxCornerSpeed,
    virtualSpringForce, springEnergy,
    MPH, regenCycle, kineticEnergy,
    collide1D, bounceHeight, timeToRest, combineRestitution, bounceStep,
    reactionWheel, wheelTorque, slewTime,
    GM_SUN, AU_KM, solarEscape, specificEnergy, flyby,
  };
  root.Physics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
