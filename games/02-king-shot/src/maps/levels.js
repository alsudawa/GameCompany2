// 5개 레벨. 아레나 형식: 웨이브 시퀀스 + 각 웨이브 시작 시 등장하는 업그레이드 패드.
// 영웅은 단일 화면 안에서 자유롭게 이동, 적이 가장자리에서 등장.

// 패드 위치 (480x800 화면 기준)
// 5개 슬롯을 정의: 가운데 + 4모서리 변형. 웨이브마다 인덱스로 선택.
const PAD_SLOTS = [
  { x: 240, y: 220 },   // 0 — 위 가운데
  { x: 100, y: 320 },   // 1 — 좌
  { x: 380, y: 320 },   // 2 — 우
  { x: 240, y: 420 },   // 3 — 가운데
  { x: 140, y: 540 },   // 4 — 좌하
  { x: 340, y: 540 },   // 5 — 우하
];

const wave = (label, spawn, pads) => ({ label, spawn, pads, completed: false });

const LEVEL_GATE = {
  id: 'gate',
  label: '01',
  name: 'CASTLE GATE',
  tagline: '왕국의 첫 관문',
  hpMul: 1.0,
  groundTint: 0xffffff,
  waves: [
    wave('WAVE 1', [['soldier', 6, 0.7]],
      [{ slot: 0, type: 'damage',    value: 5,  label: '+5' }]),
    wave('WAVE 2', [['soldier', 6, 0.55], ['scout', 4, 0.6]],
      [{ slot: 1, type: 'multishot', value: 1,  label: '+1' },
       { slot: 2, type: 'firerate',  value: 0.18, label: '+SPD' }]),
    wave('WAVE 3', [['soldier', 8, 0.5], ['scout', 4, 0.55], ['heavy', 2, 1.2]],
      [{ slot: 3, type: 'damage',    value: 12, label: '+12' }]),
    wave('WAVE 4', [['scout', 8, 0.45], ['heavy', 4, 1.0]],
      [{ slot: 4, type: 'multiply',  value: 1.5, label: '×1.5' },
       { slot: 5, type: 'heal',      value: 2,  label: '+2 HP' }]),
    wave('BOSS',   [['boss', 1, 0]], []),
  ],
};

const LEVEL_FOREST = {
  id: 'forest',
  label: '02',
  name: 'WHISPERING FOREST',
  tagline: '속삭이는 숲의 매복',
  hpMul: 1.10,
  groundTint: 0xc8d8b0,
  waves: [
    wave('WAVE 1', [['soldier', 8, 0.6]],
      [{ slot: 0, type: 'damage', value: 8, label: '+8' }]),
    wave('WAVE 2', [['scout', 8, 0.45], ['soldier', 4, 0.6]],
      [{ slot: 1, type: 'multishot', value: 1, label: '+1' },
       { slot: 2, type: 'damage',   value: 12, label: '+12' }]),
    wave('WAVE 3', [['heavy', 4, 1.0], ['scout', 6, 0.5]],
      [{ slot: 3, type: 'firerate', value: 0.20, label: '+SPD' }]),
    wave('WAVE 4', [['soldier', 10, 0.45], ['heavy', 4, 0.95]],
      [{ slot: 4, type: 'multiply',  value: 1.6, label: '×1.6' },
       { slot: 5, type: 'multishot', value: 1,   label: '+1' }]),
    wave('BOSS',   [['scout', 4, 0.5], ['boss', 1, 0]], []),
  ],
};

const LEVEL_PASS = {
  id: 'pass',
  label: '03',
  name: 'MOUNTAIN PASS',
  tagline: '눈 덮인 산길',
  hpMul: 1.20,
  groundTint: 0xe6eef4,
  waves: [
    wave('WAVE 1', [['scout', 8, 0.5]],
      [{ slot: 0, type: 'firerate', value: 0.22, label: '+SPD' }]),
    wave('WAVE 2', [['soldier', 10, 0.5], ['scout', 4, 0.5]],
      [{ slot: 1, type: 'damage',   value: 12, label: '+12' },
       { slot: 2, type: 'multishot', value: 1, label: '+1' }]),
    wave('WAVE 3', [['heavy', 5, 0.95], ['scout', 6, 0.45]],
      [{ slot: 3, type: 'multiply',  value: 1.5, label: '×1.5' }]),
    wave('WAVE 4', [['soldier', 12, 0.4], ['heavy', 5, 0.9]],
      [{ slot: 4, type: 'damage',    value: 25, label: '+25' },
       { slot: 5, type: 'heal',      value: 3,  label: '+3 HP' }]),
    wave('BOSS',   [['heavy', 2, 0.5], ['boss', 1, 0]], []),
  ],
};

const LEVEL_CRYPT = {
  id: 'crypt',
  label: '04',
  name: 'DRAGON CRYPT',
  tagline: '용의 무덤',
  hpMul: 1.30,
  groundTint: 0x9a8aa8,
  waves: [
    wave('WAVE 1', [['soldier', 10, 0.5]],
      [{ slot: 0, type: 'damage', value: 15, label: '+15' }]),
    wave('WAVE 2', [['heavy', 5, 0.9], ['scout', 6, 0.45]],
      [{ slot: 1, type: 'multishot', value: 1, label: '+1' },
       { slot: 2, type: 'firerate',  value: 0.22, label: '+SPD' }]),
    wave('WAVE 3', [['elite', 2, 1.0], ['scout', 8, 0.4]],
      [{ slot: 3, type: 'multiply',  value: 1.7, label: '×1.7' }]),
    wave('WAVE 4', [['heavy', 6, 0.85], ['elite', 3, 0.9], ['soldier', 8, 0.45]],
      [{ slot: 4, type: 'damage',    value: 35, label: '+35' },
       { slot: 5, type: 'heal',      value: 4,  label: '+4 HP' }]),
    wave('BOSS',   [['elite', 2, 0.7], ['boss', 1, 0]], []),
  ],
};

const LEVEL_THRONE = {
  id: 'throne',
  label: '05',
  name: 'ROYAL THRONE',
  tagline: '왕좌의 결전',
  hpMul: 1.40,
  groundTint: 0xe6c8a0,
  waves: [
    wave('WAVE 1', [['heavy', 4, 0.9]],
      [{ slot: 0, type: 'damage', value: 20, label: '+20' }]),
    wave('WAVE 2', [['scout', 10, 0.4], ['soldier', 6, 0.5]],
      [{ slot: 1, type: 'multishot', value: 2, label: '+2' },
       { slot: 2, type: 'firerate',  value: 0.25, label: '+SPD' }]),
    wave('WAVE 3', [['heavy', 6, 0.85], ['elite', 3, 0.9]],
      [{ slot: 3, type: 'multiply',  value: 1.8, label: '×1.8' }]),
    wave('WAVE 4', [['elite', 4, 0.85], ['heavy', 6, 0.8], ['scout', 10, 0.4]],
      [{ slot: 4, type: 'damage',    value: 50, label: '+50' },
       { slot: 5, type: 'multiply',  value: 2,  label: '×2' }]),
    wave('BOSS',   [['elite', 3, 0.6], ['boss', 2, 8]], []),
  ],
};

export const PAD_SLOTS_DATA = PAD_SLOTS;
export const LEVELS = [LEVEL_GATE, LEVEL_FOREST, LEVEL_PASS, LEVEL_CRYPT, LEVEL_THRONE];
export function getLevel(id) {
  return LEVELS.find(l => l.id === id) ?? LEVEL_GATE;
}
