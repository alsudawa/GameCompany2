// King Shot 진입점.
// Phaser 인스턴스 생성 + 씬 등록.

import { GAME } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#1a2a18', // 따뜻한 어두운 그린 (깊은 숲)
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME.width,
    height: GAME.height,
  },
  input: { activePointers: 4 },
  scene: [BootScene, MenuScene, GameScene],
};

new Phaser.Game(config);
