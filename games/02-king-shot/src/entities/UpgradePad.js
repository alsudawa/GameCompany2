// UpgradePad — 영웅이 밟으면 적용되는 업그레이드 패드.
// 양피지 + 골드 외곽 + 글리프 + 펄스 글로우. 한 번 적용되면 사라짐.

import { COLORS, FONT, UPGRADE_TYPES } from '../config.js';

const PAD_R = 32;

export class UpgradePad extends Phaser.GameObjects.Container {
  constructor(scene, x, y, info) {
    super(scene, x, y);
    scene.add.existing(this);
    this.info = info;     // { type, value, label }
    this.consumed = false;
    this.cfg = UPGRADE_TYPES[info.type];
    const color = this.cfg?.color ?? COLORS.goldHud;

    // 글로우 헤일로 (큰)
    this.halo = scene.add.graphics();
    this.halo.fillStyle(color, 0.18);
    this.halo.fillCircle(0, 0, PAD_R + 22);
    this.halo.fillStyle(color, 0.10);
    this.halo.fillCircle(0, 0, PAD_R + 40);

    // 패드 디스크
    this.pad = scene.add.graphics();
    this.pad.fillStyle(0x000000, 0.5);
    this.pad.fillCircle(2, 2, PAD_R);
    this.pad.fillStyle(COLORS.parchment, 0.95);
    this.pad.fillCircle(0, 0, PAD_R);
    this.pad.fillStyle(color, 0.32);
    this.pad.fillCircle(0, 0, PAD_R - 4);
    this.pad.lineStyle(3, COLORS.woodDark, 1);
    this.pad.strokeCircle(0, 0, PAD_R);
    this.pad.lineStyle(2, COLORS.goldHud, 0.9);
    this.pad.strokeCircle(0, 0, PAD_R - 3);

    // 글리프 텍스트 (×N / +DMG / +ARROW 등)
    this.glyph = scene.add.text(0, -3, info.label ?? this.cfg?.glyph ?? '+', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#3e2e1e', stroke: '#fff5d8', strokeThickness: 2,
    }).setOrigin(0.5);
    this.glyph.setLetterSpacing?.(1);

    // "STEP ON" 안내 (작게 아래)
    this.hint = scene.add.text(0, PAD_R + 10, 'STEP ON', {
      fontFamily: FONT.mono, fontSize: '9px', fontStyle: '700',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 2,
    }).setOrigin(0.5);
    this.hint.setLetterSpacing?.(2);

    this.add([this.halo, this.pad, this.glyph, this.hint]);

    // 펄스 + halo 알파 호흡
    scene.tweens.add({
      targets: this.halo, alpha: { from: 0.7, to: 1.0 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this, scale: { from: 1, to: 1.06 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    // 글리프도 살짝 펄스
    scene.tweens.add({
      targets: this.glyph, scale: { from: 1, to: 1.12 },
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  // 영웅이 패드 위에 들어왔는가
  contains(heroX, heroY) {
    const dx = heroX - this.x;
    const dy = heroY - this.y;
    return (dx * dx + dy * dy) < (PAD_R * PAD_R);
  }

  consume() {
    if (this.consumed) return null;
    this.consumed = true;
    this.scene.tweens.add({
      targets: this, scale: 1.6, alpha: 0, y: this.y - 14,
      duration: 360, ease: 'Cubic.Out',
      onComplete: () => this.destroy(),
    });
    return this.info;
  }

  get hitRadius() { return PAD_R; }
}
