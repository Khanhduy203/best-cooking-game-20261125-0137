// Sizzle & Serve — ingredients and recipes.
// An ingredient is { id, state } where state is 'raw' | 'chopped' | 'cooked' | 'burnt'.
// A recipe lists the exact (id, state) pairs a finished plate must hold.

// Ingredient catalogue: id -> display data. Colour is used for the drawn icon.
export const INGREDIENTS = {
  egg:      { name: 'Egg',      color: '#fff3c4', edge: '#e8c96a', chop: false, cook: true,  from: 'fridge' },
  tomato:   { name: 'Tomato',   color: '#e63946', edge: '#a4133c', chop: true,  cook: false, from: 'fridge' },
  lettuce:  { name: 'Lettuce',  color: '#80b918', edge: '#4c7a0b', chop: true,  cook: false, from: 'fridge' },
  cucumber: { name: 'Cucumber', color: '#43aa4b', edge: '#1e6b2c', chop: true,  cook: false, from: 'fridge' },
  patty:    { name: 'Patty',    color: '#8b5e3c', edge: '#5e3a1f', chop: false, cook: true,  from: 'fridge' },
  bun:      { name: 'Bun',      color: '#f4a261', edge: '#b96a1e', chop: false, cook: false, from: 'pantry' },
  toast:    { name: 'Toast',    color: '#e9c46a', edge: '#a67c00', chop: false, cook: false, from: 'pantry' },
};

// Fridge / pantry dispense cycles (repeated E presses walk the list).
export const FRIDGE_CYCLE = ['egg', 'tomato', 'lettuce', 'cucumber', 'patty'];
export const PANTRY_CYCLE = ['bun', 'toast'];

// Recipes. `needs` is a list of { id, state }.
// A plate matches a recipe when its contents equal `needs` as a multiset.
export const RECIPES = [
  {
    id: 'sunny',
    name: 'Sunny Skillet',
    base: 30,
    needs: [
      { id: 'egg', state: 'cooked' },
      { id: 'toast', state: 'raw' },
    ],
  },
  {
    id: 'garden',
    name: 'Garden Bowl',
    base: 40,
    needs: [
      { id: 'tomato', state: 'chopped' },
      { id: 'lettuce', state: 'chopped' },
      { id: 'cucumber', state: 'chopped' },
    ],
  },
  {
    id: 'burger',
    name: 'Sizzle Burger',
    base: 50,
    needs: [
      { id: 'patty', state: 'cooked' },
      { id: 'bun', state: 'raw' },
      { id: 'lettuce', state: 'chopped' },
    ],
  },
  {
    id: 'veggie',
    name: 'Veggie Toast',
    base: 35,
    needs: [
      { id: 'tomato', state: 'chopped' },
      { id: 'lettuce', state: 'chopped' },
      { id: 'toast', state: 'raw' },
    ],
  },
];

export function makeIngredient(id) {
  return { id, state: 'raw' };
}

// Multiset equality: same (id,state) pairs, same counts, any order.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const key = (it) => it.id + ':' + it.state;
  const have = plateItems.map(key).sort().join('|');
  const want = recipe.needs.map(key).sort().join('|');
  return have === want;
}

export function recipeForPlate(plateItems) {
  return RECIPES.find((r) => plateMatchesRecipe(plateItems, r)) || null;
}
