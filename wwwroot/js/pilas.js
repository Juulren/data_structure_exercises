import { apiRequest } from './api.js';
import { drawStack, escapeHtml as esc } from './svgEngine.js';

const specs = {
  6: { title: 'Invertir palabra', path: 'invertir', description: 'Descubre cómo una pila invierte el orden: el último carácter que entra es el primero que sale.', inputs: 'Una palabra de hasta 80 caracteres visibles, sin espacios interiores. Se conservan mayúsculas, acentos y emojis.', process: 'Insertar cada carácter con Push y extraer todos con Pop. Los caracteres Unicode combinados se mantienen unidos.', output: 'Palabra invertida y recorrido animado de las operaciones LIFO.' },
  7: { title: 'Palíndromo', path: 'palindromo', description: 'Compara una palabra, número o frase con los valores que salen de una pila.', inputs: 'Hasta 120 letras o números normalizados. Se ignoran mayúsculas, espacios, signos y acentos; la ñ se conserva.', process: 'Apilar el texto normalizado. Comparar cada carácter original con el siguiente Pop y registrar las coincidencias.', output: 'Resultado de palíndromo y comparación paso a paso, incluso si hay diferencias.' },
  8: { title: 'Suma de números grandes', path: 'suma', description: 'Suma enteros que superan los tipos numéricos convencionales utilizando exactamente tres pilas.', inputs: 'Dos enteros no negativos de hasta 1000 dígitos cada uno, sin signos ni separadores. Se normalizan ceros iniciales.', process: 'Apilar dígitos de ambos operandos. Extraer unidades, sumar con acarreo y apilar el dígito resultante en la tercera pila.', output: 'Suma exacta, tres pilas SVG y detalle de las sumas parciales con sus acarreos.' },
  9: { title: 'Reemplazar valor', path: 'valores', description: 'Apila enteros y sustituye todas las apariciones de un valor sin alterar el orden de la pila.', inputs: 'Enteros de 32 bits (−2147483648 a 2147483647). Hasta 100 valores. Valor viejo y valor nuevo.', process: 'Desapilar hacia una pila auxiliar, reemplazando coincidencias. Devolver los valores mediante Pop y Push para restaurar el orden.', output: 'Pila actual, tope, último valor retirado y cantidad de coincidencias reemplazadas.' }
};
const field = (id, label, max, numeric = false, value = '') => `<div class="field"><input id="txt${id}" name="${id[0].toLowerCase() + id.slice(1)}" placeholder=" " maxlength="${max}" ${numeric ? 'inputmode="numeric"' : ''} value="${esc(value)}" autocomplete="off"><label id="lbl${id}" for="txt${id}">${label}</label></div>`;
function formFor(id) {
  if (id === 6 || id === 7) return `<form id="frm${id === 6 ? 'Invertir' : 'Palindromo'}" class="entry-form" novalidate>${field('Texto', id === 6 ? 'Palabra · ejemplo: UTM' : 'Palabra, número o frase', 1000)}<button id="btnProcesar" class="primary">${id === 6 ? 'Invertir con pila' : 'Evaluar palíndromo'}</button></form>`;
  if (id === 8) return `<form id="frmSuma" class="entry-form" novalidate>${field('Operando1', 'Primer número · ejemplo: 592', 1000, true)}<span aria-hidden="true">+</span>${field('Operando2', 'Segundo número · ejemplo: 3784', 1000, true)}<button id="btnProcesar" class="primary">Sumar con tres pilas</button></form><p class="field-hint">Se aceptan dígitos del 0 al 9. No se convierte el número completo a int, long ni decimal.</p>`;
  return `<form id="frmApilar" class="entry-form" novalidate>${field('Valor', 'Entero a apilar', 11, true)}<button id="btnApilar" class="primary">Push · Apilar</button><button id="btnDesapilar" class="secondary" type="button">Pop · Retirar tope</button></form><form id="frmReemplazar" class="entry-form delete-form" novalidate>${field('Viejo', 'Valor viejo', 11, true)}${field('Nuevo', 'Valor nuevo', 11, true)}<button id="btnReemplazar" class="primary">Reemplazar coincidencias</button></form>`;
}
function controls(max, cursor) {
  return `<div class="trace-controls" aria-label="Controles del proceso"><div class="trace-buttons"><button id="btnInicioPaso" class="secondary" ${cursor === 0 ? 'disabled' : ''}>↤ Inicio</button><button id="btnAnteriorPaso" class="secondary" ${cursor === 0 ? 'disabled' : ''}>← Anterior</button><button id="btnReproducir" class="primary">Reproducir</button><button id="btnSiguientePaso" class="secondary" ${cursor === max ? 'disabled' : ''}>Siguiente →</button><button id="btnFinalPaso" class="secondary" ${cursor === max ? 'disabled' : ''}>Final ↦</button></div><label id="lblPaso" for="rngPaso">Paso ${cursor} de ${max}</label><input id="rngPaso" type="range" min="0" max="${max}" value="${cursor}" aria-labelledby="lblPaso"></div>`;
}
function traceTable(headers, rows, caption) {
  return `<div class="table-scroll"><table id="dgvPasos"><caption>${esc(caption)}</caption><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function valuesView(state) {
  return `<div class="metrics"><span id="lblTope">Tope <strong>${state.tope ?? '∅'}</strong></span><span id="lblCantidad">Elementos <strong>${state.cantidad}</strong></span><span id="lblReemplazos">Coincidencias reemplazadas <strong>${state.reemplazos}</strong></span></div><div class="result-panel"><p class="operation-status" role="status">${state.ultimoRetirado === null ? 'El tope es el próximo valor que saldrá con Pop.' : `Último Pop: ${state.ultimoRetirado}`}</p>${drawStack(state.elementos, 'Pila de enteros', 'pila-valores')}</div>`;
}
function frames(id, state, cursor) {
  if (id === 6) {
    const n = state.caracteres.length;
    const pushing = cursor <= n;
    const popped = Math.max(0, cursor - n);
    const stack = pushing ? state.caracteres.slice(0, cursor).reverse() : state.extraidos.slice(popped);
    const operation = cursor === 0 ? 'Pila vacía. Comienza insertando los caracteres.' : pushing ? `Push(${state.caracteres[cursor - 1]}) · se inserta en el tope.` : `Pop() → ${state.extraidos[popped - 1]} · se concatena a la salida.`;
    return `<p id="lblOperacion" class="operation-status" role="status">${esc(operation)}</p><div class="stack-grid two-stacks">${drawStack(stack, 'Pila de caracteres', 'pila-inversion')}<article class="output-card"><h3>Salida construida</h3><p id="lblSalidaParcial" class="big-output">${esc(state.extraidos.slice(0, popped).join('')) || '∅'}</p><p class="field-hint">${popped} de ${n} caracteres extraídos</p><h3>Palabra original</h3><p class="text-output">${esc(state.original)}</p></article></div>`;
  }
  if (id === 7) {
    const paso = state.pasos[cursor - 1];
    const operation = paso ? `Comparación ${cursor}: ${paso.izquierda} frente a Pop() → ${paso.extraido}. ${paso.coincide ? 'Coinciden.' : 'Son diferentes.'}` : 'Texto normalizado apilado. Compara el primer carácter con el próximo Pop.';
    const first = Math.max(0, cursor - 10);
    const rows = state.pasos.slice(first, first + 12).map((p, index) => `<tr ${p.posicion === cursor ? 'class="current-step"' : ''}><td>${p.posicion}</td><td>${esc(p.izquierda)}</td><td>${esc(p.extraido)}</td><td>${p.posicion <= cursor ? (p.coincide ? '✓ Coinciden' : '✕ Diferentes') : 'Pendiente'}</td></tr>`);
    return `<p id="lblOperacion" class="operation-status" role="status">${esc(operation)}</p><div class="stack-grid two-stacks">${drawStack(state.caracteres.slice().reverse().slice(cursor), 'Pila para comparar', 'pila-palindromo')}<article class="output-card"><h3>Texto normalizado</h3><p class="text-output">${esc(state.normalizado)}</p><p class="field-hint">Se ignoran signos y acentos; la ñ se distingue de la n.</p><p id="lblComparacion" class="comparison ${paso && !paso.coincide ? 'mismatch' : ''}">${paso ? `${esc(paso.izquierda)} ${paso.coincide ? '=' : '≠'} ${esc(paso.extraido)}` : '¿Coinciden?'}</p></article></div>${traceTable(['Posición', 'Original', 'Pop', 'Comparación'], rows, 'Comparaciones cercanas al paso seleccionado')}`;
  }
  const paso = state.pasos[cursor - 1];
  const resultStack = state.pasos.slice(0, cursor).map(p => p.digito).reverse();
  const operation = paso ? `${paso.digito1 ?? 0} + ${paso.digito2 ?? 0} + acarreo ${paso.acarreoEntrada} = ${paso.total}. Push(${paso.digito}); siguiente acarreo: ${paso.acarreoSalida}.` : 'Operandos apilados con las unidades en el tope. Resultado inicialmente vacío.';
  const first = Math.max(0, cursor - 8);
  const rows = state.pasos.slice(first, first + 10).map(p => `<tr ${p.columna === cursor ? 'class="current-step"' : ''}><td>${p.columna}</td><td>${p.digito1 ?? '—'}</td><td>${p.digito2 ?? '—'}</td><td>${p.acarreoEntrada}</td><td>${p.total}</td><td>${p.digito}</td><td>${p.acarreoSalida}</td></tr>`);
  return `<p id="lblOperacion" class="operation-status" role="status">${esc(operation)}</p><div class="stack-grid three-stacks">${drawStack(state.pila1.slice(Math.min(cursor, state.pila1.length)), 'operand-stack1', 'operand-stack1')}${drawStack(state.pila2.slice(Math.min(cursor, state.pila2.length)), 'operand-stack2', 'operand-stack2')}${drawStack(resultStack, 'result-stack', 'result-stack', 'amber')}</div><p class="field-hint">El resultado se lee haciendo Pop de result-stack: desde el dígito más significativo. Se muestran hasta 12 bloques por pila; despliega la pila completa para ver todos.</p>${traceTable(['Columna', 'Pop 1', 'Pop 2', 'Acarreo entrada', 'Total', 'Push', 'Acarreo salida'], rows, 'Sumas parciales cercanas al paso seleccionado')}`;
}

export function mountPilas(container, id, notify) {
  const spec = specs[id];
  const abort = new AbortController();
  let state = null, cursor = 0, max = 0, busy = false, timer = null;
  const call = (path = spec.path, method = 'GET', data) => apiRequest('pilas', path, method, data, abort.signal);
  container.innerHTML = `<section class="exercise-view"><header class="exercise-heading"><div><span class="eyebrow">PILAS / EJERCICIO ${id - 5}</span><h1 id="lblTitulo">${spec.title}</h1><p class="intro">${spec.description}</p></div><span class="badge ready">Fase ${id} · Disponible</span></header><details><summary>Descripción del problema y análisis E-P-S</summary><p class="intro">${spec.description}</p><div class="eps">${[['Entradas', spec.inputs], ['Proceso', spec.process], ['Salida', spec.output]].map(([title, text]) => `<div><h3>${title}</h3><p>${text}</p></div>`).join('')}</div></details><div class="workspace-card">${formFor(id)}<p id="lblErrorPila" class="form-error" role="alert" hidden></p></div><div class="results-toolbar"><h2>Laboratorio LIFO</h2><button id="btnReiniciarPila" class="secondary" disabled>Reiniciar ejercicio</button></div><div id="pnlPilaResultados" aria-busy="true"><p role="status">Cargando pila…</p></div><dialog id="dlgReiniciarPila" aria-labelledby="lblReinicioPila"><h2 id="lblReinicioPila">¿Reiniciar este ejercicio?</h2><p>Se eliminará el resultado o la pila de esta fase. Los demás ejercicios conservarán sus datos.</p><form method="dialog" class="hero-actions"><button id="btnConfirmarPila" class="primary" value="confirmar">Reiniciar</button><button id="btnCancelarPila" class="secondary" value="cancelar">Cancelar</button></form></dialog></section>`;
  const root = container.firstElementChild;
  const results = root.querySelector('#pnlPilaResultados');
  const errorLabel = root.querySelector('#lblErrorPila');
  const reset = root.querySelector('#btnReiniciarPila');
  const dialog = root.querySelector('#dlgReiniciarPila');
  function stop() {
    clearTimeout(timer); timer = null;
    const button = root.querySelector('#btnReproducir');
    if (button) { button.textContent = 'Reproducir'; button.setAttribute('aria-pressed', 'false'); }
  }
  function frame() {
    root.querySelector('#pnlFotograma').innerHTML = frames(id, state, cursor);
    root.querySelector('#rngPaso').value = String(cursor);
    root.querySelector('#lblPaso').textContent = `Paso ${cursor} de ${max}`;
    root.querySelector('#btnInicioPaso').disabled = cursor === 0;
    root.querySelector('#btnAnteriorPaso').disabled = cursor === 0;
    root.querySelector('#btnSiguientePaso').disabled = cursor === max;
    root.querySelector('#btnFinalPaso').disabled = cursor === max;
  }
  function show() {
    if (id === 9) { results.innerHTML = valuesView(state); return; }
    if (!state) { results.innerHTML = '<p class="empty-state">Introduce los datos para construir la pila y explorar el proceso.</p>'; return; }
    max = id === 6 ? state.caracteres.length * 2 : state.pasos.length;
    cursor = 0;
    const headline = id === 6 ? 'Palabra invertida' : id === 7 ? (state.esPalindromo ? 'Sí es un palíndromo' : 'No es un palíndromo') : 'Resultado exacto';
    const value = id === 6 ? state.invertida : id === 7 ? state.original : state.resultado;
    results.innerHTML = `<article class="result-panel"><div class="result-banner ${id === 7 && !state.esPalindromo ? 'negative' : ''}"><h2 id="lblResultadoTitulo">${headline}</h2><p id="lblResultadoPila" class="big-output">${esc(value)}</p></div>${controls(max, cursor)}<div id="pnlFotograma">${frames(id, state, cursor)}</div></article>`;
  }
  async function perform(action, message, clear = false) {
    if (busy) return;
    stop(); busy = true; errorLabel.hidden = true;
    results.setAttribute('aria-busy', 'true');
    root.querySelectorAll('button').forEach(button => { button.disabled = true; });
    try {
      const data = await action();
      if (!root.isConnected) return;
      state = data; show();
      if (clear) root.querySelectorAll('.workspace-card form').forEach(form => form.reset());
      if (message) notify(message);
    } catch (error) {
      if (!root.isConnected || error.name === 'AbortError') return;
      errorLabel.textContent = error.message || 'No se pudo conectar con el servidor'; errorLabel.hidden = false;
      if (!state) results.innerHTML = '<p class="empty-state">No se pudo cargar el ejercicio. <button id="btnReintentarPila" class="secondary">Reintentar</button></p>';
    } finally {
      busy = false;
      root.querySelectorAll('button').forEach(button => { button.disabled = false; });
      if (state && id !== 9) frame();
      reset.disabled = !state;
      results.setAttribute('aria-busy', 'false');
    }
  }
  function validate(data) {
    if (Object.values(data).some(value => !value.trim())) throw new Error('Hay datos faltantes');
    for (const [key, value] of Object.entries(data)) {
      if (key === 'texto') continue;
      if (!(id === 8 ? /^[0-9]+$/ : /^[+-]?[0-9]+$/).test(value.trim())) throw new Error('Introducir sólo números');
    }
  }
  root.querySelectorAll('.workspace-card form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    try { validate(data); } catch (error) { errorLabel.textContent = error.message; errorLabel.hidden = false; return; }
    const method = form.id === 'frmReemplazar' ? 'PUT' : 'POST';
    perform(() => call(spec.path, method, data), method === 'PUT' ? 'Reemplazo completado; se conservó el orden de la pila' : 'Proceso completado', id === 9);
  }));
  root.querySelector('#btnDesapilar')?.addEventListener('click', () => perform(() => call('valores/tope', 'DELETE'), 'Se retiró el tope de la pila'));
  results.addEventListener('click', event => {
    if (event.target.closest('#btnReintentarPila')) { perform(() => call()); return; }
    const button = event.target.closest('button');
    if (!button || !state || busy || id === 9) return;
    const actions = { btnInicioPaso: 0, btnAnteriorPaso: Math.max(0, cursor - 1), btnSiguientePaso: Math.min(max, cursor + 1), btnFinalPaso: max };
    if (button.id in actions) { stop(); cursor = actions[button.id]; frame(); }
    if (button.id === 'btnReproducir') {
      if (timer !== null) { stop(); return; }
      if (cursor === max) cursor = 0;
      button.textContent = 'Pausar'; button.setAttribute('aria-pressed', 'true');
      function tick() {
        if (!root.isConnected) { stop(); return; }
        cursor = Math.min(max, cursor + 1); frame();
        if (cursor === max) stop();
        else timer = setTimeout(tick, 650);
      }
      timer = setTimeout(tick, 650);
      frame();
    }
  });
  results.addEventListener('input', event => {
    if (event.target.id !== 'rngPaso') return;
    stop(); cursor = Number(event.target.value); frame();
  });
  reset.addEventListener('click', () => { stop(); dialog.showModal(); });
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'confirmar') perform(async () => { await call(`${id}/reiniciar`, 'DELETE'); return call(); }, 'Ejercicio reiniciado', true);
  });
  perform(() => call());
  return () => { stop(); abort.abort(); };
}
