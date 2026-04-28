// GameScene — 메인 플레이.
// Step 2: 잔디 배경 + 왕(기사) 배치 + 드래그 이동 + 화살 풀 + 자동 사격(테스트용 위 방향).
//         적이 아직 없으니 기본 조준은 "위쪽". Step 3에서 가장 가까운 적으로 교체.

import { COLORS, FONT, GAME, getStage } from '../config.js';
import { King } from '../entities/King.js';
import { Bullet, BULLET_KIND } from '../entities/Bullet.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';

const BULLET_POOL = 80;

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

    Audio.unlockOnFirstInput(this);

    // 배경 (잔디 타일 + 좌우 돌담)
    this.drawTileGround(width, height);
    this.drawSideWalls(width, height);

    // ── 임시 HUD ──
    const stageLabel = this.add.text(width / 2, 28, `STAGE ${stage.label} · ${stage.name}`, {
      fontFamily: FONT.mono,
      fontSize: '11px',
      fontStyle: '700',
      color: '#f4c542',
    }).setOrigin(0.5).setDepth(100);
    stageLabel.setLetterSpacing?.(3);

    // ── 풀: 화살 ──
    this.bullets = [];
    for (let i = 0; i < BULLET_POOL; i++) {
      const b = new Bullet(this);
      b.setDepth(40);
      this.bullets.push(b);
    }

    // ── 왕 배치 ──
    this.king = new King(this);
    this.king.setPosition(width / 2, GAME.kingY);
    this.king.setDepth(50);

    // 왕 위에 안내 텍스트 (Step 3에서 제거)
    this.helpText = this.add.text(width / 2, 540, '드래그로 이동 · 화살은 자동 발사', {
      fontFamily: FONT.body,
      fontSize: '13px',
      color: '#d9c897',
    }).setOrigin(0.5).setDepth(100).setAlpha(0.85);
    this.tweens.add({
      targets: this.helpText,
      alpha: { from: 0.85, to: 0.25 },
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    // ── 입력: 드래그 → 왕 이동 ──
    this.input.on('pointerdown', (p) => this.handlePointer(p));
    this.input.on('pointermove', (p) => {
      if (p.isDown) this.handlePointer(p);
    });
    const stopDrag = () => this.king.clearDragTarget();
    this.input.on('pointerup', stopDrag);
    this.input.on('pointerupoutside', stopDrag);

    // ── 발 밑 먼지 퍼프 (이동 시) ──
    this._dustTimer = 0;
    this._lastKingPos = { x: this.king.x, y: this.king.y };

    // BGM
    Audio.playBgm(stage.bgm, { fadeIn: 0.6, volume: 0.7 });
  }

  handlePointer(p) {
    // 드래그 위치를 왕 dragTarget으로 (Y는 하단 1/3 클램프)
    const [yMin, yMax] = GAME.dragYRange;
    const x = Phaser.Math.Clamp(p.x, 28, this.scale.width - 28);
    const y = Phaser.Math.Clamp(p.y, yMin, yMax);
    this.king.setDragTarget(x, y);
  }

  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);

    // 왕 업데이트 (이동 + 쿨다운)
    this.king.update(dt, this);

    // 발 밑 먼지 퍼프
    this._dustTimer -= dt;
    const dx = this.king.x - this._lastKingPos.x;
    const dy = this.king.y - this._lastKingPos.y;
    const moved = Math.hypot(dx, dy);
    if (moved > 1.0 && this._dustTimer <= 0) {
      this._dustTimer = 0.08;
      this.spawnDustPuff(this.king.x + (Math.random() - 0.5) * 12,
                        this.king.y + 24 + (Math.random() - 0.5) * 4);
    }
    this._lastKingPos.x = this.king.x;
    this._lastKingPos.y = this.king.y;

    // 자동 사격 — 가장 가까운 적이 없으니 일단 화면 위쪽으로
    // (Step 3에서 가까운 적 자동 추적으로 교체)
    const target = this.findFireTarget();
    this.king.tryFire(target.x, target.y, (sx, sy, ang, weapon) => {
      this.spawnArrow(sx, sy, ang, weapon);
    });

    // 화살 업데이트
    for (const b of this.bullets) {
      if (b.alive) b.update(dt, this);
    }
  }

  findFireTarget() {
    // Step 2: 위쪽으로 발사 — 화면 상단 중앙 가상 타겟
    return { x: this.king.x, y: -50 };
  }

  spawnArrow(x, y, angle, weapon) {
    const b = this.bullets.find(b => !b.alive);
    if (!b) return;
    b.reset(x, y, angle, BULLET_KIND.PLAYER, {
      damage: weapon.damage,
      pierce: weapon.pierce,
      splashRadius: weapon.splashRadius,
      crit: weapon.crit,
      speed: weapon.projectileSpeed,
    });
    Audio.tap();
  }

  spawnDustPuff(x, y) {
    const dust = this.add.circle(x, y, 3, COLORS.smokeGray, 0.7).setDepth(48);
    this.tweens.add({
      targets: dust,
      scale: { from: 1, to: 2.2 },
      alpha: { from: 0.7, to: 0 },
      y: y - 6,
      duration: 360,
      ease: 'Cubic.Out',
      onComplete: () => dust.destroy(),
    });
  }

  // ─────────── 배경 ───────────
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

    const tile = this.add.graphics().setDepth(-30);
    const cell = 64;
    tile.fillStyle(groundColor, 1);
    tile.fillRect(0, 0, width, height);

    tile.fillStyle(darken(groundColor, 0.1), 0.55);
    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        if (((x / cell) + (y / cell)) % 2 === 0) {
          tile.fillRect(x, y, cell, cell);
        }
      }
    }
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

    const detail = this.add.graphics().setDepth(-29);
    detail.fillStyle(lighten(groundColor, 0.2), 0.55);
    for (let i = 0; i < 80; i++) {
      detail.fillRect(Math.random() * width, Math.random() * height,
        2 + Math.random() * 3, 1 + Math.random() * 2);
    }
    detail.fillStyle(darken(groundColor, 0.4), 0.45);
    for (let i = 0; i < 40; i++) {
      detail.fillCircle(Math.random() * width, Math.random() * height,
        1 + Math.random() * 1.5);
    }

    const fade = this.add.graphics().setDepth(-28);
    fade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.45, 0.45, 0, 0);
    fade.fillRect(0, 0, width, 220);
  }

  drawSideWalls(width, height) {
    const g = this.add.graphics().setDepth(-25);
    const stoneCol = COLORS.groundStone;
    const stoneDk = 0x4a4d52;
    const wallW = 18;

    g.fillStyle(stoneDk, 1);
    g.fillRect(0, 0, wallW, height);
    g.fillStyle(stoneCol, 1);
    g.fillRect(2, 0, wallW - 4, height);
    g.lineStyle(1, stoneDk, 0.7);
    for (let y = 0; y < height; y += 28) {
      const off = (Math.floor(y / 28) % 2) * 6;
      g.beginPath();
      g.moveTo(2 + off, y + 0.5);
      g.lineTo(wallW - 2, y + 0.5);
      g.strokePath();
    }

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
