---
sources:
  - ../../2-design/modules/schedule/design.md#요청
  - ../../2-design/modules/schedule/design.md#근무-취소
  - ../../2-design/modules/schedule/design.md#근무-요청-보내기
  - ../../2-design/modules/schedule/design.md#요청에-답하기
  - ../../2-design/modules/schedule/design.md#근무-취소-요청과-판정
  - ../../2-design/modules/schedule/design.md#행위-밖의-실행-동작
  - ../../2-design/modules/schedule/README.md#sch-016
  - ../../2-design/modules/schedule/README.md#sch-017
  - ../../2-design/modules/schedule/README.md#sch-018
  - ../../2-design/modules/schedule/screens/schedule-admin.md#근무-요청-보내기
  - ../../2-design/modules/schedule/screens/schedule-admin.md#포지션과-자리
  - ../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커-문안
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무-요청-시트
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무-취소-시트
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무-요청-시트-짜임
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무-취소-시트-짜임
  - ../../2-design/modules/schedule/screens/schedule-worker.md#보낸-뒤
  - ../../2-design/modules/schedule/screens/schedule-worker.md#실패와-경합
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무-취소-시트-문안
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무-요청-시트-문안
  - ../../2-design/modules/schedule/screens/schedule-worker.md#달력-순--기본
  - ../../2-design/system/screens/approvals.md#목록
  - ../../2-design/system/screens/approvals.md#상세-시트
  - ../../2-design/system/screens/approvals.md#거절
  - ../../2-design/system/screens/approvals.md#목록-짜임
  - ../../2-design/system/screens/approvals.md#상세-시트-짜임
  - ../../2-design/system/screens/approvals.md#거절-짜임
  - ../../2-design/system/screens/approvals.md#목록-문안
  - ../../2-design/system/screens/approvals.md#상세-시트-문안
  - ../../2-design/system/screens/approvals.md#거절-문안
  - ../../2-design/modules/notification/design.md#행위-밖의-실행-동작
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/runtime.md#경쟁-조건-기본값
  - ../../2-design/system/runtime.md#무효화-표
  - ../../2-design/system/runtime.md#서버-시각
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/system/data-access.md#이름과-자리
  - ../../2-design/design-system/components.md#badge
  - ../../2-design/design-system/components.md#dialog와-바텀시트
  - ../../2-design/design-system/components.md#토스트
  - ../../2-design/design-system/writing.md#도메인-용어를-그대로-쓴다
---

# 근무 요청과 근무 취소를 만든다 — 구현 계획

## 입력 명세·기준

정본 셋이 갈라 든다. 요청의 데이터 모양은 [design.md의 요청](../../2-design/modules/schedule/design.md#요청)과 [근무 취소](../../2-design/modules/schedule/design.md#근무-취소), 관리자 쪽 화면은 [schedule-admin.md의 근무 요청 보내기](../../2-design/modules/schedule/screens/schedule-admin.md#근무-요청-보내기), 근무자 쪽 화면은 [schedule-worker.md의 근무 요청 시트](../../2-design/modules/schedule/screens/schedule-worker.md#근무-요청-시트-짜임)와 [근무 취소 시트](../../2-design/modules/schedule/screens/schedule-worker.md#근무-취소-시트-짜임), 판정 화면은 [approvals.md](../../2-design/system/screens/approvals.md)다. 규칙은 [SCH-016](../../2-design/modules/schedule/README.md#sch-016)·[SCH-017](../../2-design/modules/schedule/README.md#sch-017)·[SCH-018](../../2-design/modules/schedule/README.md#sch-018)이다.

쓰기 함수는 `send_work_request`·`respond_request`·`create_cancel_request`·`decide_cancel_request` 넷과 cron 하나 `expire_requests`다([design.md](../../2-design/modules/schedule/design.md#근무-요청-보내기)). 표는 [schedule-data](schedule-data.md)가 이미 냈다 — `requests`·`request_candidates`·`cancel_requests`.

선행 둘이다. [`schedule-assign`](schedule-assign.md)이 픽커의 체크박스와 하단 버튼 자리와 자리 카드의 배지 자리를 두고, [`schedule-worker`](schedule-worker.md)가 달력의 요청 온 날 칸과 날 시트의 요청 중 배지 자리를 둔다. **이 task가 그 빈 자리에 값을 채운다.**

정본에서 확인한 다섯이 plan의 방향을 정한다.

- **요청은 자리 단위고 답은 선착순이다.** [SCH-017](../../2-design/modules/schedule/README.md#sch-017)이 「먼저 수락한 사람이 배정되고 자리가 차면 나머지 요청은 마감된다」고 정했다. `respond_request`가 배정까지 한 트랜잭션에서 끝내야 둘이 동시에 눌러도 하나만 들어간다 — [`schedule-data`](schedule-data.md)가 낸 `(slot_id) where ended_at is null and kind = 'regular'` unique index가 마지막 문이고, 진 쪽이 `slot_full`을 받는다
- **자리를 채우는 길 다섯이 전부 요청을 닫는다.** [요청](../../2-design/modules/schedule/design.md#요청)이 「배정 추가·교대 승인·강제 변경·근무 요청 수락·날 닫기가 전부 그 자리의 살아 있는 `requests`를 닫는다」고 정했다. **그중 셋은 이미 다른 task가 만든 함수다** — `add_assignment`·`force_change`·`close_day`. 이 task가 그 셋을 `create or replace`로 고쳐 닫는 일을 넣는다
- **만료가 둘이다.** 48시간이 지나거나 근무 날이 시작되면 만료되고 **먼저 오는 쪽이 마감이다**([SCH-017](../../2-design/modules/schedule/README.md#sch-017)). `expires_at`을 넣을 때 두 시각 중 이른 쪽을 고른다 — cron이 그것만 보면 된다
- **수락 취소가 상태를 되돌린다.** `request_candidates.status`가 저장소에서 유일한 상태 열인 근거가 이것이다([요청](../../2-design/modules/schedule/design.md#요청)). 수락했다가 취소하면 답 안 한 상태로 돌아가야 해서 시각으로 못 나타낸다. **교대 쪽 규칙이라 이 task는 `status` 열을 쓰기만 하고 수락 취소 흐름은 swap이 만든다**
- **거절은 건건이 안 알린다.** 자리의 요청이 전부 거절·만료로 끝나면 그때 관리자에게 한 번 간다([근무 요청 시트 짜임](../../2-design/modules/schedule/screens/schedule-worker.md#근무-요청-시트-짜임)). 그 판정이 함수 안에 있다 — 마지막 후보가 답하는 순간과 cron이 마지막을 만료시키는 순간 둘 다에서 걸린다

`supabase/config.toml`에 pg_cron 설정이 없다. **이 task가 처음 켠다.**

## 완료 조건

### AC-01

**근무 요청 함수 둘.** `supabase/migrations/<날짜>_schedule_functions.sql`에 더한다. 둘 다 `security definer`·`set search_path = ''`다.

- `send_work_request(p_slot_id uuid, p_profile_ids uuid[])` — 첫 줄이 `is_admin()`, 아니면 `not_allowed`. `requests` 한 행(`kind = 'work'`, `slot_id`)과 받은 사람마다 `request_candidates` 행(`status = 'pending'`)을 넣는다
  - `expires_at`은 **`now() + 48시간`과 그 날 근무 시작 시각 중 이른 쪽**이다. `request_candidates.expires_at`도 같은 값이다
  - 그 자리에 이미 살아 있는 요청이 있으면 후보만 더한다 — 새 `requests` 행을 만들지 않는다. 거절·만료된 사람을 다시 고르면 그 후보 행을 `pending`으로 되돌린다
  - 자리가 이미 찼으면 `slot_full`. 이미 그날 배정이 있는 사람이 섞여 있으면 그 사람만 빼고 넣는다 — 목록이 낡아 생기는 일이라 전체를 실패시키지 않는다
  - 근무 시작이 지난 날이면 `window_closed`
- `respond_request(p_request_id uuid, p_accept boolean)` — 첫 줄이 `is_approved()`. 부른 사람의 `request_candidates` 행이 없으면 `not_allowed`
  - 요청이 닫혔거나(`closed_at`) 만료됐으면 `request_closed`
  - 거절이면 그 후보만 `declined`·`responded_at`. **남은 `pending` 후보가 하나도 없으면 요청을 닫고 「전부 소진」 알림 대상을 낸다**
  - 수락이면 **그 자리에 배정을 넣고 요청을 닫는 것까지 한 트랜잭션이다.** `add_assignment`와 같은 검사가 걸리는데 **신청 검사(`not_applied`)만 건너뛴다** — 요청이 그 문을 대신한다([SCH-016](../../2-design/modules/schedule/README.md#sch-016)). 제한 포지션 자격은 그대로 본다
  - 자리가 이미 찼으면 `slot_full`. unique index에 걸려도 같은 코드로 올린다
  - 요청을 닫을 때 남은 후보를 `declined`로 덮지 않는다 — 답 안 한 채 끝난 것과 거절한 것이 다르다. 화면은 `closed_at`이 있으면 「마감됨」으로 읽는다

### AC-02

**근무 취소 함수 둘.**

- `create_cancel_request(p_assignment_id uuid, p_reason text)` — `is_approved()`. 그 배정이 자기 것이 아니면 `not_allowed`
  - 사유가 빈 문자열이면 `invalid_reason`, 100자를 넘으면 같은 코드. 화면이 먼저 막지만 함수가 마지막 문이다
  - **근무 전날까지다** — 근무 날 당일부터는 `window_closed`([SCH-018](../../2-design/modules/schedule/README.md#sch-018))
  - 그 배정에 살아 있는 취소 요청(`decided_at is null`)이 있으면 `already_requested`
  - 그 배정이 이미 닫혔으면(`ended_at`) `stale` — 열어둔 사이 강제 변경이 있었다
  - **거절된 뒤 다시 요청할 수 있다.** 새 행이다([근무 취소](../../2-design/modules/schedule/design.md#근무-취소)). 횟수를 안 막는다 — 마감이 이미 막는다
- `decide_cancel_request(p_cancel_request_id uuid, p_approved boolean, p_reason text)` — `is_admin()`
  - 이미 판정됐으면 `already_decided`
  - 승인이면 `decision = 'approved'`·`decided_at`·`decided_by`를 찍고 **그 배정을 닫는다**(확정 뒤라 `ended_at`). 그 자리에 살아 있는 요청이 있으면 같이 닫는다
  - 거절이면 `decision = 'rejected'`고 `decision_reason`이 **필수다** — 비면 `invalid_reason`. 그 글이 근무자에게 그대로 간다
  - 근무는 그대로 남는다

`error-codes.ts`에 `request_closed`·`already_requested`·`invalid_reason`·`already_decided`가 든다. `slot_full`·`window_closed`·`not_allowed`·`stale`은 앞 task들이 이미 넣었다.

### AC-03

**자리를 채우는 길 셋이 요청을 닫는다.** 앞 task가 만든 함수를 `create or replace`로 고친다.

- `add_assignment` — 정규 배정이 들어가면 그 `slot_id`의 살아 있는 요청을 닫는다. 교육 배정은 자리를 안 먹으니 안 닫는다
- `force_change` — 새 배정이 들어간 자리의 요청을 닫는다
- `close_day` — 그 날의 모든 자리의 살아 있는 요청을 닫는다. [`schedule-data`](schedule-data.md)가 이미 그 줄을 넣었으면 그대로 두고 테스트만 더한다
- 교대 승인(`approve_swap`)은 swap 영역이다 — 그 task가 같은 일을 자기 함수에 넣는다. **이 plan이 그 자리를 [범위 밖](#범위-밖)에 남긴다**

닫기가 한 곳에 모이게 `internal.close_slot_requests(p_slot_id uuid)` 하나를 두고 셋이 그것을 부른다 — 같은 규칙이 세 벌 서지 않게 한다([이름과 자리](../../2-design/system/data-access.md#이름과-자리)).

### AC-04

**`expire_requests` cron.**

- `internal.expire_requests()` — 매 분 돈다. `expires_at`이 지난 `pending` 후보를 만료시키고, 남은 `pending`이 없는 요청을 닫는다. 닫을 때 「전부 소진」 알림 대상을 낸다
- `supabase/config.toml`에 pg_cron을 켜고 crontab 항목을 마이그레이션에 넣는다. **`internal` 스키마라 호출자 검사가 없다** — cron만 부른다([이름과 자리](../../2-design/system/data-access.md#이름과-자리))
- 근무 날 시작으로 만료되는 몫은 `expires_at`에 이미 들어 있다([AC-01](#ac-01)) — cron이 두 조건을 따로 보지 않는다
- **화면의 카운트다운은 로컬 계산이다.** `expires_at`과 서버 시각 오프셋으로 세고 0이 되면 버튼이 잠긴다([서버 시각](../../2-design/system/runtime.md#서버-시각)). cron이 매 분 도니 몇십 초 어긋나면 `request_closed`가 잡는다

### AC-05

**관리자 쪽 화면 — 요청 보내기와 상태.** [`schedule-assign`](schedule-assign.md)이 둔 자리를 채운다.

- 픽커 전체 보기의 미신청 줄에 체크박스가 붙는다. 고른 줄은 `bg.brand-solid` 면에 `fg.brand-contrast` 체크. 하나 이상 고르면 시트 하단에 「2명에게 근무 요청 보내기」가 선다 — **0명이면 버튼 자체가 없다**
- 누르면 → `send_work_request`. 시트가 닫히고 자리 카드에 Badge neutral 「요청 2건 대기 중」이 얹힌다. **카드 문구는 「비어 있어요」 그대로다**
- 같은 자리의 픽커를 다시 열면 미신청 줄에 상태가 선다 — 대기 중(체크박스 없음) · 거절함(체크박스 붙음) · 만료됨(체크박스 붙음). **메시지에 「요청」을 남긴다** — 같은 목록에 「신청 안 함」이 서 있어 방향이 안 갈리면 잘못 읽는다
- **남은 시간을 안 붙인다.** 대기 중인 줄은 어차피 안 눌리고 관리자가 정하는 것은 다시 보낼지뿐이다
- 자리가 차면 배지가 사라진다 — [AC-03](#ac-03)이 요청을 닫아서다. 화면이 따로 지우지 않는다

### AC-06

**근무자 쪽 화면 — 근무 요청 시트.** [`schedule-worker`](schedule-worker.md)가 둔 자리를 채운다.

- 달력의 요청 온 날 칸에 브랜드 점선이 돈다. 누르면 이 시트가 열린다. 알림 CTA로도 같은 `?date=`다
- 짜임: 제목 「근무 요청이 왔어요」 → 부제 「10월 17일(토) · 안내 · 10:00 – 18:00」 → 안내 한 줄 「바로 배정돼요」 → CTA 둘
- **제목이 교대·취소 시트의 짜임을 안 따른다** — 그 둘은 근무자가 자기 행위를 시작하는 시트고 이것은 받는 자리다
- CTA — 「어려워요」(secondary, 왼쪽)와 「근무할게요」(primary, 오른쪽), 폭 반반. **도메인 용어(「수락」·「거절」)를 안 쓴다**([writing.md](../../2-design/design-system/writing.md#도메인-용어를-그대로-쓴다)의 예외 조항)
- 수락 → `respond_request(true)`. 시트가 닫히고 그 날이 내 근무로 표시된다 — 달력 점과 명단에 바로 선다. **내게 알림이 안 온다**
- 거절 → `respond_request(false)`. 시트가 닫히고 끝이다
- **끝난 요청** — 제목이 「근무 요청이 끝났어요」, 부제는 그대로, 그 아래 「자리가 찼거나 기간이 지났어요」. 거절·수락 자리는 빈다
- **늦은 수락** — 누르는 사이 자리가 찼으면 `slot_full`이 온다. **다른 실패와 달리 오류 블록을 안 세운다** — 시트가 닫히고 토스트 「자리가 찼어요」다. 그 요청은 되살아나지 않아 시트에 남아도 할 일이 없다
- 같은 순간 달력이 갱신된다 — 그 칸이 「근무 요청 온 날」에서 「근무 없음(열린 날)」로 바뀌고 **달력 아래 줄이 「10월 17일 안내 자리는 다른 분이 맡았어요」로 바뀐다.** 토스트가 사라진 뒤에도 무슨 일이 있었는지 화면에 남는다

### AC-07

**근무자 쪽 화면 — 근무 취소 시트.**

- 날 시트의 「근무 취소」를 누르면 올라온다
- 짜임: 제목 「근무 취소 · 10월 10일(토) 안내」 → 부제 「관리자가 승인해야 취소돼요. 승인 전까지는 예정대로 근무예요」 → 사유 입력(여러 줄, 필수, 100자, 아래 카운터) → CTA 「취소 요청 보내기」
- 사유가 비면 CTA 비활성
- 보내면 → `create_cancel_request`. 성공하면 **[보낸 뒤](../../2-design/modules/schedule/screens/schedule-worker.md#보낸-뒤)**로 간다 — 시트가 닫히고 내 줄과 아코디언 날짜 줄에 Badge neutral 「취소 요청 중」이 서고 **버튼 둘이 비활성**이 된다. 달력 칸은 안 바뀐다 — 승인 전까지 근무가 그대로다
- 실패 — 통신이 끊기면 시트가 열린 채 CTA 위에 오류 블록 「보내지 못했어요. 다시 시도해주세요」고 **입력한 사유가 그대로 남는다**. `stale`이면 「이 근무가 바뀌었어요. 근무표를 다시 확인해주세요」
- 결과는 알림으로 온다. 이 화면은 다음 진입에서 최신 상태를 그린다 — **열어둔 화면을 실시간으로 갱신하지 않는다**

### AC-08

**판정 화면 — `/admin/approvals`.** 정본은 [approvals.md](../../2-design/system/screens/approvals.md)다.

- 목록에 사유와 근무 취소 요청이 **한 목록으로 섞인다**. 관리자 홈의 「승인할 일 · 3건」이 이 목록의 건수다 — [`schedule-admin`](schedule-admin.md#ac-03)이 자리만 두고 값이 여기서 찬다
- 줄을 누르면 상세 시트. 근무 취소 줄이면 날짜·포지션·사유가 서고 버튼 둘
- 승인 → `decide_cancel_request(true)`. 그 자리로 넘어간다 — `/admin/schedule?date=&from=approvals`. 빈 자리를 바로 채우라는 뜻이다
- 거절 → 거절 화면이 열려 이유를 받는다. **이유가 필수다** → `decide_cancel_request(false, p_reason)`. 목록에 머문다
- `already_decided`는 둘이 동시에 판정한 것이다 — 목록을 다시 읽고 그 줄을 지운다
- **사유 쪽(출근 인증 사유) 판정은 attendance 영역이다.** 이 task는 목록 틀과 근무 취소 줄까지다 — 사유 줄이 섞이는 자리는 그 task가 잇는다

### AC-09

**경쟁과 무효화.**

- `respond_request`는 **응답을 기다린다**([경쟁 조건 기본값](../../2-design/system/runtime.md#경쟁-조건-기본값)). 보내는 동안 버튼 둘이 잠긴다
- 성공하면 `['schedule']`·`['payroll']`·`['requests']`를 무효화한다. `send_work_request`·`create_cancel_request`·`decide_cancel_request`도 같다
- `request_closed`가 오면 요청 카드를 「마감됨」으로 바꾸고 `['requests']`를 다시 읽는다
- 카운트다운이 0이 되면 버튼이 잠긴다. **타이머가 화면을 다시 읽지 않는다** — 잠그기만 하고 값은 다음 진입에 갱신된다

### AC-10

**테스트.**

- unit: 카운트다운 계산(서버 오프셋), 요청 상태 셋과 체크박스 유무 판정, 「전부 소진」 판정, 끝난 요청 시트 갈래, 달력 아래 줄의 사건 문구
- integration: 함수 넷의 호출자 검사와 오류 코드 전부. 특히 — **선착순**(둘이 같은 자리에 수락하면 하나만 통과하고 나머지가 `slot_full`), `respond_request`가 신청 검사만 건너뛰고 자격은 보는 것, 거절이 마지막 후보면 요청이 닫히는 것, `expires_at`이 48시간과 근무 시작 중 이른 쪽인 것, `expire_requests`가 지난 후보를 만료시키고 요청을 닫는 것, `add_assignment`·`force_change`·`close_day`가 요청을 닫는 것, `create_cancel_request`가 당일에 `window_closed`고 거절 뒤 다시 되는 것, `decide_cancel_request`가 승인 시 배정을 닫고 거절 시 이유를 요구하는 것
- e2e(`tests/e2e/schedule-requests.spec.ts`): 관리자가 픽커에서 둘을 골라 요청을 보내고 자리 카드에 배지가 서는지 → 근무자가 달력의 점선 날을 눌러 「근무할게요」로 배정되는지 → 다른 근무자가 같은 요청을 눌러 「자리가 찼어요」 토스트를 보는지 → 근무자가 날 시트에서 취소 요청을 보내 「취소 요청 중」 배지가 서는지 → 관리자가 `/admin/approvals`에서 승인해 자리가 비는지

### AC-11

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run`·`pnpm build && pnpm e2e` 전부 초록. `sian-auditor`가 `schedule-admin.sian.html`·`schedule-worker.sian.html`·`approvals.sian.html`과 문서를 대조한다 — backlog의 [`sian-sync`](../../backlog.md)가 approvals 시안에 적어둔 어긋남(앱바 글자·거절 시트 여백 다섯·머리말 주석·「보내기 실패」 상태)과 worker 시안의 「취소 요청 중」 목업을 그때 같이 잡는다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_schedule_functions.sql` | 함수 넷, `close_slot_requests`, 셋의 `create or replace` | AC-01~AC-03 |
| `supabase/migrations/<날짜>_schedule_cron.sql` · `supabase/config.toml` | `expire_requests`와 crontab, pg_cron 켜기 | AC-04 |
| `src/shared/api/error-codes.ts` | `request_closed`·`already_requested`·`invalid_reason`·`already_decided` | AC-01·AC-02 |
| `src/entities/schedule/dals/send-work-request.ts`·`respond-request.ts`·`create-cancel-request.ts`·`decide-cancel-request.ts`·`get-slot-requests.ts`·`get-pending-approvals.ts`·`__tests__/` | 쓰기 넷, 읽기 둘 | AC-05~AC-08 |
| `src/screens/schedule-admin/ui/*.tsx` · `model/*.ts` | 픽커 체크박스·보내기 버튼·요청 상태 줄·자리 카드 배지 | AC-05 |
| `src/screens/schedule-worker/ui/*.tsx` · `model/*.ts` | 근무 요청 시트·근무 취소 시트·요청 중 배지·달력 점선과 아래 줄 | AC-06·AC-07 |
| `src/screens/approvals/ui/*.tsx` · `src/app/admin/approvals/page.tsx` | 목록·상세 시트·거절 | AC-08 |
| `src/features/schedule/*.ts`·`__tests__/` | mutation과 무효화, 카운트다운 | AC-09 |
| `tests/e2e/schedule-requests.spec.ts` | e2e | AC-10 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. [`schedule-assign`](schedule-assign.md)과 [`schedule-worker`](schedule-worker.md)가 둘 다 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-09를 층에 배정한다. **선착순은 integration이 두 세션으로 본다** — 그 배정을 명시한다
2. `integration-test-writer`가 함수 넷과 cron의 실패 테스트를 먼저 쓴다. 이 task의 위험이 대부분 거기 있다
3. `unit-test-writer`·`e2e-test-writer`가 잇는다
4. `implementer`가 함수 → `close_slot_requests`와 셋의 고침 → cron → dal → 관리자 픽커 → 근무자 요청 시트 → 근무자 취소 시트 → 판정 화면 순으로 초록을 만든다. **요청 보내기가 서야 답할 것이 생기고, 답이 서야 판정할 것이 생긴다**
5. `sian-auditor`가 시안 셋과 문서를 대조한다
6. `attendance` 행에 「approvals 목록에 사유 줄을 잇는다」를 적는다. swap 행에 「`approve_swap`이 `close_slot_requests`를 부른다」를 적는다

## 리스크·전환·되돌리기

- **선착순이 이 저장소에서 처음 진짜 경쟁하는 자리다.** 둘이 같은 순간에 수락하면 unique index가 하나를 떨군다. 함수가 그 예외를 잡아 `slot_full`로 올려야 하고, 안 잡으면 raw Postgres 오류가 화면까지 간다. integration이 두 세션으로 본다
- **pg_cron을 처음 켠다.** 로컬 Supabase에서 확장을 켜고 crontab을 넣는 것이 CI에서도 돌아야 한다. `supabase db reset`이 통과하는지가 첫 문이고, cron이 실제로 도는지는 시간에 걸려 integration이 **함수를 직접 불러** 본다 — 스케줄러가 부르는 것까지는 안 본다
- **`expires_at`에 두 시각이 들어간다.** 48시간과 근무 시작 중 이른 쪽인데, 근무 시간이 바뀌면(`set_day_hours`) 이미 나간 요청의 만료가 낡는다. **소급해서 안 고친다** — 근무 시간을 당기는 일은 드물고, cron이 지난 뒤 만료시키는 것이라 늦어질 뿐 틀리지 않는다. 그 판단을 리스크로 남긴다
- **셋을 `create or replace`로 고친다.** `add_assignment`·`force_change`·`close_day`가 다른 task의 것이라 그쪽 테스트가 이 변경으로 깨질 수 있다. 요청이 없는 경우에 아무것도 안 하게 짜면 기존 테스트가 그대로 통과한다
- **approvals 목록이 반쪽으로 선다.** 사유 줄이 attendance 뒤라 이 PR 시점에는 근무 취소만 뜬다. 빈 상태 문구가 「승인할 일이 없어요」라 반쪽인 줄이 화면에서 안 보인다 — 그 task가 잇는 자리를 backlog에 적는다
- **수락 취소가 없다.** `request_candidates.status`가 되돌릴 수 있게 생겼지만 그 흐름은 swap의 [SWP-008](../../2-design/modules/swap/README.md)이다. 근무 요청에는 수락 취소가 없다 — 수락이 곧 배정이라 되돌리려면 근무 취소 요청을 낸다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 둘이 같은 자리에 들어간다 | integration `src/entities/schedule/dals/__tests__/respond-request.integration.test.ts`(예정), 두 세션 | `pnpm test:integration:run` | 하나만 통과하고 나머지가 `slot_full` |
| AC-01 | 신청 안 한 사람이 수락으로도 못 들어간다 | integration 위 | 위와 같다 | 신청 검사만 건너뛰고 자격은 본다 |
| AC-01 | 전부 거절인데 요청이 안 닫힌다 | integration 위 | 위와 같다 | 마지막 후보가 거절하면 `closed_at`이 찍힌다 |
| AC-03 | 자리가 찼는데 배지가 남는다 | integration `add-assignment.integration.test.ts`(예정) | 위와 같다 | 배정이 들어가면 그 자리 요청이 닫힌다 |
| AC-04 | 만료가 안 돈다 | integration `expire-requests.integration.test.ts`(예정) | 위와 같다 | 지난 후보가 만료되고 요청이 닫힌다 |
| AC-04 | `db reset`이 cron에서 깨진다 | — | `supabase db reset` | 오류 없이 돈다 |
| AC-02 | 당일에 취소 요청이 들어간다, 거절 이유 없이 거절된다 | integration `cancel-request.integration.test.ts`(예정) | `pnpm test:integration:run` | `window_closed`·`invalid_reason`, 승인이 배정을 닫는다 |
| AC-06 | 늦은 수락에 오류 블록이 선다 | e2e `tests/e2e/schedule-requests.spec.ts`(예정) | `pnpm build && pnpm e2e` | 시트가 닫히고 토스트, 달력 아래 줄이 사건을 말한다 |
| AC-05·AC-07·AC-08 | 흐름이 끊긴다 | e2e 위 spec | 위와 같다 | 보내기 → 수락 → 취소 요청 → 승인 한 줄기 |
| AC-11 | 시안이 문서와 어긋난다 | `sian-auditor` | — | 어긋남 없음 |

- 배정하지 않은 것: cron 스케줄러가 실제로 매 분 부르는지 — 시간에 걸려 함수 호출까지만 본다. 푸시가 실제로 도착하는지 — 알림 영역의 것이다
- 막힌 것: approvals 목록의 사유 줄은 `attendance` 뒤에 찬다

## 범위 밖

- 교대 요청·수락·승인·수락 취소와 `approve_swap`·`create_swap_request` — swap 영역. **`approve_swap`이 `close_slot_requests`를 부르는 것은 그 task가 넣는다**
- 출근 인증 사유와 approvals 목록의 사유 줄 — attendance 영역
- 알림 발송과 푸시 — 알림 영역. 이 task는 알림 대상을 내는 데까지다
- `emit_reminders`·`retry_push` cron — 알림 영역. 이 task는 `expire_requests` 하나만 켠다
- 자리·배정·픽커 자체 — [`schedule-assign`](schedule-assign.md)
- 달력·날 시트 자체 — [`schedule-worker`](schedule-worker.md)
- 타입 생성 — [`types-generation`](../../backlog.md)
