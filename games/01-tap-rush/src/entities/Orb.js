// Orb — 떨어지는 오브.
// v3 디자인 패스: 다층 네온 디스크 (할로 → 아우터 링 → 바디 → 이너 코어 → 점선 쉬머 → 기호).
// v4: 폭탄을 "절대 누르지 마세요" 시각 언어로 전환 — 대각선 위험 스트라이프,
//     강한 맥동 레드 할로, 큰 ⛔ 아이콘, 외곽 "AVOID" 경고 텍스트.
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
  bomb: 34,
};

const MAX_HIT = 62;

export class Orb extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.halo = scene.add.graphics();      // 아주 바깥 할로 (가장 희미)
    this.glow = scene.add.graphics();      // 외부 글로우
    this.body = scene.add.graphics();      // 본체 + 이너 코어
    this.shimmer = scene.add.graphics();   // 회전하는 점선 링 / 폭탄: 스트라이프
    this.icon = scene.add.text(0, 0, '', {
      fontFamily: '"Orbitron", Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 폭탄 전용 AVOID 경고 라벨 (궤도 회전)
    this.avoidLabel = scene.add.text(0, 0, 'AVOID', {
      fontFamily: '"JetBrains Mono", "Courier New", monospace',
      fontSize: '11px',
      fontStyle: '700',
      color: '#ffffff',
      stroke: '#4a0008',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.avoidLabel.setLetterSpacing?.(3);
    this.avoidLabel.setVisible(false);

    this.add([this.halo, this.glow, this.body, this.shimmer, this.avoidLabel, this.icon]);

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
      this.icon.setText('✦').setColor('#3a1a00').setFontSize(26);
      this.avoidLabel.setVisible(false);
    } else if (kind === ORB_KIND.BOMB) {
      // 큰 금지 기호 + 외곽 AVOID 회전 라벨
      this.icon.setText('⛔').setColor('#ffffff').setFontSize(34);
      this.avoidLabel.setVisible(true);
    } else {
      this.icon.setText('').setColor('#ffffff').setFontSize(22);
      this.avoidLabel.setVisible(false);
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
    const isBomb = this.kind === ORB_KIND.BOMB;

    // 할로 — 폭탄은 더 강한 맥동 + 진한 레드
    this.halo.clear();
    if (isBomb) {
      const bombPulse = (Math.sin(this._pulse * 3) + 1) * 0.5; // 0~1
      this.halo.fillStyle(0xff0030, 0.05 + bombPulse * 0.10);
      this.halo.fillCircle(0, 0, r + 38 + pulseAmp * 4);
      this.halo.fillStyle(0xff0030, 0.12 + bombPulse * 0.18);
      this.halo.fillCircle(0, 0, r + 22 + pulseAmp * 2);
    } else {
      this.halo.fillStyle(c, 0.06);
      this.halo.fillCircle(0, 0, r + 30 + pulseAmp * 2);
      this.halo.fillStyle(c, 0.10);
      this.halo.fillCircle(0, 0, r + 18 + pulseAmp);
    }

    // 외부 글로우
    this.glow.clear();
    if (isBomb) {
      // 폭탄: 외부 링을 이중 굵은 테두리 (경고 테이프 느낌)
      this.glow.fillStyle(0x1a0004, 0.9);
      this.glow.fillCircle(0, 0, r + 6);
      this.glow.lineStyle(3, 0xff0030, 1);
      this.glow.strokeCircle(0, 0, r + 6);
      this.glow.lineStyle(1, 0xffd24a, 0.8);
      this.glow.strokeCircle(0, 0, r + 9);
    } else {
      this.glow.fillStyle(c, 0.22);
      this.glow.fillCircle(0, 0, r + 8);
      this.glow.lineStyle(1, c, 0.8);
      this.glow.strokeCircle(0, 0, r + 3);
    }

    // 본체
    this.body.clear();
    if (isBomb) {
      // 본체는 어두운 레드 + 대각선 위험 스트라이프
      this.body.fillStyle(0x2a0008, 1);
      this.body.fillCircle(0, 0, r);

      // 대각선 줄무늬 (caution tape) — 클리핑은 원에 대해 수동 체크
      this.body.fillStyle(0xff0030, 1);
      const stripeWidth = 8;
      for (let i = -r * 2; i < r * 2; i += stripeWidth * 2) {
        // 대각선 바 형태의 경로 — 사다리꼴 4점
        const pts = [
          { x: i,               y: -r - 2 },
          { x: i + stripeWidth, y: -r - 2 },
          { x: i + stripeWidth - r * 2, y:  r + 2 },
          { x: i - r * 2,       y:  r + 2 },
        ];
        // 간단한 fillPoints 사용
        if (this.body.fillPoints) {
          this.body.fillPoints(pts, true, true);
        }
      }
      // 원형 마스크 흉내 — 원 외부 영역 덮기 (투명한 링)
      // 다시 어두운 배경 링을 위로 얹어 스트라이프를 원 안에만 남김
      this.body.fillStyle(0x05050c, 1);
      this.body.beginPath();
      this.body.arc(0, 0, r * 6, 0, Math.PI * 2, false);
      this.body.arc(0, 0, r, 0, Math.PI * 2, true);
      this.body.closePath();
      this.body.fillPath();

      // 중앙 블랙 원판 — 아이콘 대비 강조
      this.body.fillStyle(0x05050c, 0.9);
      this.body.fillCircle(0, 0, r * 0.55);
      this.body.lineStyle(2, 0xff0030, 1);
      this.body.strokeCircle(0, 0, r * 0.55);

      // 외곽 링 (튼튼한 테두리)
      this.body.lineStyle(2, 0xffffff, 0.9);
      this.body.strokeCircle(0, 0, r);
    } else {
      // 일반/레어
      this.body.fillStyle(c, 1);
      this.body.fillCircle(0, 0, r);
      this.body.fillStyle(0x000000, 0.25);
      this.body.fillCircle(0, 0, r * 0.7);
      this.body.fillStyle(0xffffff, 0.9);
      this.body.fillCircle(0, 0, r * 0.38);
      this.body.fillStyle(c, 0.8);
      this.body.fillCircle(0, 0, r * 0.22);
      this.body.fillStyle(0xffffff, 0.35);
      this.body.fillCircle(-r * 0.32, -r * 0.34, r * 0.18);
    }

    // 쉬머 / 폭탄은 회전 경고 스파이크 + AVOID 라벨 궤도
    this.shimmer.clear();
    if (isBomb) {
      // 짧은 방사 스파이크 (경고 햇살)
      const spokes = 16;
      this.shimmer.lineStyle(3, 0xff0030, 1);
      for (let i = 0; i < spokes; i++) {
        const a = (i / spokes) * Math.PI * 2 + this._shimmerAngle;
        const ix = Math.cos(a) * (r + 12);
        const iy = Math.sin(a) * (r + 12);
        const ox = Math.cos(a) * (r + 20);
        const oy = Math.sin(a) * (r + 20);
        this.shimmer.beginPath();
        this.shimmer.moveTo(ix, iy);
        this.shimmer.lineTo(ox, oy);
        this.shimmer.strokePath();
      }
      // AVOID 라벨 궤도 위치
      const labelAngle = this._shimmerAngle * 0.7 - Math.PI / 2;
      this.avoidLabel.setPosition(
        Math.cos(labelAngle) * (r + 34),
        Math.sin(labelAngle) * (r + 34),
      );
      const bombPulse = (Math.sin(this._pulse * 3) + 1) * 0.5;
      this.avoidLabel.setAlpha(0.7 + bombPulse * 0.3);
    } else {
      UI.drawDashedCircle(this.shimmer, 0, 0, r + 10, c, 0.8, 20, 2, this._shimmerAngle);
      if (this.kind === ORB_KIND.RARE) {
        UI.drawDashedCircle(this.shimmer, 0, 0, r + 18, 0xffffff, 0.6, 28, 1.5, -this._shimmerAngle);
      }
    }
  }

  update(dt) {
    if (!this.alive) return;
    this.y += this.vy * dt;

    this._pulse += dt * 6;
    const spinRate =
      this.kind === ORB_KIND.RARE ? 1.8 :
      this.kind === ORB_KIND.BOMB ? 2.2 : 0.7;
    this._shimmerAngle += dt * spinRate;
    const amp = Math.sin(this._pulse) * 2;
    this.drawAll(amp);

    if (this.kind === ORB_KIND.RARE) {
      this.rotation += dt * 1.2;
    } else if (this.kind === ORB_KIND.BOMB) {
      // 불안정한 떨림
      this.rotation = Math.sin(this._pulse * 2.5) * 0.18;
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
