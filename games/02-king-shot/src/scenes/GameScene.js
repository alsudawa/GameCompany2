// GameScene — 하이브리드 King Shot.
// 영웅이 자유 2D 이동 + 자동 사격, 경로 적이 왕좌로 진군, 영웅이 슬롯 위에 서서 타워 빌드,
// 적 처치 시 코인 드롭+자석 수집, 자동 웨이브 진행 + 베이스 진화.

import { COLORS, FONT, GAME, KEY, TILE, TOWERS, GRADE_CUTS } from '../config.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { getLevel } from '../maps/levels.js';
import { buildPath, tilePxCenter, clampToPath } from '../maps/path.js';
import { computeBonuses, totalUpgradeLevels } from '../meta/upgrades.js';
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
const KING_BAND = 30;            // 왕이 길 중심선에서 벗어날 수 있는 최대 거리(px) — 적 차선과 동일
const SLOT_REACH = 65;           // 타워 슬롯 주변 워커블 범위 (path band와 연결되어 슬롯 접근 가능)

// 슬롯에 배정할 타워 종류 — 라운드별 다르게 (단조로움 방지)
const SLOT_TOWER_KINDS = ['archer', 'cannon', 'frost', 'mortar', 'archer', 'cannon',
                          'frost', 'archer', 'mortar', 'cannon', 'frost', 'archer',
                          'archer', 'cannon', 'frost'];

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.level = getLevel(data?.levelId);
    // 동적 난이도: 영구 업그레이드 합 × 레벨 hpMul
    // (트랙 4개 × 5레벨 = 최대 20. 만렙시 +120% HP)
    this.upgradeLevels = totalUpgradeLevels(Storage.getUpgrades());
    const upgradeScale = 1 + 0.06 * this.upgradeLevels;
    this.baseHpMul = (this.level.hpMul ?? 1) * upgradeScale;
    this.hpMul = this.baseHpMul;       // 웨이브마다 startNextWave에서 갱신
    // 스폰 간격 단축 (업그레이드 누적 → 더 빽빽한 무리)
    this.spawnRateMul = 1 / (1 + 0.02 * this.upgradeLevels);
  }

  create() {
    const { width, height } = this.scale;
    Audio.unlockOnFirstInput(this);
    this.cameras.main.setBackgroundColor('#3a7d44');
    this.cameras.main.fadeIn(280, 0, 0, 0);

    // 1) 경로 (먼저 빌드해야 drawPath에서 보간된 폴리라인을 쓸 수 있음)
    this.path = buildPath(this.level.pathWaypoints);

    // 2) 배경
    this.drawGround(width, height);
    this.drawPath();
    this.drawDecorations();
    this.drawAtmosphere(width, height);

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

    // 5) 영웅 — 길 끝(왕좌 앞) path 위에서 시작 + 영구 업그레이드 적용
    const bonuses = computeBonuses(Storage.getUpgrades());
    this.king = new King(this);
    const startEnd = this.path.segs[this.path.segs.length - 1].b;
    // 시작 y는 화면 하단 shop drawer를 침범하지 않도록 캡
    const startY = Math.min(startEnd.y, height - 80);
    this.king.setPosition(startEnd.x, startY);
    this.king.setDepth(80);
    if (bonuses.hpBonus) {
      this.king.maxHp += bonuses.hpBonus;
      this.king.hp = this.king.maxHp;
    }
    if (bonuses.dmgMul && bonuses.dmgMul !== 1) {
      this.king.weapon.damage = Math.round(this.king.weapon.damage * bonuses.dmgMul);
    }
    if (bonuses.magnetMul && bonuses.magnetMul !== 1) {
      this.king.magnetRadius = Math.round(this.king.magnetRadius * bonuses.magnetMul);
    }
    this._startGoldBonus = bonuses.startGold || 0;

    // 6) 타워 슬롯 (TowerSlot 엔티티) — 왕좌 가까운 순으로 정렬해 unlock 순서 결정
    this.slots = [];
    this.towers = [];
    const throneTp = tilePxCenter(this.level.throne.col, this.level.throne.row);
    const slotData = (this.level.towerSlots ?? []).slice().sort((a, b) => {
      const ap = tilePxCenter(a[0], a[1]);
      const bp = tilePxCenter(b[0], b[1]);
      const da = (ap.x - throneTp.x) ** 2 + (ap.y - throneTp.y) ** 2;
      const db = (bp.x - throneTp.x) ** 2 + (bp.y - throneTp.y) ** 2;
      return da - db;
    });
    slotData.forEach((s, i) => {
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
    this.coinsEarned = this._startGoldBonus || 0;   // ROYAL VAULT 업그레이드
    this.gemsEarned = 0;
    this.waveIdx = -1;
    this.waveActive = false;
    this.waveBreather = 0;
    this.spawnQueue = [];
    this.spawnElapsed = 0;
    this.boss = null;
    this.isPlaying = false;
    this.isOver = false;
    this.maxLeak = 5;            // 시작 throne HP — 무피해 별 판정용
    // 콤보
    this.combo = 0;
    this.comboUntil = 0;
    this.comboBest = 0;

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
    // 볼리 버튼 영역
    if (this.volley) {
      const dx = p.x - this.volley.container.x;
      const dy = p.y - this.volley.container.y;
      if (dx * dx + dy * dy < (this.volley.r + 4) ** 2) return;
    }
    // 인게임 shop drawer 영역 (하단 띠) — 버튼 자체가 input 처리하므로 왕 이동만 무시
    if (p.y > this.scale.height - 60) return;
    const x = Phaser.Math.Clamp(p.x, 30, this.scale.width - 30);
    const y = Phaser.Math.Clamp(p.y, 80, this.scale.height - 30);
    const c = this.clampKingArea(x, y);
    this.king.setDragTarget(c.x, c.y);
  }

  // 워커블 영역: path 중심선 ±KING_BAND ∪ 활성 슬롯 SLOT_REACH 버블.
  // (path band와 슬롯 버블이 겹치도록 SLOT_REACH가 충분히 크게 설정됨)
  clampKingArea(x, y) {
    // 하단 shop drawer 영역(약 60px)을 침범하지 않도록 y 캡
    const maxY = this.scale.height - 70;
    if (y > maxY) y = maxY;
    const onPath = clampToPath(this.path, x, y, KING_BAND);
    const dPath = Math.hypot(x - onPath.x, y - onPath.y);
    if (dPath <= 0.5) return { x, y };
    let best = onPath, bestD = dPath;
    for (const s of (this.slots ?? [])) {
      if (!s.enabled) continue;
      const dx = x - s.x, dy = y - s.y;
      const d = Math.hypot(dx, dy);
      if (d <= SLOT_REACH) return { x, y };
      const u = SLOT_REACH / Math.max(d, 0.001);
      const px = s.x + dx * u, py = s.y + dy * u;
      const pd = Math.hypot(x - px, y - py);
      if (pd < bestD) { best = { x: px, y: py }; bestD = pd; }
    }
    return best;
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
    // 매 프레임 왕 위치를 워커블 영역 안으로 클램프
    {
      const c = this.clampKingArea(this.king.x, this.king.y);
      this.king.x = c.x; this.king.y = c.y;
    }

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
    // Gilded halo follow + cleanup
    if (this._gildedHalos) {
      for (let i = this._gildedHalos.length - 1; i >= 0; i--) {
        const h = this._gildedHalos[i];
        if (!h._follow.alive) {
          h.destroy();
          this._gildedHalos.splice(i, 1);
        } else {
          h.x = h._follow.x;
          h.y = h._follow.y;
        }
      }
    }
    // 콤보 만료 시 HUD 갱신
    if (this.combo > 0 && this.time.now > this.comboUntil) {
      this.combo = 0;
      this.updateHud();
    }
    this.updateVolley(dt);
    this.updateBossHud();

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
    this.king.tryFire(target, (sx, sy, ang, w) => this.spawnArrow(sx, sy, ang, w, target));

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
          if (c.value >= 5) {
            this.gemsEarned += 1;
            this.score += 25;
            Juice.spark(this, c.x, c.y, 0x80c8ff, 12);
            this.spawnDmgNumber(c.x, c.y - 6, '+GEM', 'frost');
          } else {
            this.coinsEarned += c.value;
            this.score += c.value * 2;
            Juice.spark(this, c.x, c.y, COLORS.goldHud, 8);
          }
          c.deactivate();
          this.updateHud();
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
    // path는 buildPath()로 이미 Catmull-Rom 보간된 조밀 폴리라인.
    const pts = this.path.pts;
    const lane = GAME.tileSize + 14;     // 더 넓은 진짜 길 폭
    const stroke = (g, w, color, alpha = 1) => {
      g.lineStyle(w, color, alpha);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    };

    // 1) 길가 풀(어두운 가장자리) — 부드러운 흙길 경계
    stroke(this.add.graphics().setDepth(3), lane + 14, 0x4a3a22, 0.55);
    // 2) 흙길 메인
    stroke(this.add.graphics().setDepth(4), lane, 0x8b5a3c);
    // 3) 흙길 가운데 밝은 톤(노출된 흙) — 자연스러운 발자국
    stroke(this.add.graphics().setDepth(5), lane * 0.55, 0xb98558, 0.85);
    // 4) 더 밝은 중심선
    stroke(this.add.graphics().setDepth(6), lane * 0.18, 0xd4a070, 0.55);

    // 5) 길 위 자갈/돌 잔돌 (시드 의사난수로 결정)
    const stones = this.add.graphics().setDepth(7);
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 4; i < pts.length - 4; i += 3) {
      if (rnd() < 0.45) continue;
      const a = pts[i], b = pts[i + 1] ?? a;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const perp = ang + Math.PI / 2;
      const off = (rnd() - 0.5) * lane * 0.55;
      const sx = a.x + Math.cos(perp) * off;
      const sy = a.y + Math.sin(perp) * off;
      const r = 1 + rnd() * 1.6;
      stones.fillStyle(0x6e4a30, 0.6);
      stones.fillCircle(sx + 0.5, sy + 0.5, r);
      stones.fillStyle(0xc89870, 0.85);
      stones.fillCircle(sx, sy, r);
    }

    // 6) 길 양옆 풀 디테일 — 작은 점 풀잎
    const tufts = this.add.graphics().setDepth(7);
    for (let i = 2; i < pts.length - 2; i += 2) {
      if (rnd() < 0.55) continue;
      const a = pts[i], b = pts[i + 1] ?? a;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const perp = ang + Math.PI / 2;
      const side = rnd() < 0.5 ? 1 : -1;
      const off = side * (lane * 0.55 + 4 + rnd() * 6);
      const tx = a.x + Math.cos(perp) * off;
      const ty = a.y + Math.sin(perp) * off;
      tufts.fillStyle(0x4a7a32, 0.85);
      tufts.fillCircle(tx, ty, 1.6 + rnd() * 1.0);
      tufts.fillStyle(0x6ea848, 0.9);
      tufts.fillCircle(tx - 0.5, ty - 0.5, 1.0);
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

  // 분위기 — 떠다니는 입자 + 비네트
  drawAtmosphere(width, height) {
    // 비네트 (가장자리 어둡게) — 짙은 라디얼 그라디언트 흉내
    const v = this.add.graphics().setDepth(95);
    v.fillStyle(0x000000, 0);
    v.fillRect(0, 0, width, height);
    v.fillStyle(0x000000, 0.25);
    [
      { x: 0, y: 0, w: width, h: 70 },
      { x: 0, y: height - 70, w: width, h: 70 },
      { x: 0, y: 0, w: 50, h: height },
      { x: width - 50, y: 0, w: 50, h: height },
    ].forEach(r => v.fillRect(r.x, r.y, r.w, r.h));
    v.fillStyle(0x000000, 0.12);
    [
      { x: 0, y: 0, w: width, h: 110 },
      { x: 0, y: height - 110, w: width, h: 110 },
      { x: 0, y: 0, w: 90, h: height },
      { x: width - 90, y: 0, w: 90, h: height },
    ].forEach(r => v.fillRect(r.x, r.y, r.w, r.h));

    // 떠다니는 입자 (잎사귀/먼지)
    this.atmoParticles = this.add.group();
    this.time.addEvent({
      delay: 320,
      loop: true,
      callback: () => this.spawnAtmoParticle(width, height),
    });
    // 처음 30개 미리 생성
    for (let i = 0; i < 14; i++) this.spawnAtmoParticle(width, height, true);
  }

  spawnAtmoParticle(width, height, immediate = false) {
    const stage = this.level.id;
    const kind = (stage === 'pass') ? 'snow'
              : (stage === 'crypt') ? 'ember'
              : (stage === 'forest') ? 'leaf'
              : 'dust';
    const colors = { dust: 0xfff5d8, leaf: 0xa86840, snow: 0xffffff, ember: 0xff8a3a };
    const col = colors[kind];
    const x = Math.random() * width;
    const y = immediate ? Math.random() * height : -10;
    const p = this.add.circle(x, y, kind === 'snow' ? 2 : 1.5, col, 0.7).setDepth(22);
    if (kind === 'ember') p.setBlendMode(Phaser.BlendModes.ADD);
    this.atmoParticles.add(p);
    const dur = 6000 + Math.random() * 4000;
    const sway = (Math.random() - 0.5) * 60;
    this.tweens.add({
      targets: p,
      y: height + 10,
      x: x + sway,
      alpha: { from: 0.7, to: 0.1 },
      duration: dur,
      ease: 'Linear',
      onComplete: () => p.destroy(),
    });
    this.tweens.add({
      targets: p, angle: { from: 0, to: 360 },
      duration: 1200 + Math.random() * 1200,
      repeat: -1,
    });
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
    // 웨이브 내 점진 스케일링: 후반 웨이브일수록 더 단단/빽빽
    const waveBoost = 1 + 0.07 * this.waveIdx;
    this.hpMul = this.baseHpMul * waveBoost;
    const intervalMul = this.spawnRateMul / (1 + 0.04 * this.waveIdx);
    for (const u of wave.units) {
      const [kind, count, interval, delay] = u;
      for (let i = 0; i < count; i++) {
        this.spawnQueue.push({ t: (delay ?? 0) + i * (interval ?? 0.6) * intervalMul, kind });
      }
    }
    this.spawnQueue.sort((a, b) => a.t - b.t);

    // 웨이브 배너
    const big = this.add.text(this.scale.width / 2, 100, wave.label, {
      fontFamily: FONT.display, fontSize: '28px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 3,
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
      // 보너스 보석 (드롭 형태로 영웅 근처에)
      for (let i = 0; i < 5; i++) {
        this.spawnCoin(this.king.x + (Math.random() - 0.5) * 60,
                       this.king.y + (Math.random() - 0.5) * 60, 5);
      }
      Juice.popText(this, this.scale.width / 2, this.scale.height / 2 - 20,
        '+25 BONUS', { color: COLORS.goldHud, size: 18 });
      this.updateHud();
    }
  }

  // 인게임 업그레이드 — 코인 소비, 타워와 같은 통화
  // 레벨이 올라갈수록 비용 증가, 캡 5
  buildUpgradeShop() {
    const { width, height } = this.scale;
    const drawerY = height - 30;
    const items = [
      { id: 'damage', icon: '⚔', color: 0xff8a3a, name: 'DMG',
        baseCost: 35,
        apply: () => { this.king.weapon.damage = Math.round(this.king.weapon.damage * 1.18); },
        desc: 'BOW DAMAGE +18%', maxLevel: 5 },
      { id: 'firerate', icon: '➶', color: 0xfff4a0, name: 'RATE',
        baseCost: 40,
        apply: () => { this.king.weapon.fireRate *= 0.85; },
        desc: 'FIRE RATE +18%', maxLevel: 5 },
      { id: 'heal', icon: '♥', color: 0xc8302d, name: 'HEAL',
        baseCost: 25,
        apply: () => {
          this.king.maxHp += 1;
          this.king.hp = this.king.maxHp;
          this.updateHud();
        },
        desc: 'MAX HP +1, FULL HEAL', maxLevel: 8 },
      { id: 'magnet', icon: '◉', color: 0xffd24a, name: 'PULL',
        baseCost: 20,
        apply: () => { this.king.magnetRadius = Math.round(this.king.magnetRadius * 1.3); },
        desc: 'COIN MAGNET +30%', maxLevel: 4 },
    ];
    this.shopLevels = {};
    items.forEach(it => { this.shopLevels[it.id] = 0; });

    const slotW = 56, slotH = 50, gap = 6;
    const totalW = items.length * slotW + (items.length - 1) * gap;
    const startX = (width - totalW) / 2 + slotW / 2;
    this.shopButtons = [];

    items.forEach((it, i) => {
      const cx = startX + i * (slotW + gap);
      const c = this.add.container(cx, drawerY).setDepth(102);
      const bgG = this.add.graphics();
      const lvLabel = this.add.text(-slotW / 2 + 5, -slotH / 2 + 4, '', {
        fontFamily: FONT.mono, fontSize: '8px', fontStyle: '700',
        color: '#fff5d8',
      }).setOrigin(0, 0).setDepth(2);
      const iconT = this.add.text(0, -8, it.icon, {
        fontFamily: FONT.display, fontSize: '18px', fontStyle: '900',
        color: Phaser.Display.Color.IntegerToColor(it.color).rgba,
        stroke: '#3e2e1e', strokeThickness: 2,
      }).setOrigin(0.5);
      const cost = this.add.text(0, 12, '', {
        fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
        color: '#fff5d8',
      }).setOrigin(0.5);
      c.add([bgG, iconT, lvLabel, cost]);
      c.setSize(slotW, slotH);
      c.setInteractive({ useHandCursor: true });
      const draw = () => {
        const lv = this.shopLevels[it.id];
        const maxed = lv >= it.maxLevel;
        const price = Math.round(it.baseCost * Math.pow(1.6, lv));
        const can = !maxed && this.coinsEarned >= price;
        bgG.clear();
        bgG.fillStyle(0x000000, 0.55);
        bgG.fillRoundedRect(-slotW / 2 + 2, -slotH / 2 + 2, slotW, slotH, 6);
        bgG.fillStyle(maxed ? 0x6a5a3a : (can ? 0x4a2a14 : 0x2a1810), 1);
        bgG.fillRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 6);
        bgG.lineStyle(1.5, it.color, can || maxed ? 0.95 : 0.45);
        bgG.strokeRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 6);
        iconT.setAlpha(can || maxed ? 1 : 0.5);
        if (maxed) {
          cost.setText('MAX');
          cost.setColor('#f4c542');
        } else {
          cost.setText('⛁' + price);
          cost.setColor(can ? '#fff5d8' : '#a89878');
        }
        // 레벨 핍 (작은 점 — 좌상단)
        lvLabel.setText('●'.repeat(lv) + '○'.repeat(it.maxLevel - lv));
        lvLabel.setColor(it.color === 0xc8302d ? '#ff8a8a' : '#f4c542');
        lvLabel.setFontSize(7);
      };
      draw();
      c.on('pointerdown', () => {
        const lv = this.shopLevels[it.id];
        if (lv >= it.maxLevel) return;
        const price = Math.round(it.baseCost * Math.pow(1.6, lv));
        if (this.coinsEarned < price) {
          // 부족 — 흔들림
          this.tweens.add({ targets: c, x: cx - 3, duration: 50, yoyo: true, repeat: 2,
            onComplete: () => { c.x = cx; } });
          Audio.miss?.();
          return;
        }
        this.coinsEarned -= price;
        this.shopLevels[it.id] = lv + 1;
        it.apply();
        Audio.purchase?.();
        Juice.popText(this, cx, drawerY - 40, it.desc,
          { color: it.color, size: 11, rise: 22, duration: 700 });
        // 시각적 강조
        this.tweens.add({ targets: c, scaleX: 1.15, scaleY: 1.15, duration: 100, yoyo: true });
        this.shopButtons.forEach(b => b.draw());
        this.updateHud();
      });
      this.shopButtons.push({ container: c, draw });
    });
  }

  refreshShop() {
    if (this.shopButtons) this.shopButtons.forEach(b => b.draw());
  }

  spawnEnemy(kind) {
    const e = this.enemies.find(en => !en.alive);
    if (!e) return;
    e.reset(kind, this.path, this.hpMul);
    if (kind === 'boss') {
      this.boss = e;
      this.spawnBossEntrance(e);
      e._mid = false;       // 50% HP 분기 — 미니언 소환 1회
    }
    // Gilded 적: 일반 적 중 ~5%, 보스 제외 — 황금빛 + 사망시 보너스
    e._gilded = false;
    if (kind !== 'boss' && Math.random() < 0.05) {
      e._gilded = true;
      e.body.setTint(0xffd24a);
      const halo = this.add.circle(0, 0, 22, 0xffd24a, 0.3).setDepth(e.depth - 1);
      halo._follow = e;
      this.tweens.add({
        targets: halo, alpha: { from: 0.18, to: 0.45 },
        duration: 600, yoyo: true, repeat: -1,
      });
      this._gildedHalos = this._gildedHalos ?? [];
      this._gildedHalos.push(halo);
    }
    return e;
  }

  updateBossHud() {
    if (!this.boss || !this.boss.alive || !this.bossHpFill) {
      if (this.bossHpFill && (!this.boss || !this.boss.alive)) {
        this.bossHpFill.destroy(); this.bossHpFill = null;
        this.bossHpBg?.destroy(); this.bossHpBg = null;
        this.bossLabel?.destroy(); this.bossLabel = null;
      }
      return;
    }
    const ratio = Math.max(0, this.boss.hp / this.boss.maxHp);
    const w = this.scale.width - 60;
    this.bossHpFill.width = w * ratio;
    // 50% 분기 — 미니언 4기 소환 + 화면 플래시
    if (!this.boss._mid && ratio <= 0.5) {
      this.boss._mid = true;
      Juice.flash(this, 0xc8302d, 200);
      Juice.shake(this, 0.014, 220);
      Juice.popText(this, this.boss.x, this.boss.y - 30, 'ENRAGED!',
        { color: 0xff5050, size: 16, rise: 28, duration: 700 });
      // 미니언 — 즉시 4기 추가 스폰 (보스 위치는 path 따라 진행 중이므로 새 적은 path 시작점에서 등장)
      for (let i = 0; i < 4; i++) {
        this.time.delayedCall(i * 220, () => this.spawnEnemy('scout'));
      }
    }
  }

  spawnBossEntrance(boss) {
    const { width } = this.scale;
    Juice.flash(this, 0xc8302d, 320);
    Juice.shake(this, 0.018, 320);
    const banner = this.add.text(width / 2, 220, 'WARLORD APPROACHES', {
      fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
      color: '#ff8a3a', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(900).setAlpha(0);
    banner.setLetterSpacing?.(4);
    this.tweens.add({
      targets: banner, alpha: { from: 0, to: 1 }, scale: { from: 1.6, to: 1 },
      duration: 320, ease: 'Back.Out',
    });
    this.tweens.add({
      targets: banner, alpha: 0,
      delay: 1400, duration: 380,
      onComplete: () => banner.destroy(),
    });
    // 보스 HP바 (상단)
    if (this.bossHpBg) { this.bossHpBg.destroy(); this.bossHpFill?.destroy(); this.bossLabel?.destroy(); }
    const hbY = 86;
    this.bossHpBg = this.add.rectangle(width / 2, hbY, width - 60, 8, 0x000000, 0.8).setDepth(901);
    this.bossHpFill = this.add.rectangle(30, hbY, width - 60, 6, 0xc8302d, 1).setOrigin(0, 0.5).setDepth(902);
    this.bossLabel = this.add.text(width / 2, hbY - 12, 'WARLORD GROK', {
      fontFamily: FONT.display, fontSize: '11px', fontStyle: '900',
      color: '#ff8a3a', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(903).setLetterSpacing?.(3);
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

  spawnArrow(x, y, angle, weapon, targetEnemy = null) {
    const p = this.projectiles.find(pr => !pr.alive);
    if (!p) return;
    // 실제 타겟이 있으면 그쪽으로 호밍, 없으면 직선 비행
    const target = targetEnemy ?? { x: x + Math.cos(angle) * 100, y: y + Math.sin(angle) * 100 };
    p.reset(x, y, target, 'archer', {
      damage: weapon.damage,
      speed: weapon.projectileSpeed,
      homing: !!targetEnemy,
    });
    Audio.tap();
  }

  fireProjectile(tower, target) {
    const p = this.projectiles.find(pr => !pr.alive);
    if (!p) return;
    // 모탈은 범위 폭격이라 호밍 X, 나머지(archer/cannon/frost)는 호밍
    const homing = tower.cfg.bulletKind !== 'mortar';
    p.reset(tower.x, tower.y - 6, target, tower.cfg.bulletKind, {
      damage: tower.damage,
      splash: tower.cfg.splash,
      slow: tower.cfg.slow,
      speed: tower.cfg.bulletSpeed,
      homing,
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
        // 화살 진행 방향 (호밍이라 frame-by-frame angle)
        const hdx = Math.cos(p.angle), hdy = Math.sin(p.angle);
        if (p.splash > 0) {
          for (const e2 of this.enemies) {
            if (!e2.alive) continue;
            const ddx = e2.x - p.x;
            const ddy = e2.y - p.y;
            if (ddx * ddx + ddy * ddy < (p.splash + 18) * (p.splash + 18)) {
              this.spawnDmgNumber(e2.x, e2.y - 18, p.dmg, p.kind);
              const killed = e2.takeDamage(p.dmg, hdx, hdy);
              if (killed) this.onEnemyKilled(e2);
            }
          }
          this.spawnExplosion(p.x, p.y, p.splash);
        } else {
          this.spawnDmgNumber(e.x, e.y - 18, p.dmg, p.kind);
          const killed = e.takeDamage(p.dmg, hdx, hdy);
          if (p.slow > 0) e.applySlow(p.slow, 1500);
          if (killed) this.onEnemyKilled(e);
        }
        this.spawnHitFlash(p.x, p.y, p.kind);
        p.deactivate();
        return;
      }
    }
  }

  // 데미지 숫자 — 위로 떠오르며 페이드
  spawnDmgNumber(x, y, n, kind = 'archer') {
    const color = kind === 'frost' ? '#a0e0ff'
                : kind === 'mortar' ? '#ffd070'
                : kind === 'cannon' ? '#ffaa55'
                : '#fff5d8';
    const t = this.add.text(x + (Math.random() - 0.5) * 12, y, String(n), {
      fontFamily: FONT.display, fontSize: '14px', fontStyle: '900',
      color, stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(925);
    this.tweens.add({
      targets: t, y: y - 22, alpha: { from: 1, to: 0 },
      scale: { from: 0.7, to: 1.05 },
      duration: 480, ease: 'Cubic.Out',
      onComplete: () => t.destroy(),
    });
  }

  // 화살이 박힌 듯한 임팩트 — 확장하는 + 모양 대신, 짧은 플래시 + 살짝 튀는 부스러기
  spawnHitFlash(x, y, kind = 'archer') {
    const color = kind === 'frost' ? 0xa0e0ff
                : kind === 'mortar' || kind === 'cannon' ? 0xffaa55
                : 0xfff4a0;
    const flash = this.add.circle(x, y, 8, color, 0.85).setDepth(920);
    this.tweens.add({
      targets: flash, alpha: 0, scale: { from: 1.4, to: 0.6 },
      duration: 130, ease: 'Cubic.Out',
      onComplete: () => flash.destroy(),
    });
    // 작은 부스러기 3개 — 임팩트 지점에서 약간만 튐 (이전엔 +shape이 1.6배로 부풀어 튕겨나가 보였음)
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 6 + Math.random() * 6;
      const sp = this.add.circle(x, y, 1.2, color, 1).setDepth(919);
      this.tweens.add({
        targets: sp,
        x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
        alpha: 0, duration: 180, ease: 'Cubic.Out',
        onComplete: () => sp.destroy(),
      });
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
    // ── 콤보 ──
    const now = this.time.now;
    if (now > this.comboUntil) this.combo = 0;
    this.combo++;
    this.comboUntil = now + 2500;
    if (this.combo > this.comboBest) this.comboBest = this.combo;
    const mult = this.combo >= 25 ? 4 : this.combo >= 15 ? 3 : this.combo >= 7 ? 2 : 1;
    this.score += e.scoreVal * mult;
    this.kills++;
    if (e === this.boss) this.boss = null;

    // 콤보 milestone popText
    const milestone = (this.combo === 7 || this.combo === 15 || this.combo === 25);
    if (milestone) {
      const label = this.combo === 7 ? 'STREAK!' : this.combo === 15 ? 'FRENZY!' : 'CARNAGE!';
      Juice.popText(this, this.king.x, this.king.y - 36, label,
        { color: 0xff8a3a, size: 18, rise: 36, duration: 700 });
      Juice.flash(this, 0xff8a3a, 100);
    }

    // ── 코인/보석 드롭 ──
    const goldRush = (this._goldRushUntil ?? -1) >= this.waveIdx;
    const dropMul = goldRush ? 2 : 1;
    const drops = Math.max(3, Math.min(12, Math.round(e.bounty / 3))) * dropMul;
    for (let i = 0; i < drops; i++) {
      this.spawnCoin(e.x + (Math.random() - 0.5) * 12,
                     e.y + (Math.random() - 0.5) * 8, 1);
    }
    // 보석: 기본 6% + 콤보 보너스 + LUCKY STAR 영구 보너스
    const gemChance = 0.06 + (mult - 1) * 0.02 + (this._gemBonus ?? 0);
    if (Math.random() < gemChance) {
      this.spawnCoin(e.x, e.y - 4, 5);
    }
    // Gilded 적 — 사망시 추가 코인 폭발 + 하트 회복
    if (e._gilded) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        this.spawnCoin(e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, 1);
      }
      Juice.popText(this, e.x, e.y - 40, '+ HEART',
        { color: 0xff5050, size: 14, rise: 26, duration: 700 });
      this.king.hp = Math.min(this.king.maxHp, this.king.hp + 1);
      Juice.flash(this, 0xffd24a, 180);
      this.updateHud();
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
    // 양피지 풀-너비 패널
    const h = 54;
    const panel = this.add.graphics().setDepth(100);
    panel.fillStyle(0x000000, 0.55);
    panel.fillRect(0, h, width, 4);
    panel.fillStyle(COLORS.woodDark, 1);
    panel.fillRect(0, 0, width, h);
    panel.fillStyle(COLORS.parchment, 0.96);
    panel.fillRect(4, 4, width - 8, h - 8);
    panel.fillStyle(COLORS.goldHud, 0.7);
    panel.fillRect(4, h - 6, width - 8, 2);
    panel.fillStyle(COLORS.parchmentDim, 0.4);
    panel.fillRect(4, 4, width - 8, 4);
    // 모서리 골드 못
    panel.fillStyle(COLORS.goldDeep, 1);
    [[10, 10], [width - 10, 10], [10, h - 10], [width - 10, h - 10]]
      .forEach(([px, py]) => {
        panel.fillCircle(px, py, 2.5);
        panel.fillStyle(COLORS.goldHud, 1);
        panel.fillCircle(px, py, 1.5);
        panel.fillStyle(COLORS.goldDeep, 1);
      });

    // 좌측: 코인 아이콘 + 카운트
    const coinIcon = this.add.graphics().setDepth(101);
    const cx = 20, cy = 28;
    coinIcon.fillStyle(COLORS.goldDeep, 1);
    coinIcon.fillCircle(cx + 1, cy + 1, 9);
    coinIcon.fillStyle(0xffd24a, 1);
    coinIcon.fillCircle(cx, cy, 8);
    coinIcon.fillStyle(COLORS.goldDeep, 1);
    coinIcon.fillCircle(cx, cy, 4);
    coinIcon.fillStyle(0xffffff, 0.8);
    coinIcon.fillCircle(cx - 2, cy - 2, 1.2);
    this.hudCoins = this.add.text(34, 18, '0', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#3e2e1e', stroke: '#fff5d8', strokeThickness: 1,
    }).setOrigin(0, 0).setDepth(101);

    // 중앙: STAGE 이름 + 웨이브
    this.add.text(width / 2, 6, this.level.name, {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#5a3e2e',
    }).setOrigin(0.5, 0).setDepth(101).setLetterSpacing?.(3);
    this.hudWave = this.add.text(width / 2, 20, '...', {
      fontFamily: FONT.display, fontSize: '16px', fontStyle: '900',
      color: '#3e2e1e', stroke: '#fff5d8', strokeThickness: 1,
    }).setOrigin(0.5, 0).setDepth(101).setLetterSpacing?.(2);

    // 우측: 영웅 HP (♥) + 난이도 별
    this.hudHp = this.add.text(width - 20, 18, '♥ 5', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#c8302d', stroke: '#fff5d8', strokeThickness: 1,
    }).setOrigin(1, 0).setDepth(101);

    // 난이도 표시 — 업그레이드 누적 + 레벨 hpMul 기반
    const diffColor = this.upgradeLevels >= 12 ? '#ff5050'
                    : this.upgradeLevels >= 6  ? '#ff8a3a'
                    : '#9ad0a0';
    const filled = Math.min(5, 1 + Math.floor((this.upgradeLevels + (this.level.hpMul - 1) * 5) / 3));
    const diffStars = '★'.repeat(filled) + '☆'.repeat(Math.max(0, 5 - filled));
    this.hudDiff = this.add.text(width - 20, 42, diffStars, {
      fontFamily: FONT.display, fontSize: '11px', fontStyle: '900',
      color: diffColor, stroke: '#3e2e1e', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(101);
    this.hudDiff.setLetterSpacing?.(1);

    // 콤보 카운터 — 화면 중앙 상단, 활성 시에만
    this.hudCombo = this.add.text(width / 2, 50, '', {
      fontFamily: FONT.display, fontSize: '22px', fontStyle: '900',
      color: '#ff8a3a', stroke: '#3e2e1e', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(101).setAlpha(0);
    this.hudCombo.setLetterSpacing?.(2);

    // 로얄 볼리 HUD 버튼 — shop drawer 위쪽 (우측)
    this.makeVolleyButton(width - 36, this.scale.height - 110);

    // 인게임 업그레이드 shop 드로어 (하단 가운데)
    this.buildUpgradeShop();

    this.updateHud();
  }

  // ────────────── 로얄 볼리 ──────────────
  makeVolleyButton(cx, cy) {
    const r = 32;
    const c = this.add.container(cx, cy).setDepth(102);
    const ring = this.add.graphics();
    const bg = this.add.graphics();
    const cdArc = this.add.graphics();
    const icon = this.add.text(0, -2, '⟁', {
      fontFamily: FONT.display, fontSize: '30px', fontStyle: '900',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 3,
    }).setOrigin(0.5);
    const label = this.add.text(0, 18, 'VOLLEY', {
      fontFamily: FONT.mono, fontSize: '8px', fontStyle: '700',
      color: '#fff5d8',
    }).setOrigin(0.5).setLetterSpacing?.(2);
    c.add([ring, bg, cdArc, icon, label]);
    c.setSize(r * 2, r * 2);
    c.setInteractive({ useHandCursor: true });
    this.volley = {
      container: c, ring, bg, cdArc, icon, label,
      ready: true,
      cooldown: 0,
      cooldownMax: this._volleyCooldown ?? 12,
      r,
    };
    this.drawVolleyButton();
    c.on('pointerdown', () => this.fireRoyalVolley());
  }

  drawVolleyButton() {
    const v = this.volley;
    if (!v) return;
    v.ring.clear(); v.bg.clear(); v.cdArc.clear();
    const r = v.r;
    v.ring.fillStyle(0x000000, 0.55);
    v.ring.fillCircle(2, 2, r + 1);
    v.ring.fillStyle(COLORS.woodDark, 1);
    v.ring.fillCircle(0, 0, r + 1);
    v.bg.fillStyle(v.ready ? 0xc8302d : 0x3a2820, 1);
    v.bg.fillCircle(0, 0, r - 2);
    v.bg.lineStyle(2, COLORS.goldHud, v.ready ? 1 : 0.45);
    v.bg.strokeCircle(0, 0, r - 2);
    v.icon.setAlpha(v.ready ? 1 : 0.4);
    v.label.setAlpha(v.ready ? 1 : 0.5);
    if (!v.ready) {
      // 쿨다운 진행 호 (시계 방향)
      const ratio = 1 - v.cooldown / v.cooldownMax;
      v.cdArc.lineStyle(3, COLORS.goldHud, 0.85);
      v.cdArc.beginPath();
      v.cdArc.arc(0, 0, r - 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio, false);
      v.cdArc.strokePath();
    }
  }

  fireRoyalVolley() {
    if (!this.volley?.ready) return;
    const target = this.findFireTarget();
    const baseAng = target
      ? Math.atan2(target.y - this.king.y, target.x - this.king.x)
      : -Math.PI / 2;
    // 5발 부채 — ±25° 펼침, 데미지 1.4배
    const fan = 5, spread = (50 * Math.PI / 180);
    const dmg = Math.round(this.king.weapon.damage * 1.4);
    for (let i = 0; i < fan; i++) {
      const t = (i / (fan - 1)) - 0.5;
      const a = baseAng + t * spread;
      const ox = this.king.x + Math.cos(a) * 18;
      const oy = this.king.y + Math.sin(a) * 18;
      // 직선 비행 (호밍 X) — 부채 모양 유지
      const p = this.projectiles.find(pr => !pr.alive);
      if (!p) break;
      p.reset(ox, oy,
        { x: ox + Math.cos(a) * 200, y: oy + Math.sin(a) * 200 },
        'archer', { damage: dmg, speed: this.king.weapon.projectileSpeed * 1.1, homing: false });
    }
    // FX
    Juice.flash(this, COLORS.goldHud, 140);
    Juice.shake(this, 0.01, 120);
    Juice.popText(this, this.king.x, this.king.y - 36, 'ROYAL VOLLEY!',
      { color: 0xf4c542, size: 16, rise: 28, duration: 700 });
    Audio.fanfare();
    this.volley.ready = false;
    this.volley.cooldown = this.volley.cooldownMax;
    this.drawVolleyButton();
  }

  updateVolley(dt) {
    if (!this.volley || this.volley.ready) return;
    this.volley.cooldown = Math.max(0, this.volley.cooldown - dt);
    if (this.volley.cooldown <= 0) {
      this.volley.ready = true;
      Juice.popText(this, this.volley.container.x, this.volley.container.y - 38, 'READY',
        { color: 0xf4c542, size: 11, rise: 16, duration: 500 });
    }
    this.drawVolleyButton();
  }

  spendCoins(n) {
    this.coinsEarned = Math.max(0, this.coinsEarned - n);
    this.updateHud();
  }

  updateHud() {
    if (!this.hudCoins) return;
    this.hudCoins.setText(String(this.coinsEarned));
    this.hudHp.setText('♥ ' + this.king.hp);
    this.refreshShop?.();
    if (this.hudCombo) {
      if (this.combo >= 3) {
        const mult = this.combo >= 25 ? 4 : this.combo >= 15 ? 3 : this.combo >= 7 ? 2 : 1;
        this.hudCombo.setText(`${this.combo} COMBO  ×${mult}`);
        if (this.hudCombo.alpha < 1) this.tweens.add({ targets: this.hudCombo, alpha: 1, duration: 120 });
      } else if (this.hudCombo.alpha > 0) {
        this.tweens.add({ targets: this.hudCombo, alpha: 0, duration: 200 });
      }
    }
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
    const totalGems = (this.gemsEarned ?? 0) + (victory ? 3 : 0);
    if (totalGems) Storage.addGems(totalGems);
    // 별 평가 (승리시): 1) 클리어 2) 무피해(throne 풀HP) 3) S grade
    let stars = 0;
    if (victory) {
      stars = 1;
      const throneHp = this.building?.hp ?? 0;
      const throneFull = this.building?.maxHp ?? 1;
      if (throneHp >= throneFull) stars = 2;
      if (this.score >= GRADE_CUTS.S) stars = 3;
    }
    const isNewStars = stars > 0 ? Storage.setStars(stageKey, stars) : false;
    Analytics.track('session_end', {
      game: 'king-shot', stage: this.level.id,
      score: this.score, kills: this.kills, victory, isBest,
      stars, comboBest: this.comboBest,
    });
    this.cameras.main.fadeOut(420, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ResultScene', {
        victory, score: this.score, kills: this.kills,
        bestScore: Math.max(prevBest, this.score),
        isBest, stageId: this.level.id,
        coinsEarned: this.coinsEarned, gemsEarned: totalGems,
        stars, isNewStars, comboBest: this.comboBest,
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
