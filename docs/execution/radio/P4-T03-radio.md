# P4-T03 RADIO 개발 설계

- 상태: Sealed
- revision: 2
- 기획 승인: user, 2026-08-16
- 개발 설계 승인: user, 2026-08-16 (revision 1) · 2026-08-17 (revision 2)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-16 | 최초 작성. 기획 결정 4건(일괄 오픈당 1건, 활성 근무자 전원, 변경 3종, 전후 합집합)의 구현 설계. |
| 2 | 2026-08-17 | 검증 high 3건 수정을 위한 재봉인(사용자 승인). F-03: 배정 변경 수신자를 대상 포지션 한정에서 **스케줄 전체 전후 합집합**으로 확정(사용자 결정) — 다른 포지션 배정자·교육생 수신 단언 추가. F-01·F-02: 알림 팬아웃이 기존 e2e 정리와 충돌(재현 확정) — 워커 삭제 헬퍼가 프로필 삭제 전 수신 알림을 정리하고, 알림 단언은 자기 스케줄 한정으로 강건화. 허용 경로에 기존 spec 2개 한정 추가. |

- 관련 spec: PRD:AC-11, PRD 8장(관리자 변경)·9장(알림), DOMAIN:NOTIFICATIONS(RecruitmentOpened·ConfirmedScheduleRevised), ADR:0005(멱등성 키·같은 트랜잭션)
- 적용 깊이: 중간 — 마이그레이션 1개(알림 helper + RPC 4종 재정의), 딥링크 screen 1종 확장(타입·파서·SW·알림함 클라이언트), 신규 화면 없음.
- test mode: tdd
- 예정 check IDs: notification-recipient(수신자·멱등 pgTAP + 파서 단위), confirmed-change-e2e(변경·모집 알림과 딥링크 e2e)

## 전제

- 기획 승인(2026-08-16)이 소유한 결정을 다시 열지 않는다: 모집 오픈 알림은 일괄 오픈 1회당 1건·활성 근무자 전원, 변경 알림은 시간·예식·배정 3종(필요 인원 제외)·수신자는 변경 전후 배정자·교육생 합집합, 확정 취소 알림은 P4-T04 이월.
- 코드 대조 확정 사실(HEAD ee0c01c): `open_recruitment_schedules`(20260807050000)는 schedules 생성과 `schedule_opened` 감사만 하고 알림·수신자 계산이 없다. 확정 후 변경의 revision 단일 관문은 `bump_confirmed_revision`(20260817000000)이고 호출자는 5종 — ceremonies·planned_times·requirement 2종·assignments(최종본 20260818000000). `cancel_confirmed_schedule`만 revision 미증가. 알림 멱등성 키는 notifications의 `unique (event_type, aggregate_id, recipient_id, revision)` + `on conflict do nothing`이며 outbox 행은 신규 알림에만 동반 기록(20260819000000 confirm_schedule의 CTE 패턴). event_type은 check 없는 text, 현재 유일 값 `schedule_confirmed`(수신자 배정자∪교육생). 딥링크 허용 screen은 `schedule-detail`·`pay` 2종 — `NotificationTarget` 타입(entities/notification/model/notification-item.ts), 목록 파서(entities/notification/api/list-notifications.ts, 미지 screen은 행 제외+로그), SW(public/push-service-worker.js, 미지 screen은 /notifications 폴백), 알림함 클라이언트(views/notifications/ui/NotificationsPageClient.tsx의 인라인 삼항 — 클릭 이동은 P4-T01이 이미 구현). 활성 근무자 판별은 `is_active_worker(uuid)`(= profiles.status active인 worker). no-op 저장도 CONFIRMED면 revision이 오르는 것이 기존 구현이다. e2e 밴드 마지막 사용은 561~592(pushSubscription).

## Requirements

### 범위와 비목표

범위: 마이그레이션 1개 — 알림 기록 helper 함수 1개 + `open_recruitment_schedules`·`replace_schedule_ceremonies`·`set_schedule_planned_times`·`replace_position_assignments` 4종 재정의(알림 블록 추가만). 딥링크 `{ screen: "schedule", month }` 신설 — 타입·목록 파서·경로 계산 model 함수 신설·알림함 클라이언트·SW 4곳 정합. pgTAP 26번. e2e — 확정 알림 행 클릭 → 상세 이동(T01 이관분의 링크 확인), 모집 오픈 알림 수신·클릭 → 일정 화면(밴드 594~625).

비목표: 확정 취소 알림(P4-T04 이월), 요청 계열 알림(P4-T04~06), outbox 소비·실발송·재시도(P4-T08), requirement 변경 알림(기획 제외), 알림 문구 관리 화면, 새 테이블·컬럼·enum.

### 불변 규칙

- 알림·outbox 기록은 해당 변경과 **같은 트랜잭션**이다(ADR-0005). 실패 시 변경도 알림도 함께 롤백된다.
- 멱등성은 기존 키 `(event_type, aggregate_id, recipient_id, revision)` + `on conflict do nothing`을 그대로 쓴다. 새 event_type 값은 `recruitment_opened`·`schedule_revised` 둘뿐(DOMAIN 사건명과 대응).
- 모집 오픈 알림의 aggregate_id는 **그 일괄 오픈이 만든 스케줄 중 최소 work_date 행의 id**, revision은 1이다 — 같은 배치 재실행은 스케줄 unique 충돌로 실패하므로 부분 재시도에서도 수신자당 1건이 유지된다. 수신자는 `is_active_worker` 통과자 전원, target은 `{"screen":"schedule","month":"<최소 work_date의 YYYY-MM>"}`.
- 변경 알림의 aggregate_id는 schedule_id, revision은 `bump_confirmed_revision` 반환값이다. 저장 1회 = revision 1 = 수신자당 알림 1건(PRD 8장). no-op 저장도 revision이 오르는 기존 구현을 따라 알림을 만든다 — 알림만 억제하는 분기를 추가하지 않는다.
- 변경 알림 수신자: 배정 변경은 **변경 전 스케줄 전체 로스터(배정자∪교육생)와 변경 후 스케줄 전체 로스터의 합집합**이다 — 대상 포지션 밖의 동료도 받는다(revision 2, 사용자 결정). 시간·예식 변경은 현재 배정자∪교육생. requirement RPC 2종과 cancel_confirmed_schedule은 알림 코드 무추가.
- 기록 helper는 confirm_schedule의 CTE 패턴(신규 알림만 outbox 동반)을 함수화한 것 하나로 통일하고, 클라이언트 롤이 직접 호출할 수 없게 revoke한다. 기존 confirm_schedule은 재작성하지 않는다(봉인된 P4-T01 산출 무수정).
- 새 screen `schedule`의 경로 계산은 entities/notification model의 순수 함수가 앱 쪽 정본이다 — 알림함 클라이언트의 인라인 삼항을 이 함수로 대체한다. SW는 독립 스크립트 제약(P4-T02 결정)상 같은 규칙을 인라인으로 갖되 단위 테스트가 양쪽을 같은 케이스로 단언한다.
- RPC 시그니처·반환·기존 오류 코드 무변경 — 서버 액션 파일 4종은 손대지 않는다.

### 정지 조건

- 알림 블록 추가가 4종 RPC의 기존 본문(차단·검증·감사·반환) 수정을 요구하는 경우 — 허용은 알림 insert 블록과 그에 필요한 선언 추가뿐.
- `NotificationTarget` 확장이 notification-row 등 `src/shared/ui/**` 변경을 요구하는 경우.
- 모집 오픈 수신자 계산에 새 인덱스·테이블이 필요하다고 판단되는 경우(활성 근무자 수 규모에서 불필요 전제).

### 기술 인수 조건

1. 모집 오픈: 활성 근무자마다 정확히 1건(`recruitment_opened`, aggregate=최소 work_date 스케줄, revision 1), pending·dormant·departed·rejected·admin 전용 계정은 미수신, 같은 알림 재기록 시도는 흡수되고 outbox도 늘지 않는다(pgTAP — 값 단언).
2. 배정 변경: 빠진 배정자·들어온 배정자·유지 배정자·전후 교육생 그리고 **같은 스케줄 다른 포지션의 배정자·교육생**이 모두 수신(스케줄 전체 전후 합집합, revision 2), 스케줄에 배정되지 않은 근무자 미수신, revision이 bump 반환값과 일치(pgTAP — 다른 포지션 수신 단언은 RED 먼저).
3. 시간·예식 변경: 현재 배정자∪교육생 수신, no-op 저장도 새 revision으로 1건(pgTAP).
4. 제외 경로: requirement 변경 저장과 확정 취소는 알림 0건(pgTAP).
5. 멱등·트랜잭션: 같은 (event_type, aggregate, recipient, revision) 재삽입 무중복, 변경 실패 시 알림·outbox 롤백(pgTAP), helper 직접 호출은 클라이언트 3롤 거부(pgTAP).
6. 딥링크 확장: `{screen:"schedule", month}`가 타입·파서에서 유효(월 형식 불량은 기존 미지 screen 처리), 경로 계산 순수 함수가 `/schedule?month=<month>`·기존 2종·미지 폴백을 반환(단위 — RED 먼저), SW 단위 테스트가 같은 케이스(schedule → 경로, 미지 폴백)를 실파일로 단언.
7. e2e: 확정 알림 행 클릭 → `/schedule/<date>` 이동(T01 이관 링크 확인), 모집 일괄 오픈 후 근무자 알림함에 오픈 알림 1건 표시·클릭 → 일정 화면(밴드 594~625, splitBand).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 모집 오픈 | 테스트함 — 수신자·건수·target 값 단언 | 테스트함 — 비활성 상태 4종 미수신 | 테스트함 — 여러 날짜 중 최소 work_date aggregate | 테스트함 — admin 전용 미수신 | 테스트함 — 재기록 흡수·outbox 불증 | 해당 없음 — 배치 재실행은 스케줄 unique가 차단 |
| 2·3 변경 알림 | 테스트함 — 3종 각 수신자 단언 | 테스트함 — 무관 근무자 미수신 | 테스트함 — 전후 합집합(빠짐·추가·유지·교육생), no-op 저장 | 해당 없음 — 기존 RPC 권한 무변경 | 테스트함 — 같은 revision 재삽입 무중복 | 해당 없음 — bump의 행 잠금이 기존 보장 |
| 4 제외 경로 | 해당 없음 — 부재 단언이 본체 | 테스트함 — requirement·취소 알림 0건 | 해당 없음 — 이진 분기 | 해당 없음 — 기존 권한 | 해당 없음 — 생성 없음 | 해당 없음 — 생성 없음 |
| 5 멱등·트랜잭션 | 해당 없음 — 실패 경로가 본체 | 테스트함 — 롤백 동반 | 해당 없음 — 키 4요소는 AC1·2에서 값 단언 | 테스트함 — helper 3롤 거부 | 테스트함 — on conflict 흡수 | 해당 없음 — unique 제약이 DB 경계 강제 |
| 6 딥링크 | 테스트함 — schedule 경로·기존 2종 | 테스트함 — 미지 screen·월 형식 불량 폴백 | 테스트함 — 파서 행 제외 vs SW 폴백 각각 | 해당 없음 — 표시 계층 | 해당 없음 — 순수 함수 | 해당 없음 — 순수 함수 |
| 7 e2e | 테스트함 — 확정 링크·오픈 알림 여정 | 해당 없음 — 실패 분기는 단위·pgTAP 소유 | 해당 없음 — 밴드 594~625 격리 | 테스트함 — 근무자 계정 시점 | 해당 없음 — 단위가 소유 | 해당 없음 — 단일 여정 |

- 보충 위험: **기존 테스트 단언 대조** — notifications e2e(528~559 밴드)는 mock이 아닌 확정 알림 실데이터 기준이므로 새 알림 종류가 기존 목록 단언을 깨지 않게 신규 시나리오는 전용 밴드(594~625)에서만 스케줄을 만든다. **SW 파일 수정**은 P4-T02 산출(public/push-service-worker.js)의 screen 분기 1곳 추가와 그 단위 테스트 확장에 한정한다. **NotificationsPageClient**는 인라인 삼항을 model 함수 호출로 바꾸는 1곳이다. **알림 팬아웃과 e2e 격리(revision 2)** — 알림 행이 profiles를 cascade 없이 참조하므로 `deleteWorkerSessions`는 프로필 삭제 전 그 프로필 수신 알림을 정리한다(전 spec 공통 해소). 모집 팬아웃은 병렬 spec의 활성 워커 전원에게 행을 만들므로, 알림 개수·목록 단언은 자기 스케줄(aggregate) 한정으로 쓰고 전역 0 단언을 두지 않는다 — 기존 notifications.spec의 배지 단언도 같은 원칙으로 정합화한다.

### DEV-* 적용 상태

- DEV-SEC: 기본 적용 — helper는 revoke로 직접 호출 차단, 재정의 RPC들은 기존 definer·search_path 유지. 알림 본문에 PII 없음(날짜·문구만).
- DEV-DATA·DEV-SSOT: 기본 적용 — 새 테이블·컬럼 없음, 수신자 정본은 assignments·assignment_trainees·profiles 기존 행.
- DEV-TIME: 기본 적용 — 월 표기는 work_date(달력 값) 기반 to_char, 새 경계 계산 없음.
- DEV-CACHE: 기본 적용 — 알림함 조회 경로 무변경.
- DEV-OFFLINE: 해당 없음.
- DEV-CODE-07·주석 금지·barrel 금지: 기본 적용.

## Architecture

- `supabase/migrations/20260821000000_recruitment_change_notifications.sql` — helper `notify_schedule_recipients(event_type, aggregate uuid, target_revision int, recipient_ids uuid[], title text, body text, target jsonb)`(confirm_schedule CTE 패턴 함수화, revoke 전체) + 4종 RPC 재정의(기존 본문 끝에 수신자 계산·helper 호출 블록만 추가).
- `src/entities/notification/model/notification-item.ts` — `NotificationTarget`에 `{ screen: "schedule"; month: string }` 추가.
- `src/entities/notification/model/notification-path.ts`(신설) — target → 경로 순수 함수(`/schedule/<date>`·`/pay`·`/schedule?month=`·폴백 `/notifications`), 단위 필수.
- `src/entities/notification/api/list-notifications.ts` — 파서에 schedule screen 허용 추가.
- `src/views/notifications/ui/NotificationsPageClient.tsx` — 인라인 경로 삼항을 model 함수로 대체.
- `public/push-service-worker.js` — isNotificationTarget·resolvePushClickPath에 schedule 분기 추가(독립 스크립트 유지), `src/features/push/lib/__tests__/push-service-worker.test.ts` 케이스 확장.
- e2e `tests/e2e/recruitment-notifications.spec.ts`(신설, 밴드 594~625) + `tests/e2e/support/work-date-band.ts` 밴드 1행.

## Data model

- 테이블·컬럼·enum·RLS 무변경. 함수만 추가·재정의. event_type 신규 값 2종은 text 그대로(check 미추가 — 기존 관례).
- 되돌림: 재정의 RPC를 직전 버전으로 재적용, helper drop. 데이터 마이그레이션 없음.

## Interface

- RPC 시그니처·반환·오류 코드 무변경, 서버 액션 4종 무수정.
- 알림 행 계약 `{ title, body, target }` 유지 — 신규 target `{"screen":"schedule","month"}`는 T08 소비자도 같은 계약으로 읽는다.
- 문구: 모집 오픈 title `새 근무 모집이 열렸어요`, body `to_char(min, 'FMMM"월"')||' '||to_char(min,'FMDD"일"')||'~'||…||' 근무 모집이 열렸어요'` 형식(구현이 확정 알림의 to_char 관례를 따름). 변경 title `확정 근무가 변경됐어요`, body는 `FMMM"월 "FMDD"일"` + `' 근무 내용이 바뀌었어요'`.

## Optimizations

- 수신자 계산은 사건당 1쿼리(활성 근무자 select 또는 전후 배정 union) — 런타임 신규 왕복 없음(모두 기존 RPC 트랜잭션 내부).
- 알림함·SW는 분기 1곳 추가뿐, 렌더 비용 불변.

## 변경 허용 경로

```
supabase/migrations/20260821000000_recruitment_change_notifications.sql
supabase/tests/26-recruitment-change-notifications.test.sql
src/entities/notification/model/notification-item.ts
src/entities/notification/model/notification-path.ts
src/entities/notification/model/__tests__/**
src/entities/notification/api/list-notifications.ts
src/entities/notification/api/__tests__/**
src/views/notifications/ui/NotificationsPageClient.tsx
src/views/notifications/ui/__tests__/**
public/push-service-worker.js
src/features/push/lib/__tests__/push-service-worker.test.ts
tests/e2e/recruitment-notifications.spec.ts
tests/e2e/post-confirmation-changes.spec.ts
tests/e2e/notifications.spec.ts
tests/e2e/support/**
docs/execution/runs/P4-T03/**
docs/execution/radio/P4-T03-radio.md
docs/execution/phases/index.jsonl
```

- 용도 한정: `NotificationsPageClient.tsx`는 경로 계산 대체 1곳, `public/push-service-worker.js`는 schedule screen 분기 추가만(다른 동작 무수정), `tests/e2e/support/**`는 밴드 1행(594~625)과 헬퍼 재사용, 기존 `list-notifications.ts`는 screen 허용 확장과 그 테스트 정합만, `src/views/notifications/ui/__tests__/**`는 경로 계산 대체에 따른 정합 갱신만(기존 단언 대조 결과 mock target 수준이라 영향 낮음 — 2026-08-16 확인), `tests/e2e/post-confirmation-changes.spec.ts`·`tests/e2e/notifications.spec.ts`는 알림 팬아웃 격리(정리·자기 스케줄 한정 단언) 정합 갱신에만 쓴다(revision 2 — 다른 시나리오 무수정).
- `docs/product/**`·`docs/execution/reviews/**`는 조정자 몫. 위 밖이 필요하면 멈추고 반환한다.

## 미결 사항

- outbox 소비 시 모집 오픈 푸시의 대량 발송 배치(활성 근무자 전원 × 1건)는 P4-T08 소비자 설계 몫.
- 확정 취소 알림 여부는 P4-T04 기획 소유(이월 기록 완료).
- 변경 알림의 문구 세분화(무엇이 바뀌었는지 종류 표기)는 MVP 밖 — 단일 문구로 시작하고 필요 시 후속 제안.
