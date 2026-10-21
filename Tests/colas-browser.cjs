// La prueba del juego usa tiempo real: dura aproximadamente dos minutos.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TEST_BASE_URL || 'http://localhost:5080';
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'], ...(process.env.TEST_BROWSER_CHANNEL ? { channel: process.env.TEST_BROWSER_CHANNEL } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    for (let id = 10; id <= 12; id++) await page.request.delete(`${base}/api/colas/${id}/reiniciar`);
    const ready = () => page.locator('#pnlColaResultados[aria-busy="false"]').waitFor();
    async function go(id) { await page.goto(`${base}/#ejercicio-${id}`); await ready(); }
    async function click(selector) { await page.locator(selector).click(); await ready(); }
    async function closeModal() { await page.locator('#btnCerrarColaInfo').click(); }
    async function error(text) { await page.locator('#lblErrorCola').filter({ hasText: text }).waitFor(); }
    async function finishAnimations() { await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})))); }
    // Iniciar primero para comprobar que el tiempo continúa durante las otras vistas.
    await go(11); await click('#btnIniciarJuego');
    assert.equal(await page.locator('#lblCochesFila').textContent(), '0 / 5'); assert.equal(await page.locator('#btnPintarRojo').isDisabled(), true);
    const initial = (await (await page.request.get(`${base}/api/colas/juego`)).json()).data;
    await go(10);
    await click('#btnAtenderVentanilla'); await error('La cola está vacía');
    await click('#btnAgregarCola'); await error('Hay datos faltantes');
    assert.deepEqual(await page.locator('#cboMovimiento option:not([value=""])').allTextContents(), ['Pago de servicio', 'Depósito', 'Retiro', 'Compra de tiempo-aire', 'Consulta de saldo']);
    for (const [nombre, movimiento] of [['Ana', 'Depósito'], ['Luis', 'Retiro']]) {
      await page.locator('#txtNombre').fill(nombre); await page.locator('#cboMovimiento').selectOption(movimiento); await click('#btnAgregarCola');
      assert.equal(await page.locator('#lblColaInfoTitulo').textContent(), 'SE AGREGA UN CLIENTE AL FINAL DE LA COLA'); await closeModal();
    }
    assert.equal(await page.locator('#dgvClientes tbody tr').count(), 2);
    await page.locator('#dgvClientes tbody tr').first().locator('[data-edit]').click();
    await page.locator('#txtNombre').fill('Ana corregida'); await click('#btnAgregarCola');
    assert.match(await page.locator('#dgvClientes tbody tr').first().textContent(), /Ana corregida/);
    await click('#btnAtenderVentanilla');
    assert.equal(await page.locator('#lblColaInfoTitulo').textContent(), 'TIEMPO DE ESPERA EN LA COLA');
    assert.match(await page.locator('#pnlColaInfo').textContent(), /Ana corregida/); await closeModal();
    assert.match(await page.locator('#lblFrente').textContent(), /turno 2/);
    fs.mkdirSync('TestResults', { recursive: true }); await finishAnimations(); await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'TestResults/colas-banco-desktop.png', fullPage: true });
    await go(12);
    await click('#btnSalidaAuto'); await error('El estacionamiento está vacío');
    await click('#btnEntradaAuto'); await error('Hay datos faltantes');
    for (const [placas, propietario] of [['ABC-123', 'Ana'], ['XYZ-456', 'Luis']]) {
      await page.locator('#txtPlacas').fill(placas); await page.locator('#txtPropietario').fill(propietario); await click('#btnEntradaAuto');
    }
    assert.equal(await page.locator('.circular-svg .linked-node').count(), 2);
    assert.equal(await page.locator('.circular-svg g > svg').count(), 2);
    await page.locator('#txtPlacas').fill('abc-123'); await page.locator('#txtPropietario').fill('Duplicado'); await click('#btnEntradaAuto'); await error('Ya hay un auto con esas placas');
    await page.locator('#dgvAutos tbody tr').first().locator('[data-edit]').click();
    await page.locator('#txtPropietario').fill('<img src=x onerror=alert(1)>'); await click('#btnEntradaAuto');
    assert.equal(await page.locator('#dgvAutos img').count(), 0); assert.match(await page.locator('#dgvAutos').textContent(), /<img/);
    await page.locator('summary').filter({ hasText: 'Inspeccionar enlaces' }).click();
    assert.equal(await page.locator('#dgvVinculos tbody tr').count(), 2);
    await click('#btnSalidaAuto'); assert.equal(await page.locator('#lblColaInfoTitulo').textContent(), 'TICKET DE SALIDA');
    assert.match(await page.locator('#pnlColaInfo').textContent(), /ABC-123/); assert.equal(await page.locator('#pnlColaInfo img').count(), 0);
    await closeModal(); assert.match(await page.locator('#dgvAutos').textContent(), /XYZ-456/);
    await page.reload(); await ready(); assert.equal(await page.locator('#dgvAutos tbody tr').count(), 1);
    await page.locator('#pnlUltimoTicket summary').click(); assert.equal(await page.locator('#lblUltimoImporte').count(), 1);
    assert.equal(await page.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(e => e.id); return ids.length === new Set(ids).size; }), true);
    await page.setViewportSize({ width: 390, height: 844 }); await finishAnimations(); await page.evaluate(() => window.scrollTo(0, 0));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: 'TestResults/colas-estacionamiento-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await go(11);
    await page.locator('.front-car').waitFor({ timeout: 25000 }); await ready();
    let game = (await (await page.request.get(`${base}/api/colas/juego`)).json()).data;
    assert.equal(game.partidaId, initial.partidaId); assert.ok(game.tiempoSegundos >= 20);
    const first = game.coches[0]; const wrong = game.colores.find(color => color !== first.color);
    await click(`#btnPintar${wrong}`); await error('El color no coincide con el solicitado');
    await click(`#btnPintar${first.color}`); assert.equal(await page.locator('#lblPintados strong').textContent(), '1');
    assert.match(await page.locator('.attended-zone').textContent(), new RegExp(first.color));
    const replay = await page.request.post(`${base}/api/colas/juego/pintar`, { data: { partidaId: game.partidaId, cocheId: String(first.id), color: first.color } });
    assert.equal(replay.status(), 409);
    await page.reload(); await ready(); assert.equal(await page.locator('#lblPintados strong').textContent(), '1');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'TestResults/colas-juego-mobile.png', fullPage: true });
    console.log('Colas UI: banco, edición, FIFO, ticket, enlaces y móvil correctos; esperando el final real de la partida (120 s desde el inicio).');
    await page.locator('#lblResumenJuego').waitFor({ timeout: 125000 });
    assert.match(await page.locator('#lblResumenJuego').textContent(), /120 segundos/);
    assert.equal(await page.locator('#lblCochesFila').textContent(), '5 / 5');
    assert.equal(await page.locator('#btnPintarRojo').isDisabled(), true);
    await closeModal(); await click('#btnIniciarJuego');
    assert.match(await page.locator('#lblRecordJuego').textContent(), /1 pintados/);
    await page.locator('#btnReiniciarCola').click(); await page.locator('#btnCancelarReinicioCola').click();
    assert.equal(await page.locator('#lblEstadoJuego').textContent(), 'En curso');
    await page.locator('#btnReiniciarCola').click(); await page.locator('#btnConfirmarCola').click(); await ready();
    await page.waitForFunction(() => document.querySelector('#lblEstadoJuego').textContent === 'Sin iniciar');
    await go(10); assert.match(await page.locator('#dgvClientes').textContent(), /Luis/);
    await go(12); assert.match(await page.locator('#dgvAutos').textContent(), /XYZ-456/);
    await page.route('**/api/colas/estacionamiento', route => route.abort());
    await click('#btnActualizarCola'); await page.locator('#lblErrorCola:not([hidden])').waitFor();
    assert.equal(await page.locator('#dgvAutos tbody tr').count(), 1);
    await page.unroute('**/api/colas/estacionamiento'); await click('#btnActualizarCola'); assert.equal(await page.locator('#lblErrorCola').isVisible(), false);
    assert.deepEqual(errors, []);
    for (let id = 10; id <= 12; id++) await page.request.delete(`${base}/api/colas/${id}/reiniciar`);
    console.log('Colas UI: juego real con llegada automática, color correcto/incorrecto, fin con cinco, récord, recarga y reinicio verificados; sin errores JavaScript.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
