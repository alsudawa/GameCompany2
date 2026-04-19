// ShopScene — IAP 상점. 탭 전환: Gems / Cosmetics / Pass.

import { IAP, Catalog, byTag } from '../../../../shared/iap/iap.js';
import { Storage } from '../../../../shared/storage.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { UI, FONT } from '../../../../shared/ui.js';
import { COLORS } from '../config.js';

const TABS = [
  { id: 'gems',     label: 'GEMS',     icon: '◈' },
  { id: 'cosmetic', label: 'SKINS',    icon: '◆' },
  { id: 'pass',     label: 'PASS',     icon: '▣' },
];

export class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05050c');
    this.activeTab = 'gems';
    this.busy = false;

    // 배경 레이어 (게임/메뉴와 톤 통일)
    UI.drawGrid(this, width, height, { cell: 40, color: 0x0f1530, alpha: 0.45, depth: -25 });
    UI.drawViewportFrame(this, width, height, { color: 0x00e5ff, alpha: 0.35, depth: -8, inset: 4 });
    UI.drawScanlines(this, width, height, { gap: 3, alpha: 0.035, depth: 1200 });

    // 헤더 — 라벨 + 큰 타이틀
    this.add.text(width / 2, 24, '— STOREFRONT —', {
      fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
      color: '#6b708f',
    }).setOrigin(0.5).setLetterSpacing(4);
    this.add.text(width / 2, 48, 'SHOP', {
      fontFamily: FONT.display, fontSize: '26px', fontStyle: '900',
      color: '#e8ecf5',
    }).setOrigin(0.5).setLetterSpacing(6);

    // 재화 카운터
    this.balance = this.add.text(width / 2, 78, '', {
      fontFamily: FONT.mono, fontSize: '12px', fontStyle: '700',
      color: '#e8ecf5',
    }).setOrigin(0.5).setLetterSpacing(3);

    // 탭
    this.tabNodes = TABS.map((tab, i) => this.makeTab(tab, i));
    this.listContainer = this.add.container(0, 0);

    this.refreshBalance();
    this.renderList();

    // 뒤로가기 — 코너 화살표
    const back = this.add.text(22, 28, '◂', {
      fontFamily: FONT.display, fontSize: '24px', fontStyle: '900',
      color: '#00e5ff',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      Audio.tap();
      this.scene.start('MenuScene');
    });

    // 스크롤
    this.input.on('wheel', (_pointer, _over, _dx, dy) => {
      this.listContainer.y = Phaser.Math.Clamp(this.listContainer.y - dy, -400, 0);
    });
  }

  refreshBalance() {
    const p = Storage.load();
    this.balance.setText(`COINS  ${p.coins.toLocaleString()}   ·   GEMS  ${p.gems.toLocaleString()}`);
  }

  makeTab(tab, i) {
    const { width } = this.scale;
    const w = (width - 24) / TABS.length;
    const x = 12 + w * i + w / 2;
    const y = 118;

    const bg = this.add.graphics();
    const text = this.add.text(x, y, `${tab.icon}  ${tab.label}`, {
      fontFamily: FONT.mono, fontSize: '12px', fontStyle: '700',
      color: '#6b708f',
    }).setOrigin(0.5).setLetterSpacing(3);

    const hit = this.add.rectangle(x, y, w - 8, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      Audio.tap();
      this.activeTab = tab.id;
      this.renderList();
      this.renderTabStyles();
    });

    return { tab, bg, text, hit, x, y, w };
  }

  renderTabStyles() {
    for (const n of this.tabNodes) {
      n.bg.clear();
      const active = n.tab.id === this.activeTab;
      const bw = n.w - 12, bh = 36;
      const bx = n.x - bw / 2, by = n.y - bh / 2;
      if (active) {
        n.bg.fillStyle(0x00e5ff, 0.12);
        n.bg.fillRect(bx, by, bw, bh);
        n.bg.lineStyle(1, 0x00e5ff, 1);
        n.bg.strokeRect(bx, by, bw, bh);
        // 하단 강조 라인
        n.bg.lineStyle(2, 0x00e5ff, 1);
        n.bg.beginPath();
        n.bg.moveTo(bx + 6, by + bh + 3);
        n.bg.lineTo(bx + bw - 6, by + bh + 3);
        n.bg.strokePath();
        n.text.setColor('#00e5ff');
      } else {
        n.bg.lineStyle(1, 0x2a2f4a, 0.6);
        n.bg.strokeRect(bx, by, bw, bh);
        n.text.setColor('#6b708f');
      }
    }
  }

  renderList() {
    this.listContainer.removeAll(true);
    this.renderTabStyles();

    const items = byTag(this.activeTab);
    const cardW = this.scale.width - 40;
    const cardH = 110;
    const startY = 180;

    items.forEach((product, i) => {
      const card = this.makeProductCard(product, cardW, cardH);
      card.setPosition(20 + cardW / 2, startY + i * (cardH + 16));
      this.listContainer.add(card);
    });
  }

  makeProductCard(product, w, h) {
    const profile = Storage.load();
    const owned = product.grant?.skin && profile.ownedSkins.includes(product.grant.skin);
    const accent = product.highlight ? COLORS.gold : 0x00e5ff;
    const hex = '#' + accent.toString(16).padStart(6, '0');

    // 패널 배경
    const panel = this.add.graphics();
    panel.fillStyle(0x08091a, 0.92);
    panel.fillRect(-w / 2, -h / 2, w, h);
    panel.lineStyle(1, accent, product.highlight ? 0.9 : 0.45);
    panel.strokeRect(-w / 2, -h / 2, w, h);

    // 코너 브래킷 — 카드 내부에서 그리려면 별도 Graphics로 상대 좌표
    const cornerG = this.add.graphics();
    cornerG.lineStyle(2, accent, 1);
    const hw = w / 2, hh = h / 2, cs = 10;
    cornerG.beginPath();
    cornerG.moveTo(-hw + cs, -hh); cornerG.lineTo(-hw, -hh); cornerG.lineTo(-hw, -hh + cs);
    cornerG.moveTo( hw - cs, -hh); cornerG.lineTo( hw, -hh); cornerG.lineTo( hw, -hh + cs);
    cornerG.moveTo(-hw + cs,  hh); cornerG.lineTo(-hw,  hh); cornerG.lineTo(-hw,  hh - cs);
    cornerG.moveTo( hw - cs,  hh); cornerG.lineTo( hw,  hh); cornerG.lineTo( hw,  hh - cs);
    cornerG.strokePath();

    // SKU 미니 레이블
    const sku = this.add.text(-hw + 14, -hh + 10, `SKU · ${product.sku.toUpperCase()}`, {
      fontFamily: FONT.mono, fontSize: '9px', fontStyle: '700',
      color: '#6b708f',
    }).setLetterSpacing(2);

    const title = this.add.text(-hw + 14, -hh + 26, product.title, {
      fontFamily: FONT.display, fontSize: '18px', fontStyle: '900',
      color: '#e8ecf5',
    }).setLetterSpacing(1);

    const desc = this.add.text(-hw + 14, -hh + 54, product.description, {
      fontFamily: FONT.body, fontSize: '13px', fontStyle: '500',
      color: '#9aa0bf', wordWrap: { width: w * 0.55 },
    });

    // HOT / NEW 태그
    let highlightTag = null;
    if (product.highlight) {
      highlightTag = this.add.text(-hw + 14, hh - 22, '▲  BEST VALUE', {
        fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
        color: '#ffd24a',
      }).setLetterSpacing(3);
    } else if (product.tag === 'gems' && !profile.firstPurchaseDone) {
      highlightTag = this.add.text(-hw + 14, hh - 22, '◆  FIRST PURCHASE +100%', {
        fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700',
        color: '#ffd24a',
      }).setLetterSpacing(3);
    }

    // 가격/버튼
    const btnW = 118, btnH = 46;
    const btnX = hw - btnW / 2 - 14;
    const btnColor = owned ? 0x2a2f4a : accent;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0a0e20, 0.95);
    btnBg.fillRect(btnX - btnW / 2, -btnH / 2, btnW, btnH);
    btnBg.lineStyle(1, btnColor, 1);
    btnBg.strokeRect(btnX - btnW / 2, -btnH / 2, btnW, btnH);

    const btnLabel = this.add.text(btnX, 0,
      owned ? 'OWNED' : product.priceDisplay, {
        fontFamily: FONT.display, fontSize: '16px', fontStyle: '900',
        color: owned ? '#6b708f' : hex,
      }).setOrigin(0.5).setLetterSpacing(2);

    const card = this.add.container(0, 0, [panel, cornerG, sku, title, desc, btnBg, btnLabel]);
    if (highlightTag) card.add(highlightTag);

    const hit = this.add.rectangle(btnX, 0, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    card.add(hit);

    if (!owned) {
      hit.on('pointerdown', () => card.setScale(0.98));
      hit.on('pointerup', () => { card.setScale(1); this.purchase(product); });
      hit.on('pointerout', () => card.setScale(1));
    }

    card.setSize(w, h);
    return card;
  }

  async purchase(product) {
    if (this.busy) return;
    this.busy = true;

    const overlay = this.showOverlay(`PROCESSING\n${product.title}`);
    const result = await IAP.purchase(product.sku);
    overlay.destroy();
    this.busy = false;

    if (result.ok) {
      Audio.purchase();
      Juice.flash(this, COLORS.gold, 180);
      const msg = result.bonus?.firstPurchaseBonus > 0
        ? `PURCHASE OK\n+${result.bonus.firstPurchaseBonus} GEMS BONUS`
        : 'PURCHASE OK';
      this.toast(msg, COLORS.gold);

      if (product.grant.skin) {
        Storage.equipSkin(product.grant.skin);
      }
    } else {
      Audio.bomb();
      const text = {
        NOT_ENOUGH_GEMS: 'NOT ENOUGH GEMS',
        ALREADY_OWNED: 'ALREADY OWNED',
        UNKNOWN_SKU: 'SKU NOT FOUND',
      }[result.error] || 'PURCHASE FAILED';
      this.toast(text, COLORS.red);
    }

    this.refreshBalance();
    this.renderList();
  }

  showOverlay(text) {
    const { width, height } = this.scale;
    const g = this.add.graphics().setDepth(900);
    g.fillStyle(0x000000, 0.72);
    g.fillRect(0, 0, width, height);
    const t = this.add.text(width / 2, height / 2, text, {
      fontFamily: FONT.display, fontSize: '18px', fontStyle: '900',
      color: '#00e5ff', align: 'center',
    }).setOrigin(0.5).setDepth(901).setLetterSpacing(3);

    return this.add.container(0, 0, [g, t]);
  }

  toast(text, color) {
    const { width, height } = this.scale;
    const t = this.add.text(width / 2, height - 100, text, {
      fontFamily: FONT.display, fontSize: '16px', fontStyle: '900',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setDepth(1000).setLetterSpacing(3);
    this.tweens.add({
      targets: t, y: t.y - 40, alpha: 0,
      duration: 1800, ease: 'Cubic.Out',
      onComplete: () => t.destroy(),
    });
  }
}
