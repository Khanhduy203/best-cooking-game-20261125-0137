// Sizzle & Serve — boot + game loop + state machine.
// Title -> playing (3-minute shift) -> game over. Also hosts the ?shot=
// staging hook and the ?test=auto end-to-end self-test.
import { CFG } from './config.js';
import { createKitchen, interact, updateKitchen, nearestStation, stationCenter } from './kitchen.js';
import { createPlayer, updatePlayer, clickStationAt } from './player.js';
import { makeOrder, orderInterval, resetOrderIds } from './orders.js';
import { render } from './render.js';
import { bindInput, input } from './input.js';
import { stageShot } from './shots.js';
import { sfx, unlockAudio } from './audio.js';
import { INGREDIENTS } from './recipes.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export const g = {
  ctx,
  state: 'title', // 'title' | 'playing' | 'over'
  paused: false,
  elapsed: 0,
  titleTime: 0,
  score: 0,
  served: 0,
  lost: 0,
  combo: 0,
  bestCombo: 0,
  orders: [],
  nextOrderIn: 6,
  particles: [],
  floaters: [],
  nearStation: null,
  shotLabel: '',
  kitchen: createKitchen(),
  player: createPlayer(),
  requestInteract(key) { this._pendingInteract = key; },
  _pendingInteract: null,
  _lastTickSecond: -1,
};

function resetGame() {
  g.elapsed = 0;
  g.score = 0;
  g.served = 0;
  g.lost = 0;
  g.combo = 0;
  g.bestCombo = 0;
  g.orders = [];
  g.nextOrderIn = 4;
  g.particles = [];
  g.floaters = [];
  g.kitchen = createKitchen();
  g.player = createPlayer();
  g.paused = false;
  g.shotLabel = '';
  resetOrderIds();
  g.orders.push(makeOrder(0));
  g.orders.push(makeOrder(0));
}

function startGame() {
  if (g.state !== 'title') return;
  unlockAudio();
  resetGame();
  g.state = 'playing';
  sfx.start();
}

function restartGame() {
  if (g.state === 'over' || g.state === 'title') {
    unlockAudio();
    resetGame();
    g.state = 'playing';
    sfx.start();
  }
}

function togglePause() {
  if (g.state === 'playing') g.paused = !g.paused;
}

function doInteract() {
  if (g.state === 'title') { startGame(); return; }
  if (g.state === 'over') { restartGame(); return; }
  if (g.paused) return;
  unlockAudio();
  const key = nearestStation(g);
  if (key) interact(g, key);
}

bindInput(canvas, doInteract, startGame, restartGame, togglePause);

canvas.addEventListener('pointerdown', (e) => {
  unlockAudio();
  if (g.state === 'title') { startGame(); return; }
  if (g.state === 'over') { restartGame(); return; }
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  if (y < 96) return; // order board is not clickable floor
  clickStationAt(g, x, y);
});

function update(dt) {
  g.titleTime += dt;
  if (g.state === 'title' || g.state === 'over') {
    updateParticles(dt);
    return;
  }
  if (g.paused) return;

  g.elapsed += dt;

  // Shift end.
  if (g.elapsed >= CFG.SHIFT_SECONDS) {
    g.elapsed = CFG.SHIFT_SECONDS;
    g.state = 'over';
    sfx.gameOver();
    return;
  }

  // Order spawning.
  g.nextOrderIn -= dt;
  if (g.nextOrderIn <= 0 && g.orders.length < CFG.MAX_ORDERS) {
    g.orders.push(makeOrder(g.elapsed));
    g.nextOrderIn = orderInterval(g.elapsed);
  } else if (g.nextOrderIn <= 0) {
    g.nextOrderIn = 2;
  }

  // Patience drains; expired orders break the combo.
  let expired = false;
  for (const o of g.orders) {
    const before = o.patience;
    o.patience -= dt;
    if (before > 10 && o.patience <= 10) sfx.tick();
    if (o.patience <= 0) expired = true;
  }
  if (expired) {
    g.orders = g.orders.filter((o) => o.patience > 0);
    g.lost += 1;
    g.combo = 0;
    sfx.expired();
  }

  // Pending click-to-move interaction.
  if (g._pendingInteract) {
    const key = g._pendingInteract;
    g._pendingInteract = null;
    interact(g, key);
  }

  updatePlayer(g, dt);
  updateKitchen(g, dt);
  g.nearStation = nearestStation(g);
  updateParticles(dt);
}

function updateParticles(dt) {
  for (const pt of g.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 320 * dt;
    pt.life -= dt;
  }
  g.particles = g.particles.filter((pt) => pt.life > 0);
  for (const f of g.floaters) {
    f.y -= 26 * dt;
    f.life -= dt;
  }
  g.floaters = g.floaters.filter((f) => f.life > 0);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(g);
  requestAnimationFrame(loop);
}

// ---------- ?shot= staging (frozen, deterministic scenes) ----------
const shot = params.get('shot');
if (shot) {
  stageShot(g, shot);
  // Render one frozen frame immediately so a screenshot catches the scene
  // even before the first rAF tick.
  render(g);
}

// ---------- ?test=auto self-test: play one full order end to end ----------
// Drives the real interact() paths (fridge -> stove -> chop -> assemble ->
// serve) with timers fast-forwarded, then reports the result on the page
// title and in the console for headless verification.
function runAutoTest() {
  const log = (m) => { console.log('[TEST] ' + m); };
  try {
    g.state = 'playing';
    g.paused = false;
    g.elapsed = 10;
    g.orders = [];
    const o = makeOrder(10, () => 0.01); // Sunny Skillet
    g.orders.push(o);
    log('order=' + o.recipe.name);

    const near = (key) => {
      const c = stationCenter(key);
      g.player.x = c.x;
      g.player.y = key === 'window' || key === 'assembly' || key === 'trash' ? c.y - 70 : c.y + 70;
      g.nearStation = nearestStation(g);
    };
    const press = (key) => {
      near(key);
      interact(g, key);
    };

    // 1. Take a plate first (empty hands), then gather ingredients.
    press('assembly');
    log('carry after assembly: ' + JSON.stringify(g.player.carry.map((i) => (i.plate ? 'plate' : i.id))));
    // 2. Egg from the fridge (first in the cycle).
    press('fridge');
    log('carry after fridge: ' + JSON.stringify(g.player.carry.map((i) => i.id)));
    // 3. Cook the egg on the stove, fast-forwarded.
    press('stove');
    g.kitchen.burners[0].progress = 0.8;
    press('stove');
    log('carry after stove: ' + JSON.stringify(g.player.carry.map((i) => i.id + ':' + i.state)));
    // 4. Toast from the pantry. The pantry cycle is bun, then toast, so the
    //    bun comes along; drop it via the harness (trash is tested below).
    press('pantry');
    press('pantry');
    log('carry after pantry: ' + JSON.stringify(g.player.carry.map((i) => i.id)));
    const bunIdx = g.player.carry.findIndex((i) => i.id === 'bun');
    if (bunIdx >= 0) { g.player.carry.splice(bunIdx, 1); }
    // 5. Assemble: plate down, add egg, add toast, pick the plate back up.
    press('assembly'); // puts the plate down
    press('assembly'); // adds cooked egg
    press('assembly'); // adds toast -> dish complete
    log('plate dish: ' + (g.kitchen.plates[0] && g.kitchen.plates[0].dish && g.kitchen.plates[0].dish.name));
    press('assembly'); // pick the plate back up
    log('carry before serve: ' + JSON.stringify(g.player.carry.map((i) => (i.plate ? 'plate:' + (i.dish ? i.dish.id : 'empty') : i.id))));
    // 6. Serve at the window.
    press('window');
    const servedOk = g.served === 1 && g.score > 0 && g.orders.length === 0;
    log(`served=${g.served} score=${g.score} ordersLeft=${g.orders.length}`);
    // 7. Trash check: take an egg, toss it, hands must be empty again.
    press('fridge');
    const beforeTrash = g.player.carry.length;
    press('trash');
    const trashOk = g.player.carry.length === beforeTrash - 1;
    log(`trash: before=${beforeTrash} after=${g.player.carry.length} ok=${trashOk}`);
    const ok = servedOk && trashOk;
    log(`result=${ok ? 'PASS' : 'FAIL'}`);
    document.title = `TEST ${ok ? 'PASS' : 'FAIL'} score=${g.score} served=${g.served}`;
    window.__testResult = { ok, score: g.score, served: g.served, ordersLeft: g.orders.length };
  } catch (err) {
    console.log('[TEST] ERROR ' + err.message);
    document.title = 'TEST ERROR ' + err.message;
    window.__testResult = { ok: false, error: err.message };
  }
}

if (params.get('test') === 'auto') {
  // Let the first frame render, then run the scripted play-through.
  setTimeout(runAutoTest, 300);
}

window.__game = g;
requestAnimationFrame(loop);
