// Pruebas numéricas del núcleo físico. Ejecutar:  node docs/test_physics.js
const P = require('../js/physics.js');
let fails = 0;
const near = (name, got, exp, tol = 1e-6) => {
  const ok = Math.abs(got - exp) <= tol * Math.max(1, Math.abs(exp));
  if (!ok) fails++;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + name + '  obtenido=' + got + '  esperado=' + exp);
};
// Tema 3: caso numérico 1 g
const w2 = P.rpmToOmega(2);
const r2 = P.radiusForG(w2, 1);
const s2 = P.spinState(r2, w2);
near('r a 2 rpm (m)', r2, 223.5636, 1e-4); near('a_c en g', s2.aG, 1);
near('rpm a r=100 m', P.omegaToRpm(P.omegaForG(100, 1)), 2.9904, 1e-3);
const s100 = P.spinState(100, P.omegaForG(100, 1));
near('T = 2π/ω (s)', s100.T, 20.0624, 1e-3);
near('a_c = v²/r = ω²r', s100.v ** 2 / 100, s100.ac);
// Tema 2
const j = P.jumpModel({ v0: 6, g: 9.81 });
near('h_max', j.hMax, 36 / (2 * 9.81)); near('t_vuelo', j.tFlight, (2 * 6) / 9.81);
near('y(t_vuelo)=0', j.y(j.tFlight), 0); near('y(t_subida)=h_max', j.y(j.tUp), j.hMax);
near('vy(t_subida)=0', j.vy(j.tUp), 0, 1e-9);
const jk = P.jumpModel({ v0: 6, g: 9.81, fallMultiplier: 3 });
near('y continua en el pico', jk.y(jk.tUp + 1e-9), jk.hMax, 1e-6);
const d = P.jumpFromDesign(3, 0.4); near('g de diseño', d.g, 37.5); near('v0 de diseño', d.v0, 15);
near('consistencia del diseño', P.jumpModel({ v0: d.v0, g: d.g }).hMax, 3);
// Tema 1
const data = P.generateDroneData([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 150, y: 80 }, { x: 250, y: 80 }], 10, 2.5, 0.1);
near('x(0)', data.x[0], 0); near('y final', data.y[data.y.length - 1], 80, 1e-3);
near('v(0)=0', data.speed[0], 0, 1e-6);
console.log('   duración', data.duration.toFixed(2), 's  L', data.length.toFixed(1), 'm  vmax', Math.max(...data.speed).toFixed(2), ' amax', Math.max(...data.accMag).toFixed(2));
near('vmax≈10', Math.max(...data.speed), 10, 2e-2);
// Tema 4
const p = { muPeak: 1.8, tOpt: 100, wCold: 25, wHot: 18 };
near('μ(T_opt)', P.gripVsTemperature(100, p), 1.8);
const w = P.operatingWindow(p, 0.05);
near('μ en borde bajo = 0,95 pico', P.gripVsTemperature(w.low, p), 1.8 * 0.95, 1e-9);
near('μ en borde alto = 0,95 pico', P.gripVsTemperature(w.high, p), 1.8 * 0.95, 1e-9);
const L = P.loadTransferLoss(4, 1.5, { mu0: 2.2, b: 0.12 });
console.log('   pérdida por transferencia de carga:', L.lossPct.toFixed(2), '%');
near('bloque en reposo', P.blockFriction({ m: 10, muS: 0.6, muK: 0.4, applied: 50 }).friction, 50);
near('bloque deslizando', P.blockFriction({ m: 10, muS: 0.6, muK: 0.4, applied: 70 }).friction, 0.4 * 10 * P.G0);
// Tema 5
near('Hooke', P.virtualSpringForce(5, { k: 2, x0: 1, fMax: 100 }), 8);
near('saturación', P.virtualSpringForce(50, { k: 2, x0: 1, fMax: 10 }), 10);
console.log(fails ? fails + ' PRUEBAS FALLARON' : 'Todas las pruebas pasaron');
process.exit(fails ? 1 : 0);
