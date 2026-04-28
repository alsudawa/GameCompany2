// Enemy — 5종 적. 종류에 따라 그리기/AI 분기.
// 종류: GOBLIN (작은 녹색 + 곤봉), WOLF (회색 늑대), ORC (적갈색 거구 + 방패),
//       ARCHER (스켈레톤 활잡이), GOLDEN (황금 기사, 레어).
// 공통 레이어: groundShadow → halo → body → head → accessory → eyes → hpArc.

import { COLORS, ENEMY_KIND, ENEMY_TYPES } from '../config.js';

export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.shadow = scene.add.graphics();
    this.halo   = scene.add.graphics();      // 골든 후광 또는 약한 글로우
    this.body   = scene.add.graphics();
    this.head   = scene.add.graphics();
    this.acc    = scene.add.graphics();      // 곤봉/방패/활/왕관 미니
    this.eyes   = scene.add.graphics();      // 작은 점 두 개 (왕 추적)
    this.hpArc  = scene.add.graphics();      // 머리 위 HP 호

    this.add([this.shadow, this.halo, this.body, this.head, this.acc, this.eyes, this.hpArc]);

    this.alive = false;
    this.kind = ENEMY_KIND.GOBLIN;
    this.hp = 1;
    this.maxHp = 1;
    this.speed = 80;
    this.frontShield = 0;
    this.fireRate = 0;
    this.stopY = null;             // ARCHER만: 이 비율(0..1)에서 멈춤
    this.fireCooldown = 0;
    this.score = 10;
    this.gems = 0;
    this.spawnTime = 0;
    this._wobble = Math.random() * Math.PI * 2;
    this._haloPulse = Math.random() * Math.PI * 2;
    this._touchCooldown = 0;        // 왕에게 데미지 줄 쿨다운
    this.hitRadius = 16;
    this.color = COLORS.goblinGreen;

    this.setVisible(false).setActive(false);
  }

  reset(x, y, kind, hpMul = 1) {
    const cfg = ENEMY_TYPES[kind];
    this.kind = kind;
    this.hp = Math.max(1, Math.round(cfg.hp * hpMul));
    this.maxHp = this.hp;
    this.speed = cfg.speed;
    this.score = cfg.score;
    this.frontShield = cfg.frontShield ?? 0;
    this.fireRate = cfg.fireRate ?? 0;
    this.stopY = cfg.stopY ?? null;
    this.fireCooldown = 0;
    this.color = cfg.color;
    this.gems = cfg.gems ?? 0;
    this.hitRadius = cfg.radius;

    this.setPosition(x, y);
    this.alive = true;
    this.spawnTime = this.scene.time.now;
    this._touchCooldown = 0;
    this.setAlpha(0);
    this.setScale(0.6);
    this.setVisible(true).setActive(true);

    this.draw();
    this.drawHpArc();

    // 등장 트윈 — 살짝 위에서 떨어지듯
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.6, to: 1 },
      duration: 220,
      ease: 'Back.Out',
    });
  }

  // 정적 그리기 (종류별 분기)
  draw() {
    this.shadow.clear();
    this.halo.clear();
    this.body.clear();
    this.head.clear();
    this.acc.clear();
    this.eyes.clear();

    // 공통: 발 밑 그림자
    this.shadow.fillStyle(0x000000, 0.35);
    this.shadow.fillEllipse(0, 16, this.hitRadius * 1.6, 7);

    switch (this.kind) {
      case ENEMY_KIND.GOBLIN:   this.drawGoblin(); break;
      case ENEMY_KIND.WOLF:     this.drawWolf();   break;
      case ENEMY_KIND.ORC:      this.drawOrc();    break;
      case ENEMY_KIND.ARCHER:   this.drawArcher(); break;
      case ENEMY_KIND.GOLDEN:   this.drawGolden(); break;
    }
  }

  drawGoblin() {
    // 작은 녹색 후드 형체 + 곤봉
    const c = COLORS.goblinGreen;
    const dk = 0x2a3a18;
    // 몸 (둥근 사각)
    this.body.fillStyle(dk, 1);
    this.body.fillRoundedRect(-9, -6, 18, 18, 5);
    this.body.fillStyle(c, 1);
    this.body.fillRoundedRect(-8, -6, 16, 16, 4);
    // 머리 (후드 그림자 안에 작은 원)
    this.head.fillStyle(dk, 1);
    this.head.fillCircle(0, -10, 8);
    this.head.fillStyle(c, 1);
    this.head.fillCircle(0, -10, 7);
    // 눈 (왕쪽 추적은 update)
    // 곤봉 (오른손)
    this.acc.fillStyle(COLORS.woodDark, 1);
    this.acc.fillRect(8, -2, 3, 12);
    this.acc.fillStyle(COLORS.woodBrown, 1);
    this.acc.fillRect(8.5, -1, 2, 10);
    this.acc.fillStyle(COLORS.woodDark, 1);
    this.acc.fillCircle(9.5, 11, 3.5);
  }

  drawWolf() {
    // 늑대 — 길쭉 회색 몸 + 삼각 귀 + 노란 눈 (눈은 update에서)
    const c = COLORS.wolfGray;
    const dk = 0x40434a;
    // 몸 (가로로 긴 타원)
    this.body.fillStyle(dk, 1);
    this.body.fillEllipse(0, 0, 28, 16);
    this.body.fillStyle(c, 1);
    this.body.fillEllipse(0, 0, 26, 14);
    // 머리 (앞쪽 — 왕 방향)
    this.head.fillStyle(dk, 1);
    this.head.fillCircle(0, -8, 8);
    this.head.fillStyle(c, 1);
    this.head.fillCircle(0, -8, 7);
    // 귀 두 개 (삼각)
    this.head.fillStyle(dk, 1);
    this.head.fillTriangle(-6, -12, -2, -12, -4, -18);
    this.head.fillTriangle( 2, -12,  6, -12,  4, -18);
    // 코 (작은 검정)
    this.head.fillStyle(0x1a1a1a, 1);
    this.head.fillCircle(0, -5, 1.5);
    // 꼬리 (뒤쪽)
    this.body.fillStyle(c, 1);
    this.body.fillTriangle(-13, -2, -13, 4, -18, 2);
  }

  drawOrc() {
    // 큰 적갈색 몸 + 손에 나무 방패(앞쪽 호)
    const c = COLORS.orcRed;
    const dk = 0x5a2418;
    // 몸 (큰 둥근 사각)
    this.body.fillStyle(dk, 1);
    this.body.fillRoundedRect(-12, -8, 24, 24, 6);
    this.body.fillStyle(c, 1);
    this.body.fillRoundedRect(-11, -8, 22, 22, 5);
    // 가슴 어두운 마크 (V자)
    this.body.lineStyle(2, dk, 0.8);
    this.body.beginPath();
    this.body.moveTo(-7, -2); this.body.lineTo(0, 6); this.body.lineTo(7, -2);
    this.body.strokePath();
    // 머리 (큰 원, 송곳니 살짝)
    this.head.fillStyle(dk, 1);
    this.head.fillCircle(0, -14, 9);
    this.head.fillStyle(c, 1);
    this.head.fillCircle(0, -14, 8);
    // 송곳니 두 개 (입 양쪽)
    this.head.fillStyle(0xf0e6d0, 1);
    this.head.fillTriangle(-4, -10, -2, -10, -3, -7);
    this.head.fillTriangle( 2, -10,  4, -10,  3, -7);

    // 방패 (앞쪽 — 큰 둥근 호)
    this.acc.fillStyle(COLORS.woodDark, 1);
    this.acc.fillCircle(0, 14, 13);
    this.acc.fillStyle(COLORS.woodBrown, 1);
    this.acc.fillCircle(0, 14, 11);
    // 방패 못
    this.acc.fillStyle(COLORS.gold, 1);
    this.acc.fillCircle(0, 14, 2.5);
    this.acc.fillCircle(-7, 12, 1.5);
    this.acc.fillCircle( 7, 12, 1.5);
    this.acc.fillCircle(0, 19, 1.5);
  }

  drawArcher() {
    // 스켈레톤 활잡이 — 흰뼈 + 활
    const c = COLORS.bone;
    const dk = 0x9a8d6a;
    // 갈비뼈 몸
    this.body.fillStyle(dk, 1);
    this.body.fillRoundedRect(-7, -6, 14, 18, 5);
    this.body.fillStyle(c, 1);
    this.body.fillRoundedRect(-6, -6, 12, 16, 4);
    // 갈비 줄무늬
    this.body.lineStyle(1, dk, 0.7);
    for (let i = 0; i < 3; i++) {
      this.body.beginPath();
      this.body.moveTo(-5, -3 + i * 4);
      this.body.lineTo( 5, -3 + i * 4);
      this.body.strokePath();
    }
    // 두개골
    this.head.fillStyle(dk, 1);
    this.head.fillCircle(0, -12, 8);
    this.head.fillStyle(c, 1);
    this.head.fillCircle(0, -12, 7);
    // 눈구멍 (검정)
    this.head.fillStyle(0x1a1208, 1);
    this.head.fillCircle(-2.5, -12, 2);
    this.head.fillCircle( 2.5, -12, 2);
    // 턱 (작은 사각)
    this.head.fillStyle(c, 1);
    this.head.fillRect(-2, -7, 4, 2);
    // 활 (옆에)
    this.acc.lineStyle(2, COLORS.woodDark, 1);
    this.acc.beginPath();
    this.acc.moveTo(8, -8);
    this.acc.lineTo(11, 0);
    this.acc.lineTo(8, 8);
    this.acc.strokePath();
    this.acc.lineStyle(1, 0xeae0c4, 0.7);
    this.acc.beginPath();
    this.acc.moveTo(8, -8); this.acc.lineTo(8, 8);
    this.acc.strokePath();
  }

  drawGolden() {
    // 황금 기사 — 골드 갑옷 + 후광
    const c = COLORS.gold;
    const dk = COLORS.goldDeep;
    // 후광 (큰 옅은 원, 펄스 update)
    this.halo.fillStyle(c, 0.18);
    this.halo.fillCircle(0, 0, 24);
    this.halo.fillStyle(c, 0.1);
    this.halo.fillCircle(0, 0, 32);
    // 몸 (둥근 사각)
    this.body.fillStyle(dk, 1);
    this.body.fillRoundedRect(-9, -6, 18, 20, 6);
    this.body.fillStyle(c, 1);
    this.body.fillRoundedRect(-8, -6, 16, 18, 5);
    // 가슴 보석
    this.body.fillStyle(COLORS.capeRed, 1);
    this.body.fillCircle(0, 2, 2.2);
    // 헬멧
    this.head.fillStyle(dk, 1);
    this.head.fillCircle(0, -11, 8);
    this.head.fillStyle(c, 1);
    this.head.fillCircle(0, -11, 7);
    // 헬멧 깃 (위쪽 짧은 빨간 깃털)
    this.head.fillStyle(COLORS.capeRed, 1);
    this.head.fillTriangle(-2, -19, 2, -19, 0, -22);
    // 바이저 (검정 가로 선)
    this.head.fillStyle(0x2a1a08, 1);
    this.head.fillRect(-4, -11, 8, 2);
  }

  drawHpArc() {
    this.hpArc.clear();
    if (this.hp >= this.maxHp) return;
    const w = 22;
    const h = 4;
    const y = -this.hitRadius - 12;
    // 배경
    this.hpArc.fillStyle(0x000000, 0.55);
    this.hpArc.fillRect(-w / 2 - 1, y - 1, w + 2, h + 2);
    this.hpArc.fillStyle(0x4a2018, 1);
    this.hpArc.fillRect(-w / 2, y, w, h);
    // 채움
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpArc.fillStyle(COLORS.heartRed, 1);
    this.hpArc.fillRect(-w / 2, y, w * ratio, h);
    // 골드 트림
    this.hpArc.lineStyle(1, COLORS.gold, 0.8);
    this.hpArc.strokeRect(-w / 2, y, w, h);
  }

  update(dt, scene, kingPos) {
    if (!this.alive) return;
    this._wobble += dt * 4;
    this._haloPulse += dt * 3;
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this._touchCooldown > 0) this._touchCooldown -= dt;

    // 골든 후광 펄스
    if (this.kind === ENEMY_KIND.GOLDEN) {
      this.halo.setAlpha(0.7 + Math.sin(this._haloPulse) * 0.3);
    }

    // 이동 — 왕을 향해
    const dx = kingPos.x - this.x;
    const dy = kingPos.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    let stopHere = false;
    if (this.kind === ENEMY_KIND.ARCHER && this.stopY != null) {
      const stopAtY = scene.scale.height * this.stopY;
      if (this.y >= stopAtY) stopHere = true;
    }

    if (!stopHere) {
      const nx = dx / dist;
      const ny = dy / dist;
      let vx = nx * this.speed;
      let vy = ny * this.speed;
      // WOLF: 좌우 wobble
      if (this.kind === ENEMY_KIND.WOLF) {
        vx += Math.sin(this._wobble) * 60;
      }
      this.x += vx * dt;
      this.y += vy * dt;
    }

    // ARCHER: 적 화살 발사
    if (this.kind === ENEMY_KIND.ARCHER && stopHere && this.fireCooldown <= 0) {
      this.fireCooldown = this.fireRate;
      const ang = Math.atan2(kingPos.y - this.y, kingPos.x - this.x);
      scene.spawnEnemyArrow(this.x, this.y + 4, ang);
    }

    // 눈 추적 — 왕 방향으로 작은 점
    this.eyes.clear();
    if (this.kind !== ENEMY_KIND.ARCHER) {  // 스켈레톤은 눈구멍이 정적
      const ang = Math.atan2(dy, dx);
      const ex = Math.cos(ang) * 1.4;
      const ey = Math.sin(ang) * 1.4;
      let eyeY = -10;
      let eyeColor = 0xfff4a0;
      if (this.kind === ENEMY_KIND.WOLF) { eyeY = -8; eyeColor = 0xfff080; }
      if (this.kind === ENEMY_KIND.ORC) eyeY = -14;
      if (this.kind === ENEMY_KIND.GOLDEN) { eyeY = -11; eyeColor = 0xff5050; }
      this.eyes.fillStyle(eyeColor, 1);
      this.eyes.fillCircle(-2.5 + ex, eyeY + ey, 1.3);
      this.eyes.fillCircle( 2.5 + ex, eyeY + ey, 1.3);
    }
  }

  // 데미지를 줌. fromAngle은 화살의 진행 방향(라디안). frontShield 처리에 쓰임.
  // returns {killed, dealt}
  takeHit(dmg, fromAngle = null) {
    if (!this.alive) return { killed: false, dealt: 0 };

    let dealt = dmg;
    if (this.frontShield > 0 && fromAngle != null) {
      // 적이 위쪽으로 향해 있다고 가정 — 정면(위에서) 들어오는 공격은 frontShield 비율 차감
      // 화살이 아래→위로 날아가면 angle ≈ -PI/2. 적의 "정면"은 위쪽.
      const facingFront = Math.cos(fromAngle - (-Math.PI / 2)); // 1이면 정면
      if (facingFront > 0.4) dealt = dealt * (1 - this.frontShield);
    }

    this.hp -= dealt;
    this.drawHpArc();

    // 피격 깜빡임
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.5 },
      duration: 60,
      yoyo: true,
    });

    if (this.hp <= 0) {
      return { killed: true, dealt };
    }
    return { killed: false, dealt };
  }

  pop() {
    // 처치 — 페이드 + 살짝 위로 + 비활성
    this.alive = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 8,
      scale: 0.7,
      duration: 220,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.setVisible(false).setActive(false);
      },
    });
  }
}
