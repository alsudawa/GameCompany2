// ResultScene — Step 6에서 구현. 지금은 placeholder.

import { FONT } from '../config.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }
  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'RESULT — TBD', {
      fontFamily: FONT.display, fontSize: '24px', color: '#f4c542',
    }).setOrigin(0.5);
    this.input.once('pointerdown', () => this.scene.start('MenuScene'));
  }
}
