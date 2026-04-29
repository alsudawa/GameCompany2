// Stage 02 — WHISPERING FOREST
// 경로 변형: 더 길게 굽이쳐 흐름.

export const STAGE_FOREST = {
  id: 'forest',
  name: 'WHISPERING FOREST',
  tagline: '속삭이는 숲의 매복',
  cols: 15,
  rows: 25,
  groundTint: 0xc8d8b0,           // 잔디에 살짝 노란/시들한 틴트

  pathWaypoints: [
    [3, -1],
    [3,  4],
    [10, 4],
    [10, 9],
    [4,  9],
    [4,  14],
    [11, 14],
    [11, 19],
    [3,  19],
    [3,  25],
  ],
  towerSlots: [
    [1, 5], [6, 5], [12, 5],
    [1, 10], [7, 10], [12, 10],
    [1, 15], [7, 15], [13, 15],
    [1, 20], [6, 20], [12, 20],
  ],
  decorations: [
    [13, 1, 'TREE_PINE'], [12, 2, 'TREE'], [13, 3, 'BUSH'],
    [0,  6, 'TREE_PINE'], [14, 7, 'TREE_PINE'],
    [13, 11, 'BUSH'],     [14, 12, 'TREE_PINE'],
    [0, 17, 'TREE'],      [14, 17, 'TREE'],
    [14, 22, 'TREE_PINE'],
  ],
  waves: [
    { label: 'WAVE 1/5', units: [
      { kind: 'soldier', count: 12, interval: 0.7, delay: 0 },
    ]},
    { label: 'WAVE 2/5', units: [
      { kind: 'soldier', count: 8, interval: 0.6, delay: 0 },
      { kind: 'scout',   count: 6, interval: 0.5, delay: 5 },
    ]},
    { label: 'WAVE 3/5', units: [
      { kind: 'soldier', count: 12, interval: 0.55, delay: 0 },
      { kind: 'heavy',   count: 5,  interval: 1.1, delay: 5 },
    ]},
    { label: 'WAVE 4/5', units: [
      { kind: 'scout',   count: 10, interval: 0.45, delay: 0 },
      { kind: 'heavy',   count: 6,  interval: 1.0, delay: 6 },
      { kind: 'tank',    count: 2,  interval: 2.0, delay: 14 },
    ]},
    { label: 'WAVE 5/5 — BOSS', units: [
      { kind: 'soldier', count: 16, interval: 0.4, delay: 0 },
      { kind: 'heavy',   count: 6,  interval: 0.9, delay: 6 },
      { kind: 'boss',    count: 1,  interval: 0,   delay: 16 },
    ]},
  ],
};
