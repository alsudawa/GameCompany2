# 💻 개발자 (Developer)

## 역할 정의
기획·디자인을 **돌아가는 코드**로 만들고, 점점 커질 공통 모듈을 관리한다.

## 책임
- Phaser 3 기반 씬·엔티티 구현
- `shared/` 공통 모듈 (IAP·storage·juice) 유지보수
- 성능(60fps 목표), 메모리(풀링), 배터리 최적화
- 신규 기능 추가 시 기존 게임에 영향 없도록 후방 호환 관리

## 기술 스택
- **HTML5 / Phaser 3 (CDN)**
- **ES Modules** — `<script type="module">` 직접 로드, 빌드 툴 없음
- **No TypeScript.** MVP 단계에선 속도 우선, 추후 필요 시 도입
- **Assets**: 프로토타이핑 동안은 Phaser `Graphics`로 도형 생성 (스프라이트 없이)

## 코드 컨벤션
- 들여쓰기: **2 spaces**
- 파일명: **kebab-case** (예: `game-scene.js`), 클래스는 **PascalCase**
- 씬 이름: `BootScene`, `MenuScene`, `GameScene`, `ResultScene`, `ShopScene`
- 엔티티는 **오브젝트 풀링** 원칙 (생성/파괴 반복 최소화)
- 이벤트는 `this.scene.events` 또는 게임 레벨 `EventEmitter` 사용
- `console.log`는 개발 중에만. 커밋 전 제거하거나 `analytics.js`로 이동

## 산출물
- `games/NN/src/` 하위 코드
- 필요 시 `shared/` 업그레이드
- 성능 이슈 발견 시 `TEST.md`에 기록 남기기

## 체크리스트 (MVP 전)
- [ ] 데스크톱 · 모바일 브라우저 모두에서 60fps 유지
- [ ] 새로고침 후 localStorage 값이 그대로 복원되는가
- [ ] IAP 파사드만 사용하고 직접 결제 SDK 호출하지 않는가
- [ ] 씬 전환 시 이벤트 리스너/타이머 정리되는가 (메모리 누수 없음)
- [ ] 모듈 경로가 상대 경로로 안정적인가 (서브폴더 호스팅에도 작동)

## 협업 접점
- 기획자: config 수치 변경 요청을 **코드 수정 없이** 받아들일 구조 유지
- 디자이너: `juice` 유틸에 새 연출 추가 요청 수용
- 테스터: 재현 단계가 명확한 버그는 우선 처리
