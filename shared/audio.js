// 초경량 Web Audio 기반 효과음 합성.
// 외부 에셋 없이 "틱", "팡", "트로피 팡파르" 같은 SFX를 코드로 생성한다.
// 첫 사용자 상호작용 후에만 AudioContext가 동작(브라우저 정책).

let _ctx = null;
let _enabled = true;
let _unlocked = false;

function ctx() {
  if (!_ctx && typeof window !== 'undefined' && window.AudioContext) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _ctx;
}

function unlock() {
  const c = ctx();
  if (c && c.state === 'suspended') c.resume();
  _unlocked = true;
}

function blip({ freq = 660, duration = 0.08, type = 'sine', gain = 0.08, sweepTo = null } = {}) {
  if (!_enabled) return;
  const c = ctx();
  if (!c || !_unlocked) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (sweepTo !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), now + duration);
  }

  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export const Audio = {
  setEnabled(on) { _enabled = !!on; },
  isEnabled() { return _enabled; },

  // 첫 사용자 터치/클릭에서 반드시 호출해 AudioContext를 깨운다.
  unlockOnFirstInput(scene) {
    if (_unlocked) return;
    const handler = () => {
      unlock();
      scene.input?.off('pointerdown', handler);
    };
    scene.input?.on('pointerdown', handler);
  },

  tap() { blip({ freq: 880, duration: 0.06, type: 'square', gain: 0.05, sweepTo: 440 }); },
  combo(level = 1) {
    const base = 520 + Math.min(level, 20) * 40;
    blip({ freq: base, duration: 0.09, type: 'triangle', gain: 0.07, sweepTo: base * 1.5 });
  },
  rare() { blip({ freq: 1200, duration: 0.25, type: 'sine', gain: 0.1, sweepTo: 2000 }); },
  bomb() { blip({ freq: 200, duration: 0.25, type: 'sawtooth', gain: 0.09, sweepTo: 60 }); },
  purchase() { blip({ freq: 700, duration: 0.18, type: 'triangle', gain: 0.08, sweepTo: 1400 }); },
  fanfare() {
    // 짧은 3단 상승음
    [523, 659, 784].forEach((f, i) => setTimeout(() => blip({ freq: f, duration: 0.22, type: 'square', gain: 0.07 }), i * 120));
  },
};
