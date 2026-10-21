import { request } from './api.js';
import { drawList, escapeHtml as esc, scanner } from './svgEngine.js';

const money = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
const specs = {
  1: { title: 'Productos disponibles y retirados', path: 'supermercado', description: 'Pasa productos por el escáner y retira elementos específicos del almacén.', inputs: 'Escanear genera nombre secuencial, cantidad (1–20) y precio aleatorio ($1–$500). Para editar: cantidad y precio.', process: 'Insertar al final de la lista enlazada. Al retirar, extraer el nodo de disponibles y pasarlo a retirados.', output: 'Ambas listas, número de productos y suma de unidades disponibles y retiradas.' },
  2: { title: 'Pares e impares', path: 'numeros', description: 'Genera una lista aleatoria y clasifica cada número según su paridad.', inputs: 'Cantidad entera de números: de 1 a 100. Valores aleatorios entre 0 y 999.', process: 'Recorrer la lista original. Si el residuo entre dos es cero, agregar a pares; de otro modo, a impares.', output: 'Lista original y listas de pares e impares, conservando orden y repeticiones.' },
  3: { title: 'Aprobados y reprobados', path: 'alumnos', description: 'Registra alumnos y extrae a quienes tienen una calificación menor que siete.', inputs: 'Nombre del alumno y calificación decimal de 0 a 10.', process: 'Insertar en la lista de alumnos y extraer los menores de 7 hacia la lista de reprobados. Reubicar al corregir una calificación.', output: 'Listas de aprobados (≥ 7) y reprobados (< 7), con sus calificaciones.' },
  4: { title: 'Eliminar y ordenar productos', path: 'catalogo', description: 'Administra una compra con claves únicas, orden alfabético y total exacto.', inputs: 'Clave, nombre y precio no negativo con hasta dos decimales. Clave del producto a eliminar.', process: 'Insertar, editar o eliminar por clave; ordenar reenlazando nodos por nombre con las reglas del español.', output: 'Catálogo ordenado alfabéticamente y suma de los precios de la compra.' },
  5: { title: 'Palabras por letra', path: 'palabras', description: 'Almacena palabras y crea una lista para cada letra inicial que aparezca.', inputs: 'Una palabra de hasta 50 letras. Se admiten acentos y ñ; se ignoran mayúsculas al agrupar.', process: 'Guardar en la lista general y recorrerla creando listas enlazadas por inicial. Se conservan duplicados y orden de llegada.', output: 'Lista 1 general y listas dinámicas por letra, actualizadas al agregar, editar o eliminar.' }
};

const input = (id, label, numeric = false, max = 100) => `<div class="field"><input id="txt${id}" name="${id[0].toLowerCase() + id.slice(1)}" placeholder=" " ${numeric ? 'inputmode="decimal"' : ''} maxlength="${max}" autocomplete="off"><label id="lbl${id}" for="txt${id}">${label}</label></div>`;
const submit = text => `<button id="btnGuardar" class="primary" type="submit">${text}</button><button id="btnCancelarEdicion" class="secondary" type="button" hidden>Cancelar edición</button>`;

function formFor(id) {
  switch (id) {
    case 1: return `<div class="scan-controls">${scanner}<div><p>Un clic, un nuevo producto.</p><button id="btnEscanear" class="primary" type="button">+ Escanear producto</button></div></div><form id="frmSupermercado" class="entry-form" novalidate hidden><h3>Editar producto disponible</h3>${input('Cantidad', 'Cantidad entera', true)}${input('Precio', 'Precio · MXN', true)}${submit('Guardar cambios')}</form>`;
    case 2: return `<form id="frmNumeros" class="entry-form" novalidate>${input('Cantidad', 'Cantidad · 1 a 100', true, 3)}${submit('Generar y clasificar')}</form><p class="field-hint">Cada generación reemplaza las tres listas anteriores. El cero es par.</p>`;
    case 3: return `<form id="frmAlumnos" class="entry-form" novalidate>${input('Nombre', 'Nombre del alumno')}${input('Calificacion', 'Calificación · 0 a 10', true)}${submit('Registrar alumno')}</form>`;
    case 4: return `<form id="frmCatalogo" class="entry-form" novalidate>${input('Clave', 'Clave única', false, 30)}${input('Nombre', 'Nombre del producto')}${input('Precio', 'Precio · MXN', true)}${submit('Agregar producto')}</form><form id="frmEliminarCatalogo" class="entry-form delete-form" novalidate>${input('ClaveEliminar', 'Clave a eliminar', false, 30)}<button id="btnEliminarClave" class="secondary" type="submit">Eliminar por clave</button></form>`;
    case 5: return `<form id="frmPalabras" class="entry-form" novalidate>${input('Texto', 'Escribe una palabra', false, 50)}${submit('Agregar palabra')}</form>`;
  }
}
const actionButtons = item => `<button class="table-action" data-action="editar" data-id="${item.id}" aria-label="Editar ${esc(item.nombre ?? item.texto)}">Editar</button><button class="table-action danger" data-action="eliminar" data-id="${item.id}" aria-label="Eliminar ${esc(item.nombre ?? item.texto)}">Eliminar</button>`;
function table(id, headers, rows) {
  return rows.length ? `<div class="table-scroll"><table id="dgv${id}"><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '';
}
function panel(title, items, rows = '', tone = 'green') {
  return `<article class="result-panel"><h2>${esc(title)} <span class="count-pill">${items.length}</span></h2>${drawList(items, title, tone)}${rows}</article>`;
}
function display(id, state) {
  if (id === 1) {
    const productRows = (items, available) => table(available ? 'Disponibles' : 'Retirados', ['Producto', 'Cantidad', 'Precio unitario', 'Acciones'], items.map(p => `<tr><td>${esc(p.nombre)}</td><td>${p.cantidad}</td><td>${money(p.precio)}</td><td>${available ? `<button class="table-action" data-action="editar" data-id="${p.id}">Editar</button><button class="table-action danger" data-action="eliminar" data-id="${p.id}" aria-label="Retirar ${esc(p.nombre)}">Retirar</button>` : 'Retirado'}</td></tr>`));
    return `<div class="metrics"><span><strong>${state.totalDisponibles}</strong> productos disponibles · ${state.unidadesDisponibles} unidades</span><span><strong>${state.totalRetirados}</strong> productos retirados · ${state.unidadesRetiradas} unidades</span></div>${panel('Disponibles', state.disponibles.map(p => p.nombre), productRows(state.disponibles, true))}${panel('Retirados', state.retirados.map(p => p.nombre), productRows(state.retirados, false), 'amber')}`;
  }
  if (id === 2) return panel('Lista original', state.original) + panel('Pares', state.pares) + panel('Impares', state.impares, '', 'amber');
  if (id === 3) {
    const students = (title, items, tone) => panel(title, items.map(a => `${a.nombre}: ${a.calificacion}`), table(`Alumnos${tone}`, ['Alumno', 'Calificación', 'Acciones'], items.map(a => `<tr><td>${esc(a.nombre)}</td><td>${a.calificacion}</td><td>${actionButtons(a)}</td></tr>`)), tone);
    return students('Aprobados · ≥ 7', state.aprobados, 'green') + students('Reprobados · < 7', state.reprobados, 'amber');
  }
  if (id === 4) return `<div class="metrics"><span>${state.productos.length} productos</span><span id="lblTotal">Total de compra <strong>${money(state.total)}</strong></span></div>${panel('Catálogo ordenado', state.productos.map(p => p.nombre), table('Catalogo', ['Clave', 'Nombre', 'Precio', 'Acciones'], state.productos.map(p => `<tr><td>${esc(p.clave)}</td><td>${esc(p.nombre)}</td><td>${money(p.precio)}</td><td>${actionButtons(p)}</td></tr>`)))}`;
  const wordTable = table('Palabras', ['Palabra', 'Acciones'], state.general.map(p => `<tr><td>${esc(p.texto)}</td><td>${actionButtons(p)}</td></tr>`));
  return panel('Lista 1 · General', state.general.map(p => p.texto), wordTable) + `<div class="word-groups">${state.grupos.map((g, index) => panel(`Lista ${index + 2} · Letra ${g.letra}`, g.palabras.map(p => p.texto))).join('')}</div>`;
}

function validate(data) {
  if (Object.values(data).some(value => !value.trim())) throw new Error('Hay datos faltantes');
  for (const key of ['cantidad', 'precio', 'calificacion']) {
    if (!(key in data)) continue;
    if (!(key === 'cantidad' ? /^[+-]?\d+$/ : /^[+-]?\d+(?:[.,]\d+)?$/).test(data[key].trim())) throw new Error('Introducir sólo números');
  }
}

export function mountListas(container, id, notify) {
  const spec = specs[id];
  container.innerHTML = `<section class="exercise-view"><header class="exercise-heading"><div><span class="eyebrow">LISTAS / EJERCICIO ${String(id).padStart(2, '0')}</span><h1 id="lblTitulo">${spec.title}</h1><p class="intro">${spec.description}</p></div><span class="badge ready">Fase ${id} · Disponible</span></header><details><summary>Descripción del problema y análisis E-P-S</summary><p class="intro">${spec.description}</p><div class="eps">${[['Entradas', spec.inputs], ['Proceso', spec.process], ['Salida', spec.output]].map(([title, text]) => `<div><h3>${title}</h3><p>${text}</p></div>`).join('')}</div></details><div class="workspace-card">${formFor(id)}<p id="lblFormularioEstado" class="field-hint" role="status"></p><p id="lblError" class="form-error" role="alert" hidden></p></div><div class="results-toolbar"><h2>Visualización de las listas</h2><button id="btnReiniciar" class="secondary" type="button" disabled>Reiniciar ejercicio</button></div><div id="pnlResultados" aria-busy="true"><p role="status">Cargando datos…</p></div><dialog id="dlgReiniciar" aria-labelledby="lblReiniciarTitulo"><h2 id="lblReiniciarTitulo">¿Reiniciar este ejercicio?</h2><p>Se borrarán sus listas y contadores. Los demás ejercicios conservarán sus datos.</p><form method="dialog" class="hero-actions"><button id="btnConfirmarReinicio" class="primary" value="confirmar">Reiniciar</button><button id="btnCancelarReinicio" class="secondary" value="cancelar">Cancelar</button></form></dialog></section>`;
  const root = container.firstElementChild;
  const results = root.querySelector('#pnlResultados');
  const form = root.querySelector('form');
  const errorLabel = root.querySelector('#lblError');
  const formStatus = root.querySelector('#lblFormularioEstado');
  const cancel = root.querySelector('#btnCancelarEdicion');
  const reset = root.querySelector('#btnReiniciar');
  const dialog = root.querySelector('#dlgReiniciar');
  let state, editing = null, busy = false;

  function clearEdit() {
    editing = null;
    form.reset();
    const key = form.querySelector('#txtClave');
    if (key) key.readOnly = false;
    cancel.hidden = true;
    if (id === 1) form.hidden = true;
    formStatus.textContent = '';
    errorLabel.hidden = true;
  }
  async function perform(action, message, clear = true) {
    if (busy) return;
    busy = true; errorLabel.hidden = true; results.setAttribute('aria-busy', 'true');
    root.querySelectorAll('button').forEach(b => { b.disabled = true; });
    try {
      const data = await action();
      if (!root.isConnected) return;
      state = data;
      results.innerHTML = display(id, state);
      if (clear) clearEdit();
      if (message) notify(message);
    } catch (error) {
      if (!root.isConnected) return;
      errorLabel.textContent = error.message || 'No se pudo conectar con el servidor'; errorLabel.hidden = false;
      if (!state) results.innerHTML = '<p class="empty-state">No se pudieron cargar las listas. <button id="btnReintentar" class="secondary">Reintentar</button></p>';
    } finally {
      busy = false;
      root.querySelectorAll('button').forEach(b => { b.disabled = false; });
      reset.disabled = !state;
      results.setAttribute('aria-busy', 'false');
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    try { validate(data); } catch (error) { errorLabel.textContent = error.message; errorLabel.hidden = false; return; }
    let path = spec.path;
    if (editing !== null && id !== 4) path += `/${editing}`;
    perform(() => request(path, editing === null ? 'POST' : 'PUT', data), editing === null ? 'Lista actualizada' : 'Cambios guardados');
  });
  cancel.addEventListener('click', clearEdit);
  root.querySelector('#btnEscanear')?.addEventListener('click', () => perform(() => request(spec.path, 'POST'), 'Producto escaneado'));
  root.querySelector('#frmEliminarCatalogo')?.addEventListener('submit', event => {
    event.preventDefault();
    const key = root.querySelector('#txtClaveEliminar').value.trim();
    if (!key) { errorLabel.textContent = 'Hay datos faltantes'; errorLabel.hidden = false; return; }
    perform(() => request(`catalogo?clave=${encodeURIComponent(key)}`, 'DELETE'), 'Producto eliminado');
  });
  results.addEventListener('click', event => {
    if (event.target.closest('#btnReintentar')) { perform(() => request(spec.path), '', false); return; }
    const button = event.target.closest('[data-action]');
    if (!button || busy || !state) return;
    const itemId = Number(button.dataset.id);
    const items = id === 1 ? state.disponibles : id === 3 ? [...state.aprobados, ...state.reprobados] : id === 4 ? state.productos : state.general;
    const item = items.find(p => p.id === itemId);
    if (!item) return;
    if (button.dataset.action === 'eliminar') {
      const path = id === 4 ? `catalogo?clave=${encodeURIComponent(item.clave)}` : `${spec.path}/${itemId}`;
      perform(() => request(path, 'DELETE'), id === 1 ? 'Producto transferido a retirados' : 'Elemento eliminado');
    } else {
      editing = itemId;
      form.hidden = false; cancel.hidden = false;
      for (const element of form.elements) {
        if (!element.name) continue;
        element.value = item[element.name] ?? '';
      }
      if (id === 4) root.querySelector('#txtClave').readOnly = true;
      formStatus.textContent = `Editando: ${item.nombre ?? item.texto}. Guarda los cambios o cancela la edición.`;
      errorLabel.hidden = true;
      form.querySelector('input').focus();
    }
  });
  reset.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('close', () => {
    if (dialog.returnValue !== 'confirmar') return;
    perform(async () => { await request(`${id}/reiniciar`, 'DELETE'); return request(spec.path); }, 'Ejercicio reiniciado');
  });
  perform(() => request(spec.path), '', false);
}
