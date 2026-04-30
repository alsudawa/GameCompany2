// Tower — 슬롯에 지어진 타워. 4종이 각자 다른 실루엣 (절차 그래픽).
// 본체(barrel)는 조준 방향으로 회전, 베이스(stone)는 고정.

import { COLORS, TOWERS } from '../config.js';

export class Tower extends Phaser.GameObjects.Container {
  constructor(scene, x, y, kind) {
    super(scene, x, y);
    scene.add.existing(this);

    this.kind = kind;
    this.tier = 0;
    this.cfg = TOWERS[kind];

    // 그림자
    this.shadow = scene.add.ellipse(0, 14, 36, 10, 0x000000, 0.5);
    // 베이스 (돌 받침) — 고정
    this.base = scene.add.graphics();
    // 본체 (방향에 따라 회전) — 컨테이너로 묶어서 한 번에
    this.bodyGroup = scene.add.container(0, -2);
    this.body = scene.add.graphics();
    this.bodyGroup.add([this.body]);
    // 사거리 링 (선택 시)
    this.rangeRing = scene.add.graphics();
    this.rangeRing.setVisible(false);

    this.add([this.shadow, this.base, this.bodyGroup]);

    this.fireCooldown = 0;
    this.target = null;

    this.drawBase();
    this.drawBody();

    // 등장 트윈
    this.setScale(0.4).setAlpha(0);
    scene.tweens.add({
      targets: this, scale: 1, alpha: 1,
      duration: 280, ease: 'Back.Out',
    });
    // 미세 펄스
    scene.tweens.add({
      targets: this.bodyGroup, scaleY: { from: 1, to: 1.05 },
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  drawBase() {
    const g = this.base;
    g.clear();
    // 돌 받침 (원 + 어두운 림)
    g.fillStyle(0x4a4d52, 1);
    g.fillCircle(0, 4, 16);
    g.fillStyle(0x6e6e76, 1);
    g.fillCircle(0, 3, 14);
    g.fillStyle(0x8a8e96, 1);
    g.fillCircle(0, 2, 12);
    // 골드 림
    g.lineStyle(1.5, COLORS.goldHud, 0.85);
    g.strokeCircle(0, 3, 14);
    // 돌 시임 (4분할)
    g.lineStyle(1, 0x3a3d42, 0.7);
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(a => {
      g.beginPath();
      g.moveTo(Math.cos(a) * 6, 3 + Math.sin(a) * 6);
      g.lineTo(Math.cos(a) * 12, 3 + Math.sin(a) * 12);
      g.strokePath();
    });
  }

  drawBody() {
    const g = this.body;
    g.clear();
    if (this.kind === 'archer')      this.drawArcher(g);
    else if (this.kind === 'cannon') this.drawCannon(g);
    else if (this.kind === 'mortar') this.drawMortar(g);
    else if (this.kind === 'frost')  this.drawFrost(g);
  }

  drawArcher(g) {
    // 키 크고 좁은 탑 + 녹색 지붕 + 화살구멍
    // 본체는 위쪽(-y)이 앞쪽 = 조준 방향
    // 탑 몸통
    g.fillStyle(0x3e2e1e, 1);
    g.fillRoundedRect(-8, -22, 16, 22, 3);
    g.fillStyle(0xa0816a, 1);
    g.fillRoundedRect(-7, -22, 14, 21, 3);
    g.fillStyle(0x8b6a52, 1);
    g.fillRoundedRect(-6, -10, 12, 10, 2);
    // 화살구멍 (어두운 십자)
    g.fillStyle(0x2a1808, 1);
    g.fillRect(-1, -18, 2, 8);
    g.fillRect(-3, -14, 6, 2);
    // 녹색 원뿔 지붕
    g.fillStyle(0x3a6a2a, 1);
    g.fillTriangle(-10, -22, 10, -22, 0, -34);
    g.fillStyle(0x5a8a3a, 1);
    g.fillTriangle(-9, -22, 9, -22, 0, -32);
    // 골드 첨탑
    g.fillStyle(COLORS.goldHud, 1);
    g.fillCircle(0, -34, 1.5);
    g.fillRect(-0.5, -38, 1, 4);
    // 깃발
    g.fillStyle(COLORS.capeRed, 1);
    g.fillTriangle(0.5, -36, 6, -34, 0.5, -32);
  }

  drawCannon(g) {
    // 통통한 돌 탑 + 큰 캐논 배럴
    // 몸통
    g.fillStyle(0x3e2e1e, 1);
    g.fillRoundedRect(-12, -16, 24, 18, 4);
    g.fillStyle(0x8a8e96, 1);
    g.fillRoundedRect(-11, -16, 22, 17, 4);
    g.fillStyle(0x6e6e76, 1);
    g.fillRoundedRect(-11, -10, 22, 11, 3);
    // 시임
    g.lineStyle(1, 0x4a4d52, 0.7);
    g.beginPath();
    g.moveTo(-11, -10); g.lineTo(11, -10);
    g.strokePath();
    // 캐논 배럴 (위쪽 앞으로)
    g.fillStyle(0x2a2d32, 1);
    g.fillRoundedRect(-4, -28, 8, 16, 2);
    g.fillStyle(0x4a4d52, 1);
    g.fillRoundedRect(-3, -27, 6, 14, 2);
    // 배럴 입구
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, -28, 2.5);
    // 골드 트림
    g.fillStyle(COLORS.goldHud, 1);
    g.fillRect(-4, -14, 8, 2);
  }

  drawMortar(g) {
    // 넓은 베이스 + 사선 모탈 배럴
    g.fillStyle(0x3e2e1e, 1);
    g.fillRoundedRect(-13, -10, 26, 14, 4);
    g.fillStyle(0x8b3a2e, 1);
    g.fillRoundedRect(-12, -10, 24, 13, 4);
    g.fillStyle(0xa84a3e, 1);
    g.fillRoundedRect(-12, -6, 24, 9, 3);
    // 모탈 배럴 (사선)
    g.fillStyle(0x2a2d32, 1);
    g.fillRoundedRect(-5, -22, 10, 14, 3);
    g.fillStyle(0x4a4d52, 1);
    g.fillRoundedRect(-4, -21, 8, 12, 2);
    // 입구 (큰 원)
    g.fillStyle(0x000000, 1);
    g.fillCircle(0, -22, 4);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(0, -22, 3);
    // 골드 림
    g.lineStyle(1.5, COLORS.goldHud, 0.85);
    g.strokeCircle(0, -22, 4);
    // 옆 못
    g.fillStyle(COLORS.goldHud, 1);
    [-9, 9].forEach(x => g.fillCircle(x, -2, 1.2));
  }

  drawFrost(g) {
    // 얼음 결정 첨탑
    // 베이스 (얼음)
    g.fillStyle(0x3a6a90, 1);
    g.fillRoundedRect(-10, -10, 20, 14, 3);
    g.fillStyle(0x6abedf, 1);
    g.fillRoundedRect(-9, -10, 18, 13, 3);
    // 결정 (마름모)
    g.fillStyle(0x9adef5, 1);
    g.fillPoints([
      { x: 0, y: -32 }, { x: 8, y: -16 }, { x: 0, y: -8 }, { x: -8, y: -16 },
    ], true);
    g.fillStyle(0xc8eefd, 0.95);
    g.fillPoints([
      { x: 0, y: -28 }, { x: 5, y: -16 }, { x: 0, y: -10 }, { x: -5, y: -16 },
    ], true);
    // 측면 작은 결정
    g.fillStyle(0x9adef5, 1);
    g.fillPoints([
      { x: -6, y: -22 }, { x: -10, y: -16 }, { x: -6, y: -12 }, { x: -2, y: -16 },
    ], true);
    g.fillPoints([
      { x: 6, y: -22 }, { x: 10, y: -16 }, { x: 6, y: -12 }, { x: 2, y: -16 },
    ], true);
    // 하이라이트
    g.fillStyle(0xffffff, 0.7);
    g.fillTriangle(-1.5, -28, 1, -22, -1, -22);
  }

  get range()    { return this.cfg.range[this.tier]; }
  get damage()   { return this.cfg.damage[this.tier]; }
  get fireRate() { return this.cfg.fireRate[this.tier]; }

  // TowerSlot이 빌드 시 호출 (현재는 항상 tier 0).
  setTier(tier) {
    this.tier = Math.max(0, Math.min(2, tier));
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
    if (!this.target) {
      // 목표 없으면 살짝 좌우 흔들림
      this.bodyGroup.setRotation(Math.sin(scene.time.now * 0.0008) * 0.2);
      return;
    }
    const ang = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    this.bodyGroup.setRotation(ang + Math.PI / 2);
    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.fireRate;
      scene.fireProjectile(this, this.target);
    }
  }
}
