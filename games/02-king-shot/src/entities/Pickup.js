// Pickup — 적 처치 시 떨어지는 아이템.
// 종류: GEM(푸른 보석, 회전), HEART(빨간 하트, 펄스), COIN(황금 코인, 동전 뒤집힘).
// 처음에 살짝 위로 튀어 오른 뒤 멈춤. 왕이 자석 범위 안이면 끌려간다.

import { COLORS } from '../config.js';

export const PICKUP_KIND = {
  GEM:   'gem',
  HEART: 'heart',
  COIN:  'coin',
};

export class Pickup extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.gfx = scene.add.graphics();
    this.add([this.gfx]);

    this.alive = false;
    this.kind = PICKUP_KIND.GEM;
    this.vx = 0;
    this.vy = 0;
    this.lifetime = 0;
    this._spin = 0;
    this._pulse = 0;
    this._magneted = false;

    this.setVisible(false).setActive(false);
  }

  reset(x, y, kind, opts = {}) {
    this.alive = true;
    this.kind = kind;
    this.x = x;
    this.y = y;
    // 살짝 튀어오름
    const ang = (-Math.PI / 2) + (Math.random() - 0.5) * 0.6;
    const sp = 80 + Math.random() * 60;
    this.vx = Math.cos(ang) * sp;
    this.vy = Math.sin(ang) * sp;
    this.lifetime = 12;
    this._spin = Math.random() * Math.PI * 2;
    this._pulse = 0;
    this._magneted = false;
    this.setAlpha(0).setScale(0.4);
    this.setVisible(true).setActive(true);
    this.draw();
    this.scene.tweens.add({
      targets: this, alpha: 1, scale: 1,
      duration: 220, ease: 'Back.Out',
    });
  }

  draw() {
    const g = this.gfx;
    g.clear();
    if (this.kind === PICKUP_KIND.GEM)        this.drawGem(g);
    else if (this.kind === PICKUP_KIND.HEART) this.drawHeart(g);
    else if (this.kind === PICKUP_KIND.COIN)  this.drawCoin(g);
  }

  drawGem(g) {
    // 다이아몬드 폴리곤 — 윗 삼각 + 하단 뾰족
    g.fillStyle(0x1a3a5e, 1);
    g.fillPoints([
      { x: -8, y: -2 }, { x: 0, y: -10 }, { x: 8, y: -2 },
      { x: 0, y: 10 },
    ], true);
    g.fillStyle(COLORS.gemBlue, 1);
    g.fillPoints([
      { x: -7, y: -2 }, { x: 0, y: -9 }, { x: 7, y: -2 },
      { x: 0, y: 9 },
    ], true);
    // 하이라이트
    g.fillStyle(0xc8e0ff, 0.85);
    g.fillTriangle(-3, -5, 1, -7, -1, -1);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(-2, -5, 1.2);
  }

  drawHeart(g) {
    // 두 원 + 삼각
    g.fillStyle(0x6a1818, 1);
    g.fillCircle(-4, -3, 6);
    g.fillCircle( 4, -3, 6);
    g.fillTriangle(-9, 0, 9, 0, 0, 9);
    g.fillStyle(COLORS.heartRed, 1);
    g.fillCircle(-4, -3, 5);
    g.fillCircle( 4, -3, 5);
    g.fillTriangle(-8, -1, 8, -1, 0, 8);
    g.fillStyle(0xffd0d0, 0.7);
    g.fillCircle(-4, -5, 1.6);
  }

  drawCoin(g) {
    g.fillStyle(COLORS.goldDeep, 1);
    g.fillCircle(0, 0, 8);
    g.fillStyle(COLORS.gold, 1);
    g.fillCircle(0, 0, 7);
    g.lineStyle(1, COLORS.goldDeep, 1);
    g.strokeCircle(0, 0, 7);
    // 중앙 별
    g.fillStyle(COLORS.goldDeep, 1);
    const star = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      star.push({ x: Math.cos(a) * 4, y: Math.sin(a) * 4 });
      const a2 = a + Math.PI / 5;
      star.push({ x: Math.cos(a2) * 1.7, y: Math.sin(a2) * 1.7 });
    }
    g.fillPoints(star, true);
  }

  update(dt, scene, kingPos, magnetRadius) {
    if (!this.alive) return;
    this.lifetime -= dt;

    // 자석 끌림
    const dx = kingPos.x - this.x;
    const dy = kingPos.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < (magnetRadius ?? 140)) this._magneted = true;

    if (this._magneted) {
      const sp = 360 + (140 - Math.min(140, dist)) * 4;
      this.vx = (dx / dist) * sp;
      this.vy = (dy / dist) * sp;
    } else {
      // 점차 정지 (떨어진 후 살짝 통통)
      this.vy += 320 * dt;
      this.vx *= 0.92;
      // 바닥 (kingY+30) 위에서 stop
      const floorY = kingPos.y + 50;
      if (this.y > floorY - 10) {
        this.y = floorY - 10;
        this.vy = 0;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 회전/펄스
    this._spin += dt * 4;
    this._pulse += dt * 6;
    if (this.kind === PICKUP_KIND.GEM) {
      this.gfx.setRotation(Math.sin(this._spin) * 0.3);
    } else if (this.kind === PICKUP_KIND.COIN) {
      // Y축 회전 모방 — scaleX 0→1→0
      this.gfx.setScale(Math.cos(this._spin), 1);
    } else if (this.kind === PICKUP_KIND.HEART) {
      this.gfx.setScale(1 + Math.sin(this._pulse) * 0.07);
    }

    // 만료
    if (this.lifetime <= 0) this.deactivate();

    // 픽 거리 (왕에게 닿으면 GameScene이 처리하도록 boolean 반환은 안 함; 거리 체크는 GameScene에서)
  }

  deactivate() {
    this.alive = false;
    this.setVisible(false).setActive(false);
  }
}
