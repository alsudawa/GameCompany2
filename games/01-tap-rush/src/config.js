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
  { at:  0, label: 'LVL 1', speed: 340, spawn: 0.38, bomb: 0.06, ghost: 0.00 },
  { at:  8, label: 'LVL 2', speed: 420, spawn: 0.32, bomb: 0.09, ghost: 0.00 },
  { at: 16, label: 'LVL 3', speed: 500, spawn: 0.26, bomb: 0.12, ghost: 0.04 },
  { at: 24, label: 'LVL 4', speed: 580, spawn: 0.20, bomb: 0.15, ghost: 0.07 },
  { at: 32, label: 'LVL 5', speed: 640, spawn: 0.15, bomb: 0.18, ghost: 0.10 },
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
// 'good' 바깥을 탭하면 아예 무효(EARLY/LATE) — 오브는 계속 낙하.
export const JUDGMENT = {
  lineYRatio: 0.72,
  perfect: 22,   // 이 범위 안 → PERFECT
  great:   50,   // PERFECT 바깥, 이 범위 안 → GREAT
  good:    110,  // 이 범위 안 → GOOD, 바깥은 탭 무효
  perfectMul: 1.7,
  greatMul:   1.3,
  goodMul:    1.0,
};

export const JUDGMENT_COLORS = {
  PERFECT: 0xffd24a,
  GREAT:   0x00e5ff,
  GOOD:    0xb388ff,
  EARLY:   0x8a8aa8,
  LATE:    0x8a8aa8,
  MISS:    0xff4d6d,
  LINK:    0xff2bd6,
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

// 스테이지 — 각 스테이지는 40초 세션. 내부 5단계 LEVELS ramp는 공통으로 쓰고
// 팔레트·BGM·스폰 배수(polarity)를 달리 해 무드/난이도 색깔을 낸다.
// 사용자는 메뉴에서 스테이지를 골라 반복 플레이한다.
export const STAGES = [
  {
    id: 'dawn',
    label: '01',
    name: 'NEON DAWN',
    tagline: 'WARM UP · SINGLE TAPS',
    bgm: 'stage_dawn',
    palette: { normal: 0x00e5ff, rare: COLORS.gold, bomb: COLORS.red, accent: 0x7af2ff },
    bgBase: 0x03111a,
    bombMul: 0.55,
    rareMul: 1.1,
    speedMul: 0.92,
    spawnMul: 1.08,
    linkChance: 0.10,
  },
  {
    id: 'pulse',
    label: '02',
    name: 'PULSE CITY',
    tagline: 'ALTERNATING LANES',
    bgm: 'stage_pulse',
    palette: { normal: COLORS.magenta, rare: COLORS.gold, bomb: COLORS.red, accent: 0xff7ae5 },
    bgBase: 0x14061a,
    bombMul: 0.9,
    rareMul: 1.0,
    speedMul: 1.0,
    spawnMul: 1.0,
    linkChance: 0.18,
  },
  {
    id: 'drive',
    label: '03',
    name: 'DOUBLE RUSH',
    tagline: 'TWO THUMBS · LINK PAIRS',
    bgm: 'stage_drive',
    palette: { normal: 0xb388ff, rare: COLORS.gold, bomb: COLORS.red, accent: 0xd4b3ff },
    bgBase: 0x0f0528,
    bombMul: 1.0,
    rareMul: 1.0,
    speedMul: 1.06,
    spawnMul: 0.95,
    linkChance: 0.38,
  },
  {
    id: 'storm',
    label: '04',
    name: 'BOMB STORM',
    tagline: 'DODGE THE RED',
    bgm: 'stage_storm',
    palette: { normal: COLORS.red, rare: COLORS.gold, bomb: 0xff1a40, accent: 0xff9aa8 },
    bgBase: 0x1a0408,
    bombMul: 1.9,
    rareMul: 0.7,
    speedMul: 1.08,
    spawnMul: 0.92,
    linkChance: 0.14,
  },
  {
    id: 'star',
    label: '05',
    name: 'STAR OCEAN',
    tagline: 'RARE STORM · FINALE',
    bgm: 'stage_star',
    palette: { normal: 0xffffff, rare: COLORS.gold, bomb: COLORS.red, accent: 0xffe88a },
    bgBase: 0x05081c,
    bombMul: 0.75,
    rareMul: 2.6,
    speedMul: 1.02,
    spawnMul: 0.98,
    linkChance: 0.22,
  },
];

export function getStage(id) {
  return STAGES.find(s => s.id === id) ?? STAGES[0];
}

// 데일리 챌린지 목표점수 — stageId + 날짜로 결정론적으로 생성 (서버 불필요).
export function getDailyTarget(stageId, dateISO) {
  const seed = [...(stageId + dateISO)].reduce((s, c) => s + c.charCodeAt(0), 0);
  const stageIdx = STAGES.findIndex(s => s.id === stageId);
  const base = GRADE_CUTS.B + (stageIdx < 0 ? 0 : stageIdx) * 1200;
  return base + (seed % 5) * 400;
}
