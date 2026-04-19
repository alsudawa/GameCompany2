// 초경량 Web Audio SFX 합성.
// v2: 콤보 사운드를 펜타토닉 스케일로 교체 — 콤보가 올라갈수록 코드가 쌓이는 느낌.

let _ctx = null;
let _enabled = true;
let _unlocked = false;

function ctx() {
  if (!_ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _ctx;
}

function unlock() {
  const c = ctx();
  if (c && c.state === 'suspended') c.resume();
  _unlocked = true;
}

function tone({ freq = 660, duration = 0.08, type = 'sine', gain = 0.08, sweepTo = null, delay = 0 } = {}) {
  if (!_enabled) return;
  const c = ctx();
  if (!c || !_unlocked) return;

  const start = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweepTo !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), start + duration);
  }
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise({ duration = 0.1, gain = 0.06, delay = 0 } = {}) {
  if (!_enabled) return;
  const c = ctx();
  if (!c || !_unlocked) return;
  const start = c.currentTime + delay;
  const bufferSize = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(g).connect(c.destination);
  src.start(start);
}

// C 메이저 펜타토닉 (C4 기준). 콤보 올라가면 이 배열을 순회하며 점점 높이 올라간다.
const PENTATONIC = [
  261.63, 293.66, 329.63, 392.00, 440.00,   // C4 D4 E4 G4 A4
  523.25, 587.33, 659.25, 783.99, 880.00,   // C5 D5 E5 G5 A5
  1046.5, 1174.7, 1318.5, 1568.0, 1760.0,   // C6 D6 E6 G6 A6
];

export const Audio = {
  setEnabled(on) { _enabled = !!on; },
  isEnabled() { return _enabled; },

  unlockOnFirstInput(scene) {
    if (_unlocked) return;
    const handler = () => {
      unlock();
      scene.input?.off('pointerdown', handler);
    };
    scene.input?.on('pointerdown', handler);
  },

  tap() {
    tone({ freq: 880, duration: 0.05, type: 'square', gain: 0.045, sweepTo: 600 });
    noise({ duration: 0.03, gain: 0.02 });
  },

  // 콤보 레벨에 맞춰 펜타토닉 스케일을 한 계단씩 오른다.
  combo(level = 1) {
    const idx = Math.min(level - 1, PENTATONIC.length - 1);
    const base = PENTATONIC[idx];
    tone({ freq: base, duration: 0.09, type: 'triangle', gain: 0.07, sweepTo: base * 1.4 });
    // 옥타브 위 살짝 겹쳐 코드감
    tone({ freq: base * 2, duration: 0.06, type: 'sine', gain: 0.035 });
  },

  rare() {
    // 반짝 2음
    tone({ freq: 1200, duration: 0.15, type: 'sine', gain: 0.08, sweepTo: 2000 });
    tone({ freq: 1800, duration: 0.2,  type: 'sine', gain: 0.06, sweepTo: 2600, delay: 0.06 });
  },

  bomb() {
    tone({ freq: 180, duration: 0.22, type: 'sawtooth', gain: 0.09, sweepTo: 50 });
    noise({ duration: 0.18, gain: 0.07 });
  },

  purchase() {
    tone({ freq: 660, duration: 0.1,  type: 'triangle', gain: 0.07, sweepTo: 990 });
    tone({ freq: 990, duration: 0.12, type: 'triangle', gain: 0.06, sweepTo: 1320, delay: 0.08 });
  },

  milestone() {
    // C 메이저 3화음 빠르게 상승
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, duration: 0.18, type: 'square', gain: 0.07, delay: i * 0.08 }));
  },

  fanfare() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      tone({ freq: f, duration: 0.22, type: 'square', gain: 0.07, delay: i * 0.1 }));
  },

  rankup() {
    // 짧은 스윕 + 화음
    tone({ freq: 440, duration: 0.12, type: 'sawtooth', gain: 0.05, sweepTo: 880 });
    tone({ freq: 660, duration: 0.2,  type: 'triangle', gain: 0.07, sweepTo: 1320, delay: 0.05 });
  },
};
