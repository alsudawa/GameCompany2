// UpgradeScene — 웨이브 사이에 띄우는 업그레이드 픽 화면.
// GameScene을 일시정지 + 위에 launch. 카드 3장 중 1장 선택 → 즉시 효과 부여.

import { COLORS, FONT, UPGRADES } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';

export class UpgradeScene extends Phaser.Scene {
  constructor() { super('UpgradeScene'); }

  init(data) {
    this.king = data?.king;
    this.weapon = data?.weapon;
    this.onPick = data?.onPick;
    this.waveLabel = data?.waveLabel ?? 'WAVE CLEAR';
  }

  create() {
    const { width, height } = this.scale;

    // 어두운 오버레이
    this.add.rectangle(0, 0, width, height, 0x000000, 0.55)
      .setOrigin(0).setDepth(0);

    // 상단 배너
    const banner = this.add.text(width / 2, 110, this.waveLabel, {
      fontFamily: FONT.display, fontSize: '40px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);
    banner.setLetterSpacing?.(4);
    this.tweens.add({
      targets: banner,
      scale: { from: 1.4, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 360, ease: 'Back.Out',
    });

    const sub = this.add.text(width / 2, 158, '왕좌의 축복을 선택하라', {
      fontFamily: FONT.body, fontSize: '14px', fontStyle: '600',
      color: '#d9c897',
    }).setOrigin(0.5).setDepth(10);
    sub.setLetterSpacing?.(2);

    // 3개 무작위 업그레이드 (중복 없이)
    const pool = [...UPGRADES];
    const picks = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }

    // 카드 3장 — 화면 중앙 가로 정렬
    const cardW = 130;
    const cardH = 200;
    const gap = 14;
    const total = cardW * 3 + gap * 2;
    const startX = (width - total) / 2;
    const cardY = height / 2 - 30;

    picks.forEach((up, i) => {
      const cx = startX + i * (cardW + gap) + cardW / 2;
      const card = this.makeCard(cx, cardY, cardW, cardH, up);
      // 등장 트윈 (지연차 등장)
      card.setAlpha(0);
      card.y = cardY + 30;
      this.tweens.add({
        targets: card,
        alpha: 1, y: cardY,
        duration: 380,
        delay: 200 + i * 90,
        ease: 'Back.Out',
      });
    });

    // 하단 안내
    const hint = this.add.text(width / 2, height - 80, '카드를 탭해 선택', {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#8a8470',
    }).setOrigin(0.5).setDepth(10);
    hint.setLetterSpacing?.(3);
    this.tweens.add({
      targets: hint, alpha: { from: 1, to: 0.3 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  makeCard(cx, cy, w, h, upgrade) {
    const c = this.add.container(cx, cy).setDepth(20);
    const colorHex = '#' + upgrade.color.toString(16).padStart(6, '0');

    // 그림자
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, 8);
    c.add(shadow);

    // 양피지 채움
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.parchment, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    // 두루마리 끝 (위/아래 어두운 띠)
    bg.fillStyle(COLORS.parchmentDim, 1);
    bg.fillRect(-w / 2, -h / 2, w, 8);
    bg.fillRect(-w / 2, h / 2 - 8, w, 8);
    // 우드 외곽
    bg.lineStyle(3, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(1, COLORS.gold, 0.85);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 6);
    // 모서리 골드 못
    bg.fillStyle(COLORS.gold, 1);
    [[-w / 2 + 6, -h / 2 + 6], [w / 2 - 6, -h / 2 + 6],
     [-w / 2 + 6,  h / 2 - 6], [w / 2 - 6,  h / 2 - 6]]
      .forEach(([px, py]) => bg.fillCircle(px, py, 2));
    c.add(bg);

    // 골드 코인 + 글리프 (상단)
    const coinG = this.add.graphics();
    coinG.fillStyle(COLORS.goldDeep, 1);
    coinG.fillCircle(0, -h / 2 + 38, 22);
    coinG.fillStyle(COLORS.gold, 1);
    coinG.fillCircle(0, -h / 2 + 38, 19);
    coinG.lineStyle(1.5, COLORS.goldDeep, 1);
    coinG.strokeCircle(0, -h / 2 + 38, 19);
    c.add(coinG);

    const glyph = this.add.text(0, -h / 2 + 38, upgrade.glyph, {
      fontFamily: FONT.display, fontSize: '28px', fontStyle: '900',
      color: '#3e2e1e',
    }).setOrigin(0.5);
    c.add(glyph);

    // 타이틀
    const title = this.add.text(0, -h / 2 + 78, upgrade.name, {
      fontFamily: FONT.display, fontSize: '15px', fontStyle: '700',
      color: '#3e2e1e', align: 'center',
      wordWrap: { width: w - 16 },
    }).setOrigin(0.5);
    title.setLetterSpacing?.(1);
    c.add(title);

    // 디바이더
    const div = this.add.graphics();
    div.lineStyle(1, COLORS.goldDeep, 0.6);
    div.beginPath();
    div.moveTo(-w / 2 + 18, -h / 2 + 110);
    div.lineTo( w / 2 - 18, -h / 2 + 110);
    div.strokePath();
    div.fillStyle(COLORS.goldDeep, 0.9);
    div.fillTriangle(-4, -h / 2 + 110, 4, -h / 2 + 110, 0, -h / 2 + 105);
    div.fillTriangle(-4, -h / 2 + 110, 4, -h / 2 + 110, 0, -h / 2 + 115);
    c.add(div);

    // desc
    const desc = this.add.text(0, -h / 2 + 140, upgrade.desc, {
      fontFamily: FONT.body, fontSize: '13px', fontStyle: '500',
      color: '#5a3e2e', align: 'center',
      wordWrap: { width: w - 20 },
    }).setOrigin(0.5);
    c.add(desc);

    // 하단 액센트 컬러 띠
    const accent = this.add.graphics();
    accent.fillStyle(upgrade.color, 1);
    accent.fillRect(-w / 2 + 12, h / 2 - 20, w - 24, 4);
    c.add(accent);

    // 글로우 외곽 (호버용)
    const glow = this.add.graphics();
    glow.lineStyle(3, upgrade.color, 0.85);
    glow.strokeRoundedRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 10);
    glow.setAlpha(0);
    c.add(glow);

    // 인터랙션
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => {
      this.tweens.add({ targets: c, y: cy - 8, duration: 160, ease: 'Cubic.Out' });
      this.tweens.add({ targets: glow, alpha: 1, duration: 160 });
    });
    c.on('pointerout', () => {
      this.tweens.add({ targets: c, y: cy, duration: 160, ease: 'Cubic.Out' });
      this.tweens.add({ targets: glow, alpha: 0, duration: 160 });
    });
    c.on('pointerdown', () => this.pickCard(c, upgrade));

    return c;
  }

  pickCard(card, upgrade) {
    if (this._picked) return;
    this._picked = true;
    Audio.purchase();

    // 선택 카드 살짝 떠오르며 회전 사라짐
    this.tweens.add({
      targets: card,
      y: card.y - 40,
      angle: 12,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.Out',
    });

    // 풀 플래시 + 골드 링
    Juice.flash(this, upgrade.color, 200);
    Juice.ring(this, this.scale.width / 2, this.scale.height / 2,
      { color: upgrade.color, radius: 240, duration: 520, count: 2 });

    // 효과 부여 + 반환
    upgrade.apply(this.weapon, this.king);

    this.time.delayedCall(420, () => {
      this.scene.stop();
      if (this.onPick) this.onPick(upgrade);
    });
  }
}
