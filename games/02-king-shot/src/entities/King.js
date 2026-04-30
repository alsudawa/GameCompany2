// King — 영웅 왕. Kenney soldier 스프라이트 + 왕관/망토 오버레이.
// 자유 2D 이동: 손가락 위치를 향해 lerp 이동.

import { COLORS, WEAPON_BASE } from '../config.js';

const RADIUS = 16;

export class King extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.shadow = scene.add.ellipse(0, 14, 38, 12, 0x000000, 0.45);
    this.cape   = scene.add.graphics();
    this.body   = scene.add.image(0, 0, 'king').setScale(0.65);
    this.crown  = scene.add.graphics();
    this.glow   = scene.add.graphics();

    this.add([this.shadow, this.cape, this.body, this.crown, this.glow]);

    this.maxHp = 5;
    this.hp = 5;
    this.invulnUntil = 0;
    this.fireCooldown = 0;
    this.aimAngle = -Math.PI / 2;
    this.dragTarget = null;
    this.moveSpeed = 280;
    this.weapon = { ...WEAPON_BASE };

    this.drawCape();
    this.drawCrown();

    scene.tweens.add({
      targets: this, scale: { from: 1, to: 1.04 },
      duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.cape, scaleX: { from: 1, to: 1.1 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.crown, y: { from: -22, to: -25 },
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  drawCape() {
    this.cape.clear();
    const top = -2, bot = 18;
    const topW = 18, botW = 30;
    this.cape.fillStyle(COLORS.capeRedDk, 1);
    this.cape.fillPoints([
      { x: -topW / 2 - 1, y: top + 1 },
      { x:  topW / 2 + 1, y: top + 1 },
      { x:  botW / 2 + 1, y: bot + 1 },
      { x: -botW / 2 - 1, y: bot + 1 },
    ], true);
    this.cape.fillStyle(COLORS.capeRed, 1);
    this.cape.fillPoints([
      { x: -topW / 2, y: top },
      { x:  topW / 2, y: top },
      { x:  botW / 2, y: bot },
      { x: -botW / 2, y: bot },
    ], true);
    this.cape.fillStyle(COLORS.goldHud, 1);
    this.cape.fillRect(-botW / 2, bot - 3, botW, 2);
  }

  drawCrown() {
    this.crown.clear();
    this.crown.y = -22;
    const baseW = 22;
    this.crown.fillStyle(COLORS.goldDeep, 1);
    this.crown.fillRect(-baseW / 2 - 1, 1, baseW + 2, 4);
    this.crown.fillStyle(COLORS.goldHud, 1);
    this.crown.fillRect(-baseW / 2, 0, baseW, 4);
    const spikes = [-baseW / 2 + 2, -baseW / 4, 0, baseW / 4, baseW / 2 - 2];
    const heights = [4, 6, 8, 6, 4];
    spikes.forEach((sx, i) => {
      this.crown.fillStyle(COLORS.goldHud, 1);
      this.crown.fillTriangle(sx - 1.5, 0, sx + 1.5, 0, sx, -heights[i]);
    });
    this.crown.fillStyle(COLORS.capeRed, 1);
    this.crown.fillCircle(0, 2.5, 1.6);
    this.crown.fillStyle(COLORS.gemBlue, 1);
    this.crown.fillCircle(-baseW / 4, 2.5, 1.2);
    this.crown.fillCircle( baseW / 4, 2.5, 1.2);
  }

  setDragTarget(x, y) { this.dragTarget = { x, y }; }
  clearDragTarget() { this.dragTarget = null; }

  update(dt, scene) {
    if (this.dragTarget) {
      const dx = this.dragTarget.x - this.x;
      const dy = this.dragTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const step = Math.min(dist, this.moveSpeed * dt);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
    }
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    // 본체 회전 (조준 방향)
    this.body.setRotation(this.aimAngle + Math.PI / 2);
  }

  tryFire(target, fireFn) {
    if (this.fireCooldown > 0) return false;
    if (!target) return false;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 > this.weapon.range * this.weapon.range) return false;
    this.fireCooldown = this.weapon.fireRate;
    const ang = Math.atan2(dy, dx);
    this.aimAngle = ang;
    const ms = Math.max(1, this.weapon.multishot);
    const spread = this.weapon.spread * (ms - 1);
    for (let i = 0; i < ms; i++) {
      const t = ms === 1 ? 0 : (i / (ms - 1) - 0.5) * 2;
      const a = ang + t * spread;
      fireFn(this.x + Math.cos(a) * 18, this.y + Math.sin(a) * 18, a, this.weapon);
    }
    this.playFireFx(ang);
    return true;
  }

  playFireFx(angle) {
    const ox = -Math.cos(angle) * 2.5;
    const oy = -Math.sin(angle) * 2.5;
    this.scene.tweens.add({
      targets: this, x: this.x + ox, y: this.y + oy,
      duration: 50, yoyo: true,
    });
    this.glow.clear();
    this.glow.fillStyle(COLORS.goldHud, 0.55);
    this.glow.fillCircle(0, 0, 16);
    this.scene.tweens.add({
      targets: this.glow, alpha: { from: 1, to: 0 },
      duration: 130, ease: 'Cubic.Out',
    });
  }

  takeDamage(n = 1) {
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return false;
    this.hp = Math.max(0, this.hp - n);
    this.invulnUntil = now + 700;
    this.scene.tweens.add({
      targets: this, alpha: { from: 1, to: 0.35 },
      duration: 80, yoyo: true, repeat: 3,
      onComplete: () => this.setAlpha(1),
    });
    return true;
  }

  get hitRadius() { return RADIUS; }
}
