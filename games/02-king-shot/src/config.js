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

// ── 웨이브 ──
// 일반 웨이브 4 + 보스 1. 각 웨이브는 (duration초 동안 스폰) 후 모든 적 소탕될 때까지 지속.
// spawnRate는 베이스 간격(낮을수록 빠름).
export const WAVES = [
  {
    label: 'WAVE 1',
    duration: 12,
    spawnRate: 1.20,
    weights: [
      { kind: ENEMY_KIND.GOBLIN, w: 0.70 },
      { kind: ENEMY_KIND.WOLF,   w: 0.18 },
      { kind: ENEMY_KIND.ARCHER, w: 0.10 },
      { kind: ENEMY_KIND.GOLDEN, w: 0.02 },
    ],
  },
  {
    label: 'WAVE 2',
    duration: 13,
    spawnRate: 1.00,
    weights: [
      { kind: ENEMY_KIND.GOBLIN, w: 0.45 },
      { kind: ENEMY_KIND.WOLF,   w: 0.30 },
      { kind: ENEMY_KIND.ORC,    w: 0.10 },
      { kind: ENEMY_KIND.ARCHER, w: 0.12 },
      { kind: ENEMY_KIND.GOLDEN, w: 0.03 },
    ],
  },
  {
    label: 'WAVE 3',
    duration: 14,
    spawnRate: 0.85,
    weights: [
      { kind: ENEMY_KIND.GOBLIN, w: 0.30 },
      { kind: ENEMY_KIND.WOLF,   w: 0.30 },
      { kind: ENEMY_KIND.ORC,    w: 0.18 },
      { kind: ENEMY_KIND.ARCHER, w: 0.18 },
      { kind: ENEMY_KIND.GOLDEN, w: 0.04 },
    ],
  },
  {
    label: 'WAVE 4',
    duration: 15,
    spawnRate: 0.72,
    weights: [
      { kind: ENEMY_KIND.GOBLIN, w: 0.22 },
      { kind: ENEMY_KIND.WOLF,   w: 0.30 },
      { kind: ENEMY_KIND.ORC,    w: 0.25 },
      { kind: ENEMY_KIND.ARCHER, w: 0.18 },
      { kind: ENEMY_KIND.GOLDEN, w: 0.05 },
    ],
  },
  {
    label: 'WAVE 5',
    duration: 0,           // 보스 웨이브 — 보스 등장 (Step 5)
    boss: true,
  },
];

// ── 업그레이드 ──
// apply(weapon, king) 함수에서 즉시 효과 부여.
export const UPGRADES = [
  {
    id: 'rapid', name: 'RAPID FIRE', glyph: '➶',
    desc: '활시위가 빨라진다',
    color: 0xf4c542,
    apply: (w) => { w.fireRate = Math.max(0.07, w.fireRate * 0.78); },
  },
  {
    id: 'multi', name: 'TWIN ARROWS', glyph: '⫷',
    desc: '한 번에 화살 +1',
    color: 0xb38aff,
    apply: (w) => { w.multishot += 1; },
  },
  {
    id: 'pierce', name: 'PIERCE', glyph: '↠',
    desc: '화살이 적을 관통',
    color: 0x8ad0ff,
    apply: (w) => { w.pierce += 1; },
  },
  {
    id: 'damage', name: 'SHARP STEEL', glyph: '⚔',
    desc: '데미지 +1',
    color: 0xe0b070,
    apply: (w) => { w.damage += 1; },
  },
  {
    id: 'crit', name: 'CRIT EYE', glyph: '✦',
    desc: '크리티컬 확률 +10%',
    color: 0xffd070,
    apply: (w) => { w.crit = Math.min(0.85, w.crit + 0.10); },
  },
  {
    id: 'speed', name: 'SWIFT BOOTS', glyph: '⇶',
    desc: '왕의 이동 속도 +15%',
    color: 0x9ad0a0,
    apply: (w, k) => { k.moveSpeed *= 1.15; },
  },
  {
    id: 'maxhp', name: 'IRON THRONE', glyph: '♥',
    desc: '최대 HP +1, HP 회복',
    color: 0xff7080,
    apply: (w, k) => { k.maxHp += 1; k.hp = k.maxHp; },
  },
  {
    id: 'projspeed', name: 'TAUT BOWSTRING', glyph: '➟',
    desc: '화살 속도 +30%',
    color: 0xc0e0ff,
    apply: (w) => { w.projectileSpeed *= 1.3; },
  },
  {
    id: 'lifesteal', name: 'BLOOD CROWN', glyph: '✝',
    desc: '15% 확률로 처치 시 HP +1',
    color: 0xc8302d,
    apply: (w) => { w.lifesteal = (w.lifesteal || 0) + 0.15; },
  },
  {
    id: 'magnet', name: 'GEM MAGNET', glyph: '◈',
    desc: '아이템 자석 범위 확대',
    color: 0x4a8bc2,
    apply: (w, k) => { k.magnetRadius = (k.magnetRadius || 140) + 80; },
  },
];

// 무기 베이스 스탯 (King.js 안에도 있지만 여기서 한 번 더 정의 — 기획자가 보기 쉽게)
export const WEAPON_BASE = {
  damage: 1,
  fireRate: 0.28,
  projectileSpeed: 760,
  multishot: 1,
  pierce: 0,
  splashRadius: 0,
  crit: 0.05,
  lifesteal: 0,
};
