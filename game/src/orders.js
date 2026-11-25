// Sizzle & Serve — order generation, patience, scoring.
// Orders arrive on a quickening schedule; patience shrinks as the shift heats up.
import { CFG } from './config.js';
import { RECIPES } from './recipes.js';

let nextOrderId = 1;

export function makeOrder(elapsed, rng = Math.random) {
  const progress = Math.min(1, elapsed / CFG.SHIFT_SECONDS);
  const patience = CFG.PATIENCE_START + (CFG.PATIENCE_END - CFG.PATIENCE_START) * progress;
  const recipe = RECIPES[Math.floor(rng() * RECIPES.length)];
  return {
    id: nextOrderId++,
    recipe,
    patience,
    maxPatience: patience,
    bornAt: elapsed,
  };
}

export function orderInterval(elapsed) {
  const progress = Math.min(1, elapsed / CFG.SHIFT_SECONDS);
  return CFG.ORDER_INTERVAL_START + (CFG.ORDER_INTERVAL_END - CFG.ORDER_INTERVAL_START) * progress;
}

// Score for serving `recipe` with `patienceLeft` of `maxPatience`, at combo `combo`
// (combo counts consecutive serves with no expired order in between).
export function scoreFor(recipe, patienceLeft, maxPatience, combo) {
  const tip = Math.round(recipe.base * 0.5 * (patienceLeft / maxPatience));
  const comboBonus = combo > 1 ? CFG.COMBO_BONUS * (combo - 1) : 0;
  return { total: recipe.base + tip + comboBonus, base: recipe.base, tip, comboBonus };
}

export function resetOrderIds() { nextOrderId = 1; }
