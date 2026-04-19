// IAP 상품 카탈로그.
// sku: 스토어에 등록될 실제 상품 ID(구조만 — 실제 등록은 출시 시점)
// kind: 'consumable' | 'nonconsumable' | 'subscription'
// grant: 구매 성공 시 지급할 내용(어댑터가 Storage를 통해 반영)

export const Catalog = [
  {
    sku: 'gc2_gems_small',
    kind: 'consumable',
    title: '젬 100개',
    description: '보너스 없음',
    priceDisplay: '$0.99',
    priceUSD: 0.99,
    grant: { gems: 100 },
    tag: 'gems',
  },
  {
    sku: 'gc2_gems_medium',
    kind: 'consumable',
    title: '젬 550개',
    description: '10% 보너스',
    priceDisplay: '$4.99',
    priceUSD: 4.99,
    grant: { gems: 550 },
    tag: 'gems',
    highlight: true,
  },
  {
    sku: 'gc2_gems_large',
    kind: 'consumable',
    title: '젬 1200개',
    description: '20% 보너스',
    priceDisplay: '$9.99',
    priceUSD: 9.99,
    grant: { gems: 1200 },
    tag: 'gems',
  },
  {
    sku: 'gc2_skin_neon',
    kind: 'nonconsumable',
    title: '네온 스킨',
    description: '탭 이펙트를 네온으로',
    priceDisplay: '💎 300',
    gemCost: 300,
    grant: { skin: 'neon' },
    tag: 'cosmetic',
  },
  {
    sku: 'gc2_skin_galaxy',
    kind: 'nonconsumable',
    title: '갤럭시 스킨 (프리미엄)',
    description: '은하 파티클 연출',
    priceDisplay: '$4.99',
    priceUSD: 4.99,
    grant: { skin: 'galaxy' },
    tag: 'cosmetic',
    highlight: true,
  },
  {
    sku: 'gc2_season_pass',
    kind: 'subscription',
    title: '시즌 패스 (30일)',
    description: '매일 젬·스킨 조각',
    priceDisplay: '$2.99',
    priceUSD: 2.99,
    grant: { seasonPassDays: 30 },
    tag: 'pass',
  },
];

export function findBySku(sku) {
  return Catalog.find(p => p.sku === sku) || null;
}

export function byTag(tag) {
  return Catalog.filter(p => p.tag === tag);
}
