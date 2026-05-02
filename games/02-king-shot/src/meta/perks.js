// 웨이브 사이 선택 가능한 퍽 카드.
// apply(scene)로 즉시 효과 — 영웅 스탯/지속 모드/일시 효과 모두 다룸.

export const PERKS = [
  {
    id: 'heal',
    icon: '♥', color: 0xc8302d,
    name: 'ROYAL FEAST',
    desc: '체력 +1 (최대치 회복)',
    apply(scene) {
      scene.king.hp = Math.min(scene.king.maxHp, scene.king.hp + 1);
      scene.updateHud();
    },
  },
  {
    id: 'maxhp',
    icon: '♛', color: 0xffd24a,
    name: 'IRON CROWN',
    desc: '최대 체력 +1, 즉시 회복',
    apply(scene) {
      scene.king.maxHp += 1;
      scene.king.hp = scene.king.maxHp;
      scene.updateHud();
    },
  },
  {
    id: 'range',
    icon: '✛', color: 0x8ad04f,
    name: 'EAGLE EYE',
    desc: '활 사정거리 +20%',
    apply(scene) {
      scene.king.weapon.range *= 1.20;
    },
  },
  {
    id: 'damage',
    icon: '⚔', color: 0xff8a3a,
    name: 'SHARP ARROWS',
    desc: '활 데미지 +25%',
    apply(scene) {
      scene.king.weapon.damage = Math.round(scene.king.weapon.damage * 1.25);
    },
  },
  {
    id: 'firerate',
    icon: '➶', color: 0xfff4a0,
    name: 'QUICK DRAW',
    desc: '연사 속도 +25%',
    apply(scene) {
      scene.king.weapon.fireRate *= 0.80;
    },
  },
  {
    id: 'multishot',
    icon: '⫶', color: 0xc89438,
    name: 'TWIN ARROWS',
    desc: '화살 동시 발사 +1',
    apply(scene) {
      scene.king.weapon.multishot += 1;
    },
  },
  {
    id: 'magnet',
    icon: '◉', color: 0xffd24a,
    name: 'GREED',
    desc: '코인/보석 자석 +60%',
    apply(scene) {
      scene.king.magnetRadius = Math.round(scene.king.magnetRadius * 1.6);
    },
  },
  {
    id: 'speed',
    icon: '➤', color: 0x80c8ff,
    name: 'SWIFT BOOTS',
    desc: '이동 속도 +30%',
    apply(scene) {
      scene.king.moveSpeed = Math.round(scene.king.moveSpeed * 1.30);
    },
  },
  {
    id: 'gold_wave',
    icon: '⛁', color: 0xffd24a,
    name: 'GOLDEN HOUR',
    desc: '다음 웨이브 코인 드롭 2배',
    apply(scene) {
      scene._goldRushUntil = (scene.waveIdx ?? -1) + 1;
    },
  },
  {
    id: 'gem_chance',
    icon: '◆', color: 0x80c8ff,
    name: 'LUCKY STAR',
    desc: '보석 확률 영구 +6%',
    apply(scene) {
      scene._gemBonus = (scene._gemBonus ?? 0) + 0.06;
    },
  },
  {
    id: 'volley_cd',
    icon: '⟁', color: 0xff5050,
    name: 'BATTLE FERVOR',
    desc: '로얄 볼리 쿨다운 −30%',
    apply(scene) {
      scene._volleyCooldown = (scene._volleyCooldown ?? 12) * 0.70;
    },
  },
];

export function rollPerks(n = 3) {
  // Fisher-Yates 셔플 후 n개 선택
  const arr = PERKS.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
