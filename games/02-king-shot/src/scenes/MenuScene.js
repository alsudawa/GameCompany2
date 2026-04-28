// MenuScene — 임시 타이틀 (Step 6에서 스테이지 캐러셀로 확장).
// 중세 판타지 톤: 어두운 숲 배경 + 골드 크라운 마크 + Cinzel 타이틀.

import { Audio } from '../../../../shared/audio.js';
import { COLORS, FONT, GAME, STAGES } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;

    // 첫 입력으로 AudioContext 언락
    Audio.unlockOnFirstInput(this);

    // 배경 비네트 — 따뜻한 깊은 숲
    this.cameras.main.setBackgroundColor('#15201a');
    const bg = this.add.graphics().setDepth(-10);
    bg.fillGradientStyle(0x1f3a22, 0x1f3a22, 0x0d1810, 0x0d1810, 1, 1, 1, 1);
    bg.fillRect(0, 0, width, height);

    // 위쪽 따뜻한 하이라이트 — 횃불 빛 느낌
    const highlight = this.add.graphics().setDepth(-9);
    highlight.fillStyle(COLORS.gold, 0.06);
    highlight.fillCircle(width / 2, 80, 280);

    // 작은 별 입자 — 야밤 분위기
    for (let i = 0; i < 24; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height * 0.55;
      const sz = 0.8 + Math.random() * 1.5;
      const star = this.add.circle(sx, sy, sz, COLORS.parchment, 0.5).setDepth(-8);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: 1400 + Math.random() * 1600,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1200,
      });
    }

    // 타이틀 KING SHOT — Cinzel 거대 글자, 골드 텍스트 + 그림자
    const titleShadow = this.add.text(width / 2 + 3, 188 + 3, 'KING SHOT', {
      fontFamily: FONT.display,
      fontSize: '54px',
      fontStyle: '900',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0.5).setDepth(0);
    titleShadow.setLetterSpacing?.(4);

    const title = this.add.text(width / 2, 188, 'KING SHOT', {
      fontFamily: FONT.display,
      fontSize: '54px',
      fontStyle: '900',
      color: '#f4c542',
      stroke: '#3e2e1e',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1);
    title.setLetterSpacing?.(4);

    // 타이틀 미세 펄스
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.04 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // 부제
    const sub = this.add.text(width / 2, 240, '왕국을 지켜라 · 활시위를 당겨라', {
      fontFamily: FONT.body,
      fontSize: '15px',
      fontStyle: '600',
      color: '#d9c897',
    }).setOrigin(0.5).setDepth(1);
    sub.setLetterSpacing?.(2);

    // 골드 디바이더 라인
    const div = this.add.graphics().setDepth(1);
    div.lineStyle(2, COLORS.gold, 0.6);
    div.beginPath();
    div.moveTo(width / 2 - 80, 270);
    div.lineTo(width / 2 + 80, 270);
    div.strokePath();
    // 디바이더 가운데 다이아몬드
    div.fillStyle(COLORS.gold, 0.9);
    div.fillTriangle(width / 2 - 6, 270, width / 2 + 6, 270, width / 2, 264);
    div.fillTriangle(width / 2 - 6, 270, width / 2 + 6, 270, width / 2, 276);

    // 시작 안내 — 화면 중앙 아래
    const tap = this.add.text(width / 2, 480, 'TAP TO START', {
      fontFamily: FONT.display,
      fontSize: '22px',
      fontStyle: '700',
      color: '#f0e6d0',
    }).setOrigin(0.5).setDepth(1);
    tap.setLetterSpacing?.(3);

    this.tweens.add({
      targets: tap,
      alpha: { from: 1, to: 0.3 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // 첫 스테이지 라벨 (Step 6에서 캐러셀로 확장 예정)
    const stage = STAGES[0];
    this.add.text(width / 2, 540, `STAGE ${stage.label} · ${stage.name}`, {
      fontFamily: FONT.mono,
      fontSize: '12px',
      fontStyle: '700',
      color: '#f4c542',
    }).setOrigin(0.5).setDepth(1).setLetterSpacing?.(3);
    this.add.text(width / 2, 562, stage.tagline, {
      fontFamily: FONT.body,
      fontSize: '13px',
      color: '#8a8470',
    }).setOrigin(0.5).setDepth(1);

    // 시작 입력
    this.input.once('pointerdown', () => {
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { stageId: stage.id });
      });
    });
  }
}
