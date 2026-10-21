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
