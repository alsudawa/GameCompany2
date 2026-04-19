// ShopScene — IAP 상점. 탭 전환: Gems / Cosmetics / Pass.

import { IAP, Catalog, byTag } from '../../../../shared/iap/iap.js';
import { Storage } from '../../../../shared/storage.js';
import { Audio } from '../../../../shared/audio.js';
import { Juice } from '../../../../shared/juice.js';
import { COLORS } from '../config.js';

const TABS = [
  { id: 'gems',     label: '💎 Gems' },
  { id: 'cosmetic', label: '🎨 Skins' },
  { id: 'pass',     label: '📅 Pass' },
];

export class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a14');
    this.activeTab = 'gems';
    this.busy = false;

    this.header = this.add.text(this.scale.width / 2, 30, 'SHOP', {
      fontSize: '30px', fontStyle: 'bold', color: '#00e5ff',
    }).setOrigin(0.5);

    this.balance = this.add.text(this.scale.width / 2, 66, '', {
      fontSize: '16px', color: '#e8e8f0',
    }).setOrigin(0.5);

    this.tabNodes = TABS.map((tab, i) => this.makeTab(tab, i));
    this.listContainer = this.add.container(0, 0);

    this.refreshBalance();
    this.renderList();

    // 뒤로가기
    const back = this.add.text(24, 30, '←', {
      fontSize: '30px', fontStyle: 'bold', color: '#00e5ff',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      Audio.tap();
      this.scene.start('MenuScene');
    });

    // 스크롤 (상품 많아질 때 대비)
    this.input.on('wheel', (_pointer, _over, _dx, dy) => {
      this.listContainer.y = Phaser.Math.Clamp(this.listContainer.y - dy, -400, 0);
    });
  }

  refreshBalance() {
    const p = Storage.load();
    this.balance.setText(`💰 ${p.coins}    💎 ${p.gems}`);
  }

  makeTab(tab, i) {
    const { width } = this.scale;
    const w = width / TABS.length;
    const x = w * i + w / 2;
    const y = 110;

    const bg = this.add.graphics();
    const text = this.add.text(x, y, tab.label, {
      fontSize: '18px', fontStyle: 'bold', color: '#8a8aa8',
    }).setOrigin(0.5);

    const hit = this.add.rectangle(x, y, w - 8, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      Audio.tap();
      this.activeTab = tab.id;
      this.renderList();
      this.renderTabStyles();
    });

    const node = { tab, bg, text, hit, x, y, w };
    return node;
  }

  renderTabStyles() {
    for (const n of this.tabNodes) {
      n.bg.clear();
      const active = n.tab.id === this.activeTab;
      if (active) {
        n.bg.fillStyle(COLORS.cyan, 0.15);
        n.bg.fillRoundedRect(n.x - (n.w - 12) / 2, n.y - 18, n.w - 12, 36, 8);
        n.bg.lineStyle(2, COLORS.cyan, 1);
        n.bg.strokeRoundedRect(n.x - (n.w - 12) / 2, n.y - 18, n.w - 12, 36, 8);
        n.text.setColor('#00e5ff');
      } else {
        n.text.setColor('#8a8aa8');
      }
    }
  }

  renderList() {
    this.listContainer.removeAll(true);
    this.renderTabStyles();

    const items = byTag(this.activeTab);
    const cardW = this.scale.width - 40;
    const cardH = 110;
    const startY = 160;

    items.forEach((product, i) => {
      const card = this.makeProductCard(product, cardW, cardH);
      card.setPosition(20 + cardW / 2, startY + i * (cardH + 14));
      this.listContainer.add(card);
    });
  }

  makeProductCard(product, w, h) {
    const profile = Storage.load();
    const owned = product.grant?.skin && profile.ownedSkins.includes(product.grant.skin);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.panel, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    if (product.highlight) {
      bg.lineStyle(2, COLORS.gold, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    } else {
      bg.lineStyle(1, 0x2a2a50, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    }

    const title = this.add.text(-w / 2 + 18, -h / 2 + 16, product.title, {
      fontSize: '18px', fontStyle: 'bold', color: '#e8e8f0',
    });
    const desc = this.add.text(-w / 2 + 18, -h / 2 + 44, product.description, {
      fontSize: '13px', color: '#8a8aa8', wordWrap: { width: w * 0.6 },
    });

    // 첫 구매 보너스 태그
    let firstBuyTag = null;
    if (product.tag === 'gems' && !profile.firstPurchaseDone) {
      firstBuyTag = this.add.text(-w / 2 + 18, h / 2 - 26,
        '🎁 첫 구매 보너스 +100%!', {
        fontSize: '12px', fontStyle: 'bold', color: '#ffd24a',
      });
    }

    const priceColor = product.gemCost ? '#00e5ff' : '#ffd24a';
    const btnW = 110, btnH = 44;
    const btnX = w / 2 - btnW / 2 - 12;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(owned ? 0x2a2a50 : COLORS.cyan, 1);
    btnBg.fillRoundedRect(btnX - btnW / 2, -btnH / 2, btnW, btnH, 10);
    const btnLabel = this.add.text(btnX, 0,
      owned ? 'OWNED' : product.priceDisplay,
      { fontSize: '16px', fontStyle: 'bold',
        color: owned ? '#8a8aa8' : (product.gemCost ? '#0a0a14' : '#0a0a14') }
    ).setOrigin(0.5);

    const card = this.add.container(0, 0, [bg, title, desc, btnBg, btnLabel]);
    if (firstBuyTag) card.add(firstBuyTag);

    // 카드 전체를 터치 영역으로 (버튼 구역 한정)
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

    const overlay = this.showOverlay(`결제 중...\n${product.title}`);
    const result = await IAP.purchase(product.sku);
    overlay.destroy();
    this.busy = false;

    if (result.ok) {
      Audio.purchase();
      Juice.flash(this, COLORS.gold, 180);
      const msg = result.bonus?.firstPurchaseBonus > 0
        ? `구매 완료!\n🎁 첫 구매 보너스 +${result.bonus.firstPurchaseBonus} 젬`
        : '구매 완료!';
      this.toast(msg, COLORS.gold);

      // 스킨 구매면 자동 장착
      if (product.grant.skin) {
        Storage.equipSkin(product.grant.skin);
      }
    } else {
      Audio.bomb();
      const text = {
        NOT_ENOUGH_GEMS: '젬이 부족합니다',
        ALREADY_OWNED: '이미 소유한 아이템입니다',
        UNKNOWN_SKU: '상품을 찾을 수 없습니다',
      }[result.error] || '구매 실패';
      this.toast(text, COLORS.red);
    }

    this.refreshBalance();
    this.renderList();
  }

  showOverlay(text) {
    const { width, height } = this.scale;
    const g = this.add.graphics().setDepth(900);
    g.fillStyle(0x000000, 0.6);
    g.fillRect(0, 0, width, height);
    const t = this.add.text(width / 2, height / 2, text, {
      fontSize: '20px', color: '#e8e8f0', align: 'center',
    }).setOrigin(0.5).setDepth(901);

    const c = this.add.container(0, 0, [g, t]);
    return c;
  }

  toast(text, color) {
    const { width, height } = this.scale;
    const t = this.add.text(width / 2, height - 100, text, {
      fontSize: '18px', fontStyle: 'bold',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setDepth(1000);
    this.tweens.add({
      targets: t, y: t.y - 40, alpha: 0,
      duration: 1800, ease: 'Cubic.Out',
      onComplete: () => t.destroy(),
    });
  }
}
