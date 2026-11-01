/* ==========================================================================
   registry.js — Registro de temas y citas.
   Cada archivo js/topics/temaN-*.js llama a Portfolio.register({...}) con:
     id        'tema-1'            (ancla de la sección)
     number    1                   (orden en el índice)
     title     'Título EXACTO según la consigna'
     resource  'Visualización de datos'   (tipo de recurso prescrito)
     concepts  ['cinemática 2D', ...]
     summary   'frase corta para la tarjeta del índice'
     accent    'pos' | 'vel' | 'acc' | 'force' | 'result'
     html()    → string con el contenido de la sección
     init(el)  → enlaza simulaciones/gráficas dentro de la sección ya montada
   Para agregar un tema: crear su archivo, añadir su <script> en index.html
   (antes de script.js) y quitarlo de data/upcoming.js. No hay que tocar nada más.
   ========================================================================== */
(function (root) {
  'use strict';
  const topics = [];
  /** Unidad temática de cada avance (agrupa índice, menú y mapa de conexiones). */
  const UNITS = { 'Avance 1': 'Cinemática y dinámica', 'Avance 2': 'Leyes de conservación y gravitación' };
  const byId = (id) => (root.REFERENCES || []).find((r) => r.id === id);

  function register(topic) {
    ['id', 'number', 'title', 'resource', 'html'].forEach((k) => {
      if (!topic[k]) throw new Error('Tema inválido: falta «' + k + '»');
    });
    if (topics.some((t) => t.id === topic.id)) throw new Error('Tema duplicado: ' + topic.id);
    topics.push(topic);
    topics.sort((a, b) => a.number - b.number);
  }

  /** Cita en texto (Autor, año) enlazada a la referencia. Avisa en consola si la clave no existe. */
  function cite(...ids) {
    return ids.map((id) => {
      const r = byId(id);
      if (!r) { console.warn('Referencia desconocida:', id); return '<span class="cite missing">(¿' + id + '?)</span>'; }
      return `<a class="cite" href="#ref-${id}">(${r.cite})</a>`;
    }).join(' ');
  }


  /** Cabecera estándar de un tema: número, título exacto, conceptos y recurso prescrito. */
  function head(t) {
    return `<div class="topic-head">
      <span class="topic-num">Tema ${t.number} de ${topics.length} · ${t.avance || 'Avance 1'} · ${UNITS[t.avance || 'Avance 1'] || ''}</span>
      <h2 id="${t.id}-title">${t.title}</h2>
      <ul class="chips">${(t.concepts || []).map((c) => `<li class="chip">${c}</li>`).join('')}<li class="chip res">Recurso prescrito: ${t.resource}</li></ul>
    </div>`;
  }

  /** Lista de conexiones con otros temas: [{to:'tema-2', text:'…'}] */
  function connections(items) {
    return `<div class="tblock"><h3>Conexiones con otros temas</h3><ul class="connections">${items.map((c) => {
      const t = topics.find((x) => x.id === c.to);
      const label = t ? `Tema ${t.number}` : c.to;
      return `<li><a href="#${c.to}">${label}</a> — ${c.text}</li>`;
    }).join('')}</ul></div>`;
  }

  /** Fuentes usadas en el tema, con enlace a la lista global de referencias. */
  function sources(ids) {
    return `<div class="tblock"><h3>Fuentes del tema</h3><ul>${ids.map((id) => {
      const r = byId(id);
      return r ? `<li><a href="#ref-${id}">${r.cite}</a> — ${r.apa.replace(/<[^>]+>/g, '').slice(0, 150)}…</li>` : `<li>¿${id}?</li>`;
    }).join('')}</ul></div>`;
  }

  root.Portfolio = { topics, register, cite, byId, head, connections, sources, UNITS };
})(window);
