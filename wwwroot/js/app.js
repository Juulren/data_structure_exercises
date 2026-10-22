import { mountListas } from './listas.js';
import { mountPilas } from './pilas.js';
import { mountColas } from './colas.js';
import { icon, clearFab, setFab, waves } from './ui.js';
import { startBackground } from './background.js';

const modules = [
  { name: 'Listas', key: 'listas', tone: 'primary', description: 'Conecta nodos, organiza información y descubre el recorrido de una lista.', exercises: ['Productos disponibles y retirados', 'Pares e impares', 'Aprobados y reprobados', 'Eliminar y ordenar productos', 'Palabras por letra'] },
  { name: 'Pilas', key: 'pilas', tone: 'secondary', description: 'Explora el principio LIFO: el último en entrar es el primero en salir.', exercises: ['Invertir palabra', 'Palíndromo', 'Suma de números grandes', 'Reemplazar valor'] },
  { name: 'Colas', key: 'colas', tone: 'tertiary', description: 'Sigue el orden de llegada y observa cómo funciona una estructura FIFO.', exercises: ['Ventanilla de un banco', 'Juego: pintar coches', 'Estacionamiento de autos'] }
];
const exercises = modules.flatMap(module => module.exercises.map(title => ({ title, module })));
const firstOf = module => exercises.findIndex(e => e.module === module) + 1;
const nav = document.querySelector('#navModulos');
const bottomNav = document.querySelector('#navInferior');
const view = document.querySelector('#viewContenido');
const drawer = document.querySelector('#navEjercicios');
const toggle = document.querySelector('#btnAbrirMenu');
const rail = document.querySelector('#btnColapsarMenu');
const backdrop = document.querySelector('#menuBackdrop');
const themeButton = document.querySelector('#btnTema');
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* almacenamiento no disponible */ } }
};
let toastTimer, enterTimer;
let disposeView = () => {};

function notify(message) {
  const toast = document.querySelector('#lblNotificacion');
  clearTimeout(toastTimer); toast.textContent = message; toast.hidden = false;
  toast.classList.remove('snackbar-enter'); void toast.offsetWidth; toast.classList.add('snackbar-enter');
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}

// Barra de progreso global: aparece si alguna petición tarda más de 250 ms.
const loader = document.querySelector('#prgCarga');
const nativeFetch = window.fetch.bind(window);
let pending = 0, loaderTimer;
window.fetch = (...args) => {
  if (pending++ === 0) loaderTimer = setTimeout(() => { loader.hidden = false; }, 250);
  return nativeFetch(...args).finally(() => {
    if (--pending === 0) { clearTimeout(loaderTimer); loader.hidden = true; }
  });
};

// Tema claro / oscuro.
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => document.documentElement.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
function paintTheme() {
  const dark = currentTheme() === 'dark';
  themeButton.innerHTML = icon(dark ? 'sun' : 'moon', 'theme-icon');
  themeButton.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  document.querySelector('meta[name="theme-color"]').content = dark ? '#111412' : '#f7faf6';
}
themeButton.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next; store.set('ed-tema', next); paintTheme();
});
darkQuery.addEventListener('change', paintTheme);
paintTheme();

// Navegación: drawer modal en móvil, riel colapsable en tablet y escritorio.
const mobileMenu = matchMedia('(max-width: 839px)');
const tabletMenu = matchMedia('(max-width: 1199px)');
document.querySelector('.header-waves').innerHTML = waves(80, [[600, 16, 48], [300, 10, 58], [200, 6, 68]]);
toggle.innerHTML = icon('menu');
rail.innerHTML = icon('rail');
function applyRail() {
  const saved = store.get('ed-riel');
  const collapsed = !mobileMenu.matches && (saved === null ? tabletMenu.matches : saved === '1');
  document.body.classList.toggle('rail', collapsed);
  rail.setAttribute('aria-pressed', String(collapsed));
  rail.setAttribute('aria-label', collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral');
}
let railTimer;
rail.addEventListener('click', () => {
  document.body.classList.add('nav-anim'); clearTimeout(railTimer);
  railTimer = setTimeout(() => document.body.classList.remove('nav-anim'), 400);
  store.set('ed-riel', document.body.classList.contains('rail') ? '0' : '1'); applyRail();
});
function openMenu() {
  drawer.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); backdrop.hidden = false; drawer.inert = false;
  drawer.querySelector('[aria-current="page"]')?.focus();
}
function closeMenu() {
  drawer.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); backdrop.hidden = true;
  drawer.inert = mobileMenu.matches;
}

nav.innerHTML = `<a class="nav-link" href="#inicio" title="Vista general"><span class="nav-icon">${icon('home')}</span><span class="nav-label">Vista general</span></a>` + modules.map(module => `<div class="nav-group nav-${module.key}"><h2 class="nav-heading"><span class="nav-icon">${icon(module.key)}</span><span class="nav-label">${module.name}</span></h2>${module.exercises.map(title => {
  const index = exercises.findIndex(exercise => exercise.title === title);
  return `<a class="nav-link" href="#ejercicio-${index + 1}" title="${title}"><span class="nav-number">${String(index + 1).padStart(2, '0')}</span><span class="nav-label">${title}</span></a>`;
}).join('')}</div>`).join('');
bottomNav.innerHTML = `<a class="bottom-link" href="#inicio" data-section="inicio"><span class="bottom-indicator">${icon('home')}</span><span>Inicio</span></a>${modules.map(module => `<a class="bottom-link" href="#ejercicio-${firstOf(module)}" data-section="${module.key}"><span class="bottom-indicator">${icon(module.key)}</span><span>${module.name}</span></a>`).join('')}<button id="btnMenuInferior" class="bottom-link" type="button" aria-controls="navEjercicios"><span class="bottom-indicator">${icon('menu')}</span><span>Ejercicios</span></button>`;
document.querySelector('#btnMenuInferior').addEventListener('click', openMenu);

// Recorrido personal: ejercicios abiertos en este navegador.
function visited() {
  try { return new Set(JSON.parse(store.get('ed-visitados') || '[]')); } catch { return new Set(); }
}
function markVisited(number) {
  const set = visited(); set.add(number); store.set('ed-visitados', JSON.stringify([...set]));
}

const heroArt = `<svg class="hero-art" viewBox="0 0 360 270" role="img" aria-label="Animación de una lista enlazada, una pila y una cola">
  <g class="art-list">
    <path class="art-line" d="M88 62h38M190 62h38"/>
    ${[24, 128, 232].map((x, i) => `<g class="art-node" style="--i:${i}"><rect x="${x}" y="36" width="64" height="52" rx="16" class="${i === 1 ? 'art-filled' : ''}"/><circle cx="${x + 50}" cy="62" r="3.5" class="art-pointer"/><text x="${x + 24}" y="68" text-anchor="middle">${String(i + 1).padStart(2, '0')}</text></g>`).join('')}
    <circle class="art-packet" cx="88" cy="62" r="5"/>
    <text x="304" y="66" class="art-null">∅</text>
  </g>
  <g class="art-stack">
    <path class="art-wall" d="M30 140v100h104V140"/>
    ${[0, 1, 2].map(i => `<rect class="art-block" style="--i:${i}" x="40" y="${206 - i * 30}" width="84" height="24" rx="7"/>`).join('')}
    <text x="82" y="262" text-anchor="middle" class="art-caption">LIFO</text>
  </g>
  <g class="art-queue">
    <path class="art-track" d="M170 214h170"/>
    ${[0, 1, 2, 3].map(i => `<circle class="art-client" style="--i:${i}" cx="${196 + i * 42}" cy="190" r="14"/>`).join('')}
    <path class="art-line" d="M190 236h-20m6-6-6 6 6 6"/>
    <text x="255" y="262" text-anchor="middle" class="art-caption">FIFO</text>
  </g>
</svg>`;

function home() {
  const seen = visited();
  view.innerHTML = `<div class="home">
    <section class="hero">
      <div class="hero-copy">
        <span class="chip chip-tonal">${icon('bolt')} Tu espacio para experimentar</span>
        <h1 id="lblTitulo">Las estructuras cobran <em>vida.</em></h1>
        <p class="intro">Un laboratorio para entender listas, pilas y colas paso a paso. Explora cada operación y descubre qué ocurre detrás del código.</p>
        <div class="hero-actions"><a class="primary" href="#ejercicio-1">Explorar ejercicios ${icon('arrow')}</a><button id="btnVerFase" class="secondary" type="button">${icon('info')} Acerca de esta fase</button></div>
      </div>
      <div class="illustration">${heroArt}</div>
      <svg class="hero-waves" viewBox="0 0 2400 120" preserveAspectRatio="none" aria-hidden="true">${waves(120, [[600, 26, 66], [300, 18, 82], [200, 12, 96]])}</svg>
    </section>
    <div class="progress-overview">
      ${modules.map(module => {
        const done = module.exercises.filter((_, i) => seen.has(firstOf(module) + i)).length;
        return `<div class="progress-item tone-${module.tone}"><div><span class="progress-title">${icon(module.key)} ${module.name}</span><span class="progress-count">${done} de ${module.exercises.length} explorados</span></div><span class="progress" role="progressbar" aria-label="Recorrido de ${module.name}" aria-valuemin="0" aria-valuemax="${module.exercises.length}" aria-valuenow="${done}"><span style="--value:${done / module.exercises.length}"></span></span></div>`;
      }).join('')}
    </div>
    <div class="section-heading"><h2>Tres estructuras. Un recorrido.</h2><span class="chip chip-small">01 — 12 · Unidad II</span></div>
    <div class="cards">${modules.map(module => `<article class="card module-card tone-${module.tone}">
      <div class="card-top"><div class="module-icon" aria-hidden="true">${icon(module.key, 'icon-lg')}</div><span class="chip chip-small">${module.exercises.length} ejercicios</span></div>
      <h3>${module.name}</h3><p>${module.description}</p>
      <div class="chip-set">${module.exercises.map((title, i) => `<a class="chip chip-assist" href="#ejercicio-${firstOf(module) + i}">${String(firstOf(module) + i).padStart(2, '0')} · ${title}</a>`).join('')}</div>
      <div class="card-bottom"><span>${seen.size ? `${module.exercises.filter((_, i) => seen.has(firstOf(module) + i)).length} visitados` : 'Comienza aquí'}</span><a class="text-link" href="#ejercicio-${firstOf(module)}">Explorar ${icon('arrow')}</a></div>
    </article>`).join('')}</div>
    <div class="note"><span class="note-icon">${icon('info')}</span><p><strong>Los tres módulos están listos.</strong> Explora los 12 ejercicios con estructuras propias, visualizaciones y datos en memoria. Recorre las pilas paso a paso, administra turnos y autos o juega a pintar coches respetando el orden FIFO.</p></div>
  </div>`;
  document.querySelector('#btnVerFase').addEventListener('click', () => document.querySelector('#dlgInformacion').showModal());
  setFab({ label: 'Comenzar', iconName: 'play', action: () => { location.hash = '#ejercicio-1'; } });
}

function render() {
  disposeView();
  disposeView = () => {};
  clearFab();
  const hash = location.hash || '#inicio';
  const match = /^#ejercicio-(\d+)$/.exec(hash);
  const selected = match ? exercises[Number(match[1]) - 1] : null;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === (selected ? hash : '#inicio')) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const section = selected ? selected.module.key : 'inicio';
  bottomNav.querySelectorAll('[data-section]').forEach(link => {
    if (link.dataset.section === section) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  document.body.dataset.section = section;
  if (selected && Number(match[1]) <= 5) {
    mountListas(view, Number(match[1]), notify);
  } else if (selected && Number(match[1]) <= 9) {
    disposeView = mountPilas(view, Number(match[1]), notify);
  } else if (selected) {
    disposeView = mountColas(view, Number(match[1]), notify);
  } else {
    home();
  }
  if (selected) markVisited(Number(match[1]));
  document.querySelector('#lblRuta').textContent = selected ? `${selected.module.name} · Ejercicio ${String(match[1]).padStart(2, '0')}` : 'Ingeniería / Estructuras de datos';
  document.querySelector('#lblVista').textContent = selected?.title ?? 'Vista general';
  // La clase se retira al terminar la entrada para que los re-renderizados posteriores no repitan la animación.
  clearTimeout(enterTimer);
  view.classList.remove('view-enter'); void view.offsetWidth; view.classList.add('view-enter');
  enterTimer = setTimeout(() => view.classList.remove('view-enter'), 1000);
  closeMenu();
  document.title = `${selected?.title ?? 'Laboratorio'} · Estructuras de datos`;
}

toggle.addEventListener('click', () => (drawer.classList.contains('open') ? closeMenu() : openMenu()));
mobileMenu.addEventListener('change', () => { closeMenu(); applyRail(); });
tabletMenu.addEventListener('change', applyRail);
backdrop.addEventListener('click', closeMenu);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && drawer.classList.contains('open')) { closeMenu(); toggle.focus(); } });
window.addEventListener('hashchange', () => { render(); scrollTo({ top: 0 }); document.querySelector('#mainContenido').focus({ preventScroll: true }); });

// Efecto ripple de Material en botones, enlaces de navegación y chips.
document.addEventListener('pointerdown', event => {
  const host = event.target.closest('button, .nav-link, .bottom-link, .chip-assist, a.primary, a.secondary, .card');
  if (!host || host.disabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ripple = document.createElement('span'); ripple.className = 'ripple';
  const bounds = host.getBoundingClientRect(); const size = Math.max(bounds.width, bounds.height) * 2;
  Object.assign(ripple.style, { width: `${size}px`, height: `${size}px`, left: `${event.clientX - bounds.left - size / 2}px`, top: `${event.clientY - bounds.top - size / 2}px` });
  host.classList.add('ripple-host'); host.append(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});

// Elevación dinámica de las tarjetas: la sombra sigue al puntero.
document.addEventListener('pointermove', event => {
  const card = event.target.closest?.('.card, .result-panel, .workspace-card');
  if (!card) return;
  const bounds = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
  card.style.setProperty('--my', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
}, { passive: true });

applyRail();
startBackground(document.querySelector('#svgFondo'));
render();
try {
  const response = await fetch('/api/estado');
  if (!response.ok) throw new Error('Servidor no disponible');
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  document.querySelector('#lblEstado').innerHTML = '<span class="live-dot"></span>Servidor conectado';
  document.querySelector('#lblEstado').classList.add('online');
} catch (error) {
  document.querySelector('#lblEstado').textContent = 'Sin conexión';
  document.querySelector('#lblEstado').classList.add('offline');
  notify(error.message || 'No se pudo conectar con el servidor');
}
