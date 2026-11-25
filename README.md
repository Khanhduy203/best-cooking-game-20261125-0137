# Sizzle & Serve — Make the Best Cooking Game

[![Best Cooking Game](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/Khanhduy203/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/Khanhduy203/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A timed order-fulfilment cooking game built for the
[“Make the best cooking game” bounty](https://make.fun/bounty/best-cooking-game-20261125-0137)
on make.fun. You are the chef on a 3-minute shift: take orders off the board,
grab ingredients from the fridge and pantry, chop vegetables, cook eggs and
patties on the stove (don’t let them burn!), assemble dishes on plates, and
serve them at the window before each customer’s patience runs out.

- **4 recipes** — Sunny Skillet, Garden Bowl, Sizzle Burger, Veggie Toast — each
  combining ingredients in a different way (raw / chopped / cooked states matter).
- **Escalating pressure** — orders arrive faster and patience shrinks as the shift heats up.
- **Scoring** — base pay per dish, speed tips, and combo bonuses for chained serves.
- **Feel** — chop particles, sizzling burners, serve dings, floating score text, and a
  live order board with draining patience bars.
- **Controls** — WASD / arrow keys to move, E / Space to use a station, or click a
  station to walk there. P pauses, M mutes, R restarts.
- **Fully offline** — all art is drawn in code on canvas, all sound is synthesized
  with WebAudio. No external assets, no network requests.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve the `game/` folder with any static server:

```sh
cd game && python3 -m http.server 8080
```

## Screenshots

The game supports deterministic staging for screenshots via `?shot=`:

- `?shot=start` — title screen with the order board
- `?shot=orders` — four live orders, timer running
- `?shot=play` — mid-rush: cooking, chopping, a dish mid-assembly
- `?shot=serve` — a finished plate ready at the serving window
- `?shot=cover` — the busiest scene, used for the cover shot

## Layout

- `game/index.html` — page shell and canvas
- `game/src/main.js` — boot, game loop, state machine, self-test
- `game/src/config.js` — tuning numbers and kitchen layout
- `game/src/kitchen.js` — stations: fridge, pantry, board, stove, assembly, window, trash
- `game/src/orders.js` — order generation, patience, scoring
- `game/src/recipes.js` — ingredients and recipes
- `game/src/player.js` — chef movement and collision
- `game/src/render.js` — all canvas drawing
- `game/src/audio.js` — WebAudio sound effects
- `game/src/input.js` — keyboard and mouse input
- `game/src/shots.js` — deterministic `?shot=` staging

## License

MIT — see [LICENSE](LICENSE).
