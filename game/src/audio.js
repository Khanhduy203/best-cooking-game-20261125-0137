// Sizzle & Serve — all sound is synthesized with WebAudio oscillators.
// No audio files, no network. Audio unlocks on the first user gesture.
let ctx = null;
let noiseBuf = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // One shared white-noise buffer for sizzle / chop ticks.
    const len = ctx.sampleRate * 0.25;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() { ac(); }

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur, vol, filterFreq) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = filterFreq;
  f.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start();
  src.stop(c.currentTime + dur + 0.02);
}

export const sfx = {
  pickup() { tone(620, 0.08, 'sine', 0.18); },
  place() { tone(420, 0.09, 'triangle', 0.2); },
  chop() { noise(0.09, 0.35, 1800); tone(190, 0.06, 'square', 0.12); },
  chopDone() { tone(520, 0.1, 'sine', 0.2); tone(780, 0.12, 'sine', 0.2, 0.09); },
  cookDone() { tone(660, 0.12, 'sine', 0.18); tone(990, 0.14, 'sine', 0.18, 0.1); },
  sizzleTick() { noise(0.12, 0.08, 3200); },
  serve() { tone(880, 0.14, 'sine', 0.22); tone(1318, 0.22, 'sine', 0.22, 0.11); },
  error() { tone(140, 0.18, 'sawtooth', 0.16, 0, 90); },
  expired() { tone(220, 0.25, 'sawtooth', 0.18, 0, 110); tone(165, 0.3, 'sawtooth', 0.16, 0.2, 82); },
  tick() { tone(1050, 0.05, 'square', 0.08); },
  start() { tone(523, 0.12, 'sine', 0.2); tone(659, 0.12, 'sine', 0.2, 0.1); tone(784, 0.2, 'sine', 0.22, 0.2); },
  gameOver() {
    tone(392, 0.2, 'sine', 0.2); tone(330, 0.2, 'sine', 0.2, 0.18);
    tone(262, 0.35, 'sine', 0.22, 0.36);
  },
};
