// Sizzle & Serve — keyboard + mouse input state.
// The game polls `keys` each frame; clicks set a move target (and an optional
// station to auto-interact with on arrival).
export const keys = Object.create(null);

export const input = {
  // Click-to-move target in canvas coords, or null.
  moveTarget: null,
  // Station key ('fridge' | 'pantry' | 'board' | 'stove' | 'window' | 'trash'
  // | 'assembly') to interact with once the player arrives, or null.
  pendingStation: null,
  // Latest mouse position (canvas coords) for hover hints.
  mouseX: 0,
  mouseY: 0,
};

export function bindInput(canvas, onInteract, onStart, onRestart, onPause) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') onInteract();
    if (e.key === 'Enter') { onStart(); onRestart(); }
    if (e.key === 'r' || e.key === 'R') onRestart();
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') onPause();
    if (e.key === 'm' || e.key === 'M') {
      import('./audio.js').then((a) => a.setMuted(!a.isMuted()));
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    input.mouseX = x;
    input.mouseY = y;
    input.moveTarget = { x, y };
    input.pendingStation = null;
  });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
  });
}

export function moveVector() {
  let dx = 0;
  let dy = 0;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  const len = Math.hypot(dx, dy);
  if (len > 0) { dx /= len; dy /= len; }
  return { dx, dy, active: len > 0 };
}
