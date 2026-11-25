// Sizzle & Serve — kitchen state: stations, chopping, cooking, assembly, serving.
// All station behaviour lives here; main.js only calls interact() / update().
import { CFG, LAYOUT } from './config.js';
import { FRIDGE_CYCLE, PANTRY_CYCLE, INGREDIENTS, makeIngredient, recipeForPlate } from './recipes.js';
import { scoreFor } from './orders.js';
import { sfx } from './audio.js';

export function createKitchen() {
  return {
    fridgeIndex: 0,
    pantryIndex: 0,
    board: { item: null, progress: 0 }, // chopping board
    burners: [
      { item: null, progress: 0, announced: false },
      { item: null, progress: 0, announced: false },
    ],
    plates: [null, null], // assembly counter slots: { items: [], dish: recipe|null }
    message: '',
    messageUntil: 0,
  };
}

export function isPlate(it) { return !!it && it.plate === true; }
export function makePlate() { return { plate: true, items: [], dish: null }; }

export function stationRect(key) {
  return LAYOUT[key === 'board' ? 'board' : key === 'window' ? 'window' : key];
}

export function stationCenter(key) {
  const r = stationRect(key);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

// Point a click-to-move player should walk to: just outside the station,
// on the floor side (top stations: below them; bottom stations: above them).
export function approachPoint(key) {
  const r = stationRect(key);
  const cx = r.x + r.w / 2;
  const topRow = r.y < 300;
  return { x: cx, y: topRow ? r.y + r.h + 46 : r.y - 46 };
}

export function nearestStation(g) {
  const keys = ['fridge', 'pantry', 'board', 'stove', 'window', 'trash', 'assembly'];
  let best = null;
  let bestD = CFG.INTERACT_RANGE;
  for (const k of keys) {
    const c = stationCenter(k);
    const d = Math.hypot(g.player.x - c.x, g.player.y - c.y);
    if (d < bestD) { bestD = d; best = k; }
  }
  return best;
}

function say(g, text, secs = 2.2) {
  g.kitchen.message = text;
  g.kitchen.messageUntil = g.elapsed + secs;
}

function burst(g, x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    g.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 160,
      vy: -Math.random() * 140 - 20,
      life: 0.5 + Math.random() * 0.3,
      max: 0.8,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

function floater(g, x, y, text, color = '#2a9d4a') {
  g.floaters.push({ x, y, text, color, life: 1.4, max: 1.4 });
}

function carriedPlate(g) {
  return g.player.carry.find(isPlate) || null;
}

export function interact(g, key) {
  if (!key || g.state !== 'playing' || g.paused) return;
  const k = g.kitchen;
  const p = g.player;

  if (key === 'fridge' || key === 'pantry') {
    const cycle = key === 'fridge' ? FRIDGE_CYCLE : PANTRY_CYCLE;
    const idxKey = key === 'fridge' ? 'fridgeIndex' : 'pantryIndex';
    if (p.carry.length >= CFG.MAX_CARRY) { say(g, 'Hands full! Serve or trash something.'); sfx.error(); return; }
    const id = cycle[k[idxKey]];
    k[idxKey] = (k[idxKey] + 1) % cycle.length;
    p.carry.push(makeIngredient(id));
    sfx.pickup();
    say(g, `Took ${INGREDIENTS[id].name} — next: ${INGREDIENTS[cycle[k[idxKey]]].name}`, 1.6);
    return;
  }

  if (key === 'board') {
    const b = k.board;
    if (!b.item) {
      const i = p.carry.findIndex((it) => !isPlate(it) && INGREDIENTS[it.id].chop && it.state === 'raw');
      if (i < 0) { say(g, 'Chop board needs raw tomato, lettuce or cucumber.'); sfx.error(); return; }
      b.item = p.carry.splice(i, 1)[0];
      b.progress = 0;
      sfx.place();
      say(g, `Chopping ${INGREDIENTS[b.item.id].name}… stay close!`, 1.8);
    } else if (b.progress >= 1) {
      if (p.carry.length >= CFG.MAX_CARRY) { say(g, 'Hands full — make room first.'); sfx.error(); return; }
      b.item.state = 'chopped';
      p.carry.push(b.item);
      sfx.pickup();
      say(g, `Chopped ${INGREDIENTS[b.item.id].name} ready!`, 1.6);
      b.item = null;
      b.progress = 0;
    } else {
      say(g, 'Still chopping…', 1.2);
    }
    return;
  }

  if (key === 'stove') {
    // Pick up a cooked (or burnt) item first if hands allow.
    const done = k.burners.find((bn) => bn.item && bn.progress >= CFG.COOKED_FROM);
    if (done && p.carry.length < CFG.MAX_CARRY) {
      const it = done.item;
      it.state = done.progress >= CFG.BURNT_AT ? 'burnt' : 'cooked';
      p.carry.push(it);
      done.item = null;
      done.progress = 0;
      done.announced = false;
      sfx.pickup();
      if (it.state === 'burnt') say(g, 'Burnt! Toss it in the trash.', 2);
      else say(g, `Cooked ${INGREDIENTS[it.id].name} ready!`, 1.6);
      return;
    }
    const ci = p.carry.findIndex((it) => !isPlate(it) && INGREDIENTS[it.id].cook && it.state === 'raw');
    if (ci >= 0) {
      const free = k.burners.find((bn) => !bn.item);
      if (!free) { say(g, 'Both burners busy!'); sfx.error(); return; }
      free.item = p.carry.splice(ci, 1)[0];
      free.progress = 0;
      free.announced = false;
      sfx.place();
      say(g, `Cooking ${INGREDIENTS[free.item.id].name} — watch it, it burns!`, 1.8);
      return;
    }
    if (done) { say(g, 'Hands full!'); sfx.error(); return; }
    say(g, 'Stove cooks raw egg or patty.'); sfx.error();
    return;
  }

  if (key === 'assembly') {
    const plate = carriedPlate(g);
    if (plate) {
      const slot = k.plates.findIndex((s) => s === null);
      if (slot < 0) { say(g, 'Assembly counter is full!'); sfx.error(); return; }
      k.plates[slot] = plate;
      p.carry.splice(p.carry.indexOf(plate), 1);
      sfx.place();
      say(g, plate.dish ? `${plate.dish.name} plated!` : 'Plate on the counter.', 1.6);
      return;
    }
    const ingIdx = p.carry.findIndex((it) => !isPlate(it));
    if (ingIdx >= 0) {
      const slot = k.plates.findIndex((s) => s && !s.dish);
      if (slot < 0) { say(g, 'No empty plate on the counter — take one first.'); sfx.error(); return; }
      const it = p.carry.splice(ingIdx, 1)[0];
      k.plates[slot].items.push(it);
      sfx.place();
      const dish = recipeForPlate(k.plates[slot].items);
      if (dish) {
        k.plates[slot].dish = dish;
        const c = stationCenter('assembly');
        burst(g, c.x, c.y - 10, '#f2b705', 16);
        sfx.cookDone();
        say(g, `${dish.name} complete! Serve it at the window.`, 2.4);
      } else {
        say(g, `Added ${INGREDIENTS[it.id].name} to the plate.`, 1.4);
      }
      return;
    }
    // Empty hands: pick up a plate from the counter, or take a fresh one.
    const slot = k.plates.findIndex((s) => s !== null);
    if (slot >= 0) {
      p.carry.push(k.plates[slot]);
      k.plates[slot] = null;
      sfx.pickup();
      say(g, 'Picked up the plate.', 1.4);
    } else {
      p.carry.push(makePlate());
      sfx.pickup();
      say(g, 'Took a plate. Add ingredients at the counter.', 1.8);
    }
    return;
  }

  if (key === 'window') {
    const plate = carriedPlate(g);
    if (!plate) { say(g, 'Bring a finished plate to serve.'); sfx.error(); return; }
    if (!plate.dish) { say(g, 'That plate is not a complete dish yet.'); sfx.error(); return; }
    const oi = g.orders.findIndex((o) => o.recipe.id === plate.dish.id);
    if (oi < 0) { say(g, `No order for ${plate.dish.name} right now.`); sfx.error(); return; }
    const order = g.orders.splice(oi, 1)[0];
    g.combo += 1;
    g.bestCombo = Math.max(g.bestCombo, g.combo);
    const sc = scoreFor(order.recipe, order.patience, order.maxPatience, g.combo);
    g.score += sc.total;
    g.served += 1;
    p.carry.splice(p.carry.indexOf(plate), 1);
    const c = stationCenter('window');
    burst(g, c.x, c.y + 30, '#f2b705', 22);
    burst(g, c.x, c.y + 30, '#17a398', 12);
    floater(g, c.x, c.y + 60, `+${sc.total}  ${order.recipe.name}`, '#2a9d4a');
    if (sc.comboBonus > 0) floater(g, c.x, c.y + 88, `Combo x${g.combo}! +${sc.comboBonus}`, '#e4572e');
    sfx.serve();
    say(g, `Served ${order.recipe.name}! +${sc.total} (tip +${sc.tip})`, 2.4);
    return;
  }

  if (key === 'trash') {
    if (p.carry.length === 0) { say(g, 'Nothing to toss.'); return; }
    const it = p.carry.pop();
    sfx.place();
    say(g, isPlate(it) ? 'Tossed the plate.' : `Tossed ${INGREDIENTS[it.id].name}.`, 1.6);
    return;
  }
}

export function updateKitchen(g, dt) {
  const k = g.kitchen;
  const p = g.player;
  const boardC = stationCenter('board');
  const nearBoard = Math.hypot(p.x - boardC.x, p.y - boardC.y) < CFG.INTERACT_RANGE + 30;

  // Chopping progresses while the chef stands by the board.
  if (k.board.item && k.board.progress < 1) {
    if (nearBoard) {
      k.board.progress += dt / CFG.CHOP_SECONDS;
      if (Math.random() < dt * 14) {
        burst(g, boardC.x + (Math.random() - 0.5) * 60, boardC.y + 10, '#e0a458', 2);
        sfx.chop();
      }
      if (k.board.progress >= 1) {
        k.board.progress = 1;
        sfx.chopDone();
        say(g, `Chopped ${INGREDIENTS[k.board.item.id].name}! Press E to take it.`, 2);
      }
    }
  }

  // Burners cook (and burn) on their own — the rush never waits.
  const stoveC = stationCenter('stove');
  for (const bn of k.burners) {
    if (!bn.item) continue;
    bn.progress += dt / CFG.COOK_SECONDS;
    if (Math.random() < dt * 3) sfx.sizzleTick();
    if (!bn.announced && bn.progress >= CFG.COOKED_FROM && bn.progress < CFG.BURNT_AT) {
      bn.announced = true;
      sfx.cookDone();
      say(g, `${INGREDIENTS[bn.item.id].name} is cooked — grab it before it burns!`, 2.4);
    }
    if (bn.progress >= CFG.BURNT_AT) {
      bn.item.state = 'burnt';
      if (Math.random() < dt * 6) burst(g, stoveC.x, stoveC.y, '#3a3a3a', 2);
    }
  }
}
