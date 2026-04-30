// Enemy — 영웅을 향해 직진. Kenney 스프라이트 사용.

import { COLORS, ENEMIES, KEY, TILE } from '../config.js';

export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.shadow = scene.add.ellipse(0, 14, 38, 10, 0x000000, 0.4);
    this.body   = scene.add.image(0, 0, KEY.tilesheet, TILE.ENEMY_TANK_GREEN).setScale(0.5);
    this.hpBg   = scene.add.rectangle(0, -22, 30, 4, 0x000000, 0.7);
    this.hpFill = scene.add.rectangle(0, -22, 30, 4, 0xff5050, 1);
    this.hpFill.setOrigin(0, 0.5);
    this.hpBg.setOrigin(0.5, 0.5);
    this.add([this.shadow, this.body, this.hpBg, this.hpFill]);

    this.alive = false;
    this.kind = 'soldier';
    this.hp = 1;
    this.maxHp = 1;
    this.speed = 60;
    this.damage = 1;
    this.bounty = 0;
    this.scoreVal = 0;
    this.touchCooldown = 0;
    this.hitRadius = 16;

    this.setVisible(false).setActive(false);
  }

  reset(kind, x, worldY, hpMul = 1) {
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
    this.x = x;
    this.worldY = worldY;       // 월드 Y (스크롤 적용 전)
    this.body.setFrame(TILE[cfg.tile]);
    this.body.setTint(cfg.tint ?? 0xffffff);
    this.body.setScale(cfg.scale ?? 0.55);
    const hpW = Math.round(34 * (cfg.scale ?? 0.55));
    this.hpBg.setSize(hpW, 4);
    this.hpFill.width = hpW;
    this._hpFullW = hpW;
    this.hpFill.x = -hpW / 2;
    this.hitRadius = 16 * (cfg.scale ?? 0.55) * 1.2;
    this.setAlpha(0).setScale(0.6);
    this.setVisible(true).setActive(true);
    this.scene.tweens.add({
      targets: this, alpha: 1, scale: 1,
      duration: 220, ease: 'Cubic.Out',
    });
  }

  // dt: 초. heroX/heroWorldY: 영웅 위치. 카메라(yScroll): 화면 표시용
  update(dt, heroX, heroWorldY) {
    if (!this.alive) return;
    if (this.touchCooldown > 0) this.touchCooldown -= dt;

    // 영웅을 향해 직선 이동 (월드 좌표)
    const dx = heroX - this.x;
    const dy = heroWorldY - this.worldY;
    const dist = Math.hypot(dx, dy) || 1;
    this.x += (dx / dist) * this.speed * dt;
    this.worldY += (dy / dist) * this.speed * dt;
    // body는 진행 방향 회전
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
        targets: this, alpha: 0, scale: 0.7, y: this.y - 6,
        duration: 230, ease: 'Cubic.Out',
        onComplete: () => this.setVisible(false).setActive(false),
      });
      return true;
    }
    return false;
  }
}
