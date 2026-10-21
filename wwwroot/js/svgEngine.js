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
