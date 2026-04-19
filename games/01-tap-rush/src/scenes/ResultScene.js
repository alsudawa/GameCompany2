// ResultScene — 세션 결과, 등급 연출.

import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { GRADE_CUTS, COLORS } from '../config.js';

function gradeFor(score) {
  if (score >= GRADE_CUTS.S) return { grade: 'S', color: COLORS.gold };
  if (score >= GRADE_CUTS.A) return { grade: 'A', color: COLORS.magenta };
  if (score >= GRADE_CUTS.B) return { grade: 'B', color: COLORS.cyan };
  return { grade: 'C', color: COLORS.dim };
}

export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  init(data) {
    this.data_ = data || { score: 0, bestCombo: 0, coins: 0, gems: 0, isBest: false };
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0a14');

    const d = this.data_;
    const { grade, color } = gradeFor(d.score);

    this.add.text(width / 2, height * 0.1, 'RESULT', {
      fontSize: '28px', fontStyle: 'bold', color: '#8a8aa8',
    }).setOrigin(0.5);

    // 등급 배지
    const badge = this.add.text(width / 2, height * 0.3, grade, {
      fontSize: '180px', fontStyle: 'bold',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000', strokeThickness: 8,
    }).setOrigin(0.5).setScale(0.3).setAlpha(0);

    this.tweens.add({
      targets: badge,
      scale: 1, alpha: 1,
      duration: 700, ease: 'Back.Out',
      onComplete: () => {
        if (grade === 'S') {
          Audio.fanfare();
          Juice.flash(this, COLORS.gold, 260);
          this.sparkle(width / 2, height * 0.3);
        } else if (grade === 'A') {
          Audio.rare();
          Juice.flash(this, COLORS.magenta, 200);
        } else {
          Audio.tap();
        }
      },
    });

    // 점수/콤보
    this.add.text(width / 2, height * 0.5, `SCORE  ${d.score.toLocaleString()}`, {
      fontSize: '32px', fontStyle: 'bold', color: '#00e5ff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.56, `BEST COMBO  ${d.bestCombo}`, {
      fontSize: '22px', color: '#ff2bd6',
    }).setOrigin(0.5);

    if (d.isBest) {
      const tag = this.add.text(width / 2, height * 0.62, '🏆 NEW BEST!', {
        fontSize: '22px', fontStyle: 'bold', color: '#ffd24a',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: tag, scale: { from: 0.9, to: 1.1 },
        duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
    }

    // 보상
    this.add.text(width / 2, height * 0.72,
      `획득  💰 ${d.coins}    💎 ${d.gems}`,
      { fontSize: '20px', color: '#e8e8f0' }
    ).setOrigin(0.5);

    // 버튼
    this.makeButton(width / 2 - 90, height * 0.86, 160, 60, '다시', COLORS.cyan, () => {
      Audio.tap();
      this.scene.start('GameScene');
    });
    this.makeButton(width / 2 + 90, height * 0.86, 160, 60, '메뉴', COLORS.magenta, () => {
      Audio.tap();
      this.scene.start('MenuScene');
    });
  }

  sparkle(x, y) {
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 120, () => {
        Juice.burst(this, x + Phaser.Math.Between(-60, 60),
          y + Phaser.Math.Between(-60, 60),
          { count: 12, color: COLORS.gold, speed: 260 });
      });
    }
  }

  makeButton(x, y, w, h, label, color, onClick) {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);

    const text = this.add.text(0, 0, label, {
      fontSize: '22px', fontStyle: 'bold', color: '#0a0a14',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => container.setScale(0.95));
    container.on('pointerup', () => { container.setScale(1); onClick(); });
    container.on('pointerout', () => container.setScale(1));
    return container;
  }
}
