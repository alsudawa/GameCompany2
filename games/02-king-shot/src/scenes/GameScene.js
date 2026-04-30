// GameScene — 아레나 형식 King Shot.
// 단일 화면, 영웅이 자유 2D 이동, 적이 가장자리에서 등장, 업그레이드 패드를 밟아 강해짐.

import { COLORS, FONT, GAME, KEY, TILE, UPGRADE_TYPES } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { getLevel, PAD_SLOTS_DATA } from '../maps/levels.js';
import { King } from '../entities/King.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { UpgradePad } from '../entities/UpgradePad.js';

const ENEMY_POOL = 80;
const PROJECTILE_POOL = 120;
const TILE_PX = 32;

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

    // 1) 잔디 배경 + 가장자리 장식
    this.drawArenaBackground(width, height);
    this.drawArenaBorders(width, height);

    // 2) 풀
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
    this.pads = [];

    // 3) 영웅 (화면 가운데 약간 아래)
    this.king = new King(this);
    this.king.setPosition(width / 2, height * 0.65);
    this.king.setDepth(80);

    // 4) 상태
    this.score = 0;
    this.kills = 0;
    this.coinsEarned = 0;
    this.waveIdx = -1;
    this.waveActive = false;
    this.spawnQueue = [];
    this.spawnElapsed = 0;
    this.boss = null;
    this.isPlaying = false;
    this.isOver = false;

    // 5) 입력 — 드래그로 영웅 이동 (자유 2D)
    this.input.on('pointerdown', (p) => this.onPointer(p));
    this.input.on('pointermove', (p) => { if (p.isDown) this.onPointer(p); });
    const release = () => this.king.clearDragTarget();
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // 6) HUD + START WAVE
    this.drawHud();
    this.makeWaveButton();

    Audio.playBgm('stage_dawn', { fadeIn: 0.6, volume: 0.55 });
    this.runCountdown();
  }

  onPointer(p) {
    const x = Phaser.Math.Clamp(p.x, 30, this.scale.width - 30);
    const y = Phaser.Math.Clamp(p.y, 100, this.scale.height - 100);
    this.king.setDragTarget(x, y);
  }

  runCountdown() {
    const big = this.add.text(this.scale.width / 2, this.scale.height / 2, '3', {
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

  update(time, delta) {
    if (!this.isPlaying || this.isOver) return;
    const dt = Math.min(0.05, delta / 1000);

    this.king.update(dt, this);

    // 웨이브 스폰
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnElapsed += dt;
      while (this.spawnQueue.length > 0 && this.spawnQueue[0].t <= this.spawnElapsed) {
        const item = this.spawnQueue.shift();
        this.spawnEnemy(item.kind);
      }
    }

    // 적 업데이트 + 영웅 충돌
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.update(dt, this.king.x, this.king.y);
      const dx = e.x - this.king.x;
      const dy = e.y - this.king.y;
      const r = e.hitRadius + this.king.hitRadius;
      if (dx*dx + dy*dy < r*r && e.touchCooldown <= 0) {
        e.touchCooldown = 0.6;
        this.damageKing(e.damage);
      }
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

    // 패드 픽업
    for (let i = this.pads.length - 1; i >= 0; i--) {
      const pad = this.pads[i];
      if (pad.consumed) { this.pads.splice(i, 1); continue; }
      if (pad.contains(this.king.x, this.king.y)) {
        const info = pad.consume();
        if (info) this.applyUpgrade(info);
        this.pads.splice(i, 1);
      }
    }

    // 웨이브 종료 판정 (스폰 큐 비고 살아있는 적 0)
    if (this.waveActive && this.spawnQueue.length === 0 &&
        !this.enemies.some(e => e.alive)) {
      this.endWave();
    }
  }

  drawArenaBackground(width, height) {
    const tint = this.level.groundTint ?? 0xffffff;
    const ts = TILE_PX;
    const scale = ts / GAME.spriteTile;
    for (let y = 0; y < height; y += ts) {
      for (let x = 0; x < width; x += ts) {
        const tile = (Math.random() < 0.85) ? TILE.GRASS : TILE.GRASS_PLAIN;
        const img = this.add.image(x, y, KEY.tilesheet, tile)
          .setOrigin(0).setScale(scale).setDepth(0);
        if (tint !== 0xffffff) img.setTint(tint);
      }
    }
  }

  // ────────────── 웨이브 ──────────────
  startNextWave() {
    if (this.waveActive) return;
    this.waveIdx++;
    const wave = this.level.waves[this.waveIdx];
    if (!wave) return;
    this.waveActive = true;
    this.spawnElapsed = 0;
    // 스폰 큐 빌드
    this.spawnQueue = [];
    let baseT = 0;
    for (const [kind, count, interval] of wave.spawn) {
      for (let i = 0; i < count; i++) {
        this.spawnQueue.push({ t: baseT + i * interval, kind });
      }
      baseT += count * interval;
    }
    this.spawnQueue.sort((a, b) => a.t - b.t);

    // 패드 즉시 등장
    for (const padInfo of (wave.pads ?? [])) {
      const slot = PAD_SLOTS_DATA[padInfo.slot] ?? PAD_SLOTS_DATA[0];
      const pad = new UpgradePad(this, slot.x, slot.y, padInfo);
      pad.setDepth(40);
      this.pads.push(pad);
    }

    // 배너
    Audio.levelUp();
    const big = this.add.text(this.scale.width / 2, this.scale.height / 2 - 60,
      wave.label, {
        fontFamily: FONT.display, fontSize: '34px', fontStyle: '900',
        color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(600).setLetterSpacing?.(4);
    this.tweens.add({
      targets: big, scale: { from: 1.5, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 360, ease: 'Back.Out',
    });
    this.tweens.add({
      targets: big, alpha: 0, y: big.y - 30,
      delay: 800, duration: 320, onComplete: () => big.destroy(),
    });

    if (this.waveBtn) this.waveBtn.setVisible(false);
    this.updateHud();
  }

  endWave() {
    this.waveActive = false;
    Audio.fanfare();
    Juice.flash(this, COLORS.goldHud, 200);

    if (this.waveIdx >= this.level.waves.length - 1) {
      this.victory();
    } else {
      if (this.waveBtn) this.waveBtn.setVisible(true);
      // 보너스 코인
      this.coinsEarned += 30;
      Juice.popText(this, this.scale.width / 2, this.scale.height / 2 - 20,
        '+30 COINS', { color: COLORS.goldHud, size: 18 });
      this.updateHud();
    }
  }

  spawnEnemy(kind) {
    const e = this.enemies.find(en => !en.alive);
    if (!e) return;
    // 가장자리에서 등장
    const w = this.scale.width, h = this.scale.height;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0)      { x = Math.random() * w; y = -30; }
    else if (side === 1) { x = w + 30;            y = 100 + Math.random() * (h - 200); }
    else if (side === 2) { x = Math.random() * w; y = h + 30; }
    else                  { x = -30;              y = 100 + Math.random() * (h - 200); }
    if (kind === 'boss') { x = w / 2; y = -60; this.boss = e; }
    e.reset(kind, x, y, this.hpMul);
  }

  // ────────────── 사격/충돌 ──────────────
  findFireTarget() {
    let best = null;
    let bestD = this.king.weapon.range * this.king.weapon.range;
    for (const e of this.enemies) {
      if (!e.alive) continue;
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
      'archer', { damage: weapon.damage, speed: weapon.projectileSpeed });
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
    Juice.popText(this, e.x, e.y - 14, `+${e.bounty}`, {
      color: 0xf4c542, size: 12, rise: 24, duration: 380,
    });
    if (e === this.boss) this.boss = null;
    this.updateHud();
  }

  damageKing(n) {
    if (!this.king.takeDamage(n)) return;
    Juice.flash(this, COLORS.capeRed, 200);
    Juice.shake(this, 0.014, 200);
    Audio.miss();
    this.updateHud();
    if (this.king.hp <= 0) this.gameOver();
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

  drawArenaBorders(width, height) {
    // 가장자리에 장식 (트리/락)
    const types = [TILE.TREE, TILE.TREE_PINE, TILE.BUSH, TILE.ROCK_SMALL, TILE.ROCK_LARGE];
    const placeRow = (y, count) => {
      for (let i = 0; i < count; i++) {
        const x = 20 + (i / count) * (width - 40) + (Math.random() - 0.5) * 18;
        const t = types[Math.floor(Math.random() * types.length)];
        this.add.image(x, y, KEY.tilesheet, t)
          .setScale(TILE_PX / GAME.spriteTile * (0.85 + Math.random() * 0.4))
          .setDepth(20);
      }
    };
    placeRow(70, 8);
    placeRow(height - 60, 7);
    for (let i = 0; i < 6; i++) {
      const y = 130 + i * (height - 230) / 6 + (Math.random() - 0.5) * 24;
      const t = types[Math.floor(Math.random() * types.length)];
      this.add.image(16 + Math.random() * 8, y, KEY.tilesheet, t)
        .setScale(TILE_PX / GAME.spriteTile * (0.85 + Math.random() * 0.4)).setDepth(20);
      this.add.image(width - 16 - Math.random() * 8, y, KEY.tilesheet, t)
        .setScale(TILE_PX / GAME.spriteTile * (0.85 + Math.random() * 0.4)).setDepth(20);
    }
  }

  // ────────────── HUD ──────────────
  drawHud() {
    const { width } = this.scale;
    const bar = this.add.graphics().setDepth(100);
    bar.fillStyle(0x000000, 0.55);
    bar.fillRect(0, 0, width, 50);
    bar.fillStyle(COLORS.goldHud, 0.6);
    bar.fillRect(0, 48, width, 2);

    this.add.image(20, 25, KEY.tilesheet, TILE.COIN_GOLD)
      .setScale(0.45).setDepth(101);
    this.hudCoins = this.add.text(38, 16, '0', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0, 0).setDepth(101);

    this.add.text(width / 2, 8, this.level.name, {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#d9c897',
    }).setOrigin(0.5, 0).setDepth(101).setLetterSpacing?.(3);
    this.hudWave = this.add.text(width / 2, 22, 'PRESS START', {
      fontFamily: FONT.display, fontSize: '16px', fontStyle: '900',
      color: '#f0e6d0', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(101).setLetterSpacing?.(2);

    this.hudHp = this.add.text(width - 20, 16, '♥ 5', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#ff6b6b', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(101);

    this.updateHud();
  }

  updateHud() {
    if (!this.hudCoins) return;
    this.hudCoins.setText(String(this.coinsEarned));
    this.hudHp.setText('♥ ' + this.king.hp);
    if (this.waveActive) {
      this.hudWave.setText(this.level.waves[this.waveIdx]?.label ?? '');
      this.hudWave.setColor('#f4c542');
    } else if (this.waveIdx >= this.level.waves.length - 1) {
      this.hudWave.setText('CLEARED');
    } else if (this.waveIdx >= 0) {
      this.hudWave.setText('CLEAR · NEXT?');
      this.hudWave.setColor('#9ad0a0');
    } else {
      this.hudWave.setText('PRESS START');
    }
  }

  makeWaveButton() {
    const w = 180, h = 44;
    const cx = this.scale.width / 2;
    const cy = this.scale.height - 36;
    const c = this.add.container(cx, cy).setDepth(120);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w, h, 6);
    bg.fillStyle(COLORS.capeRed, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.fillStyle(COLORS.capeRedDk, 1);
    bg.fillRoundedRect(-w / 2, h / 2 - 5, w, 5, 6);
    bg.lineStyle(2, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(1, COLORS.goldHud, 0.9);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 5);
    c.add(bg);
    const t = this.add.text(0, 0, '⚔ START WAVE', {
      fontFamily: FONT.display, fontSize: '17px', fontStyle: '900',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5).setLetterSpacing?.(3);
    c.add(t);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.06, duration: 140 }));
    c.on('pointerout',  () => this.tweens.add({ targets: c, scale: 1, duration: 140 }));
    c.on('pointerdown', (p, lx, ly, evt) => {
      evt.stopPropagation?.();
      Audio.purchase();
      this.startNextWave();
    });
    this.waveBtn = c;
    this.tweens.add({
      targets: c, scale: { from: 1, to: 1.04 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  // ────────────── 승/패 ──────────────
  victory() {
    if (this.isOver) return;
    this.isOver = true;
    Audio.fanfare();
    Juice.slowmo(this, 0.4, 800);
    Juice.flash(this, COLORS.goldHud, 380);
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
    Juice.flash(this, COLORS.capeRed, 480);
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
}
