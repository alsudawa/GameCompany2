// King — 영웅 왕. Kenney soldier 스프라이트 + 왕관/망토 오버레이 + 자유 2D 이동 + 자동 사격.

import { COLORS } from '../config.js';

const RADIUS = 14;

const WEAPON_BASE = {
  damage: 10,
  fireRate: 0.40,
  projectileSpeed: 580,
  multishot: 1,
  range: 240,
  spread: 0.10,
};

export class King extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.shadow = scene.add.ellipse(0, 14, 36, 11, 0x000000, 0.45);
    this.cape   = scene.add.graphics();
    this.body   = scene.add.image(0, 0, 'king').setScale(0.6);
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
    this.magnetRadius = 130;

    this.drawCape();
    this.drawCrown();

    scene.tweens.add({
      targets: this, scale: { from: 1, to: 1.03 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.cape, scaleX: { from: 1, to: 1.08 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.crown, y: { from: -20, to: -23 },
      duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  drawCape() {
    const g = this.cape;
    g.clear();
    const top = -2, bot = 16, topW = 16, botW = 26;
    g.fillStyle(COLORS.capeRedDk, 1);
    g.fillPoints([
      { x: -topW / 2 - 1, y: top + 1 },
      { x:  topW / 2 + 1, y: top + 1 },
      { x:  botW / 2 + 1, y: bot + 1 },
      { x: -botW / 2 - 1, y: bot + 1 },
    ], true);
    g.fillStyle(COLORS.capeRed, 1);
    g.fillPoints([
      { x: -topW / 2, y: top },
      { x:  topW / 2, y: top },
      { x:  botW / 2, y: bot },
      { x: -botW / 2, y: bot },
    ], true);
    g.fillStyle(COLORS.goldHud, 1);
    g.fillRect(-botW / 2, bot - 3, botW, 2);
  }

  drawCrown() {
    const c = this.crown;
    c.clear();
    c.y = -20;
    const baseW = 20;
    c.fillStyle(COLORS.goldDeep, 1);
    c.fillRect(-baseW / 2 - 1, 1, baseW + 2, 4);
    c.fillStyle(COLORS.goldHud, 1);
    c.fillRect(-baseW / 2, 0, baseW, 4);
    [-baseW / 2 + 2, -baseW / 4, 0, baseW / 4, baseW / 2 - 2].forEach((sx, i) => {
      const h = [3, 5, 7, 5, 3][i];
      c.fillStyle(COLORS.goldHud, 1);
      c.fillTriangle(sx - 1.3, 0, sx + 1.3, 0, sx, -h);
    });
    c.fillStyle(COLORS.capeRed, 1);
    c.fillCircle(0, 2.5, 1.5);
    c.fillStyle(COLORS.gemBlue, 1);
    c.fillCircle(-baseW / 4, 2.5, 1.1);
    c.fillCircle( baseW / 4, 2.5, 1.1);
  }

  setDragTarget(x, y) { this.dragTarget = { x, y }; }
  clearDragTarget() { this.dragTarget = null; }

  update(dt) {
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
    this.body.setRotation(this.aimAngle + Math.PI / 2);
  }

  tryFire(target, fireFn) {
    if (this.fireCooldown > 0) return false;
    if (!target) return false;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > this.weapon.range * this.weapon.range) return false;
    this.fireCooldown = this.weapon.fireRate;
    const ang = Math.atan2(dy, dx);
    this.aimAngle = ang;
    const ms = Math.max(1, this.weapon.multishot);
    const spread = this.weapon.spread * (ms - 1);
    for (let i = 0; i < ms; i++) {
      const t = ms === 1 ? 0 : (i / (ms - 1) - 0.5) * 2;
      const a = ang + t * spread;
      fireFn(this.x + Math.cos(a) * 14, this.y + Math.sin(a) * 14, a, this.weapon);
    }
    this.playFireFx(ang);
    return true;
  }

  playFireFx(angle) {
    const ox = -Math.cos(angle) * 2;
    const oy = -Math.sin(angle) * 2;
    this.scene.tweens.add({
      targets: this, x: this.x + ox, y: this.y + oy,
      duration: 50, yoyo: true,
    });
    this.glow.clear();
    this.glow.fillStyle(COLORS.goldHud, 0.5);
    this.glow.fillCircle(0, 0, 14);
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
