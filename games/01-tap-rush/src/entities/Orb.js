// Orb — 떨어지는 오브.
// v3 디자인 패스: 다층 네온 디스크 (할로 → 아우터 링 → 바디 → 이너 코어 → 점선 쉬머 → 기호).
// 히트박스는 시각 크기와 분리되어 관대함 유지.

import { COLORS } from '../config.js';
import { UI } from '../../../../shared/ui.js';

export const ORB_KIND = {
  NORMAL: 'normal',
  RARE: 'rare',
  BOMB: 'bomb',
};

const RADIUS = {
  normal: 30,
  rare: 38,
  bomb: 32,
};

const MAX_HIT = 62;

export class Orb extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.halo = scene.add.graphics();      // 아주 바깥 할로 (가장 희미)
    this.glow = scene.add.graphics();      // 외부 글로우
    this.body = scene.add.graphics();      // 본체 + 이너 코어
    this.shimmer = scene.add.graphics();   // 회전하는 점선 링
    this.icon = scene.add.text(0, 0, '', {
      fontFamily: '"Orbitron", Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add([this.halo, this.glow, this.body, this.shimmer, this.icon]);

    this.setSize(130, 130);
    this.setInteractive(
      new Phaser.Geom.Circle(0, 0, MAX_HIT),
      Phaser.Geom.Circle.Contains,
    );
    this.hitRadius = MAX_HIT;

    this.vy = 0;
    this.kind = ORB_KIND.NORMAL;
    this.alive = false;
    this.spawnTime = 0;
    this._pulse = 0;
    this._shimmerAngle = 0;
    this._trailTimer = 0;

    this.setVisible(false).setActive(false);
  }

  reset(x, y, kind, vy) {
    this.setPosition(x, y);
    this.kind = kind;
    this.vy = vy;
    this.alive = true;
    this._pulse = Math.random() * Math.PI * 2;
    this._shimmerAngle = Math.random() * Math.PI * 2;
    this._trailTimer = 0;
    this.spawnTime = this.scene.time.now;
    this.setActive(true).setVisible(true).setScale(0.6).setAlpha(0).setRotation(0);

    const r = RADIUS[kind] ?? RADIUS.normal;
    const color =
      kind === ORB_KIND.RARE ? COLORS.gold :
      kind === ORB_KIND.BOMB ? COLORS.red :
      COLORS.cyan;
    this._color = color;
    this._radius = r;

    this.drawAll(0);

    if (kind === ORB_KIND.RARE) {
      this.icon.setText('✦').setColor('#3a1a00');
    } else if (kind === ORB_KIND.BOMB) {
      this.icon.setText('×').setColor('#ffffff');
    } else {
      this.icon.setText('').setColor('#ffffff');
    }

    this.scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 140,
      ease: 'Back.Out',
    });
  }

  containsWorld(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return (dx * dx + dy * dy) <= this.hitRadius * this.hitRadius;
  }

  drawAll(pulseAmp = 0) {
    const r = this._radius;
    const c = this._color;

    // 할로 (가장 희미, 멀리 퍼짐)
    this.halo.clear();
    this.halo.fillStyle(c, 0.06);
    this.halo.fillCircle(0, 0, r + 30 + pulseAmp * 2);
    this.halo.fillStyle(c, 0.10);
    this.halo.fillCircle(0, 0, r + 18 + pulseAmp);

    // 외부 글로우
    this.glow.clear();
    this.glow.fillStyle(c, 0.22);
    this.glow.fillCircle(0, 0, r + 8);
    this.glow.lineStyle(1, c, 0.8);
    this.glow.strokeCircle(0, 0, r + 3);

    // 본체 — 바깥 링 + 이너 코어
    this.body.clear();
    // 바깥 링 (도넛 느낌)
    this.body.fillStyle(c, 1);
    this.body.fillCircle(0, 0, r);
    // 이너 그림자 (깊이감)
    this.body.fillStyle(0x000000, 0.25);
    this.body.fillCircle(0, 0, r * 0.7);
    // 이너 코어 (밝은 중심)
    this.body.fillStyle(0xffffff, this.kind === ORB_KIND.BOMB ? 0.25 : 0.9);
    this.body.fillCircle(0, 0, r * 0.38);
    // 코어 이너 (살짝 더 진하게)
    this.body.fillStyle(c, 0.8);
    this.body.fillCircle(0, 0, r * 0.22);
    // 상단 하이라이트
    this.body.fillStyle(0xffffff, 0.35);
    this.body.fillCircle(-r * 0.32, -r * 0.34, r * 0.18);

    // 쉬머 (점선 링) — 회전
    this.shimmer.clear();
    if (this.kind === ORB_KIND.BOMB) {
      // 폭탄: 경고 해시 — 외곽에 짧은 방사선
      const spokes = 12;
      this.shimmer.lineStyle(3, 0xffffff, 0.7);
      for (let i = 0; i < spokes; i++) {
        const a = (i / spokes) * Math.PI * 2 + this._shimmerAngle;
        const ix = Math.cos(a) * (r + 4);
        const iy = Math.sin(a) * (r + 4);
        const ox = Math.cos(a) * (r + 10);
        const oy = Math.sin(a) * (r + 10);
        this.shimmer.beginPath();
        this.shimmer.moveTo(ix, iy);
        this.shimmer.lineTo(ox, oy);
        this.shimmer.strokePath();
      }
    } else {
      UI.drawDashedCircle(this.shimmer, 0, 0, r + 10, c, 0.8, 20, 2, this._shimmerAngle);
      if (this.kind === ORB_KIND.RARE) {
        // 레어는 외곽 추가 링 (더 화려)
        UI.drawDashedCircle(this.shimmer, 0, 0, r + 18, 0xffffff, 0.6, 28, 1.5, -this._shimmerAngle);
      }
    }
  }

  update(dt) {
    if (!this.alive) return;
    this.y += this.vy * dt;

    this._pulse += dt * 6;
    this._shimmerAngle += dt * (this.kind === ORB_KIND.RARE ? 1.8 : 0.7);
    const amp = Math.sin(this._pulse) * 2;
    this.drawAll(amp);

    if (this.kind === ORB_KIND.RARE) {
      this.rotation += dt * 1.2;
    } else if (this.kind === ORB_KIND.BOMB) {
      this.rotation = Math.sin(this._pulse * 2) * 0.12;
    }

    if (this.kind === ORB_KIND.RARE) {
      this._trailTimer -= dt;
      if (this._trailTimer <= 0) {
        this._trailTimer = 0.045;
        const dot = this.scene.add.circle(this.x, this.y, 6, this._color, 0.55).setDepth(this.depth - 1);
        this.scene.tweens.add({
          targets: dot,
          alpha: 0,
          scale: 0.2,
          duration: 340,
          ease: 'Cubic.Out',
          onComplete: () => dot.destroy(),
        });
      }
    }

    if (this.y > this.scene.scale.height + 60) this.deactivate();
  }

  pop() {
    this.alive = false;
    this.scene.tweens.add({
      targets: this,
      scale: 1.7,
      alpha: 0,
      rotation: this.rotation + 0.8,
      duration: 200,
      ease: 'Cubic.Out',
      onComplete: () => this.deactivate(),
    });
  }

  deactivate() {
    this.alive = false;
    this.setActive(false).setVisible(false);
    this.setPosition(-200, -200);
  }
}
