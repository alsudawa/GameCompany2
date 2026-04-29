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

// 타일시트는 23 cols × 13 rows = 299 frames (frame index 0..298).
// 핵심 인덱스만 검증 후 추가. (게임 안 디버그 모드에서 그리드 확인 가능)
// 1-based 파일명(towerDefense_tile001..299) → frame = N-1.
export const TILE = {
  // 지면
  GRASS:        23,    // 순수 녹색 (tile024)
  GRASS_ALT:    24,    // 살짝 무늬 있는 잔디
  DIRT:         28,    // 순수 흙길
  SAND:         33,    // 모래
  STONE:        38,    // 돌바닥
  // 길 — 흙 (가로/세로/코너 4종)
  PATH_H:       46,    // 가로 길
  PATH_V:       69,    // 세로 길
  PATH_CORNER_TL: 47,  // ┌ 좌상 코너
  PATH_CORNER_TR: 48,  // ┐ 우상 코너
  PATH_CORNER_BL: 70,  // └ 좌하 코너
  PATH_CORNER_BR: 71,  // ┘ 우하 코너
  PATH_T_DOWN:  92,    // T 분기 (참고용)
  PATH_END:     45,    // 끝점
  // 타워 베이스 (배치 가능 슬롯)
  TOWER_BASE:   249,   // 회색 사각 + 가운데 원
  TOWER_BASE_DARK: 250,
  // 타워 상단 (4종)
  TOWER_ARCHER: 274,   // 단발 빠름
  TOWER_CANNON: 275,   // 단발 강력
  TOWER_MORTAR: 276,   // 범위 폭격
  TOWER_FROST:  277,   // 둔화
  // 적 유닛
  ENEMY_SOLDIER:    266,
  ENEMY_HEAVY:      267,
  ENEMY_SCOUT:      268,
  ENEMY_TANK:       269,
  ENEMY_BOSS:       270,
  // 발사체
  BULLET_ARROW:     281,
  BULLET_CANNON:    282,
  BULLET_MORTAR:    283,
  BULLET_FROST:     284,
  // 폭발/이펙트
  EXPLOSION_SMALL:  287,
  EXPLOSION_BIG:    288,
  // 장식
  TREE_SMALL:    195,
  TREE_LARGE:    196,
  ROCK_SMALL:    197,
  ROCK_LARGE:    198,
  CRYSTAL:       199,
  GEM_BLUE:      200,
};
// NOTE: 인덱스는 게임 안 디버그 그리드(`?debug` 쿼리)에서 검증한 후 보정.

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
