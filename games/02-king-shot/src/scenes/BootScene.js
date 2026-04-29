// BootScene — 타일시트 prebold + 프로필 초기화.

import { GAME, KEY } from '../config.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { IAP } from '../../../../shared/iap/iap.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Kenney TD Top-Down — 23 cols × 13 rows × 64px
    this.load.spritesheet(KEY.tilesheet, 'assets/towerDefense_tilesheet.png', {
      frameWidth: GAME.spriteTile,
      frameHeight: GAME.spriteTile,
      margin: 0,
      spacing: 0,
    });

    // 로딩 인디케이터 (단순)
    const { width, height } = this.scale;
    const txt = this.add.text(width / 2, height / 2, 'LOADING…', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '20px',
      fontStyle: '700',
      color: '#f4c542',
    }).setOrigin(0.5);
    txt.setLetterSpacing?.(4);
  }

  async create() {
    Analytics.enableDebug(true);
    Analytics.track('boot', { game: 'king-shot-td' });

    // 프로필
    const profile = Storage.load();
    Storage.save(profile);

    try {
      await IAP.ensureReady();
    } catch (e) { console.warn('IAP init', e); }

    this.scene.start('MenuScene');
  }
}
