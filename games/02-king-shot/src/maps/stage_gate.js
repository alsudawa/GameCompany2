// Stage 01 — CASTLE GATE
// 15 cols × 25 rows, 32px 타일.

export const STAGE_GATE = {
  id: 'gate',
  name: 'CASTLE GATE',
  tagline: '왕국의 첫 관문',
  cols: 15,
  rows: 25,

  // 길 경로 — (col, row) 기준 폴리라인. 적은 첫 점에서 마지막 점까지 직선 구간 따라 이동.
  // (-1 / cols / rows 같은 외곽 좌표는 화면 밖 진입/탈출.)
  pathWaypoints: [
    [7, -1],
    [7,  4],
    [11, 4],
    [11, 9],
    [3,  9],
    [3,  14],
    [11, 14],
    [11, 19],
    [7,  19],
    [7,  25],
  ],

  // 타워 배치 가능 슬롯 — 길 옆 잔디
  towerSlots: [
    [4, 5], [9, 5],
    [5, 10], [9, 10],
    [4, 15], [9, 15],
    [5, 20], [9, 20],
  ],

  // 장식 (col, row, kind)
  decorations: [
    [1,  1, 'TREE'],
    [13, 2, 'TREE'],
    [0,  7, 'ROCK_SMALL'],
    [14, 6, 'TREE_PINE'],
    [0, 12, 'TREE_PINE'],
    [13, 11, 'BUSH'],
    [1, 17, 'TREE'],
    [14, 16, 'ROCK_LARGE'],
    [0, 22, 'BUSH'],
    [14, 22, 'TREE'],
  ],
};
