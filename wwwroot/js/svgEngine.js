export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function drawList(items, label, tone = 'green') {
  if (!items.length) return '<p class="empty-state">Lista vacía · Agrega un elemento para ver sus nodos.</p>';
  const width = Math.max(380, items.length * 150 + 90);
  return `<div class="node-scroll" tabindex="0" role="region" aria-label="${escapeHtml(label)}: diagrama desplazable"><svg class="list-svg ${tone}" width="${width}" height="128" viewBox="0 0 ${width} 128" role="img" aria-label="${escapeHtml(label)}"><title>${escapeHtml(label)}: ${escapeHtml(items.join(' → '))}</title>${items.map((item, index) => {
    const x = 15 + index * 150;
    const text = String(item);
    return `<g class="linked-node"><rect x="${x}" y="30" width="124" height="54" rx="13"/><line x1="${x + 98}" y1="31" x2="${x + 98}" y2="83"/><circle cx="${x + 110}" cy="57" r="3"/><text x="${x + 49}" y="62" text-anchor="middle">${escapeHtml(text.length > 11 ? text.slice(0, 10) + '…' : text)}</text><text class="node-index" x="${x + 49}" y="107" text-anchor="middle">${index === 0 ? 'cabeza · ' : ''}${index + 1}</text>${index < items.length - 1 ? `<path d="M${x + 114} 57 h30 m-5 -5 5 5 -5 5"/>` : `<text x="${x + 139}" y="61" class="node-index">∅</text>`}</g>`;
  }).join('')}</svg></div>`;
}

export const scanner = `<svg class="scanner" viewBox="0 0 180 90" role="img" aria-label="Escáner de productos"><path d="M20 20h20l15 42h70l15-31H46M63 74h1m49 0h1" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><rect x="77" y="18" width="25" height="30" rx="4" fill="currentColor" opacity=".3"/><path class="scanner-beam" d="M70 10h50" stroke="#cb8041" stroke-width="3"/></svg>`;

// Los arreglos recibidos están en orden de extracción: tope primero.
export function drawStack(items, label, id, tone = 'green') {
  const visible = items.slice(0, 12);
  const height = Math.max(180, visible.length * 38 + 90);
  return `<div class="stack-card ${tone}" id="${id}"><h3>${escapeHtml(label)} <span class="count-pill">${items.length}</span></h3><svg class="stack-svg" viewBox="0 0 240 ${height}" role="img" aria-label="${escapeHtml(label)}: ${items.length} elementos, ${items.length ? `tope ${escapeHtml(items[0])}` : 'vacía'}"><path class="stack-wall" d="M46 35v${height - 57}h148V35"/>${visible.length ? visible.map((item, index) => {
    const y = 40 + index * 38;
    const value = String(item);
    return `<g class="stack-block"><title>${escapeHtml(value)}</title><rect x="57" y="${y}" width="126" height="32" rx="7"/><text x="120" y="${y + 21}" text-anchor="middle">${escapeHtml(value.length > 14 ? value.slice(0, 13) + '…' : value)}</text>${index === 0 ? `<path class="top-arrow" d="M15 ${y + 16}h34m-6 -5 6 5 -6 5"/>` : ''}</g>`;
  }).join('') : '<text x="120" y="90" text-anchor="middle">Pila vacía</text>'}<text class="stack-caption" x="120" y="22" text-anchor="middle">${items.length ? 'TOPE · próximo Pop' : 'Push para comenzar'}</text>${items.length > visible.length ? `<text class="stack-caption" x="120" y="${height - 30}" text-anchor="middle">+ ${items.length - visible.length} elementos en la base</text>` : ''}</svg><details class="stack-values"><summary>Ver pila completa (tope → base)</summary><p>${items.length ? items.map(escapeHtml).join(' · ') : 'Sin elementos'}</p></details></div>`;
}

export function carVector(color = '#b4c2b5', label = 'Automóvil') {
  return `<svg class="car-vector" viewBox="0 0 150 85" role="img" aria-label="${escapeHtml(label)}"><path d="M12 48l14-5 16-24h56l21 24 17 6v19H12z" fill="${color}" stroke="#385447" stroke-width="2"/><path d="M48 25h20v19H35zm27 0h18l17 19H75z" fill="#f3f8ee"/><circle cx="38" cy="68" r="12" fill="#344b3d"/><circle cx="112" cy="68" r="12" fill="#344b3d"/><circle cx="38" cy="68" r="5" fill="#e7eee1"/><circle cx="112" cy="68" r="5" fill="#e7eee1"/><path d="M15 52h13m95 0h10" stroke="#fff3bc" stroke-width="5"/></svg>`;
}

export function drawCircularQueue(autos) {
  if (!autos.length) return '<p class="empty-state">El callejón está vacío. Ingresa un auto para enlazar el primer nodo consigo mismo.</p>';
  const width = Math.max(420, autos.length * 180 + 80);
  return `<div class="node-scroll" role="region" tabindex="0" aria-label="Cola circular doblemente ligada"><svg class="circular-svg" width="${width}" height="205" viewBox="0 0 ${width} 205" role="img" aria-label="${autos.length} autos enlazados en ambos sentidos; final conecta con frente"><text x="30" y="22">Salida · Frente</text><text x="${width - 130}" y="22">Entrada · Final</text>${autos.map((auto, index) => {
    const x = 30 + index * 180;
    const icon = carVector('#9fbd9e', `Auto ${auto.placas}`).replace('class="car-vector"', `x="${x + 48}" y="68" width="45" height="26"`);
    const plate = auto.placas.length > 15 ? auto.placas.slice(0, 14) + '…' : auto.placas;
    return `<g class="linked-node"><title>${escapeHtml(auto.placas)}</title><rect x="${x}" y="65" width="140" height="65" rx="12"/>${icon}<text x="${x + 70}" y="109" text-anchor="middle">${escapeHtml(plate)}</text><text class="circular-caption" x="${x + 70}" y="124" text-anchor="middle">${index + 1} · auto #${auto.id}</text>${index < autos.length - 1 ? `<path d="M${x + 140} 82h40m-6 -5 6 5 -6 5 M${x + 180} 113h-40m6 -5 -6 5 6 5"/>` : ''}</g>`;
  }).join('')}<path d="M${30 + (autos.length - 1) * 180 + 90} 65V40H100v25m-5 -6 5 6 5 -6 M100 130v40h${(autos.length - 1) * 180 + 20}v-40m-5 6 5 -6 5 6"/><text class="circular-caption" x="${width / 2}" y="195" text-anchor="middle">Siguiente → / ← Anterior · los extremos cierran el círculo</text></svg></div>`;
}
