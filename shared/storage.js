// 공용 localStorage 래퍼.
// 프로필(재화·설정·업적)을 저장/불러오는 유일한 진입점.
// 모든 게임이 같은 프로필을 공유한다 (추후 Idle Studio 메타 연동 대비).

const KEY = 'gc2:profile';

const DEFAULT_PROFILE = {
  version: 1,
  coins: 0,
  gems: 0,
  ownedSkins: ['default'],
  equippedSkin: 'default',
  bestScores: {},          // { 'tap-rush': 12345, ... }
  achievements: [],        // ['first_combo_10', ...]
  lastLoginISO: null,
  firstPurchaseDone: false,
  seasonPass: { active: false, expiresISO: null, claimed: [] },
};

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function merge(base, patch) {
  return { ...base, ...patch };
}

export const Storage = {
  load() {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_PROFILE };
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? safeParse(raw) : null;
    if (!parsed) return { ...DEFAULT_PROFILE };
    return merge(DEFAULT_PROFILE, parsed);
  },

  save(profile) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
    } catch (err) {
      console.warn('[Storage] save failed', err);
    }
  },

  reset() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
  },

  // --- 편의 메서드 ---
  addCoins(n) {
    const p = this.load();
    p.coins = Math.max(0, (p.coins || 0) + n);
    this.save(p);
    return p.coins;
  },

  addGems(n) {
    const p = this.load();
    p.gems = Math.max(0, (p.gems || 0) + n);
    this.save(p);
    return p.gems;
  },

  setBestScore(gameId, score) {
    const p = this.load();
    const prev = p.bestScores[gameId] || 0;
    if (score > prev) {
      p.bestScores[gameId] = score;
      this.save(p);
      return true;
    }
    return false;
  },

  ownSkin(skinId) {
    const p = this.load();
    if (!p.ownedSkins.includes(skinId)) {
      p.ownedSkins.push(skinId);
      this.save(p);
    }
  },

  equipSkin(skinId) {
    const p = this.load();
    if (p.ownedSkins.includes(skinId)) {
      p.equippedSkin = skinId;
      this.save(p);
      return true;
    }
    return false;
  },
};
