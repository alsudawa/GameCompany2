// Enemy — 경로 따라 진군. 끝점 도달 시 건물에 데미지.

import { ENEMIES } from '../config.js';
import { pathPosition } from '../maps/path.js';

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
    this.body   = scene.add.sprite(0, 0, 'zombie').setScale(0.5);
    this.hpBg   = scene.add.rectangle(0, -22, 30, 4, 0x000000, 0.7);
    this.hpFill = scene.add.rectangle(0, -22, 30, 4, 0xff5050, 1);
    this.hpFill.setOrigin(0, 0.5);
    this.add([this.shadow, this.body, this.hpBg, this.hpFill]);

    this.alive = false;
    this.kind = 'soldier';
    this.hp = 1; this.maxHp = 1;
    this.speed = 60; this.baseSpeed = 60;
    this.damage = 1;
    this.bounty = 0; this.scoreVal = 0;
    this.t = 0;
    this.path = null;
    this.slowUntil = 0; this.slowStrength = 0;
    this.hitRadius = 16;
    this._hpFullW = 30;

    this.setVisible(false).setActive(false);
  }

  reset(kind, path, hpMul = 1) {
    const cfg = ENEMIES[kind] ?? ENEMIES.soldier;
    this.alive = true;
    this.kind = kind;
    this.path = path;
    this.t = 0;
    this.maxHp = Math.round(cfg.hp * hpMul);
    this.hp = this.maxHp;
    this.baseSpeed = cfg.speed;
    this.speed = this.baseSpeed;
    this.damage = cfg.damage;
    this.bounty = cfg.bounty;
    this.scoreVal = cfg.score;
    this.slowUntil = 0;

    const spriteKey = cfg.sprite ?? 'zombie';
    if (cfg.anim && this.scene.anims.exists(cfg.anim)) {
      this.body.play({ key: cfg.anim, startFrame: Math.floor(Math.random() * 4) });
    } else {
      this.body.stop?.();
      this.body.setTexture(spriteKey);
    }
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

    const p = pathPosition(this.path, 0);
    this.setPosition(p.x, p.y);
    this.body.setRotation(p.angle + Math.PI / 2);
    this.setAlpha(0).setScale(0.6);
    this.setVisible(true).setActive(true);
    this.scene.tweens.add({
      targets: this, alpha: 1, scale: 1,
      duration: 220, ease: 'Cubic.Out',
    });
  }

  update(dt, scene) {
    if (!this.alive) return null;
    let speed = this.baseSpeed;
    if (scene.time.now < this.slowUntil) {
      speed = this.baseSpeed * (1 - this.slowStrength);
      this.body.setTint(0x80c8ff);
    } else {
      this.body.setTint(TINT_FOR[this.kind] ?? 0xffffff);
    }
    this.t += speed * dt;
    const p = pathPosition(this.path, this.t);
    this.x = p.x;
    this.y = p.y;
    this.body.setRotation(p.angle + Math.PI / 2);
    if (p.done) {
      this.alive = false;
      this.setVisible(false).setActive(false);
      return { reachedEnd: true, damage: this.damage };
    }
    return null;
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

  applySlow(strength, durationMs) {
    this.slowStrength = Math.max(this.slowStrength, strength);
    this.slowUntil = this.scene.time.now + durationMs;
  }
}
