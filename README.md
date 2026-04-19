# GameCompany2 🎮

> 가상의 인디 모바일 게임 스튜디오. 작은 게임부터 시작해 점점 더 재미있는 게임을 만들어갑니다.

## 스튜디오 소개
우리는 4명의 가상 팀원이 역할을 나눠 협업합니다.

| 역할 | 담당 |
|---|---|
| 🎯 **기획자 (Planner)** | 게임성·밸런스·수익 모델 설계 |
| 🎨 **디자이너 (Designer)** | UI/UX·비주얼·애니메이션 가이드 |
| 💻 **개발자 (Developer)** | 실제 구현(Phaser 3, ES Modules) |
| 🧪 **테스터 (Tester)** | QA 시나리오·회귀 체크리스트 |

각 게임 폴더에는 4개 역할의 산출물(`PLAN.md`, `DESIGN.md`, 코드, `TEST.md`)이 함께 존재합니다.

## 현재 포트폴리오

### 01. Tap Rush ⚡ *(MVP 완료)*
1분 타임어택 탭 게임. 떨어지는 오브를 탭해 콤보·점수 쌓기.
- 📂 [`games/01-tap-rush/`](games/01-tap-rush/)
- 🎯 도파민 장치: 콤보 팝업, 파티클, 화면 흔들림, 등급 연출(S/A/B/C)
- 💎 수익: 광고 없음 · 젬 패키지 + 코스메틱 스킨 + 시즌 패스

### 02. Merge Blob 🫧 *(예정)*
### 03. Idle Studio 🏢 *(예정)*

자세한 로드맵은 [`company/roadmap.md`](company/roadmap.md) 참고.

## 실행 방법
```bash
# 저장소 루트에서
python3 -m http.server 8080
# 또는: npx serve .
```
브라우저에서 `http://localhost:8080` 접속 → 런처에서 게임 선택.

모바일 브라우저에서 바로 플레이 가능합니다 (PWA/Capacitor 패키징은 향후 로드맵).

## 기술 스택
- **HTML5 + Phaser 3** (CDN 로드, 빌드 툴체인 없음)
- **ES Modules** 기반 바닐라 자바스크립트
- **localStorage**로 로컬 세이브
- **IAP**: 파사드 + 어댑터 패턴. 기본은 Mock, 실제 Google Play Billing / App Store StoreKit 연동 포인트는 `shared/iap/adapters/` 안에 구조로 표기

## 폴더 구조
```
company/         # 스튜디오 운영 문서 (역할·로드맵)
shared/          # 여러 게임이 재사용할 공통 모듈 (IAP, juice, storage…)
games/NN-name/   # 각 게임 프로젝트 (PLAN/DESIGN/TEST + src)
index.html       # 런처(쇼케이스)
```

## 라이선스
내부 학습·포트폴리오용 프로젝트입니다.
