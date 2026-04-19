// Tap Rush 밸런스/비주얼 상수.
// 기획자가 수치만 바꾸면 즉시 반영되도록 한 곳에 모음.

export const GAME = {
  width: 480,
  height: 800,
  sessionSeconds: 60,
  countdown: 3,
  spawnMarginTop: 0.15,   // 상단 15%는 HUD 공간 (오브 스폰 X 범위는 전폭)
};

export const SPAWN = {
  intervalStart: 0.55,
  intervalEnd: 0.28,      // 세션 끝나갈수록 빠르게
};

export const SPEED = {
  start: 210,
  end: 340,
};

export const PROB = {
  rare: 0.06,
  bombStart: 0.08,
  bombEnd: 0.12,
};

export const COMBO = {
  windowMs: 600,           // 이 시간 내 탭 성공 시 콤보 유지
  bonusPerStep: 0.05,      // 1 + combo * 0.05
  maxMul: 3.0,
};

export const SCORE = {
  normal: 10,
  rare: 50,
};

export const GEMS_PER_RARE = 1;

export const GRADE_CUTS = {
  S: 35000,
  A: 15000,
  B: 5000,
  // 이하 C
};

export const COLORS = {
  bg: 0x0a0a14,
  panel: 0x141428,
  cyan: 0x00e5ff,
  magenta: 0xff2bd6,
  gold: 0xffd24a,
  red: 0xff4d6d,
  text: 0xe8e8f0,
  dim: 0x8a8aa8,
};

export const SKIN_EFFECTS = {
  default: { color: COLORS.cyan, particle: COLORS.cyan },
  neon:    { color: COLORS.magenta, particle: COLORS.magenta },
  galaxy:  { color: 0xb388ff, particle: COLORS.gold },
};
