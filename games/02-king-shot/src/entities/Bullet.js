// Bullet — 화살(왕)/적 화살. 한 컨테이너에 다양한 종류 처리.
// 레이어: shaft(나무) → tip(강철 삼각) → feather(꼬리 깃).
// 속도 벡터 방향으로 회전.

import { COLORS } from '../config.js';

export const BULLET_KIND = {
  PLAYER: 'player',
  ENEMY: 'enemy',
};

const ARROW_LEN = 22;        // 화살 전체 길이
const SHAFT_W = 2.2;
const TIP_LEN = 6;

export class Bullet extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.gfx = scene.add.graphics();   // 한 그래픽에 layer를 다 그림
    this.add([this.gfx]);
    this.setVisible(false).setActive(false);

    this.kind = BULLET_KIND.PLAYER;
    this.alive = false;
    this.vx = 0;
    this.vy = 0;
    this.dmg = 1;
    this.pierceLeft = 0;
    this.splashRadius = 0;
    this.crit = 0;
    this.lifetime = 0;          // 초
    this._trailTimer = 0;
  }

  // 발사. weapon은 King.weapon 또는 적 무기 스탯.
  reset(x, y, angle, kind, opts = {}) {
    this.alive = true;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.dmg = opts.damage ?? 1;
    this.pierceLeft = opts.pierce ?? 0;
    this.splashRadius = opts.splashRadius ?? 0;
    this.crit = opts.crit ?? 0;
    this.lifetime = 1.6;
    this._trailTimer = 0;

    const speed = opts.speed ?? 760;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.setRotation(angle);

    this.draw();
    this.setVisible(true).setActive(true);
  }

  draw() {
    const g = this.gfx;
    g.clear();
    const isPlayer = this.kind === BULLET_KIND.PLAYER;

    // shaft (나무 가는 직사각형)
    const shaftCol = isPlayer ? COLORS.woodBrown : 0x4a2a1a;
    const shaftDark = isPlayer ? 0x5a3a22 : 0x2a1808;
    g.fillStyle(shaftDark, 1);
    g.fillRect(-ARROW_LEN / 2 - 1, -SHAFT_W / 2 - 0.5, ARROW_LEN + 2, SHAFT_W + 1);
    g.fillStyle(shaftCol, 1);
    g.fillRect(-ARROW_LEN / 2, -SHAFT_W / 2, ARROW_LEN, SHAFT_W);

    // tip (강철 삼각)
    const tipCol = isPlayer ? 0xc0c8d0 : 0x9a4848;
    const tipDk = isPlayer ? 0x8a8e96 : 0x6a2828;
    const tipBaseX = ARROW_LEN / 2 - 1;
    const tipPointX = tipBaseX + TIP_LEN;
    g.fillStyle(tipDk, 1);
    g.fillTriangle(tipBaseX, -3, tipBaseX, 3, tipPointX, 0);
    g.fillStyle(tipCol, 1);
    g.fillTriangle(tipBaseX + 0.6, -2.4, tipBaseX + 0.6, 2.4, tipPointX - 0.6, 0);

    // feather (꼬리 깃 두 개 — 위/아래로 작게 삼각)
    const featherX = -ARROW_LEN / 2 + 1;
    const featherCol = isPlayer ? 0xf4e8c8 : 0xd0d0d0;
    const featherAccent = isPlayer ? COLORS.capeRed : 0x8a3a3a;
    // 위
    g.fillStyle(featherAccent, 1);
    g.fillTriangle(featherX - 4, -1, featherX + 3, -1, featherX - 1, -5);
    g.fillStyle(featherCol, 1);
    g.fillTriangle(featherX - 3, -1, featherX + 2, -1, featherX - 1, -4);
    // 아래
    g.fillStyle(featherAccent, 1);
    g.fillTriangle(featherX - 4, 1, featherX + 3, 1, featherX - 1, 5);
    g.fillStyle(featherCol, 1);
    g.fillTriangle(featherX - 3, 1, featherX + 2, 1, featherX - 1, 4);
  }

  update(dt, scene) {
    if (!this.alive) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;

    // 잔상 도트 — 옅은 갈색 페이드
    this._trailTimer -= dt;
    if (this._trailTimer <= 0) {
      this._trailTimer = 0.025;
      const dot = scene.add.circle(this.x, this.y, 1.6,
        this.kind === BULLET_KIND.PLAYER ? COLORS.parchmentDim : 0x8a4a4a,
        0.55).setDepth(this.depth - 1);
      scene.tweens.add({
        targets: dot,
        alpha: 0,
        scale: 0.4,
        duration: 220,
        ease: 'Cubic.Out',
        onComplete: () => dot.destroy(),
      });
    }

    // 화면 밖 또는 수명 초과
    const m = 40;
    if (this.lifetime <= 0 ||
        this.x < -m || this.x > scene.scale.width + m ||
        this.y < -m || this.y > scene.scale.height + m) {
      this.deactivate();
    }
  }

  deactivate() {
    this.alive = false;
    this.setVisible(false).setActive(false);
  }
}
