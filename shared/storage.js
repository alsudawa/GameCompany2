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
  // 데일리 스트릭
  streakDays: 0,           // 연속 출석 일수
  lastLoginDate: null,     // 마지막 접속 날짜 (YYYY-MM-DD)
  dailyClaimedDate: null,  // 오늘 보상 수령 날짜
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

  update(patch) {
    const p = this.load();
    this.save({ ...p, ...patch });
  },

  // 데일리 스트릭 체크 — 앱 시작 시 1회 호출.
  // 반환값: { streakDays, gemReward, isNewDay }
  checkDailyStreak() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const p = this.load();
    const last = p.lastLoginDate;

    if (last === today) return { streakDays: p.streakDays, gemReward: 0, isNewDay: false };

    let newStreak;
    if (!last) {
      newStreak = 1;
    } else {
      const diffMs = new Date(today) - new Date(last);
      const diffDays = Math.round(diffMs / 86400000);
      newStreak = diffDays === 1 ? (p.streakDays || 0) + 1 : 1; // 하루라도 빠지면 리셋
    }

    // 연속 일수별 젬 보상: 7일마다 보너스
    const gemReward = newStreak % 7 === 0 ? 15 : 5;
    p.streakDays = newStreak;
    p.lastLoginDate = today;
    p.dailyClaimedDate = today;
    p.gems = Math.max(0, (p.gems || 0) + gemReward);
    this.save(p);

    return { streakDays: newStreak, gemReward, isNewDay: true };
  },
};
