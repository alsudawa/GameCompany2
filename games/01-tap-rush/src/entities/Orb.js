// Orb — 떨어지는 오브.
// Graphics로 직접 그려 스프라이트 에셋 의존성 없음.
// 풀링을 위해 reset() / deactivate() 메서드 제공.

import { COLORS } from '../config.js';

export const ORB_KIND = {
  NORMAL: 'normal',
  RARE: 'rare',
  BOMB: 'bomb',
};

const RADIUS = {
  normal: 28,
  rare: 34,
  bomb: 30,
};

export class Orb extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.body = scene.add.graphics();
    this.icon = scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#000000',
    }).setOrigin(0.5);

    this.add([this.body, this.icon]);

    this.setSize(80, 80);
    this.setInteractive(
      new Phaser.Geom.Circle(0, 0, 38),
      Phaser.Geom.Circle.Contains,
    );

    this.vy = 0;
    this.kind = ORB_KIND.NORMAL;
    this.alive = false;
    this.setVisible(false).setActive(false);
  }

  reset(x, y, kind, vy) {
    this.setPosition(x, y);
    this.kind = kind;
    this.vy = vy;
    this.alive = true;
    this.setActive(true).setVisible(true).setScale(0.3).setAlpha(0);

    const r = RADIUS[kind] ?? RADIUS.normal;
    const color =
      kind === ORB_KIND.RARE ? COLORS.gold :
      kind === ORB_KIND.BOMB ? COLORS.red :
      COLORS.cyan;

    this.body.clear();
    // glow ring
    this.body.fillStyle(color, 0.25);
    this.body.fillCircle(0, 0, r + 10);
    // main
    this.body.fillStyle(color, 1);
    this.body.fillCircle(0, 0, r);
    // highlight
    this.body.fillStyle(0xffffff, 0.35);
    this.body.fillCircle(-r * 0.3, -r * 0.3, r * 0.25);

    this.icon.setText(
      kind === ORB_KIND.RARE ? '★' :
      kind === ORB_KIND.BOMB ? '✕' :
      ''
    );

    // 등장 트윈
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 150,
      ease: 'Back.Out',
    });
  }

  update(dt) {
    if (!this.alive) return;
    this.y += this.vy * dt;
    if (this.y > this.scene.scale.height + 60) {
      this.deactivate();
    }
  }

  pop() {
    this.alive = false;
    this.scene.tweens.add({
      targets: this,
      scale: 1.4,
      alpha: 0,
      duration: 160,
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
