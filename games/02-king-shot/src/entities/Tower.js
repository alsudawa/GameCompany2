// Tower — 슬롯 위에 배치되는 타워.
// kind에 따라 사거리/데미지/발사 속도/효과가 다름. tier(1~3)로 강화.

import { COLORS, KEY, TILE, TOWERS } from '../config.js';

const FRAME_FOR = {
  archer: TILE.TOWER_ARCHER,
  cannon: TILE.TOWER_CANNON,
  mortar: TILE.TOWER_MORTAR,
  frost:  TILE.TOWER_FROST,
};

const TINT_FOR = {
  archer: 0xffffff,
  cannon: 0xffffff,
  mortar: 0xffffff,
  frost:  0x80c8ff,
};

export class Tower extends Phaser.GameObjects.Container {
  constructor(scene, x, y, kind) {
    super(scene, x, y);
    scene.add.existing(this);

    this.kind = kind;
    this.tier = 0;        // 0,1,2 (UI에선 1/2/3 표기)
    this.cfg = TOWERS[kind];

    // 베이스 (슬롯 그대로) + 본체(회전 가능)
    this.base = scene.add.image(0, 0, KEY.tilesheet, TILE.SLOT)
      .setScale(0.5).setAlpha(0.85);
    this.body = scene.add.image(0, -2, KEY.tilesheet, FRAME_FOR[kind])
      .setScale(0.55);
    this.body.setTint(TINT_FOR[kind] ?? 0xffffff);
    this.tierDots = [];
    for (let i = 0; i < 3; i++) {
      const d = scene.add.circle(-9 + i * 9, 14, 2.5, 0x444444, 0.85);
      this.tierDots.push(d);
    }
    this.add([this.base, this.body, ...this.tierDots]);

    // 사거리 표시 (선택 시 보임)
    this.rangeRing = scene.add.graphics().setDepth(this.depth - 1);
    this.rangeRing.setVisible(false);

    this.fireCooldown = 0;
    this.target = null;
    this.totalInvested = 0;  // 구매 + 업그레이드에 쓴 누적 골드
    this.slot = null;        // 이 타워가 놓인 슬롯 참조 (판매 시 복구)
    this.refreshTier();

    // 등장 트윈
    this.setScale(0.6).setAlpha(0);
    scene.tweens.add({
      targets: this, scale: 1, alpha: 1,
      duration: 300, ease: 'Back.Out',
    });
  }

  refreshTier() {
    // tier dot 색
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
    // 살짝 펀치
    this.scene.tweens.add({
      targets: this, scale: { from: 1.25, to: 1 }, duration: 200, ease: 'Back.Out',
    });
  }

  showRange() {
    this.rangeRing.clear();
    this.rangeRing.fillStyle(this.cfg.color, 0.12);
    this.rangeRing.fillCircle(this.x, this.y, this.range);
    this.rangeRing.lineStyle(2, this.cfg.color, 0.7);
    this.rangeRing.strokeCircle(this.x, this.y, this.range);
    this.rangeRing.setVisible(true);
  }
  hideRange() {
    this.rangeRing.setVisible(false);
  }

  // 가까운 적 중 사거리 안에 있는 첫 목표
  pickTarget(enemies) {
    let best = null;
    let bestD = (this.range) * (this.range);
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  update(dt, scene) {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // 타겟 찾기
    if (!this.target || !this.target.alive ||
        ((this.target.x - this.x) ** 2 + (this.target.y - this.y) ** 2) > this.range * this.range) {
      this.target = this.pickTarget(scene.enemies);
    }

    if (!this.target) return;

    // 본체 회전 (탑 부분이 적을 향함)
    const ang = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    // sprite 기본 방향이 위쪽(0, -1)이라 가정 → +90°
    this.body.setRotation(ang + Math.PI / 2);

    // 사격
    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.fireRate;
      scene.fireProjectile(this, this.target);
    }
  }
}
