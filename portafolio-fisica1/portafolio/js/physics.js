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

  const api = {
    G0, clamp, isNum, linspace,
    catmullRomPath, cumulativeLength, pointAtArcLength, trapezoidalProfile, generateDroneData,
    jumpModel, jumpFromDesign,
    rpmToOmega, omegaToRpm, spinState, omegaForG, radiusForG, gravityGradientPct, coriolis,
    blockFriction, gripVsTemperature, operatingWindow, muVsLoad, lateralForce, loadTransferLoss, maxCornerSpeed,
    virtualSpringForce, springEnergy,
  };
  root.Physics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
