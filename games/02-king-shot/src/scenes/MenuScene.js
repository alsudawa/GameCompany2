// MenuScene — 타이틀 + 스테이지 캐러셀.
// 양피지 두루마리 카드로 5스테이지 좌우 이동 선택.

import { Audio } from '../../../../shared/audio.js';
import { Storage } from '../../../../shared/storage.js';
import { Juice } from '../../../../shared/juice.js';
import { COLORS, FONT, STAGES } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;

    Audio.unlockOnFirstInput(this);

    // 어두운 숲 배경
    this.cameras.main.setBackgroundColor('#15201a');
    this.cameras.main.fadeIn(380, 0, 0, 0);

    const bg = this.add.graphics().setDepth(-10);
    bg.fillGradientStyle(0x1f3a22, 0x1f3a22, 0x0d1810, 0x0d1810, 1, 1, 1, 1);
    bg.fillRect(0, 0, width, height);

    // 위쪽 따뜻한 하이라이트
    const highlight = this.add.graphics().setDepth(-9);
    highlight.fillStyle(COLORS.gold, 0.06);
    highlight.fillCircle(width / 2, 80, 280);

    // 별 입자
    for (let i = 0; i < 28; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height * 0.5;
      const sz = 0.8 + Math.random() * 1.5;
      const star = this.add.circle(sx, sy, sz, COLORS.parchment, 0.5).setDepth(-8);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: 1400 + Math.random() * 1600,
        yoyo: true, repeat: -1,
        delay: Math.random() * 1200,
      });
    }

    // ── 타이틀 ──
    const titleShadow = this.add.text(width / 2 + 3, 130 + 3, 'KING SHOT', {
      fontFamily: FONT.display, fontSize: '56px', fontStyle: '900',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0.5).setDepth(0);
    titleShadow.setLetterSpacing?.(4);

    const title = this.add.text(width / 2, 130, 'KING SHOT', {
      fontFamily: FONT.display, fontSize: '56px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1);
    title.setLetterSpacing?.(4);
    this.tweens.add({
      targets: title, scale: { from: 1, to: 1.04 },
      duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    const sub = this.add.text(width / 2, 178, '왕국을 지켜라 · 활시위를 당겨라', {
      fontFamily: FONT.body, fontSize: '14px', fontStyle: '600',
      color: '#d9c897',
    }).setOrigin(0.5).setDepth(1);
    sub.setLetterSpacing?.(2);

    // 골드 디바이더
    const div = this.add.graphics().setDepth(1);
    div.lineStyle(2, COLORS.gold, 0.6);
    div.beginPath();
    div.moveTo(width / 2 - 80, 208); div.lineTo(width / 2 + 80, 208);
    div.strokePath();
    div.fillStyle(COLORS.gold, 0.9);
    div.fillTriangle(width / 2 - 6, 208, width / 2 + 6, 208, width / 2, 202);
    div.fillTriangle(width / 2 - 6, 208, width / 2 + 6, 208, width / 2, 214);

    // ── 스테이지 카드 ──
    this.stageIdx = 0;
    this.cardCenter = { x: width / 2, y: 420 };
    this.profile = Storage.load();
    this.cardContainer = this.add.container(this.cardCenter.x, this.cardCenter.y).setDepth(2);
    this.drawStageCard();

    // 좌우 화살표 버튼
    this.makeArrow(width / 2 - 150, 420, -1);
    this.makeArrow(width / 2 + 150, 420,  1);

    // 페이지 인디케이터 (5개 점)
    this.indicators = [];
    const indY = 540;
    STAGES.forEach((_, i) => {
      const dx = width / 2 + (i - (STAGES.length - 1) / 2) * 18;
      const c = this.add.circle(dx, indY, 4, 0xd9c897, 0.5).setDepth(2);
      this.indicators.push(c);
    });
    this.refreshIndicators();

    // ── START 버튼 ──
    this.makeStartButton(width / 2, 640);

    // 하단 정보
    const totalGems = this.profile.gems || 0;
    this.add.text(width / 2, height - 30, `보유 GEMS · ${totalGems}`, {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#8a8470',
    }).setOrigin(0.5).setDepth(1).setLetterSpacing?.(3);

    // 메뉴 BGM
    Audio.playBgm('menu', { fadeIn: 0.6, volume: 0.65 });
  }

  makeArrow(x, y, dir) {
    const g = this.add.graphics().setDepth(3);
    g.x = x; g.y = y;
    const draw = (color = COLORS.gold) => {
      g.clear();
      g.fillStyle(0x000000, 0.5);
      g.fillCircle(2, 2, 18);
      g.fillStyle(COLORS.woodDark, 1);
      g.fillCircle(0, 0, 18);
      g.fillStyle(COLORS.parchment, 1);
      g.fillCircle(0, 0, 16);
      g.lineStyle(2, COLORS.goldDeep, 1);
      g.strokeCircle(0, 0, 16);
      // 화살표
      g.fillStyle(color, 1);
      g.fillTriangle(dir * -6, -7, dir * -6, 7, dir * 6, 0);
    };
    draw();
    const hit = new Phaser.Geom.Circle(0, 0, 22);
    g.setInteractive(hit, Phaser.Geom.Circle.Contains);
    g.on('pointerover', () => draw(COLORS.gold));
    g.on('pointerout',  () => draw(COLORS.goldDeep));
    g.on('pointerdown', () => {
      this.changeStage(dir);
      Audio.tap();
    });
  }

  changeStage(delta) {
    this.stageIdx = (this.stageIdx + delta + STAGES.length) % STAGES.length;
    // 카드 슬라이드 인/아웃
    this.tweens.add({
      targets: this.cardContainer,
      x: this.cardCenter.x - delta * 60,
      alpha: 0,
      duration: 160,
      ease: 'Cubic.In',
      onComplete: () => {
        this.drawStageCard();
        this.cardContainer.x = this.cardCenter.x + delta * 60;
        this.tweens.add({
          targets: this.cardContainer,
          x: this.cardCenter.x,
          alpha: 1,
          duration: 200,
          ease: 'Back.Out',
        });
      },
    });
    this.refreshIndicators();
  }

  refreshIndicators() {
    this.indicators?.forEach((c, i) => {
      c.setFillStyle(i === this.stageIdx ? COLORS.gold : 0x6a5a3a, i === this.stageIdx ? 1 : 0.7);
      c.setRadius(i === this.stageIdx ? 5 : 4);
    });
  }

  drawStageCard() {
    const c = this.cardContainer;
    c.removeAll(true);
    const stage = STAGES[this.stageIdx];
    const w = 260;
    const h = 200;
    const accent = stage.palette.accent;

    // 그림자
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, 10);
    c.add(shadow);

    // 양피지 채움
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.parchment, 0.96);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    // 두루마리 끝
    bg.fillStyle(COLORS.parchmentDim, 1);
    bg.fillRect(-w / 2, -h / 2, w, 8);
    bg.fillRect(-w / 2,  h / 2 - 8, w, 8);
    // 우드 외곽 + 골드 내곽
    bg.lineStyle(3, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(1, COLORS.gold, 0.85);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 8);
    // 코너 못
    bg.fillStyle(COLORS.gold, 1);
    [[-w / 2 + 8, -h / 2 + 8], [w / 2 - 8, -h / 2 + 8],
     [-w / 2 + 8,  h / 2 - 8], [w / 2 - 8,  h / 2 - 8]]
      .forEach(([px, py]) => bg.fillCircle(px, py, 2.5));
    c.add(bg);

    // 라벨
    const stageNum = this.add.text(0, -h / 2 + 28, `STAGE ${stage.label}`, {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#8a6a2a',
    }).setOrigin(0.5);
    stageNum.setLetterSpacing?.(4);
    c.add(stageNum);

    // 이름 (Cinzel)
    const name = this.add.text(0, -h / 2 + 56, stage.name, {
      fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
      color: '#3e2e1e',
    }).setOrigin(0.5);
    name.setLetterSpacing?.(3);
    c.add(name);

    // 액센트 컬러 디바이더
    const div = this.add.graphics();
    div.lineStyle(2, accent, 0.85);
    div.beginPath();
    div.moveTo(-60, -h / 2 + 80); div.lineTo(60, -h / 2 + 80);
    div.strokePath();
    div.fillStyle(accent, 1);
    div.fillTriangle(-5, -h / 2 + 80, 5, -h / 2 + 80, 0, -h / 2 + 75);
    div.fillTriangle(-5, -h / 2 + 80, 5, -h / 2 + 80, 0, -h / 2 + 85);
    c.add(div);

    // 태그라인
    const tag = this.add.text(0, -h / 2 + 100, stage.tagline, {
      fontFamily: FONT.body, fontSize: '13px', fontStyle: '500',
      color: '#5a3e2e',
    }).setOrigin(0.5);
    c.add(tag);

    // 스테이지 미니 프리뷰 — 잔디 색 사각 + 보스 실루엣
    const preview = this.add.graphics();
    preview.fillStyle(stage.palette.ground, 1);
    preview.fillRoundedRect(-90, -h / 2 + 118, 180, 50, 4);
    preview.lineStyle(1.5, COLORS.woodDark, 0.7);
    preview.strokeRoundedRect(-90, -h / 2 + 118, 180, 50, 4);
    // 미니 보스 실루엣 (작은 원 + 송곳니)
    preview.fillStyle(0x000000, 0.7);
    preview.fillEllipse(0, -h / 2 + 162, 28, 6);
    preview.fillStyle(COLORS.orcRed, 1);
    preview.fillRoundedRect(-12, -h / 2 + 142, 24, 18, 5);
    preview.fillCircle(0, -h / 2 + 138, 7);
    c.add(preview);

    // 베스트 스코어
    const best = (this.profile.bestScores || {})[`king-shot-${stage.id}`] ||
                 (this.profile.bestScores || {})['king-shot'] || 0;
    const bestT = this.add.text(0, h / 2 - 22, `BEST · ${best.toLocaleString()}`, {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#8a6a2a',
    }).setOrigin(0.5);
    bestT.setLetterSpacing?.(3);
    c.add(bestT);
  }

  makeStartButton(cx, cy) {
    const w = 200, h = 56;
    const c = this.add.container(cx, cy).setDepth(3);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w, h, 8);
    bg.fillStyle(COLORS.capeRed, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.fillStyle(COLORS.capeRedDk, 1);
    bg.fillRoundedRect(-w / 2, h / 2 - 6, w, 6, 8);
    bg.lineStyle(3, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(1, COLORS.gold, 0.9);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 6);
    bg.fillStyle(COLORS.gold, 1);
    [[-w / 2 + 8, -h / 2 + 8], [w / 2 - 8, -h / 2 + 8],
     [-w / 2 + 8,  h / 2 - 8], [w / 2 - 8,  h / 2 - 8]]
      .forEach(([px, py]) => bg.fillCircle(px, py, 2.5));
    c.add(bg);

    const t = this.add.text(0, 0, '⚔ START', {
      fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 4,
    }).setOrigin(0.5);
    t.setLetterSpacing?.(4);
    c.add(t);

    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => {
      this.tweens.add({ targets: c, scale: 1.06, duration: 140, ease: 'Cubic.Out' });
    });
    c.on('pointerout', () => {
      this.tweens.add({ targets: c, scale: 1, duration: 140, ease: 'Cubic.Out' });
    });
    c.on('pointerdown', () => {
      Audio.purchase();
      const stage = STAGES[this.stageIdx];
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { stageId: stage.id });
      });
    });

    // 펄스
    this.tweens.add({
      targets: c, scale: { from: 1, to: 1.04 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }
}
