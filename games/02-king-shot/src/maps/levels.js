// 5개 레벨. 경로 + 타워 슬롯 + 끝점에 왕좌 건물 + 웨이브.
// 타일 좌표 (col, row) — 화면은 15 cols × 25 rows (32px 타일).

const LEVEL_GATE = {
  id: 'gate', label: '01', name: 'CASTLE GATE',
  tagline: '왕국의 첫 관문',
  cols: 15, rows: 25,
  hpMul: 1.0, groundTint: 0xffffff,
  pathWaypoints: [
    [7, -1], [7, 4], [11, 4], [11, 9], [3, 9], [3, 14],
    [11, 14], [11, 19], [7, 19], [7, 23],
  ],
  throne: { col: 7, row: 23 },
  towerSlots: [
    [4, 5], [9, 5],
    [5, 10], [9, 10],
    [4, 15], [9, 15],
    [5, 20], [9, 20],
  ],
  decorations: [
    [1, 1, 'TREE'], [13, 2, 'TREE'],
    [0, 7, 'ROCK_SMALL'], [14, 6, 'TREE_PINE'],
    [0, 12, 'TREE_PINE'], [13, 11, 'BUSH'],
    [1, 17, 'TREE'], [14, 16, 'ROCK_LARGE'],
    [0, 22, 'BUSH'], [14, 22, 'TREE'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 10, 0.85, 0]] },
    { label: 'WAVE 2/5', units: [['soldier', 8, 0.7, 0], ['scout', 5, 0.6, 6]] },
    { label: 'WAVE 3/5', units: [['soldier', 12, 0.6, 0], ['heavy', 3, 1.2, 4]] },
    { label: 'WAVE 4/5', units: [['scout', 8, 0.5, 0], ['heavy', 5, 1.0, 4], ['soldier', 6, 0.55, 10]] },
    { label: 'WAVE 5 — BOSS', units: [['soldier', 12, 0.45, 0], ['heavy', 4, 0.9, 6], ['boss', 1, 0, 14]] },
  ],
};

const LEVEL_FOREST = {
  id: 'forest', label: '02', name: 'WHISPERING FOREST',
  tagline: '속삭이는 숲의 매복',
  cols: 15, rows: 25,
  hpMul: 1.10, groundTint: 0xc8d8b0,
  pathWaypoints: [
    [3, -1], [3, 4], [10, 4], [10, 9], [4, 9], [4, 14],
    [11, 14], [11, 19], [3, 19], [3, 23],
  ],
  throne: { col: 3, row: 23 },
  towerSlots: [
    [1, 5], [6, 5], [12, 5],
    [1, 10], [7, 10], [12, 10],
    [1, 15], [7, 15], [13, 15],
    [1, 20], [6, 20], [12, 20],
  ],
  decorations: [
    [13, 1, 'TREE_PINE'], [12, 2, 'TREE'],
    [0, 6, 'TREE_PINE'], [14, 7, 'TREE_PINE'],
    [13, 11, 'BUSH'], [14, 12, 'TREE_PINE'],
    [0, 17, 'TREE'], [14, 17, 'TREE'],
    [14, 22, 'TREE_PINE'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 12, 0.7, 0]] },
    { label: 'WAVE 2/5', units: [['soldier', 8, 0.6, 0], ['scout', 6, 0.5, 5]] },
    { label: 'WAVE 3/5', units: [['soldier', 12, 0.55, 0], ['heavy', 5, 1.1, 5]] },
    { label: 'WAVE 4/5', units: [['scout', 10, 0.45, 0], ['heavy', 6, 1.0, 6]] },
    { label: 'WAVE 5 — BOSS', units: [['soldier', 14, 0.4, 0], ['heavy', 6, 0.9, 6], ['boss', 1, 0, 14]] },
  ],
};

const LEVEL_PASS = {
  id: 'pass', label: '03', name: 'MOUNTAIN PASS',
  tagline: '눈 덮인 산길',
  cols: 15, rows: 25,
  hpMul: 1.20, groundTint: 0xe6eef4,
  pathWaypoints: [
    [-1, 5], [4, 5], [4, 12], [11, 12], [11, 19], [11, 23],
  ],
  throne: { col: 11, row: 23 },
  towerSlots: [
    [2, 3], [6, 3], [10, 3],
    [2, 7], [10, 7],
    [2, 14], [7, 14], [13, 14],
    [2, 17], [9, 17], [13, 17],
    [2, 22], [6, 22], [9, 22], [13, 21],
  ],
  decorations: [
    [12, 1, 'ROCK_LARGE'], [13, 3, 'TREE_PINE'],
    [0, 9, 'ROCK_SMALL'], [14, 10, 'TREE_PINE'],
    [0, 15, 'TREE_PINE'], [13, 21, 'ROCK_LARGE'],
    [0, 22, 'ROCK_SMALL'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 14, 0.7, 0]] },
    { label: 'WAVE 2/5', units: [['soldier', 8, 0.55, 0], ['scout', 8, 0.45, 4]] },
    { label: 'WAVE 3/5', units: [['heavy', 8, 0.95, 0], ['soldier', 12, 0.55, 4]] },
    { label: 'WAVE 4/5', units: [['scout', 12, 0.4, 0], ['heavy', 8, 0.9, 5]] },
    { label: 'WAVE 5 — BOSS', units: [['soldier', 14, 0.35, 0], ['heavy', 8, 0.8, 6], ['boss', 1, 0, 16]] },
  ],
};

const LEVEL_CRYPT = {
  id: 'crypt', label: '04', name: 'DRAGON CRYPT',
  tagline: '용의 무덤',
  cols: 15, rows: 25,
  hpMul: 1.30, groundTint: 0x9a8aa8,
  pathWaypoints: [
    [7, -1], [7, 3], [3, 3], [3, 8], [11, 8], [11, 13],
    [3, 13], [3, 18], [11, 18], [11, 23],
  ],
  throne: { col: 11, row: 23 },
  towerSlots: [
    [5, 4], [9, 4],
    [1, 6], [13, 6],
    [5, 9], [9, 9],
    [5, 11], [9, 11],
    [5, 14], [9, 14],
    [5, 16], [9, 16],
    [5, 19], [9, 19],
    [5, 21], [9, 21],
  ],
  decorations: [
    [13, 1, 'ROCK_LARGE'], [13, 3, 'ROCK_SMALL'],
    [0, 5, 'ROCK_SMALL'], [14, 8, 'ROCK_LARGE'],
    [0, 11, 'ROCK_LARGE'], [14, 14, 'ROCK_SMALL'],
    [0, 17, 'ROCK_SMALL'], [14, 20, 'ROCK_LARGE'],
    [1, 22, 'ROCK_LARGE'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 16, 0.6, 0]] },
    { label: 'WAVE 2/5', units: [['heavy', 6, 1.0, 0], ['scout', 8, 0.45, 5]] },
    { label: 'WAVE 3/5', units: [['soldier', 14, 0.5, 0], ['heavy', 8, 0.95, 4]] },
    { label: 'WAVE 4/5', units: [['scout', 14, 0.4, 0], ['heavy', 10, 0.85, 5], ['elite', 2, 1.5, 14]] },
    { label: 'WAVE 5 — BOSS', units: [['heavy', 12, 0.7, 0], ['scout', 14, 0.4, 6], ['boss', 1, 0, 18]] },
  ],
};

const LEVEL_THRONE = {
  id: 'throne', label: '05', name: 'ROYAL THRONE',
  tagline: '왕좌의 결전',
  cols: 15, rows: 25,
  hpMul: 1.40, groundTint: 0xe6c8a0,
  pathWaypoints: [
    [7, -1], [7, 3], [12, 3], [12, 7], [3, 7], [3, 11],
    [11, 11], [11, 15], [3, 15], [3, 19], [11, 19], [11, 23],
  ],
  throne: { col: 11, row: 23 },
  towerSlots: [
    [5, 5], [9, 5],
    [5, 9], [13, 9],
    [5, 13], [9, 13],
    [5, 17], [13, 17],
    [5, 21], [9, 21],
    [1, 6], [1, 12], [1, 18], [1, 22],
  ],
  decorations: [
    [13, 1, 'TREE'], [13, 5, 'BUSH'],
    [13, 12, 'TREE'], [0, 9, 'TREE_PINE'],
    [13, 16, 'TREE_PINE'], [0, 17, 'BUSH'],
    [13, 22, 'TREE'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 18, 0.55, 0]] },
    { label: 'WAVE 2/5', units: [['soldier', 12, 0.5, 0], ['heavy', 6, 0.95, 5], ['scout', 8, 0.45, 8]] },
    { label: 'WAVE 3/5', units: [['soldier', 18, 0.45, 0], ['heavy', 10, 0.85, 5], ['elite', 2, 1.5, 16]] },
    { label: 'WAVE 4/5', units: [['scout', 16, 0.4, 0], ['heavy', 12, 0.8, 5], ['elite', 4, 1.4, 14]] },
    { label: 'WAVE 5 — FINAL', units: [['soldier', 20, 0.35, 0], ['heavy', 14, 0.7, 6], ['elite', 4, 1.2, 14], ['boss', 2, 6, 22]] },
  ],
};

export const LEVELS = [LEVEL_GATE, LEVEL_FOREST, LEVEL_PASS, LEVEL_CRYPT, LEVEL_THRONE];

export function getLevel(id) {
  return LEVELS.find(l => l.id === id) ?? LEVEL_GATE;
}
