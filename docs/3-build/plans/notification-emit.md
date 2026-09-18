---
sources:
  - ../../2-design/modules/notification/design.md#누가-넣나
  - ../../2-design/modules/notification/design.md#알림-행
  - ../../2-design/modules/notification/design.md#ui-연결
  - ../../2-design/modules/notification/README.md#ntf-001
  - ../../2-design/modules/notification/README.md#ntf-010
  - ../../2-design/modules/notification/README.md#ntf-011
  - ../../2-design/modules/notification/README.md#ntf-012
  - ../../2-design/modules/notification/README.md#ntf-014
  - ../../2-design/modules/notification/README.md#ntf-015
  - ../../2-design/modules/notification/README.md#ntf-030
  - ../../2-design/modules/notification/README.md#ntf-031
  - ../../2-design/modules/notification/README.md#ntf-032
  - ../../2-design/modules/notification/README.md#ntf-035
  - ../../2-design/modules/notification/screens/notifications.md#알림-제목
  - ../../2-design/system/data-access.md#함수-안의-규칙
---

# 일이 일어날 때 알림을 낳는다 — 구현 계획

## 입력 명세·기준

정본은 [notification/design.md](../../2-design/modules/notification/design.md#누가-넣나)의 [누가 넣나](../../2-design/modules/notification/design.md#누가-넣나)와 [UI 연결](../../2-design/modules/notification/design.md#ui-연결)이다. 받는 사람은 [NTF-014](../../2-design/modules/notification/README.md#ntf-014), 나가는 때는 [NTF-010](../../2-design/modules/notification/README.md#ntf-010)~[NTF-012](../../2-design/modules/notification/README.md#ntf-012)다.

**일이 일어나는 순간 알림 행을 낳는 것**이 이 task의 산출이다. 시각을 보고 나가는 넷(미리 알림·출근 직전·빈 자리 재촉)은 [`notification-schedule`](notification-schedule.md)이 맡는다.

선행이 하나다. [`notification-data`](notification-data.md)가 `notifications` 표를 냈다. 그리고 **알림을 낳는 자리가 이미 있는 task들의 함수 안이라** 그 task들이 먼저 merge돼야 한다 — 가입 승인, 근무표 만들기·확정·강제 변경, 근무 요청, 근무 취소, 사유 승인이다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **낳는 자리가 이미 있는 함수 안이다.** 새 함수를 거의 안 만든다. `approve_profile`이 끝에 알림 행을 하나 더 넣는 식이다 — 같은 트랜잭션이라 승인은 됐는데 알림이 없는 상태가 안 생긴다
- **안 나가는 셋이 규칙으로 못박혀 있다.** 사유 도착([NTF-030](../../2-design/modules/notification/README.md#ntf-030)), 가입 거절([NTF-031](../../2-design/modules/notification/README.md#ntf-031)), 가입 신청 도착([NTF-032](../../2-design/modules/notification/README.md#ntf-032))이다. 있어야 할 것이 없는 게 아니라 없는 것이 결정이다
- **묶지 않는다.** 같은 사람에게 몇 분 사이로 둘이 가도 각자 행이다([NTF-035](../../2-design/modules/notification/README.md#ntf-035)). 묶는 것은 주말 미리 알림 하나고 그것은 [`notification-schedule`](notification-schedule.md)에 있다
- **문장을 안 넣는다.** 행에는 `kind`와 `payload`만 든다. 문장은 [notifications.md](../../2-design/modules/notification/screens/notifications.md#알림-제목)의 표가 정본이고 읽는 쪽이 조립한다

## 완료 조건

### AC-01

**payload의 모양을 타입이 묶는다.**

`src/features/notification/model/kinds.ts`

- 종류마다 `payload`에 무엇이 드는지를 타입으로 정한다. 근거는 [알림 제목](../../2-design/modules/notification/screens/notifications.md#알림-제목) 표의 「가변값」 열이다
- 낳는 쪽과 읽는 쪽이 같은 타입을 쓴다. **DB의 `jsonb`는 모양을 안 지켜서 여기가 유일한 방어다**
- `subject_id`가 무엇을 가리키는지도 종류마다 여기 적는다

### AC-02

**가입 승인.**

- `approve_profile`(계정 영역) 안에서 낳는다
- 받는 사람은 승인받은 그 사람이다
- **거절은 안 낳는다**([NTF-031](../../2-design/modules/notification/README.md#ntf-031))
- **가입 신청이 도착한 것도 안 낳는다**([NTF-032](../../2-design/modules/notification/README.md#ntf-032)) — 관리자 홈의 「가입 대기 · n명」이 그 신호다

### AC-03

**신청 접수 열림과 마감일 변경.**

- 근무표를 만드는 함수 안에서 낳는다. **만드는 즉시다**([NTF-010](../../2-design/modules/notification/README.md#ntf-010))
- 받는 사람은 승인된 사람 전원이다
- `payload`에 달과 마감일이 든다 — 아래 줄이 마감일을 적는다
- 마감일을 바꾸는 함수도 같다. 바꾸는 즉시 나가고 `payload`에 새 마감일이 든다

### AC-04

**근무표 확정과 변경.**

- 확정하는 함수 안에서 낳는다. 받는 사람은 **그달에 배정된 사람**이다 — 전원이 아니다
- 변경은 강제 변경 함수 안이다. **빠진 사람과 들어온 사람 둘 다 받는다**([NTF-014](../../2-design/modules/notification/README.md#ntf-014))
- 들어옴과 빠짐이 `kind`가 다르다. 문장도 목적지도 다르다 — 들어온 사람은 `/schedule?date=`, 빠진 사람은 `/schedule?month=`다
- **근무 요청을 수락해 들어온 본인은 뺀다.** 자기가 누른 결과라 이미 안다
- **확정 뒤 교육 배정을 붙이는 것도 변경이다**([NTF-015](../../2-design/modules/notification/README.md#ntf-015)). 교육으로 붙은 사람이 「들어옴」으로 받는다

### AC-05

**근무 요청 셋.**

- 도착은 관리자가 보내는 즉시, 받는 사람은 요청을 받은 근무자다
- 수락은 수락으로 배정이 확정되는 즉시, 받는 사람은 관리자다
- **전부 소진은 그 자리의 마지막 요청이 거절·만료되는 즉시다**([NTF-011](../../2-design/modules/notification/README.md#ntf-011)). 받는 사람은 관리자고 `payload`에 날짜와 포지션이 든다
- **거절과 만료는 건건이 안 나간다.** 자리가 다 끝났을 때 한 번이다

### AC-06

**근무 취소 둘.**

- 요청은 근무자가 거는 즉시 관리자에게 간다([NTF-012](../../2-design/modules/notification/README.md#ntf-012))
- 결과는 관리자가 승인이나 거절을 누르는 즉시 그 근무자에게 간다
- 승인과 거절이 `kind`가 다르다. 목적지도 다르다 — 승인이면 `/schedule?month=`, 거절이면 `/schedule?date=`다

### AC-07

**사유 결과 둘.**

- 승인과 거절 둘 다 사유를 넣은 근무자에게 간다
- **거절은 관리자가 적은 이유를 함께 싣는다** — `payload`에 들고 아래 줄에 선다
- **사유가 도착한 것은 관리자에게 안 간다**([NTF-030](../../2-design/modules/notification/README.md#ntf-030))

### AC-08

**낳는 헬퍼 하나.**

`internal.emit_notification(p_profile_ids uuid[], p_kind text, p_subject_id uuid, p_payload jsonb)`

- 위 여섯 자리가 전부 이것을 부른다. insert 문을 여섯 군데에 흩지 않는다
- **받는 사람 배열을 받는다.** 전원에게 가는 것도 한 번의 호출이다
- `internal` 스키마라 세션에서 못 부른다 — 부르는 것은 같은 트랜잭션 안의 다른 함수뿐이다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/features/notification/model/kinds.ts` | 종류와 payload 타입 | AC-01 |
| `supabase/migrations/<날짜>_emit_notification.sql` | 헬퍼 | AC-08 |
| `supabase/migrations/<날짜>_emit_account.sql` | 가입 승인 | AC-02 |
| `supabase/migrations/<날짜>_emit_schedule.sql` | 접수 열림·마감일·확정·변경 | AC-03·AC-04 |
| `supabase/migrations/<날짜>_emit_requests.sql` | 근무 요청 셋, 근무 취소 둘 | AC-05·AC-06 |
| `supabase/migrations/<날짜>_emit_excuse.sql` | 사유 결과 둘 | AC-07 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `integration-test-writer` → `implementer` → `pr-diff`. **선행 task가 많아 착수 전에 보드를 확인한다** — 알림을 끼워 넣을 함수가 전부 merge돼 있어야 한다.

1. `test-planner`가 AC-01~AC-08을 배정한다. **AC-01만 unit이고 나머지는 전부 integration이다** — 「그 함수를 부르면 알림 행이 이만큼 선다」가 단언이다
2. `integration-test-writer`가 받는 사람 수를 쓴다. **확정은 배정된 사람만, 접수 열림은 전원** 같은 것이 여기서 갈린다. 안 나가는 셋(사유 도착·가입 거절·가입 신청)도 「행이 0건」으로 단언한다
3. `implementer`가 헬퍼 → 자리마다 한 줄씩 순으로 초록을 만든다
4. `pr-diff`가 diff를 본다 — 기존 함수의 단언을 바꾼 자리가 없는지

## 리스크·전환·되돌리기

- **남의 task 함수를 고친다.** 이 task의 변경이 계정·근무표·출근 영역 함수 안으로 들어간다. 그 함수들의 기존 integration이 깨지면 안 된다 — `implementer`가 받은 테스트의 단언을 못 바꾸는 규칙이 여기서 특히 중요하다
- **받는 사람을 잘못 고르면 조용히 틀린다.** 확정 알림이 전원에게 가도 에러가 안 난다. 사람이 「나는 배정 안 됐는데 왜 오지」 하고 알아채는 것이 유일한 신호다 — integration이 인원 수를 센다
- **트랜잭션이 커진다.** 전원에게 가는 알림은 행이 서른 개다. 접수 열림이 근무표 만들기와 같은 트랜잭션이라 그만큼 길어진다. 서른 명 규모에서는 문제가 아니지만 배열 한 번의 insert로 넣어 왕복을 줄인다
- **`payload` 모양이 읽는 쪽과 어긋나면 화면에 빈 값이 선다.** DB가 안 막아서 AC-01의 타입이 유일한 방어다. 푸시 쪽 [`notification-push`](notification-push.md#ac-01)와 목록 쪽 [`notification-list`](notification-list.md)가 같은 타입을 쓴다
- 되돌리기는 각 함수에서 `emit_notification` 호출을 빼는 마이그레이션이다. 이미 선 행은 그대로 남는다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | payload 모양이 종류와 안 맞는다 | unit `src/features/notification/model/__tests__/`(예정) | `pnpm test` | 타입이 안 맞으면 컴파일이 깨진다 |
| AC-02 | 거절에도 알림이 난다 | integration `tests/integration/emit-account.test.ts`(예정) | `pnpm test:integration:run` | 거절 뒤 행이 0건 |
| AC-02 | 가입 신청에 관리자 알림이 난다 | integration 위 | 위와 같다 | 행이 0건 |
| AC-03 | 접수 열림이 전원에게 안 간다 | integration `tests/integration/emit-schedule.test.ts`(예정) | 위와 같다 | 승인된 사람 수만큼 |
| AC-04 | 확정이 전원에게 간다 | integration 위 | 위와 같다 | 배정된 사람 수만큼 |
| AC-04 | 요청을 수락해 들어온 본인에게도 간다 | integration 위 | 위와 같다 | 그 사람 행이 0건 |
| AC-04 | 교육 배정에 알림이 안 난다 | integration 위 | 위와 같다 | 「들어옴」 행이 1건 |
| AC-05 | 요청 거절마다 관리자에게 간다 | integration `tests/integration/emit-requests.test.ts`(예정) | 위와 같다 | 마지막 하나가 끝날 때만 1건 |
| AC-06 | 취소 결과의 승인과 거절이 같은 종류다 | integration 위 | 위와 같다 | `kind`가 다르다 |
| AC-07 | 사유 도착이 관리자에게 간다 | integration `tests/integration/emit-excuse.test.ts`(예정) | 위와 같다 | 행이 0건 |
| AC-07 | 거절 이유가 안 실린다 | integration 위 | 위와 같다 | `payload`에 이유가 든다 |

- 배정하지 않은 것: 낳은 행이 실제로 기기에 닿는 것 — [`notification-push`](notification-push.md)가 본다
- 막힌 것: 알림을 끼워 넣을 함수들이 아직 안 섰다. 선행 task가 전부 merge되기 전에는 이 task의 대부분이 못 선다 — **자리마다 쪼개 따라가는 것이 대안이고 착수 때 판단한다**

## 범위 밖

- 시각을 보고 나가는 넷(미리 알림 전날·주말 묶음, 출근 직전, 빈 자리 재촉) — [`notification-schedule`](notification-schedule.md)
- 교대의 각 단계와 관리자 공지 — 2차다([roadmap](../../1-plan/roadmap.md#릴리스-목록))
- 행을 기기로 보내는 것 — [`notification-push`](notification-push.md)
- 문장을 조립해 화면에 세우는 것 — [`notification-list`](notification-list.md)와 [`dashboard`](../../backlog.md)
