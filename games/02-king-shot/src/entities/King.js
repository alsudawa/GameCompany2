// King — 기사 왕. 중세 판타지 카툰 룩.
// 레이어(아래→위): 그림자 → 망토 → 몸통(갑옷) → 어깨 → 머리/머리카락 → 왕관 → 활.
// 모든 그래픽은 Phaser Graphics + Text로 절차 생성. 외부 에셋 없음.

import { COLORS } from '../config.js';

const RADIUS = 22;       // 충돌 반경(왕)
const BODY_W = 32;
const BODY_H = 38;

export class King extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    // ── 레이어 그래픽 ──
    this.shadow      = scene.add.graphics();   // 발 밑 타원 그림자
    this.cape        = scene.add.graphics();   // 등 뒤 적색 망토
    this.body        = scene.add.graphics();   // 푸른 갑옷
    this.bodyTrim    = scene.add.graphics();   // 골드 트림 라인
    this.shoulderL   = scene.add.graphics();   // 좌 어깨 패드
    this.shoulderR   = scene.add.graphics();   // 우 어깨 패드
    this.head        = scene.add.graphics();   // 얼굴
    this.crown       = scene.add.graphics();   // 골드 왕관
    this.bow         = scene.add.graphics();   // 활 (몸 옆에 장착)
    this.glow        = scene.add.graphics();   // 발사 시 짧은 골드 글로우 (기본 비활성)

    this.add([
      this.shadow, this.cape, this.body, this.bodyTrim,
      this.shoulderL, this.shoulderR, this.head, this.crown,
      this.bow, this.glow,
    ]);

    // ── 상태 ──
    this.hp = 5;
    this.maxHp = 5;
    this.invulnUntil = 0;
    this.dragTarget = null;     // {x,y}
    this.moveSpeed = 360;       // 픽셀/초 (lerp 상한)
    this.fireCooldown = 0;
    this.recoilTween = null;
    this.aimAngle = -Math.PI / 2; // 위 방향 기본

    // 무기 스탯 (Step 4에서 업그레이드로 변경)
    this.weapon = {
      damage: 1,
      fireRate: 0.28,           // 초당 1/0.28 발 = ~3.6/s
      projectileSpeed: 760,
      multishot: 1,
      pierce: 0,
      splashRadius: 0,
      crit: 0.05,
      lifesteal: 0,
    };

    // ── 정적 그리기 (한 번) ──
    this.drawShadow();
    this.drawCape();
    this.drawBody();
    this.drawShoulders();
    this.drawHead();
    this.drawCrown();
    this.drawBow();

    // 숨쉬기 펄스 — 살아있는 느낌
    scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.035 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // 망토 살짝 흔들림
    scene.tweens.add({
      targets: this.cape,
      scaleX: { from: 1, to: 1.06 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.cape,
      angle: { from: -1.5, to: 1.5 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // 왕관 미세 까딱
    scene.tweens.add({
      targets: this.crown,
      y: { from: -34, to: -36 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  // ── 그리기 메서드 (정적) ──

  drawShadow() {
    this.shadow.clear();
    this.shadow.fillStyle(0x000000, 0.4);
    this.shadow.fillEllipse(0, 24, BODY_W + 14, 12);
  }

  drawCape() {
    this.cape.clear();
    // 등 뒤 망토 — 사다리꼴(위 좁고 아래 넓음). 중심 기준 -2 픽셀 위로
    const top = -10, bot = 28;
    const topW = 18, botW = 32;
    this.cape.fillStyle(COLORS.capeRedDk, 1);
    this.cape.fillPoints([
      { x: -topW / 2 - 1, y: top + 1 },
      { x:  topW / 2 + 1, y: top + 1 },
      { x:  botW / 2 + 1, y: bot + 1 },
      { x: -botW / 2 - 1, y: bot + 1 },
    ], true);
    this.cape.fillStyle(COLORS.capeRed, 1);
    this.cape.fillPoints([
      { x: -topW / 2, y: top },
      { x:  topW / 2, y: top },
      { x:  botW / 2, y: bot },
      { x: -botW / 2, y: bot },
    ], true);
    // 망토 골드 트림(끝자락)
    this.cape.fillStyle(COLORS.gold, 1);
    this.cape.fillRect(-botW / 2, bot - 3, botW, 2);
  }

  drawBody() {
    this.body.clear();
    // 몸통 — 둥근 사다리꼴 갑옷
    this.body.fillStyle(COLORS.knightBlueDk, 1);
    this.body.fillRoundedRect(-BODY_W / 2 - 1, -8 + 1, BODY_W + 2, BODY_H, 8);
    this.body.fillStyle(COLORS.knightBlue, 1);
    this.body.fillRoundedRect(-BODY_W / 2, -8, BODY_W, BODY_H, 8);
    // 가슴 V자 갑옷 라인
    this.body.lineStyle(2, COLORS.knightBlueDk, 0.8);
    this.body.beginPath();
    this.body.moveTo(-BODY_W / 2 + 6, -2);
    this.body.lineTo(0, 10);
    this.body.lineTo(BODY_W / 2 - 6, -2);
    this.body.strokePath();

    // 골드 트림
    this.bodyTrim.clear();
    this.bodyTrim.lineStyle(2, COLORS.gold, 1);
    // 가슴 중앙 골드 보석 점
    this.bodyTrim.fillStyle(COLORS.gold, 1);
    this.bodyTrim.fillCircle(0, 4, 2.5);
    // 허리 벨트
    this.bodyTrim.fillStyle(COLORS.woodDark, 1);
    this.bodyTrim.fillRect(-BODY_W / 2 + 2, 18, BODY_W - 4, 4);
    this.bodyTrim.fillStyle(COLORS.gold, 1);
    this.bodyTrim.fillRect(-3, 18, 6, 4);
  }

  drawShoulders() {
    [this.shoulderL, this.shoulderR].forEach((g, i) => {
      const sign = i === 0 ? -1 : 1;
      g.clear();
      g.fillStyle(COLORS.knightBlueDk, 1);
      g.fillCircle(sign * (BODY_W / 2 + 1), -6, 8);
      g.fillStyle(COLORS.knightBlue, 1);
      g.fillCircle(sign * (BODY_W / 2 + 1), -6, 6.5);
      // 골드 림
      g.lineStyle(1.5, COLORS.gold, 1);
      g.strokeCircle(sign * (BODY_W / 2 + 1), -6, 6.5);
    });
  }

  drawHead() {
    this.head.clear();
    // 얼굴 — 살색 원
    this.head.fillStyle(0x3e2e1e, 1);                 // 짙은 윤곽
    this.head.fillCircle(0, -22, 10);
    this.head.fillStyle(COLORS.skin, 1);
    this.head.fillCircle(0, -22, 9);
    // 머리카락 (이마 위)
    this.head.fillStyle(COLORS.hair, 1);
    this.head.beginPath();
    this.head.arc(0, -22, 9, Math.PI, Math.PI * 2, false);
    this.head.fillPath();
    // 눈 — 작은 점 두 개
    this.head.fillStyle(0x1a1208, 1);
    this.head.fillCircle(-3, -21, 1.2);
    this.head.fillCircle( 3, -21, 1.2);
    // 입 — 짧은 라인
    this.head.lineStyle(1, 0x1a1208, 0.9);
    this.head.beginPath();
    this.head.moveTo(-2, -17);
    this.head.lineTo( 2, -17);
    this.head.strokePath();
  }

  drawCrown() {
    this.crown.clear();
    // 왕관 — 5개 뾰족이 + 보석 점들
    const baseY = -34;
    const baseW = 22;
    // 띠
    this.crown.fillStyle(COLORS.goldDeep, 1);
    this.crown.fillRect(-baseW / 2 - 1, baseY + 1, baseW + 2, 5);
    this.crown.fillStyle(COLORS.gold, 1);
    this.crown.fillRect(-baseW / 2, baseY, baseW, 5);
    // 5개 뾰족이
    const spikes = [-baseW / 2, -baseW / 4, 0, baseW / 4, baseW / 2];
    const heights = [4, 6, 8, 6, 4];
    spikes.forEach((sx, i) => {
      this.crown.fillStyle(COLORS.gold, 1);
      this.crown.fillTriangle(sx - 2, baseY, sx + 2, baseY, sx, baseY - heights[i]);
    });
    // 가운데 보석
    this.crown.fillStyle(COLORS.capeRed, 1);
    this.crown.fillCircle(0, baseY + 2.5, 1.6);
    // 좌우 작은 보석
    this.crown.fillStyle(COLORS.gemBlue, 1);
    this.crown.fillCircle(-baseW / 4, baseY + 2.5, 1.2);
    this.crown.fillCircle( baseW / 4, baseY + 2.5, 1.2);
    // y 위치 트윈에서 사용 (까딱 효과)
    this.crown.y = -34;
  }

  drawBow(bend = 0) {
    this.bow.clear();
    // 활 — 우측 어깨에서 비스듬히 — 곡선은 fillPoints 두 개로 근사
    const bx = BODY_W / 2 + 6;
    const by = 0;
    // 활대(활시위 안쪽 곡선)
    this.bow.lineStyle(3, COLORS.woodDark, 1);
    this.bow.beginPath();
    // 위쪽 끝
    this.bow.moveTo(bx + 6, by - 14);
    // 중앙 (살짝 안쪽으로 휘어)
    this.bow.lineTo(bx + 2 - bend, by);
    // 아래쪽 끝
    this.bow.lineTo(bx + 6, by + 14);
    this.bow.strokePath();
    // 활대 외곽 — 갈색 라인
    this.bow.lineStyle(2, COLORS.woodBrown, 1);
    this.bow.beginPath();
    this.bow.moveTo(bx + 6, by - 14);
    this.bow.lineTo(bx + 2 - bend, by);
    this.bow.lineTo(bx + 6, by + 14);
    this.bow.strokePath();
    // 시위
    this.bow.lineStyle(1, 0xeae0c4, 0.85);
    this.bow.beginPath();
    this.bow.moveTo(bx + 6, by - 14);
    this.bow.lineTo(bx + 6 + bend * 0.6, by);
    this.bow.lineTo(bx + 6, by + 14);
    this.bow.strokePath();
    // 손잡이 골드 그립
    this.bow.fillStyle(COLORS.gold, 1);
    this.bow.fillRect(bx + 1 - bend, by - 2, 3, 4);
  }

  // ── 입력/이동/사격 ──

  setDragTarget(x, y) {
    this.dragTarget = { x, y };
  }
  clearDragTarget() {
    this.dragTarget = null;
  }

  update(dt, scene) {
    // 드래그 위치로 lerp 이동 (속도 캡)
    if (this.dragTarget) {
      const dx = this.dragTarget.x - this.x;
      const dy = this.dragTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1.5) {
        const step = Math.min(dist, this.moveSpeed * dt);
        const nx = dx / dist;
        const ny = dy / dist;
        this.x += nx * step;
        this.y += ny * step;
      }
    }

    // 사격 쿨다운
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
  }

  // 발사 시도. firingFn은 GameScene에서 주입(어디로 쏠지 결정).
  // returns true if fired.
  tryFire(targetX, targetY, fireFn) {
    if (this.fireCooldown > 0) return false;
    this.fireCooldown = this.weapon.fireRate;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    this.aimAngle = ang;

    // 멀티샷이면 ±스프레드 각도로
    const ms = Math.max(1, this.weapon.multishot);
    const spread = (ms - 1) * 0.12; // ±라디안
    for (let i = 0; i < ms; i++) {
      const t = ms === 1 ? 0 : (i / (ms - 1) - 0.5) * 2; // -1..1
      const a = ang + t * spread;
      fireFn(this.x + Math.cos(a) * 12, this.y + Math.sin(a) * 12, a, this.weapon);
    }

    // 활시위 진동 + 리코일
    this.playFireFx(ang);
    return true;
  }

  playFireFx(angle) {
    // 활시위 안쪽으로 살짝 당겼다가 복귀
    this.scene.tweens.add({
      targets: { v: 0 },
      v: 1,
      duration: 60,
      ease: 'Cubic.Out',
      onUpdate: tw => this.drawBow(3 * (1 - tw.getValue())),
      onComplete: () => this.drawBow(0),
    });
    // 발 살짝 뒤로 밀림 (반동)
    const recoilDist = 3;
    const ox = -Math.cos(angle) * recoilDist;
    const oy = -Math.sin(angle) * recoilDist;
    if (this.recoilTween) this.recoilTween.stop();
    this.recoilTween = this.scene.tweens.add({
      targets: this,
      x: this.x + ox,
      y: this.y + oy,
      duration: 50,
      yoyo: true,
      ease: 'Cubic.Out',
    });
    // 골드 글로우 짧게
    this.glow.clear();
    this.glow.fillStyle(COLORS.gold, 0.5);
    this.glow.fillCircle(0, 0, 18);
    this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 1, to: 0 },
      duration: 160,
      ease: 'Cubic.Out',
    });
  }

  // 데미지를 받음 (Step 3에서 사용)
  takeDamage(n = 1) {
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return false;
    this.hp = Math.max(0, this.hp - n);
    this.invulnUntil = now + 600;
    // 깜빡임 (무적 0.6초)
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.35 },
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.setAlpha(1),
    });
    return true;
  }

  get hitRadius() { return RADIUS; }
}
