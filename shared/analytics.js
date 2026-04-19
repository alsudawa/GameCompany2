// 분석 이벤트 스텁.
// 실제 서비스에서는 Amplitude / GA4 / Mixpanel 로 교체.
// MVP에서는 콘솔로 남기고, 최근 200개는 메모리에 유지해 상점 UI에서 확인용으로 노출 가능.

const buffer = [];
const MAX = 200;
let debug = false;

export const Analytics = {
  enableDebug(on = true) { debug = !!on; },

  track(event, payload = {}) {
    const entry = {
      event,
      payload,
      at: new Date().toISOString(),
    };
    buffer.push(entry);
    if (buffer.length > MAX) buffer.shift();
    if (debug) {
      // 콘솔 필터링 쉽게 prefix
      console.log(`[analytics] ${event}`, payload);
    }
  },

  recent(limit = 50) {
    return buffer.slice(-limit);
  },
};
