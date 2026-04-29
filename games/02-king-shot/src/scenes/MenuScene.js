// MenuScene — 임시 타이틀. Step 6에서 5스테이지 카드 캐러셀로 확장.

import { COLORS, FONT, KEY, TILE } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Storage } from '../../../../shared/storage.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    Audio.unlockOnFirstInput(this);

    this.cameras.main.setBackgroundColor('#3a7d44');
    this.cameras.main.fadeIn(280, 0, 0, 0);

    // ── 배경: 잔디 타일로 가득 채움 ──
    this.drawGrassBackground(width, height);

    // 어두운 그라디언트 비네트 (위)
    const vg = this.add.graphics().setDepth(1);
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.5, 0.5, 0, 0);
    vg.fillRect(0, 0, width, 320);

    // 타이틀
    const titleY = 130;
    const titleShadow = this.add.text(width / 2 + 3, titleY + 3, 'KING SHOT', {
      fontFamily: FONT.display, fontSize: '52px', fontStyle: '900',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0.6).setDepth(2);
    titleShadow.setLetterSpacing?.(4);

    const title = this.add.text(width / 2, titleY, 'KING SHOT', {
      fontFamily: FONT.display, fontSize: '52px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);
    title.setLetterSpacing?.(4);
    this.tweens.add({
      targets: title, scale: { from: 1, to: 1.04 },
      duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    // 부제
    const sub = this.add.text(width / 2, titleY + 50, 'TOWER DEFENSE', {
      fontFamily: FONT.mono, fontSize: '14px', fontStyle: '700',
      color: '#f4e8c8',
    }).setOrigin(0.5).setDepth(3);
    sub.setLetterSpacing?.(6);

    // 미리보기 — 타일 몇 개 자랑
    this.drawPreviewStrip(width, 260);

    // START 버튼
    this.makeStartButton(width / 2, height - 200);

    // 베스트 표시
    const best = (Storage.load().bestScores || {})['king-shot'] || 0;
    this.add.text(width / 2, height - 60, `BEST · ${best.toLocaleString()}`, {
      fontFamily: FONT.mono, fontSize: '12px', fontStyle: '700',
      color: '#f4e8c8',
    }).setOrigin(0.5).setDepth(3).setLetterSpacing?.(3);

    Audio.playBgm('menu', { fadeIn: 0.6, volume: 0.55 });
  }

  drawGrassBackground(width, height) {
    const ts = 32;
    for (let y = 0; y < height; y += ts) {
      for (let x = 0; x < width; x += ts) {
        const tile = (Math.random() < 0.85) ? TILE.GRASS : TILE.GRASS_ALT;
        this.add.image(x, y, KEY.tilesheet, tile).setOrigin(0).setScale(0.5).setDepth(0);
      }
    }
  }

  drawPreviewStrip(width, y) {
    const cx = width / 2;
    // 타워 베이스 + 4타워 종류 미리보기
    const items = [
      { base: TILE.TOWER_BASE, top: TILE.TOWER_ARCHER },
      { base: TILE.TOWER_BASE, top: TILE.TOWER_CANNON },
      { base: TILE.TOWER_BASE, top: TILE.TOWER_MORTAR },
      { base: TILE.TOWER_BASE, top: TILE.TOWER_FROST },
    ];
    items.forEach((it, i) => {
      const x = cx + (i - (items.length - 1) / 2) * 56;
      this.add.image(x, y, KEY.tilesheet, it.base).setScale(0.5).setDepth(2);
      this.add.image(x, y, KEY.tilesheet, it.top).setScale(0.5).setDepth(3);
    });
  }

  makeStartButton(cx, cy) {
    const w = 220, h = 56;
    const c = this.add.container(cx, cy).setDepth(4);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w, h, 8);
    bg.fillStyle(COLORS.red, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.fillStyle(COLORS.redDk, 1);
    bg.fillRoundedRect(-w / 2, h / 2 - 6, w, 6, 8);
    bg.lineStyle(3, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(1, COLORS.goldHud, 0.9);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 6);
    bg.fillStyle(COLORS.goldHud, 1);
    [[-w / 2 + 8, -h / 2 + 8], [w / 2 - 8, -h / 2 + 8],
     [-w / 2 + 8,  h / 2 - 8], [w / 2 - 8,  h / 2 - 8]]
      .forEach(([px, py]) => bg.fillCircle(px, py, 2.5));
    c.add(bg);
    const t = this.add.text(0, 0, '⚔ DEFEND', {
      fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 4,
    }).setOrigin(0.5);
    t.setLetterSpacing?.(4);
    c.add(t);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.06, duration: 140 }));
    c.on('pointerout',  () => this.tweens.add({ targets: c, scale: 1, duration: 140 }));
    c.on('pointerdown', () => {
      Audio.purchase();
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { stageId: 'gate' });
      });
    });
    this.tweens.add({
      targets: c, scale: { from: 1, to: 1.04 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }
}
