// Projectile — 타워가 발사하는 발사체.
// archer 종류는 실제 화살 모양 + 호밍, 나머지는 직선 탄환.

import { KEY, TILE } from '../config.js';

const FRAME_FOR = {
  cannon: TILE.BULLET_ROCKET,
  mortar: TILE.BULLET_ROCKET_RED,
  frost:  TILE.BULLET_GRAY,
};

const TINT_FOR = {
  cannon: 0xffffff,
  mortar: 0xffffff,
  frost:  0x80c8ff,
};

const ARROW_LEN = 22;
const HOMING_TURN = Math.PI * 4;   // rad/sec, archer 호밍 회전 한계

export class Projectile extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    // 화살 그래픽 — Phaser.Graphics로 그린다 (샤프트 + 화살촉 + 깃)
    this.arrow = scene.add.graphics();
    this.drawArrow();
    // 캐논/모탈/프로스트는 기존 타일 이미지
    this.bullet = scene.add.image(0, 0, KEY.tilesheet, TILE.BULLET_ROCKET)
      .setScale(0.55).setVisible(false);
    this.add([this.arrow, this.bullet]);

    this.alive = false;
    this.kind = 'archer';
    this.dmg = 10;
    this.splash = 0;
    this.slow = 0;
    this.speed = 520;
    this.angle = 0;
    this.target = null;            // 호밍용 적 참조
    this.homing = false;
    this.lifetime = 0;
    this._trail = 0;
    this.setVisible(false).setActive(false);
  }

  drawArrow() {
    const g = this.arrow;
    g.clear();
    // 샤프트 (나무)
    g.lineStyle(2, 0x8a5a2a, 1);
    g.beginPath();
    g.moveTo(-ARROW_LEN / 2, 0);
    g.lineTo(ARROW_LEN / 2 - 4, 0);
    g.strokePath();
    // 화살촉 (강철)
    g.fillStyle(0xd0d8e0, 1);
    g.fillTriangle(ARROW_LEN / 2 - 4, -3, ARROW_LEN / 2 - 4, 3, ARROW_LEN / 2 + 2, 0);
    g.lineStyle(1, 0x6a7480, 1);
    g.strokeTriangle(ARROW_LEN / 2 - 4, -3, ARROW_LEN / 2 - 4, 3, ARROW_LEN / 2 + 2, 0);
    // 깃 (빨강)
    g.fillStyle(0xc8302d, 1);
    g.fillTriangle(-ARROW_LEN / 2, -3, -ARROW_LEN / 2 + 5, 0, -ARROW_LEN / 2, 3);
    g.fillStyle(0xfff5d8, 1);
    g.fillTriangle(-ARROW_LEN / 2 + 1, -2, -ARROW_LEN / 2 + 4, 0, -ARROW_LEN / 2 + 1, 2);
  }

  reset(x, y, target, kind, opts = {}) {
    this.alive = true;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.dmg = opts.damage ?? 10;
    this.splash = opts.splash ?? 0;
    this.slow = opts.slow ?? 0;
    this.lifetime = 1.8;
    this.speed = opts.speed ?? 520;
    this.target = (target && typeof target.alive !== 'undefined') ? target : null;
    this.homing = !!opts.homing && !!this.target;

    const aimX = target?.x ?? x;
    const aimY = target?.y ?? y;
    this.angle = Math.atan2(aimY - y, aimX - x);

    // archer = 그린 화살 / 그 외 = 타일 이미지
    const isArrow = kind === 'archer';
    this.arrow.setVisible(isArrow);
    this.bullet.setVisible(!isArrow);
    if (!isArrow) {
      this.bullet.setFrame(FRAME_FOR[kind] ?? TILE.BULLET_ROCKET);
      this.bullet.setTint(TINT_FOR[kind] ?? 0xffffff);
      this.bullet.setRotation(this.angle);
      this.bullet.setScale(kind === 'cannon' || kind === 'mortar' ? 0.55 : 0.45);
    } else {
      this.arrow.setRotation(this.angle);
    }
    this.setVisible(true).setActive(true);
  }

  update(dt, scene) {
    if (!this.alive) return;

    // 호밍: 살아있는 적에게 각도 보정 (회전 속도 제한)
    if (this.homing && this.target && this.target.alive) {
      const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      let diff = Phaser.Math.Angle.Wrap(desired - this.angle);
      const maxStep = HOMING_TURN * dt;
      if (diff >  maxStep) diff =  maxStep;
      if (diff < -maxStep) diff = -maxStep;
      this.angle += diff;
    }

    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    this.x += vx * dt;
    this.y += vy * dt;
    this.lifetime -= dt;

    if (this.kind === 'archer') this.arrow.setRotation(this.angle);
    else this.bullet.setRotation(this.angle);

    // 잔상 (archer는 작은 깃털, 그 외는 색깔 점)
    this._trail -= dt;
    if (this._trail <= 0) {
      this._trail = (this.kind === 'archer') ? 0.06 : 0.04;
      const tCol = (this.kind === 'frost') ? 0xa0e0ff
                 : (this.kind === 'mortar' || this.kind === 'cannon') ? 0xffaa55
                 : 0xfff4a0;
      const r = (this.kind === 'archer') ? 1.2 : 2;
      const dot = scene.add.circle(this.x, this.y, r, tCol, 0.5).setDepth(this.depth - 1);
      scene.tweens.add({
        targets: dot, alpha: 0, scale: 0.3,
        duration: 180, ease: 'Cubic.Out',
        onComplete: () => dot.destroy(),
      });
    }

    if (this.lifetime <= 0 ||
        this.x < -20 || this.x > scene.scale.width + 20 ||
        this.y < -20 || this.y > scene.scale.height + 20) {
      this.deactivate();
    }
  }

  deactivate() {
    this.alive = false;
    this.target = null;
    this.homing = false;
    this.setVisible(false).setActive(false);
  }
}
