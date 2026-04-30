// GameScene — 정통 King Shot 스타일.
// 영웅이 자동 전진하며 드래그로 X 이동 + 자동 사격, 길에서 적 + 업그레이드 게이트.

import { COLORS, FONT, GAME, KEY, TILE, UPGRADE_TYPES } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { getLevel } from '../maps/levels.js';
import { King } from '../entities/King.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { Gate } from '../entities/Gate.js';

const ENEMY_POOL = 80;
const PROJECTILE_POOL = 120;
const TILE_PX = 32;       // 화면에 렌더되는 타일 크기

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.level = getLevel(data?.levelId);
    this.hpMul = this.level.hpMul ?? 1;
  }

  create() {
    const { width, height } = this.scale;
    Audio.unlockOnFirstInput(this);
    this.cameras.main.setBackgroundColor('#3a7d44');
    this.cameras.main.fadeIn(280, 0, 0, 0);

    // 1) 스크롤 배경
    this.buildBackground(width, height);

    // 2) 사이드 장식 (월드 Y에 위치)
    this.buildSideDecorations();

    // 3) 풀
    this.enemies = [];
    for (let i = 0; i < ENEMY_POOL; i++) {
      const e = new Enemy(this);
      e.setDepth(50);
      this.enemies.push(e);
    }
    this.projectiles = [];
    for (let i = 0; i < PROJECTILE_POOL; i++) {
      const p = new Projectile(this);
      p.setDepth(60);
      this.projectiles.push(p);
    }
    this.gates = [];   // 사전 생성된 게이트들

    // 4) 영웅 (화면 고정 Y)
    this.king = new King(this);
    this.king.setPosition(width / 2, GAME.heroScreenY);
    this.king.setDepth(80);

    // 5) 게이트 사전 생성 (event queue에서 분리)
    for (const ev of this.level.events) {
      if (ev.kind === 'gate') {
        this.spawnGate(ev.y, ev.left, ev.right);
      }
    }
    this.eventQueue = this.level.events.filter(ev => ev.kind !== 'gate');

    // 6) 상태
    this.kingWorldY = 0;
    this.score = 0;
    this.kills = 0;
    this.coinsEarned = 0;
    this.gemsEarned = 0;
    this.boss = null;
    this.isPlaying = false;
    this.isOver = false;

    // 6) 입력
    this._lastPointerX = null;
    this.input.on('pointerdown', (p) => this.onPointer(p));
    this.input.on('pointermove', (p) => { if (p.isDown) this.onPointer(p); });
    const release = () => { this.king.clearDragTarget(); this._lastPointerX = null; };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // 7) HUD
    this.drawHud();

    // 8) 카운트다운
    this.runCountdown();

    Audio.playBgm(this.level.bgm ?? 'stage_dawn', { fadeIn: 0.6, volume: 0.55 });
  }

  onPointer(p) {
    const x = Phaser.Math.Clamp(p.x, GAME.heroDragXMin, GAME.heroDragXMax);
    this.king.setDragTargetX(x);
  }

  runCountdown() {
    const { width, height } = this.scale;
    const big = this.add.text(width / 2, height / 2, '3', {
      fontFamily: FONT.display, fontSize: '120px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(500);
    let n = 3;
    const tick = () => {
      big.setText(n > 0 ? String(n) : 'GO!');
      this.tweens.add({
        targets: big, scale: { from: 1.4, to: 1 }, alpha: { from: 1, to: 0 },
        duration: 700, ease: 'Cubic.Out',
        onComplete: () => {
          if (n <= 0) { big.destroy(); this.isPlaying = true; return; }
          n--; tick();
        },
      });
    };
    tick();
  }

  // ────────────── 사격/충돌 ──────────────
  findFireTarget() {
    let best = null;
    let bestD = this.king.weapon.range * this.king.weapon.range;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      // 화면 안 + 영웅 위쪽 적만
      if (e.y < -40 || e.y > this.scale.height + 40) continue;
      const dx = e.x - this.king.x;
      const dy = e.y - this.king.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  spawnArrow(x, y, angle, weapon) {
    const p = this.projectiles.find(pr => !pr.alive);
    if (!p) return;
    p.reset(x, y, { x: x + Math.cos(angle) * 100, y: y + Math.sin(angle) * 100 },
      'archer', {
        damage: weapon.damage,
        speed: weapon.projectileSpeed,
      });
    Audio.tap();
  }

  checkProjectileVsEnemies(p) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const r = e.hitRadius + 8;
      if (dx * dx + dy * dy < r * r) {
        const killed = e.takeDamage(p.dmg);
        Juice.spark(this, p.x, p.y, 0xfff4a0, 12);
        if (killed) this.onEnemyKilled(e);
        p.deactivate();
        return;
      }
    }
  }

  onEnemyKilled(e) {
    this.score += e.scoreVal;
    this.kills++;
    this.coinsEarned += e.bounty;
    Juice.popText(this, e.x, e.y - 18, `+${e.bounty}`, {
      color: 0xf4c542, size: 12, rise: 26, duration: 400,
    });
    this.updateHud();
  }

  damageKing(n) {
    if (!this.king.takeDamage(n)) return;
    Juice.flash(this, 0xc8302d, 200);
    Juice.shake(this, 0.014, 200);
    Audio.miss();
    this.updateHud();
    if (this.king.hp <= 0) this.gameOver();
  }

  // ────────────── HUD ──────────────
  drawHud() {
    const { width } = this.scale;
    const bar = this.add.graphics().setDepth(100);
    bar.fillStyle(0x000000, 0.55);
    bar.fillRect(0, 0, width, 50);
    bar.fillStyle(0xf4c542, 0.6);
    bar.fillRect(0, 48, width, 2);

    // 좌측 — SCORE
    this.add.text(18, 8, 'SCORE', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#d9c897',
    }).setDepth(101).setLetterSpacing?.(2);
    this.hudScore = this.add.text(18, 22, '0', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 3,
    }).setDepth(101);

    // 중앙 — 레벨 이름 + 진행도 바
    this.add.text(width / 2, 8, this.level.name, {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#d9c897',
    }).setOrigin(0.5, 0).setDepth(101).setLetterSpacing?.(3);
    this.progBg = this.add.graphics().setDepth(101);
    this.progFill = this.add.graphics().setDepth(102);

    // 우측 — HP 하트
    this.hudHp = this.add.text(width - 18, 22, '♥ ♥ ♥', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#ff6b6b', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(101);

    this.updateHud();
  }

  updateHud() {
    if (!this.hudScore) return;
    this.hudScore.setText(this.score.toLocaleString());
    // HP 하트
    const hearts = '♥ '.repeat(this.king.hp).trim() || '·';
    this.hudHp.setText(hearts);
    // 진행도 바
    const w = 120, h = 8;
    const px = this.scale.width / 2 - w / 2;
    const py = 28;
    this.progBg.clear();
    this.progBg.fillStyle(0x000000, 0.6);
    this.progBg.fillRoundedRect(px - 1, py - 1, w + 2, h + 2, 4);
    this.progBg.fillStyle(0x3e2e1e, 1);
    this.progBg.fillRoundedRect(px, py, w, h, 3);
    this.progFill.clear();
    const ratio = Phaser.Math.Clamp(this.kingWorldY / this.level.length, 0, 1);
    this.progFill.fillStyle(0xf4c542, 1);
    this.progFill.fillRoundedRect(px, py, w * ratio, h, 3);
  }

  // ────────────── 승/패 ──────────────
  victory() {
    if (this.isOver) return;
    this.isOver = true;
    Audio.fanfare();
    Juice.slowmo(this, 0.4, 800);
    Juice.flash(this, 0xf4c542, 380);
    const big = this.add.text(this.scale.width / 2, this.scale.height / 2, 'VICTORY', {
      fontFamily: FONT.display, fontSize: '54px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(700).setLetterSpacing?.(6);
    this.tweens.add({
      targets: big, scale: { from: 1.8, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 460, ease: 'Back.Out',
    });
    this.time.delayedCall(2400, () => this.endSession({ victory: true }));
  }

  gameOver() {
    if (this.isOver) return;
    this.isOver = true;
    Audio.bomb();
    Juice.shake(this, 0.03, 500);
    Juice.flash(this, 0xc8302d, 480);
    const big = this.add.text(this.scale.width / 2, this.scale.height / 2, 'DEFEATED', {
      fontFamily: FONT.display, fontSize: '46px', fontStyle: '900',
      color: '#c8302d', stroke: '#3e2e1e', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(700).setLetterSpacing?.(5);
    this.tweens.add({
      targets: big, scale: { from: 1.6, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 460, ease: 'Back.Out',
    });
    this.time.delayedCall(2400, () => this.endSession({ victory: false }));
  }

  endSession({ victory }) {
    Audio.stopBgm({ fadeOut: 0.6 });
    const profile = Storage.load();
    const stageKey = `king-shot-${this.level.id}`;
    const prevBest = profile.bestScores?.[stageKey] || 0;
    const isBest = Storage.setBestScore(stageKey, this.score);
    Storage.setBestScore('king-shot', this.score);
    if (this.coinsEarned > 0) Storage.addCoins(this.coinsEarned);
    const bonusGems = victory ? 3 : 0;
    if (bonusGems) Storage.addGems(bonusGems);
    Analytics.track('session_end', {
      game: 'king-shot', stage: this.level.id,
      score: this.score, kills: this.kills, victory, isBest,
    });
    this.cameras.main.fadeOut(420, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ResultScene', {
        victory, score: this.score, kills: this.kills,
        bestScore: Math.max(prevBest, this.score),
        isBest, stageId: this.level.id,
        coinsEarned: this.coinsEarned, gemsEarned: bonusGems,
      });
    });
  }

  // worldY → 화면 Y 변환.
  // worldY가 영웅보다 크면(앞쪽=레벨 후반) 화면 위쪽(작은 Y)에 표시.
  worldToScreen(worldY) {
    return GAME.heroScreenY - (worldY - this.kingWorldY);
  }

  // ────────────── 배경 ──────────────
  buildBackground(width, height) {
    // 28 rows × cols 잔디 타일 — wrap-around treadmill (컨테이너 Y만 modulo로 이동)
    this.bgContainer = this.add.container(0, 0);
    this.bgContainer.setDepth(-30);
    const cols = Math.ceil(width / TILE_PX);
    const rows = Math.ceil(height / TILE_PX) + 4;
    const tint = this.level.groundTint ?? 0xffffff;
    this.bgRowsCount = rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = (Math.random() < 0.85) ? TILE.GRASS : TILE.GRASS_PLAIN;
        const img = this.add.image(c * TILE_PX, r * TILE_PX - TILE_PX * 2,
          KEY.tilesheet, tile).setOrigin(0).setScale(TILE_PX / GAME.spriteTile);
        if (tint !== 0xffffff) img.setTint(tint);
        this.bgContainer.add(img);
      }
    }
  }

  scrollBackground() {
    // king worldY가 증가하면 배경이 위로 스크롤되어야 함 (적이 위에서 내려오는 효과)
    // bgContainer를 음의 방향으로 이동 modulo TILE_PX
    const offset = this.kingWorldY % TILE_PX;
    this.bgContainer.y = -offset;
  }

  buildSideDecorations() {
    // 좌우 가장자리에 장식을 무작위 worldY에 배치
    this.sideDeco = [];
    const len = this.level.length;
    const types = [TILE.TREE, TILE.TREE_PINE, TILE.BUSH, TILE.ROCK_SMALL, TILE.ROCK_LARGE];
    let y = 100;
    while (y < len + 200) {
      const sideLeft = Math.random() < 0.5;
      const x = sideLeft ? 12 + Math.random() * 24 : (this.scale.width - 12 - Math.random() * 24);
      const type = types[Math.floor(Math.random() * types.length)];
      const img = this.add.image(x, this.worldToScreen(y), KEY.tilesheet, type)
        .setScale(TILE_PX / GAME.spriteTile * (0.9 + Math.random() * 0.4))
        .setDepth(-25);
      this.sideDeco.push({ obj: img, worldY: y });
      y += 80 + Math.random() * 140;
    }
  }

  // ────────────── 이벤트 ──────────────
  handleEvent(ev) {
    if (ev.kind === 'spawn') {
      this.spawnEnemyGroup(ev.enemies);
    } else if (ev.kind === 'boss') {
      this.spawnBoss(ev.enemyKind ?? 'boss');
    }
    // 'gate' 이벤트는 create()에서 사전 처리됨
  }

  spawnEnemyGroup(groups) {
    // groups: [['soldier', 4], ['scout', 2]]
    let delay = 0;
    for (const [kind, count] of groups) {
      for (let i = 0; i < count; i++) {
        this.time.delayedCall(delay * 1000, () => {
          const e = this.enemies.find(en => !en.alive);
          if (!e) return;
          // 화면 위쪽(영웅 앞)에서 등장 — worldY는 영웅보다 큼
          const x = 60 + Math.random() * (this.scale.width - 120);
          const worldY = this.kingWorldY + 600 + Math.random() * 80;
          e.reset(kind, x, worldY, this.hpMul);
        });
        delay += 0.18;
      }
    }
  }

  spawnGate(worldY, left, right) {
    const g = new Gate(this, worldY, left, right);
    g.x = this.scale.width / 2;
    g.y = this.worldToScreen(worldY);
    this.gates.push(g);
  }

  spawnBoss(kind) {
    const e = this.enemies.find(en => !en.alive);
    if (!e) return;
    const x = this.scale.width / 2;
    const worldY = this.kingWorldY + 600;
    e.reset(kind, x, worldY, this.hpMul);
    this.boss = e;
    Audio.fanfare();
    Juice.flash(this, 0xc8302d, 360);
    Juice.shake(this, 0.022, 360);
    const t = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BOSS', {
      fontFamily: FONT.display, fontSize: '88px', fontStyle: '900',
      color: '#c8302d', stroke: '#3e2e1e', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(700).setLetterSpacing?.(8);
    this.tweens.add({
      targets: t, scale: { from: 1.8, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 360, ease: 'Back.Out',
    });
    this.tweens.add({
      targets: t, alpha: 0, y: t.y - 30,
      delay: 900, duration: 360, onComplete: () => t.destroy(),
    });
  }

  applyUpgrade(info) {
    const cfg = UPGRADE_TYPES[info.type];
    if (!cfg) return;
    cfg.apply(this.king.weapon, info.value, this.king);
    Audio.purchase();
    Juice.flash(this, cfg.color, 200);
    Juice.ring(this, this.king.x, this.king.y,
      { color: cfg.color, radius: 130, duration: 460, count: 2 });
    Juice.popText(this, this.king.x, this.king.y - 40, info.label ?? cfg.glyph,
      { color: cfg.color, size: 22, rise: 50, duration: 700 });
  }

  update(time, delta) {
    if (!this.isPlaying || this.isOver) return;
    const dt = Math.min(0.05, delta / 1000);

    // 영웅 worldY 자동 전진 (레벨 끝까지)
    if (this.kingWorldY < this.level.length) {
      this.kingWorldY += GAME.scrollSpeed * dt;
    }

    // 영웅 이동/쿨다운
    this.king.update(dt, this);

    // 배경 스크롤
    this.scrollBackground();

    // 사이드 장식 위치 갱신
    for (const d of this.sideDeco) {
      d.obj.y = this.worldToScreen(d.worldY);
    }

    // 이벤트 트리거 (worldY 도달 시)
    while (this.eventQueue.length > 0 && this.eventQueue[0].y <= this.kingWorldY) {
      const ev = this.eventQueue.shift();
      this.handleEvent(ev);
    }

    // 적 업데이트 + 영웅 충돌
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.update(dt, this.king.x, this.kingWorldY);
      e.y = this.worldToScreen(e.worldY);
      const dx = e.x - this.king.x;
      const dy = e.y - this.king.y;
      const r = e.hitRadius + this.king.hitRadius;
      if (dx*dx + dy*dy < r*r && e.touchCooldown <= 0) {
        e.touchCooldown = 0.6;
        this.damageKing(e.damage);
        e.takeDamage(99999);   // 접촉한 적은 사라짐 (BOSS 제외)
      }
      // 화면 밖 (아래)으로 빠진 적은 비활성
      if (e.y > this.scale.height + 80) e.alive = false, e.setVisible(false).setActive(false);
    }

    // 자동 사격
    const target = this.findFireTarget();
    this.king.tryFire(target, (sx, sy, ang, w) => this.spawnArrow(sx, sy, ang, w));

    // 발사체
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.update(dt, this);
      if (p.alive) this.checkProjectileVsEnemies(p);
    }

    // 게이트
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      if (g.consumed) { this.gates.splice(i, 1); continue; }
      g.y = this.worldToScreen(g.worldY);
      // 영웅이 게이트 worldY를 지나갔으면 통과
      if (this.kingWorldY >= g.worldY) {
        const side = g.whichSide(this.king.x);
        const chosen = g.consume(side);
        if (chosen) this.applyUpgrade(chosen);
      }
    }

    // 보스 처치 시 victory
    if (this.boss && !this.boss.alive) {
      this.boss = null;
      this.victory();
    }

    // 레벨 끝 + 보스 없으면 빠져나감
    if (this.kingWorldY >= this.level.length && !this.boss && this.eventQueue.length === 0) {
      // 끝까지 도달했지만 보스 처치된 후만 victory
    }
  }
}
