// King Shot Tower Defense — config (밸런스/비주얼 상수).
// 디펜스 맵 + 타워 배치 + Kenney TD Top-Down 스프라이트 사용.

export const GAME = {
  width: 480,
  height: 800,
  tileSize: 32,            // 화면 타일은 32px (Kenney 64px 스프라이트를 0.5 스케일)
  spriteTile: 64,          // 원본 스프라이트 타일 사이즈
  startGold: 200,
  startLives: 12,
  countdown: 3,
};

export const KEY = {
  tilesheet: 'td_sheet',
};

// 타일 인덱스 매핑 (Kenney TD Top-Down sheet 검증 완료)
export const TILE = {
  GRASS:           24,    // 잔디 (도트 무늬)
  GRASS_PLAIN:     52,    // 순수 녹색 (장식 적은 변형)
  PATH:            72,    // 흙길 평면
  SLOT:            38,    // 빈 타워 슬롯 (녹색 사각)
  SLOT_BUILD:      39,    // 슬롯 + 망치 (구매 표시)
  SLOT_SELECTED:   41,    // 슬롯 + 타겟 (선택 표시)

  // 타워 (4종)
  TOWER_ARCHER:    249,   // 녹색 캐논 (단일/빠름)
  TOWER_CANNON:    250,   // 적색 캐논 (단일/강력)
  TOWER_MORTAR:    205,   // 다탄두 발사기 (범위)
  TOWER_FROST:     226,   // 회색 베이스 (둔화 — 시안 틴트)

  // 적 유닛
  ENEMY_TANK_GREEN: 268,
  ENEMY_TANK_TAN:   269,
  ENEMY_PLANE_GREEN: 270,
  ENEMY_PLANE_GRAY:  271,

  // 발사체
  BULLET_GOLD:     272,
  BULLET_GRAY:     273,
  BULLET_ORANGE:   274,
  BULLET_WHITE:    275,
  BULLET_ROCKET:   251,
  BULLET_ROCKET_RED: 252,

  // 폭발/화염
  FLAME_1:        295,
  FLAME_2:        296,
  FLAME_3:        297,
  FLAME_4:        298,

  // 장식
  TREE:           130,
  TREE_PINE:      134,
  BUSH:           131,
  ROCK_SMALL:     135,
  ROCK_LARGE:     137,

  // 아이템
  COIN_GOLD:      266,
  COIN_SILVER:    267,
  GEM_BLUE:       180,
  GEM_DIAMOND:    183,

  // 숫자 (276=0 .. 285=9)
  NUM_0: 276,
};

// 색상 팔레트 (UI/오버레이)
export const COLORS = {
  bg:           0x9bce6a,
  bgDark:       0x2a3a18,
  goldHud:      0xf4c542,
  goldDeep:     0xc89438,
  parchment:    0xf4e8c8,
  woodDark:     0x3e2e1e,
  woodBrown:    0x6e4a2a,
  red:          0xc8302d,
  redDk:        0x8c1e1c,
  blue:         0x4a8bc2,
  white:        0xffffff,
  text:         0xf0e6d0,
  textDark:     0x3e2e1e,
  textDim:      0x8a8470,
  rangeOK:      0x6affd0,
  rangeNo:      0xff5050,
  slotIdle:     0xf4e8c8,
  slotHover:    0xfff4a0,
};

export const FONT = {
  display: '"Cinzel", "Rajdhani", Georgia, serif',
  body:    '"Rajdhani", Arial, sans-serif',
  mono:    '"JetBrains Mono", "Courier New", monospace',
};

// 타워 정의
// damage/range는 해당 tier의 값. fireRate 초당 1/N발.
export const TOWERS = {
  archer: {
    id: 'archer',
    name: 'ARCHER',
    icon: '➶',
    desc: '빠르게 단일 적 사격',
    color: 0x8ad04f,
    cost: [60, 90, 140],          // tier 1 → 2 → 3 가격
    range:    [120, 145, 175],
    damage:   [10, 18, 32],
    fireRate: [0.45, 0.38, 0.30],
    bulletSpeed: 520,
    splash: 0,
    slow: 0,
  },
  cannon: {
    id: 'cannon',
    name: 'CANNON',
    icon: '⚛',
    desc: '느리지만 강력한 단발',
    color: 0xc89438,
    cost: [110, 160, 240],
    range:    [110, 130, 155],
    damage:   [28, 50, 95],
    fireRate: [1.10, 0.95, 0.80],
    bulletSpeed: 360,
    splash: 18,
    slow: 0,
  },
  mortar: {
    id: 'mortar',
    name: 'MORTAR',
    icon: '✸',
    desc: '범위 폭격 (저속)',
    color: 0xa84a4a,
    cost: [140, 200, 290],
    range:    [180, 200, 230],
    damage:   [22, 38, 70],
    fireRate: [1.60, 1.40, 1.20],
    bulletSpeed: 240,
    splash: 60,
    slow: 0,
  },
  frost: {
    id: 'frost',
    name: 'FROST',
    icon: '❆',
    desc: '적을 둔화시킴',
    color: 0x6abedf,
    cost: [80, 130, 200],
    range:    [110, 130, 155],
    damage:   [6, 12, 22],
    fireRate: [0.55, 0.48, 0.40],
    bulletSpeed: 460,
    splash: 0,
    slow: 0.40,                   // 0.40 = 40% 둔화
  },
};

// 적 정의
export const ENEMIES = {
  soldier: { name: 'SOLDIER', hp: 60,  speed: 60,  bounty: 8,  scoreVal: 10, tile: 'ENEMY_SOLDIER', scale: 0.6 },
  scout:   { name: 'SCOUT',   hp: 40,  speed: 110, bounty: 10, scoreVal: 14, tile: 'ENEMY_SCOUT',   scale: 0.55 },
  heavy:   { name: 'HEAVY',   hp: 180, speed: 45,  bounty: 18, scoreVal: 30, tile: 'ENEMY_HEAVY',   scale: 0.65 },
  tank:    { name: 'TANK',    hp: 420, speed: 30,  bounty: 36, scoreVal: 60, tile: 'ENEMY_TANK',    scale: 0.85 },
  boss:    { name: 'BOSS',    hp: 1800, speed: 22, bounty: 200, scoreVal: 500, tile: 'ENEMY_BOSS',  scale: 1.1 },
};

// 등급컷
export const GRADE_CUTS = {
  S: 8000,
  A: 4500,
  B: 2000,
};
