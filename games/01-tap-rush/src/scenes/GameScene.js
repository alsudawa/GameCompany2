// GameScene — 실제 플레이 루프. v2 "도파민 패스".
// 추가 연출:
//  - 맥동하는 네온 배경 (콤보에 비례해 강해짐)
//  - 콤보 등급 배너 (NICE!/GREAT!/AMAZING!/INSANE!/GOD LIKE!)
//  - 스코어 마일스톤 팡파르 (중앙 큰 배너)
//  - HUD 점수 카운트업 + 펀치
//  - 포인터 트레일 + 탭 스파크
//  - 콤보 진행 바 (우측)

import { Orb, ORB_KIND } from '../entities/Orb.js';
import { Juice } from '../../../../shared/juice.js';
import { Audio } from '../../../../shared/audio.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { UI, FONT } from '../../../../shared/ui.js';
import {
  GAME, SPAWN, SPEED, PROB, COMBO, SCORE, GEMS_PER_RARE,
  COMBO_RANKS, SCORE_MILESTONES, COLORS, SKIN_EFFECTS,
} from '../config.js';

const POOL_SIZE = 32;

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05050c');

    const profile = Storage.load();
    this.skin = SKIN_EFFECTS[profile.equippedSkin] || SKIN_EFFECTS.default;

    // 맥동 네온 배경
    this.bgPulse = this.add.graphics().setDepth(-10);
    this.bgIntensity = 0;

    // 중앙 얕은 비네트 (바닥 네온)
    this.bgBase = this.add.graphics().setDepth(-20);
    this.drawBaseBg();

    // 상태
    this.score = 0;
    this.displayedScore = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.gemsEarned = 0;
    this.tapsMade = 0;
    this.lastTapAt = 0;
    this.remaining = GAME.sessionSeconds;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.isPlaying = false;
    this.reachedRanks = new Set();
    this.reachedMilestones = new Set();

    // 풀
    this.orbs = [];
    for (let i = 0; i < POOL_SIZE; i++) this.orbs.push(new Orb(this));

    // HUD
    this.drawHudBg();

    // 좌측: SCORE 라벨 + 큰 숫자
    this.add.text(22, 14, 'SCORE', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#6b708f',
    }).setLetterSpacing(3).setDepth(201);
    this.hudScore = this.add.text(22, 26, '0', {
      fontFamily: FONT.display, fontSize: '40px', fontStyle: '900',
      color: '#00e5ff',
    }).setDepth(201).setLetterSpacing(1);

    // 우측: TIME 라벨 + 큰 숫자
    this.add.text(width - 22, 14, 'TIME', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#6b708f',
    }).setOrigin(1, 0).setLetterSpacing(3).setDepth(201);
    this.hudTime = this.add.text(width - 22, 26, String(GAME.sessionSeconds), {
      fontFamily: FONT.display, fontSize: '40px', fontStyle: '900',
      color: '#e8ecf5',
    }).setOrigin(1, 0).setDepth(201).setLetterSpacing(1);

    // 중앙 콤보 배지 영역
    this.hudCombo = this.add.text(width / 2, 80, '', {
      fontFamily: FONT.display, fontSize: '26px', fontStyle: '900',
      color: '#ff2bd6',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(201).setLetterSpacing(2);

    // 하단 시간 progress bar
    this.timeBarBg = this.add.graphics().setDepth(200);
    this.timeBar = this.add.graphics().setDepth(201);
    this.drawTimeBar(1);

    // 콤보 진행 바 (우측 세로바)
    this.comboBarBg = this.add.graphics().setDepth(200);
    this.comboBar = this.add.graphics().setDepth(201);
    this.drawComboBar();

    // 네온 콤보 테두리
    this.borderFx = this.add.graphics().setDepth(500);
    this.borderAlpha = 0;

    // 포인터 트레일 + 탭 스파크
    Juice.attachPointerTrail(this, this.skin.color);

    // 수동 hit test — 겹친 오브 중 가장 가까운 것을 선택.
    // 탭 지점에 스파크는 항상, 오브가 근처에 있으면 그 오브를 탭 처리.
    this.input.on('pointerdown', (pointer) => {
      if (!this.isPlaying) return;
      Juice.spark(this, pointer.x, pointer.y, this.skin.color, 22);

      // 후보 탐색: 살아있고, 포인터와 거리가 (hitRadius + 보너스) 이내
      // 보너스는 "near miss"까지 관대하게 잡아주는 슬랙.
      const GRACE = 18;
      let best = null;
      let bestDist = Infinity;
      for (const o of this.orbs) {
        if (!o.alive) continue;
        const dx = pointer.x - o.x;
        const dy = pointer.y - o.y;
        const d2 = dx * dx + dy * dy;
        const maxR = o.hitRadius + GRACE;
        if (d2 <= maxR * maxR && d2 < bestDist) {
          bestDist = d2;
          best = o;
        }
      }
      if (best) this.onOrbTap(best);
    });

    this.startCountdown();
    this.events.once('shutdown', () => this.cleanup());
  }

  drawBaseBg() {
    const { width, height } = this.scale;
    // 배경 그리드 + 뷰포트 프레임 + 스캔라인
    UI.drawGrid(this, width, height, { cell: 40, color: 0x0f1530, alpha: 0.5, depth: -25 });
    UI.drawViewportFrame(this, width, height, { color: 0x00e5ff, alpha: 0.35, depth: -8, inset: 4 });
    UI.drawScanlines(this, width, height, { gap: 3, alpha: 0.035, depth: 1200 });

    // 바닥 네온 웨이브
    const g = this.bgBase;
    g.clear();
    g.fillStyle(0x00e5ff, 0.05);
    g.fillRect(0, height - 150, width, 150);
    g.fillStyle(0xff2bd6, 0.04);
    g.fillRect(0, height - 90, width, 90);
    // 중앙 수평 기준선
    g.lineStyle(1, 0x00e5ff, 0.15);
    g.strokeLineShape(new Phaser.Geom.Line(0, height * 0.5, width, height * 0.5));
  }

  drawHudBg() {
    const { width } = this.scale;
    const HUD_H = 76;
    const g = this.add.graphics().setDepth(100);
    // 그라데이션 패널 (위에서 아래로 어두워짐)
    g.fillStyle(0x04040c, 0.92);
    g.fillRect(0, 0, width, HUD_H);
    g.fillStyle(0x0a0f24, 0.55);
    g.fillRect(0, HUD_H - 20, width, 20);
    // 상단/하단 네온 라인
    g.lineStyle(1, 0x00e5ff, 0.7);
    g.strokeLineShape(new Phaser.Geom.Line(0, HUD_H, width, HUD_H));
    g.lineStyle(1, 0x00e5ff, 0.15);
    g.strokeLineShape(new Phaser.Geom.Line(0, HUD_H + 3, width, HUD_H + 3));
    // 중앙 상단에 작은 상태 도트
    const dotG = this.add.graphics().setDepth(201);
    dotG.fillStyle(0x00e5ff, 1);
    dotG.fillCircle(width / 2, 12, 2);
    // HUD 좌우 코너 브래킷
    UI.drawCornerBrackets(this, 4, 4, width - 8, HUD_H - 8, {
      size: 12, color: 0x00e5ff, alpha: 0.7, depth: 201,
    });
  }

  drawTimeBar(ratio) {
    const { width, height } = this.scale;
    const barH = 4;
    const y = height - barH;
    this.timeBarBg.clear();
    this.timeBarBg.fillStyle(0x101428, 1);
    this.timeBarBg.fillRect(0, y, width, barH);

    this.timeBar.clear();
    const r = Math.max(0, Math.min(1, ratio));
    const color = r < 0.15 ? 0xff4d6d : r < 0.3 ? 0xffd24a : 0x00e5ff;
    this.timeBar.fillStyle(color, 1);
    this.timeBar.fillRect(0, y, width * r, barH);
    // 상단 하이라이트
    this.timeBar.fillStyle(0xffffff, 0.35);
    this.timeBar.fillRect(0, y, width * r, 1);
  }

  drawComboBar() {
    const { width, height } = this.scale;
    const barW = 10, barH = 180;
    const x = width - 22, y = height / 2 - barH / 2;
    this.comboBarBg.clear();
    this.comboBarBg.fillStyle(0x1a1a2e, 0.7);
    this.comboBarBg.fillRoundedRect(x, y, barW, barH, 5);
    this.comboBarBg.lineStyle(1, 0x00e5ff, 0.3);
    this.comboBarBg.strokeRoundedRect(x, y, barW, barH, 5);

    this.comboBar.clear();
    const ratio = Math.min(this.combo / 25, 1);
    const fillH = barH * ratio;
    if (fillH > 0) {
      const color = this.combo >= 25 ? COLORS.red :
                    this.combo >= 15 ? COLORS.magenta :
                    this.combo >= 10 ? COLORS.gold : COLORS.cyan;
      this.comboBar.fillStyle(color, 1);
      this.comboBar.fillRoundedRect(x, y + (barH - fillH), barW, fillH, 5);
    }
  }

  startCountdown() {
    const center = { x: this.scale.width / 2, y: this.scale.height / 2 };
    let n = GAME.countdown;
    const tick = () => {
      if (n > 0) {
        const t = this.add.text(center.x, center.y, String(n), {
          fontSize: '140px', fontStyle: 'bold', color: '#00e5ff',
          stroke: '#000', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(999);
        this.tweens.add({
          targets: t, scale: { from: 1.4, to: 0.6 }, alpha: 0,
          duration: 700, onComplete: () => t.destroy(),
        });
        Juice.ring(this, center.x, center.y, { color: COLORS.cyan, radius: 180, count: 1 });
        Audio.tap();
        n--;
        this.time.delayedCall(700, tick);
      } else {
        const go = this.add.text(center.x, center.y, 'GO!', {
          fontSize: '130px', fontStyle: 'bold', color: '#ffd24a',
          stroke: '#000', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(999);
        this.tweens.add({
          targets: go, scale: { from: 0.7, to: 1.8 }, alpha: 0,
          duration: 600, onComplete: () => go.destroy(),
        });
        Juice.ring(this, center.x, center.y, { color: COLORS.gold, radius: 260, count: 2, duration: 600 });
        Juice.flash(this, COLORS.gold, 140);
        Audio.fanfare();
        this.isPlaying = true;
        Analytics.track('session_start');
      }
    };
    tick();
  }

  update(time, delta) {
    const dt = delta / 1000;

    if (this.isPlaying) {
      this.elapsed += dt;
      this.remaining = Math.max(0, GAME.sessionSeconds - this.elapsed);
      const sec = Math.ceil(this.remaining);
      this.hudTime.setText(String(sec));
      this.drawTimeBar(this.remaining / GAME.sessionSeconds);
      // 마지막 5초 긴박감
      if (sec <= 5 && sec > 0) {
        this.hudTime.setColor(sec <= 3 ? '#ff4d6d' : '#ffd24a');
      } else {
        this.hudTime.setColor('#e8ecf5');
      }

      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnOrb();
        const p = this.elapsed / GAME.sessionSeconds;
        this.spawnTimer = Phaser.Math.Linear(SPAWN.intervalStart, SPAWN.intervalEnd, p);
      }

      if (this.remaining <= 0) this.endSession();
    }

    for (const o of this.orbs) o.update(dt);

    // 콤보 윈도우 만료
    if (this.combo > 0 && time - this.lastTapAt > COMBO.windowMs) {
      this.resetCombo();
    }

    // 네온 테두리 감쇠
    if (this.borderAlpha > 0) {
      this.borderAlpha = Math.max(0, this.borderAlpha - dt * 0.5);
      this.drawBorder();
    }

    // 배경 강도 감쇠 (콤보 없을 때)
    if (this.combo === 0 && this.bgIntensity > 0) {
      this.bgIntensity = Math.max(0, this.bgIntensity - dt * 0.8);
      this.drawBgPulse();
    }
  }

  spawnOrb() {
    const { width } = this.scale;
    const marginX = 64;
    const x = Phaser.Math.Between(marginX, width - marginX);
    const y = -40;

    const p = this.elapsed / GAME.sessionSeconds;
    const speed = Phaser.Math.Linear(SPEED.start, SPEED.end, p);
    const bombProb = Phaser.Math.Linear(PROB.bombStart, PROB.bombEnd, p);

    const roll = Math.random();
    let kind;
    if (roll < PROB.rare) kind = ORB_KIND.RARE;
    else if (roll < PROB.rare + bombProb) kind = ORB_KIND.BOMB;
    else kind = ORB_KIND.NORMAL;

    const orb = this.orbs.find(o => !o.alive);
    if (!orb) return;
    orb.reset(x, y, kind, speed);
  }

  onOrbTap(obj) {
    if (!this.isPlaying || !obj || !obj.alive) return;
    const kind = obj.kind;

    if (kind === ORB_KIND.BOMB) {
      Audio.bomb();
      Juice.flash(this, COLORS.red, 200);
      Juice.shake(this, 0.022, 260);
      Juice.burst(this, obj.x, obj.y, { count: 18, color: COLORS.red, speed: 320 });
      Juice.ring(this, obj.x, obj.y, { color: COLORS.red, radius: 160, count: 2 });
      Juice.popText(this, obj.x, obj.y - 20, 'BREAK!', {
        color: COLORS.red, size: 32,
      });
      this.resetCombo();
      obj.pop();
      Analytics.track('tap_bomb');
      return;
    }

    // 콤보 판정
    const now = this.time.now;
    const inWindow = (now - this.lastTapAt) < COMBO.windowMs;
    this.combo = inWindow ? this.combo + 1 : 1;
    this.lastTapAt = now;
    this.tapsMade++;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;

    const base = kind === ORB_KIND.RARE ? SCORE.rare : SCORE.normal;
    const mul = Math.min(1 + this.combo * COMBO.bonusPerStep, COMBO.maxMul);
    const gained = Math.round(base * mul);
    const prevScore = this.score;
    this.score += gained;

    // 점수 HUD 카운트업 + 펀치
    Juice.countUp(this, this.hudScore, prevScore, this.score, 260);
    Juice.punch(this, this.hudScore, 1.2, 160);

    // 파티클·링·플래시
    const color = kind === ORB_KIND.RARE ? COLORS.gold : this.skin.color;
    const burstCount = kind === ORB_KIND.RARE ? 20 : Math.min(10 + this.combo, 22);
    Juice.burst(this, obj.x, obj.y, { count: burstCount, color, speed: 280 });
    Juice.ring(this, obj.x, obj.y, {
      color, radius: 80 + Math.min(this.combo * 4, 60),
      count: this.combo >= 10 ? 2 : 1,
    });
    Juice.popText(this, obj.x, obj.y - 10, `+${gained}`, {
      color, size: kind === ORB_KIND.RARE ? 38 : 30 + Math.min(this.combo, 10),
    });

    // 카메라 흔들림
    const shakeIntensity = Math.min(0.005 + this.combo * 0.0015, 0.018);
    Juice.shake(this, shakeIntensity, 110);

    // 배경 맥동 강도 UP
    this.bgIntensity = Math.min(1, 0.15 + this.combo * 0.05);
    this.drawBgPulse();

    if (kind === ORB_KIND.RARE) {
      Audio.rare();
      Juice.flash(this, COLORS.gold, 200);
      Juice.slowmo(this, 0.35, 180);
      this.gemsEarned += GEMS_PER_RARE;
      Juice.popText(this, obj.x, obj.y - 60, `💎 +${GEMS_PER_RARE}`, {
        color: COLORS.gold, size: 30, rise: 80, duration: 1000,
      });
    } else {
      Audio.tap();
      if (this.combo > 1) Audio.combo(this.combo);
    }

    // 콤보 HUD 갱신
    if (this.combo >= 2) {
      this.hudCombo.setText(`COMBO ×${mul.toFixed(2)}  ${this.combo}`);
      Juice.punch(this, this.hudCombo, 1.3, 180);
    }

    // 콤보 등급 배너
    for (const rank of COMBO_RANKS) {
      if (this.combo >= rank.at && !this.reachedRanks.has(rank.at)) {
        this.reachedRanks.add(rank.at);
        this.showRankBanner(rank);
      }
    }

    // 마일스톤 체크
    for (const m of SCORE_MILESTONES) {
      if (this.score >= m && !this.reachedMilestones.has(m)) {
        this.reachedMilestones.add(m);
        this.showMilestone(m);
      }
    }

    // 네온 테두리
    if (this.combo >= 10) {
      this.borderAlpha = 1;
      this.drawBorder();
    }

    // 콤보 바 업데이트
    this.drawComboBar();

    obj.pop();
    Analytics.track('tap', { kind, combo: this.combo, score: gained });
  }

  showRankBanner(rank) {
    const { width, height } = this.scale;
    Audio.rankup();
    Juice.flash(this, rank.color, 160);

    const t = this.add.text(width / 2, height * 0.45, rank.label, {
      fontSize: '72px', fontStyle: 'bold',
      color: '#' + rank.color.toString(16).padStart(6, '0'),
      stroke: '#000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(980).setScale(0.4).setAlpha(0).setAngle(-8);

    this.tweens.add({
      targets: t,
      scale: { from: 0.4, to: 1.15 },
      alpha: 1,
      angle: 0,
      duration: 220,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: t,
          alpha: 0,
          scale: 1.6,
          duration: 500,
          delay: 350,
          ease: 'Cubic.In',
          onComplete: () => t.destroy(),
        });
      },
    });

    // 축하 파티클 (좌우에서 샤워)
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 80, () => {
        Juice.burst(this, width * 0.2, height * 0.45, { count: 14, color: rank.color, speed: 340 });
        Juice.burst(this, width * 0.8, height * 0.45, { count: 14, color: rank.color, speed: 340 });
      });
    }
  }

  showMilestone(score) {
    const { width, height } = this.scale;
    Audio.milestone();
    Juice.flash(this, COLORS.gold, 180);
    Juice.shake(this, 0.01, 220);

    const t = this.add.text(width / 2, height * 0.3,
      `🏁 ${score.toLocaleString()}!`, {
      fontSize: '56px', fontStyle: 'bold', color: '#ffd24a',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(970).setAlpha(0).setScale(0.6);

    this.tweens.add({
      targets: t, alpha: 1, scale: 1.1, duration: 260, ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: t, alpha: 0, y: t.y - 40,
          duration: 500, delay: 350,
          onComplete: () => t.destroy(),
        });
      },
    });
    Juice.ring(this, width / 2, height * 0.3, { color: COLORS.gold, radius: 260, count: 3 });
  }

  resetCombo() {
    this.combo = 0;
    this.hudCombo.setText('');
    this.borderAlpha = 0;
    this.drawBorder();
    this.drawComboBar();
  }

  drawBgPulse() {
    const { width, height } = this.scale;
    const g = this.bgPulse;
    g.clear();
    if (this.bgIntensity <= 0) return;
    const alpha = this.bgIntensity * 0.35;
    const color = this.combo >= 25 ? COLORS.red :
                  this.combo >= 15 ? COLORS.magenta :
                  this.combo >= 10 ? COLORS.gold : this.skin.color;
    // 세로 그라데이션 느낌 (위/아래 네온 오버레이)
    g.fillStyle(color, alpha * 0.4);
    g.fillRect(0, 64, width, height - 64);
    // 상하 진한 밴드
    g.fillStyle(color, alpha * 0.6);
    g.fillRect(0, 64, width, 90);
    g.fillStyle(color, alpha * 0.6);
    g.fillRect(0, height - 100, width, 100);
  }

  drawBorder() {
    this.borderFx.clear();
    if (this.borderAlpha <= 0) return;
    const { width, height } = this.scale;
    const alpha = Math.min(1, this.borderAlpha);
    const color = this.combo >= 25 ? COLORS.red :
                  this.combo >= 15 ? COLORS.magenta : COLORS.magenta;
    this.borderFx.lineStyle(6, color, alpha);
    this.borderFx.strokeRect(3, 3, width - 6, height - 6);
    this.borderFx.lineStyle(16, color, alpha * 0.25);
    this.borderFx.strokeRect(10, 10, width - 20, height - 20);
  }

  endSession() {
    this.isPlaying = false;
    for (const o of this.orbs) if (o.alive) o.deactivate();

    const coins = Math.floor(this.score / 100);
    Storage.addCoins(coins);
    Storage.addGems(this.gemsEarned);
    const isBest = Storage.setBestScore('tap-rush', this.score);

    Analytics.track('session_end', {
      score: this.score, bestCombo: this.bestCombo,
      coins, gems: this.gemsEarned, isBest,
    });

    // 최종 플래시
    Juice.flash(this, COLORS.cyan, 200);
    Juice.shake(this, 0.01, 220);

    this.time.delayedCall(450, () => {
      this.scene.start('ResultScene', {
        score: this.score,
        bestCombo: this.bestCombo,
        coins,
        gems: this.gemsEarned,
        isBest,
      });
    });
  }

  cleanup() {
    for (const o of this.orbs) o.destroy();
    this.orbs = [];
  }
}
