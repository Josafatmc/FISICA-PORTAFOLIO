/* ==========================================================================
   script.js — Arranque del portafolio.
   1) Monta índice (con filtros), menú lateral agrupado por unidad y una sección por tema.
   2) Inicializa cada tema de forma aislada (un error en uno no rompe a los demás).
   3) Añade navegación interna: submenú por tema, anterior/siguiente, mapa de conexiones
      y tabla de cumplimiento de la consigna (generada revisando el contenido real).
   4) Construye referencias y próximos temas, anima la portada y renderiza las ecuaciones.
   5) Detalles de interfaz: barra de progreso, aparición al desplazarse, volver arriba, avisos.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const topics = Portfolio.topics;
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const unitOf = (t) => t.avance || 'Avance 1';

  /** Nombre corto de cada tema (mapa y navegación). */
  const SHORT = { 'tema-1': 'Dron', 'tema-2': 'Salto', 'tema-3': 'Hábitat', 'tema-4': 'Llantas F1', 'tema-5': 'Háptico', 'tema-6': 'Frenado', 'tema-7': 'Rebote', 'tema-8': 'Ruedas', 'tema-9': 'Voyager' };

  /** Iconos por tipo de recurso. */
  const ICONS = {
    'Simulación interactiva': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke="none"/></svg>',
    'Visualización de datos': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V4M4 20h16"/><path d="M7 16l4-5 3 3 5-7"/></svg>',
    'Diagrama': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="10" cy="18" r="2.5"/><path d="M8.2 7.2l7.5 1M7 8.3l2.2 7.4M16.6 10.1l-5 6"/></svg>',
    'Multimedia con análisis': '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>',
  };
  const icon = (res) => ICONS[res] || ICONS['Diagrama'];

  /* ---------- Portada: datos del sitio y cifras ---------- */
  function buildHeroMeta() {
    const S = window.SITE || {};
    const parts = [S.course, S.teacher, S.update].filter(Boolean);
    if (S.student) parts.unshift('Estudiante: ' + S.student);
    $('#heroMeta').textContent = parts.join('  ·  ');
  }
  function buildStats() {
    const controls = $$('#temas input, #temas select').length;
    const items = [
      { n: topics.length, label: 'temas desarrollados' },
      { n: new Set(topics.map((t) => t.resource)).size, label: 'tipos de recurso' },
      { n: controls, label: 'controles interactivos' },
      { n: (window.REFERENCES || []).length, label: 'referencias citadas' },
    ];
    $('#stats').innerHTML = items.map((s) => `<div class="stat"><dt>${s.label}</dt><dd data-count="${s.n}">${s.n}</dd></div>`).join('');
    if (reduceMotion) return;
    $$('#stats [data-count]').forEach((el) => {
      const end = +el.dataset.count, t0 = performance.now(), dur = 1100;
      el.textContent = '0';
      const tick = (now) => {
        const u = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - u, 3);
        el.textContent = String(Math.round(end * e));
        if (u < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Índice: tarjetas con filtros ---------- */
  function buildIndex() {
    const grid = $('#indexGrid');
    topics.forEach((t) => {
      const card = document.createElement('a');
      card.className = 'index-card reveal c-' + (t.accent || 'pos');
      card.href = '#' + t.id;
      card.dataset.res = t.resource; card.dataset.unit = unitOf(t);
      card.innerHTML = `<span class="ic-top"><span class="ic-num">${String(t.number).padStart(2, '0')}</span>${unitOf(t) === 'Avance 2' ? '<span class="pill new">Nuevo · Avance 2</span>' : '<span class="pill">Avance 1</span>'}</span>
        <span class="ic-title">${t.title}</span>
        <span class="ic-sum">${t.summary || ''}</span>
        <span class="ic-concepts">${(t.concepts || []).map((c) => `<span>${c}</span>`).join('')}</span>
        <span class="ic-foot"><span class="ic-res">${icon(t.resource)}${t.resource}</span><span class="ic-go" aria-hidden="true">→</span></span>`;
      grid.appendChild(card);
    });
    const resTypes = ['Todos', ...new Set(topics.map((t) => t.resource))];
    const units = ['Todas las unidades', ...new Set(topics.map(unitOf))];
    const state = { res: 'Todos', unit: 'Todas las unidades' };
    const mk = (host, list, key, labelFn) => {
      host.innerHTML = list.map((v, i) => `<button type="button" class="seg-btn" aria-pressed="${i === 0}" data-v="${v}">${labelFn(v)}</button>`).join('');
      host.addEventListener('click', (e) => {
        const b = e.target.closest('.seg-btn'); if (!b) return;
        state[key] = b.dataset.v;
        $$('.seg-btn', host).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        apply();
      });
    };
    mk($('#filterRes'), resTypes, 'res', (v) => (v === 'Todos' ? 'Todos los recursos' : `${icon(v)}${v}`));
    mk($('#filterUnit'), units, 'unit', (v) => (Portfolio.UNITS[v] ? `${v}: ${Portfolio.UNITS[v]}` : v));
    function apply() {
      let n = 0;
      $$('.index-card', grid).forEach((c) => {
        const ok = (state.res === 'Todos' || c.dataset.res === state.res) && (state.unit === 'Todas las unidades' || c.dataset.unit === state.unit);
        c.classList.toggle('is-hidden', !ok); if (ok) n++;
      });
      $('#filterCount').textContent = `${n} de ${topics.length} temas`;
    }
    apply();
  }

  /* ---------- Menú lateral agrupado por unidad, con búsqueda ---------- */
  function buildSidebar() {
    const host = $('#sideGroups');
    const groups = [...new Set(topics.map(unitOf))];
    host.innerHTML = groups.map((g) => `<div class="side-group"><p class="side-title">${g}<span>${Portfolio.UNITS[g] || ''}</span></p>
      <ol class="side-list">${topics.filter((t) => unitOf(t) === g).map((t) => `<li data-search="${UI.esc((t.title + ' ' + (t.concepts || []).join(' ') + ' ' + t.resource).toLowerCase())}"><a href="#${t.id}" data-spy="${t.id}" class="c-${t.accent || 'pos'}"><b>${t.number}</b><span>${t.title}</span></a></li>`).join('')}</ol></div>`).join('');
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    $('#sideSearch').addEventListener('input', (e) => {
      const q = norm(e.target.value.trim()); let shown = 0;
      $$('.side-group', host).forEach((g) => {
        let any = false;
        $$('li', g).forEach((li) => { const ok = !q || norm(li.dataset.search).includes(q); li.hidden = !ok; if (ok) { any = true; shown++; } });
        g.hidden = !any;
      });
      $('#sideEmpty').hidden = shown > 0;
    });
  }

  /* ---------- Secciones de los temas ---------- */
  function buildTopics() {
    const host = $('#temas');
    topics.forEach((t) => {
      const sec = document.createElement('section');
      sec.id = t.id;
      sec.className = 'topic c-' + (t.accent || 'pos');
      sec.setAttribute('aria-labelledby', t.id + '-title');
      try {
        sec.innerHTML = t.html();
      } catch (err) {
        console.error('Error al construir', t.id, err);
        sec.innerHTML = `<h2 id="${t.id}-title">${t.title}</h2><p class="callout hipotesis">No se pudo cargar esta sección: ${UI.esc(err.message)}</p>`;
      }
      host.appendChild(sec);
    });
    // init() después de montar todo el DOM, aislando fallos por tema
    topics.forEach((t) => {
      const sec = document.getElementById(t.id);
      try { t.init && t.init(sec); } catch (err) {
        console.error('Error al iniciar', t.id, err);
        const box = document.createElement('p');
        box.className = 'callout hipotesis';
        box.textContent = 'La simulación de este tema no pudo iniciarse: ' + err.message;
        sec.appendChild(box);
      }
    });
  }

  /* ---------- Navegación dentro de cada tema: submenú y anterior/siguiente ---------- */
  const SUBNAV = [
    [/^Introducción/, 'Problema'], [/^Caso de uso/, 'Caso de uso'], [/^Concepto/, 'Ecuaciones'], [/^Cómo se usa/, 'Solución'],
    [/^Recurso/, 'Recurso'], [/^Interpretación/, 'Resultados'], [/^Limitaciones/, 'Supuestos'], [/^Conexiones/, 'Conexiones'], [/^Fuentes/, 'Fuentes'],
  ];
  function topicNavigation() {
    topics.forEach((t, i) => {
      const sec = document.getElementById(t.id); if (!sec) return;
      const head = $('.topic-head', sec);
      const pills = $$('.tblock > h3', sec).map((h, k) => {
        h.parentElement.id = h.parentElement.id || `${t.id}-s${k}`;
        const label = (SUBNAV.find(([re]) => re.test(h.textContent)) || [null, h.textContent])[1];
        return `<a href="#${h.parentElement.id}" class="${/^Recurso/.test(h.textContent) ? 'is-key' : ''}">${label}</a>`;
      });
      if (head && pills.length) {
        const nav = document.createElement('nav');
        nav.className = 'topic-nav'; nav.setAttribute('aria-label', 'Secciones del tema ' + t.number);
        nav.innerHTML = pills.join('');
        head.after(nav);
      }
      const prev = topics[i - 1], next = topics[i + 1];
      const pager = document.createElement('nav');
      pager.className = 'topic-pager'; pager.setAttribute('aria-label', 'Tema anterior y siguiente');
      pager.innerHTML = (prev ? `<a class="pg prev" href="#${prev.id}"><small>← Tema ${prev.number}</small><span>${prev.title}</span></a>` : '<span></span>')
        + (next ? `<a class="pg next" href="#${next.id}"><small>Tema ${next.number} →</small><span>${next.title}</span></a>` : `<a class="pg next" href="#referencias"><small>Siguiente →</small><span>Referencias</span></a>`);
      sec.appendChild(pager);
    });
  }

  /* ---------- Mapa de conexiones (a partir de los enlaces reales de cada tema) ---------- */
  function buildMap() {
    const edges = new Map();
    topics.forEach((t) => {
      const sec = document.getElementById(t.id); if (!sec) return;
      $$('.connections a[href^="#tema-"]', sec).forEach((a) => {
        const to = a.getAttribute('href').slice(1); if (to === t.id || !topics.some((x) => x.id === to)) return;
        const key = [t.id, to].sort().join('|');
        if (!edges.has(key)) edges.set(key, { a: t.id, b: to, text: a.parentElement.textContent.replace(/^Tema \d+\s*—\s*/, '') });
      });
    });
    const W = 860, H = 560, cx = W / 2, cy = H / 2 + 6, R = 220;
    const pos = {};
    topics.forEach((t, i) => {
      const a = -Math.PI / 2 + (i / topics.length) * Math.PI * 2;
      pos[t.id] = { x: cx + R * 1.32 * Math.cos(a), y: cy + R * Math.sin(a) };
    });
    const edgeSvg = [...edges.values()].map((e) => {
      const p = pos[e.a], q = pos[e.b], mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      const kx = cx + (mx - cx) * 0.35, ky = cy + (my - cy) * 0.35;
      return `<path class="m-edge" data-a="${e.a}" data-b="${e.b}" d="M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${kx.toFixed(1)},${ky.toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}"><title>${UI.esc(SHORT[e.a] + ' ↔ ' + SHORT[e.b] + ': ' + e.text)}</title></path>`;
    }).join('');
    const nodeSvg = topics.map((t) => {
      const p = pos[t.id], deg = [...edges.values()].filter((e) => e.a === t.id || e.b === t.id).length;
      return `<a href="#${t.id}" class="m-node c-${t.accent || 'pos'} ${unitOf(t) === 'Avance 2' ? 'u2' : 'u1'}" data-id="${t.id}" aria-label="Tema ${t.number}: ${UI.esc(t.title)} (${deg} conexiones)">
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${30 + deg * 1.5}"/>
        <text x="${p.x.toFixed(1)}" y="${(p.y - 3).toFixed(1)}" class="m-num">${t.number}</text>
        <text x="${p.x.toFixed(1)}" y="${(p.y + 14).toFixed(1)}" class="m-lab">${SHORT[t.id] || ''}</text></a>`;
    }).join('');
    $('#mapWrap').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="map" role="group" aria-label="Mapa de conexiones entre los ${topics.length} temas">
      <circle cx="${cx}" cy="${cy}" r="${R * 0.42}" class="m-core"/>
      <text x="${cx}" y="${cy - 8}" class="m-core-t">Leyes de Newton</text><text x="${cx}" y="${cy + 12}" class="m-core-s">conservación · energía</text>
      ${edgeSvg}${nodeSvg}</svg>
      <div class="map-legend"><span><i class="u1"></i>Avance 1 · ${Portfolio.UNITS['Avance 1']}</span><span><i class="u2"></i>Avance 2 · ${Portfolio.UNITS['Avance 2']}</span><span class="map-info" id="mapInfo" role="status">${edges.size} conexiones documentadas</span></div>`;
    const svg = $('#mapWrap svg');
    const focus = (id) => {
      svg.classList.toggle('has-focus', !!id);
      $$('.m-edge', svg).forEach((e) => e.classList.toggle('on', !!id && (e.dataset.a === id || e.dataset.b === id)));
      $$('.m-node', svg).forEach((n) => {
        const linked = id && (n.dataset.id === id || [...edges.values()].some((e) => (e.a === id && e.b === n.dataset.id) || (e.b === id && e.a === n.dataset.id)));
        n.classList.toggle('on', !!linked);
      });
      const t = topics.find((x) => x.id === id);
      $('#mapInfo').textContent = t ? `Tema ${t.number} · ${SHORT[id]}: ${[...edges.values()].filter((e) => e.a === id || e.b === id).length} conexiones` : `${edges.size} conexiones documentadas`;
    };
    $$('.m-node', svg).forEach((n) => {
      n.addEventListener('mouseenter', () => focus(n.dataset.id)); n.addEventListener('focus', () => focus(n.dataset.id));
      n.addEventListener('mouseleave', () => focus(null)); n.addEventListener('blur', () => focus(null));
    });
  }

  /* ---------- Cumplimiento: revisa el contenido real de cada sección ---------- */
  function buildChecklist() {
    const ok = (b) => (b ? '<span class="ck yes" aria-label="cumple">✓</span>' : '<span class="ck no" aria-label="falta">✗</span>');
    const rows = topics.map((t) => {
      const sec = document.getElementById(t.id);
      const blocks = sec ? $$('.tblock', sec) : [];
      const find = (re) => blocks.find((b) => re.test(($('h3', b) || {}).textContent || ''));
      const caso = find(/^Caso de uso/), rec = find(/^Recurso/);
      const hasCase = !!caso && /(Industria|Sistema|Producto)/.test(caso.textContent) && !!$('.cite', caso);
      const hasEq = !!sec && $$('.eq', sec).length > 0;
      const hasJust = !!sec && /(alternativa no física|por qué modelar la física)/i.test(sec.textContent) && !!$('.tradeoff', sec);
      const RES = { 'Simulación interactiva': /simulaci/i, 'Visualización de datos': /visualizaci/i, 'Diagrama': /diagrama/i, 'Multimedia con análisis': /(video|multimedia)/i };
      const resOk = !!rec && (RES[t.resource] || /./).test(($('h3', rec) || {}).textContent || '');
      const interactive = sec ? $$('input, select', sec).length : 0;
      return `<tr><td><a href="#${t.id}">Tema ${t.number} · ${SHORT[t.id] || t.title}</a></td><td>${ok(hasCase)}</td><td>${ok(hasEq)}</td><td>${ok(hasJust)}</td><td><span class="ic-res sm">${icon(t.resource)}${t.resource}</span> ${ok(resOk)}</td><td>${interactive}</td></tr>`;
    });
    $('#checkTable').innerHTML = `<thead><tr><th>Tema</th><th>Caso concreto</th><th>Ecuación explícita</th><th>Justificación</th><th>Recurso prescrito</th><th>Controles interactivos</th></tr></thead><tbody>${rows.join('')}</tbody>`;
  }

  /* ---------- Referencias ---------- */
  function buildReferences() {
    const list = $('#refList');
    const sorted = [...window.REFERENCES].sort((a, b) =>
      a.apa.replace(/<[^>]+>/g, '').localeCompare(b.apa.replace(/<[^>]+>/g, ''), 'es'));
    sorted.forEach((r) => {
      const li = document.createElement('li');
      li.id = 'ref-' + r.id;
      const link = r.url ? ` <a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.url}</a>` : '';
      const state = r.checked ? `<span class="ref-state ok">consultado ${r.checked}</span>`
                              : '<span class="ref-state pending">verificar enlace manualmente</span>';
      li.innerHTML = `${r.apa}${link} ${state}${r.note ? `<br><small class="hint">${r.note}</small>` : ''}`;
      list.appendChild(li);
    });
  }

  function buildUpcoming() {
    const host = $('#upcomingList');
    (window.UPCOMING || []).forEach((u, i) => {
      const d = document.createElement('div');
      d.className = 'up-card reveal';
      d.innerHTML = `<small>${u.avance} · tema ${topics.length + i + 1}</small><span>${u.title}</span>`;
      host.appendChild(d);
    });
  }

  function buildFooter() {
    const S = window.SITE || {};
    const bits = [];
    if (S.repoUrl) bits.push(`<a href="${S.repoUrl}" rel="noopener noreferrer">Repositorio público</a>`);
    if (S.siteUrl) bits.push(`<a href="${S.siteUrl}" rel="noopener noreferrer">Sitio publicado</a>`);
    $('#footer').innerHTML = `<div class="foot-grid">
      <div><p class="foot-brand">La física que mueve al software</p><p>Portafolio individual de evidencias · ${S.course || ''}</p><p>${S.update || ''}</p></div>
      <div><p class="foot-h">Enlaces</p><p>${bits.join('<br>')}</p><p><a href="#referencias">Referencias</a> · <a href="#cumplimiento">Cumplimiento</a></p></div>
      </div>
      <p class="hint">Las simulaciones y gráficas se calculan en su navegador; no se envía ningún dato a servidores.</p>`;
  }

  /* ---------- Navegación: menú móvil, tema visible, progreso y volver arriba ---------- */
  function setupNav() {
    const btn = $('#menuBtn'), sidebar = $('#sidebar'), scrim = $('#scrim');
    const setOpen = (open) => {
      sidebar.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
      scrim.hidden = !open; document.body.classList.toggle('nav-open', open);
    };
    btn.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
    scrim.addEventListener('click', () => setOpen(false));
    sidebar.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) { setOpen(false); btn.focus(); }
    });
    if ('IntersectionObserver' in window) {
      const links = new Map($$('[data-spy]').map((a) => [a.dataset.spy, a]));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((a) => a.classList.remove('active'));
            const a = links.get(en.target.id);
            if (a) { a.classList.add('active'); if (sidebar.scrollHeight > sidebar.clientHeight) a.scrollIntoView({ block: 'nearest' }); }
          }
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      links.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    }
    const bar = $('#progress span'), top = $('#toTop');
    let pending = false;
    const onScroll = () => {
      if (pending) return; pending = true;
      requestAnimationFrame(() => {
        const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
        bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
        top.classList.toggle('show', h.scrollTop > 900);
        pending = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    top.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); $('.brand').focus({ preventScroll: true }); });
  }

  /* ---------- Aparición al desplazarse ---------- */
  function setupReveal() {
    const targets = $$('.section-head, .tblock, .lab, .figure, .grid-2 > .card, .map-wrap, .topic-head');
    targets.forEach((el) => el.classList.add('reveal'));
    const all = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) { all.forEach((el) => el.classList.add('in')); return; }
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    all.forEach((el, i) => { if (el.classList.contains('index-card')) el.style.setProperty('--d', (i % 3) * 70 + 'ms'); io.observe(el); });
    // Al saltar con un enlace interno, mostrar el destino de inmediato
    window.addEventListener('hashchange', () => { const el = document.getElementById(location.hash.slice(1)); if (el) $$('.reveal', el).concat(el.classList.contains('reveal') ? [el] : []).forEach((x) => x.classList.add('in')); });
  }

  /* ---------- Avisos breves (descargas) ---------- */
  function setupToast() {
    const box = $('#toast'); let timer = null;
    window.toast = (msg) => {
      box.textContent = msg; box.classList.add('show');
      clearTimeout(timer); timer = setTimeout(() => box.classList.remove('show'), 2600);
    };
    const original = UI.downloadCSV;
    UI.downloadCSV = function (filename, ...rest) { original(filename, ...rest); window.toast('Descargado: ' + filename); };
  }

  /* ---------- Portada animada: trayectoria parabólica, hábitat que gira y órbitas ---------- */
  function heroAnimation() {
    const cv = $('#heroCanvas'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, t0 = performance.now();
    function size() {
      const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      const pos = UI.cssVar('--c-pos', '#33a3bf'), vel = UI.cssVar('--c-vel', '#c08801'), acc = UI.cssVar('--c-acc', '#e36574'), force = UI.cssVar('--c-force', '#9882dd');
      // Rejilla sutil
      ctx.strokeStyle = 'rgba(160,185,230,0.05)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // Hábitat giratorio (esquina derecha)
      const cx = W * 0.8, cy = H * 0.4, R = Math.min(W, H) * 0.27, ang = t * 0.35;
      ctx.strokeStyle = 'rgba(190,210,245,0.28)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 4; k++) { const a = ang + (k * Math.PI) / 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.stroke(); }
      const px = cx + R * Math.cos(ang), py = cy + R * Math.sin(ang);
      ctx.fillStyle = pos; ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.2832); ctx.fill();
      const ux = (cx - px) / R, uy = (cy - py) / R;
      ctx.strokeStyle = acc; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + ux * 42, py + uy * 42); ctx.stroke();
      ctx.strokeStyle = vel; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - uy * 48, py + ux * 48); ctx.stroke();
      // Sonda que sobrevuela un planeta (asistencia gravitatoria, arriba al centro)
      const gx = W * 0.56, gy = H * 0.16, phase = (t * 0.12) % 1;
      ctx.fillStyle = 'rgba(152,130,221,0.25)'; ctx.beginPath(); ctx.arc(gx, gy, 14, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(152,130,221,0.35)'; ctx.setLineDash([3, 5]); ctx.lineWidth = 1.3; ctx.beginPath();
      const hyp = (u) => { const s = (u - 0.5) * 6; return [gx + 34 * Math.sinh(s) / 3, gy + 26 * (Math.cosh(s) - 1) / 3 - 32]; };
      for (let u = 0; u <= 1.001; u += 0.02) { const [x, y] = hyp(u); u === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
      const [sx, sy] = hyp(phase); ctx.fillStyle = force; ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, 6.2832); ctx.fill();
      // Saltos parabólicos sucesivos (esquina inferior izquierda) y pelota que rebota
      const base = H * 0.9, span = Math.min(W * 0.4, 320), hmax = H * 0.22;
      for (let k = 0; k < 3; k++) {
        const ph = ((t * 0.5 + k / 3) % 1), x0 = W * 0.06 + k * span * 0.55;
        ctx.strokeStyle = 'rgba(51,163,191,0.2)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.beginPath();
        for (let u = 0; u <= 1.001; u += 0.02) { const xx = x0 + u * span * 0.5, yy = base - 4 * hmax * u * (1 - u); u === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
        ctx.stroke(); ctx.setLineDash([]);
        const xx = x0 + ph * span * 0.5, yy = base - 4 * hmax * ph * (1 - ph);
        ctx.fillStyle = pos; ctx.beginPath(); ctx.arc(xx, yy, 4, 0, 6.2832); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(190,210,245,0.22)'; ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base); ctx.stroke();
    }
    size();
    window.addEventListener('resize', () => { size(); if (reduceMotion) draw(t0 + 3000); });
    if (reduceMotion) { draw(t0 + 3000); return; }
    let visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(cv);
    (function loop(now) { if (visible) draw(now); requestAnimationFrame(loop); })(performance.now());
  }

  /* ---------- Ecuaciones (KaTeX, cargado con defer) ---------- */
  function renderMath() {
    if (typeof renderMathInElement !== 'function') {
      console.warn('KaTeX no está disponible; las ecuaciones se muestran en TeX sin renderizar.');
      document.documentElement.classList.add('no-katex');
      return;
    }
    renderMathInElement(document.body, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }],
      throwOnError: false,
    });
  }

  setupToast();
  buildHeroMeta(); buildIndex(); buildSidebar(); buildTopics(); topicNavigation(); buildMap(); buildChecklist();
  buildReferences(); buildUpcoming(); buildFooter(); buildStats(); setupNav(); setupReveal(); heroAnimation();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderMath);
  else renderMath();
  window.addEventListener('load', () => { if (!document.querySelector('.katex')) renderMath(); });
})();
