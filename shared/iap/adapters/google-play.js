// Google Play Billing 어댑터 (구조만).
// 실제 연동은 Capacitor 플러그인 또는 네이티브 브릿지 필요.
// 출시 전 이 파일 안의 TODO 지점을 실제 호출로 교체한다.

export const GooglePlayAdapter = {
  name: 'google-play',

  async init() {
    // TODO: Capacitor Google Play Billing 플러그인 초기화
    //   const { CdvPurchase } = window;
    //   await CdvPurchase.store.initialize([{ platform: CdvPurchase.Platform.GOOGLE_PLAY }]);
    throw new Error('[GooglePlayAdapter] 실연동 미구현. MockAdapter를 사용하세요.');
  },

  async listProducts() {
    // TODO: store.products 조회 → 카탈로그 SKU와 머지
    throw new Error('[GooglePlayAdapter] 실연동 미구현');
  },

  async purchase(sku) {
    // TODO:
    //   const offer = store.get(sku).getOffer();
    //   const result = await offer.order();
    //   서버 영수증 검증(Play Developer API) → grant 반영
    throw new Error('[GooglePlayAdapter] 실연동 미구현');
  },

  async restore() {
    // TODO: store.restorePurchases()
    throw new Error('[GooglePlayAdapter] 실연동 미구현');
  },
};
