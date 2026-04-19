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

export const SPAWN = {
  intervalStart: 0.45,      // 조금 더 빠르게 시작
  intervalEnd: 0.16,        // 종반엔 거의 연타 수준
};

export const SPEED = {
  start: 240,
  end: 420,
};

export const PROB = {
  rare: 0.12,               // 6%→12%: 젬 맛보기 자주
  bombStart: 0.08,
  bombEnd: 0.14,
};

export const COMBO = {
  windowMs: 700,
  bonusPerStep: 0.08,       // 0.05→0.08: 콤보 보상 체감 UP
  maxMul: 5.0,              // 3.0→5.0: 상한도 확장
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
