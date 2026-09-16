---
sources:
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세
  - ../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#포지션과-자리
  - ../../2-design/modules/schedule/screens/schedule-admin.md#잠금과-구조-변경
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-색
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-글자
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-여백과-모양
  - ../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#사람-시트
  - ../../2-design/modules/schedule/screens/schedule-admin.md#자격-없는-사람
  - ../../2-design/modules/schedule/screens/schedule-admin.md#빈-목록
  - ../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커-색
  - ../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커-글자
  - ../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커-여백과-모양
  - ../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤-날-상세
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-문안
  - ../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커-문안
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-모션
  - ../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커-모션
  - ../../2-design/modules/schedule/design.md#자리-늘리기줄이기겸임
  - ../../2-design/modules/schedule/design.md#배정과-강제-변경
  - ../../2-design/modules/schedule/design.md#자격-주기
  - ../../2-design/modules/schedule/design.md#배정
  - ../../2-design/modules/schedule/design.md#자격
  - ../../2-design/modules/schedule/README.md#sch-011
  - ../../2-design/modules/schedule/README.md#sch-012
  - ../../2-design/modules/schedule/README.md#sch-013
  - ../../2-design/modules/schedule/README.md#sch-014
  - ../../2-design/modules/schedule/README.md#sch-015
  - ../../2-design/modules/schedule/README.md#sch-016
  - ../../2-design/modules/schedule/README.md#sch-018
  - ../../2-design/modules/account/README.md#acc-002
  - ../../2-design/system/runtime.md#경쟁-조건-기본값
  - ../../2-design/system/runtime.md#무효화-표
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/design-system/components.md#listrow
  - ../../2-design/design-system/components.md#badge
  - ../../2-design/design-system/components.md#dialog와-바텀시트
  - ../../2-design/design-system/foundation/motion.md
  - ../../2-design/design-system/writing.md#숫자와-단위
---

# 자리와 배정을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [schedule-admin.md](../../2-design/modules/schedule/screens/schedule-admin.md)의 날 상세와 사람 픽커다 — [날 상세 짜임](../../2-design/modules/schedule/screens/schedule-admin.md#날-상세-짜임)·[포지션과 자리](../../2-design/modules/schedule/screens/schedule-admin.md#포지션과-자리)·[잠금과 구조 변경](../../2-design/modules/schedule/screens/schedule-admin.md#잠금과-구조-변경)·[사람 픽커 짜임](../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커-짜임)·[사람 시트](../../2-design/modules/schedule/screens/schedule-admin.md#사람-시트)·[자격 없는 사람](../../2-design/modules/schedule/screens/schedule-admin.md#자격-없는-사람)·[빈 목록](../../2-design/modules/schedule/screens/schedule-admin.md#빈-목록)·[확정 뒤 날 상세](../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤-날-상세)와 그 색·글자·여백 표, 문안 표 둘, 모션 둘이다. 쓰기 함수는 [design.md](../../2-design/modules/schedule/design.md#자리-늘리기줄이기겸임)의 `add_slot`·`remove_slot`·`merge_slots`·`split_slot`, [배정과 강제 변경](../../2-design/modules/schedule/design.md#배정과-강제-변경)의 `add_assignment`·`remove_assignment`·`force_change`, [자격 주기](../../2-design/modules/schedule/design.md#자격-주기)의 `grant_position` 여덟이고 **이 task가 처음 만든다** — [schedule-data](schedule-data.md)가 표와 뼈대 함수 일곱까지만 냈다. 규칙은 [SCH-011](../../2-design/modules/schedule/README.md#sch-011)~[SCH-016](../../2-design/modules/schedule/README.md#sch-016)·[SCH-018](../../2-design/modules/schedule/README.md#sch-018)이다.

선행은 [`schedule-admin`](../../backlog.md)이다. 날 상세의 껍데기 — 앱바·근무 시간 줄·근무 신청 줄·「이 날 닫기」 — 를 그 task가 세우고 포지션 아홉 줄 자리에 배정 수만 센 임시 줄을 둔다. **이 task의 첫 AC가 그 임시 줄을 지우는 것이다.**

정본에서 확인한 다섯이 plan의 방향을 정한다.

- **자리와 배정이 다른 표다.** `slots`가 「몇 명이 필요한가」고 `assignments`가 「누가 맡는가」다([배정](../../2-design/modules/schedule/design.md#배정)). 구조 변경 셋(삭제·겸임·추가)은 `slots`를 만지고 사람 넣기·빼기는 `assignments`를 만진다. 잠금이 막는 것이 앞의 셋뿐인 근거가 이 갈림이다 — 잠긴 줄에서도 사람은 넣고 뺀다
- **확정 전과 뒤가 함수가 아니라 화면에서 갈린다.** [배정](../../2-design/modules/schedule/design.md#배정)이 「확정 전에 빼면 행을 지우고 확정 뒤에는 `ended_at`을 찍는다」고 정했고 그 갈림은 함수 안에서 `confirmed_at`을 보고 난다. 화면 쪽 갈림은 **확인 시트와 알림**이다 — 확정 전에는 확인이 없고 확정 뒤에는 모든 변경에 시트가 선다([확정 뒤 날 상세](../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤-날-상세))
- **겸임은 자리 하나에 포지션 둘이다.** `slots.positions`가 배열이라 합침은 한 행의 배열을 늘리고 다른 행을 닫는 일이다([SCH-015](../../2-design/modules/schedule/README.md#sch-015)). 화면의 「받은 쪽 줄에만 선다」와 「내준 쪽 줄의 분모가 준다」가 그 모양에서 바로 나온다 — 화면이 따로 세지 않는다
- **끌기가 motion.md 밖이다.** [규칙과 부딪힌 자리](../../2-design/modules/schedule/screens/schedule-admin.md#규칙과-부딪힌-자리)가 「직접 조작은 어느 조항에도 없다」고 적었고, 문서는 집는 순간과 놓는 순간에만 토큰을 걸고 따라가는 동안은 값 없이 뒀다. 구현도 그대로 한다 — 임의로 duration을 채우지 않는다
- **경쟁이 실제로 일어난다.** [경쟁 조건 기본값](../../2-design/system/runtime.md#경쟁-조건-기본값)이 「배정 추가·제거·강제 변경·요청 수락·확정은 응답을 기다린다. 잠금은 없다」고 정했다. `stale`이 오면 「이 근무가 바뀌었어요」 시트를 닫지 않고 그 자리만 다시 읽는다 — 관리자가 고치던 나머지가 사라지지 않게

지금 코드에는 날 상세가 [`schedule-admin`](schedule-admin.md)이 세운 껍데기까지다. `slots`·`assignments`·`position_grants` 표와 `open_slots` 뷰는 [`schedule-data`](schedule-data.md)가 낸다. 끌어서 옮기는 조각이 `src/shared/ui/`에 없다 — 이 화면이 저장소에서 처음 쓴다.

## 완료 조건

### AC-01

**쓰기 함수 여덟이 선다.** `supabase/migrations/<날짜>_schedule_functions.sql`에 더한다 — [schedule-data](schedule-data.md)가 만든 파일이고 배포한 적이 없어 파일을 고친다. 여덟 다 `security definer`·`set search_path = ''`고 첫 줄이 `is_admin()` 검사, 아니면 `not_allowed`다.

- `add_slot(p_day_id uuid, p_position text)` — `slots` 행 하나를 넣는다. 상한이 없다([SCH-011](../../2-design/modules/schedule/README.md#sch-011)). 확정 뒤에 확정 시점부터 있던 날이면 `already_confirmed` — 새로 연 날은 통과한다. 그 갈림은 `days.opened_at`이 `schedules.confirmed_at`보다 뒤인지로 본다
- `remove_slot(p_slot_id uuid)` — 살아 있는 정규 배정이 있으면 같이 닫는다. 확정 전이면 두 행을 지우고, 확정 뒤 새로 연 날이면 `ended_at`을 찍고 알림 대상을 낸다. 같은 `already_confirmed` 갈림이 걸린다
- `merge_slots(p_target_slot_id uuid, p_source_slot_id uuid)` — 받은 쪽 `positions`에 내준 쪽 포지션을 더하고 내준 쪽 자리를 닫는다. 받은 쪽에 사람이 있으면 그 사람이 겸임을 맡고 **내준 쪽 사람이 빠진다** — 끌려온 사람이 이긴다([잠금과 구조 변경](../../2-design/modules/schedule/screens/schedule-admin.md#잠금과-구조-변경)). 빠진 배정은 확정 전이면 지우고 뒤면 닫는다. 두 자리가 같은 날이 아니면 `not_allowed`
- `split_slot(p_slot_id uuid)` — `positions`가 둘 이상이어야 한다(아니면 `not_merged`). 첫 포지션만 남기고 나머지마다 새 자리를 만든다. **배정된 사람은 남는 쪽에 그대로 있다** — 겸임 카드가 받은 쪽 줄에 서 있으니 나누면 그 자리로 돌아간다
- `add_assignment(p_slot_id uuid, p_profile_id uuid, p_kind text)` — `kind`가 `regular`면 `slot_id`를 먹고 `training`이면 `p_slot_id`를 무시하고 `day_id`만 든다([SCH-012](../../2-design/modules/schedule/README.md#sch-012)). **그날 `availabilities`에 행이 없으면 `not_applied`** — 신청 안 한 사람은 어느 길로도 못 들어간다([SCH-016](../../2-design/modules/schedule/README.md#sch-016)). 제한 포지션인데 `position_grants`가 없으면 `not_qualified`. 그날 이미 살아 있는 정규 배정이 있으면 `already_assigned`. 자리가 이미 찼으면 `slot_full`
- `remove_assignment(p_assignment_id uuid)` — 확정 전이면 행을 지우고 뒤면 `ended_at`·`ended_reason`·`ended_by`를 찍는다
- `force_change(p_assignment_id uuid, p_profile_id uuid)` — 확정 뒤 한 자리의 사람을 바꾼다. 기존 배정을 닫고 새 배정을 연다. `add_assignment`와 같은 검사 넷이 새 사람에게 걸린다. **한 트랜잭션이다** — 빼기만 되고 넣기가 실패하면 자리가 빈 채로 남고 알림도 반쪽이 된다
- `grant_position(p_profile_id uuid, p_position text)` — `position_grants`에 넣는다. 이미 있으면 조용히 통과한다(`on conflict do nothing`) — 자격은 있고 없고뿐이라 두 번 준 것이 오류가 아니다

`error-codes.ts`에 `not_applied`·`not_qualified`·`already_assigned`·`slot_full`·`not_merged`·`stale`이 든다. `already_confirmed`·`not_allowed`는 [schedule-data](schedule-data.md)가 이미 넣었다.

### AC-02

**dal과 model이 는다.**

- 쓰기 dal 여덟 — `src/entities/schedule/dals/add-slot.ts`부터 `grant-position.ts`까지. `rpc()`로 부르고 실패를 `DomainError`·`TransportError`로 가른다([오류의 모양](../../2-design/system/data-access.md#오류의-모양))
- 읽기는 새로 안 만든다. 날 상세가 쓰는 `['schedule', 'YYYY-MM']`과 `['availability', 'YYYY-MM']`은 [schedule-admin](schedule-admin.md#ac-01)의 dal이고, 픽커가 쓰는 명단은 `['members']`다 — account가 낸 `get-members.ts`에 `position_grants` 임베딩을 더한다
- model(`src/screens/schedule-admin/model/`)에 붙는 계산
  - 포지션 아홉 줄로 자리를 가르기 — 겸임 자리는 `positions[0]`이 든 줄에만 선다. 나머지 포지션 줄에서는 자리 수가 그만큼 준다
  - 줄 머리의 셈 — 분자는 그 줄 자리 중 살아 있는 정규 배정이 있는 것, 분모는 살아 있는 자리 수. 교육 배정은 안 든다
  - 앱바 채움 「9/11」 — 날 전체의 같은 셈
  - 픽커 목록 가르기 — 배정 가능(신청했고, 그날 배정이 없고, 자격이 있다) / 미신청 / 자격 없음 / 배정됨. 각 줄의 상태 메시지가 [사람 픽커 짜임](../../2-design/modules/schedule/screens/schedule-admin.md#사람-픽커-짜임)의 표 그대로다
  - 요청 상태 줄 — 대기 중·거절함·만료됨과 체크박스 유무. 값은 `requests`·`request_candidates`고 읽는 것은 [`schedule-requests`](../../backlog.md)가 붙인다 — 이 task는 자리만 둔다
  - 성별 기호 — `female`·`male`을 lucide `Venus`·`Mars`로. 색으로 안 가른다([ACC-002](../../2-design/modules/account/README.md#acc-002))
  - 년생 — `birth_date`의 연도 뒤 두 자리, `98년생` 꼴([writing.md](../../2-design/design-system/writing.md#숫자와-단위)). 만 나이를 세지 않는다
  - 확정 전·뒤 갈림 — `confirmed_at`과 `days.opened_at`을 비교해 「확정 시점에 있던 날」인지 판정한다. 자물쇠·끌기·자리 추가·「이 날 닫기」의 유무가 여기서 나온다

전부 unit 테스트가 든다.

### AC-03

**포지션 줄과 자리 카드가 선다.** [`schedule-admin`](schedule-admin.md#ac-06)이 둔 임시 줄을 지운다.

- 줄 머리 — 포지션 이름(`text-sm font-semibold`)과 셈(`text-xs` `tabular-nums`), 오른쪽에 「교육 붙이기」(Button ghost)와 자물쇠(`fg.neutral-subtle`). 셈은 빈 자리가 남으면 `fg.neutral`, 다 차면 `fg.neutral-subtle`
- 빈 자리 카드 — 면 없이 `stroke.neutral-muted` 점선, 「비어 있어요」(`fg.neutral-subtle`). 누르면 픽커
- 채워진 자리 카드 — `bg.neutral-weak` 면에 이름. 「님」이 없다. 누르면 시트
- 겸임 카드 — 이름 옆 `gap-2`에 Badge brand 「메인·드레스」
- 교육 배정 — 정규 자리 아래 덧붙는 줄. 이름과 Badge neutral 「교육」. 줄 머리 셈에 안 든다
- 요청이 걸린 빈 자리 — 점선 카드 위에 Badge neutral 「요청 2건 대기 중」. **카드 문구는 「비어 있어요」 그대로다** — 카드가 자리의 사실을, 배지가 그 위 상태를 말한다
- 자리 카드 `h-12` `rounded-lg` `px-4`, 카드 사이 `gap-2`, 포지션 줄 사이 `mt-5`, 줄 머리와 첫 카드 사이 `mt-2`

### AC-04

**사람 픽커.** 빈 자리나 「교육 붙이기」를 누르면 바텀시트가 올라온다.

- 짜임: 손잡이와 제목 「스캔 · 10월 10일(토)」 → 배정 가능한 사람 목록 → 「전체 보기」 → 펼치면 나머지 전원과 상태 메시지 → 하단 「n명에게 근무 요청 보내기」
- 목록 한 줄은 ListRow — 이니셜 원, 이름, 오른쪽 끝에 성별 기호. 년생이 줄에 없다
- 짧게 누르면 배정이다 → `add_assignment`. 확정 전에는 확인이 없고 시트가 닫힌다
- 「전체 보기」를 펼치면 상태 셋이 선다 — 미신청(「신청 안 함」, 배정으론 안 눌리고 체크박스로 고른다), 자격 없음(「스캔 자격 없음」, 눌린다), 배정됨(「팀장에 배정됨」, 안 눌린다)
- **배정된 줄을 누르면 토스트 「겸임은 자리를 합쳐 만드세요」.** 비활성인데 토스트까지 띄우는 것은 안 눌리는 이유를 모르면 고장으로 읽히기 때문이다
- 배정 가능한 사람이 0명이면 「지금 바로 넣을 수 있는 사람이 없어요」 한 줄과 함께 **전체 보기가 펼쳐진 채** 열린다
- 시트는 history에 든다 — `pushState`고 브라우저 뒤로가 시트를 닫는다

### AC-05

**사람 시트와 자격 없는 사람.**

- 줄을 **길게 누르면** 사람 시트가 픽커 위에 겹쳐 올라온다 — 사진(없으면 이니셜 원), 이름, 「♀ 여 · 98년생」, 자격(제한 포지션 중 들어갈 수 있는 것들, 없으면 줄이 없다). 배정하지 않는다. 닫으면 픽커 목록 그대로다
- **시트 안에 넣기 버튼을 두지 않는다** — 같은 배정에 문이 둘이 되고 확정 전 흐름과 안 맞는다. 넣으려면 닫고 짧게 다시 누른다
- 자격 없는 줄을 누르면 시트 내용이 선택지로 바뀐다 — 「이번만 넣기」·「자격도 주기」·「닫기」. **버튼 둘이 아니라 줄 셋이다**([자격 없는 사람](../../2-design/modules/schedule/screens/schedule-admin.md#자격-없는-사람))
  - 「이번만 넣기」 → `add_assignment`만. `not_qualified`를 건너뛰는 인자를 함수에 둔다
  - 「자격도 주기」 → `grant_position` 뒤 `add_assignment`. 한 트랜잭션이 아니라 두 호출이라 앞이 성공하고 뒤가 실패하면 자격만 남는다 — 자격은 사람의 속성이라 그 상태가 틀린 것이 아니다. 토스트가 배정 실패만 말한다
- 길게 누르기가 이 화면에서 둘째다 — 첫째가 자리 카드 집기고 그쪽은 카드, 이쪽은 시트 안 목록이라 겹치지 않는다

### AC-06

**잠금과 구조 변경.** 아홉 줄 전부 잠긴 채 열린다.

- 자물쇠를 누르면 **그 포지션만** 풀린다. 자물쇠가 열린 모양이 되고, 자리 카드에 끌기 손잡이가 나타나고, 목록 끝에 점선 「자리 추가」 줄이 서고, 줄 머리 아래 도움말 한 줄 「아래로 끌면 삭제, 다른 포지션 자리에 겹치면 겸임이에요」가 선다. **색으로 말하지 않는다**
- 「자리 추가」 → `add_slot`. 상한이 없다
- 자리를 집어 화면 아래 버리는 영역(`bg.critical-weak` 면, 하단 고정 `h-14` `rounded-lg`, 좌우 `mx-6` 아래 `mb-4` + `env(safe-area-inset-bottom)`)에 놓으면 → `remove_slot`. **빈 자리는 놓는 순간 사라지고, 사람이 든 자리는 시트가 확인한다** — 「박서연 님 배정도 같이 사라져요」
- 자리를 다른 포지션의 자리에 겹쳐 놓으면 → `merge_slots`. 대상 카드에 `stroke.brand-solid` 테두리가 선다. **둘 다 사람이 들었으면 놓기 전에 시트가 확인한다** — 「김지우 님 배정이 사라져요」. 그만두면 카드가 잔상 자리로 돌아간다
- 겸임 카드를 누르면 시트에 「자리 나누기」가 한 줄 더 선다 → `split_slot`. **끌어서 되돌리는 길을 안 만든다** — 버리기와 손짓이 겹친다
- 집힌 카드는 면 그대로에 `shadow-card`. 따라가는 동안의 duration은 두지 않는다 — [motion.md](../../2-design/design-system/foundation/motion.md)에 직접 조작 조항이 없다

### AC-07

**확정 뒤 날 상세.** 같은 화면이 다르게 선다.

| 자리 | 확정 전 | 확정 뒤 |
| --- | --- | --- |
| 빈 자리 누름 | 픽커. 고르면 바로 들어간다 | 픽커. 고르면 확인 시트 |
| 채워진 자리 누름 | 「사람 바꾸기 · 자리 비우기 · 닫기」 | 강제 변경 시트 — 「사람 바꾸기 · 사람 빼기 · 닫기」 |
| 자물쇠와 끌기 | 있다 | 없다 — 새로 연 날만 있다 |
| 자리 추가 | 있다 | 없다 — 새로 연 날만 있다 |
| 교육 붙이기 | 있다 | 있다. 고르면 확인 시트 |

- **잠금 아이콘을 회색으로 남기지 않고 지운다** — 눌리지 않는 것을 남기면 「내가 뭘 잘못했나」를 묻게 한다
- 확인 시트 문안 넷은 [확정 뒤 날 상세](../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤-날-상세)의 표 그대로다. 오른쪽은 Button primary고 **critical을 안 쓴다** — 자리는 남고 다시 채울 수 있다
- 새로 연 날(`days.opened_at`이 `confirmed_at`보다 뒤)은 확정 전과 같은 자물쇠·끌기·자리 추가가 선다. 사람이 든 자리를 버리면 강제 변경 빼기와 같은 확인과 알림이 걸린다
- 알림은 서버가 보낸다. 화면은 시트가 무엇이 나가는지 말하는 데까지다

### AC-08

**경쟁과 실패.**

- 배정 추가·제거·강제 변경은 **응답을 기다린다**. 보내는 동안 그 카드가 잠기고 나머지는 계속 만진다
- `stale`이 오면 시트를 닫지 않고 **그 자리만 다시 읽는다** — 「이 근무가 바뀌었어요」가 시트 안에 서고, 관리자가 고치던 나머지가 사라지지 않는다
- `already_assigned`·`slot_full`은 화면이 잘못 켜진 것이라 `['schedule']`을 무효화해 다시 읽는다. 픽커가 열려 있으면 목록이 새로 갈린다
- `not_applied`는 버튼이 잘못 켜진 것이다 — 픽커가 미신청 줄을 배정으로 안 누르게 막고 있으니 여기 닿으면 목록이 낡았다는 뜻이라 다시 읽는다
- `TransportError`면 그 자리에 「보내지 못했어요. 다시 시도해주세요」
- 성공하면 `['schedule']`·`['payroll']`·`['requests']`를 무효화한다([무효화 표](../../2-design/system/runtime.md#무효화-표)). `grant_position`은 `['members']`다

### AC-09

**공용 UI가 는다.**

- 이 화면이 첫 자리인 것 — 끌어서 옮기기(`draggable-list.tsx` 또는 라이브러리 감싸기), 버리는 영역(`drop-zone.tsx`), 선택지 시트(줄 셋짜리). **선택지 시트는 이름을 붙이지 않는다** — [규칙과 부딪힌 자리](../../2-design/modules/schedule/screens/schedule-admin.md#규칙과-부딪힌-자리)가 「세 번째 자리가 나올 때 정한다」고 했고 이 task에 둘(자격 시트·강제 변경 시트)뿐이다. 화면 안에 두고 `src/shared/ui/`로 안 올린다
- 이미 있는 것 — ListRow, 바텀시트, Badge, 토스트, 이니셜 원
- 끌기는 터치 기기가 주 타깃이다. 포인터 이벤트로 짜고 `touch-action`을 세로 스크롤과 안 부딪히게 건다 — 같은 손짓이 목록 스크롤과 겹친다

### AC-10

**테스트.**

- unit: AC-02 전부(포지션 줄 가르기·셈·겸임 분모·픽커 목록 가르기·상태 메시지·성별 기호·년생·확정 갈림), 쓰기 dal의 오류 가르기
- integration: 함수 여덟의 관리자 검사와 오류 코드 전부. 특히 — `add_assignment`가 미신청자에게 `not_applied`, 제한 포지션에 `not_qualified`, 같은 날 둘째 자리에 `already_assigned`, 찬 자리에 `slot_full`; 교육 배정은 넷 중 자격만 안 걸린다; `merge_slots`가 받은 쪽 배열을 늘리고 내준 쪽을 닫고 내준 쪽 사람을 빼는지; `split_slot`이 사람을 남는 쪽에 두는지; `force_change`가 한 트랜잭션이라 새 사람이 실패하면 기존 배정이 살아 있는지; 확정 전은 지우고 확정 뒤는 `ended_at`을 찍는지; 새로 연 날은 `add_slot`이 통과하고 확정 시점 날은 `already_confirmed`인지
- e2e(`tests/e2e/schedule-assign.spec.ts`): 관리자가 날 상세에서 빈 자리를 눌러 사람을 넣고 → 줄을 길게 눌러 사람 시트를 보고 → 자격 없는 사람에게 자격을 주며 넣고 → 자물쇠를 풀어 자리를 추가하고 → 확정 뒤 강제 변경에 확인 시트가 서는 데까지. 끌기는 e2e가 흉내 내기 어려워 **자리 추가와 시트 경로만 본다** — 삭제·겸임은 integration이 함수를 직접 본다

### AC-11

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run`·`pnpm build && pnpm e2e` 전부 초록. `sian-auditor`가 `schedule-admin.sian.html`의 날 상세·픽커 절과 문서를 대조한다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_schedule_functions.sql` | 함수 여덟 | AC-01 |
| `src/shared/api/error-codes.ts` | `not_applied`·`not_qualified`·`already_assigned`·`slot_full`·`not_merged`·`stale` | AC-01 |
| `src/entities/schedule/dals/add-slot.ts`·`remove-slot.ts`·`merge-slots.ts`·`split-slot.ts`·`add-assignment.ts`·`remove-assignment.ts`·`force-change.ts`·`grant-position.ts`·`__tests__/` | 쓰기 여덟 | AC-02 |
| `src/entities/profile/dals/get-members.ts` | `position_grants` 임베딩 | AC-02 |
| `src/screens/schedule-admin/model/*.ts`·`__tests__/` | 포지션 줄·셈·픽커 가르기·표기·확정 갈림 | AC-02 |
| `src/features/schedule/*.ts`·`__tests__/` | mutation과 무효화, `stale` 처리 | AC-08 |
| `src/screens/schedule-admin/ui/*.tsx` | 포지션 줄·자리 카드·픽커·사람 시트·선택지 시트·잠금·끌기·확인 시트 | AC-03~AC-07 |
| `src/shared/ui/draggable-list.tsx`·`drop-zone.tsx` | 끌어서 옮기기 | AC-09 |
| `tests/e2e/schedule-assign.spec.ts` | e2e | AC-10 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. [`schedule-admin`](schedule-admin.md)이 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-09를 층에 배정한다. 함수는 integration, 계산은 unit, 흐름은 e2e다. 끌기는 e2e 밖이라 그 배정을 명시한다
2. `integration-test-writer`가 함수 여덟의 실패 테스트를 먼저 쓴다 — 이 task의 위험이 대부분 거기 있다
3. `unit-test-writer`·`e2e-test-writer`가 잇는다
4. `implementer`가 함수 → dal → model → 포지션 줄과 자리 카드(임시 줄 제거) → 픽커 → 사람 시트·자격 시트 → 잠금과 끌기 → 확정 뒤 확인 시트 순으로 초록을 만든다. 끌기가 마지막인 것은 나머지가 서야 무엇을 끄는지가 생기기 때문이다
5. `sian-auditor`가 시안과 문서를 대조한다
6. `schedule-requests` 행의 선행이 채워졌는지 backlog에서 확인한다

## 리스크·전환·되돌리기

- **끌기가 이 저장소에서 처음이다.** 터치 기기에서 세로 스크롤과 같은 손짓이라 `touch-action`을 잘못 걸면 목록이 안 움직이거나 카드가 안 집힌다. e2e가 못 보는 자리라 실기기 확인이 필요하다 — 배정하지 않은 것에 적는다
- **`force_change`가 한 트랜잭션이어야 한다.** 빼기만 되고 넣기가 실패하면 자리가 빈 채로 남고 알림도 반쪽이다. 함수 안에서 끝내고 화면이 두 번 부르지 않는다. integration이 새 사람 실패 시 기존 배정이 살아 있는지 본다
- **「이번만 넣기」가 자격 검사를 건너뛴다.** 인자로 여는 문이라 화면이 안 보내면 못 연다. 그 인자를 기본값 `false`로 두고 자격 시트에서만 `true`를 보낸다 — `pr-diff`가 다른 호출자가 그 인자를 쓰는지 본다
- **요청 상태 줄이 빈 채로 선다.** 픽커의 대기 중·거절함·만료됨은 `requests`를 읽어야 하는데 그것을 붙이는 것은 [`schedule-requests`](../../backlog.md)다. 이 task는 자리와 모양만 두고 값이 비면 줄이 안 선다 — 그 task의 plan이 이 자리를 잇는다
- **확정 갈림이 두 값을 본다.** `schedules.confirmed_at`과 `days.opened_at`을 비교해 「새로 연 날」을 가른다. 시각 비교라 같은 초에 걸리면 판정이 흔들릴 수 있다 — `opened_at > confirmed_at`으로 엄격히 두고 경계를 테스트가 한 번 본다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 미신청자가 들어간다, 자격 없이 들어간다, 한 사람이 두 자리를 맡는다 | integration `src/entities/schedule/dals/__tests__/`(예정) | `pnpm test:integration:run` | `not_applied`·`not_qualified`·`already_assigned`·`slot_full` |
| AC-01 | 겸임이 두 줄에 그려진다, 나누면 사람이 사라진다 | integration 위 | 위와 같다 | 받은 쪽 배열이 늘고 내준 쪽이 닫히고, 나누면 사람이 남는 쪽에 있다 |
| AC-01 | 강제 변경이 반쪽 난다 | integration 위 | 위와 같다 | 새 사람 실패 시 기존 배정이 살아 있다 |
| AC-01 | 확정 뒤 구조가 바뀐다 | integration 위 | 위와 같다 | 확정 시점 날은 `already_confirmed`, 새로 연 날은 통과 |
| AC-02 | 셈이 틀린다, 픽커가 잘못 가른다 | unit `src/screens/schedule-admin/model/__tests__/`(예정) | `pnpm test` | 겸임 분모, 교육 제외, 상태 메시지 넷 |
| AC-04·AC-05·AC-07 | 흐름이 끊긴다 | e2e `tests/e2e/schedule-assign.spec.ts`(예정) | `pnpm build && pnpm e2e` | 배정 → 사람 시트 → 자격 주며 넣기 → 자리 추가 → 확정 뒤 확인 시트 |
| AC-08 | 경쟁이 시트를 닫는다 | e2e 위 spec | 위와 같다 | `stale`에 시트가 안 닫히고 그 자리만 갱신된다 |
| AC-11 | 시안이 문서와 어긋난다 | `sian-auditor` | — | 어긋남 없음 |

- 배정하지 않은 것: 끌어서 삭제·겸임의 손짓 — e2e가 흉내 내기 어렵다. 실기기에서 한 번 손으로 본다. 집힌 카드의 그림자와 대상 테두리 — `sian-auditor`가 본다
- 막힌 것: 픽커의 요청 상태 줄은 [`schedule-requests`](../../backlog.md) 뒤에 값이 찬다

## 범위 밖

- 근무 요청 보내기와 응답, 요청 상태 값 — [`schedule-requests`](../../backlog.md). 이 task는 픽커의 체크박스와 하단 버튼 자리까지 둔다
- 근무 취소 요청과 판정 — 같은 task
- 달력·만들기·날 열기·확정·모아보기 — [`schedule-admin`](schedule-admin.md)
- 근무자 화면 — [`schedule-worker`](../../backlog.md)
- 교대 — swap 영역
- 알림 발송 — 알림 영역. 이 task는 함수 호출까지다
- 선택지 시트를 `src/shared/ui/`로 올리기 — 세 번째 자리가 나올 때
