// Tower — 슬롯 위 타워. 4종(archer/cannon/mortar/frost) × 3 tier.

import { COLORS, TOWERS } from '../config.js';

const TINT_FOR = {
  archer: 0x8ad04f,
  cannon: 0xc89438,
  mortar: 0xa84a4a,
  frost:  0x80c8ff,
};

export class Tower extends Phaser.GameObjects.Container {
  constructor(scene, x, y, kind) {
    super(scene, x, y);
    scene.add.existing(this);

    this.kind = kind;
    this.tier = 0;
    this.cfg = TOWERS[kind];

    // 베이스(돌 받침)
    this.base = scene.add.graphics();
    this.drawBase();
    // 본체 — 회전 가능 + 스프라이트 (king 이미지를 회전 본체로 재활용)
    this.body = scene.add.image(0, -2, 'king').setScale(0.5);
    this.body.setTint(TINT_FOR[kind] ?? 0xffffff);
    // tier 점 3개
    this.tierDots = [];
    for (let i = 0; i < 3; i++) {
      const d = scene.add.circle(-9 + i * 9, 14, 2.5, 0x444444, 0.85);
      this.tierDots.push(d);
    }
    // 사거리 표시 (선택 시)
    this.rangeRing = scene.add.graphics();
    this.rangeRing.setVisible(false);

    this.add([this.base, this.body, ...this.tierDots]);

    this.fireCooldown = 0;
    this.target = null;
    this.refreshTier();

    this.setScale(0.6).setAlpha(0);
    scene.tweens.add({
      targets: this, scale: 1, alpha: 1,
      duration: 280, ease: 'Back.Out',
    });
  }

  drawBase() {
    const g = this.base;
    g.clear();
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(2, 14, 30, 8);
    g.fillStyle(0x6e6e76, 1);
    g.fillCircle(0, 0, 16);
    g.fillStyle(0x4a4d52, 1);
    g.fillCircle(0, 0, 13);
    g.lineStyle(1.5, 0x3a3d42, 0.9);
    g.strokeCircle(0, 0, 16);
    g.fillStyle(COLORS.goldHud, 0.9);
    g.fillCircle(0, 0, 11);
    g.fillStyle(this.cfg?.color ?? 0xffffff, 0.6);
    g.fillCircle(0, 0, 9);
  }

  refreshTier() {
    this.tierDots.forEach((d, i) => {
      d.setFillStyle(i <= this.tier ? COLORS.goldHud : 0x444444,
                     i <= this.tier ? 1 : 0.7);
    });
  }

  get range()    { return this.cfg.range[this.tier]; }
  get damage()   { return this.cfg.damage[this.tier]; }
  get fireRate() { return this.cfg.fireRate[this.tier]; }
  get cost()     { return this.cfg.cost[this.tier]; }
  get nextCost() { return this.cfg.cost[this.tier + 1]; }
  canUpgrade()   { return this.tier < 2; }

  upgrade() {
    if (!this.canUpgrade()) return;
    this.tier++;
    this.refreshTier();
    this.scene.tweens.add({
      targets: this, scale: { from: 1.25, to: 1 },
      duration: 200, ease: 'Back.Out',
    });
  }

  // 명시적 tier 설정 (TowerSlot에서 빌드 시 사용)
  setTier(tier) {
    this.tier = Math.max(0, Math.min(2, tier));
    this.refreshTier();
  }

  showRange() {
    this.rangeRing.clear();
    this.rangeRing.fillStyle(this.cfg.color, 0.12);
    this.rangeRing.fillCircle(this.x, this.y, this.range);
    this.rangeRing.lineStyle(2, this.cfg.color, 0.7);
    this.rangeRing.strokeCircle(this.x, this.y, this.range);
    this.rangeRing.setVisible(true);
  }
  hideRange() { this.rangeRing.setVisible(false); }

  pickTarget(enemies) {
    let best = null;
    let bestT = -Infinity;
    const r2 = this.range * this.range;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      if (dx * dx + dy * dy > r2) continue;
      // 가장 멀리 진행한 적(가장 큰 t) 우선 — 방어 우선순위
      if (e.t > bestT) { bestT = e.t; best = e; }
    }
    return best;
  }

  update(dt, scene) {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (!this.target || !this.target.alive ||
        ((this.target.x - this.x) ** 2 + (this.target.y - this.y) ** 2) > this.range * this.range) {
      this.target = this.pickTarget(scene.enemies);
    }
    if (!this.target) return;
    const ang = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    this.body.setRotation(ang + Math.PI / 2);
    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.fireRate;
      scene.fireProjectile(this, this.target);
    }
  }
}
