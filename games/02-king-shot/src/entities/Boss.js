// Boss — 거대 오우거 / 트롤. 보스 웨이브에 등장.
// 레이어: 그림자 → aura → body → armor → head → tusks → eyes → weapon(곤봉) → telegraph(슬램 마커) → multiHpBars(3단)
// 페이즈: 100→66% / 66→33% / 33→0% (각 페이즈에서 행동 변화)

import { COLORS } from '../config.js';

export class Boss extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.shadow = scene.add.graphics();
    this.aura   = scene.add.graphics();
    this.body   = scene.add.graphics();
    this.armor  = scene.add.graphics();
    this.head   = scene.add.graphics();
    this.tusks  = scene.add.graphics();
    this.eyes   = scene.add.graphics();
    this.weapon = scene.add.graphics();
    this.telegraph = scene.add.graphics();
    this.hpBars = scene.add.graphics();

    this.add([this.shadow, this.aura, this.body, this.armor, this.head,
              this.tusks, this.eyes, this.weapon, this.telegraph, this.hpBars]);

    this.alive = false;
    this.maxHp = 60;
    this.hp = 60;
    this.phase = 0;
    this._haloPulse = 0;
    this._wobble = 0;
    this._weaponAngle = 0;
    this.attackTimer = 1.6;
    this.telegraphState = null;   // { x, y, t, max, kind }
    this.hitRadius = 48;
    this.score = 1500;
    this.gemDrop = 6;
    this.coinDrop = 30;

    this.setVisible(false).setActive(false);
  }

  reset(x, y, hpMul = 1) {
    this.alive = true;
    this.maxHp = Math.round(60 * hpMul);
    this.hp = this.maxHp;
    this.phase = 0;
    this.attackTimer = 1.6;
    this.telegraphState = null;
    this.setPosition(x, y);
    this.setAlpha(0).setScale(0.6);
    this.setVisible(true).setActive(true);
    this.draw();

    // 등장 — 위에서 떨어지듯 + 셰이크
    this.scene.tweens.add({
      targets: this,
      alpha: 1, scale: 1,
      duration: 600, ease: 'Back.Out',
      onComplete: () => {
        this.scene.cameras.main.shake(280, 0.022);
      },
    });
  }

  draw() {
    this.shadow.clear();
    this.shadow.fillStyle(0x000000, 0.5);
    this.shadow.fillEllipse(0, 56, 130, 22);

    this.aura.clear();
    const auraCol = this.phase >= 1 ? COLORS.capeRed : COLORS.orcRed;
    this.aura.fillStyle(auraCol, 0.18);
    this.aura.fillCircle(0, 0, 80);
    this.aura.fillStyle(auraCol, 0.1);
    this.aura.fillCircle(0, 0, 110);

    // ── 몸 (큰 둥근 사각) ──
    const c = COLORS.orcRed;
    const dk = 0x4a1a10;
    this.body.clear();
    this.body.fillStyle(dk, 1);
    this.body.fillRoundedRect(-46, -16, 92, 76, 18);
    this.body.fillStyle(c, 1);
    this.body.fillRoundedRect(-44, -16, 88, 72, 16);

    // ── 갑옷 ──
    this.armor.clear();
    this.armor.fillStyle(COLORS.woodDark, 1);
    this.armor.fillRect(-30, 4, 60, 26);
    this.armor.fillStyle(COLORS.goldDeep, 1);
    this.armor.fillRect(-30, 4, 60, 4);
    // 가슴 보석
    this.armor.fillStyle(COLORS.gold, 1);
    this.armor.fillCircle(0, 18, 6);
    this.armor.fillStyle(COLORS.capeRed, 1);
    this.armor.fillCircle(0, 18, 3);
    // 가죽 끈
    this.armor.lineStyle(2, COLORS.gold, 0.7);
    this.armor.beginPath();
    this.armor.moveTo(-26, 8); this.armor.lineTo(26, 8);
    this.armor.strokePath();

    // ── 머리 ──
    this.head.clear();
    this.head.fillStyle(dk, 1);
    this.head.fillCircle(0, -42, 28);
    this.head.fillStyle(c, 1);
    this.head.fillCircle(0, -42, 26);
    // 눈썹 일자 (사나운 표정)
    this.head.lineStyle(3, dk, 0.85);
    this.head.beginPath();
    this.head.moveTo(-12, -48); this.head.lineTo(-4, -50);
    this.head.moveTo( 12, -48); this.head.lineTo( 4, -50);
    this.head.strokePath();
    // 코
    this.head.fillStyle(dk, 1);
    this.head.fillCircle(0, -38, 3);

    // 송곳니
    this.tusks.clear();
    this.tusks.fillStyle(0xf0e6d0, 1);
    this.tusks.fillTriangle(-10, -34, -6, -34, -8, -25);
    this.tusks.fillTriangle( 6, -34, 10, -34,  8, -25);

    // ── 곤봉 ──
    this.drawWeapon();

    // ── HP 바 ──
    this.drawHpBars();
  }

  drawWeapon() {
    const w = this.weapon;
    w.clear();
    w.x = 60;
    w.y = -10;
    w.rotation = this._weaponAngle;
    // 손잡이
    w.fillStyle(COLORS.woodDark, 1);
    w.fillRect(-3, -12, 6, 50);
    w.fillStyle(COLORS.woodBrown, 1);
    w.fillRect(-2, -10, 4, 46);
    // 머리 (사각 곤봉)
    w.fillStyle(COLORS.woodDark, 1);
    w.fillRoundedRect(-12, -28, 24, 22, 6);
    w.fillStyle(0x6a4a30, 1);
    w.fillRoundedRect(-10, -26, 20, 18, 5);
    // 못
    w.fillStyle(COLORS.gold, 1);
    [[-5, -22], [5, -22], [-5, -14], [5, -14], [0, -18]].forEach(([px, py]) => {
      w.fillCircle(px, py, 1.5);
    });
  }

  drawHpBars() {
    const g = this.hpBars;
    g.clear();
    const w = 110;
    const h = 9;
    const y = -76;
    // 그림자
    g.fillStyle(0x000000, 0.6);
    g.fillRect(-w / 2 - 1, y - 1, w + 2, h + 2);
    g.fillStyle(0x4a2018, 1);
    g.fillRect(-w / 2, y, w, h);
    // 3단 세그먼트 (좌→우 채움 + 단계 구분선)
    const segLen = w / 3;
    const ratio = Math.max(0, this.hp / this.maxHp);
    const filled = ratio * w;
    // 색은 페이즈별
    const color = this.phase === 0 ? 0x80d050 : (this.phase === 1 ? COLORS.gold : COLORS.capeRed);
    g.fillStyle(color, 1);
    g.fillRect(-w / 2, y, filled, h);
    // 세그먼트 구분 라인
    g.lineStyle(1.5, 0x000000, 0.9);
    [1, 2].forEach(i => {
      g.beginPath();
      g.moveTo(-w / 2 + segLen * i, y - 1);
      g.lineTo(-w / 2 + segLen * i, y + h + 1);
      g.strokePath();
    });
    // 골드 트림
    g.lineStyle(1, COLORS.gold, 0.9);
    g.strokeRect(-w / 2, y, w, h);

    // 보스 라벨
    if (!this._labelText) {
      this._labelText = this.scene.add.text(0, y - 14, 'OGRE LORD', {
        fontFamily: '"Cinzel", Georgia, serif',
        fontSize: '14px', fontStyle: '900',
        color: '#f4c542', stroke: '#3e2e1e', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(this.depth + 1);
      this._labelText.setLetterSpacing?.(3);
      this.add(this._labelText);
    }
  }

  takeHit(dmg) {
    if (!this.alive) return { killed: false };
    this.hp = Math.max(0, this.hp - dmg);
    this.drawHpBars();

    // 페이즈 전환
    const ratio = this.hp / this.maxHp;
    if (ratio <= 0.66 && this.phase === 0) this.enterPhase(1);
    else if (ratio <= 0.33 && this.phase === 1) this.enterPhase(2);

    // 깜빡임
    this.scene.tweens.add({
      targets: [this.body, this.head, this.armor],
      alpha: { from: 1, to: 0.4 },
      duration: 60, yoyo: true,
    });

    if (this.hp <= 0) {
      return { killed: true };
    }
    return { killed: false };
  }

  enterPhase(p) {
    this.phase = p;
    this.draw();
    this.scene.cameras.main.shake(220, 0.018);
    // 포효 텍스트
    const t = this.scene.add.text(this.x, this.y - 80, p === 1 ? 'ROAR!' : 'FURY!', {
      fontFamily: '"Cinzel", Georgia, serif',
      fontSize: '32px', fontStyle: '900',
      color: '#c8302d', stroke: '#3e2e1e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(700);
    t.setLetterSpacing?.(4);
    this.scene.tweens.add({
      targets: t, scale: { from: 1.6, to: 1 }, alpha: { from: 0, to: 1 },
      duration: 240, ease: 'Back.Out',
    });
    this.scene.tweens.add({
      targets: t, alpha: 0, y: t.y - 30,
      delay: 600, duration: 320,
      onComplete: () => t.destroy(),
    });
  }

  update(dt, scene, kingPos) {
    if (!this.alive) return;
    this._haloPulse += dt * 2.4;
    this._wobble += dt;
    this.aura.setAlpha(0.7 + Math.sin(this._haloPulse) * 0.3);

    // 위치 천천히 이동 (좌우 흔들리며 화면 위쪽에 머무름)
    const targetY = scene.scale.height * 0.28;
    const targetX = scene.scale.width / 2 + Math.sin(this._wobble * 0.6) * 80;
    const speed = 60 + this.phase * 20;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.x += (dx / dist) * Math.min(dist, speed * dt);
    this.y += (dy / dist) * Math.min(dist, speed * dt);

    // 곤봉 휘두름 (idle: 살짝 흔들림)
    this._weaponAngle = Math.sin(this._wobble * 1.2) * 0.2;
    if (!this.telegraphState) {
      this.drawWeapon();
    }

    // 공격 텔레그래프 / 슬램
    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && !this.telegraphState) {
      this.startTelegraph(kingPos);
    }
    if (this.telegraphState) this.tickTelegraph(dt, scene, kingPos);
  }

  startTelegraph(kingPos) {
    // 왕 위치에 빨간 슬램 마커
    this.telegraphState = {
      x: kingPos.x,
      y: kingPos.y,
      t: 0,
      max: 0.85,
      r: 70 + this.phase * 15,
    };
  }

  tickTelegraph(dt, scene, kingPos) {
    const ts = this.telegraphState;
    ts.t += dt;
    const p = Math.min(1, ts.t / ts.max);
    // 마커 그리기
    this.telegraph.clear();
    const tg = this.telegraph;
    // 위치는 보스 컨테이너 기준이므로 절대→상대
    const lx = ts.x - this.x;
    const ly = ts.y - this.y;
    tg.fillStyle(COLORS.capeRed, 0.18 + p * 0.32);
    tg.fillCircle(lx, ly, ts.r);
    tg.lineStyle(2, COLORS.capeRed, 0.4 + p * 0.5);
    tg.strokeCircle(lx, ly, ts.r);
    // 채움 호
    tg.fillStyle(COLORS.capeRed, 0.55);
    tg.beginPath();
    tg.moveTo(lx, ly);
    tg.arc(lx, ly, ts.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, false);
    tg.fillPath();

    // 곤봉 회전 — 들어올림
    this._weaponAngle = -1.2 * p;
    this.drawWeapon();

    if (ts.t >= ts.max) {
      // 슬램!
      this.telegraph.clear();
      this.telegraphState = null;
      this.attackTimer = 2.4 - this.phase * 0.4;
      // 슬램 임팩트 — 범위 내 왕에 데미지
      const dx = ts.x - kingPos.x;
      const dy = ts.y - kingPos.y;
      const inRange = (dx * dx + dy * dy) < (ts.r * ts.r);
      scene.cameras.main.shake(280, 0.03);
      // 임팩트 그래픽 (큰 링 + 먼지)
      const ring = scene.add.graphics().setDepth(70);
      ring.lineStyle(6, COLORS.capeRed, 0.9);
      ring.strokeCircle(ts.x, ts.y, ts.r * 0.6);
      scene.tweens.add({
        targets: ring,
        scale: 1.5, alpha: 0,
        duration: 380,
        onComplete: () => ring.destroy(),
      });
      if (inRange && scene.damageKing) {
        scene.damageKing(2);
      }
      // 곤봉 내려감
      this.scene.tweens.add({
        targets: { v: -1.2 },
        v: 0,
        duration: 220,
        ease: 'Back.Out',
        onUpdate: tw => {
          this._weaponAngle = tw.getValue();
          this.drawWeapon();
        },
      });
    }
  }

  pop() {
    this.alive = false;
    this.telegraph.clear();
    if (this._labelText) this._labelText.destroy();
    this.scene.tweens.add({
      targets: this,
      alpha: 0, scale: 0.6, y: this.y - 10,
      duration: 460, ease: 'Cubic.Out',
      onComplete: () => this.setVisible(false).setActive(false),
    });
  }
}
