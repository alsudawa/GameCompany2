// Building — 길 끝에 있는 왕좌 건물. HP가 0이 되면 게임 오버.
// 절차 그래픽으로 큰 성문 + 위에 왕(작은 스프라이트 + 왕관 오버레이) 표시.

import { COLORS, FONT } from '../config.js';

export class Building extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.maxHp = 10;
    this.hp = 10;

    // 큰 성문 (가로로 큼)
    this.gate = scene.add.graphics();
    // 왕 (성문 위 작은 스프라이트)
    this.king = scene.add.image(0, -28, 'king').setScale(0.45);
    // 왕관 오버레이
    this.crown = scene.add.graphics();
    this.crown.y = -50;
    // HP 바 (성문 위)
    this.hpBg   = scene.add.rectangle(0, -64, 80, 8, 0x000000, 0.85);
    this.hpFill = scene.add.rectangle(-40, -64, 80, 8, 0x6abe6a, 1);
    this.hpFill.setOrigin(0, 0.5);
    this.hpBg.setOrigin(0.5, 0.5);
    // HP 숫자
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
    // 그림자
    g.fillStyle(0x000000, 0.5);
    g.fillRect(-44, -8, 88, 36);
    // 본체 돌
    g.fillStyle(0x6e6e76, 1);
    g.fillRect(-42, -10, 84, 34);
    // 위쪽 짙은 띠
    g.fillStyle(0x4a4d52, 1);
    g.fillRect(-42, -10, 84, 6);
    // 돌 시임
    g.lineStyle(1.5, 0x3a3d42, 0.85);
    [-28, -14, 0, 14, 28].forEach(x => {
      g.beginPath();
      g.moveTo(x, -10); g.lineTo(x, 24);
      g.strokePath();
    });
    g.beginPath();
    g.moveTo(-42, 8); g.lineTo(42, 8);
    g.strokePath();
    // 정문(아치)
    g.fillStyle(0x2a1a0a, 1);
    g.fillRoundedRect(-18, 4, 36, 22, { tl: 14, tr: 14, bl: 0, br: 0 });
    // 위쪽 톱니
    g.fillStyle(0x6e6e76, 1);
    [-36, -22, -8, 8, 22, 36].forEach(x => {
      g.fillRect(x - 4, -18, 8, 8);
    });
    // 깃발 두 개
    [-36, 36].forEach(x => {
      g.fillStyle(0x3e2e1e, 1);
      g.fillRect(x - 1, -28, 2, 18);
      g.fillStyle(COLORS.capeRed, 1);
      g.fillTriangle(x + 1, -28, x + 14, -23, x + 1, -18);
      g.fillStyle(COLORS.goldHud, 1);
      g.fillCircle(x, -28, 1.6);
    });
  }

  drawCrown() {
    const c = this.crown;
    c.clear();
    const baseW = 22;
    c.fillStyle(COLORS.goldDeep, 1);
    c.fillRect(-baseW / 2 - 1, 1, baseW + 2, 4);
    c.fillStyle(COLORS.goldHud, 1);
    c.fillRect(-baseW / 2, 0, baseW, 4);
    const spikes = [-baseW / 2 + 2, -baseW / 4, 0, baseW / 4, baseW / 2 - 2];
    const heights = [4, 6, 8, 6, 4];
    spikes.forEach((sx, i) => {
      c.fillStyle(COLORS.goldHud, 1);
      c.fillTriangle(sx - 1.5, 0, sx + 1.5, 0, sx, -heights[i]);
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
    this.scene.tweens.add({
      targets: [this.king, this.crown, this.hpBg, this.hpFill, this.hpText],
      x: { from: -3, to: 3 }, duration: 50, yoyo: true, repeat: 1,
    });
    return this.hp <= 0;
  }

  refreshHpBar() {
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpFill.width = 80 * ratio;
    let col = 0x6abe6a;
    if (ratio < 0.66) col = 0xf4c542;
    if (ratio < 0.33) col = 0xc8302d;
    this.hpFill.fillColor = col;
    this.hpText.setText(`${this.hp}/${this.maxHp}`);
  }
}
