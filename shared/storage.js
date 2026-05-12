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
  stageStars: {},          // { 'king-shot-gate': 3, ... } 0~3
  upgrades: {},            // { 'kingHp': 2, 'bowDmg': 4, ... } 영구 업그레이드 레벨
  achievements: [],        // ['first_combo_10', ...]
  lastLoginISO: null,
  firstPurchaseDone: false,
  seasonPass: { active: false, expiresISO: null, claimed: [] },
  streakDays: 0,           // 연속 플레이 일수
  lastPlayedDate: null,    // 'YYYY-MM-DD' (마지막 플레이 날짜)
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

  setStars(stageKey, stars) {
    const p = this.load();
    p.stageStars = p.stageStars || {};
    const prev = p.stageStars[stageKey] || 0;
    if (stars > prev) {
      p.stageStars[stageKey] = stars;
      this.save(p);
      return true;
    }
    return false;
  },

  getStars(stageKey) {
    const p = this.load();
    return (p.stageStars || {})[stageKey] || 0;
  },

  getUpgrades() {
    const p = this.load();
    return p.upgrades || {};
  },

  setUpgradeLevel(id, level) {
    const p = this.load();
    p.upgrades = p.upgrades || {};
    p.upgrades[id] = level;
    this.save(p);
  },

  spendCoins(n) {
    const p = this.load();
    if ((p.coins || 0) < n) return false;
    p.coins -= n;
    this.save(p);
    return true;
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

  update(patch) {
    const p = this.load();
    this.save({ ...p, ...patch });
  },

  // 플레이 기록 후 스트릭 갱신. 오늘 첫 플레이면 streak++, 이틀 이상 공백이면 1로 리셋.
  // 반환: { streakDays, isNewDay, bonusCoins }
  recordPlay() {
    const p = this.load();
    const todayStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const last = p.lastPlayedDate;

    if (last === todayStr) {
      return { streakDays: p.streakDays || 1, isNewDay: false, bonusCoins: 0 };
    }

    let newStreak = 1;
    if (last) {
      const lastDate = new Date(last);
      const today = new Date(todayStr);
      const diffDays = Math.round((today - lastDate) / 86400000);
      if (diffDays === 1) newStreak = (p.streakDays || 0) + 1;
    }

    const STREAK_COINS = [0, 10, 25, 50, 100]; // 1일/2일/3일/4일/5일+
    const bonusCoins = STREAK_COINS[Math.min(newStreak - 1, STREAK_COINS.length - 1)];

    p.streakDays = newStreak;
    p.lastPlayedDate = todayStr;
    p.coins = Math.max(0, (p.coins || 0) + bonusCoins);
    this.save(p);
    return { streakDays: newStreak, isNewDay: true, bonusCoins };
  },
};
