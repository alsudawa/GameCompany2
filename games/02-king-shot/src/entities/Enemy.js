// Enemy — 영웅을 추격. Kenney 캐릭터 스프라이트 사용.

import { ENEMIES } from '../config.js';

const SPRITE_FOR = {
  soldier: 'zombie',     // 기본 — 녹색 좀비
  scout:   'zombie2',    // 빠른 — 다른 포즈 좀비
  heavy:   'robot',      // 무거움 — 로봇
  elite:   'elite',      // 엘리트 — 히트맨
  boss:    'robot',      // 보스 — 로봇 (큰 사이즈)
};

const TINT_FOR = {
  soldier: 0xffffff,
  scout:   0xc8e8c0,
  heavy:   0xffffff,
  elite:   0xffffff,
  boss:    0xff8080,
};

export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.shadow = scene.add.ellipse(0, 12, 36, 10, 0x000000, 0.45);
    this.body   = scene.add.image(0, 0, 'zombie').setScale(0.55);
    this.hpBg   = scene.add.rectangle(0, -22, 30, 4, 0x000000, 0.7);
    this.hpFill = scene.add.rectangle(0, -22, 30, 4, 0xff5050, 1);
    this.hpFill.setOrigin(0, 0.5);
    this.add([this.shadow, this.body, this.hpBg, this.hpFill]);

    this.alive = false;
    this.kind = 'soldier';
    this.hp = 1; this.maxHp = 1;
    this.speed = 60; this.damage = 1;
    this.bounty = 0; this.scoreVal = 0;
    this.touchCooldown = 0;
    this.hitRadius = 16;
    this._hpFullW = 30;

    this.setVisible(false).setActive(false);
  }

  reset(kind, x, y, hpMul = 1) {
    const cfg = ENEMIES[kind] ?? ENEMIES.soldier;
    this.alive = true;
    this.kind = kind;
    this.hp = Math.round(cfg.hp * hpMul);
    this.maxHp = this.hp;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.bounty = cfg.bounty;
    this.scoreVal = cfg.score;
    this.touchCooldown = 0;
    this.x = x; this.y = y;

    this.body.setTexture(SPRITE_FOR[kind] ?? 'zombie');
    this.body.setTint(TINT_FOR[kind] ?? 0xffffff);
    const sc = (cfg.scale ?? 0.55);
    this.body.setScale(sc);
    this.shadow.setSize(36 * sc, 10 * sc);
    const hpW = Math.round(34 * sc);
    this.hpBg.setSize(hpW, 4);
    this.hpFill.width = hpW;
    this._hpFullW = hpW;
    this.hpFill.x = -hpW / 2;
    this.hpBg.y = -22 * sc;
    this.hpFill.y = -22 * sc;
    this.hitRadius = 16 * sc * 1.2;

    this.setAlpha(0).setScale(0.6);
    this.setVisible(true).setActive(true);
    this.scene.tweens.add({
      targets: this, alpha: 1, scale: 1,
      duration: 220, ease: 'Cubic.Out',
    });
  }

  update(dt, kingX, kingY) {
    if (!this.alive) return;
    if (this.touchCooldown > 0) this.touchCooldown -= dt;

    // 영웅을 향해 직선 추격
    const dx = kingX - this.x;
    const dy = kingY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
    // 본체 회전 (영웅을 향해)
    const ang = Math.atan2(dy, dx);
    this.body.setRotation(ang + Math.PI / 2);
  }

  takeDamage(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpFill.width = this._hpFullW * ratio;
    this.scene.tweens.add({
      targets: this.body, alpha: { from: 1, to: 0.4 },
      duration: 50, yoyo: true,
    });
    if (this.hp <= 0) {
      this.alive = false;
      this.scene.tweens.add({
        targets: this, alpha: 0, scale: 0.7, y: this.y - 4,
        duration: 230, ease: 'Cubic.Out',
        onComplete: () => this.setVisible(false).setActive(false),
      });
      return true;
    }
    return false;
  }
}
