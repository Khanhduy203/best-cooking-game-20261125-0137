// Sizzle & Serve — every pixel is drawn here in code: floor, stations,
// orders, the chef, ingredients, particles and overlays. No image assets.
import { CFG, LAYOUT, COLORS } from './config.js';
import { INGREDIENTS, RECIPES } from './recipes.js';
import { isPlate } from './kitchen.js';

// ---------- small helpers ----------
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function bar(ctx, x, y, w, h, frac, color, bg = 'rgba(0,0,0,0.25)') {
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0) {
    ctx.fillStyle = color;
    rr(ctx, x, y, w * f, h, h / 2);
    ctx.fill();
  }
}

// ---------- ingredient icons (vector, original) ----------
export function drawIngredient(ctx, id, state, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  const ing = INGREDIENTS[id];
  if (!ing) { ctx.restore(); return; }
  ctx.lineWidth = 2;
  ctx.strokeStyle = ing.edge;
  switch (id) {
    case 'egg': {
      ctx.fillStyle = state === 'cooked' ? '#ffe9a8' : '#fffdf5';
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = state === 'cooked' ? '#f2a007' : '#ffcf3f';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'tomato': {
      ctx.fillStyle = state === 'chopped' ? '#ff6b6b' : '#e63946';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2a9d4a';
      ctx.beginPath(); ctx.arc(0, -r * 0.55, r * 0.3, 0, Math.PI * 2); ctx.fill();
      if (state === 'chopped') {
        ctx.strokeStyle = '#fff'; ctx.beginPath();
        ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0);
        ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.5); ctx.stroke();
      }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = state === 'chopped' ? '#a3e635' : '#80b918';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rad = i % 2 === 0 ? r : r * 0.75;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#4c7a0b'; ctx.beginPath();
      ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0); ctx.stroke();
      break;
    }
    case 'cucumber': {
      ctx.fillStyle = '#43aa4b';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b7e4a8';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e6b2c';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'patty': {
      ctx.fillStyle = state === 'burnt' ? '#2b2118' : state === 'cooked' ? '#6b4226' : '#a06b42';
      rr(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.5); ctx.fill(); ctx.stroke();
      if (state === 'cooked') {
        ctx.fillStyle = '#8b5e3c';
        ctx.beginPath(); ctx.arc(-r * 0.4, 0, 2, 0, Math.PI * 2); ctx.arc(r * 0.35, -2, 2, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'bun': {
      ctx.fillStyle = '#f4a261';
      ctx.beginPath(); ctx.arc(0, 2, r, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e07b39'; rr(ctx, -r, 0, r * 2, r * 0.35, 3); ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.4, 1.8, 0, Math.PI * 2); ctx.arc(r * 0.3, -r * 0.55, 1.8, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'toast': {
      ctx.fillStyle = '#e9c46a';
      rr(ctx, -r * 0.9, -r * 0.9, r * 1.8, r * 1.8, 5); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#a67c00'; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    default:
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  if (state === 'burnt') {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawPlateIcon(ctx, x, y, r, dish, items = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#e9ecef';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.fill();
  const shown = dish ? dish.needs : items;
  if (shown) {
    shown.forEach((it, i) => {
      const a = (i / shown.length) * Math.PI * 2 - Math.PI / 2;
      drawIngredient(ctx, it.id, it.state, Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35, r * 0.32);
    });
  }
  ctx.restore();
}

// ---------- main render ----------
export function render(g) {
  const ctx = g.ctx;
  const W = CFG.W;
  const H = CFG.H;
  ctx.clearRect(0, 0, W, H);

  drawFloor(ctx);
  drawStations(g);
  drawPlayer(g);
  drawParticles(g);
  drawBoard(g);
  drawCarry(g);
  drawMessage(g);
  drawHint(g);
  if (g.state === 'title') drawTitle(g);
  if (g.state === 'over') drawGameOver(g);
  if (g.paused && g.state === 'playing' && !g.shotLabel) drawPaused(g);
  if (g.shotLabel) text(ctx, g.shotLabel, W - 14, H - 14, 13, 'rgba(43,33,24,0.55)', 'right', 'normal');
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  const tile = 64;
  for (let y = 100; y < CFG.H; y += tile) {
    for (let x = 0; x < CFG.W; x += tile) {
      ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 96, CFG.W, 4);
}

function counter(ctx, r, top, front, label, labelTop = false) {
  ctx.fillStyle = front;
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
  ctx.fillStyle = top;
  rr(ctx, r.x, r.y, r.w, 26, 10); ctx.fill();
  ctx.fillStyle = top;
  ctx.fillRect(r.x, r.y + 14, r.w, 12);
  if (label) {
    if (labelTop) text(ctx, label, r.x + r.w - 10, r.y + 13, 12, COLORS.textLight, 'right');
    else text(ctx, label, r.x + r.w / 2, r.y + r.h - 14, 13, COLORS.textLight);
  }
}

function drawStations(g) {
  const ctx = g.ctx;
  const k = g.kitchen;
  const near = g.nearStation;

  // Fridge
  let r = LAYOUT.fridge;
  ctx.fillStyle = COLORS.fridge;
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
  ctx.strokeStyle = '#6aa8bf'; ctx.lineWidth = 3;
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
  ctx.fillStyle = '#6aa8bf';
  ctx.fillRect(r.x + r.w / 2 - 2, r.y + 8, 4, r.h - 16);
  ctx.fillStyle = '#3a6b7d';
  ctx.fillRect(r.x + r.w / 2 - 14, r.y + 30, 8, 18);
  ctx.fillRect(r.x + r.w / 2 + 6, r.y + 30, 8, 18);
  text(ctx, 'FRIDGE', r.x + r.w / 2, r.y + r.h - 12, 13, '#2b4a56');
  const nextF = ['Egg', 'Tomato', 'Lettuce', 'Cucumber', 'Patty'][k.fridgeIndex];
  text(ctx, `next: ${nextF}`, r.x + r.w / 2, r.y + 16, 11, '#2b4a56');

  // Pantry
  r = LAYOUT.pantry;
  ctx.fillStyle = COLORS.pantry;
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
  ctx.strokeStyle = '#8a5a17'; ctx.lineWidth = 3;
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
  ctx.fillStyle = '#8a5a17';
  ctx.fillRect(r.x + 14, r.y + r.h / 2 - 2, r.w - 28, 3);
  text(ctx, 'PANTRY', r.x + r.w / 2, r.y + r.h - 12, 13, '#4a2f0b');
  const nextP = ['Bun', 'Toast'][k.pantryIndex];
  text(ctx, `next: ${nextP}`, r.x + r.w / 2, r.y + 16, 11, '#4a2f0b');

  // Chopping board (bottom label only when empty — the READY line takes its place)
  r = LAYOUT.board;
  counter(ctx, r, COLORS.counterTop, COLORS.counterFront, k.board.item ? '' : 'CHOP  •  hold E nearby');
  ctx.fillStyle = COLORS.boardWood;
  rr(ctx, r.x + 30, r.y + 8, r.w - 60, 44, 8); ctx.fill();
  ctx.strokeStyle = '#a67c00'; ctx.lineWidth = 2;
  rr(ctx, r.x + 30, r.y + 8, r.w - 60, 44, 8); ctx.stroke();
  if (k.board.item) {
    drawIngredient(ctx, k.board.item.id, k.board.progress >= 1 ? 'chopped' : 'raw', r.x + r.w / 2, r.y + 30, 15);
    bar(ctx, r.x + 40, r.y + 56, r.w - 80, 10, k.board.progress, k.board.progress >= 1 ? COLORS.ok : COLORS.gold);
    if (k.board.progress >= 1) text(ctx, 'READY — press E', r.x + r.w / 2, r.y + 78, 11, COLORS.ok);
    else text(ctx, 'chopping…', r.x + r.w / 2, r.y + 78, 11, COLORS.textLight);
  } else {
    text(ctx, 'bring tomato / lettuce / cucumber', r.x + r.w / 2, r.y + 62, 11, 'rgba(255,248,236,0.85)', 'center', 'normal');
  }

  // Stove (two burners say it all — no text label, it would collide with them)
  r = LAYOUT.stove;
  counter(ctx, r, '#3f3f4a', '#2b2b33', '');
  k.burners.forEach((bn, i) => {
    const bx = r.x + 34 + i * 100;
    const by = r.y + 30;
    ctx.fillStyle = '#17171c';
    ctx.beginPath(); ctx.arc(bx, by, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6c6c78'; ctx.lineWidth = 3; ctx.stroke();
    if (bn.item) {
      drawIngredient(ctx, bn.item.id, bn.progress >= CFG.BURNT_AT ? 'burnt' : bn.progress >= CFG.COOKED_FROM ? 'cooked' : 'raw', bx, by, 17);
      const col = bn.progress >= CFG.BURNT_AT ? COLORS.danger : bn.progress >= CFG.COOKED_FROM ? COLORS.ok : COLORS.gold;
      bar(ctx, bx - 26, by + 30, 52, 8, Math.min(1, bn.progress / CFG.BURNT_AT), col);
      if (bn.progress >= CFG.BURNT_AT) text(ctx, 'BURNT!', bx, by + 48, 11, COLORS.danger);
      else if (bn.progress >= CFG.COOKED_FROM) text(ctx, 'COOKED', bx, by + 48, 11, COLORS.ok);
    } else {
      text(ctx, 'empty', bx, by, 11, '#8a8a96', 'center', 'normal');
    }
  });

  // Serving window
  r = LAYOUT.window;
  ctx.fillStyle = COLORS.windowBg;
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
  ctx.strokeStyle = '#b08968'; ctx.lineWidth = 3;
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
  ctx.fillStyle = '#8a5a3b';
  ctx.fillRect(r.x, r.y + 34, r.w, 6);
  text(ctx, 'SERVE HERE', r.x + r.w / 2, r.y + 18, 15, '#8a5a3b');
  text(ctx, 'finished plates only', r.x + r.w / 2, r.y + 52, 11, '#8a5a3b', 'center', 'normal');
  // A bell on the counter.
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath(); ctx.arc(r.x + 26, r.y + r.h - 22, 10, Math.PI, 0); ctx.fill();
  ctx.fillRect(r.x + 14, r.y + r.h - 24, 24, 3);

  // Trash
  r = LAYOUT.trash;
  ctx.fillStyle = '#6c757d';
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
  ctx.strokeStyle = '#495057'; ctx.lineWidth = 3;
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
  ctx.fillStyle = '#343a40';
  rr(ctx, r.x + 30, r.y + 14, r.w - 60, r.h - 44, 6); ctx.fill();
  text(ctx, 'TRASH', r.x + r.w / 2, r.y + r.h - 12, 13, COLORS.textLight);

  // Assembly counter (label sits in the top-bar gap between the two plates)
  r = LAYOUT.assembly;
  counter(ctx, r, COLORS.counterTop, COLORS.counterFront, '');
  text(ctx, 'ASSEMBLY', r.x + r.w / 2, r.y + 13, 13, COLORS.textLight);
  k.plates.forEach((pl, i) => {
    const px = r.x + 70 + i * 220;
    const py = r.y + 34;
    if (!pl) {
      ctx.strokeStyle = 'rgba(255,248,236,0.5)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(px, py, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    drawPlateIcon(ctx, px, py, 26, pl.dish, pl.items);
    // Dish name / contents centred under the plate, clear of the counter label.
    if (pl.dish) {
      text(ctx, pl.dish.name, px, py + 42, 12, COLORS.gold);
    } else if (pl.items.length > 0) {
      pl.items.forEach((it, j) => {
        const ox = px + (j - (pl.items.length - 1) / 2) * 20;
        drawIngredient(ctx, it.id, it.state, ox, py + 42, 8);
      });
    }
  });

  // Highlight the station in range.
  if (near && g.state === 'playing' && !g.paused) {
    const nr = LAYOUT[near === 'board' ? 'board' : near];
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    rr(ctx, nr.x - 5, nr.y - 5, nr.w + 10, nr.h + 10, 12);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'E / SPACE', nr.x + nr.w / 2, nr.y - 14, 12, COLORS.gold);
  }
}

function drawPlayer(g) {
  const ctx = g.ctx;
  const p = g.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 16, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body (chef whites).
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 2; ctx.stroke();
  // Apron stripe.
  ctx.fillStyle = '#17a398';
  ctx.fillRect(-12, -2, 24, 5);
  // Face direction dot.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath(); ctx.arc(p.dirX * 8, p.dirY * 8 - 2, 3, 0, Math.PI * 2); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -18, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -22, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -18, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-13, -20, 26, 7);
  ctx.strokeStyle = '#ced4da'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -22, 9, 0, Math.PI * 2); ctx.stroke();
  // Carried items bob above the hat.
  const n = p.carry.length;
  p.carry.forEach((it, i) => {
    const ox = (i - (n - 1) / 2) * 26;
    const oy = -42;
    if (isPlate(it)) {
      drawPlateIcon(ctx, ox, oy, 13, it.dish, it.items);
    } else {
      drawIngredient(ctx, it.id, it.state, ox, oy, 11);
    }
  });
  ctx.restore();
}

function drawParticles(g) {
  const ctx = g.ctx;
  for (const pt of g.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of g.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    text(ctx, f.text, f.x, f.y, 20, f.color);
  }
  ctx.globalAlpha = 1;
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function drawBoard(g) {
  const ctx = g.ctx;
  // Order board strip.
  ctx.fillStyle = 'rgba(43,33,24,0.92)';
  rr(ctx, 8, 8, CFG.W - 16, 78, 12); ctx.fill();
  text(ctx, 'ORDERS', 30, 30, 14, COLORS.gold, 'left');
  text(ctx, `${g.orders.length}/${CFG.MAX_ORDERS}`, 30, 56, 12, 'rgba(255,248,236,0.7)', 'left');

  const cardW = 218;
  const startX = 120;
  g.orders.forEach((o, i) => {
    const x = startX + i * (cardW + 10);
    const y = 16;
    const frac = o.patience / o.maxPatience;
    ctx.fillStyle = frac < 0.25 ? '#7a1f1f' : '#4a3524';
    rr(ctx, x, y, cardW, 62, 8); ctx.fill();
    ctx.strokeStyle = frac < 0.25 ? COLORS.danger : '#8a6d4b';
    ctx.lineWidth = 2;
    rr(ctx, x, y, cardW, 62, 8); ctx.stroke();
    drawPlateIcon(ctx, x + 30, y + 24, 18, o.recipe);
    text(ctx, o.recipe.name, x + 54, y + 16, 14, COLORS.textLight, 'left');
    text(ctx, `$${o.recipe.base} + tip`, x + 54, y + 36, 11, COLORS.gold, 'left');
    bar(ctx, x + 54, y + 48, cardW - 66, 8, frac, frac < 0.25 ? COLORS.danger : frac < 0.5 ? COLORS.gold : COLORS.ok);
    text(ctx, `${Math.ceil(o.patience)}s`, x + cardW - 8, y + 16, 12, frac < 0.25 ? '#ff8a8a' : COLORS.textLight, 'right');
  });
  if (g.orders.length === 0) {
    text(ctx, 'No orders yet — the rush is coming…', startX + 40, 47, 14, 'rgba(255,248,236,0.7)', 'left', 'normal');
  }

  // Timer + score (right side).
  const tx = CFG.W - 24;
  const remain = Math.max(0, CFG.SHIFT_SECONDS - g.elapsed);
  text(ctx, `TIME ${fmtTime(remain)}`, tx, 32, 22, remain < 30 ? '#ff8a8a' : COLORS.textLight, 'right');
  text(ctx, `SCORE ${g.score}`, tx, 60, 15, COLORS.gold, 'right');
  if (g.combo > 1) text(ctx, `COMBO x${g.combo}`, tx - 150, 60, 14, '#ff7b54', 'right');
}

function drawCarry(g) {
  const ctx = g.ctx;
  const p = g.player;
  const x = 16;
  const y = CFG.H - 66;
  ctx.fillStyle = 'rgba(43,33,24,0.8)';
  rr(ctx, x, y, 300, 50, 10); ctx.fill();
  text(ctx, 'CARRYING', x + 12, y + 14, 11, COLORS.gold, 'left');
  if (p.carry.length === 0) {
    text(ctx, 'empty hands', x + 12, y + 34, 13, 'rgba(255,248,236,0.8)', 'left', 'normal');
  } else {
    p.carry.forEach((it, i) => {
      const ix = x + 92 + i * 48;
      if (isPlate(it)) {
        drawPlateIcon(ctx, ix, y + 26, 15, it.dish, it.items);
        text(ctx, it.dish ? it.dish.name : `plate (${it.items.length})`, ix, y + 44, 9, COLORS.textLight, 'center', 'normal');
      } else {
        drawIngredient(ctx, it.id, it.state, ix, y + 22, 13);
        const label = INGREDIENTS[it.id].name + (it.state === 'raw' ? '' : ` (${it.state})`);
        text(ctx, label, ix, y + 44, 9, COLORS.textLight, 'center', 'normal');
      }
    });
  }
}

function drawMessage(g) {
  const ctx = g.ctx;
  const k = g.kitchen;
  if (g.elapsed < k.messageUntil && k.message) {
    text(ctx, k.message, CFG.W / 2, CFG.H - 84, 16, COLORS.text);
    ctx.fillStyle = 'rgba(255,248,236,0.85)';
    const w = ctx.measureText(k.message).width + 28;
    ctx.fillStyle = 'rgba(255,248,236,0.9)';
    rr(ctx, CFG.W / 2 - w / 2, CFG.H - 100, w, 32, 16); ctx.fill();
    text(ctx, k.message, CFG.W / 2, CFG.H - 84, 16, COLORS.text);
  }
}

function drawHint(g) {
  if (g.state !== 'playing' || g.paused) return;
  const ctx = g.ctx;
  text(
    ctx,
    'WASD / arrows to move  •  E / Space to use a station  •  click a station to walk there  •  P pause  •  M mute',
    CFG.W / 2, CFG.H - 14, 13, 'rgba(43,33,24,0.6)', 'center', 'normal',
  );
}

function overlay(ctx) {
  ctx.fillStyle = 'rgba(30,20,12,0.72)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
}

function drawTitle(g) {
  const ctx = g.ctx;
  overlay(ctx);
  text(ctx, 'SIZZLE & SERVE', CFG.W / 2, 150, 52, COLORS.gold);
  text(ctx, 'A 3-minute kitchen rush — take orders, chop, cook, plate, serve!', CFG.W / 2, 200, 19, COLORS.textLight, 'center', 'normal');
  // Recipe cards.
  const cards = RECIPES.map((r) => r);
  const cw = 250;
  const total = cards.length * (cw + 16) - 16;
  cards.forEach((r, i) => {
    const x = CFG.W / 2 - total / 2 + i * (cw + 16);
    const y = 240;
    ctx.fillStyle = 'rgba(255,248,236,0.12)';
    rr(ctx, x, y, cw, 140, 12); ctx.fill();
    ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 2;
    rr(ctx, x, y, cw, 140, 12); ctx.stroke();
    drawPlateIcon(ctx, x + cw / 2, y + 36, 26, r);
    text(ctx, r.name, x + cw / 2, y + 78, 16, COLORS.textLight);
    // Ingredient icons + short names (states are visible in the icon art).
    r.needs.forEach((n, j) => {
      const ox = x + cw / 2 + (j - (r.needs.length - 1) / 2) * 34;
      drawIngredient(ctx, n.id, n.state, ox, y + 98, 11);
    });
    text(ctx, r.needs.map((n) => INGREDIENTS[n.id].name).join(' + '), x + cw / 2, y + 116, 10, 'rgba(255,248,236,0.8)', 'center', 'normal');
    text(ctx, `$${r.base} + tip`, x + cw / 2, y + 132, 11, COLORS.gold, 'center', 'normal');
  });
  text(ctx, 'Fridge = egg · tomato · lettuce · cucumber · patty      Pantry = bun · toast', CFG.W / 2, 415, 15, COLORS.textLight, 'center', 'normal');
  text(ctx, 'Chop veggies on the board  •  cook egg & patty on the stove (don’t burn them!)', CFG.W / 2, 441, 15, COLORS.textLight, 'center', 'normal');
  text(ctx, 'Assemble on a plate at the counter  •  serve at the window before patience runs out', CFG.W / 2, 467, 15, COLORS.textLight, 'center', 'normal');
  const blink = Math.floor(g.titleTime * 2) % 2 === 0;
  if (blink) text(ctx, '▶  PRESS ENTER OR CLICK TO START  ◀', CFG.W / 2, 535, 22, COLORS.gold);
  text(ctx, 'Orders pay a tip for speed — chain serves for combo bonuses!', CFG.W / 2, 575, 14, 'rgba(255,248,236,0.8)', 'center', 'normal');
}

function drawGameOver(g) {
  const ctx = g.ctx;
  overlay(ctx);
  text(ctx, 'SHIFT OVER!', CFG.W / 2, 170, 48, COLORS.gold);
  text(ctx, `Final score: ${g.score}`, CFG.W / 2, 240, 30, COLORS.textLight);
  text(ctx, `Dishes served: ${g.served}     Orders lost: ${g.lost}     Best combo: x${Math.max(1, g.bestCombo)}`, CFG.W / 2, 290, 18, COLORS.textLight, 'center', 'normal');
  const verdict = g.score >= 300 ? 'Head-chef material!' : g.score >= 180 ? 'Solid shift — the kitchen survived!' : g.score >= 80 ? 'A decent first shift. Faster hands next time!' : 'The rush won this round. One more shift?';
  text(ctx, verdict, CFG.W / 2, 340, 18, COLORS.gold, 'center', 'normal');
  const blink = Math.floor(g.titleTime * 2) % 2 === 0;
  if (blink) text(ctx, 'PRESS R OR CLICK TO PLAY AGAIN', CFG.W / 2, 420, 20, COLORS.textLight);
}

function drawPaused(g) {
  const ctx = g.ctx;
  overlay(ctx);
  text(ctx, 'PAUSED', CFG.W / 2, CFG.H / 2 - 20, 44, COLORS.textLight);
  text(ctx, 'Press P to keep cooking', CFG.W / 2, CFG.H / 2 + 30, 18, COLORS.gold, 'center', 'normal');
}
