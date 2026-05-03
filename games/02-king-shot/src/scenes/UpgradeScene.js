// FORGE — 영구 업그레이드 화면. 코인을 소비해 트랙 레벨업.

import { COLORS, FONT } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Storage } from '../../../../shared/storage.js';
import { UPGRADES } from '../meta/upgrades.js';

export class UpgradeScene extends Phaser.Scene {
  constructor() { super('UpgradeScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a0d08');
    this.cameras.main.fadeIn(220, 0, 0, 0);

    // 배경 — 어두운 대장간 느낌 (vignette + 모서리 불꽃 색)
    const vg = this.add.graphics();
    vg.fillStyle(0x2a1810, 1);
    vg.fillRect(0, 0, width, height);
    vg.fillStyle(0x4a2a14, 0.5);
    vg.fillCircle(width / 2, height / 2, width * 0.7);
    vg.fillStyle(0x000000, 0.45);
    vg.fillRect(0, 0, width, 60);
    vg.fillRect(0, height - 60, width, 60);

    // 타이틀
    const title = this.add.text(width / 2, 50, 'THE FORGE', {
      fontFamily: FONT.display, fontSize: '34px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5);
    title.setLetterSpacing?.(5);
    this.add.text(width / 2, 84, 'PERMANENT ROYAL UPGRADES', {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#f4e8c8',
    }).setOrigin(0.5).setLetterSpacing?.(4);

    // 코인 보유량
    this.coinsText = this.add.text(width - 16, 24, '', {
      fontFamily: FONT.display, fontSize: '18px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(1, 0.5);
    this.refreshCoins();

    // 트랙 카드 — 4개 세로 정렬
    this.trackContainers = {};
    UPGRADES.forEach((u, i) => {
      this.makeTrack(width / 2, 140 + i * 110, width - 36, 96, u);
    });

    // 메뉴로 돌아가기
    this.makeBack(width / 2, height - 36);
  }

  refreshCoins() {
    const p = Storage.load();
    this.coinsText.setText(`⛁ ${p.coins ?? 0}`);
  }

  makeTrack(cx, cy, w, h, upgrade) {
    const c = this.add.container(cx, cy);
    const sh = this.add.graphics();
    sh.fillStyle(0x000000, 0.55);
    sh.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, 12);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.parchment, 0.96);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.fillStyle(COLORS.parchmentDim, 1);
    bg.fillRect(-w / 2, -h / 2, w, 8);
    bg.fillRect(-w / 2, h / 2 - 8, w, 8);
    bg.lineStyle(2.5, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(1, upgrade.color, 0.9);
    bg.strokeRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 10);
    c.add([sh, bg]);

    // 좌측 아이콘
    const icon = this.add.text(-w / 2 + 32, 0, upgrade.icon, {
      fontFamily: FONT.display, fontSize: '36px', fontStyle: '900',
      color: Phaser.Display.Color.IntegerToColor(upgrade.color).rgba,
      stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5);
    c.add(icon);

    // 이름 + 설명
    const name = this.add.text(-w / 2 + 64, -h / 2 + 18, upgrade.name, {
      fontFamily: FONT.display, fontSize: '14px', fontStyle: '900',
      color: '#3e2e1e',
    }).setOrigin(0, 0).setLetterSpacing?.(2);
    const desc = this.add.text(-w / 2 + 64, -h / 2 + 38, upgrade.desc, {
      fontFamily: FONT.body, fontSize: '11px', fontStyle: '600',
      color: '#5a3e2e',
    }).setOrigin(0, 0);
    c.add([name, desc]);

    // 레벨 핍 (점 5개)
    const pipsY = -h / 2 + 70;
    const pipsContainer = this.add.container(-w / 2 + 64, pipsY);
    c.add(pipsContainer);

    // 우측 BUY 버튼 + 비용
    const btnW = 96, btnH = 50, btnX = w / 2 - btnW / 2 - 8;
    const btn = this.add.container(btnX, 0);
    const btnBg = this.add.graphics();
    const costText = this.add.text(0, 6, '', {
      fontFamily: FONT.display, fontSize: '14px', fontStyle: '900',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 2,
    }).setOrigin(0.5);
    const buyLabel = this.add.text(0, -10, 'BUY', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#fff5d8',
    }).setOrigin(0.5).setLetterSpacing?.(3);
    btn.add([btnBg, buyLabel, costText]);
    btn.setSize(btnW, btnH);
    btn.setInteractive({ useHandCursor: true });
    c.add(btn);

    const refresh = () => {
      const profile = Storage.load();
      const lv = (profile.upgrades || {})[upgrade.id] ?? 0;
      const maxed = lv >= upgrade.maxLevel;
      const cost = maxed ? 0 : upgrade.cost(lv);
      const canBuy = !maxed && (profile.coins ?? 0) >= cost;
      // pips
      pipsContainer.removeAll(true);
      for (let k = 0; k < upgrade.maxLevel; k++) {
        const dot = this.add.graphics();
        dot.x = k * 14;
        const filled = k < lv;
        dot.fillStyle(filled ? upgrade.color : 0xa89878, 1);
        dot.fillRoundedRect(-4, -4, 8, 8, 1.5);
        dot.lineStyle(1, 0x3e2e1e, 0.85);
        dot.strokeRoundedRect(-4, -4, 8, 8, 1.5);
        pipsContainer.add(dot);
      }
      // button look
      btnBg.clear();
      btnBg.fillStyle(0x000000, 0.45);
      btnBg.fillRoundedRect(-btnW / 2 + 2, -btnH / 2 + 2, btnW, btnH, 8);
      const fill = maxed ? 0x6a5a3a : (canBuy ? 0xc8302d : 0x3a2820);
      btnBg.fillStyle(fill, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
      btnBg.lineStyle(2, COLORS.goldHud, canBuy || maxed ? 1 : 0.45);
      btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
      if (maxed) {
        buyLabel.setText('MAXED');
        costText.setText('');
        buyLabel.setAlpha(0.85);
      } else {
        buyLabel.setAlpha(canBuy ? 1 : 0.55);
        costText.setAlpha(canBuy ? 1 : 0.55);
        buyLabel.setText('BUY');
        costText.setText(`⛁ ${cost}`);
      }
    };
    refresh();
    btn.on('pointerdown', () => {
      const profile = Storage.load();
      const lv = (profile.upgrades || {})[upgrade.id] ?? 0;
      if (lv >= upgrade.maxLevel) return;
      const cost = upgrade.cost(lv);
      if (!Storage.spendCoins(cost)) {
        // 부족 — 살짝 흔들림
        this.tweens.add({ targets: btn, x: btnX - 4, duration: 60, yoyo: true, repeat: 2,
          onComplete: () => { btn.x = btnX; } });
        Audio.miss?.();
        return;
      }
      Storage.setUpgradeLevel(upgrade.id, lv + 1);
      Audio.purchase?.();
      this.refreshCoins();
      refresh();
      // 강조 플래시
      this.tweens.add({
        targets: c, scaleX: 1.04, scaleY: 1.04,
        duration: 130, yoyo: true,
      });
    });
  }

  makeBack(cx, cy) {
    const w = 160, h = 44;
    const c = this.add.container(cx, cy);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w, h, 8);
    bg.fillStyle(0x4a8bc2, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(2, COLORS.goldHud, 0.9);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    const t = this.add.text(0, 0, '◂ MENU', {
      fontFamily: FONT.display, fontSize: '17px', fontStyle: '900',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5).setLetterSpacing?.(3);
    c.add([bg, t]);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      Audio.tap?.();
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }
}
