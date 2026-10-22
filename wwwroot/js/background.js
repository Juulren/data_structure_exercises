// Fondo vectorial: nodos que flotan y se conectan cuando están cerca, como una lista viva.
const NS = 'http://www.w3.org/2000/svg';

export function startBackground(svg) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const count = innerWidth < 760 ? 12 : 22;
  const links = document.createElementNS(NS, 'g');
  const dots = document.createElementNS(NS, 'g');
  links.setAttribute('class', 'bg-links'); dots.setAttribute('class', 'bg-dots');
  svg.append(links, dots);
  let width = 0, height = 0, frame = 0, last = 0;
  const nodes = Array.from({ length: count }, (_, index) => {
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('r', String(index % 5 === 0 ? 4 : 2.5));
    dots.append(circle);
    return { x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .00012, vy: (Math.random() - .5) * .00012, circle };
  });
  const pairs = [];
  for (let a = 0; a < count; a++) for (let b = a + 1; b < count; b++) {
    const line = document.createElementNS(NS, 'line');
    links.append(line); pairs.push([nodes[a], nodes[b], line]);
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  function draw(dt) {
    const reach = Math.min(240, Math.max(width, height) * .2);
    for (const node of nodes) {
      node.x += node.vx * dt; node.y += node.vy * dt;
      if (node.x < 0 || node.x > 1) node.vx *= -1;
      if (node.y < 0 || node.y > 1) node.vy *= -1;
      node.circle.setAttribute('cx', (node.x * width).toFixed(1));
      node.circle.setAttribute('cy', (node.y * height).toFixed(1));
    }
    for (const [a, b, line] of pairs) {
      const distance = Math.hypot((a.x - b.x) * width, (a.y - b.y) * height);
      const opacity = distance < reach ? (1 - distance / reach) : 0;
      line.setAttribute('stroke-opacity', opacity.toFixed(2));
      if (opacity) {
        line.setAttribute('x1', (a.x * width).toFixed(1)); line.setAttribute('y1', (a.y * height).toFixed(1));
        line.setAttribute('x2', (b.x * width).toFixed(1)); line.setAttribute('y2', (b.y * height).toFixed(1));
      }
    }
  }
  function tick(time) {
    frame = requestAnimationFrame(tick);
    if (time - last < 33) return; // ~30 fps es suficiente para un fondo.
    const dt = Math.min(64, time - (last || time)); last = time;
    draw(dt);
  }
  function toggle() {
    cancelAnimationFrame(frame); last = 0;
    if (reduced.matches || document.hidden) { draw(0); return; }
    frame = requestAnimationFrame(tick);
  }
  resize(); draw(0); toggle();
  addEventListener('resize', () => { resize(); draw(0); });
  document.addEventListener('visibilitychange', toggle);
  reduced.addEventListener('change', toggle);
}
