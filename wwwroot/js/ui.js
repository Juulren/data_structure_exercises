// Componentes compartidos de la interfaz: íconos SVG, FAB, modales de formulario y progreso.
const paths = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5"/>',
  listas: '<rect class="i-node" x="2" y="8.5" width="6" height="7" rx="2"/><rect class="i-node" x="16" y="8.5" width="6" height="7" rx="2"/><path class="i-link" d="M8 12h8m-2.5-2.5L16 12l-2.5 2.5"/>',
  pilas: '<rect class="i-block i-b1" x="5" y="3" width="14" height="4.5" rx="1.5"/><rect class="i-block i-b2" x="5" y="9.75" width="14" height="4.5" rx="1.5"/><rect class="i-block i-b3" x="5" y="16.5" width="14" height="4.5" rx="1.5"/>',
  colas: '<circle class="i-dot i-d1" cx="5" cy="10" r="2.5"/><circle class="i-dot i-d2" cx="12" cy="10" r="2.5"/><circle class="i-dot i-d3" cx="19" cy="10" r="2.5"/><path d="M3 17h17m-3-3 3 3-3 3"/>',
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  rail: '<path d="M4 6.5h10M4 12h16M4 17.5h10"/><path class="i-chevron" d="m19 8.5-3 3.5 3 3.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>',
  moon: '<path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  car: '<path d="M3 16v-3l2.5-5.5h13L21 13v3z"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
  scan: '<path d="M3 7V4.5A1.5 1.5 0 0 1 4.5 3H7M17 3h2.5A1.5 1.5 0 0 1 21 4.5V7M21 17v2.5a1.5 1.5 0 0 1-1.5 1.5H17M7 21H4.5A1.5 1.5 0 0 1 3 19.5V17"/><path class="i-beam" d="M6 12h12"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  arrow: '<path d="M5 12h14m-5.5-5.5L19 12l-5.5 5.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>',
  bolt: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>'
};

export const icon = (name, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.plus}</svg>`;

// Floating Action Button del shell. Cada vista registra su acción principal.
const fab = () => document.querySelector('#fabPrincipal');
export function setFab({ label, iconName = 'plus', action }) {
  const button = fab();
  if (!button) return;
  button.querySelector('.fab-icon').innerHTML = icon(iconName);
  button.querySelector('.fab-label').textContent = label;
  button.setAttribute('aria-label', label);
  button.onclick = action;
  button.hidden = false;
  button.classList.remove('fab-enter'); void button.offsetWidth; button.classList.add('fab-enter');
}
export function clearFab() {
  const button = fab();
  if (!button) return;
  button.hidden = true;
  button.onclick = null;
}

// Modal de formulario: traslada nodos existentes al diálogo y los regresa al cerrar,
// de modo que los manejadores y los identificadores de la vista se conservan.
export function createFormDialog(root, onDismiss) {
  const dialog = document.createElement('dialog');
  dialog.className = 'form-dialog';
  dialog.setAttribute('aria-labelledby', `${root.id || 'vista'}-dlgFormularioTitulo`);
  dialog.innerHTML = `<header class="dialog-header"><span class="dialog-icon">${icon('plus')}</span><h2 id="${root.id || 'vista'}-dlgFormularioTitulo"></h2><button type="button" class="icon-button" data-close aria-label="Cerrar formulario">${icon('close')}</button></header><div class="dialog-body"></div>`;
  root.append(dialog);
  const body = dialog.querySelector('.dialog-body');
  let moved = [], silent = false;
  const restore = () => { for (const [element, mark] of moved) mark.replaceWith(element); moved = []; };
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    restore();
    if (silent) { silent = false; return; }
    onDismiss?.();
  });
  return {
    open(title, elements, iconName = 'plus') {
      dialog.querySelector('h2').textContent = title;
      dialog.querySelector('.dialog-icon').innerHTML = icon(iconName);
      if (dialog.open) return;
      for (const element of elements.filter(Boolean)) {
        const mark = document.createComment('form-dialog');
        element.before(mark); body.append(element); moved.push([element, mark]);
      }
      dialog.showModal();
    },
    close() {
      if (dialog.open) { silent = true; dialog.close(); }
      restore();
    }
  };
}

// Ondas periódicas: el periodo (dos semiperiodos) divide 1200 para que el desplazamiento de -50 % sea continuo.
export function wavePath(half, amplitude, y, bottom, width = 2400) {
  const third = (half / 3).toFixed(1), twoThirds = (half * 2 / 3).toFixed(1);
  let d = `M0 ${y}c${third} ${-amplitude} ${twoThirds} ${-amplitude} ${half} 0`;
  for (let x = half, sign = 1; x < width; x += half, sign *= -1) d += `s${twoThirds} ${sign * amplitude} ${half} 0`;
  return `${d}V${bottom}H0z`;
}
export const waves = (bottom, layers) => layers.map(([half, amplitude, y], index) => `<path class="wave wave-${index + 1}" d="${wavePath(half, amplitude, y, bottom)}"/>`).join('');

export const progress =(value, label, tone = '') => `<span class="progress ${tone}" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value * 100)}"><span style="--value:${Math.max(0, Math.min(1, value))}"></span></span>`;
