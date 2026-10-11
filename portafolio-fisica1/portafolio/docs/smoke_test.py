"""Prueba de humo con Playwright: carga la página, captura errores de consola y
ejerce los controles principales. Ejecutar:  python3 docs/smoke_test.py"""
import sys, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.on('pageerror', lambda e: errors.append('PAGEERROR ' + str(e)))
    pg.on('console', lambda m: errors.append('CONSOLE ' + m.text) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.goto('file://' + str(root / 'index.html'))
    pg.wait_for_timeout(800)
    print('secciones:', pg.eval_on_selector_all('section.topic', 'els => els.map(e => e.id)'))
    print('tarjetas indice:', pg.locator('.index-card').count(), '| referencias:', pg.locator('#refList li').count())
    # Tema 1
    pg.click('#t1-play'); pg.wait_for_timeout(900); pg.click('#t1-pause')
    print('T1 t=', pg.inner_text('#t1-tnow'), 'vx=', pg.inner_text('#t1-vx'), 'L=', pg.inner_text('#t1-L'))
    pg.select_option('#t1-route', 'Z'); pg.wait_for_timeout(200); print('T1 zigzag T=', pg.inner_text('#t1-T'))
    # Tema 2
    pg.fill('#t2-v0', '10'); pg.dispatch_event('#t2-v0', 'input'); print('T2 hmax(v0=10,g=9.81)=', pg.inner_text('#t2-hmax'))
    pg.fill('#t2-g', '3.7'); pg.dispatch_event('#t2-g', 'input'); print('T2 hmax(g=3.7)=', pg.inner_text('#t2-hmax'), 'tvuelo=', pg.inner_text('#t2-tfl'))
    pg.click('#t2-play'); pg.wait_for_timeout(600); print('T2 y(t)=', pg.inner_text('#t2-y'))
    pg.click('#t2-apply'); print('T2 diseño g=', pg.inner_text('#t2-dg'))
    # Tema 3
    print('T3 ac(g)=', pg.inner_text('#t3-o-g'), 'r=', pg.inner_text('#t3-o-r'))
    pg.check('input[name="t3-mode"][value="r"]'); pg.fill('#t3-rpm', '2'); pg.dispatch_event('#t3-rpm', 'input')
    print('T3 modo r: r=', pg.inner_text('#t3-o-r'), 'g=', pg.inner_text('#t3-o-g'))
    # Tema 4
    print('T4 mu=', pg.inner_text('#t4-o-mu'), 'ventana=', pg.inner_text('#t4-o-lo'), '-', pg.inner_text('#t4-o-hi'), 'perdida transf=', pg.inner_text('#t4-o-loss'))
    # Tema 5
    print('T5 F=', pg.inner_text('#t5-o-f'), 'W=', pg.inner_text('#t5-o-w'))
    pg.screenshot(path='/tmp/full.png', full_page=False)
    # Móvil
    m = b.new_page(viewport={'width': 390, 'height': 800}); m.on('pageerror', lambda e: errors.append('MOBILE ' + str(e)))
    m.goto('file://' + str(root / 'index.html')); m.wait_for_timeout(500)
    sw = m.evaluate('document.documentElement.scrollWidth'); print('móvil scrollWidth', sw, '(debe ser 390)')
    m.screenshot(path='/tmp/mobile.png')
    b.close()
print('ERRORES:', errors if errors else 'ninguno')
sys.exit(1 if errors else 0)
