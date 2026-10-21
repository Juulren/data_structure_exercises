import { mountListas } from './listas.js';
import { mountPilas } from './pilas.js';
import { mountColas } from './colas.js';

const modules = [
  { name: 'Listas', icon: '↗', description: 'Conecta nodos, organiza información y descubre el recorrido de una lista.', exercises: ['Productos disponibles y retirados', 'Pares e impares', 'Aprobados y reprobados', 'Eliminar y ordenar productos', 'Palabras por letra'] },
  { name: 'Pilas', icon: '▤', description: 'Explora el principio LIFO: el último en entrar es el primero en salir.', exercises: ['Invertir palabra', 'Palíndromo', 'Suma de números grandes', 'Reemplazar valor'] },
  { name: 'Colas', icon: '→', description: 'Sigue el orden de llegada y observa cómo funciona una estructura FIFO.', exercises: ['Ventanilla de un banco', 'Juego: pintar coches', 'Estacionamiento de autos'] }
];
const exercises = modules.flatMap(module => module.exercises.map(title => ({ title, module: module.name })));
const nav = document.querySelector('#navModulos');
const view = document.querySelector('#viewContenido');
const drawer = document.querySelector('#navEjercicios');
const toggle = document.querySelector('#btnAbrirMenu');
const backdrop = document.querySelector('#menuBackdrop');
let toastTimer;
let disposeView = () => {};
function notify(message) {
  const toast = document.querySelector('#lblNotificacion');
  clearTimeout(toastTimer); toast.textContent = message; toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}
const mobileMenu = matchMedia('(max-width: 760px)');
function closeMenu() {
  drawer.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); backdrop.hidden = true;
  drawer.inert = mobileMenu.matches;
}
nav.innerHTML = '<a class="nav-link" href="#inicio"><span class="nav-number">⌂</span> Vista general</a>' + modules.map(module => `<h2 class="nav-heading">${module.name}</h2>${module.exercises.map(title => {
  const index = exercises.findIndex(exercise => exercise.title === title);
  return `<a class="nav-link" href="#ejercicio-${index + 1}"><span class="nav-number">${String(index + 1).padStart(2, '0')}</span>${title}</a>`;
}).join('')}`).join('');
const diagram = `<div class="illustration"><svg viewBox="0 0 350 230" role="img" aria-label="Tres nodos conectados en secuencia"><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="none" stroke="#54816a"/></marker></defs><text x="30" y="42" fill="#69806a" font-size="10" letter-spacing="2">CONECTA. EXPLORA. COMPRENDE.</text><path d="M101 118 H135 M210 118 H244" stroke="#54816a" stroke-width="2" marker-end="url(#arrow)"/>${[30,139,248].map((x,i) => `<g class="flow-node"><rect x="${x}" y="85" width="72" height="66" rx="18" fill="${i === 1 ? '#175c48' : '#fcfdf9'}"/><text x="${x+36}" y="126" text-anchor="middle" fill="${i === 1 ? '#fff' : '#175c48'}" font-size="23" font-family="Segoe UI, sans-serif">${String(i+1).padStart(2,'0')}</text></g>`).join('')}<text x="175" y="195" text-anchor="middle" fill="#69806a" font-size="11">Cada nodo es un nuevo aprendizaje.</text></svg></div>`;
function render() {
  disposeView();
  disposeView = () => {};
  const hash = location.hash || '#inicio';
  const match = /^#ejercicio-(\d+)$/.exec(hash);
  const selected = match ? exercises[Number(match[1]) - 1] : null;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === (selected ? hash : '#inicio')) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  if (selected && Number(match[1]) <= 5) {
    mountListas(view, Number(match[1]), notify);
  } else if (selected && Number(match[1]) <= 9) {
    disposeView = mountPilas(view, Number(match[1]), notify);
  } else if (selected) {
    disposeView = mountColas(view, Number(match[1]), notify);
  } else {
    view.innerHTML = `<div class="hero"><div><span class="eyebrow">TU ESPACIO PARA EXPERIMENTAR</span><h1 id="lblTitulo">Las estructuras cobran <em>vida.</em></h1><p class="intro">Un laboratorio para entender listas, pilas y colas paso a paso. Explora cada operación y descubre qué ocurre detrás del código.</p><div class="hero-actions"><a class="primary" href="#ejercicio-1" style="text-decoration:none">Explorar ejercicios ↗</a><button id="btnVerFase" class="secondary">Acerca de esta fase</button></div></div>${diagram}</div><div class="section-heading"><h2>Tres estructuras. Un recorrido.</h2><span>01 — 12 / UNIDAD II</span></div><div class="cards">${modules.map(module => `<article class="card"><div class="module-icon" aria-hidden="true">${module.icon}</div><h3>${module.name}</h3><p>${module.description}</p><div class="card-bottom"><span>${module.exercises.length} ejercicios</span><a class="text-link" href="#ejercicio-${exercises.findIndex(e => e.module === module.name)+1}">Explorar →</a></div></article>`).join('')}</div><div class="note"><strong>Primero, los cimientos.</strong> La fase 0 incluye el servidor, la navegación y la interfaz base. Los ejercicios se construirán uno por uno, con validaciones y visualizaciones propias.</div>`;
    const note = view.querySelector('.note');
    note.innerHTML = '<strong>Los tres módulos están listos.</strong> Explora los 12 ejercicios con estructuras propias, visualizaciones y datos en memoria. Recorre las pilas paso a paso, administra turnos y autos o juega a pintar coches respetando el orden FIFO.';
    document.querySelector('#btnVerFase').addEventListener('click', () => document.querySelector('#dlgInformacion').showModal());
  }
  closeMenu();
  document.title = `${selected?.title ?? 'Laboratorio'} · Estructuras de datos`;
}
toggle.addEventListener('click', () => { const open = drawer.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); backdrop.hidden = !open; drawer.inert = !open; });
mobileMenu.addEventListener('change', closeMenu);
backdrop.addEventListener('click', closeMenu);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && drawer.classList.contains('open')) { closeMenu(); toggle.focus(); } });
window.addEventListener('hashchange', () => { render(); document.querySelector('#mainContenido').focus(); });
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ripple = document.createElement('span'); ripple.className = 'ripple';
  const bounds = button.getBoundingClientRect(); const size = Math.max(bounds.width, bounds.height);
  Object.assign(ripple.style, { width: `${size}px`, height: `${size}px`, left: `${event.clientX-bounds.left-size/2}px`, top: `${event.clientY-bounds.top-size/2}px` });
  button.append(ripple); ripple.addEventListener('animationend', () => ripple.remove());
});
render();
try {
  const response = await fetch('/api/estado');
  if (!response.ok) throw new Error('Servidor no disponible');
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  document.querySelector('#lblEstado').textContent = '● Servidor conectado';
} catch (error) {
  document.querySelector('#lblEstado').textContent = 'Sin conexión';
  notify(error.message || 'No se pudo conectar con el servidor');
}
