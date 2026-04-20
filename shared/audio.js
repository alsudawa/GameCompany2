// 초경량 Web Audio SFX + 절차적 BGM.
// 모든 소리는 오실레이터/노이즈로 합성 — 외부 에셋 없음.
// v3 (Composer 역할): 버스 분리(master/music/sfx), 새 SFX(PERFECT/GREAT/GOOD/MISS/LINK/LEVEL UP),
//                      절차적 BGM 2트랙(메뉴·플레이) + fade in/out.

let _ctx = null;
let _enabled = true;
let _unlocked = false;

// 믹서 버스
let _masterGain = null;
let _musicGain = null;
let _sfxGain = null;

function ctx() {
  if (!_ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx && !_masterGain) {
    _masterGain = _ctx.createGain(); _masterGain.gain.value = 0.9;
    _musicGain  = _ctx.createGain(); _musicGain.gain.value  = 0.5;
    _sfxGain    = _ctx.createGain(); _sfxGain.gain.value    = 1.0;
    _musicGain.connect(_masterGain);
    _sfxGain.connect(_masterGain);
    _masterGain.connect(_ctx.destination);
  }
  return _ctx;
}

function unlock() {
  const c = ctx();
  if (c && c.state === 'suspended') c.resume();
  _unlocked = true;
}

// ───────── 저수준 빌딩 블록 ─────────

// SFX용 톤. out이 없으면 sfxGain으로.
function tone({ freq = 660, duration = 0.08, type = 'sine', gain = 0.08, sweepTo = null, delay = 0, out = null } = {}) {
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

  osc.connect(g).connect(out ?? _sfxGain);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise({ duration = 0.1, gain = 0.06, delay = 0, out = null } = {}) {
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
  src.connect(g).connect(out ?? _sfxGain);
  src.start(start);
}

// 스케줄된 시점에 음을 예약 (BGM 전용 — 절대 시간 사용)
function scheduleNote(noteEl, absTime, out) {
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = noteEl.type ?? 'sine';
  osc.frequency.setValueAtTime(noteEl.freq, absTime);
  if (noteEl.sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(noteEl.sweepTo, absTime + noteEl.dur);
  }
  const peak = noteEl.gain ?? 0.05;
  g.gain.setValueAtTime(0, absTime);
  g.gain.linearRampToValueAtTime(peak, absTime + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, absTime + noteEl.dur);
  osc.connect(g).connect(out);
  osc.start(absTime);
  osc.stop(absTime + noteEl.dur + 0.05);
}

// ───────── BGM 트랙 ─────────
// 각 트랙은 loopSec + notes[]. 노트는 {t, freq, dur, type, gain, sweepTo}.

const BGM_TRACKS = {};
{
  // MENU — A 마이너, 92 BPM, 8박 루프
  const beat = 60 / 92;
  const notes = [];
  // 베이스 라인 (A2, G2, A2, E2)
  [[0, 110], [2 * beat, 98], [4 * beat, 110], [6 * beat, 82.41]].forEach(([t, f]) => {
    notes.push({ t, freq: f, dur: 0.9, type: 'triangle', gain: 0.085 });
  });
  // 아르페지오 (A3-C4-E4-G4 16분)
  const arp = [220, 261.63, 329.63, 392];
  const sx = beat / 4;
  for (let i = 0; i < 32; i++) {
    notes.push({ t: i * sx, freq: arp[i % arp.length], dur: 0.12, type: 'sine', gain: 0.022 });
  }
  // 패드 (Am 화음 지속)
  [220, 261.63, 329.63].forEach((f, i) => {
    notes.push({ t: 0, freq: f, dur: beat * 8, type: 'sine', gain: 0.015 - i * 0.002 });
  });
  BGM_TRACKS.menu = { loopSec: beat * 8, notes };
}
{
  // PLAY — A 마이너, 132 BPM, 8박 루프 (더 긴박)
  const beat = 60 / 132;
  const notes = [];
  // 베이스 8분 패턴 (A A E A  G G A E | A A E A  G G A E)
  const bassSeq = [110, 110, 82.41, 110, 98, 98, 110, 82.41,
                   110, 110, 82.41, 110, 98, 98, 110, 82.41];
  const ex = beat / 2;
  for (let i = 0; i < bassSeq.length; i++) {
    notes.push({ t: i * ex, freq: bassSeq[i], dur: 0.14, type: 'triangle', gain: 0.07 });
  }
  // 리드 아르페지오 8분 (A 마이너 펜타토닉 상승 후 하강)
  const lead = [440, 523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25];
  for (let i = 0; i < 16; i++) {
    notes.push({ t: i * ex, freq: lead[i % lead.length], dur: 0.13, type: 'sine', gain: 0.03 });
  }
  // 킥 느낌 — 매 박자 저음 버스트
  for (let i = 0; i < 8; i++) {
    notes.push({ t: i * beat, freq: 90, dur: 0.08, type: 'sine', gain: 0.055, sweepTo: 45 });
  }
  BGM_TRACKS.play = { loopSec: beat * 8, notes };
}

// BGM 재생 상태
let _bgm = null; // { out: GainNode, stop: () => void, trackId: string }

function startBgm(trackId, { fadeIn = 0.8, volume = 0.5 } = {}) {
  const c = ctx();
  if (!c || !_unlocked) return;
  const track = BGM_TRACKS[trackId];
  if (!track) return;
  if (_bgm && _bgm.trackId === trackId) return; // 이미 재생 중
  stopBgm({ fadeOut: 0.2 });

  const out = c.createGain();
  out.gain.setValueAtTime(0, c.currentTime);
  out.gain.linearRampToValueAtTime(volume, c.currentTime + fadeIn);
  out.connect(_musicGain);

  let active = true;
  let nextStart = c.currentTime + 0.05;

  const scheduleLoop = () => {
    if (!active) return;
    for (const note of track.notes) {
      scheduleNote(note, nextStart + note.t, out);
    }
    nextStart += track.loopSec;
    const waitMs = Math.max(60, (nextStart - c.currentTime - 0.25) * 1000);
    setTimeout(scheduleLoop, waitMs);
  };
  scheduleLoop();

  _bgm = {
    trackId,
    out,
    stop({ fadeOut = 0.4 } = {}) {
      active = false;
      const now = c.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + fadeOut);
      setTimeout(() => { try { out.disconnect(); } catch (_) {} }, fadeOut * 1000 + 200);
    },
  };
}

function stopBgm({ fadeOut = 0.4 } = {}) {
  if (_bgm) {
    _bgm.stop({ fadeOut });
    _bgm = null;
  }
}

// ───────── SFX 팔레트 ─────────

// C 메이저 펜타토닉 — 콤보 스케일
const PENTATONIC = [
  261.63, 293.66, 329.63, 392.00, 440.00,   // C4 D4 E4 G4 A4
  523.25, 587.33, 659.25, 783.99, 880.00,   // C5 D5 E5 G5 A5
  1046.5, 1174.7, 1318.5, 1568.0, 1760.0,   // C6 D6 E6 G6 A6
];

export const Audio = {
  // 설정
  setEnabled(on) {
    _enabled = !!on;
    if (!on && _bgm) stopBgm({ fadeOut: 0.2 });
  },
  isEnabled() { return _enabled; },

  setMasterGain(v) { if (_masterGain) _masterGain.gain.value = v; },
  setMusicGain(v)  { if (_musicGain)  _musicGain.gain.value  = v; },
  setSfxGain(v)    { if (_sfxGain)    _sfxGain.gain.value    = v; },

  unlockOnFirstInput(scene) {
    if (_unlocked) return;
    const handler = () => {
      unlock();
      scene.input?.off('pointerdown', handler);
    };
    scene.input?.on('pointerdown', handler);
  },

  // BGM
  playBgm(trackId, opts) { startBgm(trackId, opts); },
  stopBgm(opts)          { stopBgm(opts); },

  // 기본 이벤트 SFX
  tap() {
    tone({ freq: 880, duration: 0.05, type: 'square', gain: 0.045, sweepTo: 600 });
    noise({ duration: 0.03, gain: 0.02 });
  },

  combo(level = 1) {
    const idx = Math.min(level - 1, PENTATONIC.length - 1);
    const base = PENTATONIC[idx];
    tone({ freq: base, duration: 0.09, type: 'triangle', gain: 0.07, sweepTo: base * 1.4 });
    tone({ freq: base * 2, duration: 0.06, type: 'sine', gain: 0.035 });
  },

  rare() {
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
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, duration: 0.18, type: 'square', gain: 0.07, delay: i * 0.08 }));
  },

  fanfare() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      tone({ freq: f, duration: 0.22, type: 'square', gain: 0.07, delay: i * 0.1 }));
  },

  rankup() {
    tone({ freq: 440, duration: 0.12, type: 'sawtooth', gain: 0.05, sweepTo: 880 });
    tone({ freq: 660, duration: 0.2,  type: 'triangle', gain: 0.07, sweepTo: 1320, delay: 0.05 });
  },

  // ── 판정 SFX ──
  // PERFECT — 밝고 맑은 두 음 (5도 스택)
  perfect() {
    tone({ freq: 1046.5, duration: 0.14, type: 'sine',     gain: 0.07 });
    tone({ freq: 1568.0, duration: 0.22, type: 'sine',     gain: 0.05, delay: 0.03 });
    tone({ freq: 2093.0, duration: 0.12, type: 'triangle', gain: 0.03, delay: 0.06 });
  },
  // GREAT — 안정 3도
  great() {
    tone({ freq: 880,   duration: 0.11, type: 'sine', gain: 0.06 });
    tone({ freq: 1108.7, duration: 0.14, type: 'sine', gain: 0.045, delay: 0.02 });
  },
  // GOOD — 단일 블립
  good() {
    tone({ freq: 660, duration: 0.08, type: 'triangle', gain: 0.05 });
  },
  // MISS — 짧고 낮게 하강
  miss() {
    tone({ freq: 240, duration: 0.18, type: 'sine', gain: 0.05, sweepTo: 120 });
  },
  // EARLY / LATE — 같은 뉘앙스. 아주 작게 썹.
  early() {
    tone({ freq: 340, duration: 0.06, type: 'sine', gain: 0.025, sweepTo: 260 });
  },
  late() {
    tone({ freq: 280, duration: 0.06, type: 'sine', gain: 0.025, sweepTo: 210 });
  },

  // LINK — 두 음 동시 시작 후 상승 (협동감)
  linkBonus() {
    tone({ freq: 523.25, duration: 0.18, type: 'triangle', gain: 0.06, sweepTo: 784.0 });
    tone({ freq: 659.25, duration: 0.22, type: 'sine',     gain: 0.05, sweepTo: 987.8, delay: 0.02 });
    tone({ freq: 1046.5, duration: 0.16, type: 'sine',     gain: 0.04, delay: 0.12 });
  },

  // LEVEL UP — 4음 상행 아르페지오 + 마지막 음 긴 지속
  levelUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, duration: 0.16, type: 'triangle', gain: 0.065, delay: i * 0.07 }));
    tone({ freq: 1318.5, duration: 0.35, type: 'sine', gain: 0.05, delay: 0.28 });
  },
};
