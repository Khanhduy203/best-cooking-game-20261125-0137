// Sizzle & Serve — configuration: canvas, timing, layout constants.
// One job: every tunable number lives here so balancing never touches logic.
export const CFG = {
  W: 1280,
  H: 720,
  SHIFT_SECONDS: 180,
  MAX_ORDERS: 4,
  MAX_CARRY: 4,
  PLAYER_SPEED: 260,
  PLAYER_RADIUS: 22,
  INTERACT_RANGE: 86,
  CHOP_SECONDS: 2.2,
  COOK_SECONDS: 6.0,
  COOKED_FROM: 0.55, // progress fraction where raw becomes cooked
  BURNT_AT: 1.15, // progress fraction where cooked becomes burnt
  ORDER_INTERVAL_START: 20,
  ORDER_INTERVAL_END: 12,
  PATIENCE_START: 70,
  PATIENCE_END: 40,
  COMBO_BONUS: 5,
};

// Floor + wall layout (canvas pixels, 1280x720).
export const LAYOUT = {
  boardTop: 8,
  boardHeight: 78,
  // Top-row stations (y 104..196)
  fridge:   { x: 24,   y: 104, w: 150, h: 92 },
  pantry:   { x: 198,  y: 104, w: 150, h: 92 },
  board:    { x: 470,  y: 104, w: 190, h: 92 },
  stove:    { x: 700,  y: 104, w: 190, h: 92 },
  window:   { x: 1016, y: 104, w: 240, h: 92 },
  // Bottom-row stations (y 560..652)
  trash:    { x: 24,   y: 560, w: 150, h: 92 },
  assembly: { x: 470,  y: 560, w: 360, h: 92 },
};

export const COLORS = {
  floorA: '#e8d5a8',
  floorB: '#dfc794',
  wall: '#8a5a3b',
  counterTop: '#b08968',
  counterFront: '#7f5539',
  steel: '#c0c8d0',
  steelDark: '#9aa4ae',
  fridge: '#a8d8ea',
  pantry: '#d9a441',
  boardWood: '#e0a458',
  stove: '#5a5a66',
  windowBg: '#f4ead5',
  text: '#2b2118',
  textLight: '#fff8ec',
  accent: '#e4572e',
  accent2: '#17a398',
  gold: '#f2b705',
  danger: '#d62828',
  ok: '#2a9d4a',
};
