// MenuScene — 타이틀, START, SHOP, 내 기록/재화 표시. v3 디자인 패스.

import { Storage } from '../../../../shared/storage.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { UI, FONT } from '../../../../shared/ui.js';
import { COLORS } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05050c');

    Audio.unlockOnFirstInput(this);
    // 메뉴 BGM — 잔잔한 A 마이너 루프 (유저 제스처 직후 자동 시작)
    Audio.playBgm?.('menu', { fadeIn: 0.6 });

    // 배경 레이어
    UI.drawGrid(this, width, height, { cell: 40, color: 0x0f1530, alpha: 0.45, depth: -25 });
    UI.drawViewportFrame(this, width, height, { color: 0x00e5ff, alpha: 0.4, depth: -8, inset: 4 });
    UI.drawScanlines(this, width, height, { gap: 3, alpha: 0.035, depth: 1200 });
    this.drawBgOrnaments();

    // 상단 스튜디오 태그
    this.add.text(width / 2, 30, 'GAMECOMPANY2  //  01', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#6b708f',
    }).setOrigin(0.5).setLetterSpacing(4);

    // 타이틀 "TAP RUSH" — 글리치 레이어
    const titleY = height * 0.22;
    const glitchA = this.add.text(width / 2 - 2, titleY + 1, 'TAP RUSH', {
      fontFamily: FONT.display, fontSize: '72px', fontStyle: '900',
      color: '#ff2bd6',
    }).setOrigin(0.5).setAlpha(0.7).setLetterSpacing(6);
    const glitchB = this.add.text(width / 2 + 2, titleY - 1, 'TAP RUSH', {
      fontFamily: FONT.display, fontSize: '72px', fontStyle: '900',
      color: '#00e5ff',
    }).setOrigin(0.5).setAlpha(0.7).setLetterSpacing(6);
    const title = this.add.text(width / 2, titleY, 'TAP RUSH', {
      fontFamily: FONT.display, fontSize: '72px', fontStyle: '900',
      color: '#ffffff',
    }).setOrigin(0.5).setLetterSpacing(6);
    this.tweens.add({
      targets: [glitchA, glitchB],
      alpha: { from: 0.5, to: 0.85 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    this.tweens.add({
      targets: title, scale: { from: 0.98, to: 1.02 },
      duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    // 타이틀 아래 네온 라인
    const lineG = this.add.graphics();
    lineG.lineStyle(1, 0x00e5ff, 0.7);
    lineG.strokeLineShape(new Phaser.Geom.Line(width / 2 - 120, titleY + 52, width / 2 + 120, titleY + 52));
    lineG.lineStyle(1, 0x00e5ff, 0.2);
    lineG.strokeLineShape(new Phaser.Geom.Line(width / 2 - 160, titleY + 56, width / 2 + 160, titleY + 56));

    // 서브타이틀
    this.add.text(width / 2, titleY + 74, 'TIME ATTACK · COMBO BURST', {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#8a90b0',
    }).setOrigin(0.5).setLetterSpacing(3);

    // 프로필 stat 카드 (3열)
    const profile = Storage.load();
    const best = profile.bestScores['tap-rush'] || 0;
    this.drawStatCard(width * 0.2,  height * 0.44, 'BEST',  best.toLocaleString(), 0xffd24a);
    this.drawStatCard(width * 0.5,  height * 0.44, 'COINS', String(profile.coins),  0x00e5ff);
    this.drawStatCard(width * 0.8,  height * 0.44, 'GEMS',  String(profile.gems),   0xff2bd6);

    // 메인 버튼 — 와이드 START
    this.makeHexButton(width / 2, height * 0.60, 280, 80, 'START', 0x00e5ff, () => {
      Audio.rare();
      Audio.stopBgm?.({ fadeOut: 0.25 });
      Juice.flash(this, COLORS.cyan, 180);
      Juice.ring(this, width / 2, height * 0.60, { color: COLORS.cyan, radius: 280, count: 2 });
      this.time.delayedCall(160, () => this.scene.start('GameScene'));
    });

    // 서브 버튼 행
    this.makeSubButton(width * 0.3, height * 0.74, 130, 56, 'SHOP',    0xff2bd6, () => {
      Audio.tap();
      Audio.stopBgm?.({ fadeOut: 0.25 });
      this.scene.start('ShopScene');
    });
    this.makeSubButton(width * 0.7, height * 0.74, 130, 56, 'INFO',    0x6b708f, () => {
      Audio.tap();
      this.showStudioSheet();
    });

    // 장착 스킨 배지
    const skinLabel = ({ default: 'DEFAULT', neon: 'NEON', galaxy: 'GALAXY' }[profile.equippedSkin]) || profile.equippedSkin.toUpperCase();
    this.add.text(width / 2, height * 0.84, `SKIN · ${skinLabel}`, {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#6b708f',
    }).setOrigin(0.5).setLetterSpacing(3);

    // 푸터 — 팀 크레딧
    this.add.text(width / 2, height - 30,
      'PLANNER  ·  DESIGNER  ·  DEVELOPER  ·  TESTER', {
      fontFamily: FONT.mono, fontSize: '9px', fontStyle: '700',
      color: '#3a3f5c',
    }).setOrigin(0.5).setLetterSpacing(4);
  }

  drawBgOrnaments() {
    const { width, height } = this.scale;
    // 4모서리 코너 라벨칩
    this.add.text(16, 14, 'GC2 // 01', {
      fontFamily: FONT.mono, fontSize: '9px', fontStyle: '700', color: '#6b708f',
    }).setLetterSpacing(2);
    this.add.text(width - 16, 14, 'v1.0', {
      fontFamily: FONT.mono, fontSize: '9px', fontStyle: '700', color: '#6b708f',
    }).setOrigin(1, 0).setLetterSpacing(2);
    // 중심 장식 — 희미한 원
    const g = this.add.graphics().setDepth(-20);
    g.lineStyle(1, 0x00e5ff, 0.1);
    g.strokeCircle(width / 2, height * 0.6, 220);
    g.lineStyle(1, 0xff2bd6, 0.08);
    g.strokeCircle(width / 2, height * 0.6, 260);
  }

  drawStatCard(cx, cy, label, value, color) {
    const w = 124, h = 74;
    const hex = '#' + color.toString(16).padStart(6, '0');

    const panel = this.add.graphics();
    panel.fillStyle(0x08091a, 0.9);
    panel.fillRect(cx - w / 2, cy - h / 2, w, h);
    panel.lineStyle(1, color, 0.4);
    panel.strokeRect(cx - w / 2, cy - h / 2, w, h);
    UI.drawCornerBrackets(this, cx - w / 2, cy - h / 2, w, h, {
      size: 8, color, thickness: 2,
    });

    this.add.text(cx, cy - 18, label, {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#6b708f',
    }).setOrigin(0.5).setLetterSpacing(3);
    this.add.text(cx, cy + 10, value, {
      fontFamily: FONT.display, fontSize: '26px', fontStyle: '900',
      color: hex,
    }).setOrigin(0.5).setLetterSpacing(1);
  }

  makeHexButton(x, y, w, h, label, color, onClick) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const bg = this.add.graphics();
    // 각진 모서리 (평행사변형 느낌)
    const cut = 14;
    const pts = [
      -w / 2 + cut, -h / 2,
       w / 2,        -h / 2,
       w / 2 - cut,  h / 2,
      -w / 2,         h / 2,
    ];
    bg.fillStyle(color, 1);
    bg.fillPoints(this.polyPts(pts), true);
    bg.lineStyle(2, 0xffffff, 0.3);
    bg.strokePoints(this.polyPts(pts), true);

    // 좌측 번개 아이콘 + 라벨
    const text = this.add.text(0, 0, `▶  ${label}`, {
      fontFamily: FONT.display, fontSize: '26px', fontStyle: '900',
      color: '#04040c',
    }).setOrigin(0.5).setLetterSpacing(4);

    const container = this.add.container(x, y, [bg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => container.setScale(0.97));
    container.on('pointerup', () => { container.setScale(1); onClick(); });
    container.on('pointerout', () => container.setScale(1));

    // 외곽 은은한 글로우
    const glow = this.add.graphics().setDepth(-1);
    glow.fillStyle(color, 0.2);
    glow.fillPoints(this.polyPts(pts.map((v, i) => v + (i % 2 ? Math.sign(v) * 4 : Math.sign(v) * 8))), true);
    container.addAt(glow, 0);

    return container;
  }

  polyPts(arr) {
    const pts = [];
    for (let i = 0; i < arr.length; i += 2) pts.push(new Phaser.Geom.Point(arr[i], arr[i + 1]));
    return pts;
  }

  makeSubButton(x, y, w, h, label, color, onClick) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0e20, 0.9);
    bg.fillRect(-w / 2, -h / 2, w, h);
    bg.lineStyle(1, color, 0.8);
    bg.strokeRect(-w / 2, -h / 2, w, h);

    const text = this.add.text(0, 0, label, {
      fontFamily: FONT.display, fontSize: '18px', fontStyle: '900',
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

  showStudioSheet() {
    const { width, height } = this.scale;
    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setDepth(800);
    const panelW = width * 0.8, panelH = 320;
    const px = width / 2 - panelW / 2, py = height / 2 - panelH / 2;
    const panel = this.add.graphics().setDepth(801);
    panel.fillStyle(0x08091a, 1);
    panel.fillRect(px, py, panelW, panelH);
    panel.lineStyle(1, 0x00e5ff, 0.8);
    panel.strokeRect(px, py, panelW, panelH);
    const corners = UI.drawCornerBrackets(this, px, py, panelW, panelH, {
      size: 14, color: 0x00e5ff, thickness: 2, depth: 802,
    });

    const items = [
      ['STUDIO', 'GameCompany2'],
      ['TITLE',  'TAP RUSH // 01'],
      ['TEAM',   '🎯  🎨  💻  🧪'],
      ['ENGINE', 'Phaser 3 · HTML5'],
      ['AD',     'NONE · IAP ONLY'],
    ];
    const texts = [];
    const t1 = this.add.text(width / 2, py + 26, 'ABOUT', {
      fontFamily: FONT.display, fontSize: '18px', fontStyle: '900',
      color: '#00e5ff',
    }).setOrigin(0.5).setLetterSpacing(4).setDepth(802);
    texts.push(t1);
    items.forEach(([k, v], i) => {
      const yi = py + 70 + i * 44;
      texts.push(this.add.text(px + 24, yi, k, {
        fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
        color: '#6b708f',
      }).setLetterSpacing(3).setDepth(802));
      texts.push(this.add.text(px + panelW - 24, yi, v, {
        fontFamily: FONT.body, fontSize: '16px', fontStyle: '700',
        color: '#e8ecf5',
      }).setOrigin(1, 0).setDepth(802));
    });
    const tap = this.add.text(width / 2, py + panelH - 28, '▼  TAP TO CLOSE', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#8a90b0',
    }).setOrigin(0.5).setLetterSpacing(4).setDepth(802);
    texts.push(tap);

    shade.setInteractive().on('pointerdown', () => {
      shade.destroy(); panel.destroy(); corners.destroy();
      texts.forEach(t => t.destroy());
    });
  }
}
