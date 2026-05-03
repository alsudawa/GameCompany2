// ResultScene — VICTORY / DEFEATED + 등급 + 통계 + RETRY/MENU.

import { COLORS, FONT, GRADE_CUTS, KEY, TILE } from '../config.js';
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
    this.cameras.main.setBackgroundColor('#1a2818');
    this.cameras.main.fadeIn(380, 0, 0, 0);

    // 배경 — 캐슬 일러스트를 화면 전체에 덮음(상하 미러 + 페이드로 자연스럽게 확장)
    if (this.textures.exists('menu_bg')) {
      // 480x480 일러스트를 화면 너비에 맞게 스케일 후 화면 위에 배치
      this.add.image(width / 2, 0, 'menu_bg')
        .setOrigin(0.5, 0).setDepth(0).setAlpha(0.92);
      // 같은 일러스트를 좌우반전 + 상하반전해서 하단을 덮어 어색한 다크 그린이 노출되지 않도록
      this.add.image(width / 2, height, 'menu_bg')
        .setOrigin(0.5, 1).setDepth(0).setAlpha(0.55).setFlipY(true);
    }
    // 가독성 + 분위기 오버레이 — 승리/패배 톤
    const overlay = this.add.graphics().setDepth(1);
    if (s.victory) {
      overlay.fillStyle(0x1a0d04, 0.55);
      overlay.fillRect(0, 0, width, height);
      overlay.fillStyle(0xf4c542, 0.07);
      overlay.fillCircle(width / 2, 240, width * 0.75);
    } else {
      overlay.fillStyle(0x1a0a0a, 0.7);
      overlay.fillRect(0, 0, width, height);
      overlay.fillStyle(0xc8302d, 0.08);
      overlay.fillCircle(width / 2, 240, width * 0.75);
    }

    // 별 입자
    for (let i = 0; i < 24; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const star = this.add.circle(x, y, 0.8 + Math.random() * 1.2,
        COLORS.parchment, 0.55).setDepth(2);
      this.tweens.add({
        targets: star, alpha: { from: 0.2, to: 0.9 },
        duration: 1200 + Math.random() * 1800,
        yoyo: true, repeat: -1, delay: Math.random() * 1200,
      });
    }

    // 상단 배너 — 양피지 박스 안에 큰 글자
    const bannerY = 92;
    const bannerW = 320, bannerH = 78;
    const banner = this.add.graphics().setDepth(8);
    banner.fillStyle(0x000000, 0.55);
    banner.fillRoundedRect(width / 2 - bannerW / 2 + 3, bannerY - bannerH / 2 + 4, bannerW, bannerH, 12);
    banner.fillStyle(0x2a1810, 0.92);
    banner.fillRoundedRect(width / 2 - bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 12);
    banner.lineStyle(3, COLORS.goldDeep, 1);
    banner.strokeRoundedRect(width / 2 - bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 12);
    banner.lineStyle(1, COLORS.goldHud, 0.85);
    banner.strokeRoundedRect(width / 2 - bannerW / 2 + 4, bannerY - bannerH / 2 + 4, bannerW - 8, bannerH - 8, 10);

    const top = this.add.text(width / 2, bannerY, s.victory ? 'VICTORY' : 'DEFEATED', {
      fontFamily: FONT.display, fontSize: '36px', fontStyle: '900',
      color: s.victory ? '#f4c542' : '#c8302d',
      stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);
    top.setLetterSpacing?.(4);
    this.tweens.add({
      targets: top, scale: { from: 1.4, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 460, ease: 'Back.Out',
    });

    // 등급
    const grade = this.computeGrade(s.score ?? 0);
    const gradeColor = {
      S: 0xf4c542, A: 0xc0c8d0, B: 0xc89438, C: 0x8a6a4a,
    }[grade] ?? 0x8a6a4a;
    this.drawShieldMedal(width / 2, 240, 78, gradeColor, grade);

    // 별 평가
    if (s.victory && (s.stars ?? 0) > 0) {
      this.drawStars(width / 2, 348, s.stars);
    }

    if (s.isBest && s.victory) {
      // 스탯 패널 위쪽에 약간 기울인 리본 (Container로 묶어 회전)
      const ribbon = this.add.container(width / 2, 386).setDepth(12);
      const rg = this.add.graphics();
      rg.fillStyle(0x000000, 0.55);
      rg.fillRoundedRect(-77, -10, 158, 24, 4);
      rg.fillStyle(0xc8302d, 1);
      rg.fillRoundedRect(-79, -12, 158, 24, 4);
      rg.lineStyle(1, 0xf4c542, 0.95);
      rg.strokeRoundedRect(-79, -12, 158, 24, 4);
      const rt = this.add.text(0, 0, '★ NEW BEST ★', {
        fontFamily: FONT.display, fontSize: '13px', fontStyle: '900',
        color: '#fff5d8',
      }).setOrigin(0.5);
      rt.setLetterSpacing?.(3);
      ribbon.add([rg, rt]);
      ribbon.setAngle(-4);
      this.tweens.add({
        targets: ribbon, scale: { from: 1, to: 1.06 },
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
    }

    // 통계 패널
    this.drawStatsPanel(width / 2, 460, 300, 160, s);

    // 버튼
    this.makeButton(width / 2 - 78, 660, 130, 50, 'RETRY', COLORS.red, () => {
      Audio.purchase();
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { stageId: s.stageId });
      });
    });
    this.makeButton(width / 2 + 78, 660, 130, 50, 'MENU', 0x4a8bc2, () => {
      Audio.purchase();
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    if (s.victory) Audio.fanfare();
    else Audio.miss();
  }

  drawStars(cx, cy, n) {
    const starGap = 56;
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * starGap;
      const filled = i < n;
      const g = this.add.graphics().setDepth(10);
      g.x = x; g.y = cy;
      // 5각성 그리기
      const drawStar = (rOuter, rInner, color, alpha = 1) => {
        const pts = [];
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + k * Math.PI / 5;
          const r = (k % 2 === 0) ? rOuter : rInner;
          pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }
        g.fillStyle(color, alpha);
        g.fillPoints(pts, true);
      };
      drawStar(20, 9, 0x000000, 0.45);   // 그림자
      g.x += -2; g.y += -2;
      drawStar(20, 9, filled ? 0x6e5a2a : 0x3a3026);   // 외곽
      drawStar(17, 7.5, filled ? 0xf4c542 : 0x5a4a32); // 본체
      if (filled) {
        drawStar(11, 5, 0xfff4a0, 0.85);               // 하이라이트
      }
      // 등장 애니메이션
      g.setScale(0);
      this.tweens.add({
        targets: g, scale: 1,
        duration: 320, delay: 600 + i * 180,
        ease: 'Back.Out',
      });
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
    // 방패 폴리곤
    const points = [];
    points.push({ x: -r, y: -r * 0.5 });
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (i / 10) * Math.PI;
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * -0.5 - r * 0.5 });
    }
    points.push({ x: r, y: -r * 0.5 });
    points.push({ x: r * 0.85, y: r * 0.5 });
    points.push({ x: 0, y: r });
    points.push({ x: -r * 0.85, y: r * 0.5 });

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillPoints(points.map(p => ({ x: p.x + 4, y: p.y + 4 })), true);
    c.add(shadow);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a04, 1);
    bg.fillPoints(points.map(p => ({ x: p.x * 1.06, y: p.y * 1.06 })), true);
    bg.fillStyle(color, 1);
    bg.fillPoints(points, true);
    bg.lineStyle(3, COLORS.goldHud, 1);
    bg.strokePoints(points, true, true);
    c.add(bg);

    const g = this.add.text(0, 4, grade, {
      fontFamily: FONT.display, fontSize: '76px', fontStyle: '900',
      color: '#3e2e1e', stroke: '#f4c542', strokeThickness: 4,
    }).setOrigin(0.5);
    c.add(g);

    c.setScale(0.4).setAlpha(0);
    this.tweens.add({
      targets: c, scale: 1, alpha: 1,
      duration: 480, delay: 220, ease: 'Back.Out',
      onComplete: () => {
        Juice.ring(this, cx, cy, { color, radius: 180, duration: 540, count: 2 });
        Juice.flash(this, color, 220);
      },
    });
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
    panel.fillStyle(COLORS.parchment, 0.96);
    panel.fillRect(x, y, w, h);
    panel.lineStyle(3, COLORS.woodDark, 1);
    panel.strokeRect(x, y, w, h);
    panel.lineStyle(1, COLORS.goldHud, 0.85);
    panel.strokeRect(x + 1, y + 1, w - 2, h - 2);
    panel.fillStyle(COLORS.goldHud, 1);
    [[x + 6, y + 6], [x + w - 6, y + 6], [x + 6, y + h - 6], [x + w - 6, y + h - 6]]
      .forEach(([px, py]) => panel.fillCircle(px, py, 2.5));

    const rows = [
      ['SCORE',     (s.score ?? 0).toLocaleString()],
      ['BEST',      (s.bestScore ?? 0).toLocaleString()],
      ['KILLS',     String(s.kills ?? 0)],
      ['COINS',     `+${s.coinsEarned ?? 0}`],
      ['GEMS',      `+${s.gemsEarned ?? 0}`],
    ];
    rows.forEach((row, i) => {
      const ry = y + 16 + i * 28;
      this.add.text(x + 18, ry, row[0], {
        fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
        color: '#5a3e2e',
      }).setDepth(6).setLetterSpacing?.(3);
      this.add.text(x + w - 18, ry, row[1], {
        fontFamily: FONT.display, fontSize: '17px', fontStyle: '700',
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
    bg.lineStyle(1, COLORS.goldHud, 0.85);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 5);
    bg.fillStyle(color, 1);
    bg.fillRect(-w / 2 + 6, h / 2 - 6, w - 12, 3);
    c.add(bg);

    const t = this.add.text(0, 0, label, {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#3e2e1e',
    }).setOrigin(0.5);
    t.setLetterSpacing?.(3);
    c.add(t);

    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.06, duration: 140 }));
    c.on('pointerout',  () => this.tweens.add({ targets: c, scale: 1, duration: 140 }));
    c.on('pointerdown', onClick);
    return c;
  }
}
