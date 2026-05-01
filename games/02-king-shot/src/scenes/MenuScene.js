// MenuScene — 5스테이지 카드 캐러셀 + 베스트 점수.

import { COLORS, FONT, KEY, TILE } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Storage } from '../../../../shared/storage.js';
import { LEVELS } from '../maps/index.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    Audio.unlockOnFirstInput(this);

    this.cameras.main.setBackgroundColor('#1a2818');
    this.cameras.main.fadeIn(280, 0, 0, 0);

    // 메뉴 배경 — 상단(성/하늘) 일러스트 + 하단 잔디 타일
    this.add.image(width / 2, 0, 'menu_bg').setOrigin(0.5, 0).setDepth(0);
    this.drawGrassBackground(width, height, 480);

    // 일러스트 → 잔디 경계 부드러운 페이드
    const blend = this.add.graphics().setDepth(1);
    blend.fillGradientStyle(0x000000, 0x000000, 0x1a2818, 0x1a2818, 0, 0, 0.85, 0.85);
    blend.fillRect(0, 460, width, 60);

    // 타이틀: 가독성 위해 상단 어두운 양피지 배너
    const bannerY = 110;
    const bannerW = 360, bannerH = 110;
    const banner = this.add.graphics().setDepth(2);
    banner.fillStyle(0x000000, 0.55);
    banner.fillRoundedRect(width / 2 - bannerW / 2 + 3, bannerY - bannerH / 2 + 4, bannerW, bannerH, 14);
    banner.fillStyle(0x2a1810, 0.92);
    banner.fillRoundedRect(width / 2 - bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 14);
    banner.lineStyle(3, COLORS.goldDeep, 1);
    banner.strokeRoundedRect(width / 2 - bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 14);
    banner.lineStyle(1, COLORS.goldHud, 0.9);
    banner.strokeRoundedRect(width / 2 - bannerW / 2 + 4, bannerY - bannerH / 2 + 4, bannerW - 8, bannerH - 8, 11);
    banner.fillStyle(COLORS.goldHud, 1);
    [[-bannerW / 2 + 10, -bannerH / 2 + 10], [bannerW / 2 - 10, -bannerH / 2 + 10],
     [-bannerW / 2 + 10,  bannerH / 2 - 10], [bannerW / 2 - 10,  bannerH / 2 - 10]]
      .forEach(([px, py]) => banner.fillCircle(width / 2 + px, bannerY + py, 3));

    // 타이틀 — 더 큰 폰트 + 다층 그림자 + 글로우
    const titleY = bannerY - 8;
    const glow = this.add.text(width / 2, titleY, 'KING SHOT', {
      fontFamily: FONT.display, fontSize: '60px', fontStyle: '900',
      color: '#f4c542',
    }).setOrigin(0.5).setAlpha(0.4).setDepth(2);
    glow.setLetterSpacing?.(5);
    this.tweens.add({
      targets: glow, alpha: { from: 0.3, to: 0.7 },
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    const titleShadow = this.add.text(width / 2 + 3, titleY + 4, 'KING SHOT', {
      fontFamily: FONT.display, fontSize: '60px', fontStyle: '900',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0.7).setDepth(2);
    titleShadow.setLetterSpacing?.(5);
    const title = this.add.text(width / 2, titleY, 'KING SHOT', {
      fontFamily: FONT.display, fontSize: '60px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(3);
    title.setLetterSpacing?.(5);
    this.tweens.add({
      targets: title, scale: { from: 1, to: 1.04 },
      duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    this.add.text(width / 2, titleY + 36, 'TOWER DEFENSE', {
      fontFamily: FONT.mono, fontSize: '13px', fontStyle: '700',
      color: '#f4e8c8',
    }).setOrigin(0.5).setDepth(3).setLetterSpacing?.(6);

    // 골드 디바이더
    const div = this.add.graphics().setDepth(3);
    div.lineStyle(2, COLORS.goldHud, 0.6);
    div.beginPath();
    div.moveTo(width / 2 - 80, 178); div.lineTo(width / 2 + 80, 178);
    div.strokePath();
    div.fillStyle(COLORS.goldHud, 0.9);
    div.fillTriangle(width / 2 - 6, 178, width / 2 + 6, 178, width / 2, 172);
    div.fillTriangle(width / 2 - 6, 178, width / 2 + 6, 178, width / 2, 184);

    // 스테이지 카드
    this.profile = Storage.load();
    this.stageIdx = 0;
    this.cardCenter = { x: width / 2, y: 420 };
    this.cardContainer = this.add.container(this.cardCenter.x, this.cardCenter.y).setDepth(4);
    this.drawStageCard();

    // 좌우 화살표
    this.makeArrow(width / 2 - 150, 420, -1);
    this.makeArrow(width / 2 + 150, 420,  1);

    // 페이지 인디케이터
    this.indicators = [];
    const indY = 540;
    LEVELS.forEach((_, i) => {
      const dx = width / 2 + (i - (LEVELS.length - 1) / 2) * 18;
      const c = this.add.circle(dx, indY, 4, 0xd9c897, 0.5).setDepth(4);
      this.indicators.push(c);
    });
    this.refreshIndicators();

    // START 버튼
    this.makeStartButton(width / 2, 640);

    // 하단 정보
    const totalGems = this.profile.gems || 0;
    const totalCoins = this.profile.coins || 0;
    this.add.image(width / 2 - 60, height - 30, KEY.tilesheet, TILE.COIN_GOLD)
      .setScale(0.4).setDepth(4);
    this.add.text(width / 2 - 40, height - 38, totalCoins, {
      fontFamily: FONT.mono, fontSize: '13px', fontStyle: '700',
      color: '#f4c542',
    }).setOrigin(0, 0).setDepth(4).setLetterSpacing?.(2);
    this.add.text(width / 2 + 24, height - 38, `GEMS · ${totalGems}`, {
      fontFamily: FONT.mono, fontSize: '13px', fontStyle: '700',
      color: '#80c8ff',
    }).setOrigin(0, 0).setDepth(4).setLetterSpacing?.(2);

    Audio.playBgm('menu', { fadeIn: 0.6, volume: 0.55 });
  }

  drawGrassBackground(width, height, startY = 0) {
    const ts = 32;
    for (let y = Math.floor(startY / ts) * ts; y < height; y += ts) {
      for (let x = 0; x < width; x += ts) {
        const tile = (Math.random() < 0.85) ? TILE.GRASS : TILE.GRASS_PLAIN;
        this.add.image(x, y, KEY.tilesheet, tile).setOrigin(0).setScale(0.5).setDepth(0);
      }
    }
  }

  makeArrow(x, y, dir) {
    const g = this.add.graphics().setDepth(5);
    g.x = x; g.y = y;
    const draw = (color = COLORS.goldHud) => {
      g.clear();
      g.fillStyle(0x000000, 0.5);
      g.fillCircle(2, 2, 18);
      g.fillStyle(COLORS.woodDark, 1);
      g.fillCircle(0, 0, 18);
      g.fillStyle(COLORS.parchment, 1);
      g.fillCircle(0, 0, 16);
      g.lineStyle(2, COLORS.goldDeep, 1);
      g.strokeCircle(0, 0, 16);
      g.fillStyle(color, 1);
      g.fillTriangle(dir * -6, -7, dir * -6, 7, dir * 6, 0);
    };
    draw();
    g.setInteractive(new Phaser.Geom.Circle(0, 0, 22), Phaser.Geom.Circle.Contains);
    g.on('pointerover', () => draw(COLORS.goldHud));
    g.on('pointerout',  () => draw(COLORS.goldDeep));
    g.on('pointerdown', () => { this.changeStage(dir); Audio.tap(); });
  }

  changeStage(delta) {
    this.stageIdx = (this.stageIdx + delta + LEVELS.length) % LEVELS.length;
    this.tweens.add({
      targets: this.cardContainer,
      x: this.cardCenter.x - delta * 60, alpha: 0,
      duration: 160, ease: 'Cubic.In',
      onComplete: () => {
        this.drawStageCard();
        this.cardContainer.x = this.cardCenter.x + delta * 60;
        this.tweens.add({
          targets: this.cardContainer,
          x: this.cardCenter.x, alpha: 1,
          duration: 200, ease: 'Back.Out',
        });
      },
    });
    this.refreshIndicators();
  }

  refreshIndicators() {
    this.indicators?.forEach((c, i) => {
      c.setFillStyle(i === this.stageIdx ? COLORS.goldHud : 0x6a5a3a,
                     i === this.stageIdx ? 1 : 0.7);
      c.setRadius(i === this.stageIdx ? 5 : 4);
    });
  }

  drawStageCard() {
    const c = this.cardContainer;
    c.removeAll(true);
    const stage = LEVELS[this.stageIdx];
    const w = 300, h = 220;

    // 그림자
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, 12);
    c.add(shadow);

    // 양피지 채움
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.parchment, 0.97);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.fillStyle(COLORS.parchmentDim, 1);
    bg.fillRect(-w / 2, -h / 2, w, 8);
    bg.fillRect(-w / 2, h / 2 - 8, w, 8);
    bg.lineStyle(3, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(1, COLORS.goldHud, 0.85);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 10);
    bg.fillStyle(COLORS.goldHud, 1);
    [[-w / 2 + 8, -h / 2 + 8], [w / 2 - 8, -h / 2 + 8],
     [-w / 2 + 8,  h / 2 - 8], [w / 2 - 8,  h / 2 - 8]]
      .forEach(([px, py]) => bg.fillCircle(px, py, 2.5));
    c.add(bg);

    // STAGE 라벨
    const stageLabel = this.add.text(0, -h / 2 + 26, `STAGE 0${this.stageIdx + 1}`, {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#8a6a2a',
    }).setOrigin(0.5).setLetterSpacing?.(4);
    c.add(stageLabel);

    // 이름
    const name = this.add.text(0, -h / 2 + 56, stage.name, {
      fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
      color: '#3e2e1e',
    }).setOrigin(0.5).setLetterSpacing?.(3);
    c.add(name);

    // 디바이더
    const div = this.add.graphics();
    div.lineStyle(2, COLORS.goldHud, 0.85);
    div.beginPath();
    div.moveTo(-60, -h / 2 + 80); div.lineTo(60, -h / 2 + 80);
    div.strokePath();
    div.fillStyle(COLORS.goldHud, 1);
    div.fillTriangle(-5, -h / 2 + 80, 5, -h / 2 + 80, 0, -h / 2 + 75);
    div.fillTriangle(-5, -h / 2 + 80, 5, -h / 2 + 80, 0, -h / 2 + 85);
    c.add(div);

    // 태그라인
    const tag = this.add.text(0, -h / 2 + 100, stage.tagline, {
      fontFamily: FONT.body, fontSize: '13px', fontStyle: '500',
      color: '#5a3e2e',
    }).setOrigin(0.5);
    c.add(tag);

    // 미니 프리뷰 (실제 타일 사용)
    this.drawMiniPreview(c, 0, -h / 2 + 145, stage);

    // 베스트
    const best = (this.profile.bestScores || {})[`king-shot-${stage.id}`] || 0;
    const bestT = this.add.text(0, h / 2 - 22, `BEST · ${best.toLocaleString()}`, {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#8a6a2a',
    }).setOrigin(0.5).setLetterSpacing?.(3);
    c.add(bestT);
  }

  // 미니 프리뷰: 실제 경로 + 타워 슬롯.
  drawMiniPreview(parent, cx, cy, level) {
    const w = 240, h = 70;
    const bg = this.add.graphics();
    const groundCol = (level.groundTint && level.groundTint !== 0xffffff)
      ? level.groundTint : 0x3a7d44;
    bg.fillStyle(groundCol, 1);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);
    bg.lineStyle(1.5, COLORS.woodDark, 0.7);
    bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);
    parent.add(bg);

    if (!level.pathWaypoints) return;
    const sx = w / level.cols;
    const sy = h / level.rows;
    const path = level.pathWaypoints;
    // 경로
    bg.lineStyle(4, COLORS.woodBrown, 1);
    bg.beginPath();
    for (let i = 0; i < path.length; i++) {
      const [c, r] = path[i];
      const px = cx - w / 2 + (c + 0.5) * sx;
      const py = cy - h / 2 + (r + 0.5) * sy;
      if (i === 0) bg.moveTo(px, py);
      else bg.lineTo(px, py);
    }
    bg.strokePath();
    // 타워 슬롯 점
    for (const [c, r] of (level.towerSlots ?? [])) {
      const px = cx - w / 2 + (c + 0.5) * sx;
      const py = cy - h / 2 + (r + 0.5) * sy;
      const dot = this.add.circle(px, py, 1.5, COLORS.goldHud, 0.95);
      parent.add(dot);
    }
    // 왕좌 위치 (작은 적색 마크)
    if (level.throne) {
      const tx = cx - w / 2 + (level.throne.col + 0.5) * sx;
      const ty = cy - h / 2 + (level.throne.row + 0.5) * sy;
      const t = this.add.circle(tx, ty, 4, COLORS.capeRed, 1);
      t.setStrokeStyle(1.5, COLORS.goldHud, 1);
      parent.add(t);
    }
  }

  makeStartButton(cx, cy) {
    const w = 220, h = 56;
    const c = this.add.container(cx, cy).setDepth(5);
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
    }).setOrigin(0.5).setLetterSpacing?.(4);
    c.add(t);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.06, duration: 140 }));
    c.on('pointerout',  () => this.tweens.add({ targets: c, scale: 1, duration: 140 }));
    c.on('pointerdown', () => {
      Audio.purchase();
      const stage = LEVELS[this.stageIdx];
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { levelId: stage.id });
      });
    });
    this.tweens.add({
      targets: c, scale: { from: 1, to: 1.04 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }
}
