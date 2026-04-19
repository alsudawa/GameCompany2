// Orb — 떨어지는 오브.
// v2: 펄스 애니메이션 + 글로우 레이어 + 꼬리 트레일 (코어/꼬리/파일 기반).

import { COLORS } from '../config.js';

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

// 판정 여유. 시각 반지름 + SLOP = 히트박스.
// 모바일 손가락 크기 고려해 넉넉하게.
const HIT_SLOP = 22;
const MAX_HIT = 62;

export class Orb extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.glow = scene.add.graphics();     // 바깥 글로우
    this.body = scene.add.graphics();     // 본체
    this.icon = scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#000000',
    }).setOrigin(0.5);

    this.add([this.glow, this.body, this.icon]);

    this.setSize(130, 130);
    // 히트박스는 가장 큰 오브(레어) 기준 + 여유. 충분히 커도 시각은 그대로.
    this.setInteractive(
      new Phaser.Geom.Circle(0, 0, MAX_HIT),
      Phaser.Geom.Circle.Contains,
    );
    // 판정용 반지름(제곱). manual hit test에서 사용.
    this.hitRadius = MAX_HIT;

    this.vy = 0;
    this.kind = ORB_KIND.NORMAL;
    this.alive = false;
    this.spawnTime = 0;
    this._pulse = 0;
    this._trailTimer = 0;
    this.setVisible(false).setActive(false);
  }

  reset(x, y, kind, vy) {
    this.setPosition(x, y);
    this.kind = kind;
    this.vy = vy;
    this.alive = true;
    this._pulse = Math.random() * Math.PI * 2;
    this._trailTimer = 0;
    this.spawnTime = this.scene.time.now;
    // 등장 트윈이 짧지만 시작부터 탭 가능하도록 scale은 0.6부터 시작
    this.setActive(true).setVisible(true).setScale(0.6).setAlpha(0).setRotation(0);

    const r = RADIUS[kind] ?? RADIUS.normal;
    const color =
      kind === ORB_KIND.RARE ? COLORS.gold :
      kind === ORB_KIND.BOMB ? COLORS.red :
      COLORS.cyan;
    this._color = color;
    this._radius = r;

    this.drawBody();

    this.icon.setText(
      kind === ORB_KIND.RARE ? '★' :
      kind === ORB_KIND.BOMB ? '✕' :
      ''
    );
    this.icon.setColor(kind === ORB_KIND.RARE ? '#2a1a00' :
                       kind === ORB_KIND.BOMB ? '#ffffff' : '#001a20');

    // 등장 트윈
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 140,
      ease: 'Back.Out',
    });
  }

  // 월드 좌표 (x, y)가 이 오브의 히트 반경 안인지. scale과 무관.
  containsWorld(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return (dx * dx + dy * dy) <= this.hitRadius * this.hitRadius;
  }

  drawBody(pulseAmp = 0) {
    const r = this._radius;
    const color = this._color;
    this.glow.clear();
    this.body.clear();

    // 바깥 글로우 3단 (약하게 → 진하게)
    this.glow.fillStyle(color, 0.08);
    this.glow.fillCircle(0, 0, r + 22 + pulseAmp * 2);
    this.glow.fillStyle(color, 0.18);
    this.glow.fillCircle(0, 0, r + 12 + pulseAmp);
    this.glow.fillStyle(color, 0.32);
    this.glow.fillCircle(0, 0, r + 6);

    // 본체
    this.body.fillStyle(color, 1);
    this.body.fillCircle(0, 0, r);

    // 하이라이트 (좌상단)
    this.body.fillStyle(0xffffff, 0.45);
    this.body.fillCircle(-r * 0.32, -r * 0.32, r * 0.28);

    // 폭탄은 십자 그리드로 위험 표식
    if (this.kind === ORB_KIND.BOMB) {
      this.body.lineStyle(3, 0xffffff, 0.8);
      this.body.strokeCircle(0, 0, r - 4);
    }
  }

  update(dt) {
    if (!this.alive) return;
    this.y += this.vy * dt;

    // 펄스 애니메이션 (크기 살짝 호흡)
    this._pulse += dt * 6;
    const amp = Math.sin(this._pulse) * 2;
    this.drawBody(amp);

    // 회전 (레어는 회전, 폭탄은 지글지글)
    if (this.kind === ORB_KIND.RARE) {
      this.rotation += dt * 2;
    } else if (this.kind === ORB_KIND.BOMB) {
      this.rotation = Math.sin(this._pulse * 2) * 0.15;
    }

    // 꼬리 트레일 (레어만)
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

    if (this.y > this.scene.scale.height + 60) {
      this.deactivate();
    }
  }

  pop() {
    this.alive = false;
    this.scene.tweens.add({
      targets: this,
      scale: 1.6,
      alpha: 0,
      rotation: this.rotation + 0.6,
      duration: 180,
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
