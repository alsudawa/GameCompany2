// GameScene — 실제 플레이 루프. v2 "도파민 패스".
// 추가 연출:
//  - 맥동하는 네온 배경 (콤보에 비례해 강해짐)
//  - 콤보 등급 배너 (NICE!/GREAT!/AMAZING!/INSANE!/GOD LIKE!)
//  - 스코어 마일스톤 팡파르 (중앙 큰 배너)
//  - HUD 점수 카운트업 + 펀치
//  - 포인터 트레일 + 탭 스파크
//  - 콤보 진행 바 (우측)

import { Orb, ORB_KIND } from '../entities/Orb.js';
import { Juice } from '../../../../shared/juice.js';
import { Audio } from '../../../../shared/audio.js';
import { Storage } from '../../../../shared/storage.js';
import { Analytics } from '../../../../shared/analytics.js';
import { UI, FONT } from '../../../../shared/ui.js';
import {
  GAME, SPAWN, SPEED, PROB, COMBO, SCORE, GEMS_PER_RARE,
  COMBO_RANKS, SCORE_MILESTONES, COLORS, SKIN_EFFECTS,
  JUDGMENT, JUDGMENT_COLORS, LEVELS, STAGES, getStage,
} from '../config.js';

const POOL_SIZE = 32;

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.stage = getStage(data?.stageId);
  }

  create() {
    const { width, height } = this.scale;
    // 스테이지 고유 배경색
    const bgHex = '#' + this.stage.bgBase.toString(16).padStart(6, '0');
    this.cameras.main.setBackgroundColor(bgHex);

    // 혹시 메뉴를 거치지 않고 진입한 경우에도 첫 입력으로 AudioContext를 언락.
    Audio.unlockOnFirstInput(this);

    const profile = Storage.load();
    // 장착 스킨 컬러는 유지하되, 스테이지 팔레트를 우선 쓰도록 오브에 전달한다.
    this.skin = SKIN_EFFECTS[profile.equippedSkin] || SKIN_EFFECTS.default;

    // 맥동 네온 배경
    this.bgPulse = this.add.graphics().setDepth(-10);
    this.bgIntensity = 0;

    // 중앙 얕은 비네트 (바닥 네온)
    this.bgBase = this.add.graphics().setDepth(-20);
    this.drawBaseBg();

    // 상태
    this.score = 0;
    this.displayedScore = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.gemsEarned = 0;
    this.tapsMade = 0;
    this.lastTapAt = 0;
    this.remaining = GAME.sessionSeconds;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.isPlaying = false;
    this.reachedRanks = new Set();
    this.reachedMilestones = new Set();
    this.levelIdx = 0;
    this.currentLevel = LEVELS[0];
    // 스폰 레인 기록 — 양엄지 교차 패턴을 위해 직전 사이드를 기억한다.
    this._lastLane = null;

    // 풀
    this.orbs = [];
    for (let i = 0; i < POOL_SIZE; i++) this.orbs.push(new Orb(this));

    // HUD
    this.drawHudBg();

    // 좌측: SCORE 라벨 + 큰 숫자
    this.add.text(22, 14, 'SCORE', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#6b708f',
    }).setLetterSpacing(3).setDepth(201);
    this.hudScore = this.add.text(22, 26, '0', {
      fontFamily: FONT.display, fontSize: '40px', fontStyle: '900',
      color: '#00e5ff',
    }).setDepth(201).setLetterSpacing(1);

    // 우측: TIME 라벨 + 큰 숫자
    this.add.text(width - 22, 14, 'TIME', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#6b708f',
    }).setOrigin(1, 0).setLetterSpacing(3).setDepth(201);
    this.hudTime = this.add.text(width - 22, 26, String(GAME.sessionSeconds), {
      fontFamily: FONT.display, fontSize: '40px', fontStyle: '900',
      color: '#e8ecf5',
    }).setOrigin(1, 0).setDepth(201).setLetterSpacing(1);

    // 중앙 상단: STAGE 이름 + 내부 LEVEL
    this.hudLevelLabel = this.add.text(width / 2, 16, `STAGE ${this.stage.label} · ${this.stage.name}`, {
      fontFamily: FONT.mono, fontSize: '9px', fontStyle: '700',
      color: '#' + this.stage.palette.normal.toString(16).padStart(6, '0'),
    }).setOrigin(0.5, 0).setDepth(201).setLetterSpacing(3);
    this.hudLevel = this.add.text(width / 2, 32, LEVELS[0].label, {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '900',
      color: '#ffd24a',
    }).setOrigin(0.5, 0).setDepth(201).setLetterSpacing(3);

    // 중앙 콤보 배지 영역 (HUD 아래)
    this.hudCombo = this.add.text(width / 2, 96, '', {
      fontFamily: FONT.display, fontSize: '26px', fontStyle: '900',
      color: '#ff2bd6',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(201).setLetterSpacing(2);

    // 하단 시간 progress bar
    this.timeBarBg = this.add.graphics().setDepth(200);
    this.timeBar = this.add.graphics().setDepth(201);
    this.drawTimeBar(1);

    // 콤보 진행 바 (우측 세로바)
    this.comboBarBg = this.add.graphics().setDepth(200);
    this.comboBar = this.add.graphics().setDepth(201);
    this.drawComboBar();

    // 네온 콤보 테두리
    this.borderFx = this.add.graphics().setDepth(500);
    this.borderAlpha = 0;

    // TAP ZONE (판정 라인) — 배경 레이어 바로 위
    this.judgmentY = Math.round(height * JUDGMENT.lineYRatio);
    this.drawJudgmentZone();

    // LINK 쌍의 연결선용 그래픽 (오브 뒤, 판정선 위)
    this.linkLines = this.add.graphics().setDepth(-4);

    // 오브 낙하 놓침(fall-through) → MISS 처리
    this.events.on('orbMissed', (orb) => this.onOrbMiss(orb));

    // 멀티터치 (LINK 동시 탭 지원) — 포인터 3개까지
    this.input.addPointer(3);

    // 포인터 트레일 + 탭 스파크
    Juice.attachPointerTrail(this, this.skin.color);

    // 수동 hit test — TAP ZONE 안의 오브만 유효.
    // 존 바깥 오브는 EARLY/LATE 피드백만 표시하고 소모하지 않음.
    // (폭탄은 어디서 탭해도 벌칙 — 누르지 말아야 하니까)
    this.input.on('pointerdown', (pointer) => {
      if (!this.isPlaying) return;
      Juice.spark(this, pointer.x, pointer.y, this.skin.color, 22);

      const GRACE = 18;
      let best = null;
      let bestDist = Infinity;
      for (const o of this.orbs) {
        if (!o.alive) continue;
        const dx = pointer.x - o.x;
        const dy = pointer.y - o.y;
        const d2 = dx * dx + dy * dy;
        const maxR = o.hitRadius + GRACE;
        if (d2 <= maxR * maxR && d2 < bestDist) {
          bestDist = d2;
          best = o;
        }
      }
      if (!best) return;

      // 폭탄은 존 상관없이 항상 반응 (탭=실수이므로 즉시 벌칙)
      if (best.kind === ORB_KIND.BOMB) {
        this.onOrbTap(best);
        return;
      }

      // TAP ZONE 바깥 → 무효 (오브는 계속 낙하, 피드백만 표시)
      const dyZone = best.y - this.judgmentY;
      if (Math.abs(dyZone) > JUDGMENT.good) {
        const label = dyZone < 0 ? 'EARLY' : 'LATE';
        this.showJudgmentFeedback(label, best.x, best.y);
        return;
      }

      this.onOrbTap(best);
    });

    this.startCountdown();
    this.events.once('shutdown', () => this.cleanup());
  }

  drawBaseBg() {
    const { width, height } = this.scale;
    // 배경 그리드 + 뷰포트 프레임 + 스캔라인
    UI.drawGrid(this, width, height, { cell: 40, color: 0x0f1530, alpha: 0.5, depth: -25 });
    UI.drawViewportFrame(this, width, height, { color: 0x00e5ff, alpha: 0.35, depth: -8, inset: 4 });
    UI.drawScanlines(this, width, height, { gap: 3, alpha: 0.035, depth: 1200 });

    // 바닥 네온 웨이브
    const g = this.bgBase;
    g.clear();
    g.fillStyle(0x00e5ff, 0.05);
    g.fillRect(0, height - 150, width, 150);
    g.fillStyle(0xff2bd6, 0.04);
    g.fillRect(0, height - 90, width, 90);
    // 중앙 수평 기준선
    g.lineStyle(1, 0x00e5ff, 0.15);
    g.strokeLineShape(new Phaser.Geom.Line(0, height * 0.5, width, height * 0.5));
  }

  drawHudBg() {
    const { width } = this.scale;
    const HUD_H = 76;
    const g = this.add.graphics().setDepth(100);
    // 그라데이션 패널 (위에서 아래로 어두워짐)
    g.fillStyle(0x04040c, 0.92);
    g.fillRect(0, 0, width, HUD_H);
    g.fillStyle(0x0a0f24, 0.55);
    g.fillRect(0, HUD_H - 20, width, 20);
    // 상단/하단 네온 라인
    g.lineStyle(1, 0x00e5ff, 0.7);
    g.strokeLineShape(new Phaser.Geom.Line(0, HUD_H, width, HUD_H));
    g.lineStyle(1, 0x00e5ff, 0.15);
    g.strokeLineShape(new Phaser.Geom.Line(0, HUD_H + 3, width, HUD_H + 3));
    // 중앙 상단에 작은 상태 도트
    const dotG = this.add.graphics().setDepth(201);
    dotG.fillStyle(0x00e5ff, 1);
    dotG.fillCircle(width / 2, 12, 2);
    // HUD 좌우 코너 브래킷
    UI.drawCornerBrackets(this, 4, 4, width - 8, HUD_H - 8, {
      size: 12, color: 0x00e5ff, alpha: 0.7, depth: 201,
    });
  }

  drawTimeBar(ratio) {
    const { width, height } = this.scale;
    const barH = 4;
    const y = height - barH;
    this.timeBarBg.clear();
    this.timeBarBg.fillStyle(0x101428, 1);
    this.timeBarBg.fillRect(0, y, width, barH);

    this.timeBar.clear();
    const r = Math.max(0, Math.min(1, ratio));
    const color = r < 0.15 ? 0xff4d6d : r < 0.3 ? 0xffd24a : 0x00e5ff;
    this.timeBar.fillStyle(color, 1);
    this.timeBar.fillRect(0, y, width * r, barH);
    // 상단 하이라이트
    this.timeBar.fillStyle(0xffffff, 0.35);
    this.timeBar.fillRect(0, y, width * r, 1);
  }

  drawJudgmentZone() {
    const { width, height } = this.scale;
    const y = this.judgmentY;
    const g = this.add.graphics().setDepth(-6);

    // 양엄지용 레인 분할 수직선 (화면 중앙)
    g.lineStyle(1, 0x00e5ff, 0.08);
    g.strokeLineShape(new Phaser.Geom.Line(width / 2, 80, width / 2, height - 10));

    // PERFECT 밴드 (강조) — 양쪽 끝 살짝 밝게
    g.fillStyle(0xffd24a, 0.05);
    g.fillRect(0, y - JUDGMENT.perfect, width, JUDGMENT.perfect * 2);

    // 메인 라인
    g.lineStyle(1, 0x00e5ff, 0.75);
    g.strokeLineShape(new Phaser.Geom.Line(0, y, width, y));

    // 양끝 짧은 브래킷 (화살표 느낌)
    g.lineStyle(2, 0x00e5ff, 1);
    g.strokeLineShape(new Phaser.Geom.Line(0, y - 10, 0, y + 10));
    g.strokeLineShape(new Phaser.Geom.Line(0, y, 16, y));
    g.strokeLineShape(new Phaser.Geom.Line(width - 16, y, width, y));
    g.strokeLineShape(new Phaser.Geom.Line(width, y - 10, width, y + 10));

    // 라벨 "TAP ZONE"
    this.add.text(width / 2, y - 14, '◂  TAP ZONE  ▸', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#00e5ff',
    }).setOrigin(0.5).setDepth(-5).setLetterSpacing(4).setAlpha(0.8);

    // 은은한 맥동 (라인 자체 알파)
    const pulseLine = this.add.graphics().setDepth(-5);
    pulseLine.lineStyle(1, 0xffd24a, 0.8);
    pulseLine.strokeLineShape(new Phaser.Geom.Line(0, y, width, y));
    this.tweens.add({
      targets: pulseLine, alpha: { from: 0.15, to: 0.55 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
  }

  judgeOrb(orb) {
    // 이 함수 호출 시점엔 이미 TAP ZONE 내부가 보장됨 (|dy| <= JUDGMENT.good).
    const dy = Math.abs(orb.y - this.judgmentY);
    if (dy <= JUDGMENT.perfect) return { tier: 'PERFECT', mul: JUDGMENT.perfectMul };
    if (dy <= JUDGMENT.great)   return { tier: 'GREAT',   mul: JUDGMENT.greatMul };
    return                             { tier: 'GOOD',    mul: JUDGMENT.goodMul };
  }

  showJudgmentFeedback(tier /*, x, y */) {
    // 판정 텍스트는 오브가 아니라 TAP ZONE 라인 바로 아래 고정 위치에 띄운다.
    // 오브 위에 튀어오르면 시야가 가려져 다음 오브가 "순간이동"한 듯 보이는 착시가 난다.
    const color = JUDGMENT_COLORS[tier] ?? 0x8a8aa8;
    const hex = '#' + color.toString(16).padStart(6, '0');
    const sizeMap = {
      PERFECT: 30, GREAT: 26, GOOD: 22,
      EARLY: 16, LATE: 16, MISS: 20, LINK: 28,
    };
    const size = sizeMap[tier] ?? 20;

    // 판정별 SFX (짧은 톤, Audio.tap()/rare()와 중첩되어 타격+화성 느낌)
    if (tier === 'PERFECT') Audio.perfect?.();
    else if (tier === 'GREAT') Audio.great?.();
    else if (tier === 'GOOD') Audio.good?.();
    else if (tier === 'EARLY') Audio.early?.();
    else if (tier === 'LATE') Audio.late?.();
    else if (tier === 'MISS') Audio.miss?.();

    const { width } = this.scale;
    const x = width / 2;
    const y = this.judgmentY + 36;
    const t = this.add.text(x, y, tier, {
      fontFamily: FONT.display, fontSize: `${size}px`, fontStyle: '900',
      color: hex, stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(950).setLetterSpacing(3).setScale(0.6).setAlpha(0);

    this.tweens.add({
      targets: t, scale: 1, alpha: 1,
      duration: 120, ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: t, alpha: 0, y: t.y + 12,
          duration: 320, delay: 140, ease: 'Cubic.Out',
          onComplete: () => t.destroy(),
        });
      },
    });
  }

  drawLinkLines() {
    const g = this.linkLines;
    g.clear();
    const pulse = 0.6 + 0.4 * Math.sin(this.time.now * 0.008);
    for (let i = 0; i < this.orbs.length; i++) {
      const o = this.orbs[i];
      if (!o.alive || !o.linkPartner) continue;
      const p = o.linkPartner;
      if (!p.alive) continue;
      if (p.linkPartner !== o) continue; // 양방향 검증 (재사용 후 잔존 참조 방지)
      const pIdx = this.orbs.indexOf(p);
      if (pIdx <= i) continue; // 쌍당 1회만
      // 바깥 글로우
      g.lineStyle(12, COLORS.magenta, 0.18 * pulse);
      g.strokeLineShape(new Phaser.Geom.Line(o.x, o.y, p.x, p.y));
      g.lineStyle(6, COLORS.magenta, 0.45 * pulse);
      g.strokeLineShape(new Phaser.Geom.Line(o.x, o.y, p.x, p.y));
      g.lineStyle(2, 0xffffff, 0.85);
      g.strokeLineShape(new Phaser.Geom.Line(o.x, o.y, p.x, p.y));
      // 중앙 "SYNC" 라벨은 이 draw에선 생략 (복잡도↑). 대신 중점에 점 찍어 시각 앵커.
      const mx = (o.x + p.x) / 2, my = (o.y + p.y) / 2;
      g.fillStyle(COLORS.magenta, 0.9 * pulse);
      g.fillCircle(mx, my, 4);
    }
  }

  triggerLinkBonus(a, b) {
    const { width } = this.scale;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    // 추가 보너스 점수
    const bonus = 300;
    const prev = this.score;
    this.score += bonus;
    Juice.countUp(this, this.hudScore, prev, this.score, 220);

    // LINK 팝업 (중앙)
    this.showJudgmentFeedback('LINK', mx, my);
    Juice.popText(this, mx, my + 30, `+${bonus}`, {
      color: COLORS.magenta, size: 28,
    });

    // 중앙에서 양쪽으로 퍼지는 링 + 플래시
    Juice.flash(this, COLORS.magenta, 180);
    Juice.ring(this, mx, my, { color: COLORS.magenta, radius: 240, count: 2, duration: 500 });
    Juice.burst(this, a.x, a.y, { count: 14, color: COLORS.magenta, speed: 300 });
    Juice.burst(this, b.x, b.y, { count: 14, color: COLORS.magenta, speed: 300 });

    // 보너스 젬 (가끔)
    if (Math.random() < 0.4) {
      this.gemsEarned += 1;
      Juice.popText(this, mx, my - 30, '💎 +1', {
        color: COLORS.gold, size: 24, rise: 60, duration: 900,
      });
    }

    Audio.linkBonus?.();
    Juice.shake(this, 0.012, 180);
  }

  onOrbMiss(orb) {
    if (!this.isPlaying) return;
    const { width, height } = this.scale;
    if (this.combo > 0) this.resetCombo();
    this.showJudgmentFeedback('MISS', Phaser.Math.Clamp(orb.x, 60, width - 60), height - 80);

    // 하단 에지 레드 플래시 — 놓쳤다는 명확한 부정 신호
    Juice.flash(this, COLORS.red, 130);
    const edgeFlash = this.add.graphics().setDepth(900).setAlpha(0);
    edgeFlash.fillStyle(COLORS.red, 0.35);
    edgeFlash.fillRect(0, height - 110, width, 110);
    this.tweens.add({
      targets: edgeFlash, alpha: { from: 0.35, to: 0 },
      duration: 220, ease: 'Cubic.Out',
      onComplete: () => edgeFlash.destroy(),
    });
  }

  drawComboBar() {
    const { width, height } = this.scale;
    const barW = 10, barH = 180;
    const x = width - 22, y = height / 2 - barH / 2;
    this.comboBarBg.clear();
    this.comboBarBg.fillStyle(0x1a1a2e, 0.7);
    this.comboBarBg.fillRoundedRect(x, y, barW, barH, 5);
    this.comboBarBg.lineStyle(1, 0x00e5ff, 0.3);
    this.comboBarBg.strokeRoundedRect(x, y, barW, barH, 5);

    this.comboBar.clear();
    const ratio = Math.min(this.combo / 25, 1);
    const fillH = barH * ratio;
    if (fillH > 0) {
      const color = this.combo >= 25 ? COLORS.red :
                    this.combo >= 15 ? COLORS.magenta :
                    this.combo >= 10 ? COLORS.gold : COLORS.cyan;
      this.comboBar.fillStyle(color, 1);
      this.comboBar.fillRoundedRect(x, y + (barH - fillH), barW, fillH, 5);
    }
  }

  startCountdown() {
    const center = { x: this.scale.width / 2, y: this.scale.height / 2 };
    let n = GAME.countdown;
    const tick = () => {
      if (n > 0) {
        const t = this.add.text(center.x, center.y, String(n), {
          fontSize: '140px', fontStyle: 'bold', color: '#00e5ff',
          stroke: '#000', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(999);
        this.tweens.add({
          targets: t, scale: { from: 1.4, to: 0.6 }, alpha: 0,
          duration: 700, onComplete: () => t.destroy(),
        });
        Juice.ring(this, center.x, center.y, { color: COLORS.cyan, radius: 180, count: 1 });
        Audio.tap();
        n--;
        this.time.delayedCall(700, tick);
      } else {
        const go = this.add.text(center.x, center.y, 'GO!', {
          fontSize: '130px', fontStyle: 'bold', color: '#ffd24a',
          stroke: '#000', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(999);
        this.tweens.add({
          targets: go, scale: { from: 0.7, to: 1.8 }, alpha: 0,
          duration: 600, onComplete: () => go.destroy(),
        });
        Juice.ring(this, center.x, center.y, { color: COLORS.gold, radius: 260, count: 2, duration: 600 });
        Juice.flash(this, COLORS.gold, 140);
        Audio.fanfare();
        Audio.playBgm?.(this.stage.bgm, { fadeIn: 0.6 });
        this.isPlaying = true;
        Analytics.track('session_start');
      }
    };
    tick();
  }

  update(time, delta) {
    const dt = delta / 1000;

    if (this.isPlaying) {
      this.elapsed += dt;
      this.remaining = Math.max(0, GAME.sessionSeconds - this.elapsed);
      const sec = Math.ceil(this.remaining);
      this.hudTime.setText(String(sec));
      this.drawTimeBar(this.remaining / GAME.sessionSeconds);
      // 마지막 5초 긴박감
      if (sec <= 5 && sec > 0) {
        this.hudTime.setColor(sec <= 3 ? '#ff4d6d' : '#ffd24a');
      } else {
        this.hudTime.setColor('#e8ecf5');
      }

      // 레벨 진행 체크
      this.checkLevelProgression();

      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnOrb();
        this.spawnTimer = this.currentLevel.spawn * this.stage.spawnMul;
      }

      if (this.remaining <= 0) this.endSession();
    }

    for (const o of this.orbs) o.update(dt);

    // LINK 연결선 렌더 — 살아있는 쌍에 대해 한 번씩만
    this.drawLinkLines();

    // 콤보 윈도우 만료
    if (this.combo > 0 && time - this.lastTapAt > COMBO.windowMs) {
      this.resetCombo();
    }

    // 네온 테두리 감쇠
    if (this.borderAlpha > 0) {
      this.borderAlpha = Math.max(0, this.borderAlpha - dt * 0.5);
      this.drawBorder();
    }

    // 배경 강도 감쇠 (콤보 없을 때)
    if (this.combo === 0 && this.bgIntensity > 0) {
      this.bgIntensity = Math.max(0, this.bgIntensity - dt * 0.8);
      this.drawBgPulse();
    }
  }

  checkLevelProgression() {
    for (let i = LEVELS.length - 1; i > this.levelIdx; i--) {
      if (this.elapsed >= LEVELS[i].at) {
        this.levelIdx = i;
        this.currentLevel = LEVELS[i];
        this.hudLevel.setText(this.currentLevel.label);
        this.showLevelBanner(this.currentLevel);
        break;
      }
    }
  }

  showLevelBanner(lvl) {
    const { width, height } = this.scale;
    Audio.levelUp?.();
    Juice.flash(this, COLORS.gold, 160);
    Juice.punch(this, this.hudLevel, 1.5, 220);

    const t = this.add.text(width / 2, height * 0.38, `◆  ${lvl.label}  ◆`, {
      fontFamily: FONT.display, fontSize: '42px', fontStyle: '900',
      color: '#ffd24a', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(970).setLetterSpacing(5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: t, alpha: 1, scale: 1.1, duration: 220, ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: t, alpha: 0, y: t.y - 30,
          duration: 460, delay: 280, ease: 'Cubic.In',
          onComplete: () => t.destroy(),
        });
      },
    });
    Juice.ring(this, width / 2, height * 0.38, {
      color: COLORS.gold, radius: 260, count: 2, duration: 500,
    });
  }

  spawnOrb() {
    const { width } = this.scale;
    const marginX = 56;
    const mid = width / 2;
    const y = -40;

    // 스테이지 배수 적용: 속도/스폰 간격/폭탄·레어 확률 전부 스테이지 성격에 맞춤.
    const speed = this.currentLevel.speed * this.stage.speedMul;
    const bombProb = this.currentLevel.bomb * this.stage.bombMul;
    const rareProb = PROB.rare * this.stage.rareMul;

    const roll = Math.random();
    let kind;
    if (roll < rareProb) kind = ORB_KIND.RARE;
    else if (roll < rareProb + bombProb) kind = ORB_KIND.BOMB;
    else kind = ORB_KIND.NORMAL;

    // LINK 쌍: LVL2 이후 일반 오브에서 스테이지별 확률로 대체. 항상 좌/우 분리
    // → 양엄지를 각각 한 손씩 쓰도록 유도한다.
    if (kind === ORB_KIND.NORMAL && this.levelIdx >= 1 && Math.random() < this.stage.linkChance) {
      const a = this.orbs.find(o => !o.alive);
      const b = a ? this.orbs.find(o => !o.alive && o !== a) : null;
      if (a && b) {
        const lx = Phaser.Math.Between(marginX, mid - 40);
        const rx = Phaser.Math.Between(mid + 40, width - marginX);
        a.reset(lx, y, ORB_KIND.NORMAL, speed);
        b.reset(rx, y, ORB_KIND.NORMAL, speed);
        a.linkPartner = b;
        b.linkPartner = a;
        this._lastLane = 'both';
        return;
      }
    }

    // 단일 오브는 직전 레인의 반대편 선호.
    // 같은 엄지를 연속 두드리지 않도록 80% 확률로 교차시킨다.
    const preferLeft =
      this._lastLane === 'right' ? Math.random() < 0.8 :
      this._lastLane === 'left'  ? Math.random() < 0.2 :
      Math.random() < 0.5;
    const x = preferLeft
      ? Phaser.Math.Between(marginX, mid - 20)
      : Phaser.Math.Between(mid + 20, width - marginX);
    this._lastLane = preferLeft ? 'left' : 'right';

    const orb = this.orbs.find(o => !o.alive);
    if (!orb) return;
    orb.reset(x, y, kind, speed);
  }

  onOrbTap(obj) {
    if (!this.isPlaying || !obj || !obj.alive) return;
    const kind = obj.kind;

    if (kind === ORB_KIND.BOMB) {
      Audio.bomb();
      Juice.flash(this, COLORS.red, 200);
      Juice.shake(this, 0.022, 260);
      Juice.burst(this, obj.x, obj.y, { count: 18, color: COLORS.red, speed: 320 });
      Juice.ring(this, obj.x, obj.y, { color: COLORS.red, radius: 160, count: 2 });
      Juice.popText(this, obj.x, obj.y - 20, 'BREAK!', {
        color: COLORS.red, size: 32,
      });
      this.resetCombo();
      obj.pop();
      Analytics.track('tap_bomb');
      return;
    }

    // 타이밍 판정 (TAP ZONE 기준)
    const judge = this.judgeOrb(obj);
    this.showJudgmentFeedback(judge.tier, obj.x, obj.y);

    const now = this.time.now;
    const inWindow = (now - this.lastTapAt) < COMBO.windowMs;
    this.combo = inWindow ? this.combo + 1 : 1;
    this.lastTapAt = now;
    this.tapsMade++;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;

    const base = kind === ORB_KIND.RARE ? SCORE.rare : SCORE.normal;
    const comboMul = Math.min(1 + this.combo * COMBO.bonusPerStep, COMBO.maxMul);
    const mul = comboMul * judge.mul;
    const gained = Math.round(base * mul);
    const prevScore = this.score;
    this.score += gained;

    // 점수 HUD 카운트업 + 펀치
    Juice.countUp(this, this.hudScore, prevScore, this.score, 260);
    Juice.punch(this, this.hudScore, 1.2, 160);

    // 파티클·링·플래시 — 오브 자리에 너무 많이 쌓이지 않도록 절제.
    // 점수 팝업은 오브 위로 충분히 띄워 다음 오브와 겹치지 않게.
    const color = kind === ORB_KIND.RARE ? COLORS.gold : this.skin.color;
    const burstCount = kind === ORB_KIND.RARE ? 16 : Math.min(6 + Math.floor(this.combo / 2), 14);
    Juice.burst(this, obj.x, obj.y, { count: burstCount, color, speed: 240 });
    Juice.ring(this, obj.x, obj.y, {
      color, radius: 60 + Math.min(this.combo * 3, 40),
      count: 1,
    });
    Juice.popText(this, obj.x, obj.y - 60, `+${gained}`, {
      color, size: kind === ORB_KIND.RARE ? 32 : 24 + Math.min(this.combo, 8),
    });

    // 카메라 흔들림은 탭 피드백에서 완전히 제거.
    // (흔들면 오브 위치가 프레임마다 변해 "빨라진 듯한" 착시가 생긴다.)
    // 폭탄처럼 "실수/이벤트"에서만 흔들림을 쓴다. 콤보/레어는 링·테두리로만 보강.

    // 배경 맥동 강도 UP
    this.bgIntensity = Math.min(1, 0.15 + this.combo * 0.05);
    this.drawBgPulse();

    if (kind === ORB_KIND.RARE) {
      Audio.rare();
      Juice.flash(this, COLORS.gold, 200);
      Juice.slowmo(this, 0.35, 180);
      this.gemsEarned += GEMS_PER_RARE;
      Juice.popText(this, obj.x, obj.y - 60, `💎 +${GEMS_PER_RARE}`, {
        color: COLORS.gold, size: 30, rise: 80, duration: 1000,
      });
    } else {
      Audio.tap();
      if (this.combo > 1) Audio.combo(this.combo);
    }

    // 콤보 HUD 갱신 — 콤보배율만 표시 (타이밍배율은 팝업으로 전달)
    if (this.combo >= 2) {
      this.hudCombo.setText(`COMBO ×${comboMul.toFixed(2)}  ${this.combo}`);
      Juice.punch(this, this.hudCombo, 1.3, 180);
    }

    // 콤보 등급 배너
    for (const rank of COMBO_RANKS) {
      if (this.combo >= rank.at && !this.reachedRanks.has(rank.at)) {
        this.reachedRanks.add(rank.at);
        this.showRankBanner(rank);
      }
    }

    // 마일스톤 체크
    for (const m of SCORE_MILESTONES) {
      if (this.score >= m && !this.reachedMilestones.has(m)) {
        this.reachedMilestones.add(m);
        this.showMilestone(m);
      }
    }

    // 네온 테두리
    if (this.combo >= 10) {
      this.borderAlpha = 1;
      this.drawBorder();
    }

    // 콤보 바 업데이트
    this.drawComboBar();

    // LINK 동시 탭 판정 — 파트너가 최근에 탭됐다면 보너스.
    // 양방향 검증으로 재사용된 오브의 잔존 참조는 배제한다.
    const LINK_WINDOW = 320;
    if (obj.linkPartner && obj.linkPartner.linkPartner === obj) {
      const partner = obj.linkPartner;
      const partnerTap = partner.linkTappedAt;
      obj.linkTappedAt = this.time.now;
      if (partnerTap && (this.time.now - partnerTap) <= LINK_WINDOW) {
        this.triggerLinkBonus(obj, partner);
      }
    }

    obj.pop();
    Analytics.track('tap', { kind, combo: this.combo, score: gained });
  }

  showRankBanner(rank) {
    const { width, height } = this.scale;
    Audio.rankup();
    Juice.flash(this, rank.color, 160);

    const t = this.add.text(width / 2, height * 0.45, rank.label, {
      fontSize: '72px', fontStyle: 'bold',
      color: '#' + rank.color.toString(16).padStart(6, '0'),
      stroke: '#000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(980).setScale(0.4).setAlpha(0).setAngle(-8);

    this.tweens.add({
      targets: t,
      scale: { from: 0.4, to: 1.15 },
      alpha: 1,
      angle: 0,
      duration: 220,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: t,
          alpha: 0,
          scale: 1.6,
          duration: 500,
          delay: 350,
          ease: 'Cubic.In',
          onComplete: () => t.destroy(),
        });
      },
    });

    // 축하 파티클 (좌우에서 샤워)
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 80, () => {
        Juice.burst(this, width * 0.2, height * 0.45, { count: 14, color: rank.color, speed: 340 });
        Juice.burst(this, width * 0.8, height * 0.45, { count: 14, color: rank.color, speed: 340 });
      });
    }
  }

  showMilestone(score) {
    const { width, height } = this.scale;
    Audio.milestone();
    Juice.flash(this, COLORS.gold, 180);
    Juice.shake(this, 0.01, 220);

    const t = this.add.text(width / 2, height * 0.3,
      `🏁 ${score.toLocaleString()}!`, {
      fontSize: '56px', fontStyle: 'bold', color: '#ffd24a',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(970).setAlpha(0).setScale(0.6);

    this.tweens.add({
      targets: t, alpha: 1, scale: 1.1, duration: 260, ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: t, alpha: 0, y: t.y - 40,
          duration: 500, delay: 350,
          onComplete: () => t.destroy(),
        });
      },
    });
    Juice.ring(this, width / 2, height * 0.3, { color: COLORS.gold, radius: 260, count: 3 });
  }

  resetCombo() {
    this.combo = 0;
    this.hudCombo.setText('');
    this.borderAlpha = 0;
    this.drawBorder();
    this.drawComboBar();
  }

  drawBgPulse() {
    const { width, height } = this.scale;
    const g = this.bgPulse;
    g.clear();
    if (this.bgIntensity <= 0) return;

    // 콤보가 높을수록 점멸 주기 단축: 느긋(6ms) → 긴박(14ms)
    const pulseSpeed = this.combo >= 25 ? 0.014 :
                       this.combo >= 15 ? 0.011 :
                       this.combo >= 10 ? 0.009 : 0.006;
    const pulse = 0.5 + 0.5 * Math.sin(this.time.now * pulseSpeed);
    const alpha = this.bgIntensity * 0.35 * (0.7 + 0.3 * pulse);

    const color = this.combo >= 25 ? COLORS.red :
                  this.combo >= 15 ? COLORS.magenta :
                  this.combo >= 10 ? COLORS.gold : this.skin.color;
    g.fillStyle(color, alpha * 0.4);
    g.fillRect(0, 64, width, height - 64);
    g.fillStyle(color, alpha * 0.6);
    g.fillRect(0, 64, width, 90);
    g.fillStyle(color, alpha * 0.6);
    g.fillRect(0, height - 100, width, 100);
  }

  drawBorder() {
    this.borderFx.clear();
    if (this.borderAlpha <= 0) return;
    const { width, height } = this.scale;
    const alpha = Math.min(1, this.borderAlpha);
    const color = this.combo >= 25 ? COLORS.red :
                  this.combo >= 15 ? COLORS.magenta : COLORS.magenta;
    this.borderFx.lineStyle(6, color, alpha);
    this.borderFx.strokeRect(3, 3, width - 6, height - 6);
    this.borderFx.lineStyle(16, color, alpha * 0.25);
    this.borderFx.strokeRect(10, 10, width - 20, height - 20);
  }

  endSession() {
    this.isPlaying = false;
    Audio.stopBgm?.({ fadeOut: 0.4 });

    // 1) 남아있는 오브를 깔끔히 정리 — 터트리듯 수축 페이드아웃
    const { width, height } = this.scale;
    for (const o of this.orbs) {
      if (!o.alive) continue;
      o.alive = false; // 추가 입력 차단
      this.tweens.add({
        targets: o,
        alpha: 0,
        scale: 0.4,
        duration: 280,
        ease: 'Cubic.In',
        onComplete: () => o.deactivate(),
      });
    }

    // 2) 하단 시간 바 0 고정 + 중앙 TIME UP 배너
    this.drawTimeBar(0);
    this.hudCombo.setText('');

    const banner = this.add.text(width / 2, height * 0.42, 'TIME UP', {
      fontFamily: FONT.display, fontSize: '60px', fontStyle: '900',
      color: '#00e5ff', stroke: '#000', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(980).setScale(0.5).setAlpha(0).setLetterSpacing(6);

    this.tweens.add({
      targets: banner, scale: 1, alpha: 1,
      duration: 260, ease: 'Back.Out',
    });

    // 최종 플래시 & 흔들림
    Juice.flash(this, COLORS.cyan, 220);
    Juice.shake(this, 0.012, 240);

    // 3) 보상 계산
    const coins = Math.floor(this.score / 100);
    Storage.addCoins(coins);
    Storage.addGems(this.gemsEarned);
    const isBest = Storage.setBestScore('tap-rush', this.score);

    Analytics.track('session_end', {
      score: this.score, bestCombo: this.bestCombo,
      coins, gems: this.gemsEarned, isBest,
    });

    // 4) 결과 화면 전환 (오브 페이드아웃 완료 후)
    this.time.delayedCall(900, () => {
      this.scene.start('ResultScene', {
        score: this.score,
        bestCombo: this.bestCombo,
        coins,
        gems: this.gemsEarned,
        isBest,
        stageId: this.stage.id,
      });
    });
  }

  cleanup() {
    for (const o of this.orbs) o.destroy();
    this.orbs = [];
  }
}
