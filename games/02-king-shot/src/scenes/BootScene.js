// BootScene — 타일시트 prebold + 프로필 초기화.

import { GAME, KEY } from '../config.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { IAP } from '../../../../shared/iap/iap.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Kenney TD Top-Down — 23 cols × 13 rows × 64px (잔디/장식/투사체)
    this.load.spritesheet(KEY.tilesheet, 'assets/towerDefense_tilesheet.png', {
      frameWidth: GAME.spriteTile,
      frameHeight: GAME.spriteTile,
      margin: 0,
      spacing: 0,
    });

    // Gemini-generated walk strips (4 frames @ 64×64)
    this.load.spritesheet('king_walk',    'assets/sheets/king_walk.png',    { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('soldier_walk', 'assets/sheets/soldier_walk.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('menu_bg', 'assets/sheets/menu_bg.png');

    // Kenney Top-Down Shooter — 캐릭터 스프라이트
    this.load.image('zombie',   'assets/chars/zombie.png');
    this.load.image('zombie2',  'assets/chars/zombie_stand.png');
    this.load.image('robot',    'assets/chars/robot.png');
    this.load.image('survivor', 'assets/chars/survivor.png');
    this.load.image('elite',    'assets/chars/elite.png');

    // 로딩 인디케이터
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

    if (!this.anims.exists('king_walk')) {
      this.anims.create({
        key: 'king_walk',
        frames: this.anims.generateFrameNumbers('king_walk', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists('soldier_walk')) {
      this.anims.create({
        key: 'soldier_walk',
        frames: this.anims.generateFrameNumbers('soldier_walk', { start: 0, end: 3 }),
        frameRate: 7,
        repeat: -1,
      });
    }

    // 프로필
    const profile = Storage.load();
    Storage.save(profile);

    try {
      await IAP.ensureReady();
    } catch (e) { console.warn('IAP init', e); }

    // 폰트 로딩 대기 — Cinzel/Rajdhani가 늦게 로드되어 첫 텍스트가 폴백 폰트로 그려지는 문제 방지
    try {
      if (document.fonts?.load) {
        await Promise.all([
          document.fonts.load('900 24px "Cinzel"'),
          document.fonts.load('700 24px "Cinzel"'),
          document.fonts.load('700 16px "Rajdhani"'),
          document.fonts.load('500 14px "Rajdhani"'),
          document.fonts.load('700 14px "JetBrains Mono"'),
        ]);
        await document.fonts.ready;
      }
    } catch (e) { /* 폰트 실패해도 게임 진행 */ }

    this.scene.start('MenuScene');
  }
}
