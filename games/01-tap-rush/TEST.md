# Tap Rush — 테스트 계획 (TEST.md)

> 작성: 🧪 테스터

## Environments (MVP 타겟)
- [ ] Chrome 최신 (데스크톱)
- [ ] Safari iOS (아이폰)
- [ ] Chrome Android
- [ ] Firefox 최신 (회귀 체크)

## Golden Path
- [ ] 게임 로드 시 메뉴가 3초 내 표시
- [ ] START 누르면 3-2-1 카운트다운 후 게임 시작
- [ ] 오브가 위에서 떨어지고, 일반/레어/폭탄이 모두 출현
- [ ] 탭 시 파티클·숫자 팝업이 뜬다
- [ ] 콤보 증가 시 상단 콤보 표시가 갱신된다
- [ ] 60초가 되면 자동 종료되고 결과 화면으로 전환
- [ ] 등급이 점수에 맞게 표시된다 (C/B/A/S)
- [ ] 획득 코인·젬이 프로필에 반영된다
- [ ] [다시] → 즉시 재시작
- [ ] [메뉴] → 메뉴로 복귀
- [ ] 새로고침 후에도 최고 점수·재화 유지

## Edge Cases
- [ ] 탭 없이 60초 대기 → 점수 0, 등급 C
- [ ] 탭 연타(초당 10+) → 크래시 없음, 콤보 누적
- [ ] 폭탄만 탭 → 콤보 즉시 리셋
- [ ] 레어·일반·폭탄이 같은 프레임에 있을 때 원하는 것만 탭
- [ ] 게임 중 탭 전환/백그라운드 → 복귀 시 타이머 이상 없음 (정지 → 재개 또는 일시정지)
- [ ] 회전(세로↔가로) 시 UI 잘림 없음
- [ ] 작은 화면(320×568)에서 HUD와 오브 겹침 없음
- [ ] localStorage 차단/Private 모드 → 저장 실패 경고만, 크래시 없음

## IAP Cases (MockAdapter 기준)
- [ ] Gems Small/Medium/Large 구매 → 해당 젬 수 증가
- [ ] **첫 구매**는 젬 2배 지급, 두 번째 구매부터는 표기된 수량
- [ ] Skin Neon (젬 300) 구매 → 젬 -300, ownedSkins에 `neon` 추가
- [ ] 젬 부족 시 Skin Neon 구매 → "젬 부족" 에러 안내, 젬 차감 없음
- [ ] 이미 소유한 스킨 재구매 시도 → "이미 소유" 안내, 차감 없음
- [ ] Galaxy Skin ($4.99) 구매 → ownedSkins에 `galaxy` 추가
- [ ] Season Pass 구매 → 프로필 `seasonPass.active = true`, `expiresISO`가 30일 후

## Performance
- [ ] 세션 동안 평균 55fps 이상 (Chrome DevTools Performance)
- [ ] 60초 세션 메모리 증가 15MB 이하 (풀링 확인)
- [ ] 저사양 안드로이드 (Chrome, 3년 이상 전 디바이스)에서도 체감 쾌적

## Known Issues
_(플레이테스트 중 발견되면 여기 추가)_

```
### 예시 — [Low] 결과 화면 복귀 시 팝업 텍스트 잔상
- 재현: 1) 세션 종료 2) [다시] 3) 다시 세션 종료
- 기대: 이전 세션의 팝업이 사라져 있어야 함
- 실제: 드물게 팝업 텍스트 오브젝트가 남음
- 환경: Chrome 124 / MacBook Air
```

## 회귀 테스트 정책
- `shared/iap/` 또는 `shared/storage.js` 변경 시 **IAP Cases 전체 재실행**
- 신규 오브 타입 추가 시 Golden Path + Edge Cases 전체 재실행
