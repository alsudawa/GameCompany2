// Coin — 적 처치 시 떨어지는 코인. 영웅 자석 범위 안에 들어오면 끌어당겨져 수집.

import { COLORS, KEY, TILE } from '../config.js';

export class Coin extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.body = scene.add.image(0, 0, KEY.tilesheet, TILE.COIN_GOLD).setScale(0.4);
    this.add([this.body]);
    this.alive = false;
    this.value = 1;
    this.vx = 0;
    this.vy = 0;
    this.lifetime = 0;
    this._spin = 0;
    this._magneted = false;
    this.setVisible(false).setActive(false);
  }

  reset(x, y, value = 1) {
    this.alive = true;
    this.value = value;
    this.x = x;
    this.y = y;
    // 살짝 튀어 오름
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
    const sp = 90 + Math.random() * 80;
    this.vx = Math.cos(ang) * sp;
    this.vy = Math.sin(ang) * sp;
    this.lifetime = 8;
    this._spin = Math.random() * Math.PI * 2;
    this._magneted = false;
    this.body.setScale(0.4);
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
      const sp = 360 + (magnetR - Math.min(magnetR, dist)) * 4;
      this.vx = (dx / dist) * sp;
      this.vy = (dy / dist) * sp;
    } else {
      // 중력 + 바닥에 정지
      this.vy += 380 * dt;
      this.vx *= 0.92;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 동전 뒤집힘 효과 (scaleX cosine)
    this._spin += dt * 6;
    this.body.setScale(0.4 * Math.abs(Math.cos(this._spin)) + 0.18, 0.4);

    if (this.lifetime <= 0) this.deactivate();
  }

  deactivate() {
    this.alive = false;
    this.setVisible(false).setActive(false);
  }
}
