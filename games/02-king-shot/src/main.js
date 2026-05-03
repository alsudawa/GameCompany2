// King Shot Tower Defense — Phaser 진입점.

import { GAME } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { UpgradeScene } from './scenes/UpgradeScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#3a7d44',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME.width,
    height: GAME.height,
    resolution: window.devicePixelRatio || 1,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true,
  },
  input: { activePointers: 4 },
  scene: [BootScene, MenuScene, GameScene, ResultScene, UpgradeScene],
};

window.game = new Phaser.Game(config);
