// 경로 유틸. 웨이포인트(타일 좌표) ↔ 픽셀 좌표.
// Catmull-Rom 보간으로 모서리를 둥글게 → 진짜 길처럼 보이게.

import { GAME } from '../config.js';

const TS = GAME.tileSize;
const SAMPLES_PER_SEG = 14;        // 웨이포인트 간 곡선 샘플 수

export function tilePxCenter(col, row) {
  return { x: col * TS + TS / 2, y: row * TS + TS / 2 };
}

// 4점 Catmull-Rom (centripetal-ish, alpha=0.5 가정 단순화)
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t +
              (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
              (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

export function buildPath(waypoints) {
  const pts = waypoints.map(([c, r]) => tilePxCenter(c, r));
  // 양 끝 가상 제어점: 첫/마지막 방향을 그대로 연장 (커브가 매끈하게 시작/종료)
  const first = pts[0], second = pts[1] ?? pts[0];
  const last  = pts[pts.length - 1], prev = pts[pts.length - 2] ?? last;
  const ghostStart = { x: 2 * first.x - second.x, y: 2 * first.y - second.y };
  const ghostEnd   = { x: 2 * last.x  - prev.x,   y: 2 * last.y  - prev.y };
  const ctrl = [ghostStart, ...pts, ghostEnd];

  // 보간된 조밀한 폴리라인
  const dense = [];
  for (let i = 1; i < ctrl.length - 2; i++) {
    const a = ctrl[i - 1], b = ctrl[i], c = ctrl[i + 1], d = ctrl[i + 2];
    const steps = (i === ctrl.length - 3) ? SAMPLES_PER_SEG : SAMPLES_PER_SEG;
    const last = (i === ctrl.length - 3);
    for (let s = 0; s < steps; s++) {
      dense.push(catmull(a, b, c, d, s / steps));
    }
    if (last) dense.push({ x: c.x, y: c.y });
  }

  const segs = [];
  let total = 0;
  for (let i = 0; i < dense.length - 1; i++) {
    const a = dense[i], b = dense[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 0.0001) continue;
    segs.push({ a, b, len, start: total });
    total += len;
  }
  return { pts: dense, waypoints: pts, segs, total };
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

// (x,y)에서 가장 가까운 path 위 점 + 수직 거리.
// 영웅 이동 가능 영역을 path 폭 안으로 제한할 때 사용.
export function nearestOnPath(path, x, y) {
  let best = { x: 0, y: 0, dist: Infinity, t: 0 };
  for (const s of path.segs) {
    const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 0.0001) continue;
    let u = ((x - s.a.x) * dx + (y - s.a.y) * dy) / len2;
    if (u < 0) u = 0; else if (u > 1) u = 1;
    const px = s.a.x + dx * u, py = s.a.y + dy * u;
    const d = Math.hypot(x - px, y - py);
    if (d < best.dist) {
      best = { x: px, y: py, dist: d, t: s.start + u * s.len };
    }
  }
  return best;
}

// (x,y)를 path에서 maxPerp 안쪽으로 클램프.
export function clampToPath(path, x, y, maxPerp) {
  const n = nearestOnPath(path, x, y);
  if (n.dist <= maxPerp) return { x, y };
  const t = maxPerp / n.dist;
  return { x: n.x + (x - n.x) * t, y: n.y + (y - n.y) * t };
}
