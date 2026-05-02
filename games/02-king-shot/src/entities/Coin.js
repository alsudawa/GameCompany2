// Coin — 적 처치 시 떨어지는 코인. 떨어진 자리에 그대로 머물다 영웅 자석 범위에 닿으면 끌려옴.

import { COLORS } from '../config.js';

export class Coin extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
    // 절차 그래픽 코인 — 더 또렷한 골드
    this.gfx = scene.add.graphics();
    this.add([this.gfx]);
    this.alive = false;
    this.value = 1;
    this.lifetime = 0;
    this._spin = 0;
    this._magneted = false;
    this._restAt = null;
    this.vx = 0;
    this.vy = 0;
    this.draw();
    this.setVisible(false).setActive(false);
  }

  draw() {
    const g = this.gfx;
    g.clear();
    if (this.value >= 5) {
      // GEM — 다이아몬드형 청록
      g.fillStyle(0x000000, 0.5);
      g.fillTriangle(-7, 1, 7, 1, 0, 9);
      g.fillTriangle(-7, 1, 7, 1, 0, -7);
      g.fillStyle(0x2a8fc8, 1);
      g.fillTriangle(-8, 0, 8, 0, 0, 8);
      g.fillTriangle(-8, 0, 8, 0, 0, -8);
      g.fillStyle(0x80c8ff, 1);
      g.fillTriangle(-5, 0, 5, 0, 0, 6);
      g.fillStyle(0xc8e8ff, 0.95);
      g.fillTriangle(-3, 0, 0, -4, 3, 0);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(-1.5, -1.5, 0.9);
    } else {
      // GOLD COIN
      g.fillStyle(0x000000, 0.45);
      g.fillCircle(1.2, 1.2, 7);
      g.fillStyle(0xc89438, 1);
      g.fillCircle(0, 0, 7);
      g.fillStyle(0xffd24a, 1);
      g.fillCircle(0, 0, 5.5);
      g.fillStyle(0xc89438, 1);
      g.fillCircle(0, 0, 2.6);
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(-2, -2.2, 1);
    }
  }

  reset(x, y, value = 1) {
    this.alive = true;
    this.value = value;
    this.x = x;
    this.y = y;
    this.draw();           // 값에 맞는 외형 (코인/보석)으로 재그림
    this.lifetime = 9;
    this._spin = Math.random() * Math.PI * 2;
    this._magneted = false;
    // 작은 흩뿌림 — 즉시 정지 (중력 없음)
    const ang = Math.random() * Math.PI * 2;
    const sp = 30 + Math.random() * 50;
    this.vx = Math.cos(ang) * sp;
    this.vy = Math.sin(ang) * sp;
    this._restAt = this.scene.time.now + 220;    // 220ms 후 정지
    this.setAlpha(0).setScale(0.5);
    this.setVisible(true).setActive(true);
    this.scene.tweens.add({
      targets: this, alpha: 1, scale: 1,
      duration: 180, ease: 'Back.Out',
    });
  }

  update(dt, heroX, heroY, magnetR) {
    if (!this.alive) return;
    this.lifetime -= dt;

    const dx = heroX - this.x;
    const dy = heroY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < magnetR) this._magneted = true;

    if (this._magneted) {
      const sp = 380 + (magnetR - Math.min(magnetR, dist)) * 4;
      this.vx = (dx / dist) * sp;
      this.vy = (dy / dist) * sp;
    } else if (this.scene.time.now < this._restAt) {
      // 잠깐 흩뿌리고 빠르게 감속
      this.vx *= 0.85;
      this.vy *= 0.85;
    } else {
      // 정지
      this.vx = 0;
      this.vy = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 회전 효과 (코인 뒤집힘)
    this._spin += dt * 5;
    this.gfx.setScale(Math.abs(Math.cos(this._spin)) * 0.6 + 0.5, 1);

    if (this.lifetime <= 0) this.deactivate();
  }

  deactivate() {
    this.alive = false;
    this.setVisible(false).setActive(false);
  }
}
