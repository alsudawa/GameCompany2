// GameScene — 실제 플레이 루프.

import { Orb, ORB_KIND } from '../entities/Orb.js';
import { Juice } from '../../../../shared/juice.js';
import { Audio } from '../../../../shared/audio.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import {
  GAME, SPAWN, SPEED, PROB, COMBO, SCORE, GEMS_PER_RARE, COLORS, SKIN_EFFECTS,
} from '../config.js';

const POOL_SIZE = 24;

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a14');
    this.drawHudBg();

    const profile = Storage.load();
    this.skin = SKIN_EFFECTS[profile.equippedSkin] || SKIN_EFFECTS.default;

    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.gemsEarned = 0;
    this.lastTapAt = 0;
    this.remaining = GAME.sessionSeconds;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.isPlaying = false;

    this.orbs = [];
    for (let i = 0; i < POOL_SIZE; i++) this.orbs.push(new Orb(this));

    this.hudScore = this.add.text(20, 14, '0', {
      fontSize: '42px', fontStyle: 'bold', color: '#00e5ff',
      stroke: '#000', strokeThickness: 4,
    });
    this.hudTime = this.add.text(this.scale.width - 20, 14, '60', {
      fontSize: '42px', fontStyle: 'bold', color: '#e8e8f0',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(1, 0);
    this.hudCombo = this.add.text(this.scale.width / 2, 70, '', {
      fontSize: '28px', fontStyle: 'bold', color: '#ff2bd6',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // 네온 콤보 테두리
    this.borderFx = this.add.graphics().setDepth(500);
    this.borderAlpha = 0;

    // 포인터 입력
    this.input.on('gameobjectdown', (pointer, obj) => this.onOrbTap(obj));

    // 카운트다운 후 시작
    this.startCountdown();

    this.events.once('shutdown', () => this.cleanup());
  }

  startCountdown() {
    const center = { x: this.scale.width / 2, y: this.scale.height / 2 };
    let n = GAME.countdown;
    const tick = () => {
      if (n > 0) {
        const t = this.add.text(center.x, center.y, String(n), {
          fontSize: '120px', fontStyle: 'bold', color: '#00e5ff',
          stroke: '#000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(999);
        this.tweens.add({
          targets: t, scale: { from: 1.3, to: 0.6 }, alpha: 0,
          duration: 700, onComplete: () => t.destroy(),
        });
        Audio.tap();
        n--;
        this.time.delayedCall(700, tick);
      } else {
        const go = this.add.text(center.x, center.y, 'GO!', {
          fontSize: '110px', fontStyle: 'bold', color: '#ffd24a',
          stroke: '#000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(999);
        this.tweens.add({
          targets: go, scale: { from: 0.7, to: 1.6 }, alpha: 0,
          duration: 550, onComplete: () => go.destroy(),
        });
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
      this.hudTime.setText(Math.ceil(this.remaining).toString());

      // 스폰 진행
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnOrb();
        const p = this.elapsed / GAME.sessionSeconds;
        this.spawnTimer = Phaser.Math.Linear(SPAWN.intervalStart, SPAWN.intervalEnd, p);
      }

      if (this.remaining <= 0) {
        this.endSession();
      }
    }

    // 오브 업데이트
    for (const o of this.orbs) o.update(dt);

    // 콤보 윈도우 만료
    if (this.combo > 0 && time - this.lastTapAt > COMBO.windowMs) {
      this.resetCombo();
    }

    // 네온 테두리 페이드
    if (this.borderAlpha > 0) {
      this.borderAlpha = Math.max(0, this.borderAlpha - dt * 0.6);
      this.drawBorder();
    }
  }

  spawnOrb() {
    const { width, height } = this.scale;
    const marginX = 60;
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
      Juice.flash(this, 0xff4d6d, 180);
      Juice.shake(this, 0.018, 220);
      Juice.burst(this, obj.x, obj.y, { count: 14, color: COLORS.red });
      Juice.popText(this, obj.x, obj.y - 20, 'COMBO BREAK', {
        color: COLORS.red, size: 24,
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
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;

    const base = kind === ORB_KIND.RARE ? SCORE.rare : SCORE.normal;
    const mul = Math.min(1 + this.combo * COMBO.bonusPerStep, COMBO.maxMul);
    const gained = Math.round(base * mul);
    this.score += gained;
    this.hudScore.setText(this.score.toLocaleString());

    // 시각/청각 피드백
    const color = kind === ORB_KIND.RARE ? COLORS.gold : this.skin.color;
    Juice.burst(this, obj.x, obj.y, { count: kind === ORB_KIND.RARE ? 16 : 10, color });
    Juice.popText(this, obj.x, obj.y - 10, `+${gained}`, {
      color, size: kind === ORB_KIND.RARE ? 34 : 28,
    });

    const shakeIntensity = Math.min(0.004 + this.combo * 0.0015, 0.015);
    Juice.shake(this, shakeIntensity, 110);

    if (kind === ORB_KIND.RARE) {
      Audio.rare();
      Juice.flash(this, COLORS.gold, 180);
      Juice.slowmo(this, 0.35, 180);
      this.gemsEarned += GEMS_PER_RARE;
      Juice.popText(this, obj.x, obj.y - 50, `💎 +${GEMS_PER_RARE}`, {
        color: COLORS.gold, size: 26, rise: 70, duration: 900,
      });
    } else {
      Audio.tap();
      if (this.combo > 1) Audio.combo(this.combo);
    }

    // 콤보 표시
    if (this.combo >= 2) {
      this.hudCombo.setText(`COMBO ×${mul.toFixed(2)}  ${this.combo}`);
      this.hudCombo.setScale(1.2);
      this.tweens.add({ targets: this.hudCombo, scale: 1, duration: 180, ease: 'Back.Out' });
    }
    if (this.combo >= 10) {
      this.borderAlpha = 1;
      this.drawBorder();
    }

    obj.pop();
    Analytics.track('tap', { kind, combo: this.combo, score: gained });
  }

  resetCombo() {
    this.combo = 0;
    this.hudCombo.setText('');
    this.borderAlpha = 0;
    this.drawBorder();
  }

  drawHudBg() {
    const { width } = this.scale;
    const g = this.add.graphics().setDepth(100);
    g.fillStyle(0x000000, 0.35);
    g.fillRect(0, 0, width, 64);
  }

  drawBorder() {
    this.borderFx.clear();
    if (this.borderAlpha <= 0) return;
    const { width, height } = this.scale;
    const alpha = Math.min(1, this.borderAlpha);
    this.borderFx.lineStyle(6, COLORS.magenta, alpha);
    this.borderFx.strokeRect(3, 3, width - 6, height - 6);
    this.borderFx.lineStyle(12, COLORS.magenta, alpha * 0.3);
    this.borderFx.strokeRect(8, 8, width - 16, height - 16);
  }

  endSession() {
    this.isPlaying = false;

    // 남은 오브 비활성
    for (const o of this.orbs) if (o.alive) o.deactivate();

    // 보상 지급
    const coins = Math.floor(this.score / 100);
    Storage.addCoins(coins);
    Storage.addGems(this.gemsEarned);
    const isBest = Storage.setBestScore('tap-rush', this.score);

    Analytics.track('session_end', {
      score: this.score, bestCombo: this.bestCombo,
      coins, gems: this.gemsEarned, isBest,
    });

    this.time.delayedCall(400, () => {
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
