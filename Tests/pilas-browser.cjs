// Reinicia únicamente las fases de pilas en una instancia de pruebas.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TEST_BASE_URL || 'http://localhost:5080';
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'], ...(process.env.TEST_BROWSER_CHANNEL ? { channel: process.env.TEST_BROWSER_CHANNEL } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    for (let id = 6; id <= 9; id++) await page.request.delete(`${base}/api/pilas/${id}/reiniciar`);
    const ready = () => page.locator('#pnlPilaResultados[aria-busy="false"]').waitFor();
    async function go(id) { await page.goto(`${base}/#ejercicio-${id}`); await ready(); }
    async function submit(button = '#btnProcesar') { await page.locator(button).click(); await ready(); }
    async function error(message) { await page.locator('#lblErrorPila').filter({ hasText: message }).waitFor(); }
    async function finishAnimations() {
      await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
    }
    await go(6);
    await submit(); await error('Hay datos faltantes');
    await page.locator('#txtTexto').fill('UTM'); await submit();
    assert.equal(await page.locator('#lblResultadoPila').textContent(), 'MTU');
    assert.equal(await page.locator('#pila-inversion .stack-block').count(), 0);
    await page.locator('#btnSiguientePaso').click(); assert.equal(await page.locator('#pila-inversion .stack-block').count(), 1);
    assert.match(await page.locator('#lblOperacion').textContent(), /Push\(U\)/);
    await page.locator('#btnFinalPaso').click(); assert.equal(await page.locator('#lblSalidaParcial').textContent(), 'MTU');
    assert.equal(await page.locator('#pila-inversion .stack-block').count(), 0);
    await page.locator('#btnAnteriorPaso').click(); assert.equal(await page.locator('#lblSalidaParcial').textContent(), 'MT');
    await page.locator('#btnInicioPaso').click();
    await page.locator('#btnReproducir').click();
    await page.waitForFunction(() => Number(document.querySelector('#rngPaso').value) > 0);
    await page.locator('#btnReproducir').click(); assert.equal(await page.locator('#btnReproducir').textContent(), 'Reproducir');
    await page.locator('#txtTexto').fill('a👩‍💻b'); await submit(); assert.equal(await page.locator('#lblResultadoPila').textContent(), 'b👩‍💻a');
    await page.locator('#txtTexto').fill('<svg/onload=alert(1)>'); await submit();
    assert.equal(await page.locator('#lblResultadoPila svg').count(), 0);
    await page.locator('#txtTexto').fill('UTM'); await submit();
    await page.locator('#btnReproducir').click();
    await go(7); // La navegación debe cancelar la reproducción de la vista anterior.
    await page.locator('#txtTexto').fill('Anita lava la tina'); await submit();
    assert.equal(await page.locator('#lblResultadoTitulo').textContent(), 'Sí es un palíndromo');
    await page.locator('#btnSiguientePaso').click(); assert.match(await page.locator('#lblComparacion').textContent(), /A = A/);
    await page.locator('#txtTexto').fill('UTM'); await submit();
    assert.equal(await page.locator('#lblResultadoTitulo').textContent(), 'No es un palíndromo');
    await page.locator('#btnSiguientePaso').click(); assert.equal(await page.locator('#lblComparacion.mismatch').count(), 1);
    await go(8);
    await page.locator('#txtOperando1').fill('abc'); await page.locator('#txtOperando2').fill('1'); await submit(); await error('Introducir sólo números');
    await page.locator('#txtOperando1').fill('592'); await page.locator('#txtOperando2').fill('3784'); await submit();
    assert.equal(await page.locator('#lblResultadoPila').textContent(), '4376');
    assert.equal(await page.locator('#operand-stack1 .stack-block').count(), 3);
    assert.equal(await page.locator('#operand-stack2 .stack-block').count(), 4);
    assert.equal(await page.locator('#result-stack .stack-block').count(), 0);
    await page.locator('#btnSiguientePaso').click();
    assert.equal(await page.locator('#operand-stack1 .stack-block').count(), 2);
    assert.equal(await page.locator('#result-stack .stack-block').count(), 1);
    await page.locator('#btnSiguientePaso').click(); assert.match(await page.locator('#lblOperacion').textContent(), /siguiente acarreo: 1/);
    await page.locator('#btnFinalPaso').click();
    assert.equal(await page.locator('#operand-stack1 .stack-block').count(), 0);
    assert.equal(await page.locator('#result-stack .stack-block').count(), 4);
    await page.reload(); await ready(); assert.equal(await page.locator('#lblResultadoPila').textContent(), '4376');
    // Un error de red debe conservar el resultado previo.
    await page.route('**/api/pilas/suma', route => route.abort());
    await page.locator('#txtOperando1').fill('1'); await page.locator('#txtOperando2').fill('2'); await submit();
    await page.locator('#lblErrorPila:not([hidden])').waitFor();
    assert.equal(await page.locator('#lblResultadoPila').textContent(), '4376');
    await page.unroute('**/api/pilas/suma');
    await page.locator('#txtOperando1').fill('9'.repeat(40)); await page.locator('#txtOperando2').fill('1'); await submit();
    assert.equal(await page.locator('#lblResultadoPila').textContent(), '1' + '0'.repeat(40));
    await page.locator('#btnFinalPaso').click(); assert.equal(await page.locator('#result-stack .stack-block').count(), 12);
    await page.locator('#result-stack summary').click();
    assert.equal((await page.locator('#result-stack .stack-values p').textContent()).split(' · ').length, 41);
    await page.locator('#txtOperando1').fill('592'); await page.locator('#txtOperando2').fill('3784'); await submit();
    await page.locator('#btnSiguientePaso').click(); await page.locator('#btnSiguientePaso').click();
    fs.mkdirSync('TestResults', { recursive: true }); await finishAnimations();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'TestResults/pilas-suma-desktop.png', fullPage: true });
    await go(9);
    await submit('#btnDesapilar'); await error('La pila está vacía');
    await page.locator('#txtValor').fill('2147483648'); await submit('#btnApilar'); await error('Introducir sólo números');
    for (const valor of ['2', '5', '2', '8']) { await page.locator('#txtValor').fill(valor); await submit('#btnApilar'); }
    assert.equal(await page.locator('#lblTope strong').textContent(), '8');
    await page.locator('#txtViejo').fill('2'); await page.locator('#txtNuevo').fill('-5'); await submit('#btnReemplazar');
    assert.equal(await page.locator('#lblReemplazos strong').textContent(), '2');
    assert.deepEqual(await page.locator('#pila-valores .stack-block text').allTextContents(), ['8', '-5', '5', '-5']);
    await submit('#btnDesapilar'); assert.equal(await page.locator('#lblTope strong').textContent(), '-5');
    await page.reload(); await ready(); assert.equal(await page.locator('#lblCantidad strong').textContent(), '3');
    await page.locator('#btnReiniciarPila').click(); await page.locator('#btnCancelarPila').click(); assert.equal(await page.locator('#lblCantidad strong').textContent(), '3');
    await page.locator('#btnReiniciarPila').click(); await page.locator('#btnConfirmarPila').click(); await ready();
    await page.waitForFunction(() => document.querySelector('#lblCantidad strong').textContent === '0');
    await go(8); assert.equal(await page.locator('#lblResultadoPila').textContent(), '4376');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('.three-stacks .stack-card').count(), 3);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#btnAbrirMenu').click(); await page.locator('#navModulos a[href="#ejercicio-7"]').click(); await ready();
    await page.locator('#txtTexto').fill('¿Acaso hubo búhos acá?'); await submit();
    assert.equal(await page.locator('#lblResultadoTitulo').textContent(), 'Sí es un palíndromo');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#btnSiguientePaso').click(); await finishAnimations();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'TestResults/pilas-palindromo-mobile.png', fullPage: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await go(6); await page.locator('#btnFinalPaso').click(); assert.equal(await page.locator('#lblSalidaParcial').textContent(), 'MTU');
    await page.locator('#btnReiniciarPila').click(); await page.locator('#btnConfirmarPila').click(); await ready();
    await page.locator('#lblResultadoPila').waitFor({ state: 'detached' });
    await page.route('**/api/pilas/invertir', route => route.abort());
    await page.reload(); await ready(); await page.locator('#btnReintentarPila').waitFor();
    await page.unroute('**/api/pilas/invertir'); await page.locator('#btnReintentarPila').click(); await ready();
    assert.equal(await page.locator('#lblErrorPila').isVisible(), false);
    await page.goto(`${base}/#ejercicio-10`); await page.locator('#pnlColaResultados[aria-busy="false"]').waitFor();
    assert.deepEqual(errors, []);
    for (let id = 6; id <= 9; id++) await page.request.delete(`${base}/api/pilas/${id}/reiniciar`);
    console.log('Pilas UI: cuatro ejercicios, controles de reproducción, acarreos, reemplazos, validaciones, errores de red, persistencia, reinicio, móvil y movimiento reducido correctos.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
