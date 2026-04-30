// 영웅 왕(기사). 드래그로 X 이동, 자동 사격.
// 절차 그래픽: 그림자 → 망토 → 갑옷 → 어깨 → 머리 → 왕관 → 활.

import { COLORS, WEAPON_BASE } from '../config.js';

const RADIUS = 18;

export class King extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.shadow      = scene.add.ellipse(0, 22, 38, 10, 0x000000, 0.45);
    this.cape        = scene.add.graphics();
    this.body        = scene.add.graphics();
    this.shoulderL   = scene.add.graphics();
    this.shoulderR   = scene.add.graphics();
    this.head        = scene.add.graphics();
    this.crown       = scene.add.graphics();
    this.bow         = scene.add.graphics();
    this.glow        = scene.add.graphics();

    this.add([this.shadow, this.cape, this.body,
              this.shoulderL, this.shoulderR, this.head, this.crown,
              this.bow, this.glow]);

    this.maxHp = 5;
    this.hp = 5;
    this.invulnUntil = 0;
    this.fireCooldown = 0;
    this.aimAngle = -Math.PI / 2;
    this.dragTargetX = null;

    this.weapon = { ...WEAPON_BASE };

    this.drawAll();

    // 숨쉬기 펄스
    scene.tweens.add({
      targets: this, scale: { from: 1, to: 1.04 },
      duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    // 망토 흔들림
    scene.tweens.add({
      targets: this.cape, scaleX: { from: 1, to: 1.08 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.cape, angle: { from: -1.5, to: 1.5 },
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    // 왕관 까딱
    scene.tweens.add({
      targets: this.crown, y: { from: -32, to: -34 },
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  drawAll() {
    this.drawShadow();
    this.drawCape();
    this.drawBody();
    this.drawShoulders();
    this.drawHead();
    this.drawCrown();
    this.drawBow();
  }

  drawShadow() {
    // 이미 ellipse로 만들어둠
  }

  drawCape() {
    this.cape.clear();
    const top = -8, bot = 22;
    const topW = 16, botW = 28;
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

  drawBody() {
    this.body.clear();
    const W = 28, H = 34;
    this.body.fillStyle(COLORS.knightBlueDk, 1);
    this.body.fillRoundedRect(-W / 2 - 1, -7 + 1, W + 2, H, 7);
    this.body.fillStyle(COLORS.knightBlue, 1);
    this.body.fillRoundedRect(-W / 2, -7, W, H, 7);
    // V자 갑옷 라인
    this.body.lineStyle(2, COLORS.knightBlueDk, 0.8);
    this.body.beginPath();
    this.body.moveTo(-W / 2 + 5, -2); this.body.lineTo(0, 8);
    this.body.lineTo(W / 2 - 5, -2);
    this.body.strokePath();
    // 가슴 보석
    this.body.fillStyle(COLORS.goldHud, 1);
    this.body.fillCircle(0, 4, 2.4);
    // 벨트
    this.body.fillStyle(COLORS.woodDark, 1);
    this.body.fillRect(-W / 2 + 2, 16, W - 4, 4);
    this.body.fillStyle(COLORS.goldHud, 1);
    this.body.fillRect(-3, 16, 6, 4);
  }

  drawShoulders() {
    [this.shoulderL, this.shoulderR].forEach((g, i) => {
      const sign = i === 0 ? -1 : 1;
      g.clear();
      g.fillStyle(COLORS.knightBlueDk, 1);
      g.fillCircle(sign * 14, -5, 7.5);
      g.fillStyle(COLORS.knightBlue, 1);
      g.fillCircle(sign * 14, -5, 6);
      g.lineStyle(1.5, COLORS.goldHud, 1);
      g.strokeCircle(sign * 14, -5, 6);
    });
  }

  drawHead() {
    this.head.clear();
    this.head.fillStyle(COLORS.woodDark, 1);
    this.head.fillCircle(0, -20, 9);
    this.head.fillStyle(COLORS.skin, 1);
    this.head.fillCircle(0, -20, 8);
    // 머리카락
    this.head.fillStyle(COLORS.hair, 1);
    this.head.beginPath();
    this.head.arc(0, -20, 8, Math.PI, Math.PI * 2, false);
    this.head.fillPath();
    // 눈
    this.head.fillStyle(0x1a1208, 1);
    this.head.fillCircle(-2.5, -19, 1);
    this.head.fillCircle( 2.5, -19, 1);
    // 입
    this.head.lineStyle(1, 0x1a1208, 0.9);
    this.head.beginPath();
    this.head.moveTo(-1.5, -16); this.head.lineTo(1.5, -16);
    this.head.strokePath();
  }

  drawCrown() {
    this.crown.clear();
    const baseY = 0;     // (this.crown.y == -32 with tween)
    const baseW = 20;
    this.crown.fillStyle(COLORS.goldDeep, 1);
    this.crown.fillRect(-baseW / 2 - 1, baseY + 1, baseW + 2, 4);
    this.crown.fillStyle(COLORS.goldHud, 1);
    this.crown.fillRect(-baseW / 2, baseY, baseW, 4);
    const spikes = [-baseW / 2, -baseW / 4, 0, baseW / 4, baseW / 2];
    const heights = [3, 5, 7, 5, 3];
    spikes.forEach((sx, i) => {
      this.crown.fillStyle(COLORS.goldHud, 1);
      this.crown.fillTriangle(sx - 1.5, baseY, sx + 1.5, baseY, sx, baseY - heights[i]);
    });
    this.crown.fillStyle(COLORS.capeRed, 1);
    this.crown.fillCircle(0, baseY + 2, 1.5);
    this.crown.fillStyle(COLORS.gemBlue, 1);
    this.crown.fillCircle(-baseW / 4, baseY + 2, 1.1);
    this.crown.fillCircle( baseW / 4, baseY + 2, 1.1);
    this.crown.y = -32;
  }

  drawBow(bend = 0) {
    this.bow.clear();
    const bx = 18;
    const by = 0;
    this.bow.lineStyle(3, COLORS.woodDark, 1);
    this.bow.beginPath();
    this.bow.moveTo(bx + 5, by - 12);
    this.bow.lineTo(bx + 1 - bend, by);
    this.bow.lineTo(bx + 5, by + 12);
    this.bow.strokePath();
    this.bow.lineStyle(2, COLORS.woodBrown, 1);
    this.bow.beginPath();
    this.bow.moveTo(bx + 5, by - 12);
    this.bow.lineTo(bx + 1 - bend, by);
    this.bow.lineTo(bx + 5, by + 12);
    this.bow.strokePath();
    this.bow.lineStyle(1, 0xeae0c4, 0.85);
    this.bow.beginPath();
    this.bow.moveTo(bx + 5, by - 12);
    this.bow.lineTo(bx + 5 + bend * 0.6, by);
    this.bow.lineTo(bx + 5, by + 12);
    this.bow.strokePath();
    this.bow.fillStyle(COLORS.goldHud, 1);
    this.bow.fillRect(bx - bend, by - 1.5, 2.5, 3);
  }

  setDragTargetX(x) { this.dragTargetX = x; }
  clearDragTarget() { this.dragTargetX = null; }

  update(dt, scene) {
    // X 이동
    if (this.dragTargetX != null) {
      const dx = this.dragTargetX - this.x;
      const speed = 720;
      const step = Phaser.Math.Clamp(dx, -speed * dt, speed * dt);
      this.x += step;
    }
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
  }

  tryFire(target, fireFn) {
    if (this.fireCooldown > 0) return false;
    if (!target) return false;
    const dist2 = (target.x - this.x) ** 2 + (target.y - this.y) ** 2;
    if (dist2 > this.weapon.range * this.weapon.range) return false;
    this.fireCooldown = this.weapon.fireRate;
    const ang = Math.atan2(target.y - this.y, target.x - this.x);
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
    this.scene.tweens.add({
      targets: { v: 0 }, v: 1, duration: 50, ease: 'Cubic.Out',
      onUpdate: tw => this.drawBow(3 * (1 - tw.getValue())),
      onComplete: () => this.drawBow(0),
    });
    const ox = -Math.cos(angle) * 2;
    const oy = -Math.sin(angle) * 2;
    this.scene.tweens.add({
      targets: this, x: this.x + ox, y: this.y + oy,
      duration: 40, yoyo: true,
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

  applyUpgrade(type, value) {
    return type(this.weapon, value, this);
  }

  get hitRadius() { return RADIUS; }
}
