// Stage 03 — MOUNTAIN PASS
// 경로: 가운데를 가로지르는 직선형 (산길 느낌).

export const STAGE_PASS = {
  id: 'pass',
  name: 'MOUNTAIN PASS',
  tagline: '눈 덮인 산길',
  cols: 15,
  rows: 25,
  groundTint: 0xe6eef4,           // 회청 (눈 덮인 잔디)
  hpMul: 1.15,
  speedMul: 1.05,

  pathWaypoints: [
    [-1, 5],
    [4,  5],
    [4,  12],
    [11, 12],
    [11, 19],
    [15, 19],
  ],
  towerSlots: [
    [2, 3], [6, 3], [10, 3],
    [2, 7], [6, 9], [10, 7],
    [2, 14], [7, 14], [13, 14],
    [2, 17], [9, 17], [13, 17],
    [2, 22], [6, 22], [10, 22], [13, 22],
  ],
  decorations: [
    [12, 1, 'ROCK_LARGE'], [13, 3, 'TREE_PINE'],
    [0, 9, 'ROCK_SMALL'], [14, 10, 'TREE_PINE'],
    [0, 15, 'TREE_PINE'], [13, 21, 'ROCK_LARGE'],
    [0, 23, 'ROCK_SMALL'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [
      { kind: 'soldier', count: 14, interval: 0.7, delay: 0 },
    ]},
    { label: 'WAVE 2/5', units: [
      { kind: 'soldier', count: 8,  interval: 0.55, delay: 0 },
      { kind: 'scout',   count: 8,  interval: 0.45, delay: 4 },
    ]},
    { label: 'WAVE 3/5', units: [
      { kind: 'heavy',   count: 8,  interval: 0.95, delay: 0 },
      { kind: 'soldier', count: 12, interval: 0.55, delay: 4 },
    ]},
    { label: 'WAVE 4/5', units: [
      { kind: 'scout',   count: 12, interval: 0.4, delay: 0 },
      { kind: 'heavy',   count: 8,  interval: 0.9, delay: 5 },
      { kind: 'tank',    count: 3,  interval: 2.0, delay: 14 },
    ]},
    { label: 'WAVE 5/5 — BOSS', units: [
      { kind: 'soldier', count: 18, interval: 0.35, delay: 0 },
      { kind: 'heavy',   count: 8,  interval: 0.85, delay: 6 },
      { kind: 'tank',    count: 2,  interval: 1.5, delay: 12 },
      { kind: 'boss',    count: 1,  interval: 0,   delay: 18 },
    ]},
  ],
};
