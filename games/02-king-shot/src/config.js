// King Shot 밸런스/비주얼 상수.
// 중세 판타지 톤 — 사이버펑크 어휘 사용 안 함.

export const GAME = {
  width: 480,
  height: 800,
  countdown: 3,
  kingY: 660,                // 왕의 기본 Y 위치
  dragYRange: [420, 760],    // 드래그 이동 가능한 Y 범위 (하단 1/3)
};

// 판타지 팔레트
export const COLORS = {
  // 배경
  groundGrass:  0x3a7d44,
  groundStone:  0x6b6e76,
  groundDark:   0x1f3a22,
  // 우드/UI
  woodBrown:    0x8b5a3c,
  woodDark:     0x3e2e1e,
  parchment:    0xf4e8c8,
  parchmentDim: 0xd9c897,
  // 골드 계열 (시그니처)
  gold:         0xf4c542,
  goldDeep:     0xc89438,
  // 캐릭터
  knightBlue:   0x3a5a8c,
  knightBlueDk: 0x223a5e,
  capeRed:      0xc8302d,
  capeRedDk:    0x8c1e1c,
  skin:         0xe8c8a0,
  hair:         0x5a3a22,
  // 적
  bone:         0xe8dcc4,
  goblinGreen:  0x5a7a3a,
  orcRed:       0x8b3a2e,
  wolfGray:     0x6b6e76,
  // 아이템
  gemBlue:      0x4a8bc2,
  heartRed:     0xe84a4a,
  // 이펙트
  sparkYellow:  0xfff4a0,
  smokeGray:    0xa89888,
  torchOrange:  0xd97b3a,
  // 텍스트
  text:         0xf0e6d0,
  textDim:      0x8a8470,
  textDark:     0x3e2e1e,
  white:        0xffffff,
  black:        0x000000,
};

// 폰트 패밀리 문자열 (style 객체에 그대로 사용)
export const FONT = {
  display: '"Cinzel", "Rajdhani", Georgia, serif',
  body:    '"Rajdhani", Arial, sans-serif',
  mono:    '"JetBrains Mono", "Courier New", monospace',
};

// 5스테이지 — 각 스테이지는 1세션. 팔레트·BGM·난이도 배수가 다르다.
// (Step 6에서 확장 — 지금은 골격만)
export const STAGES = [
  {
    id: 'gate',
    label: '01',
    name: 'CASTLE GATE',
    tagline: '왕국의 첫 관문',
    bgm: 'stage_dawn',         // 폴백: Tap Rush BGM 재사용
    bgBase: 0x1f3a22,
    palette: { ground: COLORS.groundGrass, accent: COLORS.gold },
    spawnMul: 0.95,
    hpMul: 0.95,
  },
  {
    id: 'forest',
    label: '02',
    name: 'WHISPERING FOREST',
    tagline: '속삭이는 숲의 매복',
    bgm: 'stage_pulse',
    bgBase: 0x12281a,
    palette: { ground: 0x1f4d2e, accent: COLORS.gold },
    spawnMul: 1.00,
    hpMul: 1.00,
  },
  {
    id: 'pass',
    label: '03',
    name: 'MOUNTAIN PASS',
    tagline: '눈 덮인 산길',
    bgm: 'stage_drive',
    bgBase: 0x202830,
    palette: { ground: 0x7a8a96, accent: COLORS.gold },
    spawnMul: 1.05,
    hpMul: 1.10,
  },
  {
    id: 'crypt',
    label: '04',
    name: 'DRAGON CRYPT',
    tagline: '용의 무덤',
    bgm: 'stage_storm',
    bgBase: 0x1c0a14,
    palette: { ground: 0x4a2438, accent: COLORS.torchOrange },
    spawnMul: 1.10,
    hpMul: 1.15,
  },
  {
    id: 'throne',
    label: '05',
    name: 'ROYAL THRONE',
    tagline: '왕좌의 결전',
    bgm: 'stage_star',
    bgBase: 0x1a0808,
    palette: { ground: 0x6e1818, accent: COLORS.gold },
    spawnMul: 1.15,
    hpMul: 1.25,
  },
];

export function getStage(id) {
  return STAGES.find(s => s.id === id) ?? STAGES[0];
}

// ── 적 종류 ──
export const ENEMY_KIND = {
  GOBLIN:   'goblin',
  WOLF:     'wolf',
  ORC:      'orc',
  ARCHER:   'archer',
  GOLDEN:   'golden',
};

export const ENEMY_TYPES = {
  [ENEMY_KIND.GOBLIN]:  { hp: 1, speed: 80,  score: 10, color: COLORS.goblinGreen, radius: 16 },
  [ENEMY_KIND.WOLF]:    { hp: 1, speed: 140, score: 14, color: COLORS.wolfGray,    radius: 17 },
  [ENEMY_KIND.ORC]:     { hp: 4, speed: 55,  score: 40, color: COLORS.orcRed,      radius: 22, frontShield: 0.5 },
  [ENEMY_KIND.ARCHER]:  { hp: 2, speed: 60,  score: 30, color: COLORS.bone,        radius: 17, fireRate: 1.6, stopY: 0.55 },
  [ENEMY_KIND.GOLDEN]:  { hp: 2, speed: 90,  score: 80, color: COLORS.gold,        radius: 18, gems: 2 },
};

// ── 콤보 ──
export const COMBO = {
  windowMs: 1200,         // 다음 킬까지 콤보 유지 시간
  bonusPerStep: 0.08,     // 콤보당 추가 배율
  maxMul: 5.0,
};

// 콤보 등급 배너 (이상 도달 시 표시)
export const COMBO_RANKS = [
  { at: 5,  label: 'GLORY!',     color: COLORS.gold },
  { at: 12, label: 'VALOR!',     color: COLORS.gemBlue },
  { at: 20, label: 'TRIUMPH!',   color: COLORS.capeRed },
  { at: 35, label: 'CONQUEROR!', color: 0xff6b8a },
  { at: 60, label: 'LEGEND!',    color: COLORS.parchment },
];

// 등급컷 (Step 5 결과 화면용)
export const GRADE_CUTS = {
  S: 8000,
  A: 4500,
  B: 2000,
};
