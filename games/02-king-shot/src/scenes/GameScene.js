// GameScene — 메인 플레이.
// Step 3: 적 5종 스폰 + 화살×적/적×왕 충돌 + 콤보 시스템 + HUD(HP/SCORE/KILLS/콤보).

import { COLORS, FONT, GAME, getStage, ENEMY_KIND, ENEMY_TYPES, COMBO, COMBO_RANKS, WAVES } from '../config.js';
import { King } from '../entities/King.js';
import { Bullet, BULLET_KIND } from '../entities/Bullet.js';
import { Enemy } from '../entities/Enemy.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';

const BULLET_POOL = 80;
const ENEMY_BULLET_POOL = 32;
const ENEMY_POOL = 40;


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

    // ── 풀: 화살 (왕/적) ──
    this.bullets = [];
    for (let i = 0; i < BULLET_POOL; i++) {
      const b = new Bullet(this);
      b.setDepth(40);
      this.bullets.push(b);
    }
    this.enemyBullets = [];
    for (let i = 0; i < ENEMY_BULLET_POOL; i++) {
      const b = new Bullet(this);
      b.setDepth(40);
      this.enemyBullets.push(b);
    }

    // ── 풀: 적 ──
    this.enemies = [];
    for (let i = 0; i < ENEMY_POOL; i++) {
      const e = new Enemy(this);
      e.setDepth(45);
      this.enemies.push(e);
    }

    // ── 왕 배치 ──
    this.king = new King(this);
    this.king.setPosition(width / 2, GAME.kingY);
    this.king.setDepth(50);

    // ── HUD ──
    this.drawHud();

    // ── 상태 ──
    this.score = 0;
    this.displayedScore = 0;
    this.kills = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lastKillAt = 0;
    this.reachedRanks = new Set();
    this.gemsEarned = 0;
    this.spawnTimer = 1.5;
    this.elapsed = 0;
    this.isPlaying = false;
    this.isOver = false;
    // 웨이브
    this.waveIdx = 0;
    this.waveTimeLeft = WAVES[0]?.duration ?? 12;
    this.waveSpawnsLeft = true;        // 이 웨이브 동안 스폰 진행 중
    this.waveBetween = false;            // 웨이브 사이 (잠시 정적)

    // ── 입력: 드래그 → 왕 이동 ──
    this.input.on('pointerdown', (p) => this.handlePointer(p));
    this.input.on('pointermove', (p) => {
      if (p.isDown) this.handlePointer(p);
    });
    const stopDrag = () => this.king.clearDragTarget();
    this.input.on('pointerup', stopDrag);
    this.input.on('pointerupoutside', stopDrag);

    // ── 발 밑 먼지 퍼프 ──
    this._dustTimer = 0;
    this._lastKingPos = { x: this.king.x, y: this.king.y };

    // ── 카운트다운 후 시작 ──
    this.runCountdown();

    // BGM
    Audio.playBgm(stage.bgm, { fadeIn: 0.6, volume: 0.7 });
  }

  runCountdown() {
    const { width, height } = this.scale;
    const big = this.add.text(width / 2, height / 2, '3', {
      fontFamily: FONT.display,
      fontSize: '120px',
      fontStyle: '900',
      color: '#f4c542',
      stroke: '#3e2e1e',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(500);

    let n = 3;
    const tick = () => {
      big.setText(n > 0 ? String(n) : 'GO');
      this.tweens.add({
        targets: big,
        scale: { from: 1.4, to: 1 },
        alpha: { from: 1, to: 0 },
        duration: 750,
        ease: 'Cubic.Out',
        onComplete: () => {
          if (n <= 0) {
            big.destroy();
            this.isPlaying = true;
          } else {
            n--;
            tick();
          }
        },
      });
    };
    tick();
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

    // 왕 업데이트
    this.king.update(dt, this);

    // 발 밑 먼지 퍼프
    this._dustTimer -= dt;
    const ddx = this.king.x - this._lastKingPos.x;
    const ddy = this.king.y - this._lastKingPos.y;
    const moved = Math.hypot(ddx, ddy);
    if (moved > 1.0 && this._dustTimer <= 0) {
      this._dustTimer = 0.08;
      this.spawnDustPuff(this.king.x + (Math.random() - 0.5) * 12,
                        this.king.y + 24 + (Math.random() - 0.5) * 4);
    }
    this._lastKingPos.x = this.king.x;
    this._lastKingPos.y = this.king.y;

    if (!this.isPlaying || this.isOver) {
      // 카운트다운 중에도 화살은 그려져야 어색하지 않으니 update만
      for (const b of this.bullets) if (b.alive) b.update(dt, this);
      for (const b of this.enemyBullets) if (b.alive) b.update(dt, this);
      return;
    }

    this.elapsed += dt;

    // ── 웨이브 진행 ──
    this.tickWave(dt);

    // ── 적 업데이트 ──
    const kingPos = { x: this.king.x, y: this.king.y };
    for (const e of this.enemies) {
      if (e.alive) e.update(dt, this, kingPos);
    }

    // ── 자동 사격 (가장 가까운 적) ──
    const target = this.findFireTarget();
    if (target) {
      this.king.tryFire(target.x, target.y, (sx, sy, ang, weapon) => {
        this.spawnArrow(sx, sy, ang, weapon);
      });
    }

    // ── 화살 업데이트 + 충돌 ──
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.update(dt, this);
      if (b.alive) this.checkBulletVsEnemies(b);
    }
    for (const b of this.enemyBullets) {
      if (!b.alive) continue;
      b.update(dt, this);
      if (b.alive) this.checkEnemyBulletVsKing(b);
    }

    // ── 적 vs 왕 접촉 데미지 ──
    this.checkEnemyContactKing(dt);

    // ── 콤보 윈도우 종료 ──
    if (this.combo > 0 && (this.time.now - this.lastKillAt) > COMBO.windowMs) {
      this.combo = 0;
      this.updateComboText();
    }
  }

  findFireTarget() {
    // 가장 가까운 살아있는 적 (왕 기준 squared distance)
    let best = null;
    let bestD = Infinity;
    const kx = this.king.x, ky = this.king.y;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      // 화면 안 적만 (위로 올라간 적은 무시)
      if (e.y < -10 || e.y > this.scale.height + 10) continue;
      const dx = e.x - kx;
      const dy = e.y - ky;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
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

  spawnEnemyArrow(x, y, angle) {
    const b = this.enemyBullets.find(b => !b.alive);
    if (!b) return;
    b.reset(x, y, angle, BULLET_KIND.ENEMY, {
      damage: 1, speed: 320,
    });
  }

  spawnEnemy() {
    const wave = WAVES[this.waveIdx];
    if (!wave || !wave.weights) return;
    const e = this.enemies.find(e => !e.alive);
    if (!e) return;
    // 현재 웨이브의 가중치
    const totalW = wave.weights.reduce((s, ww) => s + ww.w, 0);
    let r = Math.random() * totalW;
    let kind = ENEMY_KIND.GOBLIN;
    for (const ww of wave.weights) {
      r -= ww.w;
      if (r <= 0) { kind = ww.kind; break; }
    }
    const x = 40 + Math.random() * (this.scale.width - 80);
    const y = -30;
    e.reset(x, y, kind, this.stage.hpMul);
  }

  // ── 웨이브 ──
  tickWave(dt) {
    if (this.waveBetween) return;
    const wave = WAVES[this.waveIdx];
    if (!wave) return;

    // 보스 웨이브는 Step 5에서 처리 — 지금은 스폰 안 함
    if (wave.boss) {
      // 임시: 보스 웨이브 진입 시 즉시 클리어 처리 → 결과 안내
      if (!this._bossPlaceholderShown) {
        this._bossPlaceholderShown = true;
        this.showBossPlaceholder();
      }
      return;
    }

    // 스폰
    if (this.waveSpawnsLeft) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy();
        const rate = wave.spawnRate * (this.stage.spawnMul ?? 1);
        this.spawnTimer = rate * (0.85 + Math.random() * 0.3);
      }
      this.waveTimeLeft -= dt;
      if (this.waveTimeLeft <= 0) {
        this.waveSpawnsLeft = false;
      }
    }

    // 스폰 끝났고 살아있는 적 0이면 웨이브 클리어
    if (!this.waveSpawnsLeft && !this.enemies.some(e => e.alive)) {
      this.endWave();
    }
  }

  endWave() {
    this.waveBetween = true;
    Audio.levelUp();

    const isFinalNonBoss = this.waveIdx >= WAVES.length - 2;
    const nextIsBoss = WAVES[this.waveIdx + 1]?.boss;

    // 클리어 배너
    const big = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20,
      'WAVE CLEAR', {
        fontFamily: FONT.display, fontSize: '44px', fontStyle: '900',
        color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(600);
    big.setLetterSpacing?.(4);
    this.tweens.add({
      targets: big, scale: { from: 1.6, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 360, ease: 'Back.Out',
    });

    Juice.flash(this, COLORS.gold, 240);
    Juice.ring(this, this.king.x, this.king.y,
      { color: COLORS.gold, radius: 220, duration: 600, count: 2 });

    // 1.0초 뒤 업그레이드 카드 (보스 웨이브 직전 마지막은 픽 후 보스 진입)
    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: big, alpha: 0, duration: 220,
        onComplete: () => big.destroy(),
      });
      this.scene.pause();
      this.scene.launch('UpgradeScene', {
        king: this.king,
        weapon: this.king.weapon,
        waveLabel: nextIsBoss ? 'BOSS APPROACHES' : 'WAVE CLEAR',
        onPick: () => {
          this.scene.resume();
          this.startNextWave();
        },
      });
    });
  }

  startNextWave() {
    this.waveIdx++;
    this.waveBetween = false;
    const wave = WAVES[this.waveIdx];
    if (!wave) return;
    this.waveSpawnsLeft = !wave.boss;
    this.waveTimeLeft = wave.duration ?? 0;
    this.spawnTimer = 0.4;
    this.reachedRanks = new Set();   // 콤보 등급 재취득 가능
    this.combo = 0;
    this.updateComboText();

    // HUD WAVE 표시 갱신
    if (this.hudWave) {
      this.hudWave.setText(`WAVE ${this.waveIdx + 1}/${WAVES.length}`);
      Juice.punch(this, this.hudWave, 1.3, 200);
    }
  }

  // 보스 자리 (Step 5에서 실제 보스 등장)
  showBossPlaceholder() {
    const big = this.add.text(this.scale.width / 2, this.scale.height / 2,
      'BOSS WAVE\n(STEP 5에서 등장)', {
        fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
        color: '#c8302d', stroke: '#3e2e1e', strokeThickness: 5,
        align: 'center',
      }).setOrigin(0.5).setDepth(600);
    big.setLetterSpacing?.(3);
    Audio.fanfare();
    Juice.flash(this, COLORS.capeRed, 320);
    // 4초 뒤 메뉴로
    this.time.delayedCall(4000, () => {
      Audio.stopBgm({ fadeOut: 0.6 });
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  // ── 충돌 ──
  checkBulletVsEnemies(b) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const r = e.hitRadius + 6;
      if (dx * dx + dy * dy < r * r) {
        const ang = Math.atan2(b.vy, b.vx);
        // 크리티컬 굴림
        const isCrit = Math.random() < (b.crit ?? 0);
        const dmg = b.dmg * (isCrit ? 2 : 1);
        const { killed, dealt } = e.takeHit(dmg, ang);
        // 임팩트 스파크
        Juice.spark(this, b.x, b.y, COLORS.sparkYellow, 14);
        if (isCrit) {
          Juice.popText(this, e.x, e.y - 24, 'CRIT!', { color: COLORS.gold, size: 18 });
        }
        if (killed) {
          this.onEnemyKilled(e);
        } else if (dealt > 0) {
          // 데미지 인디케이터
          Juice.popText(this, e.x, e.y - 18, `-${dealt}`, {
            color: 0xffe6a0, size: 14, rise: 28, duration: 420,
          });
        }
        // 관통 처리
        if ((b.pierceLeft ?? 0) > 0) {
          b.pierceLeft -= 1;
        } else {
          b.deactivate();
          return;
        }
      }
    }
  }

  checkEnemyBulletVsKing(b) {
    if (this.king.alpha < 0.7) {
      // 왕 무적 깜빡임 중에도 충돌은 무시 (간단)
    }
    const dx = b.x - this.king.x;
    const dy = b.y - this.king.y;
    const r = this.king.hitRadius + 4;
    if (dx * dx + dy * dy < r * r) {
      b.deactivate();
      this.damageKing(1);
    }
  }

  checkEnemyContactKing(dt) {
    const kx = this.king.x, ky = this.king.y;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - kx;
      const dy = e.y - ky;
      const r = e.hitRadius + this.king.hitRadius - 2;
      if (dx * dx + dy * dy < r * r) {
        if (e._touchCooldown <= 0) {
          e._touchCooldown = 0.6;
          this.damageKing(1);
        }
      }
    }
  }

  // ── 처치 처리 ──
  onEnemyKilled(e) {
    this.combo = Math.min(this.combo + 1, 999);
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    this.lastKillAt = this.time.now;

    const mul = Math.min(COMBO.maxMul, 1 + this.combo * COMBO.bonusPerStep);
    const gained = Math.round(e.score * mul);
    this.score += gained;
    this.kills += 1;
    if (e.kind === ENEMY_KIND.GOLDEN) {
      this.gemsEarned = (this.gemsEarned ?? 0) + (e.gems || 1);
    }

    // 연출
    Juice.burst(this, e.x, e.y, { color: e.color, count: 10, speed: 220 });
    this.spawnSmokePuffs(e.x, e.y);
    Juice.popText(this, e.x, e.y - 28, `+${gained}`, {
      color: COLORS.gold, size: 16, rise: 50, duration: 600,
    });
    if (e.kind === ENEMY_KIND.GOLDEN) {
      Juice.ring(this, e.x, e.y, { color: COLORS.gold, radius: 100, duration: 480 });
      Audio.rare();
    } else {
      Audio.combo(Math.min(this.combo, 8));
    }

    // 5콤보마다 골드 링
    if (this.combo > 0 && this.combo % 5 === 0) {
      Juice.ring(this, this.king.x, this.king.y, { color: COLORS.gold, radius: 80, duration: 380 });
    }

    // 콤보 등급 배너
    for (const r of COMBO_RANKS) {
      if (this.combo >= r.at && !this.reachedRanks.has(r.at)) {
        this.reachedRanks.add(r.at);
        this.showRankBanner(r);
      }
    }

    e.pop();
    this.updateScoreText();
    this.updateComboText();
    this.updateKillsText();
  }

  damageKing(n) {
    if (!this.king.takeDamage(n)) return;
    Juice.flash(this, COLORS.capeRed, 200);
    Juice.shake(this, 0.014, 200);
    Audio.miss();
    this.combo = 0;  // 데미지 입으면 콤보 끊김
    this.updateComboText();
    this.updateHpHearts();
    if (this.king.hp <= 0) this.gameOver();
  }

  gameOver() {
    if (this.isOver) return;
    this.isOver = true;
    Audio.bomb();
    Juice.flash(this, COLORS.capeRed, 480);
    Juice.shake(this, 0.03, 400);
    const big = this.add.text(this.scale.width / 2, this.scale.height / 2, 'FALLEN', {
      fontFamily: FONT.display, fontSize: '60px', fontStyle: '900',
      color: '#c8302d', stroke: '#3e2e1e', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(700);
    big.setLetterSpacing?.(4);
    this.tweens.add({
      targets: big,
      scale: { from: 1.6, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 500, ease: 'Back.Out',
    });
    Audio.stopBgm({ fadeOut: 0.6 });
    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  spawnSmokePuffs(x, y) {
    for (let i = 0; i < 3; i++) {
      const dx = (Math.random() - 0.5) * 16;
      const dy = (Math.random() - 0.5) * 10;
      const r = 4 + Math.random() * 3;
      const s = this.add.circle(x + dx, y + dy, r, COLORS.smokeGray, 0.85).setDepth(46);
      this.tweens.add({
        targets: s,
        y: y + dy - 14 - Math.random() * 8,
        scale: { from: 1, to: 2 },
        alpha: 0,
        duration: 380 + Math.random() * 140,
        ease: 'Cubic.Out',
        onComplete: () => s.destroy(),
      });
    }
  }

  showRankBanner(rank) {
    const { width, height } = this.scale;
    Audio.rankup();
    const colorHex = '#' + rank.color.toString(16).padStart(6, '0');
    const t = this.add.text(width / 2, height / 2 - 60, rank.label, {
      fontFamily: FONT.display, fontSize: '46px', fontStyle: '900',
      color: colorHex, stroke: '#3e2e1e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(600);
    t.setLetterSpacing?.(3);
    this.tweens.add({
      targets: t,
      scale: { from: 1.6, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 220, ease: 'Back.Out',
    });
    this.tweens.add({
      targets: t,
      alpha: 0, y: t.y - 30,
      delay: 700, duration: 360,
      onComplete: () => t.destroy(),
    });

    // 양옆 깃발 펄럭
    [-1, 1].forEach(sign => {
      const fx = width / 2 + sign * 110;
      const fy = height / 2 - 60;
      const flag = this.add.graphics().setDepth(600);
      flag.fillStyle(COLORS.capeRed, 1);
      flag.fillTriangle(0, -10, sign * 18, 0, 0, 10);
      flag.x = fx; flag.y = fy;
      this.tweens.add({
        targets: flag,
        scaleX: { from: 0, to: 1 },
        duration: 220, ease: 'Back.Out',
      });
      this.tweens.add({
        targets: flag,
        rotation: { from: -0.15, to: 0.15 },
        duration: 200, yoyo: true, repeat: 3,
      });
      this.tweens.add({
        targets: flag,
        alpha: 0,
        delay: 800, duration: 300,
        onComplete: () => flag.destroy(),
      });
    });

    // 골드 링
    Juice.ring(this, width / 2, height / 2 - 60,
      { color: rank.color, radius: 130, duration: 520, count: 2 });
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

  // ─────────── HUD ───────────
  drawHud() {
    const { width } = this.scale;

    // 우상단: 점수 패널 (양피지 + 골드 트림)
    this.drawWoodPanel(width - 24 - 130, 18, 130, 48);
    this.add.text(width - 24 - 6, 24, 'SCORE', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#8a6a2a',
    }).setOrigin(1, 0).setDepth(101).setLetterSpacing?.(2);
    this.hudScore = this.add.text(width - 24 - 6, 36, '0', {
      fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
      color: '#3e2e1e',
    }).setOrigin(1, 0).setDepth(101).setLetterSpacing?.(1);

    // 좌상단: 스테이지 + 킬 패널
    this.drawWoodPanel(24, 18, 130, 48);
    const stage = this.stage;
    this.add.text(24 + 8, 24, `STAGE ${stage.label}`, {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#8a6a2a',
    }).setOrigin(0, 0).setDepth(101).setLetterSpacing?.(2);
    this.hudStageName = this.add.text(24 + 8, 36, stage.name, {
      fontFamily: FONT.display, fontSize: '14px', fontStyle: '700',
      color: '#3e2e1e',
    }).setOrigin(0, 0).setDepth(101).setLetterSpacing?.(2);

    // 좌상단 패널 아래: WAVE 표시
    this.hudWave = this.add.text(24 + 8, 72, 'WAVE 1/5', {
      fontFamily: FONT.mono, fontSize: '11px', fontStyle: '700',
      color: '#f4c542',
    }).setOrigin(0, 0).setDepth(101).setLetterSpacing?.(3);

    // 중앙 상단: 킬 카운터
    this.add.text(this.scale.width / 2, 24, 'KILLS', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#f4c542',
    }).setOrigin(0.5).setDepth(101).setLetterSpacing?.(3);
    this.hudKills = this.add.text(this.scale.width / 2, 50, '0', {
      fontFamily: FONT.display, fontSize: '28px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(101).setLetterSpacing?.(2);

    // HP 하트 (좌하단)
    this.hudHearts = [];
    for (let i = 0; i < this.king.maxHp; i++) {
      const g = this.add.graphics().setDepth(102);
      g.x = 24 + i * 24;
      g.y = this.scale.height - 30;
      this.hudHearts.push(g);
    }
    this.updateHpHearts();

    // 콤보 (우하단)
    this.add.text(this.scale.width - 24, this.scale.height - 50, 'COMBO', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#f4c542',
    }).setOrigin(1, 0).setDepth(101).setLetterSpacing?.(3);
    this.hudCombo = this.add.text(this.scale.width - 24, this.scale.height - 36, '×0', {
      fontFamily: FONT.display, fontSize: '22px', fontStyle: '900',
      color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(101).setLetterSpacing?.(2);
  }

  // 우드 패널 — 짙은 갈색 배경 + 골드 트림 + 모서리 못
  drawWoodPanel(x, y, w, h) {
    const g = this.add.graphics().setDepth(100);
    // 그림자
    g.fillStyle(0x000000, 0.45);
    g.fillRect(x + 2, y + 2, w, h);
    // 양피지 채움
    g.fillStyle(COLORS.parchment, 0.92);
    g.fillRect(x, y, w, h);
    // 우드 외곽
    g.lineStyle(3, COLORS.woodDark, 1);
    g.strokeRect(x, y, w, h);
    g.lineStyle(1, COLORS.gold, 0.85);
    g.strokeRect(x + 1, y + 1, w - 2, h - 2);
    // 모서리 못 (4개)
    g.fillStyle(COLORS.gold, 1);
    [[x + 4, y + 4], [x + w - 4, y + 4], [x + 4, y + h - 4], [x + w - 4, y + h - 4]]
      .forEach(([px, py]) => {
        g.fillCircle(px, py, 2);
        g.fillStyle(COLORS.goldDeep, 1);
        g.fillCircle(px, py, 1);
        g.fillStyle(COLORS.gold, 1);
      });
    return g;
  }

  updateScoreText() {
    if (!this.hudScore) return;
    Juice.countUp(this, this.hudScore, this.displayedScore, this.score, 320);
    this.displayedScore = this.score;
    Juice.punch(this, this.hudScore, 1.18, 180);
  }
  updateKillsText() {
    if (!this.hudKills) return;
    this.hudKills.setText(String(this.kills));
    Juice.punch(this, this.hudKills, 1.25, 180);
  }
  updateComboText() {
    if (!this.hudCombo) return;
    this.hudCombo.setText('×' + this.combo);
    if (this.combo > 0) Juice.punch(this, this.hudCombo, 1.18, 140);
  }
  updateHpHearts() {
    if (!this.hudHearts) return;
    this.hudHearts.forEach((g, i) => {
      g.clear();
      const filled = i < this.king.hp;
      // 하트 폴리곤: 두 원 + 삼각
      const col = filled ? COLORS.heartRed : 0x4a2424;
      const dk = filled ? 0x8a1818 : 0x2a1414;
      g.fillStyle(dk, 1);
      g.fillCircle(-5, -3, 6);
      g.fillCircle( 5, -3, 6);
      g.fillTriangle(-10, 0, 10, 0, 0, 10);
      g.fillStyle(col, 1);
      g.fillCircle(-5, -3, 5);
      g.fillCircle( 5, -3, 5);
      g.fillTriangle(-9, -1, 9, -1, 0, 9);
      // 하이라이트
      if (filled) {
        g.fillStyle(0xffd0d0, 0.6);
        g.fillCircle(-5, -5, 1.6);
      }
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
