// GameScene — TD Step 3: 타일맵 + 경로 + 적 풀 + 웨이브 + 라이프/골드.
// (Step 4에서 타워 배치 + 자동 사격)

import { COLORS, FONT, GAME, KEY, TILE, TOWERS } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { getStage } from '../maps/index.js';
import { buildPath, tilesAlongPath } from '../maps/path.js';
import { Enemy } from '../entities/Enemy.js';
import { Tower } from '../entities/Tower.js';
import { Projectile } from '../entities/Projectile.js';
const ENEMY_POOL = 60;
const PROJECTILE_POOL = 120;

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.stage = getStage(data?.stageId);
    this.hpMul = this.stage.hpMul ?? 1;
    this.speedMul = this.stage.speedMul ?? 1;
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

    // 5) 경로 빌드
    this.path = buildPath(this.stage.pathWaypoints);

    // 6) 시작/끝 마커
    this.drawSpawnAndKing();

    // 7) 적 풀
    this.enemies = [];
    for (let i = 0; i < ENEMY_POOL; i++) {
      const e = new Enemy(this);
      e.setDepth(50);
      this.enemies.push(e);
    }

    // 7.5) 발사체 풀 + 타워 리스트
    this.projectiles = [];
    for (let i = 0; i < PROJECTILE_POOL; i++) {
      const p = new Projectile(this);
      p.setDepth(55);
      this.projectiles.push(p);
    }
    this.towers = [];                  // 배치된 타워
    this.selectedTower = null;         // 사거리 표시 중인 타워
    this.buildMenu = null;             // 슬롯 빌드 메뉴 컨테이너

    // 8) 상태
    this.gold = GAME.startGold;
    this.lives = GAME.startLives;
    this.score = 0;
    this.kills = 0;
    this.waveIdx = -1;             // 시작 전
    this.waveSpawnTotal = 0;
    this.waveSpawned = 0;
    this.waveActive = false;
    this.spawnQueue = [];          // 이번 웨이브에서 토출할 [t, kind] 리스트
    this.spawnElapsed = 0;
    this.isOver = false;

    // 9) HUD
    this.drawHud();

    // 10) 시작 안내 + 첫 웨이브 버튼
    this.makeWaveButton();
    this.makeBackBtn(width, height);

    Audio.playBgm('stage_dawn', { fadeIn: 0.6, volume: 0.55 });
  }

  // ────────────── 렌더 헬퍼 ──────────────
  drawGrass() {
    const ts = GAME.tileSize;
    const scale = ts / GAME.spriteTile;
    const cols = this.stage.cols;
    const rows = this.stage.rows;
    const tint = this.stage.groundTint ?? 0xffffff;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = (Math.random() < 0.85) ? TILE.GRASS : TILE.GRASS_PLAIN;
        const img = this.add.image(c * ts, r * ts, KEY.tilesheet, tile)
          .setOrigin(0).setScale(scale).setDepth(0);
        if (tint !== 0xffffff) img.setTint(tint);
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
    this.slots = [];  // {col, row, x, y, image, tower}
    for (const [c, r] of (this.stage.towerSlots || [])) {
      const px = c * ts + ts / 2;
      const py = r * ts + ts / 2;
      const img = this.add.image(px, py, KEY.tilesheet, TILE.SLOT)
        .setScale(scale).setDepth(15).setAlpha(0.85);
      const slot = { col: c, row: r, x: px, y: py, image: img, tower: null };
      // 펄스 애니
      this.tweens.add({
        targets: img,
        alpha: { from: 0.85, to: 0.55 },
        duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
      // 인터랙션 (적당히 큰 히트박스)
      img.setInteractive(new Phaser.Geom.Rectangle(-12, -12, 88, 88), Phaser.Geom.Rectangle.Contains);
      img.on('pointerdown', (pointer, lx, ly, evt) => {
        evt.stopPropagation?.();
        this.onSlotClick(slot);
      });
      this.slots.push(slot);
    }
    // 빈 공간 탭 → 메뉴/선택 닫기 (게임 오브젝트 클릭은 무시)
    this.input.on('pointerdown', (p, gameObjects) => {
      if (gameObjects && gameObjects.length > 0) return;
      this.closeBuildMenu();
      this.deselectTower();
    });
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

  // ────────────── 업데이트 루프 ──────────────
  update(time, delta) {
    if (this.isOver) return;
    const dt = Math.min(0.05, delta / 1000);

    // 웨이브 스폰
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnElapsed += dt;
      while (this.spawnQueue.length > 0 && this.spawnQueue[0].t <= this.spawnElapsed) {
        const item = this.spawnQueue.shift();
        this.spawnEnemy(item.kind);
      }
    }

    // 적 업데이트
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const r = e.update(dt, this);
      if (r?.reachedEnd) this.onEnemyReachedEnd(e);
    }

    // 타워 업데이트
    for (const t of this.towers) t.update(dt, this);

    // 발사체 업데이트 + 충돌
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

  // ────────────── 웨이브 ──────────────
  startNextWave() {
    if (this.waveActive) return;
    this.waveIdx++;
    const wave = this.stage.waves[this.waveIdx];
    if (!wave) return;
    this.waveActive = true;
    this.spawnElapsed = 0;
    // 스폰 큐 빌드 — 모든 unit 군의 (t, kind) 평탄화 후 정렬
    this.spawnQueue = [];
    for (const u of wave.units) {
      for (let i = 0; i < u.count; i++) {
        this.spawnQueue.push({ t: (u.delay ?? 0) + i * (u.interval ?? 0.6), kind: u.kind });
      }
    }
    this.spawnQueue.sort((a, b) => a.t - b.t);
    this.waveSpawnTotal = this.spawnQueue.length;
    this.waveSpawned = 0;

    // 배너
    const big = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, wave.label, {
      fontFamily: FONT.display, fontSize: '32px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(600).setLetterSpacing?.(3);
    this.tweens.add({
      targets: big, scale: { from: 1.5, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 360, ease: 'Back.Out',
    });
    this.tweens.add({
      targets: big, alpha: 0, y: big.y - 30,
      delay: 900, duration: 360,
      onComplete: () => big.destroy(),
    });
    Audio.levelUp();

    if (this.waveBtn) this.waveBtn.setVisible(false);
    this.updateHud();
  }

  endWave() {
    this.waveActive = false;
    Audio.fanfare();
    Juice.flash(this, COLORS.goldHud, 200);

    if (this.waveIdx >= this.stage.waves.length - 1) {
      // 모든 웨이브 완료 → 승리
      this.victory();
    } else {
      // 다음 웨이브 버튼 활성화
      if (this.waveBtn) this.waveBtn.setVisible(true);
      // 골드 보너스 +30
      this.gold += 30;
      Juice.popText(this, this.scale.width / 2, this.scale.height / 2 - 20,
        '+30 GOLD', { color: COLORS.goldHud, size: 18 });
    }
    this.updateHud();
  }

  spawnEnemy(kind) {
    const e = this.enemies.find(en => !en.alive);
    if (!e) return;
    e.reset(kind, this.path, this.hpMul, this.speedMul);
    this.waveSpawned++;
  }

  // ────────────── 타워 / 슬롯 ──────────────
  onSlotClick(slot) {
    this.closeBuildMenu();
    this.deselectTower();
    if (slot.tower) {
      this.selectTower(slot.tower);
    } else {
      this.openBuildMenu(slot);
    }
  }

  openBuildMenu(slot) {
    // 슬롯 주변에 4개의 작은 타워 아이콘을 부채꼴로 배치
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

      // 백 디스크
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.55);
      bg.fillCircle(2, 2, 20);
      bg.fillStyle(COLORS.parchment, 0.95);
      bg.fillCircle(0, 0, 19);
      bg.lineStyle(2, COLORS.woodDark, 1);
      bg.strokeCircle(0, 0, 19);
      bg.lineStyle(1, cfg.color, 0.9);
      bg.strokeCircle(0, 0, 17);
      // 타워 아이콘
      const icon = this.add.image(0, 0, KEY.tilesheet, this.frameForTower(kind))
        .setScale(0.35);
      if (kind === 'frost') icon.setTint(0x80c8ff);
      // 코스트 라벨
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
          // 부족
          Audio.miss();
          this.tweens.add({ targets: lbl, scale: 1.4, duration: 100, yoyo: true });
          return;
        }
        this.gold -= cfg.cost[0];
        this.placeTower(slot, kind);
        this.closeBuildMenu();
        this.updateHud();
      });

      // 부드러운 등장
      item.setAlpha(0).setScale(0.4);
      this.tweens.add({
        targets: item, alpha: 1, scale: 1,
        duration: 220, delay: i * 40, ease: 'Back.Out',
      });
      c.add(item);
    });

    // 중앙 X (취소)
    const xBtn = this.add.container(0, 0);
    const xbg = this.add.graphics();
    xbg.fillStyle(COLORS.woodDark, 1);
    xbg.fillCircle(0, 0, 12);
    xbg.lineStyle(1, COLORS.goldHud, 0.8);
    xbg.strokeCircle(0, 0, 12);
    const xt = this.add.text(0, 0, '×', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#f4c542',
    }).setOrigin(0.5);
    xBtn.add([xbg, xt]);
    xBtn.setSize(28, 28);
    xBtn.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
    xBtn.on('pointerdown', (p, lx, ly, evt) => {
      evt.stopPropagation?.();
      this.closeBuildMenu();
    });
    c.add(xBtn);

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
    // 업그레이드/판매 미니 메뉴
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
      t.setLetterSpacing?.(1);
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
    // 타워 자체 클릭 가능 (선택)
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

  fireProjectile(tower, target) {
    const p = this.projectiles.find(pr => !pr.alive);
    if (!p) return;
    p.reset(tower.x, tower.y - 6, target, tower.kind, {
      damage: tower.damage,
      splash: tower.cfg.splash,
      slow: tower.cfg.slow,
      speed: tower.cfg.bulletSpeed,
    });
    // 사격 펀치 — body가 살짝 발사 방향으로 밀림
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
      const r = 18;
      if (dx * dx + dy * dy < r * r) {
        // 명중
        const splash = p.splash;
        if (splash > 0) {
          // 범위 데미지
          for (const e2 of this.enemies) {
            if (!e2.alive) continue;
            const ddx = e2.x - p.x;
            const ddy = e2.y - p.y;
            if (ddx * ddx + ddy * ddy < (splash + 18) * (splash + 18)) {
              const killed = e2.takeDamage(p.dmg);
              if (killed) this.onEnemyKilled(e2, true);
            }
          }
          this.spawnExplosion(p.x, p.y, splash);
        } else {
          const killed = e.takeDamage(p.dmg);
          if (p.slow > 0) e.applySlow(p.slow, 1500);
          if (killed) this.onEnemyKilled(e, true);
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
    // 화염 스프라이트 (4프레임 사이클)
    const flame = this.add.image(x, y, KEY.tilesheet, TILE.FLAME_2)
      .setScale(0.5).setDepth(56);
    this.tweens.add({
      targets: flame,
      scale: { from: 0.4, to: 1 },
      alpha: { from: 1, to: 0 },
      duration: 400,
      ease: 'Cubic.Out',
      onComplete: () => flame.destroy(),
    });
  }

  frameForTower(kind) {
    const map = {
      archer: TILE.TOWER_ARCHER,
      cannon: TILE.TOWER_CANNON,
      mortar: TILE.TOWER_MORTAR,
      frost:  TILE.TOWER_FROST,
    };
    return map[kind];
  }

  onEnemyReachedEnd(e) {
    this.lives = Math.max(0, this.lives - 1);
    Juice.flash(this, COLORS.red, 220);
    Juice.shake(this, 0.014, 200);
    Audio.miss();
    this.updateHud();
    if (this.lives <= 0) this.gameOver();
  }

  // 적이 죽었을 때 GameScene에서 호출 (Step 4 타워에서 사용)
  onEnemyKilled(e, byTower) {
    this.gold += e.bounty;
    this.score += e.scoreVal;
    this.kills++;
    Juice.popText(this, e.x, e.y - 18, `+${e.bounty}`, {
      color: COLORS.goldHud, size: 13, rise: 26, duration: 460,
    });
    this.updateHud();
  }

  victory() {
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
    this.isOver = true;
    Audio.bomb();
    Juice.shake(this, 0.03, 500);
    Juice.flash(this, COLORS.red, 480);
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
    const stageKey = `king-shot-${this.stage.id}`;
    const prevBest = profile.bestScores?.[stageKey] || 0;
    const isBest = Storage.setBestScore(stageKey, this.score);
    Storage.setBestScore('king-shot', this.score);
    // 보너스 코인/젬
    const coinReward = victory ? 25 : 5;
    const gemReward  = victory ? 3 : 0;
    if (coinReward) Storage.addCoins(coinReward);
    if (gemReward)  Storage.addGems(gemReward);

    Analytics.track('session_end', {
      game: 'king-shot-td', stage: this.stage.id,
      score: this.score, kills: this.kills, victory, isBest,
    });
    this.cameras.main.fadeOut(420, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ResultScene', {
        victory, score: this.score, kills: this.kills,
        bestScore: Math.max(prevBest, this.score),
        isBest, stageId: this.stage.id,
        coinsEarned: coinReward, gemsEarned: gemReward,
      });
    });
  }

  // ────────────── HUD ──────────────
  drawHud() {
    const { width } = this.scale;

    // 상단 검은 배너
    const bar = this.add.graphics().setDepth(100);
    bar.fillStyle(0x000000, 0.55);
    bar.fillRect(0, 0, width, 56);
    bar.fillStyle(COLORS.goldHud, 0.6);
    bar.fillRect(0, 54, width, 2);

    // 좌측: GOLD
    this.add.image(20, 28, KEY.tilesheet, TILE.COIN_GOLD)
      .setScale(0.5).setDepth(101);
    this.hudGold = this.add.text(40, 18, '0', {
      fontFamily: FONT.display, fontSize: '22px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0, 0).setDepth(101).setLetterSpacing?.(1);

    // 중앙: STAGE 이름
    this.add.text(width / 2, 8, this.stage.name, {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#d9c897',
    }).setOrigin(0.5, 0).setDepth(101).setLetterSpacing?.(3);
    this.hudWave = this.add.text(width / 2, 22, 'PRESS START', {
      fontFamily: FONT.display, fontSize: '16px', fontStyle: '900',
      color: '#f0e6d0', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(101).setLetterSpacing?.(2);

    // 우측: LIVES (하트 N개)
    this.hudLivesText = this.add.text(width - 20, 18, '♥ 12', {
      fontFamily: FONT.display, fontSize: '22px', fontStyle: '900',
      color: '#ff6b6b', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(101);

    this.updateHud();
  }

  updateHud() {
    if (!this.hudGold) return;
    this.hudGold.setText(String(this.gold));
    this.hudLivesText.setText(`♥ ${this.lives}`);
    if (this.waveActive) {
      this.hudWave.setText(`WAVE ${this.waveIdx + 1}/${this.stage.waves.length}`);
      this.hudWave.setColor('#f4c542');
    } else if (this.waveIdx >= this.stage.waves.length - 1) {
      this.hudWave.setText('CLEARED');
    } else if (this.waveIdx >= 0) {
      this.hudWave.setText('WAVE CLEAR · NEXT?');
      this.hudWave.setColor('#9ad0a0');
    } else {
      this.hudWave.setText('PRESS START');
    }
  }

  makeWaveButton() {
    const w = 180, h = 44;
    const cx = this.scale.width / 2;
    const cy = this.scale.height - 50;
    const c = this.add.container(cx, cy).setDepth(120);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w, h, 6);
    bg.fillStyle(COLORS.red, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.fillStyle(COLORS.redDk, 1);
    bg.fillRoundedRect(-w / 2, h / 2 - 5, w, 5, 6);
    bg.lineStyle(2, COLORS.woodDark, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(1, COLORS.goldHud, 0.9);
    bg.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 5);
    c.add(bg);
    const t = this.add.text(0, 0, '⚔ START WAVE', {
      fontFamily: FONT.display, fontSize: '17px', fontStyle: '900',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5);
    t.setLetterSpacing?.(3);
    c.add(t);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.06, duration: 140 }));
    c.on('pointerout',  () => this.tweens.add({ targets: c, scale: 1, duration: 140 }));
    c.on('pointerdown', () => {
      Audio.purchase();
      this.startNextWave();
    });
    this.waveBtn = c;
    // 펄스
    this.tweens.add({
      targets: c, scale: { from: 1, to: 1.04 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
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
