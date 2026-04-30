// Gate — 영웅이 통과하면 업그레이드 적용. 좌/우 두 패널 중 하나 선택.

import { COLORS, FONT, UPGRADE_TYPES } from '../config.js';

const PANEL_W = 180;
const PANEL_H = 90;

export class Gate extends Phaser.GameObjects.Container {
  // worldY: 게이트가 트리거되는 월드 Y. left/right: { type: 'damage', value: 5, label: '+5 DMG' }
  constructor(scene, worldY, left, right) {
    super(scene, scene.scale.width / 2, 0);
    scene.add.existing(this);

    this.worldY = worldY;
    this.left = left;
    this.right = right;
    this.consumed = false;

    this.leftPanel = this.makePanel(-95, left, true);
    this.rightPanel = this.makePanel(95, right, false);
    this.add([this.leftPanel, this.rightPanel]);

    this.setDepth(35);
  }

  makePanel(offsetX, info, isLeft) {
    const c = this.scene.add.container(offsetX, 0);
    const cfg = UPGRADE_TYPES[info.type];
    const color = cfg?.color ?? COLORS.goldHud;

    // 그림자
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-PANEL_W / 2 + 4, -PANEL_H / 2 + 4, PANEL_W, PANEL_H, 10);
    // 백 (나무)
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a0e08, 1);
    bg.fillRoundedRect(-PANEL_W / 2 - 2, -PANEL_H / 2 - 2, PANEL_W + 4, PANEL_H + 4, 12);
    bg.fillStyle(0x3e2e1e, 1);
    bg.fillRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 10);
    // 안쪽 컬러 패널
    bg.fillStyle(color, 0.35);
    bg.fillRoundedRect(-PANEL_W / 2 + 4, -PANEL_H / 2 + 4, PANEL_W - 8, PANEL_H - 8, 8);
    // 골드 트림
    bg.lineStyle(3, COLORS.goldHud, 1);
    bg.strokeRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 10);
    bg.lineStyle(1, COLORS.goldDeep, 0.85);
    bg.strokeRoundedRect(-PANEL_W / 2 + 4, -PANEL_H / 2 + 4, PANEL_W - 8, PANEL_H - 8, 8);
    // 모서리 못
    bg.fillStyle(COLORS.goldHud, 1);
    [[-PANEL_W / 2 + 8, -PANEL_H / 2 + 8],
     [ PANEL_W / 2 - 8, -PANEL_H / 2 + 8],
     [-PANEL_W / 2 + 8,  PANEL_H / 2 - 8],
     [ PANEL_W / 2 - 8,  PANEL_H / 2 - 8]]
      .forEach(([px, py]) => bg.fillCircle(px, py, 3));

    // 라벨
    const label = info.label ?? `${cfg?.glyph ?? '+'} ${info.value}`;
    const t = this.scene.add.text(0, 0, label, {
      fontFamily: FONT.display, fontSize: '26px', fontStyle: '900',
      color: '#fff5d8', stroke: '#3e2e1e', strokeThickness: 4,
    }).setOrigin(0.5);
    t.setLetterSpacing?.(2);

    c.add([shadow, bg, t]);

    // 펄스 (눈에 띄게)
    this.scene.tweens.add({
      targets: c, scale: { from: 1, to: 1.06 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    return c;
  }

  // 영웅 X 위치 기준으로 좌(true)/우(false) 선택
  whichSide(heroX) {
    const cx = this.scene.scale.width / 2;
    return heroX < cx ? 'left' : 'right';
  }

  // 통과 발생 (consumed = true 후 effect 적용)
  consume(side) {
    if (this.consumed) return null;
    this.consumed = true;
    const chosen = (side === 'left') ? this.left : this.right;
    const otherPanel = (side === 'left') ? this.rightPanel : this.leftPanel;
    const chosenPanel = (side === 'left') ? this.leftPanel : this.rightPanel;
    // 선택된 패널 — 골드 플래시 후 위로 사라짐
    this.scene.tweens.add({
      targets: chosenPanel, scale: 1.4, alpha: 0, y: chosenPanel.y - 30,
      duration: 360, ease: 'Cubic.Out',
    });
    // 다른 패널 — 빨간 플래시 후 가라앉으며 사라짐
    this.scene.tweens.add({
      targets: otherPanel, alpha: 0, y: otherPanel.y + 12,
      duration: 260, ease: 'Cubic.In',
    });
    this.scene.time.delayedCall(380, () => this.destroy());
    return chosen;
  }
}
