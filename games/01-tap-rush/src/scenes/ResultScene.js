// ResultScene — 세션 결과, 등급 훈장 + stat 카드.

import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { UI, FONT } from '../../../../shared/ui.js';
import { GRADE_CUTS, COLORS } from '../config.js';

function gradeFor(score) {
  if (score >= GRADE_CUTS.S) return { grade: 'S', color: COLORS.gold,    label: 'PERFECT' };
  if (score >= GRADE_CUTS.A) return { grade: 'A', color: COLORS.magenta, label: 'EXCELLENT' };
  if (score >= GRADE_CUTS.B) return { grade: 'B', color: COLORS.cyan,    label: 'GOOD' };
  return                          { grade: 'C', color: 0x6b708f,         label: 'KEEP TRYING' };
}

export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  init(data) {
    this.data_ = data || { score: 0, bestCombo: 0, coins: 0, gems: 0, isBest: false };
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05050c');

    // 배경 레이어
    UI.drawGrid(this, width, height, { cell: 40, color: 0x0f1530, alpha: 0.45, depth: -25 });
    UI.drawViewportFrame(this, width, height, { color: 0x00e5ff, alpha: 0.35, depth: -8, inset: 4 });
    UI.drawScanlines(this, width, height, { gap: 3, alpha: 0.035, depth: 1200 });

    const d = this.data_;
    const g = gradeFor(d.score);

    // 상단 섹션 헤더
    this.add.text(width / 2, 30, '— SESSION COMPLETE —', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#6b708f',
    }).setOrigin(0.5).setLetterSpacing(4);
    this.add.text(width / 2, 54, 'RESULT', {
      fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
      color: '#e8ecf5',
    }).setOrigin(0.5).setLetterSpacing(6);

    // 등급 배지 — 헥사곤 훈장
    this.drawHexMedal(width / 2, height * 0.28, 110, g);

    // 등급 라벨
    this.add.text(width / 2, height * 0.28 + 140, g.label, {
      fontFamily: FONT.mono, fontSize: '12px', fontStyle: '700',
      color: '#' + g.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5).setLetterSpacing(5);

    // 구분선
    const sep = this.add.graphics();
    sep.lineStyle(1, 0x00e5ff, 0.5);
    sep.strokeLineShape(new Phaser.Geom.Line(width * 0.15, height * 0.56, width * 0.85, height * 0.56));

    // NEW BEST 뱃지
    if (d.isBest) {
      const tag = this.add.text(width / 2, height * 0.52, '▲  NEW BEST', {
        fontFamily: FONT.display, fontSize: '14px', fontStyle: '900',
        color: '#ffd24a',
      }).setOrigin(0.5).setLetterSpacing(5);
      this.tweens.add({
        targets: tag, alpha: { from: 0.5, to: 1 },
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
    }

    // Stat 카드 (2x2)
    const cardY1 = height * 0.63, cardY2 = height * 0.74;
    this.drawStatCard(width * 0.27, cardY1, 'SCORE',      d.score.toLocaleString(), 0x00e5ff);
    this.drawStatCard(width * 0.73, cardY1, 'BEST COMBO', String(d.bestCombo),      0xff2bd6);
    this.drawStatCard(width * 0.27, cardY2, 'COINS  +',   String(d.coins),          0xffd24a);
    this.drawStatCard(width * 0.73, cardY2, 'GEMS   +',   String(d.gems),           0xb388ff);

    // 버튼 — RETRY / MENU
    this.makeButton(width / 2 - 90, height * 0.89, 160, 60, 'RETRY', 0x00e5ff, () => {
      Audio.tap();
      this.scene.start('GameScene');
    });
    this.makeButton(width / 2 + 90, height * 0.89, 160, 60, 'MENU',  0x6b708f, () => {
      Audio.tap();
      this.scene.start('MenuScene');
    });

    // 배지 연출 사운드·파티클
    this.time.delayedCall(400, () => {
      if (g.grade === 'S') {
        Audio.fanfare();
        Juice.flash(this, g.color, 240);
        this.sparkle(width / 2, height * 0.28);
      } else if (g.grade === 'A') {
        Audio.rankup();
        Juice.flash(this, g.color, 200);
      } else if (g.grade === 'B') {
        Audio.milestone();
      } else {
        Audio.tap();
      }
    });
  }

  drawHexMedal(cx, cy, radius, grade) {
    // 바깥 링 (얇은 점선)
    const outline = this.add.graphics().setDepth(10);
    outline.setPosition(cx, cy);
    UI.drawDashedCircle(outline, 0, 0, radius + 18, 0x00e5ff, 0.5, 32, 1.5);

    // 회전 트윈
    this.tweens.add({
      targets: outline, rotation: Math.PI * 2,
      duration: 18000, repeat: -1, ease: 'Linear',
    });

    // 헥사곤 배지 (본체)
    const badge = this.add.graphics().setDepth(11);
    UI.drawHexBadge(badge, cx, cy, radius, grade.color, 1);
    badge.fillStyle(0x000000, 0.2);
    UI.drawHexBadge(badge, cx, cy, radius * 0.75, grade.color, 0);
    UI.drawHexOutline(badge, cx, cy, radius * 0.75, 0xffffff, 0.4, 2);

    // 등급 문자
    const letter = this.add.text(cx, cy - 4, grade.grade, {
      fontFamily: FONT.display, fontSize: '130px', fontStyle: '900',
      color: '#04040c',
    }).setOrigin(0.5).setLetterSpacing(0).setDepth(12);

    // 둥장 애니
    badge.setAlpha(0);
    letter.setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: badge, alpha: 1, duration: 400, ease: 'Cubic.Out' });
    this.tweens.add({ targets: letter, alpha: 1, scale: 1, duration: 600, ease: 'Back.Out', delay: 150 });

    // 좌우 장식 — 라인
    const line = this.add.graphics().setDepth(10);
    line.lineStyle(1, grade.color, 0.6);
    line.strokeLineShape(new Phaser.Geom.Line(cx - radius - 50, cy, cx - radius - 22, cy));
    line.strokeLineShape(new Phaser.Geom.Line(cx + radius + 22, cy, cx + radius + 50, cy));
  }

  drawStatCard(cx, cy, label, value, color) {
    const w = 170, h = 70;
    const hex = '#' + color.toString(16).padStart(6, '0');
    const panel = this.add.graphics();
    panel.fillStyle(0x08091a, 0.9);
    panel.fillRect(cx - w / 2, cy - h / 2, w, h);
    panel.lineStyle(1, color, 0.4);
    panel.strokeRect(cx - w / 2, cy - h / 2, w, h);
    UI.drawCornerBrackets(this, cx - w / 2, cy - h / 2, w, h, {
      size: 8, color, thickness: 2,
    });

    this.add.text(cx - w / 2 + 12, cy - 20, label, {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#6b708f',
    }).setLetterSpacing(3);
    this.add.text(cx + w / 2 - 12, cy + 10, value, {
      fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
      color: hex,
    }).setOrigin(1, 0.5).setLetterSpacing(1);
  }

  makeButton(x, y, w, h, label, color, onClick) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0e20, 0.9);
    bg.fillRect(-w / 2, -h / 2, w, h);
    bg.lineStyle(1, color, 0.9);
    bg.strokeRect(-w / 2, -h / 2, w, h);

    const text = this.add.text(0, 0, label, {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: hex,
    }).setOrigin(0.5).setLetterSpacing(4);

    const container = this.add.container(x, y, [bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => container.setScale(0.96));
    container.on('pointerup', () => { container.setScale(1); onClick(); });
    container.on('pointerout', () => container.setScale(1));

    // 코너 브래킷
    const cornerG = this.add.graphics();
    cornerG.lineStyle(2, color, 1);
    const c = 8;
    const hw = w / 2, hh = h / 2;
    cornerG.beginPath();
    cornerG.moveTo(-hw + c, -hh); cornerG.lineTo(-hw, -hh); cornerG.lineTo(-hw, -hh + c);
    cornerG.moveTo( hw - c, -hh); cornerG.lineTo( hw, -hh); cornerG.lineTo( hw, -hh + c);
    cornerG.moveTo(-hw + c,  hh); cornerG.lineTo(-hw,  hh); cornerG.lineTo(-hw,  hh - c);
    cornerG.moveTo( hw - c,  hh); cornerG.lineTo( hw,  hh); cornerG.lineTo( hw,  hh - c);
    cornerG.strokePath();
    container.add(cornerG);

    return container;
  }

  sparkle(x, y) {
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 110, () => {
        Juice.burst(this, x + Phaser.Math.Between(-70, 70),
          y + Phaser.Math.Between(-70, 70),
          { count: 14, color: COLORS.gold, speed: 280 });
      });
    }
  }
}
