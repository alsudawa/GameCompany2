// 영구 업그레이드 정의 — 코인 소비 메타.
// 각 트랙은 5레벨, 비용은 누진. effect(level)로 곱/덧 보정값 반환.

export const UPGRADES = [
  {
    id: 'kingHp',
    name: 'IRON HEART',
    desc: '왕 최대 체력 +1 / 레벨',
    icon: '♥', color: 0xc8302d,
    maxLevel: 5,
    cost: l => [120, 280, 600, 1200, 2400][l] ?? 999999,
    effect: l => ({ hpBonus: l }),
  },
  {
    id: 'bowDmg',
    name: 'KEEN ARROWS',
    desc: '활 데미지 +8% / 레벨',
    icon: '⚔', color: 0xff8a3a,
    maxLevel: 5,
    cost: l => [100, 240, 520, 1000, 2000][l] ?? 999999,
    effect: l => ({ dmgMul: 1 + 0.08 * l }),
  },
  {
    id: 'startGold',
    name: 'ROYAL VAULT',
    desc: '시작 코인 +25 / 레벨',
    icon: '⛁', color: 0xf4c542,
    maxLevel: 5,
    cost: l => [80, 200, 440, 900, 1800][l] ?? 999999,
    effect: l => ({ startGold: 25 * l }),
  },
  {
    id: 'magnet',
    name: 'GOLDEN PULL',
    desc: '코인 자석 +12% / 레벨',
    icon: '◉', color: 0xffd24a,
    maxLevel: 5,
    cost: l => [70, 170, 380, 800, 1600][l] ?? 999999,
    effect: l => ({ magnetMul: 1 + 0.12 * l }),
  },
];

// 모든 트랙 효과 합산
export function computeBonuses(profileUpgrades = {}) {
  const merged = { hpBonus: 0, dmgMul: 1, startGold: 0, magnetMul: 1 };
  for (const u of UPGRADES) {
    const lv = profileUpgrades[u.id] ?? 0;
    if (lv <= 0) continue;
    const e = u.effect(lv);
    if (e.hpBonus)  merged.hpBonus  += e.hpBonus;
    if (e.dmgMul)   merged.dmgMul   *= e.dmgMul;
    if (e.startGold) merged.startGold += e.startGold;
    if (e.magnetMul) merged.magnetMul *= e.magnetMul;
  }
  return merged;
}

// 업그레이드 누적 레벨 합 — 적 스케일링 입력
export function totalUpgradeLevels(profileUpgrades = {}) {
  let n = 0;
  for (const u of UPGRADES) n += profileUpgrades[u.id] ?? 0;
  return n;
}

