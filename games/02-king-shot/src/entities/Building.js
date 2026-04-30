// Building — 왕좌. HP + 진화 단계 (웨이브 진행에 따라 시각이 발전).
// 진화 0(초기) → 1(중반) → 2(후반) → 3(왕좌의 영광).

import { COLORS, FONT } from '../config.js';

export class Building extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.maxHp = 10;
    this.hp = 10;
    this.evolveStage = 0;

    this.gate = scene.add.graphics();
    this.king = scene.add.image(0, -28, 'king').setScale(0.45);
    this.crown = scene.add.graphics();
    this.crown.y = -50;
    this.hpBg   = scene.add.rectangle(0, -64, 86, 9, 0x000000, 0.85);
    this.hpFill = scene.add.rectangle(-43, -64, 86, 9, 0x6abe6a, 1);
    this.hpFill.setOrigin(0, 0.5);
    this.hpBg.setOrigin(0.5, 0.5);
    this.hpText = scene.add.text(0, -64, '10', {
      fontFamily: FONT.display, fontSize: '12px', fontStyle: '900',
      color: '#ffffff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add([this.gate, this.king, this.crown, this.hpBg, this.hpFill, this.hpText]);

    this.drawGate();
    this.drawCrown();

    scene.tweens.add({
      targets: this.king, scale: { from: 0.45, to: 0.5 },
      duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.crown, y: { from: -50, to: -53 },
      duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  drawGate() {
    const g = this.gate;
    g.clear();
    const stage = this.evolveStage;
    const wExtra = stage * 8;
    const hExtra = stage * 4;
    const w = 96 + wExtra;
    const h = 40 + hExtra;
    const baseY = -12 - hExtra;

    // 그림자
    g.fillStyle(0x000000, 0.55);
    g.fillRect(-w / 2 - 3, baseY + 3, w + 6, h + 6);
    // 외곽 짙은 돌
    g.fillStyle(0x3a3d42, 1);
    g.fillRect(-w / 2, baseY, w, h);
    // 본체 돌 (그라디언트 흉내 — 가로 띠 분리)
    g.fillStyle(0x6e6e76, 1);
    g.fillRect(-w / 2 + 2, baseY + 2, w - 4, h - 4);
    g.fillStyle(0x8a8e96, 1);
    g.fillRect(-w / 2 + 2, baseY + 2, w - 4, 8);
    g.fillStyle(0x4a4d52, 1);
    g.fillRect(-w / 2 + 2, baseY + h - 8, w - 4, 6);
    // 수직 시임
    g.lineStyle(1.5, 0x2a2d32, 0.7);
    const cols = 6 + stage;
    for (let i = 1; i < cols; i++) {
      const x = -w / 2 + (w * i) / cols;
      g.beginPath();
      g.moveTo(x, baseY + 2); g.lineTo(x, baseY + h - 4);
      g.strokePath();
    }
    // 수평 시임 두 줄
    g.lineStyle(1.5, 0x2a2d32, 0.7);
    g.beginPath();
    g.moveTo(-w / 2 + 2, baseY + 18); g.lineTo(w / 2 - 2, baseY + 18);
    g.strokePath();

    // 정문 아치 (어두운)
    g.fillStyle(0x1a0a04, 1);
    g.fillRoundedRect(-22, baseY + 16, 44, h - 16, { tl: 18, tr: 18, bl: 0, br: 0 });
    g.fillStyle(0x3e2e1e, 1);
    g.fillRoundedRect(-20, baseY + 18, 40, h - 18, { tl: 16, tr: 16, bl: 0, br: 0 });
    // 문짝 골드 못
    g.fillStyle(COLORS.goldDeep, 1);
    [-10, 10].forEach(x => {
      [baseY + 24, baseY + h - 8].forEach(y => g.fillCircle(x, y, 1.6));
    });

    // 위쪽 톱니 (왕관형 미늘)
    g.fillStyle(0x3a3d42, 1);
    const teethCount = 7 + stage * 2;
    const teethW = 10;
    for (let i = 0; i < teethCount; i++) {
      const tx = -w / 2 + 4 + (i * (w - 8 - teethW)) / (teethCount - 1);
      g.fillRect(tx, baseY - 10, teethW - 2, 10);
    }
    g.fillStyle(0x6e6e76, 1);
    for (let i = 0; i < teethCount; i++) {
      const tx = -w / 2 + 4 + (i * (w - 8 - teethW)) / (teethCount - 1);
      g.fillRect(tx + 1, baseY - 8, teethW - 4, 7);
    }

    // 골드 트림 (stage>=1)
    if (stage >= 1) {
      g.lineStyle(2, COLORS.goldHud, 0.9);
      g.strokeRect(-w / 2 + 2, baseY + 2, w - 4, h - 4);
      g.fillStyle(COLORS.goldHud, 1);
      g.fillRect(-w / 2 + 4, baseY + 16, w - 8, 2);
    }

    // 횃불 (stage>=2) — 양옆
    if (stage >= 2) {
      [-w / 2 - 4, w / 2 + 4].forEach(tx => {
        // 봉
        g.fillStyle(0x3e2e1e, 1);
        g.fillRect(tx - 1.2, baseY + 4, 2.4, 18);
        // 그릇
        g.fillStyle(COLORS.goldHud, 1);
        g.fillTriangle(tx - 4, baseY + 4, tx + 4, baseY + 4, tx, baseY + 12);
        // 불꽃
        g.fillStyle(0xff4a2a, 1);
        g.fillCircle(tx, baseY - 1, 5);
        g.fillStyle(0xff8a3a, 1);
        g.fillCircle(tx, baseY - 2, 3.5);
        g.fillStyle(0xffd060, 0.95);
        g.fillCircle(tx, baseY - 3, 2);
      });
    }

    // 큰 깃발 (stage>=3) — 양옆 위로 솟음
    if (stage >= 3) {
      [-w / 2 + 8, w / 2 - 8].forEach(tx => {
        g.fillStyle(0x3e2e1e, 1);
        g.fillRect(tx - 1, baseY - 26, 2, 18);
        g.fillStyle(COLORS.capeRedDk, 1);
        g.fillTriangle(tx + 1, baseY - 26, tx + 14, baseY - 21, tx + 1, baseY - 16);
        g.fillStyle(COLORS.capeRed, 1);
        g.fillTriangle(tx + 2, baseY - 25, tx + 12, baseY - 21, tx + 2, baseY - 17);
        g.fillStyle(COLORS.goldHud, 1);
        g.fillCircle(tx, baseY - 26, 1.6);
      });
    }
  }

  drawCrown() {
    const c = this.crown;
    c.clear();
    const stage = this.evolveStage;
    const baseW = 22 + stage * 2;
    c.fillStyle(COLORS.goldDeep, 1);
    c.fillRect(-baseW / 2 - 1, 1, baseW + 2, 4);
    c.fillStyle(COLORS.goldHud, 1);
    c.fillRect(-baseW / 2, 0, baseW, 4);
    [-baseW / 2 + 2, -baseW / 4, 0, baseW / 4, baseW / 2 - 2].forEach((sx, i) => {
      const h = [4, 6, 8 + stage, 6, 4][i];
      c.fillStyle(COLORS.goldHud, 1);
      c.fillTriangle(sx - 1.5, 0, sx + 1.5, 0, sx, -h);
    });
    c.fillStyle(COLORS.capeRed, 1);
    c.fillCircle(0, 2.5, 1.6);
    c.fillStyle(COLORS.gemBlue, 1);
    c.fillCircle(-baseW / 4, 2.5, 1.2);
    c.fillCircle( baseW / 4, 2.5, 1.2);
  }

  takeDamage(n) {
    this.hp = Math.max(0, this.hp - n);
    this.refreshHpBar();
    this.scene.tweens.add({
      targets: this.gate, alpha: { from: 1, to: 0.45 },
      duration: 60, yoyo: true,
    });
    return this.hp <= 0;
  }

  refreshHpBar() {
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpFill.width = 86 * ratio;
    let col = 0x6abe6a;
    if (ratio < 0.66) col = 0xf4c542;
    if (ratio < 0.33) col = 0xc8302d;
    this.hpFill.fillColor = col;
    this.hpText.setText(`${this.hp}/${this.maxHp}`);
  }

  // 웨이브 진행마다 호출
  evolve(stage) {
    if (stage <= this.evolveStage) return;
    this.evolveStage = Math.min(3, stage);
    this.drawGate();
    this.drawCrown();
    // 진화 효과
    this.scene.tweens.add({
      targets: this, scale: { from: 1.15, to: 1 },
      duration: 360, ease: 'Back.Out',
    });
  }

  heal(n) {
    this.hp = Math.min(this.maxHp, this.hp + n);
    this.refreshHpBar();
  }

  setMaxHp(n) {
    const ratio = this.hp / this.maxHp;
    this.maxHp = n;
    this.hp = Math.round(n * ratio);
    this.refreshHpBar();
  }
}
