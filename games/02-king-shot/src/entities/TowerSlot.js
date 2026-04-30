// TowerSlot — 영웅이 패드 위에 있을 때 게이지가 차고, 가득 차면 타워 빌드/업그레이드.
// tier 0(빈) → 1 → 2 → 3 순으로 발전. 각 단계에 게이지 다시 채워야 함.

import { COLORS, TOWERS } from '../config.js';
import { Tower } from './Tower.js';

const PAD_R = 24;
const CHARGE_TIMES = [1.6, 2.4, 3.6];   // tier 1/2/3 빌드 시간(초)

export class TowerSlot extends Phaser.GameObjects.Container {
  constructor(scene, x, y, kind = 'archer') {
    super(scene, x, y);
    scene.add.existing(this);

    this.kind = kind;
    this.cfg = TOWERS[kind];
    this.tier = 0;          // 0 = 빈 슬롯
    this.tower = null;
    this.charge = 0;
    this.charging = false;

    // 패드 디스크 (빈 상태)
    this.padBg = scene.add.graphics();
    this.drawPad();

    // 게이지 링 (위쪽)
    this.gaugeBg = scene.add.graphics();
    this.gauge = scene.add.graphics();
    this.gaugeBg.setDepth(2);
    this.gauge.setDepth(3);

    // 안내 글리프 (타워 종류 아이콘)
    this.glyph = scene.add.text(0, -3, this.cfg.icon, {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '20px', fontStyle: '900',
      color: '#3e2e1e', stroke: '#fff5d8', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add([this.padBg, this.glyph, this.gaugeBg, this.gauge]);

    // 빈 패드 펄스
    this.pulseTween = scene.tweens.add({
      targets: this, scale: { from: 1, to: 1.08 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  drawPad() {
    const g = this.padBg;
    g.clear();
    const color = this.cfg.color;
    g.fillStyle(0x000000, 0.5);
    g.fillCircle(2, 2, PAD_R);
    g.fillStyle(COLORS.parchment, 0.92);
    g.fillCircle(0, 0, PAD_R);
    g.fillStyle(color, 0.32);
    g.fillCircle(0, 0, PAD_R - 4);
    g.lineStyle(2.5, COLORS.woodDark, 1);
    g.strokeCircle(0, 0, PAD_R);
    g.lineStyle(1.5, COLORS.goldHud, 0.95);
    g.strokeCircle(0, 0, PAD_R - 3);
  }

  drawGauge(ratio) {
    this.gauge.clear();
    this.gaugeBg.clear();
    if (ratio <= 0) return;
    // 배경 호 (어두운)
    this.gaugeBg.lineStyle(4, 0x000000, 0.5);
    this.gaugeBg.beginPath();
    this.gaugeBg.arc(0, 0, PAD_R + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2, false);
    this.gaugeBg.strokePath();
    // 채움 호
    this.gauge.lineStyle(4, this.cfg.color, 1);
    this.gauge.beginPath();
    this.gauge.arc(0, 0, PAD_R + 6, -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * ratio, false);
    this.gauge.strokePath();
  }

  // 매 프레임: 영웅이 위에 있는지 확인해서 charging
  setCharging(active) {
    this.charging = active;
  }

  contains(heroX, heroY) {
    const dx = heroX - this.x;
    const dy = heroY - this.y;
    return (dx * dx + dy * dy) < (PAD_R * PAD_R);
  }

  update(dt, scene) {
    if (this.tier >= 3) {
      this.drawGauge(0);
      return;
    }
    if (this.charging) {
      this.charge += dt;
      const need = CHARGE_TIMES[this.tier];
      this.drawGauge(Math.min(1, this.charge / need));
      if (this.charge >= need) {
        this.charge = 0;
        this.upgradeOrBuild(scene);
      }
    } else {
      // 차징 안 되면 점차 줄어듦
      if (this.charge > 0) {
        this.charge = Math.max(0, this.charge - dt * 0.5);
        this.drawGauge(this.charge / CHARGE_TIMES[this.tier]);
      }
    }
  }

  upgradeOrBuild(scene) {
    if (this.tier === 0) {
      // 빈 슬롯 → 타워 등장
      const tower = new Tower(scene, this.x, this.y, this.kind);
      tower.setDepth(40);
      this.tower = tower;
      // 패드 + 글리프 페이드
      scene.tweens.add({
        targets: [this.padBg, this.glyph], alpha: 0,
        duration: 260,
      });
      this.tower.setTier(0);   // tier 0 = 1단계
      this.tier = 1;
      // 빌드 임팩트
      scene.tweens.add({
        targets: tower, scale: { from: 0.4, to: 1 },
        alpha: { from: 0, to: 1 },
        duration: 320, ease: 'Back.Out',
      });
    } else {
      // 업그레이드
      this.tower.setTier(this.tier);   // tier 1 = 2단계 visuals
      this.tier++;
      scene.tweens.add({
        targets: this.tower, scale: { from: 1.3, to: 1 },
        duration: 220, ease: 'Back.Out',
      });
    }
    if (this.pulseTween) { this.pulseTween.stop(); this.pulseTween = null; this.setScale(1); }
    if (scene.onTowerBuilt) scene.onTowerBuilt(this);
  }

  get hitRadius() { return PAD_R; }
}
