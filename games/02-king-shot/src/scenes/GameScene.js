// GameScene — TD Step 2: 타일맵 렌더 + 경로 시각화 + 슬롯 표시.
// (Step 3에서 적/웨이브, Step 4에서 타워 배치를 붙임)

import { COLORS, FONT, GAME, KEY, TILE } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { STAGE_GATE } from '../maps/stage_gate.js';
import { buildPath, tilesAlongPath, tilePxCenter } from '../maps/path.js';

const STAGES = { gate: STAGE_GATE };

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.stage = STAGES[data?.stageId] ?? STAGE_GATE;
  }

  create() {
    const { width, height } = this.scale;
    Audio.unlockOnFirstInput(this);

    this.cameras.main.setBackgroundColor('#3a7d44');
    this.cameras.main.fadeIn(280, 0, 0, 0);

    // 1) 잔디 베이스
    this.drawGrass();

    // 2) 길 (PATH 타일)
    this.pathTiles = tilesAlongPath(this.stage.pathWaypoints);
    this.drawPath();

    // 3) 장식
    this.drawDecorations();

    // 4) 타워 슬롯
    this.drawTowerSlots();

    // 5) 길 폴리라인 시각화 (디버그용 옅은 라인) — Step 3 적 이동 디버그에 도움
    this.path = buildPath(this.stage.pathWaypoints);
    this.drawPathOverlay();

    // 6) 시작/끝 마커
    this.drawSpawnAndKing();

    // 7) HUD (자리만)
    this.drawHud();

    // 임시 BACK 버튼
    this.makeBackBtn(width, height);

    Audio.playBgm('stage_dawn', { fadeIn: 0.6, volume: 0.55 });
  }

  // ────────────── 렌더 헬퍼 ──────────────
  drawGrass() {
    const ts = GAME.tileSize;
    const scale = ts / GAME.spriteTile;
    const cols = this.stage.cols;
    const rows = this.stage.rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = (Math.random() < 0.85) ? TILE.GRASS : TILE.GRASS_PLAIN;
        this.add.image(c * ts, r * ts, KEY.tilesheet, tile)
          .setOrigin(0).setScale(scale).setDepth(0);
      }
    }
  }

  drawPath() {
    const ts = GAME.tileSize;
    const scale = ts / GAME.spriteTile;
    for (const [c, r] of this.pathTiles) {
      // 화면 밖 (-1 / cols / rows 같은) 좌표는 그리지 않음
      if (c < 0 || r < 0 || c >= this.stage.cols || r >= this.stage.rows) continue;
      this.add.image(c * ts, r * ts, KEY.tilesheet, TILE.PATH)
        .setOrigin(0).setScale(scale).setDepth(1);
    }
  }

  drawDecorations() {
    const ts = GAME.tileSize;
    const scale = ts / GAME.spriteTile;
    const map = {
      TREE: TILE.TREE, TREE_PINE: TILE.TREE_PINE, BUSH: TILE.BUSH,
      ROCK_SMALL: TILE.ROCK_SMALL, ROCK_LARGE: TILE.ROCK_LARGE,
    };
    for (const [c, r, kind] of (this.stage.decorations || [])) {
      const tileId = map[kind];
      if (tileId == null) continue;
      const img = this.add.image(c * ts + ts / 2, r * ts + ts / 2,
        KEY.tilesheet, tileId).setScale(scale).setDepth(20);
      // 미세 펄스
      this.tweens.add({
        targets: img, scale: scale * 1.04,
        duration: 1400 + Math.random() * 800,
        yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
    }
  }

  drawTowerSlots() {
    const ts = GAME.tileSize;
    const scale = ts / GAME.spriteTile;
    this.slotImages = [];
    for (const [c, r] of (this.stage.towerSlots || [])) {
      const px = c * ts + ts / 2;
      const py = r * ts + ts / 2;
      const img = this.add.image(px, py, KEY.tilesheet, TILE.SLOT)
        .setScale(scale).setDepth(15).setAlpha(0.9);
      // 미묘한 호버 펄스 (Step 4에서 인터랙션 추가)
      this.tweens.add({
        targets: img,
        alpha: { from: 0.9, to: 0.6 },
        duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
      this.slotImages.push(img);
    }
  }

  drawPathOverlay() {
    // 디버그: 폴리라인 옅게 그리기 (Step 3에서 OFF 토글 추가)
    const g = this.add.graphics().setDepth(2);
    g.lineStyle(3, 0xffffff, 0.06);
    const pts = this.path.pts;
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.strokePath();
  }

  drawSpawnAndKing() {
    const ts = GAME.tileSize;
    // 시작점: 위쪽 화면 밖에서 진입 — 첫 화면 안 셀에 작은 화살표
    const start = this.stage.pathWaypoints[1];
    const sx = start[0] * ts + ts / 2;
    const sy = 6;
    const arrow = this.add.graphics().setDepth(25);
    arrow.fillStyle(0xff5050, 0.85);
    arrow.fillTriangle(sx - 8, sy, sx + 8, sy, sx, sy + 12);
    this.tweens.add({
      targets: arrow, alpha: { from: 1, to: 0.4 },
      duration: 700, yoyo: true, repeat: -1,
    });

    // 끝점 (왕): 마지막 웨이포인트 직전에 작은 캐슬 (단순 도형)
    const last = this.stage.pathWaypoints[this.stage.pathWaypoints.length - 2];
    const cx = last[0] * ts + ts / 2;
    const cy = last[1] * ts + ts / 2;
    const cg = this.add.graphics().setDepth(25);
    // 성문 — 사각 + 골드 디테일
    cg.fillStyle(0x000000, 0.45);
    cg.fillRoundedRect(cx - 24, cy - 18, 48, 40, 6);
    cg.fillStyle(0x5a5a55, 1);
    cg.fillRoundedRect(cx - 22, cy - 18, 44, 38, 5);
    cg.fillStyle(0x3e2e1e, 1);
    cg.fillRoundedRect(cx - 10, cy - 6, 20, 18, 3);
    cg.fillStyle(0xf4c542, 1);
    cg.fillTriangle(cx - 22, cy - 18, cx - 14, cy - 26, cx - 6, cy - 18);
    cg.fillTriangle(cx + 6, cy - 18, cx + 14, cy - 26, cx + 22, cy - 18);
  }

  // ────────────── HUD ──────────────
  drawHud() {
    const { width } = this.scale;
    // 상단 배너
    const bar = this.add.graphics().setDepth(100);
    bar.fillStyle(0x000000, 0.5);
    bar.fillRect(0, 0, width, 6);
    // 스테이지명
    const name = this.add.text(width / 2, 14, this.stage.name, {
      fontFamily: FONT.display, fontSize: '14px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(101);
    name.setLetterSpacing?.(3);
  }

  makeBackBtn(width, height) {
    const back = this.add.text(width - 18, height - 18, '◂ BACK', {
      fontFamily: FONT.mono, fontSize: '12px', fontStyle: '700',
      color: '#f4c542', backgroundColor: '#3e2e1e', padding: { x: 8, y: 4 },
    }).setOrigin(1).setDepth(101).setLetterSpacing?.(2);
    back.setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }
}
