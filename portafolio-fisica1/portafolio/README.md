# Portafolio de Física I — «La física que mueve al software»

Universidad CENFOTEC · FUN-18 Física I · Sección FCV1 · 2026-C3 · **Avance 1** (cinco temas).
Sitio estático (HTML + CSS + JavaScript, sin compilación). Cada tema trae su recurso prescrito:

| Tema | Recurso | Dónde |
|---|---|---|
| 1. Rastreo y navegación de un dron de reparto | Visualización de datos (x, y, v, a vs. t; datos generados de una ruta declarada) | `js/topics/tema1-dron.js` |
| 2. El salto del personaje… | Simulación interactiva (impulso, gravedad, multiplicador de caída, v_x) | `tema2-salto.js` |
| 3. Gravedad artificial por rotación… | Diagrama original SVG + caso numérico (1 g) + calculadora | `tema3-habitat.js` |
| 4. Llantas de Fórmula 1… | Visualización de datos (μ vs. T y F_y vs. N) — **conjunto hipotético, rotulado** | `tema4-llantas.js` |
| 5. El resorte virtual… | Multimedia con análisis (video incrustado + curva F–x) | `tema5-haptico.js` |

## Abrir el sitio
Doble clic en `index.html` (funciona sin servidor) o, mejor, `python3 -m http.server` y abrir `http://localhost:8000`.

### Dependencias externas (CDN)
- **KaTeX 0.16.9** (cdnjs) para las ecuaciones. Sin internet el sitio funciona, pero las ecuaciones se ven como TeX sin renderizar.
- **Google Fonts** (Fraunces, IBM Plex): hay tipografías de respaldo.
- **YouTube (nocookie)** para el video del Tema 5.
Las gráficas son código propio sobre `<canvas>` (`js/charts.js`); no hay otras bibliotecas.

## Antes de entregar (pendiente de usted)
1. Complete `data/site.js` (nombre, URL del sitio, URL del repositorio).
2. **Vea el video del Tema 5** y confirme que el minuto ≈ 09:15 corresponde al mecanismo del gatillo (viene de la reseña de Notebookcheck; yo no pude reproducir el video). Ajuste el texto del análisis si difiere.
3. **Revise los enlaces** de `data/references.js` marcados «verificar enlace manualmente» (no se abrieron al elaborarlos): OpenStax, PX4 (versión en inglés), Mellinger y Kumar, Yuksel et al., NIST, NASA NSSDC, Pacejka. `Milliken y Milliken (1995)` es un libro sin URL; verifique que respalda la sensibilidad de μ a la carga (cita de memoria). El título del artículo de Motorsport Week y del video de TronicsFix son descriptivos: copie los exactos de las páginas.
4. Los datos del Tema 4 son **hipotéticos**: no los presente como mediciones.
5. Cualquier texto que no entienda, no lo entregue: la consigna prohíbe el plagio y usted debe poder explicar cada ecuación.

## Estructura
```
index.html  styles.css  script.js        página, diseño y arranque
js/physics.js      cálculo físico puro (probado con Node)
js/charts.js       gráficas propias en canvas
js/ui.js           sliders, indicadores, tablas, ecuaciones
js/registry.js     registro de temas y citas
js/topics/temaN-*.js   un archivo por tema
data/references.js     bibliografía (APA 7)    data/upcoming.js  temas futuros    data/site.js  datos del sitio
docs/test_physics.js   pruebas numéricas       docs/smoke_test.py  prueba en navegador (Playwright)
```

## Agregar un tema nuevo (Avance 2 / Entrega final)
1. Copie `js/topics/tema5-haptico.js` como `tema6-nombre.js`; cambie `id`, `number`, `title` (exacto de la consigna), `resource`, `html()` e `init()`.
2. Si necesita cálculo nuevo, agréguelo a `js/physics.js` y pruébelo en `docs/test_physics.js`.
3. Agregue sus fuentes a `data/references.js` y cítelas con `${cite('id')}`.
4. Añada `<script src="js/topics/tema6-nombre.js"></script>` en `index.html` antes de `script.js`.
5. Borre su entrada de `data/upcoming.js`. El índice, el menú lateral y las referencias se actualizan solos. No se tocan los temas 1–5.

## Pruebas
```
node docs/test_physics.js          # 25 comprobaciones numéricas
pip install playwright && playwright install chromium
python3 docs/smoke_test.py         # carga la página, mueve controles y busca errores de consola
```
Pruebas hechas durante la elaboración: núcleo físico (Node), carga sin errores de consola, controles de los cinco temas, 136 expresiones TeX sin errores (KaTeX 0.16.9), ausencia de desbordamiento horizontal a 390 px. **No se probó** en Safari/Firefox, con lector de pantalla, ni con el video real.

## Publicar (GitHub Pages)
1. Cree un repositorio **público** en GitHub y suba todo el contenido de esta carpeta (`git init`, `git add .`, `git commit -m "Avance 1"`, `git remote add origin <URL>`, `git push -u origin main`). Haga varios commits a lo largo del trabajo: el historial evidencia la autoría.
2. En el repositorio: *Settings → Pages → Build and deploy → Deploy from a branch → main / (root)*.
3. Espere uno o dos minutos y abra `https://<usuario>.github.io/<repositorio>/`.
4. En Moodle entregue **dos enlaces**: la URL del sitio publicado y la URL del repositorio. Verifique ambos antes de las 11:59 p. m. del sábado 10 de octubre de 2026.
Alternativas: Netlify (arrastrar la carpeta) o Vercel (importar el repositorio); no requieren configuración.
