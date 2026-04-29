// Stage 05 — ROYAL THRONE
// 마지막 스테이지. 최고 난이도, 더 길고 복잡한 경로.

export const STAGE_THRONE = {
  id: 'throne',
  name: 'ROYAL THRONE',
  tagline: '왕좌의 결전',
  cols: 15,
  rows: 25,
  groundTint: 0xe6c8a0,           // 골드 톤 잔디
  hpMul: 1.30,
  speedMul: 1.05,

  pathWaypoints: [
    [7, -1],
    [7,  3],
    [12, 3],
    [12, 7],
    [3,  7],
    [3,  11],
    [11, 11],
    [11, 15],
    [3,  15],
    [3,  19],
    [11, 19],
    [11, 25],
  ],
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
    { label: 'WAVE 1/5', units: [
      { kind: 'soldier', count: 18, interval: 0.55, delay: 0 },
    ]},
    { label: 'WAVE 2/5', units: [
      { kind: 'soldier', count: 12, interval: 0.5, delay: 0 },
      { kind: 'heavy',   count: 6,  interval: 0.95, delay: 5 },
      { kind: 'scout',   count: 8,  interval: 0.45, delay: 8 },
    ]},
    { label: 'WAVE 3/5', units: [
      { kind: 'soldier', count: 18, interval: 0.45, delay: 0 },
      { kind: 'heavy',   count: 10, interval: 0.85, delay: 5 },
      { kind: 'tank',    count: 2,  interval: 1.5, delay: 16 },
    ]},
    { label: 'WAVE 4/5', units: [
      { kind: 'scout',   count: 16, interval: 0.4, delay: 0 },
      { kind: 'heavy',   count: 12, interval: 0.8, delay: 5 },
      { kind: 'tank',    count: 4,  interval: 1.5, delay: 14 },
      { kind: 'boss',    count: 1,  interval: 0,   delay: 24 },
    ]},
    { label: 'WAVE 5/5 — FINAL', units: [
      { kind: 'soldier', count: 20, interval: 0.35, delay: 0 },
      { kind: 'heavy',   count: 14, interval: 0.7, delay: 6 },
      { kind: 'scout',   count: 14, interval: 0.4, delay: 12 },
      { kind: 'tank',    count: 4,  interval: 1.4, delay: 18 },
      { kind: 'boss',    count: 2,  interval: 6,   delay: 24 },
    ]},
  ],
};
