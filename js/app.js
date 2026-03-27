// ════════════════════════════════════════════════
//  GARDEN GAME HALL — app.js
// ════════════════════════════════════════════════

/* ─────────────────────────────────────────────
   1. CUSTOM CURSOR
───────────────────────────────────────────── */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');

document.addEventListener('mousemove', e => {
  cursor.style.left     = e.clientX + 'px';
  cursor.style.top      = e.clientY  + 'px';
  cursorRing.style.left = e.clientX + 'px';
  cursorRing.style.top  = e.clientY  + 'px';
});
document.addEventListener('mousedown', () => {
  cursor.style.transform = 'translate(-50%,-50%) scale(0.7)';
});
document.addEventListener('mouseup', () => {
  cursor.style.transform = 'translate(-50%,-50%) scale(1)';
});

/* ─────────────────────────────────────────────
   2. FLOATING BACKGROUND PETALS
───────────────────────────────────────────── */
const bgPetals = document.getElementById('bg-petals');
const PETAL_COLORS = [
  '#a8c8f0','#b8d8f8','#90b8e8',
  '#c4dcf8','#b0d4ee','#8fb878','#a0c880',
];
for (let i = 0; i < 20; i++) {
  const el   = document.createElement('div');
  el.className = 'bg-petal';
  const size = 16 + Math.random() * 38;
  el.style.cssText = `
    width:${size}px;
    height:${size * 1.5}px;
    left:${Math.random() * 100}%;
    background:${PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]};
    animation-duration:${13 + Math.random() * 16}s;
    animation-delay:${-Math.random() * 22}s;
    border-radius:${Math.random() > 0.5 ? '50% 0 50% 0' : '0 50% 0 50%'};
  `;
  bgPetals.appendChild(el);
}

/* ─────────────────────────────────────────────
   3. WEB AUDIO CONTEXT (lazy)
───────────────────────────────────────────── */
let audioCtx = null;
function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/* ─────────────────────────────────────────────
   4. WATER / WIND RIPPLE CLICK SOUND
   A soft whooshing bubble with slight resonance
───────────────────────────────────────────── */
function playWaterClick() {
  try {
    const ctx = getCtx();
    const t   = ctx.currentTime;

    // Noise burst (wind/water feel)
    const bufSize   = ctx.sampleRate * 0.4;
    const buffer    = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data      = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Band-pass filter — gives "water" resonance
    const bpf = ctx.createBiquadFilter();
    bpf.type  = 'bandpass';
    bpf.frequency.setValueAtTime(600, t);
    bpf.frequency.exponentialRampToValueAtTime(180, t + 0.35);
    bpf.Q.value = 6;

    // Low-pass smooth
    const lpf = ctx.createBiquadFilter();
    lpf.type  = 'lowpass';
    lpf.frequency.value = 900;

    // Gain envelope: quick attack, gentle decay
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    // Soft sine "bubble" tone underneath
    const osc  = ctx.createOscillator();
    osc.type   = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.38);
    const oscG = ctx.createGain();
    oscG.gain.setValueAtTime(0, t);
    oscG.gain.linearRampToValueAtTime(0.08, t + 0.02);
    oscG.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    noise.connect(bpf); bpf.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination);
    osc.connect(oscG);  oscG.connect(ctx.destination);

    noise.start(t); noise.stop(t + 0.45);
    osc.start(t);   osc.stop(t + 0.4);
  } catch (_) {}
}

/* ─────────────────────────────────────────────
   5. CLICK RIPPLE VISUAL + SOUND
───────────────────────────────────────────── */
document.addEventListener('click', e => {
  playWaterClick();

  const r    = document.createElement('div');
  r.className = 'ripple';
  const size  = 110 + Math.random() * 60;
  r.style.cssText = `
    width:${size}px; height:${size}px;
    left:${e.clientX - size / 2}px;
    top:${e.clientY  - size / 2}px;
  `;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 700);
});

/* ─────────────────────────────────────────────
   6. FÜR ELISE — synthesised, gentle & romantic
   Uses triangle + light reverb, slow tempo
───────────────────────────────────────────── */
// Frequencies for the main Für Elise theme (Hz)
// 0 = rest; values paired as [freq, duration_seconds]
const FUR_ELISE_NOTES = [
  // Intro motif
  [329.63,0.25],[311.13,0.25],[329.63,0.25],[311.13,0.25],[329.63,0.25],
  [246.94,0.25],[293.66,0.25],[261.63,0.25],[220.00,0.5 ],[0,0.12],
  // Response
  [130.81,0.25],[164.81,0.25],[220.00,0.25],[246.94,0.5 ],[0,0.12],
  [164.81,0.25],[207.65,0.25],[246.94,0.25],[261.63,0.5 ],[0,0.12],
  // Motif repeat
  [164.81,0.25],[329.63,0.25],[311.13,0.25],[329.63,0.25],[311.13,0.25],
  [329.63,0.25],[246.94,0.25],[293.66,0.25],[261.63,0.25],[220.00,0.5 ],[0,0.12],
  // Closing phrase
  [130.81,0.25],[164.81,0.25],[220.00,0.25],[246.94,0.5 ],[0,0.12],
  [164.81,0.25],[261.63,0.25],[246.94,0.25],[220.00,0.65],[0,0.35],
];

let musicPlaying   = false;
let musicTimer     = null;
let masterGain     = null;
let reverbNode     = null;

async function buildReverb(ctx) {
  // Simple convolution reverb via impulse
  const len    = ctx.sampleRate * 1.8;
  const buf    = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

async function startMusic() {
  const ctx = getCtx();

  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
  }
  if (!reverbNode) {
    reverbNode = await buildReverb(ctx);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.28; // gentle reverb mix
    reverbNode.connect(reverbGain);
    reverbGain.connect(ctx.destination);
  }

  // Fade in
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.5);

  function playNote(idx) {
    if (!musicPlaying) return;
    const [freq, dur] = FUR_ELISE_NOTES[idx % FUR_ELISE_NOTES.length];
    const now = getCtx().currentTime;

    if (freq > 0) {
      // Main tone: triangle (soft piano-like)
      const osc  = ctx.createOscillator();
      osc.type   = 'triangle';
      osc.frequency.value = freq;

      // Slight detune for warmth
      const osc2 = ctx.createOscillator();
      osc2.type  = 'sine';
      osc2.frequency.value = freq * 1.002;

      const ng   = ctx.createGain();
      ng.gain.setValueAtTime(0, now);
      ng.gain.linearRampToValueAtTime(0.55, now + 0.018);  // fast attack
      ng.gain.setTargetAtTime(0.25, now + 0.06, 0.08);    // sustain decay
      ng.gain.linearRampToValueAtTime(0, now + dur * 0.9); // release

      const ng2  = ctx.createGain();
      ng2.gain.setValueAtTime(0, now);
      ng2.gain.linearRampToValueAtTime(0.18, now + 0.02);
      ng2.gain.linearRampToValueAtTime(0, now + dur * 0.85);

      osc.connect(ng);   ng.connect(masterGain);
      osc2.connect(ng2); ng2.connect(masterGain);

      // Feed into reverb too
      const revSend = ctx.createGain();
      revSend.gain.value = 0.5;
      ng.connect(revSend); revSend.connect(reverbNode);

      osc.start(now);  osc.stop(now + dur);
      osc2.start(now); osc2.stop(now + dur);
    }

    // Schedule next note with slight humanize timing
    const humanize = (Math.random() - 0.5) * 0.018;
    musicTimer = setTimeout(
      () => playNote((idx + 1) % FUR_ELISE_NOTES.length),
      (dur + humanize) * 1000
    );
  }

  playNote(0);
}

function stopMusic() {
  clearTimeout(musicTimer);
  if (masterGain) {
    const ctx = getCtx();
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
  }
}

const musicBtn = document.getElementById('music-btn');
musicBtn.addEventListener('click', () => {
  if (!musicPlaying) {
    musicPlaying = true;
    musicBtn.textContent = '🎶';
    musicBtn.classList.add('playing');
    startMusic();
  } else {
    musicPlaying = false;
    musicBtn.textContent = '🎵';
    musicBtn.classList.remove('playing');
    stopMusic();
  }
});

/* ─────────────────────────────────────────────
   7. PAGE NAVIGATION
───────────────────────────────────────────── */
const pageBloom    = document.getElementById('page-bloom');
const pageMenu     = document.getElementById('page-menu');
const nicknameInput= document.getElementById('nickname-input');
const enterBtn     = document.getElementById('enter-btn');

function goToMenu() {
  pageBloom.classList.add('page-hidden');
  setTimeout(() => {
    pageBloom.style.display = 'none';
    pageMenu.classList.remove('page-hidden');
  }, 900);

  // Auto-start music on enter
  if (!musicPlaying) {
    musicPlaying = true;
    musicBtn.textContent = '🎶';
    musicBtn.classList.add('playing');
    startMusic();
  }
}

enterBtn.addEventListener('click', () => {
  const name = nicknameInput.value.trim();
  if (!name) { nicknameInput.focus(); return; }
  goToMenu();
});

nicknameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') enterBtn.click();
});

/* ─────────────────────────────────────────────
   8. GAME OVERLAY
───────────────────────────────────────────── */
const GAME_NAMES = ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5', 'Game 6'];
const GAME_URLS  = ['', '', '', '', '', '']; // ← paste your game URLs here

const gameOverlay  = document.getElementById('game-overlay');
const gameFrame    = document.getElementById('game-frame');
const gameTitleBar = document.getElementById('game-title-bar');

window.openGame = function(idx) {
  gameTitleBar.textContent = GAME_NAMES[idx];
  gameFrame.src = GAME_URLS[idx] || 'about:blank';
  gameOverlay.classList.add('open');
};
window.closeGame = function() {
  gameOverlay.classList.remove('open');
  setTimeout(() => { gameFrame.src = 'about:blank'; }, 500);
};