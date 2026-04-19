// Tap Rush 밸런스/비주얼 상수.
// 기획자가 수치만 바꾸면 즉시 반영되도록 한 곳에 모음.
// v2: "도파민 패스" — 세션 단축 + 스폰 가속 + 레어↑

export const GAME = {
  width: 480,
  height: 800,
  sessionSeconds: 40,       // 60→40: 쉴 틈 없이 짧고 굵게
  countdown: 3,
  spawnMarginTop: 0.15,
};

// SPAWN/SPEED/PROB는 LEVELS가 있는 경우 세션 내 레벨 기준으로 덮어씀.
// (기존 상수는 폴백/참고용)
export const SPAWN = {
  intervalStart: 0.38,
  intervalEnd: 0.13,
};

export const SPEED = {
  start: 340,
  end: 640,
};

export const PROB = {
  rare: 0.12,
  bombStart: 0.06,
  bombEnd: 0.18,
};

// 세션 중 레벨 진행. `at`(초)에 진입, 해당 시점부터 아래 설정 적용.
// 40초 세션을 5단계로 쪼개 점점 긴박해지게.
export const LEVELS = [
  { at:  0, label: 'LVL 1', speed: 340, spawn: 0.38, bomb: 0.06 },
  { at:  8, label: 'LVL 2', speed: 420, spawn: 0.32, bomb: 0.09 },
  { at: 16, label: 'LVL 3', speed: 500, spawn: 0.26, bomb: 0.12 },
  { at: 24, label: 'LVL 4', speed: 580, spawn: 0.20, bomb: 0.15 },
  { at: 32, label: 'LVL 5', speed: 640, spawn: 0.15, bomb: 0.18 },
];

export const COMBO = {
  windowMs: 720,
  bonusPerStep: 0.09,
  maxMul: 6.0,
};

export const SCORE = {
  normal: 10,
  rare: 50,
};

export const GEMS_PER_RARE = 1;

// 콤보 등급 배너 (이 이상 도달 시 배너 표시)
export const COMBO_RANKS = [
  { at: 5,  label: 'NICE!',     color: 0x00e5ff },
  { at: 10, label: 'GREAT!',    color: 0xffd24a },
  { at: 15, label: 'AMAZING!',  color: 0xff2bd6 },
  { at: 25, label: 'INSANE!',   color: 0xff4d6d },
  { at: 40, label: 'GOD LIKE!', color: 0xffffff },
];

// 세션 중 점수 마일스톤 (달성 시 팡파르)
export const SCORE_MILESTONES = [500, 1500, 3500, 7000, 12000, 20000];

export const GRADE_CUTS = {
  S: 25000,   // 밸런스 재조정 (세션 짧아짐 반영)
  A: 12000,
  B: 4000,
};

// 타이밍 판정 — 화면 중하단에 "TAP ZONE" 라인.
// 오브 중심이 라인에 가까울수록 높은 등급.
export const JUDGMENT = {
  lineYRatio: 0.72,
  perfect: 22,   // 이 범위 안 → PERFECT
  great:   50,   // PERFECT 바깥, 이 범위 안 → GREAT
  good:    100,  // 이 범위 안 → GOOD, 그 바깥 → BAD
  perfectMul: 1.6,
  greatMul:   1.25,
  goodMul:    1.0,
  badMul:     0.5,
};

export const JUDGMENT_COLORS = {
  PERFECT: 0xffd24a,
  GREAT:   0x00e5ff,
  GOOD:    0xb388ff,
  BAD:     0x8a8aa8,
  MISS:    0xff4d6d,
};

export const COLORS = {
  bg: 0x0a0a14,
  panel: 0x141428,
  cyan: 0x00e5ff,
  magenta: 0xff2bd6,
  gold: 0xffd24a,
  red: 0xff4d6d,
  white: 0xffffff,
  text: 0xe8e8f0,
  dim: 0x8a8aa8,
};

export const SKIN_EFFECTS = {
  default: { color: COLORS.cyan, particle: COLORS.cyan },
  neon:    { color: COLORS.magenta, particle: COLORS.magenta },
  galaxy:  { color: 0xb388ff, particle: COLORS.gold },
};
