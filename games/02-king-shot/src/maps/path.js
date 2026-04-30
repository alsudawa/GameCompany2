// 경로 유틸. 웨이포인트(타일 좌표) ↔ 픽셀 좌표.

import { GAME } from '../config.js';

const TS = GAME.tileSize;

export function tilePxCenter(col, row) {
  return { x: col * TS + TS / 2, y: row * TS + TS / 2 };
}

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
