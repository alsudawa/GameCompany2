// King Shot — config (밸런스/비주얼 상수).
// 정통 King Shot 스타일: 스크롤링 레벨 + 드래그 영웅 + 자동 사격 + 업그레이드 게이트.

export const GAME = {
  width: 480,
  height: 800,
  spriteTile: 64,
  // 영웅 화면 Y (고정 — 월드는 위로 스크롤)
  heroScreenY: 580,
  heroDragXMin: 50,
  heroDragXMax: 430,
  // 자동 전진 속도 (월드 Y 증가 px/s)
  scrollSpeed: 80,
  startLives: 3,           // 영웅 HP
};

export const KEY = {
  tilesheet: 'td_sheet',
};

// 사용하는 타일 frame 인덱스 (Kenney TD Top-Down sheet)
export const TILE = {
  GRASS:           24,
  GRASS_PLAIN:     52,
  TREE:           130,
  TREE_PINE:      134,
  BUSH:           131,
  ROCK_SMALL:     135,
  ROCK_LARGE:     137,
  // 적 유닛 (탑다운)
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
  // 효과
  FLAME_2:         296,
  // 아이템
  COIN_GOLD:       266,
  COIN_SILVER:     267,
  GEM_BLUE:        180,
};

// 색상
export const COLORS = {
  bg:           0x9bce6a,
  bgDark:       0x2a3a18,
  goldHud:      0xf4c542,
  goldDeep:     0xc89438,
  parchment:    0xf4e8c8,
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

// 영웅 무기 베이스 스탯 (게이트로 강화)
export const WEAPON_BASE = {
  damage:        10,
  fireRate:      0.42,    // 초/발 (낮을수록 빠름)
  projectileSpeed: 600,
  multishot:     1,
  range:         280,
  spread:        0.10,    // 라디안 (멀티샷 시 좌우 펴짐)
};

// 게이트 업그레이드 타입
export const UPGRADE_TYPES = {
  damage:    { glyph: '+DMG',  color: 0xff8a3a, apply: (w, v) => { w.damage += v; } },
  multishot: { glyph: '+ARROW', color: 0xb38aff, apply: (w, v) => { w.multishot += v; } },
  firerate:  { glyph: '+SPD',  color: 0x8ad04f, apply: (w, v) => { w.fireRate = Math.max(0.06, w.fireRate * (1 - v)); } },
  range:     { glyph: '+RNG',  color: 0x8ad0ff, apply: (w, v) => { w.range += v; } },
  multiply:  { glyph: '×',     color: 0xf4c542, apply: (w, v) => { w.damage = Math.round(w.damage * v); } },
  heal:      { glyph: '+HP',   color: 0xff5050, apply: (w, v, k) => { k.hp = Math.min(k.maxHp, k.hp + v); } },
};

// 적 정의
export const ENEMIES = {
  soldier: { hp: 30,  speed: 70,  damage: 1, score: 10, bounty: 4,  tile: 'ENEMY_TANK_GREEN', tint: 0xffffff, scale: 0.55 },
  scout:   { hp: 18,  speed: 130, damage: 1, score: 14, bounty: 5,  tile: 'ENEMY_PLANE_GREEN', tint: 0xffffff, scale: 0.5 },
  heavy:   { hp: 80,  speed: 50,  damage: 2, score: 30, bounty: 12, tile: 'ENEMY_TANK_TAN',    tint: 0xffffff, scale: 0.65 },
  elite:   { hp: 140, speed: 60,  damage: 2, score: 60, bounty: 20, tile: 'ENEMY_PLANE_GRAY',  tint: 0xc8c8d0, scale: 0.7 },
  boss:    { hp: 1500, speed: 28, damage: 3, score: 600, bounty: 200, tile: 'ENEMY_TANK_TAN',  tint: 0xff8080, scale: 1.4 },
};

// 등급컷
export const GRADE_CUTS = {
  S: 5000,
  A: 2800,
  B: 1300,
};
