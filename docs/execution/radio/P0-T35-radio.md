# P0-T35 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-04
- 개발 설계 승인: user, 2026-08-06 (revision 2 재승인)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-06 | 최초 작성. 설계 인터뷰 확정: entities 4슬라이스(schedule·attendance·pay·notification), 목은 entities 옆 + route 주입, 전체 탭은 최소 진입판, 상태 확인은 dev 시나리오 전환 페이지. |
| 2 | 2026-08-06 | 교차 검증 후 수정 라운드를 위해 재승인했다(사용자 결정 2건). ① Tailwind 소스 스캔을 `src/`로 한정하는 `@source` 변경을 범위에 편입하고 허용 경로에 `src/app/globals.css`를 추가했다 — Tailwind가 문서 파일 안 문자열을 클래스로 오인해 dev 서버가 전 라우트 500이며, 교차 검증 F-01(preview 렌더 실패) 수정의 dev 검증이 이 해소에 의존한다. 이에 따라 불변 규칙의 globals.css 변경 금지를 '스캔 한정 변경만 허용'으로 완화했다. ② 목 주입 계약 문구를 구현 현실에 맞게 정정했다(F-09 좁힘 반영): 원자 도메인 fixture는 entities가 소유하고, 화면 조합 목은 view의 ui 세그먼트가 소유하며, route는 조합 목 import 한 줄만 갖는다 — view prop 타입이 ui 세그먼트에 있어 entities가 화면 조합을 소유하면 레이어 방향이 역행하기 때문이다. |

- 관련 spec: DOCS:SDD, PRD:AC-12, PRD:INV-PAY-01, PRD:INV-ATT-01, DOMAIN:SCHEDULING
- 적용 깊이: 일반 (목 기반 정적 화면·타입 정의. DB·서버 호출·권한·비밀값·캐시 경로 없음)
- test mode: tdd (index 등록 그대로)
- 예정 check IDs: worker-screen-test, mock-type-test, typecheck (index 등록 그대로)

## Requirements

### 범위와 비목표

- 범위: ① [DOMAIN](../../product/DOMAIN.md)의 집합·DTO를 `src/entities/*/model` 타입으로 정의(4슬라이스 — 사용자 결정) ② 같은 슬라이스에 목 fixture와 시나리오 작성 ③ [WORKER-FLOWS](../../product/design/WORKER-FLOWS.md)의 근무자 핵심 화면 6종을 목 props로 정적 구현: 앱 셸과 홈(우선순위 5종·출퇴근 GPS 상태 포함), 일정 달력, 확정 스케줄 상세, 예상 급여와 리허설, 알림함 ④ 전체 탭 최소 진입판(사용자 결정) ⑤ dev 전용 시나리오 전환 페이지(사용자 결정) ⑥ 임시 부트스트랩 화면 제거와 e2e 교체 ⑦ Tailwind 소스 스캔을 `src/`로 한정하는 `@source` 변경 — 문서 파일 안 문자열의 클래스 오인으로 깨진 dev 서버 복구(revision 2, 사용자 결정).
- 비목표(기획 승인 그대로): 로그인·가입·승인 대기·휴면·근무 변경 요청 제출·전체 메뉴 정식판·탈퇴 화면, 서버 연동, 실제 GPS·QR 인증, 푸시 권한 요청, 관리자 화면.
- 설계 비목표: TanStack Query·서버 상태 관리 도입(기능 구현 라운드 소유), `src/shared/ui` 컴포넌트 수정(부족·결함 발견 시 ask로 반환).

### 불변 규칙

- 화면은 서버를 호출하지 않는다 — `@/shared/api`·supabase·`fetch` 접근 없음. 목 주입은 `src/app` route의 import 한 줄이며, 기능 구현 때 그 한 줄만 실조회로 바뀐다.
- 목 타입은 DOMAIN의 공통 언어(용어표)와 이름·구조가 일치한다. DOMAIN에 없는 개념을 목이 만들어내지 않는다.
- 배정표 DTO는 다른 근무자의 전화번호·성별·시급·출결 필드를 **타입 수준에서 정의하지 않는다** — 노출 금지를 렌더가 아니라 데이터 형태로 차단한다.
- 출퇴근 원본의 수정·삭제 UI를 만들지 않는다(`PRD:INV-ATT-01`). 예상 급여는 `예상` 표시와 실제 지급액 차이 안내를 항상 동반한다(`PRD:INV-PAY-01`). 교육생은 `교육` badge로 구분한다.
- P0-T34의 의미 토큰·`typo-*`·공용 컴포넌트만 사용한다. 원시 색·임의 색상값 금지는 기존 lint(`project/design-token-colors`)가 강제한다.
- `src/app/catalog/**`·`src/app/manifest.ts`·토큰·폰트 구성은 변경하지 않는다(허용 경로 안이지만 이 task의 대상이 아니다). `globals.css`는 Tailwind 소스 스캔 한정(`@source`) 변경만 허용한다 — 토큰·타이포·모션 정의는 건드리지 않는다(revision 2).
- dev 시나리오 페이지는 P0-T34의 `page.dev.tsx` 패턴을 재사용하며 프로덕션 라우트에 존재하지 않는다.

### 기술 인수 조건

- `src/entities/{schedule,attendance,pay,notification}/model`이 화면 6종이 소비하는 DTO 타입과 목 시나리오를 소유하고, model 단위 테스트가 목의 제품 불변 규칙(배정표 개인정보 필드 부재, 교육생 구분 플래그, 예상 급여의 예정 시간 기반 입력, 알림 오늘·이번 주·이전 그룹 소스)을 단언한다(`mock-type-test`).
- 화면 6종이 모바일 뷰포트에서 렌더되고, 각 화면의 주요 상태가 목 시나리오로 재현된다: 홈 우선순위 5종, 출퇴근 GPS 확인 중·성공·실패 3종(권한 꺼짐·정확도 낮음·범위 밖), 달력 상태 6종, 빈·오류·로딩.
- 화면 단위 렌더 테스트(`worker-screen-test`)가 표시 요구를 단언한다: 예상 급여의 `예상` 문구와 차이 안내, 출퇴근 수정 UI 부재, 배정표의 이름·포지션만 노출과 본인 행 강조, 교육생 badge, 알림함 그룹 구획, 하단 변경 개수와 저장 후 Undo 스낵바.
- 하단 탭 4종(홈·일정·알림·전체)이 전 탭 화면에서 동작하고, 전체 탭은 예상 급여 진입 항목 하나를 가진 최소판이다. 확정 상세는 탭을 숨기고 상단 뒤로가기를 쓴다.
- dev 서버의 시나리오 페이지에서 화면×시나리오 조합을 골라 확인할 수 있고, production 빌드 라우트에 해당 경로가 없다(handoff 재현 기록).
- 임시 부트스트랩 화면이 홈으로 대체되고 e2e가 새 홈 기준으로 통과한다.
- 화면·엔티티 코드에 서버 접근 import가 없음을 재현 확인한다(handoff 기록).
- `pnpm verify` 전체 통과.

### 위험 기반 테스트

| 위험 | 검증 |
| --- | --- |
| 목 타입이 DOMAIN과 어긋나 기능 구현 때 화면을 다시 짜게 됨 | model 테스트가 DOMAIN 용어표의 필드·상태 이름을 단언 + 교차 검증에서 DOMAIN 대조 |
| 배정표에 개인정보가 새어 들어감 | DTO에 필드 자체가 없음(typecheck) + 렌더 테스트의 미노출 단언 |
| 예상 급여가 정산처럼 보임 | `예상` 문구·차이 안내 렌더 단언, `급여`·`정산` 단어 미사용을 테스트로 고정 |
| 상태 조합 누락(홈 5종·GPS 3실패) | 시나리오 fixture를 상태당 1개 이상 두고 렌더 테스트가 시나리오를 순회 |
| 서버 호출이 몰래 들어옴 | ui 세그먼트의 `**/api/**` 금지 lint + grep 재현 기록 |
| 시나리오 페이지가 프로덕션에 새어 들어감 | production 빌드 라우트 목록 재현을 handoff에 기록 |
| 부트스트랩 제거로 기존 e2e·서버 경계 검사가 깨짐 | e2e를 홈 기준으로 교체하고 `check:app-build` 통과 확인 |

### DEV-* 적용 상태

- `DEV-ARCH-01`·`DEV-ARCH-02`: route는 얇은 어댑터(목 import + view 조립)만 갖고, view·widget은 표시와 이벤트 전달만 한다.
- `DEV-ARCH-04`: entities는 도메인 모델·DTO·순수 규칙만 소유한다. mutation·command는 이번 범위에 없다.
- `DEV-NAME-02`·`DEV-NAME-03`: view·widget 컴포넌트는 PascalCase 파일명과 주 export 일치. entities model 파일은 kebab-case.
- `DEV-TOKEN-01`·`DEV-NAME-06`·`DEV-TEST-06`·`DEV-CODE-07`: 기존 lint·가드가 그대로 강제한다.
- `DEV-SSOT-01`: 목 시나리오는 entities가 단일 출처로 소유하고 화면·시나리오 페이지가 공유한다.

## Architecture

- `src/entities/` 4슬라이스(신규). 각 슬라이스는 `model` 세그먼트만 갖는다:
  - `schedule/model`: `work-schedule.ts`(모집 상태·마감), `application.ts`(신청), `assignment.ts`(배정·담당 포지션·교육생 구분·본인 여부), `confirmation.ts`(확정 revision·예정 시간·예식 시간), 시나리오 fixture.
  - `attendance/model`: `attendance-status.ts`(출근·퇴근 가능 상태, GPS 확인 중·성공·실패 3종의 유니언), fixture.
  - `pay/model`: `estimated-pay.ts`(월 합계·일반·리허설·날짜별 내역), `rehearsal-entry.ts`, fixture.
  - `notification/model`: `notification-item.ts`(제목·내용·상대 시각·읽음·이동 대상), 그룹(오늘·이번 주·이전) 파생 규칙, fixture.
  - 타입 이름은 DOMAIN 용어표의 코드 용어를 따른다. fixture는 `*.mock.ts`로 타입 옆에 둔다.
- `src/widgets/app-shell/`(신규): 하단 탭바(홈·일정·알림·전체, 아이콘+텍스트, 선택 탭 action, 읽지 않음 점). `PATTERNS` 앱 셸 규칙을 따른다.
- `src/views/` 6슬라이스(신규) + 제거 1: `home`(우선순위 5종 + 출퇴근 영역 — 출퇴근은 별도 route가 아니라 홈 메인 영역의 상태 변형, WORKER-FLOWS in-place 흐름), `schedule`(월 달력 + 로컬 선택 + 하단 신청하기 + Undo 스낵바), `schedule-detail`(날짜·예정 출퇴근→내 배정→배정표(기본 펼침·본인 강조)→예식 시간→변경 요청 진입점 — 진입점은 비활성 자리표시), `pay`(합계·숨김 토글·차이 안내·내역·리허설 목록과 추가·수정 바텀시트), `notifications`(그룹 구획·모두 읽음·탭 이동), `more`(예상 급여 진입 최소판). `views/bootstrap`은 제거한다.
- `src/app/` 라우팅: `(tabs)` route group에 `/`(홈)·`/schedule`·`/notifications`·`/more`·`/pay`(1차 목록 성격이라 탭 유지)와 그룹 layout(앱 셸 widget 조립). `/schedule/[id]`는 그룹 밖(탭 없음·뒤로가기). 각 route는 entities 목을 import해 view에 props로 넘기는 얇은 어댑터다.
- dev 시나리오 페이지: `src/app/preview/page.dev.tsx` + `src/views/preview/`. 화면×시나리오 선택 UI로 각 view를 해당 fixture로 렌더한다. `pageExtensions` 분기와 `page.dev.tsx` 면제는 P0-T34 구성 그대로 재사용한다(설정 변경 없음).
- e2e: `tests/e2e/bootstrap.spec.ts`를 홈 기준 spec으로 교체(모바일 뷰포트 렌더·탭 4종 존재).
- 신규 의존성 없음. 아이콘은 lucide-react, 날짜 표기는 date-fns(기존 도입분)를 쓴다.

## Data model

시나리오 fixture 최소 구성(상태당 1개 이상, entities 소유):

| 화면 | 시나리오 |
| --- | --- |
| 홈 | 출근 가능 · 퇴근 가능 · 마감 임박 신청 · 확정 변경 확인 · 다음 근무 · 빈 상태 · GPS 확인 중 · GPS 실패 3종 |
| 일정 | 모집 혼합 월(달력 상태 6종 전부 포함) · 빈 월 · 저장 직후(Undo) |
| 확정 상세 | 일반 확정 · 변경 있음 · 교육생 포함 배정표 |
| 예상 급여 | 내역 있음 · 빈 달 · 금액 숨김 · 리허설 포함 |
| 알림함 | 3그룹 혼합 · 빈 상태 · 전체 읽음 |
| 공통 | 로딩 · 오류 |

- 배정표 행 DTO: `{ name, positions[], isTrainee, isMe }` — 전화번호·성별·시급·출결 필드는 존재하지 않는다.
- 홈 우선순위는 fixture가 단일 항목을 지정하는 것이 아니라, 목 상태에서 우선순위 규칙(위 5종 순서)으로 파생하는 순수 함수로 둔다 — 기능 구현 때 그대로 재사용한다.

## Interface

- view 컴포넌트는 `<ScreenName>View` 명명으로 props에 DTO만 받는다. 이벤트(신청하기·Undo·탭 이동 등)는 콜백 props이고 이번 라운드에서는 로컬 상태 변경만 한다.
- 목 주입 계약(revision 2 정정): 원자 도메인 fixture는 `entities/*/model/*.mock`이 소유하고, 여러 원자를 화면 형태로 조합한 시나리오 목은 해당 view의 `ui` 세그먼트(`*.mock.ts`)가 소유한다. route 파일은 조합 목 import 한 줄과 view 전달 외의 로직을 갖지 않는다 — 기능 구현 때 이 한 줄이 실조회로 바뀐다.
- 시나리오 페이지는 fixture 모듈을 열거해 선택 UI를 만든다 — 시나리오 목록의 정본은 entities fixture이며 페이지는 별도 목록을 만들지 않는다.

## Optimizations

- 서버·데이터 계층이 없어 번들 외 추가 비용이 없다. 시나리오 페이지는 프로덕션 라우트에서 제외된다.
- 달력은 P0-T34 Calendar를 그대로 소비한다 — 이번 라운드 최적화 없음.

## 변경 허용 경로

```
src/app/globals.css
src/app/**
src/views/**
src/widgets/app-shell/**
src/entities/**
tests/e2e/**
docs/execution/radio/P0-T35-radio.md
docs/execution/runs/P0-T35/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- `근무 변경 요청` 진입점은 자리만 두고 흐름은 다음 퍼블리싱 라운드가 소유한다 — 결정 주체: 해당 task 기획, 반환할 단계: 다음 라운드.
- 전체 메뉴 정식판(프로필·설정·문의·탈퇴 배치)은 후속 퍼블리싱 task 소유다 — 최소 진입판은 그 범위를 침범하지 않는다.
- 금액 숨김 토글의 기기 로컬 유지(localStorage)는 서버 없는 이번 라운드에서 화면 상태로만 두고, 영속 여부는 기능 구현 라운드에서 `DEV-OFFLINE` 규칙과 함께 결정한다 — 결정 주체: 해당 task 설계.
- 화면 조립 중 `shared/ui` 컴포넌트의 부족·결함 발견 시 ask로 반환한다(이 RADIO는 shared/ui를 봉인 경로에 넣지 않았다).
