// ════════════════════════════════════════════
//  花园游戏厅 — app.js
// ════════════════════════════════════════════

/* ── CURSOR ── */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
document.addEventListener('mousemove', e => {
  cursor.style.left     = e.clientX + 'px';
  cursor.style.top      = e.clientY + 'px';
  cursorRing.style.left = e.clientX + 'px';
  cursorRing.style.top  = e.clientY + 'px';
});
document.addEventListener('mousedown', () => cursor.style.transform = 'translate(-50%,-50%) scale(0.65)');
document.addEventListener('mouseup',   () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');

/* ── FLOATING BG PETALS ── */
const COLORS = ['#a8c8f0','#b8d8f8','#8eb8e8','#c2daf8','#b0d2ee','#8fb878','#9ec870'];
const wrap = document.getElementById('bg-petals');
for (let i = 0; i < 22; i++) {
  const d  = document.createElement('div');
  d.className = 'bg-petal';
  const s  = 14 + Math.random() * 36;
  const rr = Math.random() > 0.5 ? '50% 0 50% 0' : '0 50% 0 50%';
  d.style.cssText = `
    width:${s}px; height:${s*1.55}px;
    left:${Math.random()*100}%;
    background:${COLORS[Math.floor(Math.random()*COLORS.length)]};
    animation-duration:${12+Math.random()*18}s;
    animation-delay:${-Math.random()*24}s;
    border-radius:${rr};
    opacity:0;
  `;
  wrap.appendChild(d);
}

/* ── WEB AUDIO ── */
let audioCtx    = null;
let masterGain  = null;
let reverbNode  = null;
let musicPlaying = false;
let musicTimer   = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/* Water / wind click sound */
function playWater() {
  try {
    const ctx = getCtx(), t = ctx.currentTime;
    const sz  = ctx.sampleRate * 0.45;
    const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
    const dat = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) dat[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource(); src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(700, t);
    bpf.frequency.exponentialRampToValueAtTime(160, t + 0.4);
    bpf.Q.value = 7;

    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 850;
    const g   = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.46);

    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(560, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.4);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t);
    og.gain.linearRampToValueAtTime(0.07, t + 0.02);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    src.connect(bpf); bpf.connect(lpf); lpf.connect(g); g.connect(ctx.destination);
    osc.connect(og); og.connect(ctx.destination);
    src.start(t); src.stop(t + 0.48);
    osc.start(t); osc.stop(t + 0.42);
  } catch(_) {}
}

/* Click → ripple visual + sound */
document.addEventListener('click', e => {
  playWater();
  const r  = document.createElement('div');
  r.className = 'ripple';
  const sz = 100 + Math.random() * 70;
  r.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX-sz/2}px;top:${e.clientY-sz/2}px;`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 750);
});

/* ── FÜR ELISE — soft piano synthesis ── */
// Main theme notes [Hz, seconds]; 0 = rest
const ELISE = [
  [329.63,.28],[311.13,.28],[329.63,.28],[311.13,.28],[329.63,.28],
  [246.94,.28],[293.66,.28],[261.63,.28],[220.00,.56],[0,.14],
  [130.81,.28],[164.81,.28],[220.00,.28],[246.94,.56],[0,.14],
  [164.81,.28],[207.65,.28],[246.94,.28],[261.63,.56],[0,.14],
  [164.81,.28],[329.63,.28],[311.13,.28],[329.63,.28],[311.13,.28],
  [329.63,.28],[246.94,.28],[293.66,.28],[261.63,.28],[220.00,.56],[0,.14],
  [130.81,.28],[164.81,.28],[220.00,.28],[246.94,.56],[0,.14],
  [164.81,.28],[261.63,.28],[246.94,.28],[220.00,.72],[0,.4],
];

async function buildReverb(ctx) {
  const len = ctx.sampleRate * 2.2;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2.0);
  }
  const cv = ctx.createConvolver(); cv.buffer = buf; return cv;
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
    const rg = ctx.createGain(); rg.gain.value = 0.32;
    reverbNode.connect(rg); rg.connect(ctx.destination);
  }
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 2.0);

  function note(idx) {
    if (!musicPlaying) return;
    const [f, dur] = ELISE[idx % ELISE.length];
    const now = getCtx().currentTime;
    if (f > 0) {
      // Triangle wave — warm piano tone
      const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = f;
      // Sine second partial — adds shimmer
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.001;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0, now);
      ng.gain.linearRampToValueAtTime(0.6, now + 0.016);
      ng.gain.setTargetAtTime(0.22, now + 0.05, 0.09);
      ng.gain.linearRampToValueAtTime(0, now + dur * 0.88);
      const ng2 = ctx.createGain();
      ng2.gain.setValueAtTime(0, now);
      ng2.gain.linearRampToValueAtTime(0.12, now + 0.018);
      ng2.gain.linearRampToValueAtTime(0, now + dur * 0.7);

      o1.connect(ng); ng.connect(masterGain);
      o2.connect(ng2); ng2.connect(masterGain);
      // Reverb send
      const rs = ctx.createGain(); rs.gain.value = 0.55;
      ng.connect(rs); rs.connect(reverbNode);

      o1.start(now); o1.stop(now + dur);
      o2.start(now); o2.stop(now + dur);
    }
    const jitter = (Math.random() - 0.5) * 0.022;
    musicTimer = setTimeout(() => note((idx+1) % ELISE.length), (dur + jitter) * 1000);
  }
  note(0);
}

function stopMusic() {
  clearTimeout(musicTimer);
  if (masterGain) {
    const ctx = getCtx();
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
  }
}

/* Music toggle button */
const musicBtn = document.getElementById('music-btn');
musicBtn.addEventListener('click', () => {
  if (!musicPlaying) {
    musicPlaying = true;
    musicBtn.textContent = '♫';
    musicBtn.classList.add('playing');
    startMusic();
  } else {
    musicPlaying = false;
    musicBtn.textContent = '♪';
    musicBtn.classList.remove('playing');
    stopMusic();
  }
});

/* Auto-start music on first any user gesture (satisfies autoplay policy) */
let autoStarted = false;
function tryAutoMusic() {
  if (autoStarted || musicPlaying) return;
  autoStarted = true;
  musicPlaying = true;
  musicBtn.textContent = '♫';
  musicBtn.classList.add('playing');
  startMusic();
}
document.addEventListener('pointerdown', tryAutoMusic, { once: true });
document.addEventListener('keydown',     tryAutoMusic, { once: true });

/* ── PAGE NAVIGATION ── */
const pageBloom = document.getElementById('page-bloom');
const pageMenu  = document.getElementById('page-menu');
const input     = document.getElementById('nickname-input');
const enterBtn  = document.getElementById('enter-btn');

function goToMenu() {
  tryAutoMusic();
  pageBloom.classList.add('page-hidden');
  setTimeout(() => {
    pageBloom.style.display = 'none';
    pageMenu.classList.remove('page-hidden');
  }, 950);
}

enterBtn.addEventListener('click', () => {
  if (!input.value.trim()) { input.focus(); return; }
  goToMenu();
});
input.addEventListener('keydown', e => { if (e.key === 'Enter') enterBtn.click(); });

/* ── GAME OVERLAY ── */
const GAME_NAMES = ['Game 01','Game 02','Game 03','Game 04','Game 05','Game 06'];
const GAME_URLS  = ['','','','','','']; // ← 在这里填入各游戏网址

const overlay   = document.getElementById('game-overlay');
const frame     = document.getElementById('game-frame');
const titleBar  = document.getElementById('game-title-bar');

window.openGame = idx => {
  titleBar.textContent = GAME_NAMES[idx];
  frame.src = GAME_URLS[idx] || 'about:blank';
  overlay.classList.add('open');
};
window.closeGame = () => {
  overlay.classList.remove('open');
  setTimeout(() => { frame.src = 'about:blank'; }, 500);
};
