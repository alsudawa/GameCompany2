// King Shot — 타워 디펜스. 경로 따라 적 진군 + 타워 빌드 + 끝점에 왕좌 건물.

export const GAME = {
  width: 480,
  height: 800,
  tileSize: 32,
  spriteTile: 64,
  startGold: 220,
  buildingHp: 10,
  countdown: 3,
};

export const KEY = {
  tilesheet: 'td_sheet',
};

// 타일 인덱스 (Kenney TD Top-Down sheet)
export const TILE = {
  GRASS:           24,
  GRASS_PLAIN:     52,
  TREE:           130,
  TREE_PINE:      134,
  BUSH:           131,
  ROCK_SMALL:     135,
  ROCK_LARGE:     137,
  COIN_GOLD:      266,
  COIN_SILVER:    267,
  GEM_BLUE:       180,
  BULLET_GOLD:    272,
  BULLET_GRAY:    273,
  BULLET_ORANGE:  274,
  BULLET_WHITE:   275,
  BULLET_ROCKET:  251,
  BULLET_ROCKET_RED: 252,
  FLAME_2:        296,
};

export const COLORS = {
  bg:           0x9bce6a,
  goldHud:      0xf4c542,
  goldDeep:     0xc89438,
  parchment:    0xf4e8c8,
  parchmentDim: 0xd9c897,
  woodDark:     0x3e2e1e,
  woodBrown:    0x8b5a3c,
  capeRed:      0xc8302d,
  capeRedDk:    0x8c1e1c,
  knightBlue:   0x3a5a8c,
  knightBlueDk: 0x223a5e,
  skin:         0xe8c8a0,
  hair:         0x5a3a22,
  white:        0xffffff,
  gemBlue:      0x4a8bc2,
  text:         0xf0e6d0,
  textDark:     0x3e2e1e,
};

export const FONT = {
  display: '"Cinzel", "Rajdhani", Georgia, serif',
  body:    '"Rajdhani", Arial, sans-serif',
  mono:    '"JetBrains Mono", "Courier New", monospace',
};

// 타워 정의 — 4종, tier 1~3
export const TOWERS = {
  archer: {
    id: 'archer', name: 'ARCHER', icon: '➶',
    desc: '빠르게 단일 적 사격', color: 0x8ad04f,
    cost:    [60, 90, 140],
    range:   [130, 155, 185],
    damage:  [8, 15, 26],
    fireRate:[0.22, 0.17, 0.13],
    bulletSpeed: 620,
    splash: 0, slow: 0,
    bulletKind: 'archer',
  },
  cannon: {
    id: 'cannon', name: 'CANNON', icon: '⚛',
    desc: '느리지만 강력', color: 0xc89438,
    cost:    [110, 160, 240],
    range:   [115, 135, 160],
    damage:  [22, 40, 75],
    fireRate:[0.65, 0.55, 0.45],
    bulletSpeed: 440,
    splash: 26, slow: 0,
    bulletKind: 'cannon',
  },
  mortar: {
    id: 'mortar', name: 'MORTAR', icon: '✸',
    desc: '범위 폭격', color: 0xa84a4a,
    cost:    [140, 200, 290],
    range:   [180, 200, 230],
    damage:  [20, 34, 62],
    fireRate:[0.95, 0.82, 0.70],
    bulletSpeed: 280,
    splash: 64, slow: 0,
    bulletKind: 'mortar',
  },
  frost: {
    id: 'frost', name: 'FROST', icon: '❆',
    desc: '적을 둔화', color: 0x6abedf,
    cost:    [80, 130, 200],
    range:   [120, 140, 165],
    damage:  [5, 10, 18],
    fireRate:[0.32, 0.27, 0.22],
    bulletSpeed: 520,
    splash: 0, slow: 0.42,
    bulletKind: 'frost',
  },
};

// 적 정의 — 경로 속도(px/s), HP, 보상.
export const ENEMIES = {
  soldier: { hp: 75,   speed: 60,  damage: 1, score: 10, bounty: 8,  sprite: 'soldier_walk', anim: 'soldier_walk', scale: 0.6 },
  scout:   { hp: 42,   speed: 115, damage: 1, score: 14, bounty: 10, sprite: 'zombie2', scale: 0.45 },
  heavy:   { hp: 220,  speed: 45,  damage: 2, score: 30, bounty: 18, sprite: 'robot',   scale: 0.6 },
  elite:   { hp: 420,  speed: 60,  damage: 2, score: 60, bounty: 32, sprite: 'elite',   scale: 0.6 },
  boss:    { hp: 2800, speed: 28,  damage: 5, score: 600, bounty: 200, sprite: 'robot',  scale: 1.1 },
  // 힐러: 주변 아군 HP 회복 — 우선 처치 대상, 사망 시 보너스 보상
  healer:  { hp: 90,   speed: 52,  damage: 1, score: 55,  bounty: 28,  sprite: 'zombie',  scale: 0.5 },
};

export const GRADE_CUTS = {
  S: 8000,
  A: 4500,
  B: 2000,
};
