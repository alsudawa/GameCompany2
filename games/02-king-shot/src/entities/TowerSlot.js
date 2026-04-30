// TowerSlot — 영웅이 위에 있을 때 게이지가 차고, 가득 차면 타워 1대 빌드.
// 슬롯 한 개당 타워 한 개(연속 업그레이드 없음). 슬롯은 순차적으로 잠금 해제.

import { COLORS, TOWERS } from '../config.js';
import { Tower } from './Tower.js';

const PAD_R = 24;
const CHARGE_TIME = 2.2;     // 슬롯 빌드 시간(초)

export class TowerSlot extends Phaser.GameObjects.Container {
  constructor(scene, x, y, kind = 'archer') {
    super(scene, x, y);
    scene.add.existing(this);

    this.kind = kind;
    this.cfg = TOWERS[kind];
    this.tower = null;
    this.charge = 0;
    this.charging = false;
    this.built = false;
    this.enabled = false;        // 기본 잠금 — GameScene이 첫 슬롯만 unlock(true)

    this.padBg = scene.add.graphics();
    this.gaugeBg = scene.add.graphics();
    this.gauge = scene.add.graphics();
    this.glyph = scene.add.text(0, -3, this.cfg.icon, {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '20px', fontStyle: '900',
      color: '#3e2e1e', stroke: '#fff5d8', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add([this.padBg, this.glyph, this.gaugeBg, this.gauge]);

    this.drawPad();

    // 펄스 (잠겼을 때 안 보이고, unlock 후만 펄스)
    this.pulseTween = scene.tweens.add({
      targets: this, scale: { from: 1, to: 1.08 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    this.pulseTween.pause();
    this.setVisible(false);     // 초기 잠금
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
    this.gaugeBg.lineStyle(4, 0x000000, 0.5);
    this.gaugeBg.beginPath();
    this.gaugeBg.arc(0, 0, PAD_R + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2, false);
    this.gaugeBg.strokePath();
    this.gauge.lineStyle(4, this.cfg.color, 1);
    this.gauge.beginPath();
    this.gauge.arc(0, 0, PAD_R + 6, -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * ratio, false);
    this.gauge.strokePath();
  }

  unlock() {
    if (this.built || this.enabled) return;
    this.enabled = true;
    this.setVisible(true);
    this.setAlpha(0).setScale(0.5);
    this.scene.tweens.add({
      targets: this, alpha: 1, scale: 1,
      duration: 320, ease: 'Back.Out',
    });
    this.pulseTween.resume();
  }

  contains(heroX, heroY) {
    if (!this.enabled || this.built) return false;
    const dx = heroX - this.x;
    const dy = heroY - this.y;
    return (dx * dx + dy * dy) < (PAD_R * PAD_R);
  }

  setCharging(active) { this.charging = active && this.enabled && !this.built; }

  update(dt, scene) {
    if (!this.enabled || this.built) {
      this.drawGauge(0);
      return;
    }
    if (this.charging) {
      this.charge += dt;
      this.drawGauge(Math.min(1, this.charge / CHARGE_TIME));
      if (this.charge >= CHARGE_TIME) this.build(scene);
    } else if (this.charge > 0) {
      this.charge = Math.max(0, this.charge - dt * 0.5);
      this.drawGauge(this.charge / CHARGE_TIME);
    }
  }

  build(scene) {
    this.built = true;
    this.charge = 0;
    this.drawGauge(0);
    if (this.pulseTween) { this.pulseTween.stop(); this.pulseTween = null; this.setScale(1); }
    // 패드 + 글리프 페이드
    scene.tweens.add({
      targets: [this.padBg, this.glyph], alpha: 0, duration: 260,
    });
    // 타워 등장
    const tower = new Tower(scene, this.x, this.y, this.kind);
    tower.setDepth(40);
    this.tower = tower;
    scene.tweens.add({
      targets: tower, scale: { from: 0.4, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 320, ease: 'Back.Out',
    });
    if (scene.onTowerBuilt) scene.onTowerBuilt(this);
  }

  get hitRadius() { return PAD_R; }
}
