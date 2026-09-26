---
status: approved
sources:
  - ../design-system/components.md
  - ../design-system/tokens.md
  - ../design-system/illustration.md#토스페이스-사용-규칙
  - ../design-system/foundation/motion.md#접근성
  - ../design-system/foundation/typography.md#큰-숫자
  - ../adr/ADR-001-fsd-layout-and-tdd-guard.md
  - ../adr/ADR-014-toss-like-depth-and-graphics.md
---

# 화면이 가져다 쓰는 조각을 한 곳에 세운다

## 요구

화면 task 스물이 같은 카드·버튼·줄·시트를 각자 그리면 스무 번 다르게 그려진다. [components.md](../design-system/components.md)가 조각마다 토큰과 값을 이미 정해뒀으니 그 표를 코드 한 벌로 옮기고, 화면은 그 조각을 가져다 짜기만 한다. 화면 파일에서 색·글자·라운딩·그림자를 새로 쓰면 lint가 막는다 — 디자인이 한 곳에서만 바뀌게 하려는 것이다.

랄프 루프(사람 개입 없이 task를 이어 만드는 에이전트 루프)의 첫 대상이다. 조각 하나하나가 작고 완료 조건이 표로 나와 있어 루프가 굴러가는지 보기 좋다. 루프 설계는 이 문서 끝의 [루프](#루프)가 든다.

## 설계 참조

- **조각의 목록과 값** — [components.md](../design-system/components.md)의 절 하나가 조각 하나다. 절 안의 토큰 표와 유틸 표가 곧 구현 명세고, 이 spec은 그 표를 다시 적지 않는다
- **값** — [tokens.md](../design-system/tokens.md). 코드는 `src/app/globals.css`의 유틸(`bg-bg-neutral`·`shadow-card`·`text-4xl`·`rounded-xl`…)만 쓰고 hex나 px를 직접 적지 않는다
- **동작만 가져오는 것** — [components.md 「어디서 오는가」](../design-system/components.md#어디서-오는가)의 표. `@gorhom/bottom-sheet` v5, RN `Modal`, Reanimated, `react-native-safe-area-context`, `lucide-react-native`
- **토스페이스 SVG** — [illustration.md](../design-system/illustration.md#토스페이스-사용-규칙). 파일은 커밋하지 않고 스크립트로 받아 온다
- **글자 배율 상한** — [typography.md](../design-system/foundation/typography.md#큰-숫자)의 `maxFontSizeMultiplier`를 글자 조각 한 곳에서 건다
- **동작 줄이기** — [motion.md](../design-system/foundation/motion.md#접근성). shimmer와 이동 모션이 기기 설정을 한 곳에서 읽는다
- **자리** — [ADR-001](../adr/ADR-001-fsd-layout-and-tdd-guard.md). 조각(`.tsx`)은 `src/shared/ui/`, 순수 계산(하루 띠 비율·미니 달력 줄·동작 줄이기 판정)은 `src/shared/lib/`의 `.ts`와 `__tests__/` 짝 테스트 — `src/shared/ui/`는 훅이 안 보는 자리라 계산을 거기 두면 짝 테스트가 강제되지 않는다. 토스페이스 파일 이름·URL 계산은 `tests/lint/tossface-fetch.ts`에 두고 `scripts/tossface-fetch.mts`가 가져다 쓴다(`font-subset` 관행)
- **조각의 렌더 검증** — `@testing-library/react-native`를 devDependency로 들인다. 조각이 기본으로 넘기는 prop(글자 배율 상한·모션 값)을 렌더 결과로 확인하는 데만 쓴다

## 범위

**만드는 조각** — components.md의 절 전부에서 Map을 뺀 것. 아이콘(감싸는 조각), Button, BottomCTA, 앱바(관리자 스위치·종 아이콘 포함), 탭 바, ListRow(하나 고르는 목록 포함), Card, Skeleton, Avatar, Illustration(3D·토스페이스), Badge, Input, 스위치, Tabs, 세그먼트, 알림 블록, 토스트, Dialog와 바텀시트, 더보기 팝오버, 근무표 날짜 칸, 하루 띠, 차트 넷(추이 그래프·줄 막대·비율 띠·미니 달력), 빈 상태.

**Map은 뺀다.** 네이버 지도 SDK는 네이티브 모듈이라 개발 빌드가 서야 뜬다 — `attendance-checkin`이 세운다.

**3D 파일은 없어도 된다.** Illustration 조각은 장면 이름을 받아 `assets/illustrations/<장면>.webp`를 그리되, 파일이 없으면 같은 크기의 빈 자리를 남긴다. 석 장의 승인은 `illustration-style-guide`가 따로 받는다.

## 완료 조건

### AC-01

- 전제: 저장소를 받아 `pnpm install`을 마쳤다
- 행동: `pnpm tossface:fetch`를 돌린다
- 관찰 결과: [illustration.md 토스페이스 표](../design-system/illustration.md#토스페이스-사용-규칙)의 스무 파일이 `assets/tossface/`에 선다. 고정 커밋 해시에서 받고, 그 디렉터리는 `.gitignore`에 들어 커밋되지 않는다. 라이선스 안내 파일 하나는 같은 디렉터리 옆에 커밋된다
- 검증 층: unit — 스크립트가 표의 코드포인트를 파일 이름으로 바꾸는 계산과 대상 URL 계산
- 근거: [illustration.md](../design-system/illustration.md#토스페이스-사용-규칙)

### AC-02

- 전제: 조각을 다 만들었다
- 행동: 개발 빌드에서 `/_catalog`를 연다
- 관찰 결과: components.md의 절 순서대로 조각이 서고, 절 안의 변형·상태 표 행마다 하나씩 보인다(Button 변형 다섯과 눌림·비활성·스피너, ListRow 오른쪽 값 둘, Skeleton의 shimmer, 토스트 종류…). 라이트·다크가 기기 설정을 따른다. 프로덕션 빌드에서는 이 라우트가 `/`로 돌려보낸다 — Expo Router는 파일이 있으면 경로를 만들므로 화면이 `__DEV__`가 아닐 때 `Redirect`를 그린다. 그 판정 함수는 `src/shared/lib/`에 산다
- 검증 층: 사람이 눈으로 본다 — 실기기·시뮬레이터. 자동 판정은 unit이 라우트 노출 조건(`__DEV__`)만 본다
- 근거: [components.md](../design-system/components.md)

### AC-03

- 전제: `src/screens/**`나 `src/features/**`의 `.tsx`
- 행동: `className`에 `bg-`·`text-`(크기·색)·`font-`·`rounded-`·`shadow-`·`border-` 유틸을 적고 `pnpm lint`를 돌린다
- 관찰 결과: 규칙 하나가 막는다 — 메시지가 어느 조각을 쓰라고 가리키지는 않되 「색·글자·모양은 `src/shared/ui`의 조각이 든다」고 말한다. `flex`·`gap-`·`p-`·`m-`·`w-`·`h-`·`items-`·`justify-` 같은 배치 유틸은 통과한다. `src/shared/ui/**`와 `src/app/_catalog*`는 규칙 밖이다
- 검증 층: unit — eslint 규칙 테스트(막는 예·통과하는 예)
- 근거: [ADR-001](../adr/ADR-001-fsd-layout-and-tdd-guard.md), 이 spec 「요구」

### AC-04

- 전제: 글자를 그리는 조각(`Text`)
- 행동: 기기 글자 배율을 상한 위로 올린다
- 관찰 결과: 모든 글자가 [tokens.md 글자 배율 상한](../design-system/tokens.md#글자-배율-상한)에서 멈춘다. 화면 파일은 `maxFontSizeMultiplier`를 적지 않는다 — 조각 한 곳에서만 건다
- 검증 층: unit — 조각이 상한 prop을 기본으로 넣는지
- 근거: [typography.md](../design-system/foundation/typography.md#큰-숫자)

### AC-05

- 전제: 하루 띠와 미니 달력
- 행동: 출근·퇴근·지금·인증 시각을 넣는다 / 연·월과 근무날 목록을 넣는다
- 관찰 결과: 띠는 채움 비율·인증 눈금 자리를 [dashboard.md 하루 띠](../system/screens/dashboard.md#하루-띠)대로 낸다 — 일찍 찍은 인증은 0퍼센트에 물리고 근무 전은 채움 0이다. 달력은 월요일 시작 다섯 줄이나 여섯 줄을 낸다. 두 계산은 `.ts`에 살고 조각은 그 값을 그리기만 한다
- 검증 층: unit — 계산 함수
- 근거: [dashboard.md](../system/screens/dashboard.md#하루-띠), [components.md 미니 달력](../design-system/components.md#미니-달력)

### AC-06

- 전제: 기기의 「동작 줄이기」가 켜져 있다
- 행동: Skeleton과 토스트와 바텀시트를 띄운다
- 관찰 결과: shimmer가 서지 않고 덩이만 선다. 이동 모션은 빠지고 밝기만 바뀐다. 설정을 읽는 자리는 한 곳(`src/shared/lib/`)이다
- 검증 층: unit — 설정 값에 따라 조각이 넘기는 모션 값
- 근거: [motion.md](../design-system/foundation/motion.md#접근성)

### AC-07

- 전제: 조각 전부
- 행동: `pnpm typecheck`·`pnpm lint`·`pnpm test`
- 관찰 결과: 통과. 조각 파일은 PascalCase, 계산 파일은 kebab-case([CLAUDE.md](../../../CLAUDE.md) 파일 이름 규칙)
- 검증 층: 기존 lint
- 근거: [ADR-001](../adr/ADR-001-fsd-layout-and-tdd-guard.md)

## 상태 격자

조각 모음이라 화면의 여덟 자리는 대부분 조각 자체가 다른 화면에 제공하는 것이다. 이 task에서 뜨는 것은 카탈로그 하나다.

| 자리 | 무엇이 뜨나 | AC |
| --- | --- | --- |
| 빈 상태 | 빈 상태 조각 자체가 여기서 만들어진다 — 카탈로그에 큰 자리·작은 자리·한 문장 셋이 선다. 3D 파일이 없으면 같은 크기의 빈 자리 | AC-02 |
| 로딩 | Skeleton 조각이 여기서 만들어진다 — 카탈로그에 카드 덩이와 큰 숫자 막대가 shimmer와 함께 선다 | AC-02, AC-06 |
| 실패 | 해당 없음 — 카탈로그는 데이터를 안 받는다. 실패를 그리는 조각(알림 블록·토스트)은 카탈로그에 종류마다 선다 | AC-02 |
| 권한 없음 | 카탈로그는 개발 빌드에만 선다. 프로덕션에서는 라우트가 없다 | AC-02 |
| 경계 | 글자 배율이 상한을 넘으면 상한에서 멈춘다. 미니 달력은 여섯 줄 달까지 그린다 | AC-04, AC-05 |
| 재진입 | 해당 없음 — 카탈로그는 상태를 안 가진다 | AC-02 |
| 동시 변경 | 해당 없음 — 서버를 안 만진다 | AC-02 |
| 성공 직후 | 해당 없음 — 보내는 것이 없다. 버튼 스피너가 체크로 끝나는 모션은 카탈로그의 Button 변형 하나로 선다 | AC-02 |

## 범위 밖

- Map — `attendance-checkin`
- 3D 석 장의 승인 — `illustration-style-guide`
- 화면 문서 열여섯을 ADR-014로 맞추는 일 — 각 화면 task

## 미니 달력의 새 값

components.md 미니 달력 표에서 둘을 고친다 — 대시보드 제안 시안 승인(2026-09-26)이 근거다. 칸은 20px 그대로되 **일곱 열이 카드 안쪽 폭을 같은 폭으로 나누고 칸은 열 가운데에 선다**(「칸을 화면 폭에 맞춰 늘리지 않는다」 조항은 칸 크기만 지킨다) **줄 사이는 10px**이다. 이 task가 components.md의 그 두 줄을 같이 고친다.

## 루프

랄프 루프는 task 하나를 이렇게 돈다. 총괄 세션이 돌리고, 사람은 merge와 실기기 확인에만 선다.

1. **고르기** — backlog에서 `ready` 맨 위 행을 잡는다. spec의 `status`가 `approved`가 아니면 그 task는 건너뛰고 handoff에 적는다
2. **계획** — `test-planner`가 spec의 AC를 리스크와 층으로 배정한다
3. **테스트** — 배정된 층의 writer들을 한 번에 띄운다. 실패 확인이 리턴에 없으면 그 writer를 한 번 더 띄운다
4. **구현** — `implementer`가 브랜치를 따고 PR을 연다. 같은 실패 세 번째면 `codex-rescue`
5. **감사** — `pr-diff`가 diff를 읽는다. 삭제·총괄 문서 접촉·시크릿·테스트 없는 구현이 있으면 멈추고 사람을 부른다
6. **merge** — CI 셋(ci·review·secrets)이 통과하면 총괄이 squash merge한다. 「영향 확인」 게이트에 막히면 본문을 고쳐 다시 돌린다 — 두 번째도 막히면 사람을 부른다
7. **기록** — backlog 행을 `done`으로, 다음 `ready`를 풀고, handoff 「다음 작업」을 갱신한다. task 다섯마다 `session-recorder`

**멈추는 조건** — 같은 task에서 5·6이 두 번 사람을 불렀을 때, `ready`가 비었을 때, 실기기 확인이 필요한 AC가 다음 task의 선행일 때. 멈추면 handoff에 어디서 왜 멈췄는지를 적고 끝낸다.

**하지 않는 것** — spec을 루프가 쓰지 않는다. 결정 문서는 총괄이 쓴다. 화면 문서가 디자인 시스템과 어긋나면(ADR-014 이전 서술) 루프는 디자인 시스템을 따르고 어긋난 줄을 리턴에 적는다 — 문서는 총괄이 그 PR에서 같이 고친다.

## 승인 근거

- 승인: 총괄이 세션에 위임한 판정이다 — 「전체 기능 구현해」
- 날짜: 2026-09-27
- 기준점: `885932b` — 이 spec과 `sources`가 든 문서를 그 커밋에서 읽었다
