// GameScene — TD: 경로 따라가는 적 + 끝점 왕좌 건물 + 타워 빌드.

import { COLORS, FONT, GAME, KEY, TILE, TOWERS } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { getLevel } from '../maps/levels.js';
import { buildPath, tilePxCenter } from '../maps/path.js';
import { Enemy } from '../entities/Enemy.js';
import { Tower } from '../entities/Tower.js';
import { Projectile } from '../entities/Projectile.js';
import { Building } from '../entities/Building.js';

const ENEMY_POOL = 80;
const PROJECTILE_POOL = 120;

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

    // 1) 풍부한 배경
    this.drawGround(width, height);
    this.drawPath();
    this.drawDecorations();
    this.drawBanners();

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

    // 4) 왕좌 건물 (경로 끝)
    const t = this.level.throne;
    const tp = tilePxCenter(t.col, t.row);
    this.building = new Building(this, tp.x, tp.y - 12);
    this.building.setDepth(45);

    // 5) 타워 슬롯
    this.drawTowerSlots();

    // 6) 상태
    this.gold = GAME.startGold;
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
    this.towers = [];
    this.selectedTower = null;
    this.buildMenu = null;
    this.towerMenu = null;

    // 7) HUD + START WAVE 버튼
    this.drawHud();
    this.makeWaveButton();

    // 8) 빈 공간 탭으로 메뉴 닫기
    this.input.on('pointerdown', (p, gameObjects) => {
      if (gameObjects && gameObjects.length > 0) return;
      this.closeBuildMenu();
      this.deselectTower();
    });

    Audio.playBgm('stage_dawn', { fadeIn: 0.6, volume: 0.55 });
    this.runCountdown();
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

    // 웨이브 스폰
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnElapsed += dt;
      while (this.spawnQueue.length > 0 && this.spawnQueue[0].t <= this.spawnElapsed) {
        const item = this.spawnQueue.shift();
        this.spawnEnemy(item.kind);
      }
    }

    // 적 업데이트 + 끝점 도달 처리
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const r = e.update(dt, this);
      if (r?.reachedEnd) this.onEnemyReachedThrone(e, r.damage);
    }

    // 타워
    for (const t of this.towers) t.update(dt, this);

    // 발사체 + 충돌
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.update(dt, this);
      if (p.alive) this.checkProjectileVsEnemies(p);
    }

    // 웨이브 클리어 판정
    if (this.waveActive && this.spawnQueue.length === 0 &&
        !this.enemies.some(e => e.alive)) {
      this.endWave();
    }
  }

  // ────────────── 배경 ──────────────
  drawGround(width, height) {
    const ts = GAME.tileSize;
    const scale = ts / GAME.spriteTile;
    const tint = this.level.groundTint ?? 0xffffff;

    // 베이스 잔디
    for (let y = 0; y < height; y += ts) {
      for (let x = 0; x < width; x += ts) {
        const tile = (Math.random() < 0.85) ? TILE.GRASS : TILE.GRASS_PLAIN;
        const img = this.add.image(x, y, KEY.tilesheet, tile)
          .setOrigin(0).setScale(scale).setDepth(0);
        if (tint !== 0xffffff) img.setTint(tint);
      }
    }

    // 좌우 돌담 (성벽 느낌)
    const stoneCol = 0x6b6e76;
    const stoneDk = 0x4a4d52;
    const wallW = 14;
    const wall = this.add.graphics().setDepth(2);
    [0, width - wallW].forEach(wx => {
      wall.fillStyle(stoneDk, 1);
      wall.fillRect(wx, 0, wallW, height);
      wall.fillStyle(stoneCol, 1);
      wall.fillRect(wx + 2, 0, wallW - 4, height);
      wall.lineStyle(1, stoneDk, 0.7);
      for (let y = 0; y < height; y += 28) {
        const off = (Math.floor(y / 28) % 2) * 5;
        wall.beginPath();
        wall.moveTo(wx + 2 + off, y + 0.5);
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
    // 어두운 외곽
    const outer = this.add.graphics().setDepth(3);
    outer.lineStyle(lane + 8, 0x4a2a14, 1);
    outer.lineCap = 'round'; outer.lineJoin = 'round';
    outer.beginPath();
    outer.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) outer.lineTo(pts[i].x, pts[i].y);
    outer.strokePath();
    // 본체
    const body = this.add.graphics().setDepth(4);
    body.lineStyle(lane, 0x8b5a3c, 1);
    body.lineCap = 'round'; body.lineJoin = 'round';
    body.beginPath();
    body.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) body.lineTo(pts[i].x, pts[i].y);
    body.strokePath();
    // 안쪽 밝은 라인
    const inner = this.add.graphics().setDepth(5);
    inner.lineStyle(lane * 0.4, 0xb87a4a, 0.8);
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
      const nx = dx / len, ny = dy / len;
      const step = 22;
      for (let t = step; t < len - step / 2; t += step) {
        dots.fillStyle(0xf4e8c8, 0.7);
        dots.fillCircle(a.x + nx * t, a.y + ny * t, 1.6);
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

  drawBanners() {
    // 경로 옆에 일정 간격으로 적색 깃발 (의미있는 시각 디테일)
    const ts = GAME.tileSize;
    const pts = this.level.pathWaypoints.map(([c, r]) => ({
      x: c * ts + ts / 2, y: r * ts + ts / 2,
    }));
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 80) continue;
      const nx = dx / len, ny = dy / len;
      // 수직(좌측 사이드)
      const sx = -ny, sy = nx;
      const mid = { x: a.x + nx * (len * 0.5), y: a.y + ny * (len * 0.5) };
      [-1, 1].forEach(side => {
        const bx = mid.x + sx * side * (ts * 0.85);
        const by = mid.y + sy * side * (ts * 0.85);
        if (bx < 18 || bx > this.scale.width - 18) return;
        if (by < 4 || by > this.scale.height - 4) return;
        this.drawBanner(bx, by);
      });
    }
  }

  drawBanner(x, y) {
    const g = this.add.graphics().setDepth(18);
    // 막대
    g.fillStyle(0x3e2e1e, 1);
    g.fillRect(x - 1, y - 14, 2, 22);
    // 깃발
    g.fillStyle(COLORS.capeRedDk, 1);
    g.fillTriangle(x + 1, y - 14, x + 13, y - 9, x + 1, y - 4);
    g.fillStyle(COLORS.capeRed, 1);
    g.fillTriangle(x + 1, y - 13, x + 12, y - 9, x + 1, y - 5);
    // 골드 핀
    g.fillStyle(COLORS.goldHud, 1);
    g.fillCircle(x, y - 14, 1.6);
    // 펄럭 트윈 (작게)
    this.tweens.add({
      targets: g, scaleX: { from: 1, to: 0.92 },
      duration: 600 + Math.random() * 200,
      yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  drawTowerSlots() {
    const ts = GAME.tileSize;
    this.slots = [];
    for (const [c, r] of (this.level.towerSlots || [])) {
      const px = c * ts + ts / 2;
      const py = r * ts + ts / 2;
      const slot = { col: c, row: r, x: px, y: py, tower: null };

      const cont = this.add.container(px, py).setDepth(15);
      const ring = this.add.graphics();
      const rad = 17;
      ring.fillStyle(0x000000, 0.45);
      ring.fillCircle(2, 2, rad);
      ring.fillStyle(0xf4e8c8, 0.78);
      ring.fillCircle(0, 0, rad);
      ring.lineStyle(2.5, 0xc89438, 0.95);
      ring.strokeCircle(0, 0, rad);
      ring.lineStyle(1, 0xf4c542, 0.9);
      ring.strokeCircle(0, 0, rad - 3);
      ring.lineStyle(3, 0xc89438, 0.95);
      ring.beginPath();
      ring.moveTo(-7, 0); ring.lineTo(7, 0);
      ring.moveTo(0, -7); ring.lineTo(0, 7);
      ring.strokePath();
      cont.add(ring);

      this.tweens.add({
        targets: cont, scale: { from: 1, to: 1.12 },
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });

      cont.setSize(48, 48);
      cont.setInteractive(new Phaser.Geom.Circle(0, 0, 24), Phaser.Geom.Circle.Contains);
      cont.on('pointerover', () => this.tweens.add({ targets: cont, scale: 1.18, duration: 120 }));
      cont.on('pointerout',  () => this.tweens.add({ targets: cont, scale: 1, duration: 120 }));
      cont.on('pointerdown', (p, lx, ly, evt) => {
        evt.stopPropagation?.();
        this.onSlotClick(slot);
      });
      slot.image = cont;
      this.slots.push(slot);
    }
  }

  // ────────────── 타워 / 슬롯 ──────────────
  onSlotClick(slot) {
    this.closeBuildMenu();
    this.deselectTower();
    if (slot.tower) this.selectTower(slot.tower);
    else this.openBuildMenu(slot);
  }

  openBuildMenu(slot) {
    const c = this.add.container(slot.x, slot.y).setDepth(200);
    const radius = 52;
    const kinds = ['archer', 'cannon', 'mortar', 'frost'];
    const angles = [-Math.PI * 0.75, -Math.PI * 0.25, Math.PI * 0.25, Math.PI * 0.75];
    kinds.forEach((kind, i) => {
      const cfg = TOWERS[kind];
      const ang = angles[i];
      const ix = Math.cos(ang) * radius;
      const iy = Math.sin(ang) * radius;
      const item = this.add.container(ix, iy);
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.55);
      bg.fillCircle(2, 2, 20);
      bg.fillStyle(COLORS.parchment, 0.95);
      bg.fillCircle(0, 0, 19);
      bg.lineStyle(2, COLORS.woodDark, 1);
      bg.strokeCircle(0, 0, 19);
      bg.lineStyle(1, cfg.color, 0.9);
      bg.strokeCircle(0, 0, 17);
      const icon = this.add.text(0, -3, cfg.icon, {
        fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
        color: '#3e2e1e',
      }).setOrigin(0.5);
      const aff = this.gold >= cfg.cost[0];
      const lbl = this.add.text(0, 22, `${cfg.cost[0]}g`, {
        fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
        color: aff ? '#f4c542' : '#ff5050', stroke: '#3e2e1e', strokeThickness: 2,
      }).setOrigin(0.5);
      item.add([bg, icon, lbl]);
      item.setSize(40, 40);
      item.setInteractive(new Phaser.Geom.Circle(0, 0, 22), Phaser.Geom.Circle.Contains);
      item.on('pointerover', () => this.tweens.add({ targets: item, scale: 1.18, duration: 120 }));
      item.on('pointerout',  () => this.tweens.add({ targets: item, scale: 1, duration: 120 }));
      item.on('pointerdown', (p, lx, ly, evt) => {
        evt.stopPropagation?.();
        if (this.gold < cfg.cost[0]) {
          Audio.miss();
          this.tweens.add({ targets: lbl, scale: 1.4, duration: 100, yoyo: true });
          return;
        }
        this.gold -= cfg.cost[0];
        this.placeTower(slot, kind);
        this.closeBuildMenu();
        this.updateHud();
      });
      item.setAlpha(0).setScale(0.4);
      this.tweens.add({
        targets: item, alpha: 1, scale: 1,
        duration: 220, delay: i * 40, ease: 'Back.Out',
      });
      c.add(item);
    });
    this.buildMenu = c;
  }

  closeBuildMenu() {
    if (this.buildMenu) {
      const m = this.buildMenu;
      this.buildMenu = null;
      this.tweens.add({
        targets: m, alpha: 0, scale: 0.6,
        duration: 160, ease: 'Cubic.In',
        onComplete: () => m.destroy(),
      });
    }
  }

  selectTower(tower) {
    this.selectedTower = tower;
    tower.showRange();
    const c = this.add.container(tower.x, tower.y - 50).setDepth(200);
    const w = 110, h = 28;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.55);
    bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w, h, 6);
    bg.fillStyle(COLORS.parchment, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(2, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(1, COLORS.goldHud, 0.85);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 5);
    c.add(bg);
    if (tower.canUpgrade()) {
      const cost = tower.nextCost;
      const aff = this.gold >= cost;
      const t = this.add.text(0, 0, `▲ UPGRADE ${cost}g`, {
        fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
        color: aff ? '#3e2e1e' : '#a04040',
      }).setOrigin(0.5);
      c.add(t);
      c.setSize(w, h);
      c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
      c.on('pointerdown', (p, lx, ly, evt) => {
        evt.stopPropagation?.();
        if (this.gold < cost) { Audio.miss(); return; }
        this.gold -= cost;
        tower.upgrade();
        this.deselectTower();
        this.updateHud();
        Audio.purchase();
      });
    } else {
      const t = this.add.text(0, 0, 'MAX TIER ★★★', {
        fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
        color: '#3e2e1e',
      }).setOrigin(0.5);
      c.add(t);
    }
    this.towerMenu = c;
  }

  deselectTower() {
    if (this.selectedTower) {
      this.selectedTower.hideRange();
      this.selectedTower = null;
    }
    if (this.towerMenu) {
      const m = this.towerMenu;
      this.towerMenu = null;
      this.tweens.add({
        targets: m, alpha: 0, duration: 140,
        onComplete: () => m.destroy(),
      });
    }
  }

  placeTower(slot, kind) {
    const tower = new Tower(this, slot.x, slot.y, kind);
    tower.setDepth(40);
    slot.tower = tower;
    slot.image.setVisible(false);
    this.towers.push(tower);
    Audio.purchase();
    Juice.flash(this, TOWERS[kind].color, 160);
    Juice.ring(this, slot.x, slot.y, { color: TOWERS[kind].color, radius: 52, duration: 380 });
    tower.setSize(40, 40);
    tower.setInteractive(new Phaser.Geom.Rectangle(-20, -20, 40, 40),
                        Phaser.Geom.Rectangle.Contains);
    tower.on('pointerdown', (p, lx, ly, evt) => {
      evt.stopPropagation?.();
      this.closeBuildMenu();
      if (this.selectedTower === tower) this.deselectTower();
      else { this.deselectTower(); this.selectTower(tower); }
    });
  }

  // ────────────── 사격/충돌 ──────────────
  fireProjectile(tower, target) {
    const p = this.projectiles.find(pr => !pr.alive);
    if (!p) return;
    p.reset(tower.x, tower.y - 6, target, tower.cfg.bulletKind, {
      damage: tower.damage,
      splash: tower.cfg.splash,
      slow: tower.cfg.slow,
      speed: tower.cfg.bulletSpeed,
    });
    this.tweens.add({
      targets: tower.body, scaleX: { from: 0.5, to: 0.55 },
      duration: 80, yoyo: true,
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
        const splash = p.splash;
        if (splash > 0) {
          for (const e2 of this.enemies) {
            if (!e2.alive) continue;
            const ddx = e2.x - p.x;
            const ddy = e2.y - p.y;
            if (ddx * ddx + ddy * ddy < (splash + 18) * (splash + 18)) {
              const killed = e2.takeDamage(p.dmg);
              if (killed) this.onEnemyKilled(e2);
            }
          }
          this.spawnExplosion(p.x, p.y, splash);
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

  onEnemyKilled(e) {
    this.gold += e.bounty;
    this.score += e.scoreVal;
    this.kills++;
    this.coinsEarned += e.bounty;
    Juice.popText(this, e.x, e.y - 14, `+${e.bounty}`, {
      color: 0xf4c542, size: 12, rise: 24, duration: 380,
    });
    if (e === this.boss) this.boss = null;
    this.updateHud();
  }

  onEnemyReachedThrone(e, dmg) {
    const destroyed = this.building.takeDamage(dmg);
    Juice.flash(this, COLORS.capeRed, 160);
    Juice.shake(this, 0.012, 160);
    Audio.miss();
    if (destroyed) this.gameOver();
  }

  // ────────────── 웨이브 ──────────────
  startNextWave() {
    if (this.waveActive) return;
    this.waveIdx++;
    const wave = this.level.waves[this.waveIdx];
    if (!wave) return;
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

    const big = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40,
      wave.label, {
        fontFamily: FONT.display, fontSize: '32px', fontStyle: '900',
        color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(600).setLetterSpacing?.(3);
    this.tweens.add({
      targets: big, scale: { from: 1.5, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 360, ease: 'Back.Out',
    });
    this.tweens.add({
      targets: big, alpha: 0, y: big.y - 30,
      delay: 800, duration: 320, onComplete: () => big.destroy(),
    });
    Audio.levelUp();
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
      this.gold += 30;
      Juice.popText(this, this.scale.width / 2, this.scale.height / 2 - 20,
        '+30 GOLD', { color: COLORS.goldHud, size: 18 });
      this.updateHud();
    }
  }

  spawnEnemy(kind) {
    const e = this.enemies.find(en => !en.alive);
    if (!e) return;
    e.reset(kind, this.path, this.hpMul);
    if (kind === 'boss') this.boss = e;
  }

  // ────────────── HUD + 버튼 ──────────────
  drawHud() {
    const { width } = this.scale;
    const bar = this.add.graphics().setDepth(100);
    bar.fillStyle(0x000000, 0.55);
    bar.fillRect(0, 0, width, 50);
    bar.fillStyle(COLORS.goldHud, 0.6);
    bar.fillRect(0, 48, width, 2);

    this.add.image(20, 25, KEY.tilesheet, TILE.COIN_GOLD)
      .setScale(0.45).setDepth(101);
    this.hudGold = this.add.text(38, 16, String(this.gold), {
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

    this.hudKills = this.add.text(width - 20, 16, 'K 0', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(101);
  }

  updateHud() {
    if (!this.hudGold) return;
    this.hudGold.setText(String(this.gold));
    this.hudKills.setText('K ' + this.kills);
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
}
