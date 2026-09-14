---
status: accepted
---

# SDLC를 유지하며 설계의 분산과 단계 간 불일치를 줄인다

## 결정 기록

2026-09-14에 전부 채택했다. 부분 채택이나 보류 항목은 없다. 근거는 [ADR-009](../2-design/adr/ADR-009-design-modules-and-stage-links.md), 실행은 [plan](../3-build/plans/docs-sdlc-coherence.md)이다. 채택하며 정한 것 둘 — 연락처 수정은 `profile_private` 직접 갱신(api 문장이 정본), 통신 지연은 누른 시각과 닿은 시각의 비교(domain 문장이 정본, `received_at`을 더한다) — 는 plan의 「채택하며 정한 것」에 있다. 채택 조건 하나는 옮기되 바꿔 쓰지 않는 것이다. 그 둘 밖의 정본 문장은 자리만 옮긴다.

2026-09-15에 실행을 마쳤다. [plan](../3-build/plans/docs-sdlc-coherence.md)의 완료 기준 다섯이 전부 섰고 위 「완료 기준」 항목도 전부 섰다. 묶음 A~C는 #335·#336·#337·#339가 날랐고, D~F는 [docs-authoring-playbook plan](../3-build/plans/docs-authoring-playbook.md)이 #338·#340·#341·#342·#343·#344·#345·#346·#347·#348·#349·#350·#351·#352·#353·#354·#355와 #356로 이어 날랐다.

---

2026-09-14, `cd103dc` 기준 제안이다. 사용자 제약은 **SDLC 유지**이며, 그 안의 하위 구조는 변경할 수 있다. `1-plan`부터 `6-maintain`까지의 단계, 기능별 intent→spec→plan, spec 승인과 TDD 절차를 유지한다. 하위 폴더·파일명·본문 형식·기존 문서의 목적지는 아래 안으로 제안한다. 이 문서는 구조 검토안이며 실제 문서 이동이나 정책 변경을 승인한 기록은 아니다.

## 추천

**최상위는 SDLC 단계, 설계 단계 내부는 업무 영역, 단계 사이는 같은 작업 ID와 명시적인 참조로 연결한다.** 계정의 규칙·데이터·API·실행 동작·화면을 `2-design` 안에서 가까이 모으고, 기획·명세·구현 계획·검증의 책임을 분명히 한다.

개편의 핵심은 세 가지다.

1. `2-design`의 같은 업무에 속한 설계를 모아 함께 읽고 고친다.
2. 단계별 산출물은 자기 결정만 기록하고 입력 문서를 참조한다.
3. 기준 변경 시 관련 설계·명세·계획·테스트의 영향 확인을 같은 작업에 포함한다.

## 문제와 대안

현재 [system/architecture.md](../2-design/system/architecture.md)는 관심사를 폴더로, 도메인을 파일로 나눈다. 같은 계정의 규칙·데이터·API·실행 동작·화면 흐름이 다섯 곳으로 갈라지고 화면 문서는 다시 별도다.

[설계 안내](../2-design/README.md)는 분야별 기준을 정했지만, [연락처 수정 API](../2-design/modules/account/design.md#행위별-구현-계약)와 [런타임 설명](../2-design/modules/account/design.md#프로필-제출연락처사진)은 직접 갱신과 `submit_profile` 호출로 어긋난다. [출근 규칙](../2-design/modules/attendance/README.md#att-017)과 [출근 런타임](../2-design/modules/attendance/design.md#출근-인증)은 통신 지연의 계산 기준도 다르다. 함께 바뀌는 설계의 위치와 변경 절차를 모두 고칠 필요가 있다.

| 안 | 장점 | 비용과 한계 | 판단 |
| --- | --- | --- | --- |
| 현행 구조에 링크와 영향 검토만 보강 | 이동이 작다 | 같은 업무의 설계가 여러 갈래에 남는다 | 작은 개편의 대안 |
| SDLC 유지 + 2-design 내부를 업무별로 통합 | 단계 책임을 보존하며 설계 변경의 범위를 모은다 | 설계·시안 경로와 참조 도구를 이관해야 한다 | 추천 |
| 단계 내부의 설계를 거대한 파일 하나로 통합 | 처음 읽을 때 파일 이동이 적다 | 상세 화면과 공통 기준이 섞이고 변경 충돌이 커진다 | 추천하지 않음 |

## 목표 구조

아래는 이 제안에서 선택한 최종 배치다. `<task>`는 작업 슬러그, `<release>`는 릴리스 식별자, `<date>-<incident>`는 발생일과 사건 이름이다. 이름이 적힌 업무 영역 여섯과 화면의 소유 위치는 고정한다. 검증·배포·장애의 개별 기록은 실제 사건이 있을 때만 만든다. 배포 플랫폼 같은 미정 내용은 첫 출시 준비 작업이 채우며, 빈 내용을 임의로 확정하지 않는다.

```text
docs/
  README.md                       SDLC 지도, 기준의 소유권, 단계 간 참조 규칙
  backlog.md                      작업 ID·상태·우선순위·선행 작업·산출물 링크
  handoff.md                      다음 작업 링크와 회차에만 필요한 재개 정보
  proposals/
    README.md                    제안 작성 기준·상태·목록
    <proposal>.md                단계에 걸친 방향 검토
  observations/
    README.md                    마찰 기록·집계 규칙
    <number>-<slug>.md           열린 마찰 기록
    archive/                    해결하거나 기각한 마찰 기록
  log/<date>[-<sequence>].md     회차의 판단 근거
  CHANGELOG.md                    날짜별 변경 기록

  1-plan/
    README.md
    prd.md                       제품 목적·대상·범위
    roadmap.md                   릴리스 구성과 순서
    scenarios.md                 사용자 장면
    metrics.md                   성공 지표
    intent/<task>.md             이번에 해결할 사용자 문제

  2-design/
    README.md                    설계 전체의 지도와 공통 기준 적용 규칙
    system/
      architecture.md            시스템 구성·책임·업무 영역 사이의 관계
      data-access.md             공통 스키마·권한·접근 경로·API·에러 계약
      runtime.md                 캐시·오프라인·시각·경쟁·로딩·재시도 원칙
      navigation.md              앱 진입·역할별 경로·공통 탐색
      screens/
        dashboard.md
        dashboard.sian.html
        approvals.md
        approvals.sian.html
        stats.md
        stats.sian.html
    modules/
      README.md                  업무 영역 지도와 영역 사이의 책임
      account/
        README.md                계정의 용어·업무 규칙·상태·판정 예시
        design.md                계정의 데이터·API·실행 동작
        screens/
          login.md
          login.sian.html
          profile.md
          profile.sian.html
          members-pending.md
          members-pending.sian.html
          members.md
          members.sian.html
      schedule/
        README.md
        design.md
        screens/
          schedule-worker.md
          schedule-worker.sian.html
          schedule-admin.md
          schedule-admin.sian.html
      attendance/
        README.md
        design.md
        screens/
          check-in.md
          check-in.sian.html
          excuse.md
          excuse.sian.html
          qr.md
          qr.sian.html
      payroll/
        README.md
        design.md
        screens/
          payroll.md
          payroll.sian.html
          wages.md
          wages.sian.html
      swap/
        README.md
        design.md
      notification/
        README.md
        design.md
    design-system/
      README.md                  공통 시각 기준의 지도
      tokens.md                  기존 토큰 원천 유지
      foundation/
        color.md
        typography.md
        spacing-shape.md
        motion.md
      components.md
      writing.md
    spec/<task>.md               이번 작업의 요구·설계 참조·완료 조건·승인
    adr/ADR-<number>-<slug>.md    중요한 선택의 이유

  3-build/
    README.md
    plans/<task>.md              파일·순서·리스크·검증 방법

  4-test/
    README.md                    검증 단계의 지도와 완료 기준
    strategy.md                  테스트 층 배정 기준
    execution.md                 실행 명령·환경·훅·문서 검사·문제 해결
    evidence/<task>.md           CI 밖의 수동·실기기 검증 기록

  5-deploy/
    README.md                    배포 문서 지도와 출시 진입 조건
    environments.md              환경별 구성·설정 이름·설정 위치
    procedure.md                 배포·확인·되돌리기의 반복 가능한 절차
    releases/<release>.md        출시할 작업과 해당 검증·배포 결과의 링크

  6-maintain/
    README.md                    운영 문서 지도와 대응 책임
    monitoring.md                상태·로그·장애 신호를 확인하는 위치와 방법
    response.md                  분류·담당·완화·복구 확인 절차
    metrics.md                   제품 지표의 수집·집계·측정 방법
    incidents/<date>-<incident>.md  개별 장애의 사실·대응·후속 작업
```

문서 지도는 `docs/README.md`로 모은다. 루트 README와 CLAUDE는 이 입구를 링크한다. 각 단계 README는 자기 단계의 역할과 산출물 작성 기준을 소유한다. 전역 문서 지도를 여러 파일에서 따로 유지하지 않는다.

각 단계 README의 절은 「역할 / 문서 지도 / 입력과 산출물 / 다음 단계로 넘기는 조건」으로 통일한다. 하위 폴더마다 안내만 하는 README를 추가하지 않는다. `modules/README.md`는 영역 사이의 책임, `modules/<영역>/README.md`는 해당 영역의 업무 계약이라는 실제 내용을 가진다.

업무별 폴더는 2-design에만 둔다. intent·spec·plans는 작업 ID로 찾는 평면 목록을 유지한다. 단계마다 account·schedule 폴더를 반복 생성하지 않는다. 배포와 장애 기록은 작업 ID와 구별되는 릴리스·사건 단위로 묶고 관련 작업을 링크한다.

## 공통 설계 네 파일의 책임

| 파일 | 여기에서 결정할 내용 | 다른 곳으로 보내는 내용 |
| --- | --- | --- |
| system/architecture.md | 브라우저·Next·Supabase·Edge Function의 역할, 업무 영역 관계, 시스템 전체 데이터 흐름 | 테이블 상세는 영역 design, 코드 작성 절차는 3-build |
| system/data-access.md | 공유 halls 데이터, 컬럼·키 규약, 공통 RLS, DAL·auth 호출 경계, 읽기·쓰기 계약, 타입 생성, 에러 형태, 서비스 키 사용 범위 | 업무별 필드·함수·권한은 영역 design, 캐시는 runtime |
| system/runtime.md | 캐시 계층, 오프라인, 서버 시각과 보정, 경쟁 처리, 낙관적 처리, 로딩, 재시도 기본값, 업무 상수의 코드 원천 | 영역별 캐시 키·무효화·재시도 예외는 영역 design |
| system/navigation.md | 전역 경로 목록, 역할별 진입, 탭·화면·시트의 탐색 규칙, 뒤로 가기, 딥링크 진입 공통 처리 | 특정 버튼을 누른 뒤의 흐름은 화면 문서, 알림 종류별 목적지는 notification/design |

공통 무효화 표와 영역별 무효화 표를 둘 다 유지하지 않는다. runtime은 공통 원칙을, 각 design은 자기 캐시 키와 갱신 조건을 소유한다. system 문서가 영역 상세를 요약할 때는 원문 링크와 관계만 적는다.

## 2-design 안에서 합칠 것

**업무 규칙은 modules/영역/README.md다.** 현재 domain 문서의 용어·규칙·상태 전이·예외·판정 예시를 옮긴다. 다른 영역이 기대할 수 있는 사실과 책임도 적는다. 테이블·캐시 키는 design이 맡는다.

**기술 설계는 modules/영역/design.md다.** 현재 data-model·api·runtime의 같은 영역 파일을 통합한다. 연락처 수정 하나의 저장 대상, 호출 방법, 권한, 실패, 캐시 처리를 가까이 적는다. 실제 스키마와 타입은 마이그레이션과 생성 타입을 기준으로 삼고, 문서는 업무 규칙의 실현 방식과 선택 근거를 설명한다.

**화면별 흐름은 해당 화면 문서에 합친다.** 진입·입력·성공·실패·다음 목적지와 짜임·문안·모션을 함께 읽게 한다. 기존 flows 파일의 화면별 내용은 옮긴 뒤 중복을 없앤다. 전역 라우트와 접근 조건은 system/navigation을 참조한다. 상세 기술의 파일을 다시 쪼갤 필요가 생기면 독립적으로 변경되는 내용에 한해 분리한다.

**공통 기술과 시각 기준은 2-design 안에 유지한다.** system은 전체 시스템의 원칙, design-system은 토큰·컴포넌트·문안 기준을 맡는다. 영역 문서는 공통 기준을 참조하고 구체적인 적용만 적는다. 예외를 허용할 때는 공통 조항에도 대상과 이유를 함께 기록한다.

| 현재 화면 | 2-design 안의 소유 위치 |
| --- | --- |
| login·profile·members-pending·members | modules/account/screens |
| schedule-worker·schedule-admin | modules/schedule/screens |
| dashboard의 출근 인증·사유 시트, qr | modules/attendance/screens |
| payroll·wages | modules/payroll/screens |
| dashboard·approvals·stats | system/screens |

복합 화면은 각 업무 영역의 규칙을 참조한다. 통계 화면이 지각이나 급여를 별도로 정의하지 않는다.

**dashboard의 출근 인증과 사유 시트는 추출한다.** 최종 소유 위치는 다음으로 정한다. 작업 중간에 원본을 먼저 이동할 수는 있지만 추출까지가 이번 개편의 완료 범위다.

| 기존 dashboard의 내용 | 최종 파일 |
| --- | --- |
| 대시보드 구성, 알림 영역, 근무·급여 요약 | system/screens/dashboard.md |
| 출근 인증, 위치·QR, 인증 성공·실패·재시도 화면 | modules/attendance/screens/check-in.md |
| 사유 작성·제출·실패·닫기 | modules/attendance/screens/excuse.md |
| 값 없음, 예외, 미정, 디자인 기준과의 충돌 | 해당 화면의 문서로 배정하고 공통 결정은 소유 기준에 링크 |

`dashboard.sian.html`도 같은 세 범위로 나눠 각각 같은 이름의 `.sian.html`을 둔다. 기존 화면 상태·문안·시각을 보존하고 문서 추출을 위해 제품 동작을 새로 정하지 않는다. 대시보드는 출근 인증과 사유 입력 문서를 링크한다. 12개 문서·시안 짝은 14개 짝이 되며, 늘어나는 두 쌍은 기존 내용의 추출이다.

**swap과 notification에는 현재 screens 폴더를 만들지 않는다.** 교대 UI는 근무표와 승인함의 화면 문서에서, 알림 UI는 대시보드와 프로필의 화면 문서에서 소유한다. swap/design은 요청·수락·승인의 기술적 순서와 UI 연결을, notification/design은 전송·읽음 처리·알림 종류별 목적지를 소유한다. 아직 없는 관리자 교대 승인 UI는 해당 미정을 유지한다. 문서 구조 결정으로 그 UI의 형태를 확정하지 않는다.

## 업무 문서와 화면의 내부 형식

아래 절 순서를 새 작성과 통합의 기준으로 사용한다. 해당하지 않는 절은 짧게 해당 없음을 표시하고, 내용이 없는 파일을 새로 만들지는 않는다. 승인된 과거 spec·완료 plan은 당시 기록을 보존한다.

| 파일 종류 | 본문 절 순서 |
| --- | --- |
| modules/영역/README.md | 책임과 범위 → 용어 → 업무 규칙 → 상태 전이 → 판정 예시 → 다른 영역과의 계약 → 미정 |
| modules/영역/design.md | 참조 규칙 → 소유 데이터 → 행위별 구현 계약 → UI 연결 → 코드와의 차이 → 미정 |
| screens/화면.md | 목적과 진입 → 참조 기준 → 화면 상태와 흐름 → 짜임과 토큰 → 문안 → 모션 → 예외와 미정 |
| 1-plan/intent/작업.md | 사용자 문제 → 사용자 장면 → 기대 결과 → 제약·범위 밖 → 열린 질문 → 연결 설계 |
| 2-design/spec/작업.md | 요구 → 설계 참조 → 완료 조건 → 범위 밖 → 승인 근거 |
| 3-build/plans/작업.md | 입력 명세·기준 → 변경 파일 → 구현 순서 → 리스크·전환·되돌리기 → 검증 방법 |
| 4-test/evidence/작업.md | 검증 대상과 Git 기준점 → 환경·기기 → 명령·시나리오 → 결과·증거 → 미해결 항목 |
| 5-deploy/releases/릴리스.md | 포함 작업·Git 기준점 → 사전 검증 근거 → 배포 기록 → 배포 후 확인 → 되돌리기 이력·후속 작업 |
| 6-maintain/incidents/사건.md | 영향과 발생 시각 → 관련 릴리스 → 확인 사실 → 대응·복구 확인 → 원인과 후속 작업 |

design의 「행위별 구현 계약」은 같은 행위를 중심으로 **입력·전제 / 읽고 쓰는 데이터 / 권한 / 처리와 경쟁 / 결과와 실패 / 캐시 갱신**을 함께 적는다. 데이터·API·런타임이라는 세 개의 큰 절에 같은 행위를 다시 흩어놓지 않는다. 소유 데이터 절은 관계·제약과 스키마 위치를 설명하고 전체 DDL을 복사하지 않는다.

화면의 상태는 정상·빈 상태·로딩·실패·권한 제한·성공 직후를 확인한다. 화면마다 업무 정책을 다시 정의하지 않고 해당 규칙을 링크한다. 화면의 로딩 모양은 화면 문서, 언제 데이터를 읽거나 재시도하는지는 design이 소유한다.

## 테스트·배포·운영의 하위 구조

**4-test는 strategy, execution, evidence로 나눈다.** strategy에는 unit·integration·e2e·수동 검증의 선택 기준을 모은다. 현재 test-planner와 ADR-003에 걸쳐 있는 현재 적용 기준을 여기로 모으고, 에이전트는 이를 참조한다. ADR은 선택의 이유를 보존한다. execution은 현재 4-test README의 명령·훅·문서 검사·문제 해결을 받는다. evidence는 iOS PWA 실기기 확인처럼 CI 결과만으로 남기기 어려운 검증에만 작성한다. 자동 테스트를 설명하는 문서를 작업마다 만들지는 않는다.

**5-deploy는 환경, 절차, 실행 기록을 나눈다.** environments는 환경별 플랫폼·서비스·설정 이름과 보관 위치를, procedure는 빌드→데이터 전환→배포→확인→되돌리기의 반복 절차를 소유한다. 실제 시크릿 값은 적지 않는다. releases는 릴리스마다 적용한 커밋·마이그레이션과 결과를 남긴다. CI 빌드 전 환경값 주입 순서는 procedure에, 테스트 실행 관련 CI 설명은 4-test/execution에 둔다.

**6-maintain은 관측, 대응 절차, 측정, 사건 기록을 나눈다.** monitoring은 에러·로그·외부 의존성·상태 확인을, response는 누가 어떤 순서로 대응하고 복구를 확인하는지를 소유한다. 배포를 되돌리는 명령은 5-deploy/procedure를 참조한다. metrics는 1-plan/metrics의 지표를 실제로 수집하고 집계하는 쿼리·도구·측정 주기를 담는다. 지표 정의·분모·목표선은 1-plan이 소유한다. incidents는 개별 사건의 기록이다.

이 파일명과 책임은 지금 정한다. 배포·운영 상세는 첫 출시 준비 시점에 실제 환경을 확인해 채운다. 장애 사건 파일은 사건이 발생했을 때 작성한다. 문서 자리의 결정과 아직 모르는 운영 내용의 확정을 구별한다.

## 단계별 문서는 서로 다른 질문에 답한다

| 단계·문서 | 답할 질문 | 참조할 입력 | 여기서 반복하지 않을 내용 |
| --- | --- | --- | --- |
| 1-plan/intent | 누구의 어떤 문제를 해결하나 | PRD·로드맵·시나리오 | 상세 API·화면 규칙 |
| 2-design/modules·system·design-system | 제품이 계속 지킬 규칙과 구조는 무엇인가 | 제품 범위와 확정된 사용자 요구 | 작업 진행 상태 |
| 2-design/spec | 이번 작업이 어디까지 되면 끝인가 | intent와 이번에 적용할 설계 조항 | 업무 규칙·기술 설계의 사본 |
| 3-build/plans | 어떤 순서와 방법으로 구현하나 | 승인된 spec과 참조 설계 | 기능의 완료 조건 사본 |
| 4-test | 어느 층에서 무엇을 검증하나 | spec의 완료 조건·업무 판정 예시 | 제품 정책의 별도 정의 |
| 5-deploy | 검증된 무엇을 어떻게 배포하고 되돌리나 | 완료 작업·CI 결과·운영 조건 | 기능 규칙과 task 상태 |
| 6-maintain | 운영에서 무엇을 확인하고 어떻게 대응하나 | 배포 결과·지표·관찰 | 코드와 다른 업무 정책 |

intent→spec→plan은 현재처럼 동일한 작업 슬러그를 쓴다. 업무 영역과 작업은 다른 축이다. `account`에 `login-screens`와 `account-data` 같은 작업 여럿이 연결될 수 있다. 영역 파일명까지 작업명과 같게 만들지는 않는다.

기능 spec은 intent와 관련 설계 조항을 명시하고, plan은 대응 spec을 명시한다. 테스트는 완료 조건 또는 중요한 규칙의 식별자를 참조한다. 파일 이름과 참조 선언에서 작업별 연결을 계산하며 별도의 수기 연결표를 중복 관리하지 않는다. 릴리스는 포함 작업 ID와 검증 근거를 링크한다.

참조 필드는 다음 형식으로 정한다.

```yaml
# 2-design/spec/<task>.md의 frontmatter
status: draft
sources:
  - ../../1-plan/intent/<task>.md
  - ../modules/attendance/README.md#att-003
  - ../modules/attendance/design.md
```

`sources`는 저장소 루트가 아닌 작성 파일 기준의 상대 경로다. plan도 같은 필드로 대응 spec을 가리킨다. 파일명에서 작업 ID를 얻으므로 같은 ID를 frontmatter에 다시 적지 않는다. 승인 근거 절은 검토한 Git 기준점과 승인 범위를 기록한다. 이 예시는 형식 설명이며 해당 작업이나 승인이 실제로 생겼다는 뜻은 아니다.

고정 규칙 ID는 `### ATT-003`처럼 제목 자체로 두고 다음 문장에 규칙 이름과 내용을 적는다. 따라서 링크는 `#att-003`으로 유지된다. 완료 조건도 spec 안에서 `AC-01` 같은 식별자로 참조할 수 있다. 문서 제목 변경 때문에 규칙 참조가 끊어지지 않게 한다.

테스트 코드의 위치는 현재 ADR-001이 정한 그대로다. `4-test`는 전략과 실행 안내를 맡으며 작업마다 테스트 설명 문서를 추가로 요구하지 않는다. 특수한 검증 기록은 `4-test/evidence/<task>.md`에 두고 같은 작업 ID로 연결한다. 실패 테스트를 먼저 쓰고 구현하는 TDD 순서도 유지한다.

proposals는 방향 검토, intent는 사용자 문제, spec은 기능 승인, plan은 실행 방법이라는 [ADR-008](../2-design/adr/ADR-008-proposals-and-implementation-plans.md)의 구별을 유지한다. 제안이 채택돼도 기능 spec의 승인을 대신하지 않는다. 비기능 task는 현재처럼 plan에 완료 조건을 둔다. 과거 완료 작업에 없는 intent나 plan을 소급 생성하지 않는다.

## 상태와 미정의 원천

- **작업 상태·우선순위·선행 관계:** backlog의 작업 ID별 행이 소유한다. spec과 plan에 진행 상태를 복제하지 않는다.
- **기능 승인:** spec의 `status`와 승인 근거가 소유한다. `approved`는 작업 완료를 뜻하지 않는다.
- **제안 채택:** 해당 proposal의 상태가 소유한다. 본문에서 같은 현재 상태를 다시 선언하지 않는다.
- **재개 정보:** handoff는 backlog의 다음 작업을 링크하고 이번 회차에만 필요한 정보를 적는다. 완료 목록과 전체 설계 상태를 반복 서술하지 않는다.
- **미정:** 사용자 문제는 intent, 업무·기술·화면 결정은 해당 설계 문서가 소유한다. backlog는 그 미정이 막는 작업에서 원문을 링크한다.
- **결과 근거:** CI·PR·log의 결과를 완료 작업에서 링크한다. CHANGELOG는 날짜별 변경 기록을 유지한다.

backlog는 수기 Markdown 보드 한 곳으로 정한다. 행마다 `작업 ID / 작업 / 상태 / 선행 작업 ID / spec 또는 plan / 검증·완료 근거`를 둔다. 상태는 `candidate / blocked / ready / active / done`이고 ready 작업은 위 행부터 착수한다. 같은 상태별 목록을 별도로 중복 관리하지 않는다. 준비 작업의 산출물이 다른 작업의 plan인 경우도 있으므로 완료 근거의 경로를 명시하고 작업 ID와 산출물 파일명이 다르다는 이유만으로 위반 처리하지 않는다. 동일 슬러그 규칙은 기능 자체의 intent·spec·구현 plan에 적용한다.

handoff는 「다음 작업」과 「재개 맥락」 두 절로 정한다. 다음 작업은 backlog의 작업 ID와 링크만 들고, 재개 맥락은 아직 보존할 필요가 있는 회차별 정보만 담는다. 열린 정책 판단·반복 주의·완료 목록은 각각 소유 문서로 보낸다. 이 형식 전환은 session-recorder 정의문과 같은 PR에서 적용한다. 자동 생성 보드나 새 작업 관리 파일은 추가하지 않는다.

## 상위 기준이 바뀌면 하위 산출물도 확인한다

1. 중요한 업무 규칙에 `ATT-003` 같은 고정 식별자를 부여한다. 소유 문서의 조항 하나가 기준이고 다른 문서는 이를 참조한다. 모든 설명 문장을 형식화하지는 않는다.
2. 설계·spec·plan의 입력 문서를 명시하고 여기서 역참조 목록을 계산한다. 같은 정책을 다른 단계에서 다시 써서 유지하지 않는다.
3. 기준을 고치는 PR에서 영향받는 문서·테스트를 확인한다. 함께 수정하거나, 영향이 없다는 이유를 남기거나, 명시적인 전환 작업을 연결한다. 서로 모순된 현재 계약을 후속 작업 링크만 달아 방치하지 않는다.
4. 승인된 진행 중 spec의 요구·설계 입력이 달라지면 변경 차이를 검토한다. 승인 범위가 달라지는 경우 기존 사용자 결정으로 충분한지 확인하고 필요한 재승인을 받는다. 승인 기록에는 비교할 Git 기준점과 참조 문서를 남긴다.
5. 변경된 판정을 실제 입력·기대 결과로 테스트한다. 5-deploy는 검증된 작업을 출시 대상으로 연결하고, 6-maintain에서 발견한 제품 문제는 다음 intent의 입력으로 돌린다.

예를 들어 「통신 지연」은 출근 규칙 한 곳이 판정 기준을 소유한다. 출근 design은 보고 시각·수신 시각·판정 시각을 구별하고, 화면은 표시 문안과 위치를 정한다. spec은 이번 구현 범위와 완료 조건을, plan은 구현·검증 순서를 정한다. 6분 늦게 수신한 인증의 표시 여부를 테스트하면 현재 발견한 문서 불일치를 검증할 수 있다. 10분 초과 지연의 처리처럼 아직 합의가 필요한 제품 정책은 문서 재편 자체로 확정하지 않는다.

## 목표 설계와 구현 상태

2-design의 정본은 현재 합의된 목표다. 아직 합의되지 않은 대안은 확정 조항과 구별해 해당 문서의 미정 절이나 proposal·intent의 검토 내용으로 표시한다. 채택된 변경은 영향을 받는 설계 정본을 먼저 갱신하고 spec·plan으로 이어진다.

코드가 목표를 아직 구현하지 않았다면 design의 「구현과의 차이」에 현재 코드와 전환 작업을 연결한다. 진행 상태는 backlog가 소유한다. 코드 전환이 완료되면 이 차이를 갱신하고 검증 근거를 연결한다.

완료된 spec·plan은 당시 승인·실행 기록으로 보존하고 현재 기준으로 안내한다. 뒤의 기준 변경이 과거 완료 작업을 다시 미완료로 만들지는 않는다. 과거 ADR·log·CHANGELOG도 현재 자리에서 보존한다.

## 이동과 유지 대상

| 현재 | 변경 후 |
| --- | --- |
| 1-plan의 모든 갈래 | 위치와 단계 역할 유지 |
| 2-design/domain의 영역 파일 | 2-design/modules/영역/README.md |
| architecture의 data-model·api·runtime 영역 파일 | 2-design/modules/영역/design.md로 통합 |
| architecture/flows의 영역별 화면 흐름 | 소유 화면 문서의 흐름 절 |
| architecture 각 README의 공통 규칙 | 2-design/system으로 통합, 영역별 내용은 해당 modules로 이동 |
| design-system/pages와 시안 | 2-design/modules 또는 system 아래 screens |
| design-system의 공통 기준·토큰 | 기존 위치 유지 |
| spec·adr·3-build/plans | 위치와 단계 역할 유지 |
| 4-test·5-deploy·6-maintain | 단계 유지, 입력·출력 연결 보강 |
| proposals·observations·backlog·handoff·log·CHANGELOG | 위치 유지, 내용과 상태 소유권 정비 |

### 기존 설계의 구체적인 배정

다음 표의 경로는 `2-design/` 기준이다. `<영역>`은 account·schedule·attendance·payroll·swap·notification 여섯에만 적용한다. 폴더 통합 때 원문 절마다 목적지를 기록하고, 하나의 규칙 본문이 여러 목적지에 복제되지 않도록 검토한다.

| 원문 | 목적지와 배정 |
| --- | --- |
| domain/README.md | modules/README.md — 영역 지도·공통 용어·영역 간 책임 |
| domain/<영역>.md | modules/<영역>/README.md — 모든 용어·업무 규칙·미정 |
| architecture/README.md | 2-design README의 설계 지도와 modules README의 영역 지도. 시스템 자체의 설명은 system/architecture.md |
| architecture/data-model/<영역>.md | modules/<영역>/design.md의 소유 데이터·행위별 계약 |
| architecture/api/<영역>.md | modules/<영역>/design.md의 행위별 계약 |
| architecture/runtime/<영역>.md | modules/<영역>/design.md의 행위별 계약·캐시 갱신 |
| architecture/data-model/README.md | 관계 지도는 system/architecture, 공통 스키마·공유 halls·권한·쓰기·서비스 키·컬럼 규약은 system/data-access, 시각·상수 원천은 system/runtime. 테이블 목록의 영역별 설명·권한 예외·용어 대응은 해당 modules/design. open_slots 계산 예외는 schedule/design |
| architecture/api/README.md | 시스템 역할은 system/architecture, 공통 읽기·쓰기·타입·에러·서비스 키는 system/data-access, 서버 시각은 system/runtime. 특정 질의·뷰·에러별 처리는 해당 modules/design과 화면. Free 플랜의 사용 제약은 5-deploy/environments, 운영 확인은 6-maintain/monitoring |
| architecture/runtime/README.md | 기본 규칙은 system/runtime. 무효화 표는 행위를 소유한 modules/design에 옮겨 그 행위의 전체 갱신 대상을 적음. 영역별 읽기 범위와 예외도 해당 modules/design. 공통 로딩 모양·전환 모션·통신 없음 표시는 design-system의 기존 components·motion 조항으로 합침 |
| architecture/flows/README.md | 경로·역할별 진입·탐색·뒤로 가기는 system/navigation. 개별 업무에 속한 미정은 해당 modules/design. 목록은 질문 본문을 복제하지 않고 소유 조항을 링크 |
| architecture/flows/account.md | 계정 screens의 진입·성공·실패·이동에 분배. 호출 순서와 데이터 처리는 account/design |
| architecture/flows/schedule.md | schedule의 두 화면 및 system/screens/approvals의 이동에 분배. 근무 요청·취소의 기술적 순서는 schedule/design |
| architecture/flows/attendance.md | attendance의 check-in·excuse·qr와 system/screens/approvals. 호출·재시도 계약은 attendance/design |
| architecture/flows/payroll.md | payroll의 payroll·wages, system/screens/stats, 조정을 여는 schedule/screens/schedule-admin. 함수 계약은 payroll/design |
| architecture/flows/swap.md | swap/design의 행위별 순서·UI 연결·미정과 schedule/screens/schedule-worker의 사용자 동작 |
| architecture/flows/notification.md | notification/design의 목적지·읽음 처리. 각 목적지의 실제 화면 구성은 소유 화면 문서 |
| design-system/pages/*.md·*.sian.html | 위 화면 소유 표대로 이동. dashboard 한 쌍은 세 쌍으로 추출 |
| design-system/README.md | 공통 기준·토큰·컴포넌트 안내는 유지. 페이지 목록은 소유 영역·system의 화면 링크로 대체. 화면 작성 틀은 2-design README가 소유 |
| design-system/tokens·components·writing·foundation | 기존 파일명과 경로 유지 |
| spec/*.md·adr/*.md | 기존 파일명·상태·승인 근거 유지, 이동된 설계 참조와 후속 결정 링크 갱신 |

여러 영역이 같은 저장 구조를 쓰는 경우 소유 문서도 하나로 정한다. 현재 requests·request_candidates의 공통 구조와 `respond_request`의 공통 계약은 schedule/design이 소유한다. swap/design은 이를 참조하고 교대의 추가 조건·행위·결과만 적는다. 캐시 무효화는 변경을 일으킨 행위의 design에 전체 대상을 적고, 영향을 받는 영역은 자신의 캐시 계약을 제공한다.

### 나머지 현재 파일의 배정

| 원문 | 목적지와 처리 |
| --- | --- |
| 1-plan의 README·prd·roadmap·scenarios·metrics·intent | 모두 위치 유지, 작성 형식과 이동된 설계 링크 갱신 |
| 3-build의 README·plans 전체 | 모두 위치 유지, 활성 plan의 입력 참조 보강. 완료 계획의 역사적 본문은 보존 |
| 4-test/README.md | 단계 안내는 유지, 실행·훅·문서 검사·문제 해결 본문은 execution.md로 이동 |
| 4-test/strategy.md | 위치 유지, test-planner의 현재 층 배정 기준을 이곳에 통합 |
| 5-deploy/README.md | 단계 안내는 유지, CI의 테스트 실행은 4-test/execution, 빌드·배포 순서는 procedure, 환경 제약은 environments로 분배 |
| 6-maintain/README.md | 단계 안내는 유지, 관측·대응·측정 설명을 monitoring·response·metrics로 배정 |
| proposals·observations·log와 각 archive | 위치·기록 유지, 현재 안내 링크만 필요한 곳에서 갱신 |
| backlog·handoff·CHANGELOG | 위치 유지. backlog·handoff는 위에서 정한 형식으로 정비하고 CHANGELOG는 날짜별 기록 유지 |
| 기존 .gitkeep | 내용 없는 디렉터리 유지용으로 보존. 이관 후 실파일이 있는 곳에서는 제거 가능 |

새로 생기는 절차 문서는 기존 내용을 받은 뒤 필요한 실제 정보만 보완한다. 아직 배포·운영 환경이 없어 작성할 수 없는 항목은 첫 출시 준비 task에 연결한다. 기존 자료를 어느 파일에 둘지는 이 표로 결정하며 정책 내용의 미정만 남긴다.

ADR-005의 SDLC·동일 슬러그 사슬·승인 관문과 ADR-008의 제안/실행 구별은 유지한다. 채택 시 설계 내부 배치에 관한 후속 ADR로 ADR-004와 현재 설계 안내의 경로·소유권을 갱신하고, 이전 ADR에는 후속 결정 링크를 남긴다.

## 도구와 검사

문서 이동과 함께 루트 README·CLAUDE의 입구, 설계 README, REVIEW의 영향 검토, `.claude/agents/`의 조사·설계·구현·테스트·시안·마감 입력 경로를 바꾼다. spec 경로와 기존 feat 브랜치 승인 게이트는 유지하고, 추가 참조 검사가 기존 승인을 조용히 우회하거나 대체하지 않게 한다.

`tests/lint/`의 문서 지도·링크·옛 경로·디자인 지도·시안 검사와 `.prettierignore`의 시안 경로를 함께 바꾼다. 토큰 원천의 경로는 유지하므로 생성기의 입력 경로는 바꿀 필요가 없다. 이동 후에도 토큰 생성 결과가 동일한지 확인한다.

새 검사는 규칙 ID·참조 존재, 작업 ID·선행 작업 링크, 기능의 intent/spec/plan 연결, 승인 후 입력 변경의 검토 기록을 확인한다. 과거 완료 작업과 비기능 task의 적용 범위는 구별한다. 의미의 일치는 리뷰와 실제 동작 테스트가 판단한다. 링크 유효성이 내용의 일치를 증명하지는 않는다.

## 이행 순서

1. **기준과 이동표 작성:** 모든 현재 문서를 이동·통합·유지에 배정하고 충돌 목록을 만든다. SDLC와 사슬 보존을 완료 기준으로 고정한다.
2. **계정 설계로 시범 전환:** 업무 규칙·데이터/API/런타임·화면·시안을 2-design 안에서 묶고, 관련 intent·spec·plan과의 연결을 검증한다. 토큰과 공통 기준은 원천을 유지한다.
3. **나머지 설계와 공통 규칙 이동:** 위에서 정한 근무표·출근·급여·교대·알림 및 복합 화면의 소유 위치로 옮긴다. dashboard의 출근 인증·사유 시트와 시안 추출을 완료한다. 이동마다 참조 경로·검사·에이전트 정의문을 함께 갱신한다.
4. **단계 연결과 상태 정비:** 활성 작업에 ID와 산출물 링크를 연결하고 handoff의 중복 상태를 줄인다. 승인된 작업의 근거와 완료 조건을 보존한다.
5. **변경 전파 검증:** 규칙 변경 하나가 설계→spec→plan→테스트까지 추적되는지 확인한다. 출시 준비 작업에서는 검증 결과→배포→운영의 연결까지 확인한다.

각 이동은 문서와 경로 소비자를 같은 PR에서 바꾼다. 옛 문서와 새 문서 양쪽을 현재 정본으로 편집하지 않는다. 필요하면 옛 경로에는 활성 정본 링크만 두고 이행 완료 후 정리한다. 이동표와 개별 PR로 되돌릴 수 있게 한다. 승인되지 않은 제품 정책 변경을 파일 이동에 섞지 않는다.

## 완료 기준

- 여섯 SDLC 단계와 각 단계의 역할이 유지된다.
- 기능의 intent→spec→plan, spec 승인, 실패 테스트→구현 순서가 유지된다.
- 설계 조항·근거·시안이 유실되지 않고, 같은 업무의 기술 계약이 한곳에서 읽힌다.
- 위 파일별 이관 명세의 현재 문서가 모두 처리되고, 화면 문서·시안 14쌍의 소유 위치와 참조가 맞는다.
- 테스트·배포·운영의 절차와 실행 기록이 정한 파일명에 놓인다. 미래의 실행·장애 기록을 미리 생성하지 않는다.
- 공통 기준과 영역별 예외의 소유권이 분명하다.
- 연락처 수정과 통신 지연의 불일치가 확정된 근거에 따라 해소된다.
- 작업 상태는 backlog가, 기능 승인은 spec이, 제안 채택은 proposal이 소유한다.
- 같은 작업 ID로 기획·설계·구현·검증의 근거를 찾을 수 있다. 출시 준비 때는 배포·운영까지 연결된다.
- 문서·시안·사슬·참조 검사가 통과하고, 기존 승인 게이트와 토큰 생성 결과가 유지된다. lint·format·typecheck·단위 테스트가 통과한다.

큰 비용은 2-design 내부의 내용 통합과 화면·시안 경로 소비자의 수정이다. 단계 간 이동은 계속 필요하지만 각 이동의 목적과 입력이 명확해진다. 문서 사이트, 새 작업 관리 시스템, 앱의 FSD 재편, 배포 플랫폼 변경은 이 제안의 범위에 포함하지 않는다.
