// ResultScene — 세션 종료 후 결과 화면.
// 방패 모양 메달 + 등급(S/A/B/C) + 통계(킬·점수·베스트·젬) + RETRY/MENU.

import { COLORS, FONT, GRADE_CUTS } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  init(data) {
    this.stats = data ?? {};
  }

  create() {
    const { width, height } = this.scale;
    const s = this.stats;

    // 어둑한 배경
    this.cameras.main.setBackgroundColor('#0a1410');
    this.cameras.main.fadeIn(380, 0, 0, 0);

    // 잔잔한 별 입자
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const star = this.add.circle(x, y, 0.8 + Math.random() * 1.2,
        COLORS.parchment, 0.5).setDepth(0);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.9 },
        duration: 1200 + Math.random() * 1800,
        yoyo: true, repeat: -1,
        delay: Math.random() * 1200,
      });
    }

    // 상단 라벨
    const top = this.add.text(width / 2, 80, s.victory ? 'VICTORY' : 'BATTLE’S END', {
      fontFamily: FONT.display, fontSize: '32px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);
    top.setLetterSpacing?.(4);
    this.tweens.add({
      targets: top, scale: { from: 1.5, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 360, ease: 'Back.Out',
    });

    // 등급 계산
    const grade = this.computeGrade(s.score ?? 0);
    const gradeColor = {
      S: 0xf4c542, A: 0xc0c8d0, B: 0xc89438, C: 0x8a6a4a,
    }[grade] ?? 0x8a6a4a;

    // 방패 메달
    this.drawShieldMedal(width / 2, 240, 78, gradeColor, grade);

    if (s.isBest) {
      const bestTag = this.add.text(width / 2, 340, '★ NEW BEST ★', {
        fontFamily: FONT.display, fontSize: '16px', fontStyle: '900',
        color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(10);
      bestTag.setLetterSpacing?.(3);
      this.tweens.add({
        targets: bestTag, scale: { from: 1, to: 1.15 },
        duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
    }

    // 통계 패널
    this.drawStatsPanel(width / 2, 440, 280, 140, s);

    // 버튼
    this.makeButton(width / 2 - 70, 640, 110, 46, 'RETRY', COLORS.capeRed, () => {
      Audio.purchase();
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { stageId: s.stageId });
      });
    });
    this.makeButton(width / 2 + 70, 640, 110, 46, 'MENU', COLORS.knightBlue, () => {
      Audio.purchase();
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    // 효과음
    if (s.victory) {
      Audio.fanfare();
    } else {
      Audio.rankup();
    }
  }

  computeGrade(score) {
    if (score >= GRADE_CUTS.S) return 'S';
    if (score >= GRADE_CUTS.A) return 'A';
    if (score >= GRADE_CUTS.B) return 'B';
    return 'C';
  }

  drawShieldMedal(cx, cy, r, color, grade) {
    const c = this.add.container(cx, cy).setDepth(10);

    // 방패 폴리곤 — 위는 호, 아래는 V
    const points = [];
    points.push({ x: -r, y: -r * 0.5 });
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (i / 10) * Math.PI;
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * -0.5 - r * 0.5 });
    }
    points.push({ x:  r, y: -r * 0.5 });
    points.push({ x:  r * 0.85, y:  r * 0.5 });
    points.push({ x:  0,        y:  r });
    points.push({ x: -r * 0.85, y:  r * 0.5 });

    // 그림자
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillPoints(points.map(p => ({ x: p.x + 4, y: p.y + 4 })), true);
    c.add(shadow);

    // 방패 본체 — 짙은 외곽 + 컬러 채움
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a04, 1);
    bg.fillPoints(points.map(p => ({ x: p.x * 1.06, y: p.y * 1.06 })), true);
    bg.fillStyle(color, 1);
    bg.fillPoints(points, true);
    // 골드 외곽선
    bg.lineStyle(3, COLORS.gold, 1);
    bg.strokePoints(points, true, true);
    bg.lineStyle(1, 0x000000, 0.5);
    bg.strokePoints(points.map(p => ({ x: p.x * 0.92, y: p.y * 0.92 })), true, true);
    c.add(bg);

    // 등급 글자
    const g = this.add.text(0, 4, grade, {
      fontFamily: FONT.display,
      fontSize: '76px', fontStyle: '900',
      color: '#3e2e1e', stroke: '#f4c542', strokeThickness: 4,
    }).setOrigin(0.5);
    c.add(g);

    // 등장 트윈
    c.setScale(0.4).setAlpha(0);
    this.tweens.add({
      targets: c, scale: 1, alpha: 1,
      duration: 480, delay: 220, ease: 'Back.Out',
      onComplete: () => {
        Juice.ring(this, cx, cy, { color, radius: 180, duration: 540, count: 2 });
        Juice.flash(this, color, 220);
      },
    });
    // 미세 펄스
    this.tweens.add({
      targets: c, scale: 1.03,
      duration: 1400, yoyo: true, repeat: -1,
      delay: 1000, ease: 'Sine.InOut',
    });
  }

  drawStatsPanel(cx, cy, w, h, s) {
    const x = cx - w / 2;
    const y = cy - h / 2;
    const panel = this.add.graphics().setDepth(5);
    panel.fillStyle(0x000000, 0.5);
    panel.fillRect(x + 3, y + 3, w, h);
    panel.fillStyle(COLORS.parchment, 0.95);
    panel.fillRect(x, y, w, h);
    panel.lineStyle(3, COLORS.woodDark, 1);
    panel.strokeRect(x, y, w, h);
    panel.lineStyle(1, COLORS.gold, 0.8);
    panel.strokeRect(x + 1, y + 1, w - 2, h - 2);
    // 코너 못
    panel.fillStyle(COLORS.gold, 1);
    [[x + 6, y + 6], [x + w - 6, y + 6], [x + 6, y + h - 6], [x + w - 6, y + h - 6]]
      .forEach(([px, py]) => panel.fillCircle(px, py, 2.5));

    const rows = [
      ['SCORE',     (s.score ?? 0).toLocaleString()],
      ['BEST',      (s.best ?? 0).toLocaleString()],
      ['KILLS',     String(s.kills ?? 0)],
      ['BEST COMBO', '×' + String(s.bestCombo ?? 0)],
      ['GEMS',      '+' + String(s.gemsEarned ?? 0)],
    ];
    rows.forEach((row, i) => {
      const ry = y + 14 + i * 24;
      this.add.text(x + 16, ry, row[0], {
        fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
        color: '#5a3e2e',
      }).setDepth(6).setLetterSpacing?.(3);
      this.add.text(x + w - 16, ry, row[1], {
        fontFamily: FONT.display, fontSize: '15px', fontStyle: '700',
        color: '#3e2e1e',
      }).setOrigin(1, 0).setDepth(6);
    });
  }

  makeButton(cx, cy, w, h, label, color, onClick) {
    const c = this.add.container(cx, cy).setDepth(10);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.45);
    bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w, h, 6);
    bg.fillStyle(COLORS.parchment, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(3, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(1, COLORS.gold, 0.85);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 5);
    // 액센트 띠
    bg.fillStyle(color, 1);
    bg.fillRect(-w / 2 + 6, h / 2 - 6, w - 12, 3);
    c.add(bg);

    const t = this.add.text(0, 0, label, {
      fontFamily: FONT.display, fontSize: '18px', fontStyle: '900',
      color: '#3e2e1e',
    }).setOrigin(0.5);
    t.setLetterSpacing?.(3);
    c.add(t);

    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => {
      this.tweens.add({ targets: c, scale: 1.06, duration: 140, ease: 'Cubic.Out' });
    });
    c.on('pointerout', () => {
      this.tweens.add({ targets: c, scale: 1, duration: 140, ease: 'Cubic.Out' });
    });
    c.on('pointerdown', onClick);
    return c;
  }
}
