// Sizzle & Serve — the chef: movement, collision with counters, carry.
// Movement is WASD/arrows, or click-to-move (input.moveTarget).
import { CFG, LAYOUT } from './config.js';
import { moveVector, input } from './input.js';
import { approachPoint, stationCenter } from './kitchen.js';

export function createPlayer() {
  return {
    x: 640,
    y: 400,
    dirX: 0,
    dirY: 1,
    moving: false,
    carry: [], // ingredients and at most one plate
  };
}

// Solid rectangles the chef cannot walk through (station counters + walls).
function solids() {
  const rects = [
    LAYOUT.fridge, LAYOUT.pantry, LAYOUT.board, LAYOUT.stove, LAYOUT.window,
    LAYOUT.trash, LAYOUT.assembly,
  ];
  return rects.map((r) => ({ x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 }));
}

const FLOOR = { x: 16, y: 100, w: 1248, h: 596 };

function collides(x, y) {
  if (x < FLOOR.x + CFG.PLAYER_RADIUS || x > FLOOR.x + FLOOR.w - CFG.PLAYER_RADIUS) return true;
  if (y < FLOOR.y + CFG.PLAYER_RADIUS || y > FLOOR.y + FLOOR.h - CFG.PLAYER_RADIUS) return true;
  for (const r of solids()) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    if (Math.hypot(x - cx, y - cy) < CFG.PLAYER_RADIUS) return true;
  }
  return false;
}

export function updatePlayer(g, dt) {
  const p = g.player;
  let dx = 0;
  let dy = 0;
  const mv = moveVector();
  if (mv.active) {
    dx = mv.dx;
    dy = mv.dy;
    input.moveTarget = null; // keyboard overrides click-to-move
  } else if (input.moveTarget) {
    const tx = input.moveTarget.x;
    const ty = input.moveTarget.y;
    const dist = Math.hypot(tx - p.x, ty - p.y);
    if (dist < 8) {
      input.moveTarget = null;
      // Arrived at a station click: auto-interact once.
      if (input.pendingStation) {
        const key = input.pendingStation;
        input.pendingStation = null;
        g.requestInteract(key);
      }
    } else {
      dx = (tx - p.x) / dist;
      dy = (ty - p.y) / dist;
    }
  }

  p.moving = dx !== 0 || dy !== 0;
  if (p.moving) {
    p.dirX = dx;
    p.dirY = dy;
    const nx = p.x + dx * CFG.PLAYER_SPEED * dt;
    const ny = p.y + dy * CFG.PLAYER_SPEED * dt;
    // Axis-separated movement so the chef slides along counters.
    if (!collides(nx, p.y)) p.x = nx;
    if (!collides(p.x, ny)) p.y = ny;
  }
}

// Clicking a station rect sets a move target at its approach point.
export function clickStationAt(g, x, y) {
  const keys = ['fridge', 'pantry', 'board', 'stove', 'window', 'trash', 'assembly'];
  for (const k of keys) {
    const r = LAYOUT[k === 'board' ? 'board' : k];
    if (x >= r.x - 10 && x <= r.x + r.w + 10 && y >= r.y - 10 && y <= r.y + r.h + 10) {
      const ap = approachPoint(k);
      input.moveTarget = { x: ap.x, y: ap.y };
      input.pendingStation = k;
      return true;
    }
  }
  return false;
}

export function playerNear(g, key, extra = 0) {
  const c = stationCenter(key);
  return Math.hypot(g.player.x - c.x, g.player.y - c.y) < CFG.INTERACT_RANGE + extra;
}
