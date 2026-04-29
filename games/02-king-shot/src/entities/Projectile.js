// Projectile — 타워가 발사하는 발사체.
// 직선으로 날아가다 사정거리/시간 초과 또는 충돌 시 비활성.

import { KEY, TILE } from '../config.js';

const FRAME_FOR = {
  archer: TILE.BULLET_GOLD,
  cannon: TILE.BULLET_ROCKET,
  mortar: TILE.BULLET_ROCKET_RED,
  frost:  TILE.BULLET_GRAY,
};

const TINT_FOR = {
  archer: 0xffffff,
  cannon: 0xffffff,
  mortar: 0xffffff,
  frost:  0x80c8ff,
};

export class Projectile extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.body = scene.add.image(0, 0, KEY.tilesheet, TILE.BULLET_GOLD)
      .setScale(0.4);
    this.add([this.body]);

    this.alive = false;
    this.kind = 'archer';
    this.dmg = 10;
    this.splash = 0;
    this.slow = 0;
    this.vx = 0;
    this.vy = 0;
    this.lifetime = 0;
    this._trail = 0;
    this.setVisible(false).setActive(false);
  }

  reset(x, y, target, kind, opts = {}) {
    this.alive = true;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.dmg = opts.damage ?? 10;
    this.splash = opts.splash ?? 0;
    this.slow = opts.slow ?? 0;
    this.lifetime = 1.6;
    this.target = target;
    const speed = opts.speed ?? 520;
    const dx = target.x - x;
    const dy = target.y - y;
    const ang = Math.atan2(dy, dx);
    this.vx = Math.cos(ang) * speed;
    this.vy = Math.sin(ang) * speed;
    this.body.setFrame(FRAME_FOR[kind] ?? TILE.BULLET_GOLD);
    this.body.setTint(TINT_FOR[kind] ?? 0xffffff);
    this.body.setRotation(ang);
    // 캐논/모탈 발사체는 더 큼
    if (kind === 'cannon' || kind === 'mortar') this.body.setScale(0.55);
    else this.body.setScale(0.4);
    this.setVisible(true).setActive(true);
  }

  update(dt, scene) {
    if (!this.alive) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;

    // 잔상 (작은 점)
    this._trail -= dt;
    if (this._trail <= 0) {
      this._trail = 0.04;
      const tCol = (this.kind === 'frost') ? 0xa0e0ff
                 : (this.kind === 'mortar' || this.kind === 'cannon') ? 0xffaa55
                 : 0xfff4a0;
      const dot = scene.add.circle(this.x, this.y, 2, tCol, 0.6).setDepth(this.depth - 1);
      scene.tweens.add({
        targets: dot, alpha: 0, scale: 0.4,
        duration: 200, ease: 'Cubic.Out',
        onComplete: () => dot.destroy(),
      });
    }

    // 만료/화면 밖
    if (this.lifetime <= 0 ||
        this.x < -20 || this.x > scene.scale.width + 20 ||
        this.y < -20 || this.y > scene.scale.height + 20) {
      this.deactivate();
    }
  }

  deactivate() {
    this.alive = false;
    this.setVisible(false).setActive(false);
  }
}
