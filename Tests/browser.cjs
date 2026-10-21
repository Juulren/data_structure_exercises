// Ejecutar en una instancia de pruebas; reinicia el estado de los ejercicios.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TEST_BASE_URL || 'http://localhost:5080';
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'], ...(process.env.TEST_BROWSER_CHANNEL ? { channel: process.env.TEST_BROWSER_CHANNEL } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (let id = 1; id <= 5; id++) await page.request.delete(`${base}/api/listas/${id}/reiniciar`);
    async function ready() { await page.locator('#pnlResultados[aria-busy="false"]').waitFor(); }
    async function go(id) { await page.goto(`${base}/#ejercicio-${id}`); await ready(); }
    async function save() { await page.locator('#btnGuardar').click(); await ready(); }
    async function finishAnimations() {
      await page.evaluate(() => Promise.all(document.getAnimations()
        .filter(animation => animation.effect.getComputedTiming().iterations !== Infinity)
        .map(animation => animation.finished.catch(() => {}))));
    }
    async function error(message) { await page.getByRole('alert').filter({ hasText: message }).waitFor(); }
    await go(1);
    await page.locator('#btnEscanear').click(); await ready();
    assert.equal(await page.locator('#dgvDisponibles tbody tr').count(), 1);
    await page.locator('#dgvDisponibles [data-action="editar"]').click();
    await page.locator('#txtCantidad').fill('4'); await page.locator('#txtPrecio').fill('5,25'); await save();
    await page.locator('#dgvDisponibles [data-action="eliminar"]').click(); await ready();
    assert.equal(await page.locator('#dgvRetirados tbody tr').count(), 1);
    assert.equal(await page.locator('#dgvDisponibles').count(), 0);
    await go(2);
    await save(); await error('Hay datos faltantes');
    await page.locator('#txtCantidad').fill('abc'); await save(); await error('Introducir sólo números');
    await page.locator('#txtCantidad').fill('10'); await save();
    assert.equal(await page.locator('.result-panel').count(), 3);
    assert.equal(await page.locator('.result-panel').first().locator('.linked-node').count(), 10);
    await go(3);
    await page.locator('#txtNombre').fill('Ana'); await page.locator('#txtCalificacion').fill('6,99'); await save();
    assert.equal(await page.locator('#dgvAlumnosamber tbody tr').count(), 1);
    await page.locator('#dgvAlumnosamber [data-action="editar"]').click();
    await page.locator('#txtCalificacion').fill('7'); await save();
    assert.equal(await page.locator('#dgvAlumnosgreen tbody tr').count(), 1);
    assert.equal(await page.locator('#dgvAlumnosamber').count(), 0);
    await go(4);
    for (const [clave, nombre, precio] of [['Z', 'Zanahoria', '0.20'], ['A', 'Arroz', '0.10']]) {
      await page.locator('#txtClave').fill(clave); await page.locator('#txtNombre').fill(nombre); await page.locator('#txtPrecio').fill(precio); await save();
    }
    assert.match(await page.locator('#dgvCatalogo tbody tr').first().textContent(), /Arroz/);
    assert.match(await page.locator('#lblTotal').textContent(), /0\.30/);
    await page.locator('#txtClaveEliminar').fill('Z'); await page.locator('#btnEliminarClave').click(); await ready();
    assert.equal(await page.locator('#dgvCatalogo tbody tr').count(), 1);
    await page.locator('#dgvCatalogo [data-action="editar"]').click();
    assert.equal(await page.locator('#txtClave').getAttribute('readonly'), '');
    await page.locator('#txtNombre').fill('<img src=x onerror=alert(1)>'); await page.locator('#txtPrecio').fill('4.50'); await save();
    assert.equal(await page.locator('#dgvCatalogo img').count(), 0);
    assert.match(await page.locator('#dgvCatalogo').textContent(), /<img/);
    await go(5);
    for (const palabra of ['Fresa', 'fresca', 'Orilla', 'Oso', 'Peso', 'Pez', 'Ñandú']) { await page.locator('#txtTexto').fill(palabra); await save(); }
    assert.equal(await page.locator('.word-groups .result-panel').count(), 4);
    await page.locator('#dgvPalabras tbody tr').last().locator('[data-action="editar"]').click();
    await page.locator('#txtTexto').fill('Zorro'); await save();
    assert.match(await page.locator('.word-groups').textContent(), /Letra Z/);
    await page.reload(); await ready(); assert.equal(await page.locator('#dgvPalabras tbody tr').count(), 7);
    await page.locator('#btnReiniciar').click(); await page.locator('#btnCancelarReinicio').click();
    assert.equal(await page.locator('#dgvPalabras tbody tr').count(), 7);
    await page.locator('#btnReiniciar').click(); await page.locator('#btnConfirmarReinicio').click(); await ready();
    await page.locator('#dgvPalabras').waitFor({ state: 'detached' });
    await page.locator('#txtTexto').fill('Fresa'); await save();
    fs.mkdirSync('TestResults', { recursive: true });
    await finishAnimations();
    await page.screenshot({ path: 'TestResults/listas-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#btnAbrirMenu').click();
    await page.locator('#navModulos a[href="#ejercicio-3"]').click(); await ready();
    assert.equal(await page.locator('#btnAbrirMenu').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#dgvAlumnosgreen tbody tr').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('#navEjercicios').evaluate(el => el.inert), true);
    await finishAnimations();
    await page.screenshot({ path: 'TestResults/listas-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await go(1); assert.equal(await page.locator('#dgvRetirados tbody tr').count(), 1);
    await page.locator('summary').click(); assert.equal(await page.locator('.eps').isVisible(), true);
    await page.goto(`${base}/#ejercicio-6`); await page.getByText('Pendiente de implementación · Fase 6').waitFor();
    assert.deepEqual(errors, []);
    for (let id = 1; id <= 5; id++) await page.request.delete(`${base}/api/listas/${id}/reiniciar`);
    console.log('UI: cinco ejercicios, edición, retiro, clasificación, validaciones, recarga, reinicio, navegación y móvil correctos; sin errores JavaScript.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
