// BootScene — 초기 세팅 (에셋 없이 바로 메뉴로 전환).
// 향후 이미지/사운드가 생기면 여기서 preload.

import { Storage } from '../../../../shared/storage.js';
import { IAP } from '../../../../shared/iap/iap.js';
import { Analytics } from '../../../../shared/analytics.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  async create() {
    Analytics.enableDebug(true);
    Analytics.track('boot');

    // 프로필 첫 로드 (없으면 기본값 생성)
    const profile = Storage.load();
    Storage.save(profile);

    // IAP 초기화 (Mock)
    try {
      await IAP.ensureReady();
      Analytics.track('iap_ready', { adapter: IAP.currentAdapter() });
    } catch (e) {
      console.warn('IAP init failed', e);
    }

    this.scene.start('MenuScene');
  }
}
