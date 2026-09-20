---
sources:
  - ../../2-design/modules/notification/design.md#행위-밖의-실행-동작
  - ../../2-design/modules/notification/design.md#누가-넣나
  - ../../2-design/modules/notification/design.md#ui-연결
  - ../../2-design/modules/notification/README.md#ntf-007
  - ../../2-design/modules/notification/README.md#ntf-008
  - ../../2-design/modules/notification/README.md#ntf-009
  - ../../2-design/modules/notification/README.md#ntf-013
  - ../../2-design/modules/notification/README.md#ntf-014
  - ../../2-design/modules/notification/README.md#ntf-035
  - ../../2-design/modules/notification/screens/notifications.md#알림-제목
  - ../../2-design/system/runtime.md#서버-시각
---

# 시각을 보고 나가는 알림을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [notification/design.md](../../2-design/modules/notification/design.md#행위-밖의-실행-동작)의 [행위 밖의 실행 동작](../../2-design/modules/notification/design.md#행위-밖의-실행-동작)이다. 시각은 [NTF-007](../../2-design/modules/notification/README.md#ntf-007)~[NTF-009](../../2-design/modules/notification/README.md#ntf-009)와 [NTF-013](../../2-design/modules/notification/README.md#ntf-013)이다.

pg_cron 함수 하나(`emit_reminders`)가 이 task의 산출이다. 사람이 아무것도 안 눌러도 나가는 알림 넷이 여기 산다 — 미리 알림(전날과 주말 묶음), 출근 직전, 빈 자리 재촉이다.

선행이 둘이다. [`notification-data`](notification-data.md)가 표를 냈고 [`notification-emit`](notification-emit.md)이 `emit_notification` 헬퍼를 냈다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **밤에 말하는 시각이 하나다.** 미리 알림도 빈 자리 재촉도 저녁 9시다([NTF-013](../../2-design/modules/notification/README.md#ntf-013)). 앱이 밤에 울리는 시각이 둘이 아니다
- **주말은 묶는다.** 토요일과 일요일 근무는 금요일 저녁 9시에 한 번이다([NTF-008](../../2-design/modules/notification/README.md#ntf-008)). 예식장은 주말에 몰려서 따로 보내면 이틀 밤 연달아 울린다 — **[NTF-035](../../2-design/modules/notification/README.md#ntf-035)가 묶지 말라고 한 것의 유일한 예외고, 같은 종류를 묶는 것이다**
- **출근 직전은 분 단위다.** 시작 10분 전이라 근무마다 시각이 다르다. 저녁 9시 한 번으로는 못 하고 cron이 자주 돌며 창을 본다
- **한 번 나간 것은 다시 안 나간다.** 실패 큐가 없고 완료 표시도 따로 없다 — 이미 선 알림 행이 있나를 보고 거른다

## 완료 조건

### AC-01

**저녁 9시에 도는 자리.**

`internal.emit_reminders()` — pg_cron이 날마다 저녁 9시에 부른다

셋을 한 번에 본다.

- **내일 근무가 있는 사람에게 미리 알림**([NTF-007](../../2-design/modules/notification/README.md#ntf-007)). 받는 사람은 그 근무에 배정된 사람이다. `payload`에 시각과 포지션이 들어 아래 줄에 선다
- **금요일이면 토·일 근무를 묶어 한 번**([NTF-008](../../2-design/modules/notification/README.md#ntf-008)). `kind`가 다르고 `payload`에 날짜 둘이 든다. 목적지는 **그 사람의 첫 근무 날**이다
- **금요일에는 토요일 근무의 전날 알림을 따로 안 낸다.** 묶음이 그것을 대신한다 — 둘 다 나가면 금요일 밤에 두 번 울린다
- **3일 뒤에 빈 자리가 남은 날이 있으면 관리자에게 재촉**([NTF-013](../../2-design/modules/notification/README.md#ntf-013)). 받는 사람은 관리자고 `payload`에 날짜와 빈 자리 수가 든다. **하루 전에 또 안 보낸다** — 3일 전 한 번이다
- 확정 안 된 달의 근무는 안 본다. 확정 전에는 근무 시각이 정해지지 않았다

### AC-02

**출근 직전에 도는 자리.**

`internal.emit_before_shift()` — pg_cron이 자주 부른다

- 근무 시작 10분 전인 근무를 집는다([NTF-009](../../2-design/modules/notification/README.md#ntf-009)). 받는 사람은 그 근무에 배정된 사람이다
- **창으로 본다.** cron 주기가 1분이면 「지금부터 1분 뒤 사이에 시작 10분 전이 되는 근무」다. 딱 맞는 순간을 노리면 cron이 한 번 늦었을 때 통째로 빠진다
- **이미 선 알림이 있으면 건너뛴다.** 창이 겹치거나 cron이 두 번 돌아도 한 번만 나간다
- 이미 출근 인증을 찍은 사람은 뺀다. 와 있는 사람에게 「10분 뒤에 시작돼요」는 군말이다

### AC-03

**같은 알림을 두 번 안 낳는다.**

- 낳기 전에 `notifications`에 같은 `profile_id`·`kind`·`subject_id`가 있나 본다
- 부분 유일 인덱스로 DB가 한 겹 더 막는다. **cron이 겹쳐 돌아도 행이 하나다**
- 이것이 이 task의 완료 표시이기도 하다 — 「보냈다」를 적는 열이 따로 없고 행의 존재가 그 뜻이다

### AC-04

**시각의 기준.**

- 서버 시각으로 판정한다([서버 시각](../../2-design/system/runtime.md#서버-시각)). 기기 시각을 안 본다
- 「저녁 9시」와 「3일 전」과 「10분 전」은 전부 한국 시각 기준이다. cron 등록에 시간대가 박힌다
- **날짜 경계가 서버 시간대를 따른다.** UTC로 읽으면 9시가 다른 날이 된다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_emit_reminders.sql` | 저녁 9시 셋, cron 등록 | AC-01·AC-04 |
| `supabase/migrations/<날짜>_emit_before_shift.sql` | 출근 직전, cron 등록 | AC-02·AC-04 |
| `supabase/migrations/<날짜>_notification_unique.sql` | 부분 유일 인덱스 | AC-03 |
| `src/features/notification/model/kinds.ts` | 넷의 payload 타입 | AC-01·AC-02 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `integration-test-writer` → `implementer` → `pr-diff`. [`notification-emit`](notification-emit.md)이 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-04를 배정한다. **전부 integration이다** — 시각 판정이 본체고 그것은 DB의 `now()`가 있어야 보인다
2. `integration-test-writer`가 날짜를 고정해 쓴다. 금요일에 도는 것, 토요일 근무가 묶음에만 드는 것, 두 번 돌아도 행이 하나인 것 셋이 핵심이다
3. `implementer`가 유일 인덱스 → 저녁 9시 → 출근 직전 순으로 초록을 만든다
4. `pr-diff`가 diff를 본다
5. 배포 뒤 첫 저녁 9시를 확인하고 결과를 backlog에 적는다

## 리스크·전환·되돌리기

- **금요일 밤에 두 번 울릴 수 있다.** 묶음과 전날 알림이 둘 다 나가면 그렇다. AC-01이 토요일 근무를 전날 알림에서 빼는데, 그 조건이 틀려도 에러가 안 난다 — 사람이 두 번 받고 나서 안다. integration이 금요일을 고정해 본다
- **cron이 한 번 늦으면 출근 직전이 통째로 빠진다.** 창으로 보는 것이 그 방어다. 창을 좁게 잡으면 같은 구멍이 남는다
- **이미 지난 근무에 알림이 갈 수 있다.** 배포 직후나 cron이 오래 멈췄다 돌아올 때다. 창의 위쪽 끝을 「지금」으로 막는다
- **시간대를 빠뜨리면 9시가 다른 시각이 된다.** cron 등록에 시간대가 박히고 함수 안의 날짜 계산도 같은 기준이다 — **둘 중 하나만 맞춰도 조용히 어긋난다**
- **`emit_before_shift`가 자주 돈다.** 1분마다 질의 하나다. 대부분의 분이 빈손으로 끝나고 이것은 `notification-push`의 `retry_push`와 같은 주기다 — 둘을 한 작업으로 합치는 것은 안 한다. 실패가 서로 옮는다
- 되돌리기는 cron 등록을 지우는 마이그레이션이다. 이미 선 행은 그대로 남는다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 내일 근무가 없는 사람에게 간다 | integration `tests/integration/emit-reminders.test.ts`(예정) | `pnpm test:integration:run` | 배정된 사람만 |
| AC-01 | 금요일에 토요일 알림이 두 번 난다 | integration 위 | 위와 같다 | 묶음 1건, 전날 0건 |
| AC-01 | 묶음의 목적지가 둘째 날이다 | integration 위 | 위와 같다 | 첫 근무 날 |
| AC-01 | 확정 안 된 달에도 나간다 | integration 위 | 위와 같다 | 행이 0건 |
| AC-01 | 재촉이 하루 전에 또 난다 | integration 위 | 위와 같다 | 3일 전 1건뿐 |
| AC-02 | cron이 늦으면 빠진다 | integration `tests/integration/emit-before-shift.test.ts`(예정) | 위와 같다 | 창 안이면 잡힌다 |
| AC-02 | 이미 인증한 사람에게 간다 | integration 위 | 위와 같다 | 그 사람 행이 0건 |
| AC-03 | 두 번 돌면 두 번 난다 | integration 위 | 위와 같다 | 행이 1건 |
| AC-04 | 9시가 다른 시각이 된다 | integration 위 | 위와 같다 | 한국 시각 21시 |
| AC-01 | 첫 실행이 안 돈다 | 수동 — 배포 뒤 저녁 9시를 본다 | 운영 | 내일 근무자에게 행이 선다 |

- 배정하지 않은 것: 실제 기기가 저녁 9시에 울리는 것 — `notification-push`가 보내고 배포 뒤 손으로 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 일이 일어나는 순간 나가는 알림 — [`notification-emit`](notification-emit.md)
- 행을 기기로 보내는 것 — `notification-push`
- 교대 관련 시각 알림 — 2차다([roadmap](../../1-plan/roadmap.md#릴리스-목록))
- 알림 목록 화면 — [`notification-list`](notification-list.md)
