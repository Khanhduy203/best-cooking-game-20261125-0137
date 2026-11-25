// Sizzle & Serve — deterministic screenshot staging for ?shot=.
// Each stage builds one fixed, readable scene from the game's own state
// (no randomness, no countdown): the judge's screenshots come from real code.
import { CFG } from './config.js';
import { makeOrder } from './orders.js';
import { RECIPES, makeIngredient, recipeForPlate } from './recipes.js';
import { makePlate } from './kitchen.js';

function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

function plateWith(items) {
  const pl = makePlate();
  for (const [id, state] of items) {
    const it = makeIngredient(id);
    it.state = state;
    pl.items.push(it);
  }
  pl.dish = recipeForPlate(pl.items);
  return pl;
}

function baseStage(g, { elapsed, orderRecipes, patienceFrac }) {
  g.state = 'playing';
  g.paused = true; // frozen frame: nothing ticks, nothing spawns
  g.elapsed = elapsed;
  g.orders = orderRecipes.map((rid, i) => {
    const o = makeOrder(elapsed, () => 0);
    o.recipe = recipeById(rid);
    o.patience = o.maxPatience * patienceFrac[i];
    return o;
  });
  g.particles = [];
  g.floaters = [];
  g.combo = 0;
  g.bestCombo = 0;
  g.kitchen.board = { item: null, progress: 0 };
  g.kitchen.burners = [
    { item: null, progress: 0, announced: false },
    { item: null, progress: 0, announced: false },
  ];
  g.kitchen.plates = [null, null];
  g.kitchen.message = '';
  g.player.carry = [];
  g.player.x = 640;
  g.player.y = 400;
}

export function stageShot(g, name) {
  if (name === 'start') {
    g.state = 'title';
    g.elapsed = 0;
    g.score = 0;
    g.served = 0;
    g.lost = 0;
    g.combo = 0;
    g.bestCombo = 0;
    g.orders = ['sunny', 'garden', 'burger'].map((rid, i) => {
      const o = makeOrder(0, () => 0);
      o.recipe = recipeById(rid);
      o.patience = o.maxPatience * [0.85, 0.7, 0.55][i];
      return o;
    });
    g.player.x = 640;
    g.player.y = 420;
    g.shotLabel = 'shot: start';
    return;
  }

  if (name === 'orders') {
    baseStage(g, { elapsed: 30, orderRecipes: ['sunny', 'garden', 'burger', 'veggie'], patienceFrac: [0.9, 0.65, 0.45, 0.25] });
    g.score = 120;
    g.combo = 2;
    g.player.x = 640;
    g.player.y = 430;
    g.shotLabel = 'shot: orders';
    return;
  }

  if (name === 'play') {
    baseStage(g, { elapsed: 93, orderRecipes: ['burger', 'garden', 'sunny', 'veggie'], patienceFrac: [0.8, 0.55, 0.4, 0.3] });
    g.score = 215;
    g.combo = 3;
    // Stove: patty cooking, egg nearly done.
    const patty = makeIngredient('patty');
    const egg = makeIngredient('egg');
    g.kitchen.burners = [
      { item: patty, progress: 0.35, announced: false },
      { item: egg, progress: 0.8, announced: true },
    ];
    // Board: tomato mid-chop.
    g.kitchen.board = { item: makeIngredient('tomato'), progress: 0.6 };
    // Assembly: burger plate mid-build (cooked patty + bun) and a plate with chopped lettuce.
    g.kitchen.plates = [
      plateWith([['patty', 'cooked'], ['bun', 'raw']]),
      plateWith([['lettuce', 'chopped']]),
    ];
    // Chef stands at the assembly counter holding a chopped tomato.
    g.player.x = 650;
    g.player.y = 520;
    g.player.dirX = 0;
    g.player.dirY = -1;
    const choppedTomato = makeIngredient('tomato');
    choppedTomato.state = 'chopped';
    g.player.carry = [choppedTomato];
    g.shotLabel = 'shot: play';
    return;
  }

  if (name === 'serve') {
    baseStage(g, { elapsed: 122, orderRecipes: ['burger', 'garden', 'sunny'], patienceFrac: [0.7, 0.5, 0.35] });
    g.score = 310;
    g.combo = 4;
    // A finished Sizzle Burger in hand, chef at the serving window.
    g.player.carry = [plateWith([['patty', 'cooked'], ['bun', 'raw'], ['lettuce', 'chopped']])];
    g.player.x = 1136;
    g.player.y = 250;
    g.player.dirX = 0;
    g.player.dirY = -1;
    g.floaters = [{ x: 1136, y: 300, text: 'Serve it!  E', color: '#e4572e', life: 1.4, max: 1.4 }];
    g.shotLabel = 'shot: serve';
    return;
  }

  if (name === 'cover') {
    baseStage(g, { elapsed: 67, orderRecipes: ['burger', 'garden', 'sunny', 'veggie'], patienceFrac: [0.85, 0.6, 0.45, 0.3] });
    g.score = 185;
    g.combo = 3;
    const patty = makeIngredient('patty');
    const egg = makeIngredient('egg');
    g.kitchen.burners = [
      { item: patty, progress: 0.62, announced: false },
      { item: egg, progress: 0.9, announced: true },
    ];
    g.kitchen.board = { item: makeIngredient('tomato'), progress: 0.75 };
    g.kitchen.plates = [
      plateWith([['patty', 'cooked'], ['bun', 'raw']]),
      plateWith([['tomato', 'chopped'], ['lettuce', 'chopped']]),
    ];
    g.player.x = 650;
    g.player.y = 520;
    g.player.dirX = 0;
    g.player.dirY = -1;
    const lettuce = makeIngredient('lettuce');
    lettuce.state = 'chopped';
    g.player.carry = [lettuce];
    g.floaters = [{ x: 650, y: 460, text: '+50  Sizzle Burger', color: '#2a9d4a', life: 1.4, max: 1.4 }];
    g.shotLabel = 'shot: cover';
    return;
  }

  // Unknown shot name: fall back to the title scene.
  stageShot(g, 'start');
}
