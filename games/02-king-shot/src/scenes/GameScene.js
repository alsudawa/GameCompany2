// GameScene — 하이브리드 King Shot.
// 영웅이 자유 2D 이동 + 자동 사격, 경로 적이 왕좌로 진군, 영웅이 슬롯 위에 서서 타워 빌드,
// 적 처치 시 코인 드롭+자석 수집, 자동 웨이브 진행 + 베이스 진화.

import { COLORS, FONT, GAME, KEY, TILE, TOWERS } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { getLevel } from '../maps/levels.js';
import { buildPath, tilePxCenter } from '../maps/path.js';
import { King } from '../entities/King.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { Building } from '../entities/Building.js';
import { TowerSlot } from '../entities/TowerSlot.js';
import { Coin } from '../entities/Coin.js';

const ENEMY_POOL = 100;
const PROJECTILE_POOL = 160;
const COIN_POOL = 60;
const WAVE_BREATHER = 3.0;       // 웨이브 간 휴식(초)

// 슬롯에 배정할 타워 종류 — 라운드별 다르게 (단조로움 방지)
const SLOT_TOWER_KINDS = ['archer', 'cannon', 'frost', 'mortar', 'archer', 'cannon',
                          'frost', 'archer', 'mortar', 'cannon', 'frost', 'archer',
                          'archer', 'cannon', 'frost'];

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

    // 1) 배경
    this.drawGround(width, height);
    this.drawPath();
    this.drawDecorations();

    // 2) 경로
    this.path = buildPath(this.level.pathWaypoints);

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
    this.coins = [];
    for (let i = 0; i < COIN_POOL; i++) {
      const c = new Coin(this);
      c.setDepth(48);
      this.coins.push(c);
    }

    // 4) 왕좌 (경로 끝)
    const t = this.level.throne;
    const tp = tilePxCenter(t.col, t.row);
    this.building = new Building(this, tp.x, tp.y - 12);
    this.building.setDepth(45);

    // 5) 영웅 (왕좌 근처에서 시작)
    this.king = new King(this);
    this.king.setPosition(tp.x, tp.y + 60);
    this.king.setDepth(80);

    // 6) 타워 슬롯 (TowerSlot 엔티티)
    this.slots = [];
    this.towers = [];
    (this.level.towerSlots ?? []).forEach((s, i) => {
      const [c, r] = s;
      const sp = tilePxCenter(c, r);
      const kind = SLOT_TOWER_KINDS[i % SLOT_TOWER_KINDS.length];
      const slot = new TowerSlot(this, sp.x, sp.y, kind);
      slot.setDepth(15);
      this.slots.push(slot);
    });

    // 7) 상태
    this.score = 0;
    this.kills = 0;
    this.coinsEarned = 0;
    this.waveIdx = -1;
    this.waveActive = false;
    this.waveBreather = 0;
    this.spawnQueue = [];
    this.spawnElapsed = 0;
    this.boss = null;
    this.isPlaying = false;
    this.isOver = false;

    // 8) 입력 — 탭한 위치로 이동 (릴리즈해도 유지)
    this.input.on('pointerdown', (p) => this.onPointer(p));
    this.input.on('pointermove', (p) => { if (p.isDown) this.onPointer(p); });
    // pointerup 시에는 dragTarget을 유지 — 영웅이 도착할 때까지 이동.
    // (King.update가 도착 시 자동으로 dragTarget=null로 정리)

    // 9) HUD
    this.drawHud();

    // 10) 첫 슬롯만 unlock (순차 잠금 해제)
    if (this.slots.length > 0) this.slots[0].unlock();

    Audio.playBgm('stage_dawn', { fadeIn: 0.6, volume: 0.55 });
    this.runCountdown();
  }

  onPointer(p) {
    const x = Phaser.Math.Clamp(p.x, 30, this.scale.width - 30);
    const y = Phaser.Math.Clamp(p.y, 80, this.scale.height - 30);
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
          if (n <= 0) {
            big.destroy();
            this.isPlaying = true;
            this.startNextWave();    // 첫 웨이브 자동 시작
            return;
          }
          n--; tick();
        },
      });
    };
    tick();
  }

  update(time, delta) {
    if (!this.isPlaying || this.isOver) return;
    const dt = Math.min(0.05, delta / 1000);

    // 영웅
    this.king.update(dt);

    // 웨이브 스폰
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnElapsed += dt;
      while (this.spawnQueue.length > 0 && this.spawnQueue[0].t <= this.spawnElapsed) {
        const item = this.spawnQueue.shift();
        this.spawnEnemy(item.kind);
      }
    }

    // 적
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const r = e.update(dt, this);
      if (r?.reachedEnd) this.onEnemyReachedThrone(e, r.damage);
    }

    // 영웅↔적 접촉
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.king.x;
      const dy = e.y - this.king.y;
      const r = e.hitRadius + this.king.hitRadius;
      if (dx * dx + dy * dy < r * r) {
        if (!e._heroTouchT || this.time.now > e._heroTouchT) {
          e._heroTouchT = this.time.now + 600;
          this.king.takeDamage(1);
          Juice.flash(this, COLORS.capeRed, 160);
          Juice.shake(this, 0.012, 160);
          if (this.king.hp <= 0) this.gameOver();
        }
      }
    }

    // 영웅 조준/사격 — 매 프레임 본체 회전을 위해 setAim
    const target = this.findFireTarget();
    this.king.setAim(target);
    this.king.tryFire(target, (sx, sy, ang, w) => this.spawnArrow(sx, sy, ang, w));

    // 타워
    for (const t of this.towers) t.update(dt, this);

    // 발사체 + 충돌
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.update(dt, this);
      if (p.alive) this.checkProjectileVsEnemies(p);
    }

    // 슬롯 — 영웅이 위에 있는지 검사 + 게이지 업데이트
    for (const s of this.slots) {
      if (s.tier >= 3) { s.update(dt, this); continue; }
      const inside = s.contains(this.king.x, this.king.y);
      s.setCharging(inside);
      s.update(dt, this);
    }

    // 코인 자석/수집
    const magnetR = this.king.magnetRadius;
    for (const c of this.coins) {
      if (!c.alive) continue;
      c.update(dt, this.king.x, this.king.y, magnetR);
      if (c.alive) {
        const dx = c.x - this.king.x;
        const dy = c.y - this.king.y;
        const r = this.king.hitRadius + 6;
        if (dx * dx + dy * dy < r * r) {
          this.coinsEarned += c.value;
          this.score += c.value * 2;
          c.deactivate();
          this.updateHud();
          // 작은 반짝
          Juice.spark(this, c.x, c.y, COLORS.goldHud, 8);
        }
      }
    }

    // 웨이브 클리어 → breather → 다음 웨이브
    if (this.waveActive && this.spawnQueue.length === 0 &&
        !this.enemies.some(e => e.alive)) {
      this.endWave();
    }
    if (!this.waveActive && this.waveBreather > 0) {
      this.waveBreather -= dt;
      if (this.waveBreather <= 0) this.startNextWave();
    }
  }

  // ────────────── 배경 ──────────────
  drawGround(width, height) {
    const ts = GAME.tileSize;
    const scale = ts / GAME.spriteTile;
    const tint = this.level.groundTint ?? 0xffffff;
    for (let y = 0; y < height; y += ts) {
      for (let x = 0; x < width; x += ts) {
        const tile = (Math.random() < 0.85) ? TILE.GRASS : TILE.GRASS_PLAIN;
        const img = this.add.image(x, y, KEY.tilesheet, tile)
          .setOrigin(0).setScale(scale).setDepth(0);
        if (tint !== 0xffffff) img.setTint(tint);
      }
    }
    // 좌우 돌담
    const wall = this.add.graphics().setDepth(2);
    const wallW = 12;
    [0, width - wallW].forEach(wx => {
      wall.fillStyle(0x4a4d52, 1);
      wall.fillRect(wx, 0, wallW, height);
      wall.fillStyle(0x6e6e76, 1);
      wall.fillRect(wx + 2, 0, wallW - 4, height);
      wall.lineStyle(1, 0x3a3d42, 0.7);
      for (let y = 0; y < height; y += 28) {
        wall.beginPath();
        wall.moveTo(wx + 2, y + 0.5);
        wall.lineTo(wx + wallW - 2, y + 0.5);
        wall.strokePath();
      }
    });
  }

  drawPath() {
    const ts = GAME.tileSize;
    const pts = this.level.pathWaypoints.map(([c, r]) => ({
      x: c * ts + ts / 2, y: r * ts + ts / 2,
    }));
    const lane = ts - 4;
    const draw = (g, w, color) => {
      g.lineStyle(w, color, 1);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    };
    draw(this.add.graphics().setDepth(3), lane + 8, 0x4a2a14);
    draw(this.add.graphics().setDepth(4), lane, 0x8b5a3c);
    const inner = this.add.graphics().setDepth(5);
    inner.lineStyle(lane * 0.4, 0xb87a4a, 0.7);
    inner.lineCap = 'round'; inner.lineJoin = 'round';
    inner.beginPath();
    inner.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) inner.lineTo(pts[i].x, pts[i].y);
    inner.strokePath();
    // 진행 점선
    const dots = this.add.graphics().setDepth(6);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (!len) continue;
      const nx = dx / len, ny = dy / len;
      const step = 22;
      for (let t = step; t < len - step / 2; t += step) {
        dots.fillStyle(0xf4e8c8, 0.6);
        dots.fillCircle(a.x + nx * t, a.y + ny * t, 1.5);
      }
    }
  }

  drawDecorations() {
    const ts = GAME.tileSize;
    const scale = ts / GAME.spriteTile;
    const map = {
      TREE: TILE.TREE, TREE_PINE: TILE.TREE_PINE, BUSH: TILE.BUSH,
      ROCK_SMALL: TILE.ROCK_SMALL, ROCK_LARGE: TILE.ROCK_LARGE,
    };
    for (const [c, r, kind] of (this.level.decorations || [])) {
      const tileId = map[kind];
      if (tileId == null) continue;
      const img = this.add.image(c * ts + ts / 2, r * ts + ts / 2,
        KEY.tilesheet, tileId).setScale(scale).setDepth(20);
      this.tweens.add({
        targets: img, scale: scale * 1.04,
        duration: 1400 + Math.random() * 800,
        yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
    }
  }

  // ────────────── 웨이브 (자동) ──────────────
  startNextWave() {
    if (this.waveActive) return;
    this.waveIdx++;
    const wave = this.level.waves[this.waveIdx];
    if (!wave) {
      // 웨이브 끝 → 모든 적 처치 후 victory()
      return;
    }
    this.waveActive = true;
    this.spawnElapsed = 0;
    this.spawnQueue = [];
    for (const u of wave.units) {
      const [kind, count, interval, delay] = u;
      for (let i = 0; i < count; i++) {
        this.spawnQueue.push({ t: (delay ?? 0) + i * (interval ?? 0.6), kind });
      }
    }
    this.spawnQueue.sort((a, b) => a.t - b.t);

    // 웨이브 배너
    const big = this.add.text(this.scale.width / 2, 100, wave.label, {
      fontFamily: FONT.display, fontSize: '28px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(600).setLetterSpacing?.(3);
    this.tweens.add({
      targets: big, scale: { from: 1.5, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 360, ease: 'Back.Out',
    });
    this.tweens.add({
      targets: big, alpha: 0, y: big.y - 20,
      delay: 800, duration: 320, onComplete: () => big.destroy(),
    });
    Audio.levelUp();

    // 베이스 진화 (웨이브 1, 3, 5 진화)
    if (this.waveIdx === 1) this.building.evolve(1);
    else if (this.waveIdx === 2) this.building.evolve(2);
    else if (this.waveIdx === 4) this.building.evolve(3);

    this.updateHud();
  }

  endWave() {
    this.waveActive = false;
    Audio.fanfare();
    Juice.flash(this, COLORS.goldHud, 200);
    if (this.waveIdx >= this.level.waves.length - 1) {
      this.victory();
    } else {
      this.waveBreather = WAVE_BREATHER;
      // 보너스 코인 (드롭 형태로 영웅 근처에)
      for (let i = 0; i < 5; i++) {
        this.spawnCoin(this.king.x + (Math.random() - 0.5) * 60,
                       this.king.y + (Math.random() - 0.5) * 60, 5);
      }
      Juice.popText(this, this.scale.width / 2, this.scale.height / 2 - 20,
        '+25 BONUS', { color: COLORS.goldHud, size: 18 });
      this.updateHud();
    }
  }

  spawnEnemy(kind) {
    const e = this.enemies.find(en => !en.alive);
    if (!e) return;
    e.reset(kind, this.path, this.hpMul);
    if (kind === 'boss') this.boss = e;
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

  fireProjectile(tower, target) {
    const p = this.projectiles.find(pr => !pr.alive);
    if (!p) return;
    p.reset(tower.x, tower.y - 6, target, tower.cfg.bulletKind, {
      damage: tower.damage,
      splash: tower.cfg.splash,
      slow: tower.cfg.slow,
      speed: tower.cfg.bulletSpeed,
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
        if (p.splash > 0) {
          for (const e2 of this.enemies) {
            if (!e2.alive) continue;
            const ddx = e2.x - p.x;
            const ddy = e2.y - p.y;
            if (ddx * ddx + ddy * ddy < (p.splash + 18) * (p.splash + 18)) {
              const killed = e2.takeDamage(p.dmg);
              if (killed) this.onEnemyKilled(e2);
            }
          }
          this.spawnExplosion(p.x, p.y, p.splash);
        } else {
          const killed = e.takeDamage(p.dmg);
          if (p.slow > 0) e.applySlow(p.slow, 1500);
          if (killed) this.onEnemyKilled(e);
        }
        Juice.spark(this, p.x, p.y, 0xfff4a0, 12);
        p.deactivate();
        return;
      }
    }
  }

  spawnExplosion(x, y, radius) {
    Juice.ring(this, x, y, { color: 0xff8a3a, radius: radius + 10, duration: 360 });
    Juice.shake(this, 0.008, 100);
    const flame = this.add.image(x, y, KEY.tilesheet, TILE.FLAME_2)
      .setScale(0.5).setDepth(56);
    this.tweens.add({
      targets: flame, scale: { from: 0.4, to: 1 }, alpha: { from: 1, to: 0 },
      duration: 400, ease: 'Cubic.Out',
      onComplete: () => flame.destroy(),
    });
  }

  // ────────────── 코인 ──────────────
  spawnCoin(x, y, value = 1) {
    const c = this.coins.find(co => !co.alive);
    if (!c) return;
    c.reset(x, y, value);
  }

  onEnemyKilled(e) {
    this.score += e.scoreVal;
    this.kills++;
    if (e === this.boss) this.boss = null;
    // 코인 드롭 — 적 보상에 비례한 개수
    const drops = Math.max(3, Math.min(12, Math.round(e.bounty / 3)));
    for (let i = 0; i < drops; i++) {
      this.spawnCoin(e.x + (Math.random() - 0.5) * 12,
                     e.y + (Math.random() - 0.5) * 8, 1);
    }
    this.updateHud();
  }

  onEnemyReachedThrone(e, dmg) {
    const destroyed = this.building.takeDamage(dmg);
    Juice.flash(this, COLORS.capeRed, 160);
    Juice.shake(this, 0.012, 160);
    Audio.miss();
    if (destroyed) this.gameOver();
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
    this.hudWave = this.add.text(width / 2, 22, '...', {
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
    } else if (this.waveBreather > 0) {
      this.hudWave.setText('PREPARING...');
      this.hudWave.setColor('#9ad0a0');
    } else if (this.waveIdx >= this.level.waves.length - 1) {
      this.hudWave.setText('CLEARED');
    } else {
      this.hudWave.setText('READY');
    }
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
    const big = this.add.text(this.scale.width / 2, this.scale.height / 2, 'THRONE FALLEN', {
      fontFamily: FONT.display, fontSize: '38px', fontStyle: '900',
      color: '#c8302d', stroke: '#3e2e1e', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(700).setLetterSpacing?.(4);
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

  // TowerSlot에서 빌드 완료 시 호출 — 다음 슬롯 자동 잠금 해제.
  onTowerBuilt(slot) {
    if (slot.tower && !this.towers.includes(slot.tower)) {
      this.towers.push(slot.tower);
    }
    Juice.popText(this, slot.x, slot.y - 30, 'TOWER!',
      { color: 0xf4c542, size: 16, rise: 30, duration: 600 });
    const idx = this.slots.indexOf(slot);
    if (idx >= 0 && idx + 1 < this.slots.length) {
      const next = this.slots[idx + 1];
      this.scene.scene && next.unlock();
      // 작은 안내 화살표
      Juice.ring(this, next.x, next.y, { color: 0xf4c542, radius: 60, duration: 480 });
    }
  }
}
