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
    // 좌측 숲 라인
    [0, 1, 'TREE_PINE'], [1, 0, 'TREE'], [1, 1, 'TREE'], [0, 3, 'BUSH'],
    [0, 6, 'TREE_PINE'], [0, 8, 'BUSH'], [1, 11, 'TREE'],
    [0, 12, 'TREE_PINE'], [0, 13, 'TREE'], [1, 16, 'BUSH'],
    [1, 17, 'TREE'], [0, 18, 'TREE_PINE'], [0, 21, 'BUSH'],
    [0, 22, 'BUSH'], [1, 22, 'TREE'],
    // 우측 숲 라인
    [13, 0, 'TREE'], [14, 1, 'TREE_PINE'], [13, 2, 'TREE'], [14, 3, 'BUSH'],
    [14, 6, 'TREE_PINE'], [14, 7, 'TREE'], [13, 11, 'BUSH'],
    [13, 12, 'TREE_PINE'], [14, 13, 'TREE'], [14, 17, 'TREE_PINE'],
    [13, 16, 'ROCK_LARGE'], [14, 21, 'TREE'], [14, 22, 'TREE'],
    // 경로 사이 자투리 풀밭에 디테일
    [5, 2, 'BUSH'], [9, 2, 'ROCK_SMALL'],
    [5, 6, 'ROCK_SMALL'], [9, 7, 'BUSH'],
    [7, 11, 'BUSH'], [4, 12, 'ROCK_SMALL'],
    [7, 16, 'ROCK_SMALL'], [9, 17, 'BUSH'],
    [5, 22, 'BUSH'], [9, 22, 'ROCK_SMALL'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 14, 0.32, 0]] },
    { label: 'WAVE 2/5', units: [['soldier', 12, 0.28, 0], ['scout', 8, 0.22, 4]] },
    { label: 'WAVE 3/5', units: [['soldier', 18, 0.24, 0], ['heavy', 4, 0.7, 3]] },
    { label: 'WAVE 4/5', units: [['scout', 14, 0.2, 0], ['heavy', 6, 0.55, 3], ['soldier', 10, 0.22, 6]] },
    { label: 'WAVE 5 — BOSS', units: [['soldier', 18, 0.18, 0], ['heavy', 6, 0.5, 4], ['boss', 1, 0, 10]] },
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
    // 깊은 침엽수 숲 — 좌측
    [0, 0, 'TREE_PINE'], [1, 1, 'TREE_PINE'], [0, 2, 'TREE'],
    [0, 6, 'TREE_PINE'], [0, 7, 'TREE_PINE'], [1, 8, 'BUSH'],
    [0, 11, 'TREE_PINE'], [0, 12, 'TREE'], [1, 13, 'TREE_PINE'],
    [0, 17, 'TREE'], [0, 18, 'TREE_PINE'], [1, 19, 'BUSH'],
    [0, 22, 'TREE_PINE'], [0, 23, 'TREE'],
    // 우측
    [13, 0, 'TREE_PINE'], [14, 1, 'TREE_PINE'], [13, 2, 'TREE'],
    [14, 6, 'TREE_PINE'], [14, 7, 'TREE_PINE'], [13, 8, 'TREE'],
    [13, 11, 'BUSH'], [14, 12, 'TREE_PINE'], [14, 13, 'TREE_PINE'],
    [13, 17, 'TREE'], [14, 17, 'TREE'], [14, 18, 'TREE_PINE'],
    [14, 22, 'TREE_PINE'], [14, 23, 'TREE'],
    // 경로 사이 덤불
    [2, 7, 'BUSH'], [8, 7, 'BUSH'], [12, 6, 'ROCK_SMALL'],
    [3, 12, 'BUSH'], [9, 12, 'ROCK_SMALL'],
    [2, 17, 'ROCK_SMALL'], [8, 17, 'BUSH'],
    [5, 22, 'BUSH'], [9, 22, 'ROCK_SMALL'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 16, 0.28, 0]] },
    { label: 'WAVE 2/5', units: [['soldier', 12, 0.24, 0], ['scout', 10, 0.2, 3]] },
    { label: 'WAVE 3/5', units: [['soldier', 18, 0.22, 0], ['heavy', 6, 0.6, 4]] },
    { label: 'WAVE 4/5', units: [['scout', 14, 0.18, 0], ['heavy', 8, 0.55, 4]] },
    { label: 'WAVE 5 — BOSS', units: [['soldier', 20, 0.16, 0], ['heavy', 8, 0.5, 4], ['boss', 1, 0, 10]] },
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
    // 산악 — 바위 위주, 침엽수 드문드문
    [0, 0, 'ROCK_LARGE'], [1, 1, 'ROCK_SMALL'], [13, 0, 'TREE_PINE'],
    [0, 1, 'ROCK_SMALL'], [12, 1, 'ROCK_LARGE'], [13, 3, 'TREE_PINE'],
    [0, 4, 'ROCK_SMALL'], [13, 4, 'ROCK_LARGE'], [14, 4, 'ROCK_SMALL'],
    [0, 8, 'ROCK_LARGE'], [0, 9, 'ROCK_SMALL'], [14, 9, 'ROCK_SMALL'],
    [14, 10, 'TREE_PINE'], [14, 11, 'ROCK_LARGE'],
    [0, 15, 'TREE_PINE'], [0, 16, 'ROCK_SMALL'], [14, 15, 'ROCK_SMALL'],
    [13, 21, 'ROCK_LARGE'], [14, 22, 'ROCK_SMALL'],
    [0, 21, 'ROCK_LARGE'], [0, 22, 'ROCK_SMALL'], [0, 23, 'ROCK_SMALL'],
    // 경로 갈래 안쪽
    [3, 8, 'ROCK_SMALL'], [9, 4, 'ROCK_SMALL'],
    [4, 13, 'ROCK_SMALL'], [13, 9, 'ROCK_LARGE'],
    [6, 18, 'ROCK_SMALL'], [4, 22, 'ROCK_SMALL'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 18, 0.26, 0]] },
    { label: 'WAVE 2/5', units: [['soldier', 12, 0.22, 0], ['scout', 12, 0.18, 3]] },
    { label: 'WAVE 3/5', units: [['heavy', 10, 0.5, 0], ['soldier', 16, 0.2, 3]] },
    { label: 'WAVE 4/5', units: [['scout', 18, 0.16, 0], ['heavy', 10, 0.5, 4]] },
    { label: 'WAVE 5 — BOSS', units: [['soldier', 20, 0.14, 0], ['heavy', 10, 0.45, 5], ['boss', 1, 0, 12]] },
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
    // 무덤 — 어두운 바위가 빽빽
    [0, 0, 'ROCK_LARGE'], [1, 0, 'ROCK_SMALL'], [13, 1, 'ROCK_LARGE'],
    [13, 3, 'ROCK_SMALL'], [14, 2, 'ROCK_LARGE'], [0, 2, 'ROCK_SMALL'],
    [0, 5, 'ROCK_SMALL'], [0, 6, 'ROCK_LARGE'], [14, 6, 'ROCK_LARGE'],
    [14, 8, 'ROCK_LARGE'], [0, 9, 'ROCK_SMALL'],
    [0, 11, 'ROCK_LARGE'], [14, 11, 'ROCK_SMALL'], [0, 13, 'ROCK_SMALL'],
    [14, 14, 'ROCK_SMALL'], [14, 15, 'ROCK_LARGE'],
    [0, 17, 'ROCK_SMALL'], [0, 18, 'ROCK_LARGE'],
    [14, 20, 'ROCK_LARGE'], [14, 21, 'ROCK_SMALL'], [0, 21, 'ROCK_LARGE'],
    [1, 22, 'ROCK_LARGE'], [13, 23, 'ROCK_LARGE'],
    // 경로 안쪽
    [3, 5, 'ROCK_SMALL'], [11, 5, 'ROCK_SMALL'],
    [7, 8, 'ROCK_SMALL'], [7, 13, 'ROCK_SMALL'],
    [7, 18, 'ROCK_SMALL'], [3, 23, 'ROCK_SMALL'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 20, 0.24, 0]] },
    { label: 'WAVE 2/5', units: [['heavy', 8, 0.55, 0], ['scout', 12, 0.18, 4]] },
    { label: 'WAVE 3/5', units: [['soldier', 18, 0.2, 0], ['heavy', 10, 0.5, 4]] },
    { label: 'WAVE 4/5', units: [['scout', 18, 0.15, 0], ['heavy', 12, 0.45, 4], ['elite', 3, 0.9, 10]] },
    { label: 'WAVE 5 — BOSS', units: [['heavy', 14, 0.4, 0], ['scout', 16, 0.16, 5], ['boss', 1, 0, 14]] },
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
    // 왕좌 정원 — 트리 + 부쉬 풍성
    [0, 0, 'TREE'], [1, 1, 'BUSH'], [13, 1, 'TREE'], [14, 0, 'TREE'],
    [0, 4, 'BUSH'], [13, 5, 'BUSH'], [14, 4, 'TREE'],
    [0, 8, 'TREE_PINE'], [0, 9, 'TREE_PINE'], [14, 8, 'TREE'],
    [0, 12, 'BUSH'], [13, 12, 'TREE'], [14, 13, 'TREE_PINE'],
    [0, 16, 'TREE'], [0, 17, 'BUSH'], [13, 16, 'TREE_PINE'], [14, 17, 'TREE'],
    [0, 20, 'TREE_PINE'], [0, 21, 'BUSH'], [14, 20, 'TREE'],
    [0, 23, 'TREE'], [13, 22, 'TREE'], [14, 23, 'TREE_PINE'],
    // 경로 안쪽 자투리
    [3, 1, 'BUSH'], [11, 1, 'BUSH'],
    [4, 5, 'ROCK_SMALL'], [10, 8, 'BUSH'],
    [7, 13, 'BUSH'], [4, 18, 'ROCK_SMALL'], [10, 17, 'BUSH'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [['soldier', 22, 0.22, 0]] },
    { label: 'WAVE 2/5', units: [['soldier', 16, 0.2, 0], ['heavy', 8, 0.5, 4], ['scout', 12, 0.18, 6]] },
    { label: 'WAVE 3/5', units: [['soldier', 22, 0.18, 0], ['heavy', 12, 0.45, 4], ['elite', 3, 0.9, 12]] },
    { label: 'WAVE 4/5', units: [['scout', 22, 0.14, 0], ['heavy', 14, 0.42, 4], ['elite', 5, 0.8, 10]] },
    { label: 'WAVE 5 — FINAL', units: [['soldier', 26, 0.14, 0], ['heavy', 16, 0.38, 5], ['elite', 5, 0.7, 10], ['boss', 2, 4, 16]] },
  ],
};

export const LEVELS = [LEVEL_GATE, LEVEL_FOREST, LEVEL_PASS, LEVEL_CRYPT, LEVEL_THRONE];

export function getLevel(id) {
  return LEVELS.find(l => l.id === id) ?? LEVEL_GATE;
}
