import { apiRequest } from './api.js';
import { carVector, drawCircularQueue, escapeHtml as esc } from './svgEngine.js';

const colors = { Naranja: '#e99842', Rojo: '#cf6056', Verde: '#61a87a', Azul: '#658fcb', Amarillo: '#e4c454', Morado: '#a581bc' };
const date = value => new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Mexico_City' }).format(new Date(value));
const decimal = value => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 7 }).format(value);
const price = value => `$${new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 7 }).format(value)} MXN`;
const specs = {
  10: { title: 'Ventanilla de un banco', path: 'banco', description: 'Forma clientes al final y atiende al primero, respetando su orden de llegada.', inputs: 'Nombre y tipo de movimiento. Turno consecutivo y hora de llegada asignados por el servidor. Capacidad: 10 clientes.', process: 'InsertaCola comprueba ColaLlena; EliminaCola comprueba ColaVacia y extrae el frente. La cola circular reutiliza espacios libres.', output: 'Clientes, índices Frente/Final, confirmación de ingreso y segundos de espera del cliente atendido.' },
  11: { title: 'Juego: pintar coches', path: 'juego', description: 'Pinta el primer coche con su color solicitado antes de que se acumulen cinco.', inputs: 'Iniciar partida y elegir un color de la paleta. Los colores solicitados son aleatorios.', process: 'Llega un coche cada 20 segundos. Cada 3 pintados el intervalo disminuye 2 segundos, hasta 4. Solo se atiende al frente; al llegar a 5 termina la partida.', output: 'Fila animada, coche atendido, próxima llegada, puntuación y tiempo total. El servidor conserva el tiempo aunque cambies de vista.' },
  12: { title: 'Estacionamiento de autos', path: 'estacionamiento', description: 'Administra un callejón con entrada y salida distintas mediante una cola circular doblemente ligada.', inputs: 'Placas únicas y propietario. La hora de entrada la registra el servidor. Sin límite de cupo.', process: 'Insertar al final y extraer por el frente. Cada nodo tiene Siguiente y Anterior; los extremos se conectan entre sí.', output: 'Autos, enlaces en ambos sentidos y ticket con entrada, salida, segundos fraccionarios y cobro exacto de $2.00 por segundo.' }
};
const field = (id, label, max = 100) => `<div class="field"><input id="txt${id}" name="${id[0].toLowerCase() + id.slice(1)}" maxlength="${max}" placeholder=" " autocomplete="off"><label id="lbl${id}" for="txt${id}">${label}</label></div>`;
function forms(id) {
  if (id === 10) return `<form id="frmBanco" class="entry-form" novalidate>${field('Nombre', 'Nombre del cliente')}<div class="field select-field"><label id="lblMovimiento" for="cboMovimiento">Tipo de movimiento</label><select id="cboMovimiento" name="movimiento"><option value="">Selecciona un movimiento</option></select></div><button id="btnAgregarCola" class="primary">Agregar a la cola</button><button id="btnCancelarCola" class="secondary" type="button" hidden>Cancelar edición</button></form><div class="hero-actions"><button id="btnAtenderVentanilla" class="secondary">Atender ventanilla · FIFO</button></div>`;
  if (id === 11) return `<div class="game-rules"><p>El primer coche llega a los 20 segundos. Elige el color indicado debajo del coche del frente. Con cinco coches en fila, la partida termina.</p><button id="btnIniciarJuego" class="primary">Iniciar partida</button></div><fieldset class="palette"><legend>Paleta de colores · pintar solo el frente</legend>${Object.entries(colors).map(([color, hex]) => `<button id="btnPintar${color}" type="button" class="color-button" data-color="${color}" style="--paint:${hex}" disabled><span class="color-dot" aria-hidden="true"></span>${color}</button>`).join('')}</fieldset>`;
  return `<form id="frmEstacionamiento" class="entry-form" novalidate>${field('Placas', 'Placas del auto', 20)}${field('Propietario', 'Nombre del propietario')}<button id="btnEntradaAuto" class="primary">Entrada de auto</button><button id="btnCancelarCola" class="secondary" type="button" hidden>Cancelar edición</button></form><div class="hero-actions"><button id="btnSalidaAuto" class="secondary">Salida del primer auto</button><span class="field-hint">Tarifa: $2.00 por segundo, incluidas fracciones</span></div>`;
}
const table = (id, headers, rows) => rows.length ? `<div class="table-scroll"><table id="dgv${id}"><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '';
function ticketHtml(ticket, importeId = 'lblImporteTicket') {
  return `<div class="parking-ticket"><p class="eyebrow">TICKET DE ESTACIONAMIENTO</p><dl><dt>Folio</dt><dd>${esc(ticket.folio)}</dd><dt>Placas</dt><dd>${esc(ticket.auto.placas)}</dd><dt>Propietario</dt><dd>${esc(ticket.auto.propietario)}</dd><dt>Entrada</dt><dd>${date(ticket.auto.horaEntrada)}</dd><dt>Salida</dt><dd>${date(ticket.horaSalida)}</dd><dt>Segundos transcurridos</dt><dd>${decimal(ticket.segundos)}</dd><dt>Tarifa por segundo</dt><dd>${price(ticket.tarifa)}</dd><dt>Importe (segundos × tarifa)</dt><dd id="${importeId}" class="ticket-total">${price(ticket.importe)}</dd></dl><p class="field-hint">Horas de Ciudad de México. El cobro conserva fracciones de segundo, sin redondearlas a segundos enteros.</p></div>`;
}
function bankView(state) {
  const first = state.clientes[0], last = state.clientes.at(-1);
  return `<div class="metrics"><span id="lblFrente">Frente <strong>${state.frente ?? '∅'}</strong>${first ? ` · turno ${first.turno}` : ''}</span><span id="lblFinal">Final <strong>${state.final ?? '∅'}</strong>${last ? ` · turno ${last.turno}` : ''}</span><span id="lblOcupacion">${state.clientes.length} de ${state.capacidad} lugares</span></div><article class="result-panel"><h2>Fila de clientes · Frente → Final</h2>${state.clientes.length ? `<div class="queue-track" tabindex="0" role="region" aria-label="Clientes en orden FIFO">${state.clientes.map((c, index) => `<div class="client-token queue-arrival"><svg viewBox="0 0 100 85" role="img" aria-label="Cliente turno ${c.turno}"><circle cx="50" cy="24" r="15"/><path d="M20 76v-9a30 30 0 0 1 60 0v9"/></svg><strong>Turno ${c.turno}</strong><span>${esc(c.nombre)}</span><small>${index === 0 ? 'Frente · siguiente' : index === state.clientes.length - 1 ? 'Final' : 'En espera'}</small></div>`).join('<span class="queue-arrow" aria-hidden="true">←</span>')}</div>` : '<p class="empty-state">La cola está vacía. Agrega el primer cliente.</p>'}${table('Clientes', ['Turno', 'Nombre', 'Movimiento', 'Hora de llegada', 'Acciones'], state.clientes.map(c => `<tr><td>${c.turno}</td><td>${esc(c.nombre)}</td><td>${esc(c.movimiento)}</td><td>${date(c.horaLlegada)}</td><td><button class="table-action" data-edit="${c.turno}">Editar</button></td></tr>`))}</article>${state.ultimaAtencion ? `<p class="operation-status">Último cliente atendido: ${esc(state.ultimaAtencion.cliente.nombre)} · espera: ${decimal(state.ultimaAtencion.segundosEspera)} segundos.</p>` : ''}<p class="field-hint">Frente y Final son posiciones del arreglo circular (0 a ${state.capacidad - 1}); el turno identifica al cliente.</p>`;
}
function gameView(state, previousIds) {
  return `<div class="metrics"><span id="lblPintados">Pintados <strong>${state.pintados}</strong></span><span id="lblTiempoJuego">Tiempo <strong>${decimal(state.tiempoSegundos)}</strong> s</span><span id="lblIntervalo">Llegadas cada <strong>${state.intervaloSegundos}</strong> s</span></div><article class="result-panel game-scene"><div class="game-scene-heading"><h2 id="lblEstadoJuego">${state.estado}</h2><span id="lblEnfilandose">Enfilándose${state.proximoEnSegundos === null ? ' · —' : ` · próximo en ${decimal(state.proximoEnSegundos)} s`}</span></div><div class="attended-zone"><span class="eyebrow">ATENDIDO</span>${state.atendido ? `${carVector(colors[state.atendido.color], `Coche atendido: ${state.atendido.color}`)}<span>Coche #${state.atendido.id} · ${esc(state.atendido.color)}</span>` : '<p>Aquí aparecerá el último coche pintado.</p>'}</div><h3>Fila de coches <span id="lblCochesFila">${state.coches.length} / 5</span></h3><div class="queue-track car-track" role="region" tabindex="0" aria-label="Coches por orden de llegada">${state.coches.length ? state.coches.map((c, index) => `<article class="car-token ${index === 0 ? 'front-car' : ''} ${previousIds.has(c.id) ? '' : 'queue-arrival'}" data-car-id="${c.id}"><span>${index === 0 ? 'FRENTE · pinta este' : `En espera · #${c.id}`}</span>${carVector('#c1cbbb', `Coche ${c.id} solicita ${c.color}`)}<strong><span class="requested-color" style="background:${colors[c.color]}" aria-hidden="true"></span>${esc(c.color)}</strong></article>`).join('') : '<p class="empty-state">No hay coches en espera.</p>'}</div></article><p class="field-hint" id="lblRecordJuego">Mejor partida: ${state.mejorPuntaje} pintados · ${decimal(state.recordTiempoSegundos)} segundos. El tiempo continúa al cambiar de vista o cerrar la página.</p>`;
}
function parkingView(state) {
  return `<div class="metrics"><span id="lblAutos">Autos estacionados <strong>${state.autos.length}</strong></span><span>Salida <strong>${esc(state.autos[0]?.placas ?? '∅')}</strong></span><span>Entrada <strong>${esc(state.autos.at(-1)?.placas ?? '∅')}</strong></span></div><article class="result-panel"><h2>Callejón · cola circular doblemente ligada</h2>${drawCircularQueue(state.autos)}${table('Autos', ['Placas', 'Propietario', 'Hora de entrada', 'Acciones'], state.autos.map(a => `<tr><td>${esc(a.placas)}</td><td>${esc(a.propietario)}</td><td>${date(a.horaEntrada)}</td><td><button class="table-action" data-edit="${a.id}">Editar</button></td></tr>`))}<details><summary>Inspeccionar enlaces Siguiente / Anterior</summary>${table('Vinculos', ['Nodo', 'Siguiente', 'Anterior'], state.vinculos.map(v => `<tr><td>${esc(v.placas)}</td><td>${esc(v.siguiente)}</td><td>${esc(v.anterior)}</td></tr>`))}</details></article>${state.ultimoTicket ? `<details id="pnlUltimoTicket"><summary>Consultar el último ticket</summary>${ticketHtml(state.ultimoTicket, 'lblUltimoImporte')}</details>` : ''}`;
}

export function mountColas(container, id, notify) {
  const spec = specs[id]; const abort = new AbortController();
  let state = null, busy = false, editing = null, timer = null, shownGame = null;
  const call = (path = spec.path, method = 'GET', data) => apiRequest('colas', path, method, data, abort.signal);
  container.innerHTML = `<section class="exercise-view"><header class="exercise-heading"><div><span class="eyebrow">COLAS / EJERCICIO ${id - 9}</span><h1 id="lblTitulo">${spec.title}</h1><p class="intro">${spec.description}</p></div><span class="badge ready">Fase ${id} · Disponible</span></header><details><summary>Descripción del problema y análisis E-P-S</summary><p class="intro">${spec.description}</p><div class="eps">${[['Entradas', spec.inputs], ['Proceso', spec.process], ['Salida', spec.output]].map(([title, text]) => `<div><h3>${title}</h3><p>${text}</p></div>`).join('')}</div></details><div class="workspace-card">${forms(id)}<p id="lblEdicionCola" class="field-hint" role="status"></p><p id="lblErrorCola" class="form-error" role="alert" hidden></p></div><div class="results-toolbar"><h2>Laboratorio FIFO</h2><div class="queue-tools"><button id="btnActualizarCola" class="secondary">Actualizar</button><button id="btnReiniciarCola" class="secondary" disabled>Reiniciar ejercicio</button></div></div><div id="pnlColaResultados" aria-busy="true"><p role="status">Cargando cola…</p></div><dialog id="dlgColaInfo" aria-labelledby="lblColaInfoTitulo"><h2 id="lblColaInfoTitulo"></h2><div id="pnlColaInfo"></div><form method="dialog"><button id="btnCerrarColaInfo" class="primary">Entendido</button></form></dialog><dialog id="dlgReiniciarCola" aria-labelledby="lblReinicioCola"><h2 id="lblReinicioCola">¿Reiniciar este ejercicio?</h2><p>Se borrarán sus datos, contadores y resultados. Los otros ejercicios conservarán sus datos.</p><form method="dialog" class="hero-actions"><button id="btnConfirmarCola" class="primary" value="confirmar">Reiniciar</button><button id="btnCancelarReinicioCola" class="secondary" value="cancelar">Cancelar</button></form></dialog></section>`;
  const root = container.firstElementChild;
  const results = root.querySelector('#pnlColaResultados');
  const errorLabel = root.querySelector('#lblErrorCola');
  const reset = root.querySelector('#btnReiniciarCola');
  const dialog = root.querySelector('#dlgColaInfo');
  const resetDialog = root.querySelector('#dlgReiniciarCola');
  const form = root.querySelector('.workspace-card form');
  const modal = (title, html) => {
    root.querySelector('#lblColaInfoTitulo').textContent = title; root.querySelector('#pnlColaInfo').innerHTML = html;
    if (!dialog.open) dialog.showModal();
  };
  function clearEdit() {
    editing = null; form?.reset();
    root.querySelector('#lblEdicionCola').textContent = '';
    const button = root.querySelector('#btnCancelarCola'); if (button) button.hidden = true;
    const save = root.querySelector(id === 10 ? '#btnAgregarCola' : '#btnEntradaAuto');
    if (save) save.textContent = id === 10 ? 'Agregar a la cola' : 'Entrada de auto';
  }
  function buttons() {
    root.querySelectorAll('button').forEach(button => { button.disabled = busy; });
    reset.disabled = busy || !state;
    if (id === 11) {
      root.querySelector('#btnIniciarJuego').disabled = busy || !state || state.estado === 'En curso';
      root.querySelectorAll('[data-color]').forEach(button => { button.disabled = busy || !state || state.estado !== 'En curso' || !state.coches.length; });
    }
  }
  function show(data) {
    const previousIds = new Set(state?.coches?.map(c => c.id) ?? []);
    state = data;
    results.innerHTML = id === 10 ? bankView(state) : id === 11 ? gameView(state, previousIds) : parkingView(state);
    if (id === 10) {
      const select = root.querySelector('#cboMovimiento'); const value = select.value;
      select.innerHTML = '<option value="">Selecciona un movimiento</option>' + state.movimientos.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
      select.value = value;
    }
    if (id === 11 && state.estado === 'Finalizado' && shownGame !== state.partidaId) {
      shownGame = state.partidaId;
      modal('FIN DEL JUEGO · RÉCORD OBTENIDO', `<p>La cola llegó a cinco coches.</p><p id="lblResumenJuego">Cantidad de carros pintados: <strong>${state.pintados}</strong><br>Tiempo total: <strong>${decimal(state.tiempoSegundos)} segundos</strong></p>`);
    }
  }
  async function perform(action, after, poll = false) {
    if (busy) return;
    clearTimeout(timer); busy = true;
    if (!poll) errorLabel.hidden = true;
    results.setAttribute('aria-busy', 'true'); buttons();
    try {
      const data = await action();
      if (!root.isConnected) return;
      show(data); if (after) after(data);
    } catch (error) {
      if (!root.isConnected || error.name === 'AbortError') return;
      errorLabel.textContent = error.message || 'No se pudo conectar con el servidor'; errorLabel.hidden = false;
      if (!poll) notify(errorLabel.textContent);
      if (!state) results.innerHTML = '<p class="empty-state">No se pudo cargar el ejercicio. Usa Actualizar para reintentar.</p>';
    } finally {
      busy = false; buttons(); results.setAttribute('aria-busy', 'false');
      if (root.isConnected && id === 11 && state?.estado === 'En curso') timer = setTimeout(() => perform(() => call(), null, true), 1000);
    }
  }
  form?.addEventListener('submit', event => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(form));
    if (Object.values(data).some(value => !value.trim())) { errorLabel.textContent = 'Hay datos faltantes'; errorLabel.hidden = false; return; }
    const edit = editing !== null;
    perform(() => call(edit ? `${spec.path}/${editing}` : spec.path, edit ? 'PUT' : 'POST', data), updated => {
      clearEdit();
      if (edit) notify('Datos corregidos; se conservó el orden y la hora de llegada');
      else if (id === 10) {
        const c = updated.clientes.at(-1);
        modal('SE AGREGA UN CLIENTE AL FINAL DE LA COLA', `<dl><dt>Turno</dt><dd>${c.turno}</dd><dt>Nombre</dt><dd>${esc(c.nombre)}</dd><dt>Movimiento</dt><dd>${esc(c.movimiento)}</dd><dt>Hora de llegada</dt><dd>${date(c.horaLlegada)}</dd></dl>`);
      } else notify(`Entrada confirmada: ${updated.autos.at(-1).placas}`);
    });
  });
  root.querySelector('#btnCancelarCola')?.addEventListener('click', clearEdit);
  root.querySelector('#btnAtenderVentanilla')?.addEventListener('click', () => perform(() => call('banco/frente', 'DELETE'), updated => {
    clearEdit(); const atencion = updated.ultimaAtencion;
    modal('TIEMPO DE ESPERA EN LA COLA', `<p>Turno ${atencion.cliente.turno} · ${esc(atencion.cliente.nombre)}</p><p>Tiempo de espera: <strong id="lblEsperaCliente">${decimal(atencion.segundosEspera)} segundos</strong></p>`);
  }));
  root.querySelector('#btnSalidaAuto')?.addEventListener('click', () => perform(() => call('estacionamiento/frente', 'DELETE'), updated => { clearEdit(); modal('TICKET DE SALIDA', ticketHtml(updated.ultimoTicket)); }));
  root.querySelector('#btnIniciarJuego')?.addEventListener('click', () => perform(() => call('juego/iniciar', 'POST'), () => notify('Partida iniciada: el primer coche llega en 20 segundos')));
  root.querySelectorAll('[data-color]').forEach(button => button.addEventListener('click', () => {
    if (!state?.coches.length) return;
    const data = { partidaId: state.partidaId, cocheId: String(state.coches[0].id), color: button.dataset.color };
    perform(() => call('juego/pintar', 'POST', data), () => notify('Coche pintado correctamente'));
  }));
  results.addEventListener('click', event => {
    const button = event.target.closest('[data-edit]'); if (!button || busy) return;
    editing = Number(button.dataset.edit);
    const item = id === 10 ? state.clientes.find(c => c.turno === editing) : state.autos.find(a => a.id === editing);
    for (const element of form.elements) if (element.name) element.value = item[element.name] ?? '';
    root.querySelector('#btnCancelarCola').hidden = false;
    root.querySelector('#lblEdicionCola').textContent = 'Editando datos. La posición en la cola y su hora se conservarán.';
    root.querySelector(id === 10 ? '#btnAgregarCola' : '#btnEntradaAuto').textContent = 'Guardar cambios';
    form.querySelector('input').focus();
  });
  root.querySelector('#btnActualizarCola').addEventListener('click', () => perform(() => call()));
  reset.addEventListener('click', () => resetDialog.showModal());
  resetDialog.addEventListener('close', () => {
    if (resetDialog.returnValue === 'confirmar') perform(async () => { await call(`${id}/reiniciar`, 'DELETE'); return call(); }, () => { clearEdit(); notify('Ejercicio reiniciado'); });
  });
  perform(() => call());
  return () => { clearTimeout(timer); abort.abort(); };
}
