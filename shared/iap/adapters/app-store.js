// Apple App Store (StoreKit) 어댑터 (구조만).
// iOS 네이티브 빌드 시 StoreKit 2 브릿지를 여기서 호출한다.

export const AppStoreAdapter = {
  name: 'app-store',

  async init() {
    // TODO: StoreKit 2 — Product.products(for: skus) 로드
    throw new Error('[AppStoreAdapter] 실연동 미구현. MockAdapter를 사용하세요.');
  },

  async listProducts() {
    // TODO: 로드된 Product 배열 → 카탈로그 SKU와 머지
    throw new Error('[AppStoreAdapter] 실연동 미구현');
  },

  async purchase(sku) {
    // TODO:
    //   let result = try await product.purchase()
    //   transaction.finish() 후 서버 영수증 검증 → grant 반영
    throw new Error('[AppStoreAdapter] 실연동 미구현');
  },

  async restore() {
    // TODO: AppStore.sync()
    throw new Error('[AppStoreAdapter] 실연동 미구현');
  },
};
