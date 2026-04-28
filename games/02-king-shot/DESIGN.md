# KING SHOT — 디자인 문서

## 비주얼 디렉션
원작 *King Shot* 의 따뜻한 카툰 판타지 톤을 2D 절차 그래픽으로 재현. 사이버펑크/네온 어휘는 의도적으로 배제.

## 팔레트
```
GROUND_GRASS   #3a7d44   잔디 그린
GROUND_STONE   #6b6e76   돌길/돌담
WOOD_BROWN     #8b5a3c   나무/화살대
WOOD_DARK      #3e2e1e   UI 짙은 갈색
PARCHMENT      #f4e8c8   양피지 카드
GOLD           #f4c542   왕관/코인 (시그니처)
GOLD_DEEP      #c89438   골드 그림자
KNIGHT_BLUE    #3a5a8c   왕의 갑옷
CAPE_RED       #c8302d   망토/하트/적 깃발
SKIN           #e8c8a0   피부
BONE           #e8dcc4   스켈레톤
GOBLIN_GREEN   #5a7a3a   고블린
ORC_RED        #8b3a2e   오크/오우거
WOLF_GRAY      #6b6e76   늑대
GEM_BLUE       #4a8bc2   보석
SPARK_YELLOW   #fff4a0   임팩트 스파크
SMOKE_GRAY     #a89888   처치 시 연기 퍼프
TORCH_ORANGE   #d97b3a   횃불 잉걸
```

## 폰트
- 디스플레이: **Cinzel** 700/900 — 타이틀, 등급, 보스 라벨, 콤보 배너
- 본문: **Rajdhani** 500/700
- 모노/라벨: **JetBrains Mono** 700

Tap Rush와 폰트가 일부 겹치되, Orbitron은 사용 안 함(SF 톤).

## 캐릭터 디자인 원칙
- 위에서 약간 정면 본 가벼운 톱다운 시점. 발은 그림자 타원으로만 표현.
- 모든 캐릭터 외곽에 짙은(보통 어두운 본체색) 윤곽선 1~2px — 카툰 룩 강화.
- 골드와 적색을 시그니처 액센트로 자주 사용(왕관, 코인, 망토, HP 하트, 등급 메달).
- 글로우는 `setBlendMode(ADD)` + 알파 그라디언트 원. 네온 라인 글로우는 안 씀.

## 모션 가이드라인
- 모든 캐릭터 **숨쉬기 펄스**(scale yoyo 1.0↔1.04, 1.2~1.4s)
- 화살 발사 시 활시위 진동(60ms) + 발 살짝 뒤로 밀림(50ms 리코일)
- 적 처치: 회색 연기 3퍼프 + 노란 임팩트 스파크 + 황금 popText
- 코인 획득: 노란 별 4스파크 + score punch
- 콤보 등급 배너: Cinzel 글자 + 양옆 적색 깃발 펄럭(Back.Out 등장)
- 보스 등장: 화면 빨간 비네트 + Cinzel "BOSS" 거대 텍스트 + 카메라 셰이크
- 보스 처치: 슬로모 0.35× 600ms + 골드 플래시 + 황금 비

## UI 어휘
- **양피지 + 우드 + 골드 트림 + 모서리 골드 못** — HUD 패널, 업그레이드 카드, 결과 통계, 버튼 모두 동일 어휘
- **방패 메달** — 결과 등급(상단 아치 + 하단 V), 골드 외곽선, 등급 글자 골드 스트로크
- **두루마리 카드** — 양피지 + 위/아래 살짝 진한 두루마리 끝, 골드 코인에 글리프 글자
- 깃발 펄럭, 골드 디바이더(라인 + 다이아몬드 핀)는 메뉴/배너에 반복 사용

## 스테이지별 분위기
| 스테이지 | 그라운드 | 분위기 입자 | 추가 디테일 |
|---|---|---|---|
| 01 CASTLE GATE | 잔디 그린 | 노란 꽃잎 드리프트 | 풀 줄기 흩어짐 |
| 02 WHISPERING FOREST | 어두운 그린 | 갈색 낙엽 sway | 트리 그림자 코너 |
| 03 MOUNTAIN PASS | 회청 | 흰 눈송이 | 옅은 흰 안개 |
| 04 DRAGON CRYPT | 어두운 보라 | 오렌지 잉걸 상승(ADD) | 횃불 글로우 4곳 |
| 05 ROYAL THRONE | 짙은 적 | 골드 먼지 상승(ADD) | 중앙 적색 카펫 + 골드 트림 |

## 사운드
- 모든 SFX는 `shared/audio.js`의 절차 합성 — `tap`/`combo`/`rare`/`miss`/`fanfare`/`rankup`/`levelUp`/`purchase`
- BGM은 `stage_dawn/pulse/drive/storm/star` 5트랙 매핑 (gate→dawn, forest→pulse, pass→drive, crypt→storm, throne→star). 향후 medieval 팔레트 신곡으로 교체 가능.
- 메뉴 BGM은 공용 `menu` 트랙

## 공유 유틸 사용
- `Juice` — popText, burst, ring, shake, flash, slowmo, spark, punch, countUp (`attachPointerTrail` 미사용 — 네온 잔상)
- `Audio` — unlockOnFirstInput + 위 SFX/BGM
- `Storage` — addGems, addCoins, setBestScore (gameId='king-shot' / per-stage)
- `Analytics` — boot, iap_ready, session_end
- `IAP` — mock 어댑터, BootScene에서 ensureReady만

## 접근성
- 핵심 동작은 한 손가락 드래그 — 다중 터치 불필요
- HP는 하트 아이콘 5개로 시각적 단순화(숫자 보조 미사용)
- 색상 외에도 형태/위치로 구분(적 5종 실루엣 모두 다름)
