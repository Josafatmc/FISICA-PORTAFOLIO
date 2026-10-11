/* ==========================================================================
   script.js — Arranque del portafolio.
   1) Monta índice, menú lateral y una sección por cada tema registrado.
   2) Inicializa cada tema de forma aislada (un error en uno no rompe a los demás).
   3) Construye la lista de referencias y la de próximos avances.
   4) Anima la portada, resalta el tema visible y renderiza las ecuaciones.
   ========================================================================== */
(function () {
  'use strict';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const topics = Portfolio.topics;

  /* ---------- Portada: datos del sitio ---------- */
  function buildHeroMeta() {
    const S = window.SITE || {};
    const parts = [S.course, S.teacher, S.update].filter(Boolean);
    if (S.student) parts.unshift('Estudiante: ' + S.student);
    $('#heroMeta').textContent = parts.join('  ·  ');
  }

  /* ---------- Índice (tarjetas + menú lateral) ---------- */
  function buildIndex() {
    const grid = $('#indexGrid'), side = $('#sideList');
    topics.forEach((t) => {
      const card = document.createElement('a');
      card.className = 'index-card c-' + (t.accent || 'pos');
      card.href = '#' + t.id;
      card.innerHTML = `<span class="ic-num">Tema ${t.number}</span>
        <span class="ic-title">${t.title}</span>
        <span class="ic-sum">${t.summary || ''}</span>
        <span class="ic-res">Recurso: ${t.resource}</span>`;
      grid.appendChild(card);

      const li = document.createElement('li');
      li.innerHTML = `<a href="#${t.id}" data-spy="${t.id}"><b>${t.number}</b><span>${t.title}</span></a>`;
      side.appendChild(li);
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
    (window.UPCOMING || []).forEach((u) => {
      const d = document.createElement('div');
      d.className = 'up-card';
      d.innerHTML = `<small>${u.avance}</small><span>${u.title}</span>`;
      host.appendChild(d);
    });
  }

  function buildFooter() {
    const S = window.SITE || {};
    const bits = [];
    if (S.repoUrl) bits.push(`<a href="${S.repoUrl}" rel="noopener noreferrer">Repositorio público</a>`);
    if (S.siteUrl) bits.push(`<a href="${S.siteUrl}" rel="noopener noreferrer">Sitio publicado</a>`);
    $('#footer').innerHTML = `<p>Portafolio individual de evidencias · ${S.course || ''}</p>
      <p>${bits.join(' · ')}</p>
      <p class="hint">Las simulaciones y gráficas se calculan en su navegador; no se envía ningún dato a servidores.</p>`;
  }

  /* ---------- Navegación: menú móvil y resaltado del tema visible ---------- */
  function setupNav() {
    const btn = $('#menuBtn'), sidebar = $('#sidebar');
    btn.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    sidebar.addEventListener('click', (e) => {
      if (e.target.closest('a')) { sidebar.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) { sidebar.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
    if ('IntersectionObserver' in window) {
      const links = new Map([...document.querySelectorAll('[data-spy]')].map((a) => [a.dataset.spy, a]));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((a) => a.classList.remove('active'));
            const a = links.get(en.target.id); if (a) a.classList.add('active');
          }
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      topics.forEach((t) => { const el = document.getElementById(t.id); if (el) io.observe(el); });
    }
  }

  /* ---------- Portada animada: trayectoria parabólica y hábitat que gira ---------- */
  function heroAnimation() {
    const cv = $('#heroCanvas'); if (!cv) return;
    const ctx = cv.getContext('2d');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, t0 = performance.now();
    function size() {
      const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      const pos = UI.cssVar('--c-pos', '#5ec8e5'), vel = UI.cssVar('--c-vel', '#f2b544'), acc = UI.cssVar('--c-acc', '#f0717f');
      // Rejilla sutil
      ctx.strokeStyle = 'rgba(160,185,230,0.06)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // Hábitat giratorio (esquina derecha)
      const cx = W * 0.8, cy = H * 0.42, R = Math.min(W, H) * 0.3, ang = t * 0.35;
      ctx.strokeStyle = 'rgba(190,210,245,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 4; k++) { const a = ang + (k * Math.PI) / 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.stroke(); }
      const px = cx + R * Math.cos(ang), py = cy + R * Math.sin(ang);
      ctx.fillStyle = pos; ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.2832); ctx.fill();
      // vector aceleración centrípeta hacia el centro
      const ux = (cx - px) / R, uy = (cy - py) / R;
      ctx.strokeStyle = acc; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + ux * 46, py + uy * 46); ctx.stroke();
      // velocidad tangencial
      ctx.strokeStyle = vel; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - uy * 52, py + ux * 52); ctx.stroke();
      // Saltos parabólicos sucesivos (esquina inferior izquierda)
      const base = H * 0.86, span = Math.min(W * 0.4, 320), hmax = H * 0.28;
      for (let k = 0; k < 3; k++) {
        const phase = ((t * 0.5 + k / 3) % 1);
        const x0 = W * 0.06 + k * span * 0.55;
        ctx.strokeStyle = 'rgba(94,200,229,0.22)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]); ctx.beginPath();
        for (let u = 0; u <= 1.001; u += 0.02) { const xx = x0 + u * span * 0.5, yy = base - 4 * hmax * u * (1 - u); u === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
        ctx.stroke(); ctx.setLineDash([]);
        const xx = x0 + phase * span * 0.5, yy = base - 4 * hmax * phase * (1 - phase);
        ctx.fillStyle = pos; ctx.beginPath(); ctx.arc(xx, yy, 4, 0, 6.2832); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(190,210,245,0.25)'; ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W * 0.62, base); ctx.stroke();
    }
    size();
    window.addEventListener('resize', () => { size(); if (reduce) draw(t0 + 3000); });
    if (reduce) { draw(t0 + 3000); return; }
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

  buildHeroMeta(); buildIndex(); buildTopics(); buildReferences(); buildUpcoming(); buildFooter(); setupNav(); heroAnimation();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderMath);
  else renderMath();
  window.addEventListener('load', () => { if (!document.querySelector('.katex')) renderMath(); });
})();
