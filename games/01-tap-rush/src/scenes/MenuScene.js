// MenuScene — 타이틀, START, SHOP, 내 기록/재화 표시.

import { Storage } from '../../../../shared/storage.js';
import { Audio } from '../../../../shared/audio.js';
import { COLORS } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0a14');

    Audio.unlockOnFirstInput(this);

    // 배경 장식: 희미한 그리드/점
    this.drawBgDots();

    // 타이틀
    const title = this.add.text(width / 2, height * 0.18, 'TAP RUSH', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#00e5ff',
      stroke: '#ff2bd6',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: title,
      scale: { from: 0.95, to: 1.03 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.add.text(width / 2, height * 0.25, '1분 타임어택 · 콤보 폭발', {
      fontSize: '16px',
      color: '#8a8aa8',
    }).setOrigin(0.5);

    // 내 기록/재화
    const profile = Storage.load();
    const best = profile.bestScores['tap-rush'] || 0;
    this.add.text(width / 2, height * 0.36, `최고 점수  ${best.toLocaleString()}`, {
      fontSize: '20px',
      color: '#ffd24a',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.41, `💰 ${profile.coins}    💎 ${profile.gems}`, {
      fontSize: '18px',
      color: '#e8e8f0',
    }).setOrigin(0.5);

    // START 버튼
    this.makeButton(width / 2, height * 0.56, 260, 72, 'START', COLORS.cyan, () => {
      Audio.tap();
      this.scene.start('GameScene');
    });

    // SHOP 버튼
    this.makeButton(width / 2, height * 0.68, 260, 60, 'SHOP 💎', COLORS.magenta, () => {
      Audio.tap();
      this.scene.start('ShopScene');
    });

    // 스킨 표시
    const skinLabel = profile.equippedSkin === 'default' ? '기본' :
                      profile.equippedSkin === 'neon' ? '네온' :
                      profile.equippedSkin === 'galaxy' ? '갤럭시' : profile.equippedSkin;
    this.add.text(width / 2, height * 0.78, `장착 스킨: ${skinLabel}`, {
      fontSize: '14px',
      color: '#8a8aa8',
    }).setOrigin(0.5);

    // 푸터
    this.add.text(width / 2, height - 20,
      '🎯 기획 · 🎨 디자인 · 💻 개발 · 🧪 테스트',
      { fontSize: '11px', color: '#444466' }
    ).setOrigin(0.5);
  }

  drawBgDots() {
    const g = this.add.graphics();
    g.fillStyle(0x1a1a35, 0.6);
    const { width, height } = this.scale;
    for (let x = 20; x < width; x += 40) {
      for (let y = 20; y < height; y += 40) {
        g.fillCircle(x, y, 1);
      }
    }
  }

  makeButton(x, y, w, h, label, color, onClick) {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    bg.lineStyle(2, 0xffffff, 0.2);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);

    const text = this.add.text(0, 0, label, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#0a0a14',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => container.setScale(0.95));
    container.on('pointerup', () => {
      container.setScale(1);
      onClick();
    });
    container.on('pointerout', () => container.setScale(1));

    return container;
  }
}
