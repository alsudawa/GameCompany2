// 경로 유틸. 웨이포인트(타일 좌표) ↔ 픽셀 좌표 + 길이/구간 진행도.

import { GAME } from '../config.js';

const TS = GAME.tileSize;

// 타일 (col, row) → 픽셀 (x, y) (타일 중심)
export function tilePxCenter(col, row) {
  return { x: col * TS + TS / 2, y: row * TS + TS / 2 };
}

// 웨이포인트(타일) 폴리라인 → 픽셀 폴리라인 + 누적 길이
export function buildPath(waypoints) {
  const pts = waypoints.map(([c, r]) => tilePxCenter(c, r));
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len, start: total });
    total += len;
  }
  return { pts, segs, total };
}

// 진행 거리 t(픽셀) → 위치 + 진행 방향 각도
export function pathPosition(path, t) {
  const total = path.total;
  if (t <= 0) {
    const s = path.segs[0];
    const ang = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
    return { x: s.a.x, y: s.a.y, angle: ang, done: false };
  }
  if (t >= total) {
    const s = path.segs[path.segs.length - 1];
    const ang = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
    return { x: s.b.x, y: s.b.y, angle: ang, done: true };
  }
  for (const s of path.segs) {
    if (t <= s.start + s.len) {
      const local = (t - s.start) / s.len;
      const x = s.a.x + (s.b.x - s.a.x) * local;
      const y = s.a.y + (s.b.y - s.a.y) * local;
      const ang = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
      return { x, y, angle: ang, done: false };
    }
  }
  return { x: 0, y: 0, angle: 0, done: true };
}

// 길이 따라 타일 좌표 마킹 (렌더용) — 웨이포인트 사이 구간을 1타일씩 채움.
export function tilesAlongPath(waypoints) {
  const set = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c1, r1] = waypoints[i];
    const [c2, r2] = waypoints[i + 1];
    if (c1 === c2) {
      const step = r2 > r1 ? 1 : -1;
      for (let r = r1; r !== r2 + step; r += step) set.add(`${c1},${r}`);
    } else if (r1 === r2) {
      const step = c2 > c1 ? 1 : -1;
      for (let c = c1; c !== c2 + step; c += step) set.add(`${c},${r1}`);
    }
  }
  return Array.from(set).map(s => s.split(',').map(Number));
}
