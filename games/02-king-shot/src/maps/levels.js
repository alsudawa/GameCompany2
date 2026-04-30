// 5개 레벨 — 스크롤링 행진. event.y에 도달하면 트리거.
// kind:
//   'spawn'  — 적을 즉시 다수 스폰 (화면 위쪽에서 영웅을 향해 달려옴)
//   'gate'   — 좌/우 업그레이드 게이트 (영웅 X로 선택)
//   'boss'   — 보스 등장 (스폰처럼 작동)
//   'wave'   — n초 동안 일정 간격으로 스폰

const LV = {
  // 공통 빌더 헬퍼: spawn(yPos, [['soldier', 4], ['scout', 2]])
};

function spawn(y, enemies) {
  return { y, kind: 'spawn', enemies };
}
function wave(y, duration, interval, enemies) {
  return { y, kind: 'wave', duration, interval, enemies };
}
function gate(y, left, right) {
  return { y, kind: 'gate', left, right };
}
function boss(y, kind = 'boss') {
  return { y, kind: 'boss', enemyKind: kind };
}

const LEVEL_GATE = {
  id: 'gate',
  label: '01',
  name: 'CASTLE GATE',
  tagline: '왕국의 첫 관문',
  length: 4500,
  hpMul: 1.0,
  groundTint: 0xffffff,
  events: [
    spawn(400,  [['soldier', 4]]),
    gate (700,  { type: 'damage', value: 5, label: '+5 DMG' }, { type: 'multishot', value: 1, label: '+1 ARROW' }),
    spawn(1100, [['soldier', 6]]),
    spawn(1400, [['scout', 3]]),
    gate (1700, { type: 'firerate', value: 0.18, label: '+SPD' }, { type: 'damage', value: 12, label: '+12 DMG' }),
    spawn(2100, [['soldier', 6], ['scout', 3]]),
    gate (2500, { type: 'multishot', value: 1, label: '+1 ARROW' }, { type: 'multiply', value: 1.5, label: '×1.5 DMG' }),
    spawn(2900, [['heavy', 3]]),
    spawn(3300, [['soldier', 8], ['scout', 4]]),
    gate (3700, { type: 'heal', value: 2, label: '+2 HP' }, { type: 'damage', value: 25, label: '+25 DMG' }),
    boss (4200),
  ],
};

const LEVEL_FOREST = {
  id: 'forest',
  label: '02',
  name: 'WHISPERING FOREST',
  tagline: '속삭이는 숲의 매복',
  length: 4800,
  hpMul: 1.10,
  groundTint: 0xc8d8b0,
  events: [
    spawn(400,  [['soldier', 6]]),
    gate (700,  { type: 'damage', value: 8, label: '+8 DMG' }, { type: 'firerate', value: 0.18, label: '+SPD' }),
    spawn(1100, [['scout', 6]]),
    spawn(1500, [['soldier', 4], ['heavy', 1]]),
    gate (1900, { type: 'multishot', value: 1, label: '+1 ARROW' }, { type: 'damage', value: 20, label: '+20 DMG' }),
    spawn(2300, [['heavy', 3], ['scout', 4]]),
    gate (2700, { type: 'multiply', value: 1.6, label: '×1.6' }, { type: 'multishot', value: 2, label: '+2 ARROW' }),
    spawn(3100, [['soldier', 8], ['heavy', 2]]),
    spawn(3600, [['scout', 8]]),
    gate (4100, { type: 'heal', value: 3, label: '+3 HP' }, { type: 'damage', value: 40, label: '+40 DMG' }),
    boss (4500),
  ],
};

const LEVEL_PASS = {
  id: 'pass',
  label: '03',
  name: 'MOUNTAIN PASS',
  tagline: '눈 덮인 산길',
  length: 5000,
  hpMul: 1.20,
  groundTint: 0xe6eef4,
  events: [
    spawn(400,  [['scout', 6]]),
    gate (700,  { type: 'firerate', value: 0.22, label: '+SPD' }, { type: 'damage', value: 12, label: '+12 DMG' }),
    spawn(1100, [['soldier', 8]]),
    spawn(1500, [['heavy', 3]]),
    gate (1900, { type: 'multishot', value: 1, label: '+1 ARROW' }, { type: 'multiply', value: 1.5, label: '×1.5' }),
    spawn(2300, [['scout', 10]]),
    gate (2700, { type: 'damage', value: 30, label: '+30 DMG' }, { type: 'firerate', value: 0.20, label: '+SPD' }),
    spawn(3100, [['heavy', 4], ['soldier', 6]]),
    spawn(3700, [['scout', 8], ['heavy', 3]]),
    gate (4200, { type: 'multishot', value: 2, label: '+2 ARROW' }, { type: 'multiply', value: 2, label: '×2' }),
    boss (4700),
  ],
};

const LEVEL_CRYPT = {
  id: 'crypt',
  label: '04',
  name: 'DRAGON CRYPT',
  tagline: '용의 무덤',
  length: 5200,
  hpMul: 1.30,
  groundTint: 0x9a8aa8,
  events: [
    spawn(400,  [['soldier', 8]]),
    gate (700,  { type: 'damage', value: 15, label: '+15 DMG' }, { type: 'multishot', value: 1, label: '+1 ARROW' }),
    spawn(1100, [['heavy', 4]]),
    spawn(1500, [['scout', 8], ['soldier', 4]]),
    gate (1900, { type: 'firerate', value: 0.25, label: '+SPD' }, { type: 'multiply', value: 1.7, label: '×1.7' }),
    spawn(2300, [['heavy', 5], ['scout', 6]]),
    gate (2700, { type: 'damage', value: 45, label: '+45 DMG' }, { type: 'multishot', value: 2, label: '+2 ARROW' }),
    spawn(3100, [['elite', 2], ['heavy', 3]]),
    spawn(3700, [['scout', 12]]),
    gate (4200, { type: 'heal', value: 4, label: '+4 HP' }, { type: 'multiply', value: 2.2, label: '×2.2' }),
    boss (4900),
  ],
};

const LEVEL_THRONE = {
  id: 'throne',
  label: '05',
  name: 'ROYAL THRONE',
  tagline: '왕좌의 결전',
  length: 5500,
  hpMul: 1.40,
  groundTint: 0xe6c8a0,
  events: [
    spawn(400,  [['heavy', 4]]),
    gate (700,  { type: 'damage', value: 20, label: '+20 DMG' }, { type: 'firerate', value: 0.25, label: '+SPD' }),
    spawn(1100, [['scout', 10]]),
    spawn(1500, [['heavy', 5], ['scout', 4]]),
    gate (1900, { type: 'multishot', value: 2, label: '+2 ARROW' }, { type: 'multiply', value: 1.8, label: '×1.8' }),
    spawn(2300, [['elite', 3], ['heavy', 4]]),
    gate (2700, { type: 'damage', value: 60, label: '+60 DMG' }, { type: 'multiply', value: 2, label: '×2' }),
    spawn(3100, [['elite', 4], ['scout', 8]]),
    spawn(3700, [['heavy', 6], ['elite', 3]]),
    gate (4200, { type: 'heal', value: 5, label: '+5 HP' }, { type: 'multiply', value: 2.5, label: '×2.5' }),
    spawn(4600, [['elite', 5], ['heavy', 5]]),
    boss (5200),
  ],
};

export const LEVELS = [LEVEL_GATE, LEVEL_FOREST, LEVEL_PASS, LEVEL_CRYPT, LEVEL_THRONE];

export function getLevel(id) {
  return LEVELS.find(l => l.id === id) ?? LEVEL_GATE;
}
