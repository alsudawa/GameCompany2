// Stage 04 — DRAGON CRYPT
// 경로: 더 짧지만 분기 많음 (지하 무덤 — 여러 경로가 한 곳으로 모이는 느낌은 단순화).

export const STAGE_CRYPT = {
  id: 'crypt',
  name: 'DRAGON CRYPT',
  tagline: '용의 무덤',
  cols: 15,
  rows: 25,
  groundTint: 0x9a8aa8,           // 보라/짙은 톤
  hpMul: 1.20,
  speedMul: 1.0,

  pathWaypoints: [
    [7, -1],
    [7,  3],
    [3,  3],
    [3,  8],
    [11, 8],
    [11, 13],
    [3,  13],
    [3,  18],
    [11, 18],
    [11, 25],
  ],
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
    { label: 'WAVE 1/5', units: [
      { kind: 'soldier', count: 16, interval: 0.6, delay: 0 },
    ]},
    { label: 'WAVE 2/5', units: [
      { kind: 'heavy',   count: 6, interval: 1.0, delay: 0 },
      { kind: 'scout',   count: 8, interval: 0.45, delay: 5 },
    ]},
    { label: 'WAVE 3/5', units: [
      { kind: 'soldier', count: 14, interval: 0.5, delay: 0 },
      { kind: 'heavy',   count: 8,  interval: 0.95, delay: 4 },
      { kind: 'tank',    count: 1,  interval: 0,   delay: 16 },
    ]},
    { label: 'WAVE 4/5', units: [
      { kind: 'scout',   count: 14, interval: 0.4, delay: 0 },
      { kind: 'heavy',   count: 10, interval: 0.85, delay: 5 },
      { kind: 'tank',    count: 3,  interval: 1.8, delay: 14 },
    ]},
    { label: 'WAVE 5/5 — BOSS', units: [
      { kind: 'heavy',   count: 12, interval: 0.7, delay: 0 },
      { kind: 'scout',   count: 14, interval: 0.4, delay: 6 },
      { kind: 'tank',    count: 3,  interval: 1.5, delay: 14 },
      { kind: 'boss',    count: 1,  interval: 0,   delay: 22 },
    ]},
  ],
};
