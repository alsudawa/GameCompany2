// GameScene — Step 1: 타일시트 디버그 그리드(299 타일 + 인덱스 라벨).
// Step 2부터 실제 디펜스 맵 + 경로 + 타워 배치로 교체.

import { COLORS, FONT, GAME, KEY } from '../config.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.stageId = data?.stageId ?? 'gate';
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#15201a');
    this.cameras.main.fadeIn(280, 0, 0, 0);

    // 헤더
    this.add.text(width / 2, 20, 'TILE INDEX DEBUG', {
      fontFamily: FONT.display, fontSize: '18px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5, 0).setLetterSpacing?.(3);

    this.add.text(width / 2, 44, '(Step 2에서 실제 디펜스 맵으로 교체)', {
      fontFamily: FONT.body, fontSize: '12px', color: '#d9c897',
    }).setOrigin(0.5, 0);

    // 타일 그리드 — 23 cols × 13 rows. 각 타일 32px(0.5 스케일) + 라벨
    const cols = 23;
    const cell = 20;          // 타일을 작게
    const labelH = 8;
    const cellTotal = cell + labelH;
    const gridW = cols * cellTotal;
    const startX = (width - gridW) / 2 + cellTotal / 2;
    const startY = 80;

    for (let i = 0; i < 299; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellTotal;
      const y = startY + row * cellTotal;
      // 백 배경
      this.add.rectangle(x, y, cellTotal - 2, cellTotal - 2, 0x222222, 0.4).setDepth(0);
      // 타일 (스케일 0.31 = 20px)
      this.add.image(x, y - 2, KEY.tilesheet, i).setScale(cell / GAME.spriteTile).setDepth(1);
      // 인덱스 라벨
      this.add.text(x, y + 8, String(i), {
        fontFamily: FONT.mono, fontSize: '7px',
        color: '#f4c542',
      }).setOrigin(0.5).setDepth(2);
    }

    // 하단 BACK
    const back = this.add.text(width / 2, height - 30, '◂ TAP TO BACK', {
      fontFamily: FONT.mono, fontSize: '14px', fontStyle: '700',
      color: '#f4c542',
    }).setOrigin(0.5).setLetterSpacing?.(3).setDepth(10);
    back.setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }
}
