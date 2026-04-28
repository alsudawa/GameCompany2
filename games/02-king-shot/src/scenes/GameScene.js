// GameScene — 메인 플레이 씬.
// Step 1: 잔디 타일 배경 + 스테이지 라벨만. Step 2부터 왕/입력/사격이 들어온다.

import { COLORS, FONT, GAME, getStage } from '../config.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.stage = getStage(data?.stageId);
  }

  create() {
    const { width, height } = this.scale;
    const stage = this.stage;

    this.cameras.main.setBackgroundColor('#' + stage.bgBase.toString(16).padStart(6, '0'));
    this.cameras.main.fadeIn(280, 0, 0, 0);

    // ─────────── 잔디/돌 타일 배경 ───────────
    this.drawTileGround(width, height);

    // ─────────── 좌우 돌담/나무 울타리 ───────────
    this.drawSideWalls(width, height);

    // ─────────── 임시 라벨 (Step 2에서 HUD로 교체) ───────────
    const label = this.add.text(width / 2, 60, `STAGE ${stage.label} · ${stage.name}`, {
      fontFamily: FONT.mono,
      fontSize: '12px',
      fontStyle: '700',
      color: '#f4c542',
    }).setOrigin(0.5).setDepth(100);
    label.setLetterSpacing?.(3);

    const placeholder = this.add.text(width / 2, height / 2, 'WAITING FOR STEP 2\n(왕 · 입력 · 화살)', {
      fontFamily: FONT.display,
      fontSize: '22px',
      fontStyle: '700',
      color: '#d9c897',
      align: 'center',
    }).setOrigin(0.5).setDepth(100);
    placeholder.setLetterSpacing?.(2);

    this.tweens.add({
      targets: placeholder,
      alpha: { from: 1, to: 0.3 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  // 큰 타일(레이어1) + 작은 디테일(레이어2)으로 구성된 타일 그라운드.
  drawTileGround(width, height) {
    const groundColor = this.stage.palette.ground;
    const darken = (hex, amount = 0.2) => {
      const r = Math.max(0, Math.floor(((hex >> 16) & 0xff) * (1 - amount)));
      const g = Math.max(0, Math.floor(((hex >> 8) & 0xff) * (1 - amount)));
      const b = Math.max(0, Math.floor((hex & 0xff) * (1 - amount)));
      return (r << 16) | (g << 8) | b;
    };
    const lighten = (hex, amount = 0.12) => {
      const r = Math.min(255, Math.floor(((hex >> 16) & 0xff) * (1 + amount) + 20 * amount));
      const g = Math.min(255, Math.floor(((hex >> 8) & 0xff) * (1 + amount) + 20 * amount));
      const b = Math.min(255, Math.floor((hex & 0xff) * (1 + amount) + 20 * amount));
      return (r << 16) | (g << 8) | b;
    };

    // 베이스 타일
    const tile = this.add.graphics().setDepth(-30);
    const cell = 64;
    tile.fillStyle(groundColor, 1);
    tile.fillRect(0, 0, width, height);

    // 체크 패턴 — 살짝 어두운 사각이 격자로
    tile.fillStyle(darken(groundColor, 0.1), 0.55);
    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        if (((x / cell) + (y / cell)) % 2 === 0) {
          tile.fillRect(x, y, cell, cell);
        }
      }
    }

    // 시임(타일 경계선) — 매우 옅은 짙은 줄
    tile.lineStyle(1, darken(groundColor, 0.35), 0.35);
    for (let y = 0; y <= height; y += cell) {
      tile.beginPath();
      tile.moveTo(0, y + 0.5); tile.lineTo(width, y + 0.5);
      tile.strokePath();
    }
    for (let x = 0; x <= width; x += cell) {
      tile.beginPath();
      tile.moveTo(x + 0.5, 0); tile.lineTo(x + 0.5, height);
      tile.strokePath();
    }

    // 작은 디테일(잔디 풀잎/돌 조각) — 무작위 배치
    const detail = this.add.graphics().setDepth(-29);
    detail.fillStyle(lighten(groundColor, 0.2), 0.55);
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const w = 2 + Math.random() * 3;
      const h = 1 + Math.random() * 2;
      detail.fillRect(x, y, w, h);
    }
    // 짙은 디테일
    detail.fillStyle(darken(groundColor, 0.4), 0.45);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      detail.fillCircle(x, y, 1 + Math.random() * 1.5);
    }

    // 위쪽 페이드 — 화면 위가 좀 더 어둡게 (원근감)
    const fade = this.add.graphics().setDepth(-28);
    fade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.45, 0.45, 0, 0);
    fade.fillRect(0, 0, width, 220);
  }

  // 좌우 돌담 — 아레나 경계
  drawSideWalls(width, height) {
    const g = this.add.graphics().setDepth(-25);
    const stoneCol = COLORS.groundStone;
    const stoneDk = 0x4a4d52;
    const wallW = 18;

    // 좌측
    g.fillStyle(stoneDk, 1);
    g.fillRect(0, 0, wallW, height);
    g.fillStyle(stoneCol, 1);
    g.fillRect(2, 0, wallW - 4, height);
    // 돌 시임
    g.lineStyle(1, stoneDk, 0.7);
    for (let y = 0; y < height; y += 28) {
      const off = (Math.floor(y / 28) % 2) * 6;
      g.beginPath();
      g.moveTo(2 + off, y + 0.5);
      g.lineTo(wallW - 2, y + 0.5);
      g.strokePath();
    }

    // 우측
    g.fillStyle(stoneDk, 1);
    g.fillRect(width - wallW, 0, wallW, height);
    g.fillStyle(stoneCol, 1);
    g.fillRect(width - wallW + 2, 0, wallW - 4, height);
    g.lineStyle(1, stoneDk, 0.7);
    for (let y = 0; y < height; y += 28) {
      const off = (Math.floor(y / 28) % 2) * 6;
      g.beginPath();
      g.moveTo(width - wallW + 2, y + 0.5);
      g.lineTo(width - 2 - off, y + 0.5);
      g.strokePath();
    }
  }
}
