// Enemy — 경로 따라가는 적. Kenney TD 유닛 스프라이트 사용.
// kind에 따라 스프라이트, HP, 속도, 보상 다름.

import { COLORS, ENEMIES, GAME, KEY, TILE } from '../config.js';
import { pathPosition } from '../maps/path.js';

const TILE_FOR = {
  soldier: TILE.ENEMY_TANK_GREEN,    // 기본 — 작은 녹색 탱크
  scout:   TILE.ENEMY_PLANE_GREEN,   // 빠른 — 비행기
  heavy:   TILE.ENEMY_TANK_TAN,      // 무거움 — 사막색 탱크
  tank:    TILE.ENEMY_PLANE_GRAY,    // 매우 무거움 — 회색 비행기
  boss:    TILE.ENEMY_TANK_TAN,      // 보스 — 사막색 탱크 (스케일 업)
};

const TINT_FOR = {
  soldier: 0xffffff,
  scout:   0xffffff,
  heavy:   0xffffff,
  tank:    0xc8c8d0,
  boss:    0xff8080,
};

export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    // 그림자 + 본체 + HP바
    this.shadow = scene.add.ellipse(0, 14, 38, 10, 0x000000, 0.4);
    this.body   = scene.add.image(0, 0, KEY.tilesheet, TILE.ENEMY_TANK_GREEN);
    this.body.setScale(0.5);
    this.hpBg   = scene.add.rectangle(0, -22, 26, 4, 0x000000, 0.7);
    this.hpFill = scene.add.rectangle(0, -22, 26, 4, 0xff5050, 1);
    this.hpFill.setOrigin(0, 0.5);
    this.hpBg.setOrigin(0.5, 0.5);

    this.add([this.shadow, this.body, this.hpBg, this.hpFill]);

    this.alive = false;
    this.kind = 'soldier';
    this.t = 0;            // 경로 누적 거리
    this.speed = 60;       // 픽셀/초
    this.baseSpeed = 60;
    this.hp = 100;
    this.maxHp = 100;
    this.bounty = 0;
    this.scoreVal = 0;
    this.slowUntil = 0;
    this.slowStrength = 0;

    this.setVisible(false).setActive(false);
  }

  reset(kind, path, hpMul = 1, speedMul = 1) {
    const cfg = ENEMIES[kind] ?? ENEMIES.soldier;
    this.alive = true;
    this.kind = kind;
    this.path = path;
    this.t = 0;
    this.maxHp = Math.round(cfg.hp * hpMul);
    this.hp = this.maxHp;
    this.baseSpeed = cfg.speed * speedMul;
    this.speed = this.baseSpeed;
    this.bounty = cfg.bounty;
    this.scoreVal = cfg.scoreVal;
    this.slowUntil = 0;

    this.body.setFrame(TILE_FOR[kind]);
    this.body.setTint(TINT_FOR[kind] ?? 0xffffff);
    const sc = (cfg.scale ?? 0.6);
    this.body.setScale(sc);
    this.shadow.setSize(38 * sc, 10 * sc);
    // HP 바 크기는 적 크기에 비례
    const hpW = Math.round(28 * sc);
    this.hpBg.setSize(hpW, 4);
    this.hpFill.width = hpW;
    this._hpFullW = hpW;
    this.hpBg.y = -22 * sc;
    this.hpFill.y = -22 * sc;
    this.hpFill.x = -hpW / 2;

    // 시작 위치
    const p = pathPosition(this.path, 0);
    this.setPosition(p.x, p.y);
    this.body.setRotation(p.angle);
    this.setAlpha(0).setScale(0.6);
    this.setVisible(true).setActive(true);

    this.scene.tweens.add({
      targets: this,
      alpha: 1, scale: 1,
      duration: 220, ease: 'Cubic.Out',
    });
  }

  update(dt, scene) {
    if (!this.alive) return null;

    // 둔화 효과
    let speed = this.baseSpeed;
    if (scene.time.now < this.slowUntil) {
      speed = this.baseSpeed * (1 - this.slowStrength);
      this.body.setTint(0x80c8ff);  // 시안 틴트로 둔화 표시
    } else {
      this.body.setTint(TINT_FOR[this.kind] ?? 0xffffff);
    }
    this.t += speed * dt;

    const p = pathPosition(this.path, this.t);
    this.x = p.x;
    this.y = p.y;
    this.body.setRotation(p.angle);

    if (p.done) {
      // 끝점 도달 — 라이프 차감 신호 반환
      this.alive = false;
      this.setVisible(false).setActive(false);
      return { reachedEnd: true };
    }
    return null;
  }

  takeDamage(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpFill.width = this._hpFullW * ratio;
    // 깜빡임
    this.scene.tweens.add({
      targets: this.body, alpha: { from: 1, to: 0.4 },
      duration: 50, yoyo: true,
    });
    if (this.hp <= 0) {
      this.alive = false;
      // 페이드 아웃 + 살짝 위로
      this.scene.tweens.add({
        targets: this,
        alpha: 0, y: this.y - 6, scale: 0.8,
        duration: 240, ease: 'Cubic.Out',
        onComplete: () => this.setVisible(false).setActive(false),
      });
      return true;  // killed
    }
    return false;
  }

  applySlow(strength, durationMs) {
    this.slowStrength = Math.max(this.slowStrength, strength);
    this.slowUntil = this.scene.time.now + durationMs;
  }
}
