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
    this.baseSpeed = cfg.speed * (0.92 + Math.random() * 0.16); // 살짝 다른 속도 → 무리감
    this.speed = this.baseSpeed;
    this.damage = cfg.damage;
    this.bounty = cfg.bounty;
    this.scoreVal = cfg.score;
    this.slowUntil = 0;
    // 좌우 차선 오프셋 — 일렬이 아닌 무리로 보이게
    const laneRange = (kind === 'boss') ? 0 : 22;
    this.laneOffset = (Math.random() - 0.5) * 2 * laneRange;

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
    if (cfg.anim) {
      this.body.setRotation(0);
      this.body.setFlipX(Math.cos(p.angle) < 0);
    } else {
      this.body.setRotation(p.angle + Math.PI / 2);
    }
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
    // 경로 진행 방향에 수직(perp) 차선 오프셋 적용 → 무리로 퍼져 보임
    const perpX = -Math.sin(p.angle);
    const perpY =  Math.cos(p.angle);
    this.x = p.x + perpX * this.laneOffset;
    this.y = p.y + perpY * this.laneOffset;
    if (this.body.anims?.isPlaying) {
      this.body.setFlipX(Math.cos(p.angle) < 0);
    } else {
      this.body.setRotation(p.angle + Math.PI / 2);
    }
    if (p.done) {
      this.alive = false;
      this.setVisible(false).setActive(false);
      return { reachedEnd: true, damage: this.damage };
    }
    return null;
  }

  takeDamage(dmg, hitDirX = 0, hitDirY = 0) {
    if (!this.alive) return false;
    this.hp -= dmg;
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpFill.width = this._hpFullW * ratio;
    // 흰색 플래시 — 픽셀 sprite는 alpha만 yoyo하던 걸 흰 tint로 바꿔 더 또렷하게
    const oldTint = TINT_FOR[this.kind] ?? 0xffffff;
    this.body.setTintFill?.(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (!this.alive) return;
      this.body.clearTint?.();
      this.body.setTint(oldTint);
    });
    // 화살 방향으로 살짝 밀리기 (laneOffset에 미는 양 누적 → 자연스럽게 원위치 회귀)
    if (hitDirX || hitDirY) {
      const ang = Math.atan2(this.path?.segs?.[0]?.b.y - this.path?.segs?.[0]?.a.y || 0,
                             this.path?.segs?.[0]?.b.x - this.path?.segs?.[0]?.a.x || 0);
      // 단순 lateral knockback: laneOffset 변경
      const perpX = -Math.sin(ang), perpY = Math.cos(ang);
      const dot = hitDirX * perpX + hitDirY * perpY;
      this.laneOffset = Phaser.Math.Clamp(this.laneOffset + dot * 4, -28, 28);
    }
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
