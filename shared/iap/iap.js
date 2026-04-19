// IAP 파사드.
// 게임 코드는 오직 이 파일만 import 해서 호출한다.
// 환경에 맞는 어댑터를 런타임에 선택하고, 나머지는 동일한 인터페이스.

import { MockAdapter } from './adapters/mock-adapter.js';
import { GooglePlayAdapter } from './adapters/google-play.js';
import { AppStoreAdapter } from './adapters/app-store.js';

function detectAdapter() {
  // 실제 출시 빌드에서는 Capacitor/Cordova 환경 감지로 교체:
  //   if (window?.Capacitor?.getPlatform() === 'android') return GooglePlayAdapter;
  //   if (window?.Capacitor?.getPlatform() === 'ios')     return AppStoreAdapter;
  return MockAdapter;
}

let _adapter = null;
let _ready = null;

export const IAP = {
  async ensureReady() {
    if (_ready) return _ready;
    _adapter = detectAdapter();
    _ready = _adapter.init().then(() => _adapter);
    return _ready;
  },

  currentAdapter() {
    return _adapter?.name || 'not-initialized';
  },

  async listProducts() {
    await this.ensureReady();
    return _adapter.listProducts();
  },

  async purchase(sku) {
    await this.ensureReady();
    const result = await _adapter.purchase(sku);
    // 구매 이벤트는 분석 모듈로 흘려보낼 수도 있다
    try {
      const { Analytics } = await import('../analytics.js');
      Analytics.track(result.ok ? 'iap_success' : 'iap_failed', { sku, ...result });
    } catch { /* 선택 모듈 */ }
    return result;
  },

  async restore() {
    await this.ensureReady();
    return _adapter.restore();
  },
};

// 어댑터를 외부에서 강제로 주입하고 싶을 때 (테스트용)
export function __setAdapterForTest(adapter) {
  _adapter = adapter;
  _ready = Promise.resolve(adapter);
}

// 재노출 (상점 UI가 카탈로그·어댑터를 함께 참조)
export { Catalog, findBySku, byTag } from './catalog.js';
export { MockAdapter, GooglePlayAdapter, AppStoreAdapter };
