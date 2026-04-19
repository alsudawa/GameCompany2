// Mock IAP 어댑터.
// 실제 스토어 SDK 없이 결제 플로우를 시뮬레이션한다.
// 800ms 지연 후 성공. 카탈로그의 grant를 Storage에 반영.

import { Storage } from '../../storage.js';
import { findBySku } from '../catalog.js';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function applyGrant(grant) {
  const profile = Storage.load();
  let firstPurchaseBonus = 0;

  if (!profile.firstPurchaseDone && grant.gems) {
    firstPurchaseBonus = grant.gems; // +100% 첫 구매 보너스
  }

  if (grant.gems) {
    Storage.addGems(grant.gems + firstPurchaseBonus);
  }
  if (grant.coins) {
    Storage.addCoins(grant.coins);
  }
  if (grant.skin) {
    Storage.ownSkin(grant.skin);
  }
  if (grant.seasonPassDays) {
    const p = Storage.load();
    const expires = new Date(Date.now() + grant.seasonPassDays * 86400000);
    p.seasonPass = { active: true, expiresISO: expires.toISOString(), claimed: [] };
    Storage.save(p);
  }

  if (!profile.firstPurchaseDone) {
    const p = Storage.load();
    p.firstPurchaseDone = true;
    Storage.save(p);
  }

  return { firstPurchaseBonus };
}

export const MockAdapter = {
  name: 'mock',

  async init() {
    return { ok: true };
  },

  async listProducts() {
    // 실제 SDK에선 스토어에서 최신 가격·로캘을 가져옴
    const { Catalog } = await import('../catalog.js');
    return Catalog;
  },

  async purchase(sku) {
    const product = findBySku(sku);
    if (!product) {
      return { ok: false, error: 'UNKNOWN_SKU' };
    }

    // 젬으로 결제하는 상품(gemCost)은 즉시 차감
    if (product.gemCost) {
      const profile = Storage.load();
      if (profile.gems < product.gemCost) {
        return { ok: false, error: 'NOT_ENOUGH_GEMS' };
      }
      Storage.addGems(-product.gemCost);
    }

    // 영구 상품 중복 구매 차단 (코스메틱)
    if (product.kind === 'nonconsumable' && product.grant.skin) {
      const profile = Storage.load();
      if (profile.ownedSkins.includes(product.grant.skin)) {
        // 젬 차감 되돌리기
        if (product.gemCost) Storage.addGems(product.gemCost);
        return { ok: false, error: 'ALREADY_OWNED' };
      }
    }

    await sleep(800); // 스토어 UI 표시 지연 시뮬레이션

    // 실제 SDK는 여기서 결제창을 띄운다. Mock은 항상 성공.
    const bonus = applyGrant(product.grant);
    return { ok: true, sku, bonus };
  },

  async restore() {
    // 기기 변경 시 구매 복원. Mock은 이미 localStorage에 저장되어 있음.
    return { ok: true, restored: [] };
  },
};
