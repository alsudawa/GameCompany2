// King — 영웅 왕. 자유 2D 이동 + 조준 회전(매 프레임) + 활 시위 끌리는 모션.

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

    this.shadow = scene.add.ellipse(0, 18, 44, 12, 0x000000, 0.5);
    this.body   = scene.add.sprite(0, -8, 'king_walk', 0).setScale(1.0);
    this._isMoving = false;
    this.bow    = scene.add.graphics();
    this.bowDrawProgress = 0.85;
    this.drawBow();
    this.glow   = scene.add.graphics();
    this.add([this.shadow, this.body, this.bow, this.glow]);

    this.maxHp = 5;
    this.hp = 5;
    this.invulnUntil = 0;
    this.fireCooldown = 0;
    this.aimAngle = -Math.PI / 2;
    this._haveAim = false;
    this.dragTarget = null;
    this.moveSpeed = 280;
    this.weapon = { ...WEAPON_BASE };
    this.magnetRadius = 130;

    scene.tweens.add({
      targets: this, scale: { from: 1, to: 1.03 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  // 활 — King 컨테이너 좌표계, 조준 방향(-y) 앞쪽 기준.
  drawBow() {
    const b = this.bow;
    b.clear();
    const ax = 0, ay = -16;
    const bend = 4 - 3 * this.bowDrawProgress;
    // 활대
    b.lineStyle(3, COLORS.woodDark, 1);
    b.beginPath();
    b.moveTo(ax - 8, ay - bend); b.lineTo(ax, ay - 14); b.lineTo(ax + 8, ay - bend);
    b.strokePath();
    b.lineStyle(2, COLORS.woodBrown, 1);
    b.beginPath();
    b.moveTo(ax - 8, ay - bend); b.lineTo(ax, ay - 14); b.lineTo(ax + 8, ay - bend);
    b.strokePath();
    // 시위
    const stringPull = 5 * this.bowDrawProgress;
    b.lineStyle(1, 0xeae0c4, 0.9);
    b.beginPath();
    b.moveTo(ax - 8, ay - bend);
    b.lineTo(ax, ay - 8 + stringPull);
    b.lineTo(ax + 8, ay - bend);
    b.strokePath();
    // 골드 그립
    b.fillStyle(COLORS.goldHud, 1);
    b.fillCircle(ax, ay - 10, 1.5);
    // 화살 (당김 중일 때만)
    if (this.bowDrawProgress > 0.2) {
      b.fillStyle(COLORS.woodBrown, 1);
      b.fillRect(ax - 0.7, ay - 12 + stringPull, 1.4, 8 - stringPull);
      b.fillStyle(0xc0c8d0, 1);
      b.fillTriangle(ax - 1.5, ay - 13 + stringPull, ax + 1.5, ay - 13 + stringPull, ax, ay - 16 + stringPull);
    }
  }

  setBowDraw(p) {
    this.bowDrawProgress = Phaser.Math.Clamp(p, 0, 1);
    this.drawBow();
  }

  setDragTarget(x, y) { this.dragTarget = { x, y }; }
  clearDragTarget() { this.dragTarget = null; }

  update(dt) {
    let movingDir = null;
    if (this.dragTarget) {
      const dx = this.dragTarget.x - this.x;
      const dy = this.dragTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        const step = Math.min(dist, this.moveSpeed * dt);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
        movingDir = Math.atan2(dy, dx);
      } else {
        this.dragTarget = null;     // 도착 → 자동 정지
      }
    }
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // 사이드뷰: 회전 대신 좌/우 flip, bow만 조준 방향으로 회전
    let rot;
    if (this._haveAim) rot = this.aimAngle;
    else if (movingDir != null) rot = movingDir;
    else rot = -Math.PI / 2;
    this.body.setFlipX(Math.cos(rot) < 0);
    this.body.setRotation(0);
    this.bow.setRotation(rot + Math.PI / 2);

    // walk 애니메이션은 실제로 움직일 때만 재생, 멈추면 정지 프레임으로 복귀
    const moving = movingDir != null;
    if (moving && !this._isMoving) {
      this.body.play('king_walk');
      this._isMoving = true;
    } else if (!moving && this._isMoving) {
      this.body.stop();
      this.body.setFrame(0);
      this._isMoving = false;
    }

    // 활 시위 진행도: fireCooldown 진행에 따라 0 → 1
    if (this._haveAim) {
      const p = this.fireCooldown <= 0
        ? 0.85
        : 1 - this.fireCooldown / this.weapon.fireRate;
      this.setBowDraw(p);
    } else {
      this.setBowDraw(0.5);   // 대기 자세
    }
  }

  // 매 프레임 GameScene이 갱신
  setAim(target) {
    if (!target) { this._haveAim = false; return; }
    this._haveAim = true;
    this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
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
      fireFn(this.x + Math.cos(a) * 18, this.y + Math.sin(a) * 18, a, this.weapon);
    }
    this.playFireFx(ang);
    return true;
  }

  playFireFx(angle) {
    // 활 시위 풀림 → 다시 당김
    this.scene.tweens.add({
      targets: { v: 1 }, v: 0,
      duration: 80, ease: 'Cubic.Out',
      onUpdate: tw => this.setBowDraw(tw.getValue()),
    });
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
