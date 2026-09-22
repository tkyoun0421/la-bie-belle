---
sources:
  - ../../2-design/spec/schedule-admin.md
  - ../../2-design/modules/schedule/screens/schedule-admin.md#관리자-홈
  - ../../2-design/modules/schedule/screens/schedule-admin.md#달-근무표-만들기
  - ../../2-design/modules/schedule/screens/schedule-admin.md#월-달력
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-열기-모드
  - ../../2-design/modules/schedule/screens/schedule-admin.md#근무-신청-모아보기
  - ../../2-design/modules/schedule/screens/schedule-admin.md#확정
  - ../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤
  - ../../2-design/modules/schedule/screens/schedule-admin.md#관리자-홈-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#달-근무표-만들기-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#월-달력-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#달력-칸
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-열기-모드-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-닫기-경고
  - ../../2-design/modules/schedule/screens/schedule-admin.md#근무-신청-모아보기-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#확정-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#세-모습
  - ../../2-design/modules/schedule/screens/schedule-admin.md#확정-시트
  - ../../2-design/modules/schedule/screens/schedule-admin.md#결과
  - ../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤-짜임
  - ../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤-달력
  - ../../2-design/modules/schedule/screens/schedule-admin.md#관리자-홈-문안
  - ../../2-design/modules/schedule/screens/schedule-admin.md#달-근무표-만들기-문안
  - ../../2-design/modules/schedule/screens/schedule-admin.md#월-달력-문안
  - ../../2-design/modules/schedule/screens/schedule-admin.md#날-열기-모드-문안
  - ../../2-design/modules/schedule/screens/schedule-admin.md#근무-신청-모아보기-문안
  - ../../2-design/modules/schedule/screens/schedule-admin.md#확정-문안
  - ../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤-문안
  - ../../2-design/modules/schedule/screens/schedule-worker.md#달-고르기-시트-짜임
  - ../../2-design/modules/schedule/design.md#근무표-만들기와-마감일
  - ../../2-design/modules/schedule/design.md#날-열기닫기
  - ../../2-design/modules/schedule/design.md#홀-기본값
  - ../../2-design/modules/schedule/design.md#행위-밖의-실행-동작
  - ../../2-design/modules/schedule/README.md#sch-001
  - ../../2-design/modules/schedule/README.md#sch-002
  - ../../2-design/modules/schedule/README.md#sch-003
  - ../../2-design/modules/schedule/README.md#sch-004
  - ../../2-design/modules/schedule/README.md#sch-005
  - ../../2-design/modules/schedule/README.md#sch-007
  - ../../2-design/modules/schedule/README.md#sch-008
  - ../../2-design/modules/schedule/README.md#sch-009
  - ../../2-design/modules/schedule/README.md#sch-010
  - ../../2-design/modules/schedule/README.md#sch-014
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/navigation.md#뒤로
  - ../../2-design/system/runtime.md#tanstack-query-규칙
  - ../../2-design/system/runtime.md#무효화-표
  - ../../2-design/system/runtime.md#읽기-범위
  - ../../2-design/system/runtime.md#로딩
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/design-system/components.md#근무표-날짜-칸
  - ../../2-design/design-system/components.md#bottomcta
  - ../../2-design/design-system/components.md#card
  - ../../2-design/design-system/components.md#listrow
  - ../../2-design/design-system/components.md#tabs
  - ../../2-design/design-system/components.md#알림-블록
  - ../../2-design/design-system/components.md#badge
  - ../../2-design/design-system/components.md#dialog와-바텀시트
---

# 관리자 근무표 화면을 만든다 — 구현 계획

> 앱 골격(`expo-scaffold`)이 선 뒤에 파일 배치와 검증 명령을 채운다. 업무 규칙과 완료 조건은 그대로 선다.

## 입력 명세·기준

정본은 [schedule-admin.md](../../2-design/modules/schedule/screens/schedule-admin.md)다 — [관리자 홈](../../2-design/modules/schedule/screens/schedule-admin.md#관리자-홈)·[달 근무표 만들기](../../2-design/modules/schedule/screens/schedule-admin.md#달-근무표-만들기)·[월 달력](../../2-design/modules/schedule/screens/schedule-admin.md#월-달력)·[날 열기 모드](../../2-design/modules/schedule/screens/schedule-admin.md#날-열기-모드)·[근무 신청 모아보기](../../2-design/modules/schedule/screens/schedule-admin.md#근무-신청-모아보기)·[확정](../../2-design/modules/schedule/screens/schedule-admin.md#확정)·[확정 뒤](../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤)의 상태 표, 그 짜임 절들, 문안 표 일곱이다. 달 고르기 시트는 근무자 화면과 같은 것이라 [schedule-worker.md](../../2-design/modules/schedule/screens/schedule-worker.md#달-고르기-시트-짜임)가 정본이다. 쓰기 함수는 [schedule-data](schedule-data.md)가 낸 `create_schedule`·`set_application_deadline`·`confirm_schedule`·`open_day`·`close_day`·`set_day_hours`·`set_hall_defaults` 일곱이고, 이 task는 그것을 부르는 화면이다. 규칙은 [SCH-001](../../2-design/modules/schedule/README.md#sch-001)~[SCH-005](../../2-design/modules/schedule/README.md#sch-005)·[SCH-007](../../2-design/modules/schedule/README.md#sch-007)~[SCH-010](../../2-design/modules/schedule/README.md#sch-010)·[SCH-014](../../2-design/modules/schedule/README.md#sch-014)다. 경로와 역할 조건은 [navigation.md](../../2-design/system/navigation.md#경로), 캐시 키와 무효화는 [runtime.md](../../2-design/system/runtime.md#무효화-표)다.

**날 상세는 껍데기까지다.** 화면 아홉이 한 흐름이라 한 문서에 있지만 task는 둘로 갈린다. 이 task가 만드는 것은 날 상세의 앱바·근무 시간 줄·근무 신청 줄·「이 날 닫기」와 [날 닫기 경고](../../2-design/modules/schedule/screens/schedule-admin.md#날-닫기-경고)까지고, 포지션 아홉 줄 안쪽 — 자리 카드·자물쇠·끌기·자리 추가·사람 픽커·사람 시트·자격·강제 변경 — 은 [`schedule-assign`](../../backlog.md)이다. 가르는 선이 `open_day`/`close_day`와 `add_slot`/`add_assignment` 사이고, backlog가 이미 그렇게 나눴다. 이 task의 PR에서 포지션 줄 자리는 배정 수만 세는 임시 줄이고, `schedule-assign`이 그 자리를 채우며 임시 줄을 지운다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **한 달이 한 질의다.** [행위 밖의 실행 동작](../../2-design/modules/schedule/design.md#행위-밖의-실행-동작)이 「근무표 한 달은 `days`에서 `slots`·`assignments`·`check_ins`를 임베딩한 한 질의」라고 정했다. 달력 칸의 신청 수·빈 자리 수·열림 여부와 날 상세가 같은 `['schedule', 'YYYY-MM']` 하나를 읽는다. 날마다 따로 읽지 않는다. 앞뒤 한 달은 `prefetchQuery`다 — 관리자가 달을 자주 넘긴다
- **화면이 세는 것은 전부 `.ts`다.** 달력 그리드(월요일 시작, 이 달 밖 빈칸, 줄 넷~여섯), 확정 버튼의 세 모습, 「n일 열기」의 셈, 빈 자리 목록 넷과 「외 n개」, 마감까지 남은 날, 홈 타일의 요약 줄 갈래와 경고 승격 — 전부 판정이라 [ADR-001](../../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md)대로 `.tsx` 밖이다
- **오늘이 화면 밖에서 온다.** 확정 잠김·열림, 「지난 날짜는 안 눌린다」, 예식 3일 안 경고가 전부 오늘을 본다. [runtime.md](../../2-design/system/runtime.md#tanstack-query-규칙)의 서버 시각 오프셋을 쓰고 기기 시계를 그대로 믿지 않는다. **자정 경계는 다음 진입이다** — 화면을 열어둔 채 자정을 넘기면 그 자리에서 안 풀린다([세 모습](../../2-design/modules/schedule/screens/schedule-admin.md#세-모습)). 타이머를 두지 않는다
- **확정은 되돌리는 문이 없다.** 시트가 곧 확인이라 Dialog를 겹치지 않고([확정 시트](../../2-design/modules/schedule/screens/schedule-admin.md#확정-시트)), 빈 자리가 있어도 막지 않는다([SCH-014](../../2-design/modules/schedule/README.md#sch-014)). 화면이 만드는 유일한 안전장치는 버튼 라벨과 아래 줄이다

지금 코드에는 `/admin`이 하나도 없다. 라우트는 `/`·`/login`·`/pending`·`/blocked`·`/left`·`/auth/*`뿐이다. `src/shared/ui/`는 Button·Card뿐이라 앱바·ListRow·바텀시트·Tabs·Badge·알림 블록·BottomCTA·Input·토스트·빈 상태가 없고, 달력 그리드는 이 화면이 처음 세운다. 관리자 경로 보호와 게이트의 `role`은 `members-pending`·`members`의 AC-10이 만든다.

## 구현 산출물

> 관찰 가능한 완료 조건은 [spec](../../2-design/spec/schedule-admin.md)이 든다. 여기 있는 것은 그 조건을 세우는 파일·함수·계산이고, 아래 번호를 「변경 파일」과 「검증 방법」 표가 가리킨다.

### AC-01

**읽기 dal 셋이 선다.** `src/entities/schedule/dals/`.

- `get-month-schedule.ts` — `['schedule', 'YYYY-MM']`. `schedules` 한 행(`month`·`application_deadline`·`confirmed_at`)과 그 달의 `days`, 각 날의 `slots`·`assignments`를 한 질의로 받는다. 그 달 `schedules` 행이 없으면 `null`이다 — 그것이 「아직 안 만든 달」이다
- `get-month-availabilities.ts` — `['availability', 'YYYY-MM']`. 그 달 `availabilities`를 프로필 이름과 같이 받는다. 달력 칸의 신청 수, 날 상세의 근무 신청 줄, 모아보기 화면이 같은 키를 쓴다
- `get-hall-defaults.ts` — `halls` 한 행의 `default_slots`·`default_starts`·`default_ends`. 홈의 근무 시간 기본값 줄과 기본값 시트가 읽는다
- 읽기 오류는 전부 `TransportError`다

쓰기 dal 일곱 — `create-schedule.ts`·`set-application-deadline.ts`·`confirm-schedule.ts`·`open-day.ts`·`close-day.ts`·`set-day-hours.ts`·`set-hall-defaults.ts`. `rpc()`로 부르고 실패를 `DomainError`·`TransportError`로 가른다([오류의 모양](../../2-design/system/data-access.md#오류의-모양)).

### AC-02

**달력 계산이 `.ts` model에 있다.** `src/screens/schedule-admin/model/`.

- 그리드 — 그 달 1일이 든 주의 월요일부터, 말일이 든 주의 일요일까지. 이 달 밖 칸은 날짜가 아니라 빈칸이다([월 달력 짜임](../../2-design/modules/schedule/screens/schedule-admin.md#월-달력-짜임)). 줄 수는 달마다 넷·다섯·여섯이라 고정하지 않는다
- 칸 상태 — 안 연 날(닫힘) · 열린 날 · 오늘 · 지난 날짜 · 열기 모드에서 고른 날 · 확정 뒤 빈 자리 수. 정본 표는 [달력 칸](../../2-design/modules/schedule/screens/schedule-admin.md#달력-칸)과 [components.md](../../2-design/design-system/components.md#근무표-날짜-칸)다
- 신청 수 — 그 날짜의 `availabilities` 행 수. 확정 뒤에는 세지 않는다([확정 뒤 달력](../../2-design/modules/schedule/screens/schedule-admin.md#확정-뒤-달력))
- 빈 자리 수 — 그 날의 살아 있는 `slots` 중 살아 있는 정규 `assignments`가 없는 것. 확정 전에는 칸에 안 그린다
- 확정 버튼의 세 모습 — `confirmed_at`이 있으면 끝남, 없고 오늘이 `application_deadline` 다음 날 이후면 열림, 아니면 잠김. 잠김의 보조 문구가 「10월 3일부터 확정할 수 있어요」다
- 홈 타일 요약 줄 — 근무표 없음 / 만드는 중 / 확정 뒤로 갈리고, 확정 뒤 예식이 사흘 안인데 빈 자리가 남으면 경고 블록으로 승격한다([관리자 홈 짜임](../../2-design/modules/schedule/screens/schedule-admin.md#관리자-홈-짜임))
- 마감 줄 — 「스케줄 신청 마감 10월 2일(금) · 3일 남았어요」. 마감이 지났으면 문구가 갈린다
- 「전부 지난 달」 판정 — 그 달의 마지막 날이 오늘 이전이면 만들기 버튼이 없고 빈 상태 제목만이다([달 근무표 만들기 짜임](../../2-design/modules/schedule/screens/schedule-admin.md#달-근무표-만들기-짜임))
- 열기 모드의 고를 수 있는 칸 — 안 연 날이면서 오늘 이후. 「n일 열기」가 고른 수를 센다
- 확정 시트의 빈 자리 목록 — 날짜·포지션 꼴로 넷까지, 넘치면 「외 n개」
- 표기 — 날짜는 `10월 10일(토)`, 확정 줄은 `10월 3일에 확정했어요 · 14명에게 알림을 보냈어요`. 날짜 셈은 전부 Asia/Seoul이다

전부 unit 테스트가 든다.

### AC-03

**관리자 홈이 선다.** `/admin/` 화면 → `src/screens/admin-home/`.

- 짜임 순서: 앱바(뒤로 → `/me`의 관리자 모드 줄, 제목 「관리자」, 브랜드 마크) → 근무표 관리 타일(Card `rounded-xl` `p-5`) → 가는 선 `mt-6` → 근무 시간 기본값 줄 → 승인할 일 줄 → 가입 대기 줄 → 가는 선 → 직원·시급·QR·통계 줄. 화면 좌우 `px-6`, 줄은 `py-4`
- 타일 안에 지금 달 상태 한 줄. 예식 3일 안 빈 자리면 그 자리가 [알림 블록](../../2-design/design-system/components.md#알림-블록) 경고로 바뀐다
- 근무 시간 기본값 줄을 누르면 바텀시트가 열리고 출근·퇴근 두 칸을 고친다 → `set_hall_defaults`. 도움말이 「이미 연 날은 그대로예요」를 말한다
- 아래 넷에 숫자가 없다. 승인할 일과 가입 대기에만 건수·인원이 선다
- 승인할 일·가입 대기·직원·시급·QR·통계 줄의 **목적지는 각자의 task가 만든다.** 이 task는 줄과 경로만 세운다 — 아직 없는 화면으로 가는 줄은 눌리되 404다([리스크](#리스크전환되돌리기))
- 승인할 일 건수와 가입 대기 인원은 각자의 dal이 있어야 센다. `members-pending`이 merge됐으면 그 dal을 쓰고, 아니면 줄에 수를 안 그린다 — 0으로 적지 않는다. 승인할 일은 근무 취소 요청까지 세는 자리라 [`schedule-requests`](../../backlog.md) 뒤에 완성된다
- 이 화면에 primary 버튼이 없다

### AC-04

**월 달력과 달 만들기가 선다.** `/admin/schedule/` 화면가 `?month=`·`?date=`를 읽어 가른다.

- `?month=`에 그 달 근무표가 없으면 빈 상태 덩이(달력 아이콘 `size-11`, 제목, 아래 줄, 「10월 근무표 만들기」 Button primary `h-12 rounded-lg`)가 화면 세로 가운데에 선다. 전부 지난 달이면 제목만이다
- 만들기 버튼 → 마감일 시트(제목, Input 날짜, 안내 줄, 닫기·만들기) → `create_schedule`. 성공하면 전부 닫힌 달력과 그 위 만든 직후 한 줄이 서고, 날을 하나라도 열면 그 줄이 사라진다
- 근무표가 있으면 달력이다 — 앱바(달 이동 화살표와 「2026년 10월」, 제목을 누르면 달 고르기 시트), 마감 줄, 요일 머리(월요일 시작)와 주 줄들, 범례 한 줄, 근무 신청 모아보기 줄, 하단 고정 「확정하기」([BottomCTA](../../2-design/design-system/components.md#bottomcta))
- 열린 날을 누르면 `?date=`로 간다. 안 연 날은 안 눌린다
- 달 이동은 과거로도 간다. 처음 들어온 자리는 오늘이 든 달이고 재진입이면 마지막으로 보던 달이다 — 마지막 달은 기기 저장소가 아니라 화면 파라미터가 든다. 홈 타일이 `?month=`를 붙여 보낸다
- 달 고르기 시트는 [schedule-worker.md](../../2-design/modules/schedule/screens/schedule-worker.md#달-고르기-시트-짜임)의 것이다. 근무자 화면과 같은 조각이라 `src/shared/ui/`로 올린다 — 어느 task가 먼저 만들든 정본은 그 절이다

### AC-05

**날 열기 모드.** 달력 화면의 「날 열기」가 같은 달력을 고르기 모드로 바꾼다.

- 앱바가 「그만두기」와 제목으로 바뀌고 하단 고정 버튼이 「n일 열기」다. 0개면 안 눌린다
- 이미 연 날과 지난 날짜는 흐리고 안 눌린다. 고른 칸은 `bg.brand-weak-selected` 면이다
- 「n일 열기」 → 고른 날마다 `open_day`. 여럿을 한 번에 부르므로 **하나가 실패하면 그 날만 안 열린 채 나머지는 열린다** — 함수가 날 하나를 받는 모양이라 그렇다. 실패한 날짜를 토스트가 말하고 모드는 안 풀린다. 전부 성공하면 모드가 풀리고 달력으로 돌아간다
- 성공하면 `['schedule']`·`['payroll']`·`['requests']`를 무효화한다([날 열기·닫기](../../2-design/modules/schedule/design.md#날-열기닫기))
- 확정 뒤에도 「날 열기」는 그대로 있다

### AC-06

**날 상세의 껍데기와 날 닫기.** `?date=`로 열린다. 들어오는 길 넷 — 달력, 알림, 승인할 일의 근무 취소 승인 뒤(`?from=approvals`), 직원의 퇴사 Dialog(`?from=members`). 뒤로는 온 곳이다([뒤로](../../2-design/system/navigation.md#뒤로)).

- 짜임: 앱바와 채움 → 근무 시간 줄 → 근무 신청 줄 → 가는 선 → 포지션 아홉 줄 → 「이 날 닫기」
- 근무 시간 줄을 누르면 시트가 열리고 → `set_day_hours`. 끝이 시작보다 이르면 `bad_hours`라 버튼이 먼저 막는다
- **임시공휴일 줄과 근무 조정 줄은 이 task가 안 만든다.** 문서의 짜임에는 근무 시간 줄 아래에 둘이 있지만 값이 `holidays`와 `adjustments`로 가는 payroll의 것이고 그 표가 아직 없다. 자리만 비워두는 대신 줄 자체를 안 그린다 — 누를 것이 없는 스위치를 세우면 켜지는 줄 알고 누른다. [`payroll-adjust`](../../backlog.md)가 둘을 통째로 더한다
- 근무 신청 줄은 그날 신청한 사람 목록이다. 0건이면 줄이 통째로 없다
- 포지션 아홉 줄은 이 task에서 **자리 수와 배정 수만 센 임시 줄**이다. 안쪽은 [`schedule-assign`](../../backlog.md)이 채운다
- 「이 날 닫기」 → 배정이 있으면 [날 닫기 경고](../../2-design/modules/schedule/screens/schedule-admin.md#날-닫기-경고) 시트(왼쪽 「그만두기」·오른쪽 「배정 지우고 닫기」), 없으면 확인 없이 바로 `close_day`. 닫히면 달력으로 돌아간다
- 확정 뒤에는 「이 날 닫기」가 없다([SCH-004](../../2-design/modules/schedule/README.md#sch-004)). 확정 뒤에 새로 연 날에도 없다 — 규칙이 보는 것은 달의 확정이지 날이 열린 시점이 아니다

### AC-07

**근무 신청 모아보기.** `/admin/applications/` 화면, `?month=`.

- 짜임: 앱바(뒤로 → 달력, 제목 「10월 근무 신청」) → 마감 줄과 밑줄 친 「마감일 바꾸기」 → [Tabs](../../2-design/design-system/components.md#tabs)(날짜순·사람순) → 목록
- 날짜순이 기본이다. 날짜 머리 아래 이름 줄, 사람순은 이름 아래 날짜들. 이름에 「님」이 없고 날짜에 `tabular-nums`
- 0건이면 목록 자리에 두 줄이고 삽화가 없다
- 「마감일 바꾸기」 → 마감일 시트(제목, Input과 도움말 「오늘 이전은 고를 수 없어요」, 경고 줄 「바꾸면 전원에게 알림이 가요」, 닫기·바꾸기) → `set_application_deadline`. 같은 시트를 확정 잠김의 「마감일 당기기」도 연다 — **조각 하나를 두 문이 쓴다**
- 성공하면 `['schedule']`을 무효화하고 토스트. 알림은 서버가 보낸다

### AC-08

**확정.** 달력 하단 BottomCTA다.

- 잠김 — 눌리지 않는 「확정하기」와 보조 문구 「10월 3일부터 확정할 수 있어요」, 그 옆 밑줄 친 「마감일 당기기」가 [AC-07](#ac-07)의 시트를 연다
- 열림 — 「10월 근무표 확정하기」. 누르면 확정 시트가 선다
- 확정 시트 — 제목, 빈 자리가 있으면 경고 블록(「빈 자리 6개가 있어요」 + 날짜·포지션 넷 + 「외 2개」 + 「빈 자리는 확정 뒤에도 채울 수 있어요」), 아래 줄 「확정하면 근무자 전원에게 보여요 · 되돌릴 수 없어요」, 왼쪽 닫기·오른쪽 primary. **Dialog를 겹치지 않는다**
- 보내는 동안 오른쪽 버튼에서 링이 돌고 닫기도 잠긴다 → `confirm_schedule`. 성공하면 시트 내용이 결과(원과 체크, 제목, 「배정된 14명에게 알림을 보냈어요」)로 바뀌고 1.65초 뒤 저절로 닫힌다
- 실패하면 시트가 안 닫히고 원이 흔들리고 ✕가 서고 「다시 확정하기」가 남는다. `too_early`면 화면이 잘못 켜진 것이라 다시 읽는다. `already_confirmed`는 성공으로 처리한다 — 재시도가 두 번 닿은 것이다
- 성공 뒤 `['schedule']`·`['payroll']`·`['requests']`를 무효화한다

### AC-09

**확정 뒤 달력.** 같은 화면이 다르게 선다.

- 앱바 제목 옆 [Badge](../../2-design/design-system/components.md#badge) positive 「확정」, 그 아래 확정 줄
- 마감 줄·BottomCTA·범례·신청 수·모아보기 줄이 없다
- 「날 열기」는 남는다
- 빈 자리가 남은 날 칸의 바닥 단에 점선 원과 수. 0이면 단이 빈다. `fg.neutral-subtle` · `text-xs`고 오늘 칸이라고 달라지지 않는다
- 확정 뒤 날 상세의 자물쇠·끌기·자리 추가 없음과 확인 시트는 [`schedule-assign`](../../backlog.md)이다 — 이 task가 세우는 것은 「이 날 닫기」가 사라지는 것까지다

### AC-10

**공용 UI가 는다.** `src/shared/ui/`에 [components.md](../../2-design/design-system/components.md) 토큰대로. 앞선 account task가 먼저 만든 것은 그대로 쓴다.

- account와 겹치는 것 — 앱바, ListRow, 바텀시트, Tabs, Badge, 토스트, 빈 상태, Input, 스피너, Dialog
- 이 화면이 첫 자리인 것 — BottomCTA(`bottom-cta.tsx`), 알림 블록(`callout.tsx`), 달력 그리드(`calendar-grid.tsx` — 근무자 화면과 같이 쓴다), 달 고르기 시트(`month-picker-sheet.tsx`)
- 달력 칸의 상태 표현은 [components.md](../../2-design/design-system/components.md#근무표-날짜-칸)의 표 하나가 관리자 편집과 근무자 조회를 같이 든다 — 조각도 하나다. 어느 쪽 task가 먼저 만들든 정본은 그 표다

### AC-11

**테스트.**

- unit: AC-02 전부(그리드·칸 상태·신청 수·빈 자리 수·확정 세 모습·타일 요약·마감 줄·전부 지난 달·열기 모드 셈·빈 자리 목록·표기), 쓰기 dal의 오류 가르기
- integration: dal 셋이 관리자 세션에서 값을 받고 근무자 세션에서 RLS대로 좁혀지는지. 쓰기 dal 일곱이 함수의 오류 코드를 `DomainError`로 올리는지
- e2e(`schedule-admin` e2e): 관리자가 `/admin`에서 타일을 눌러 빈 상태를 보고 → 마감일을 골라 만들고 → 날 셋을 열고 → 날 상세에서 배정 없는 날을 닫고 → 마감일을 당기고 → 확정해 배지가 서는 데까지 한 줄기. 근무자가 `/admin/schedule`을 열면 `/`로 간다
- 시드는 `createAdminUser`·`createApprovedUser`와 [schedule-data](schedule-data.md)가 낸 근무표 헬퍼다

### AC-12

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run`·e2e 명령 전부 초록. `sian-auditor`가 `schedule-admin.sian.html`과 문서를 대조한다 — backlog의 [`sian-sync`](../../backlog.md)가 이 시안에 적어둔 어긋남(없는 경로 `domain/schedule.md` 캡션)을 그때 같이 잡는다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/entities/schedule/dals/get-month-schedule.ts`·`get-month-availabilities.ts`·`get-hall-defaults.ts`·`__tests__/` | 읽기 셋 | AC-01 |
| `src/entities/schedule/dals/create-schedule.ts`·`set-application-deadline.ts`·`confirm-schedule.ts`·`open-day.ts`·`close-day.ts`·`set-day-hours.ts`·`set-hall-defaults.ts`·`__tests__/` | 쓰기 일곱 | AC-01 |
| `src/screens/schedule-admin/model/*.ts`·`__tests__/` | 그리드·칸 상태·확정 판정·셈·표기 | AC-02 |
| `src/features/schedule/*.ts`·`__tests__/` | query·mutation과 무효화, 오류 판정(이름은 구현이 정한다) | AC-04~AC-08 |
| `src/screens/admin-home/ui/*.tsx` · `/admin/` 화면 | 관리자 홈과 기본값 시트 | AC-03 |
| `src/screens/schedule-admin/ui/*.tsx` · `/admin/schedule/` 화면 | 달력·만들기·열기 모드·날 상세 껍데기·확정 | AC-04~AC-06·AC-08·AC-09 |
| `src/screens/applications/ui/*.tsx` · `/admin/applications/` 화면 | 모아보기와 마감일 시트 | AC-07 |
| `src/shared/ui/bottom-cta.tsx`·`callout.tsx`·`calendar-grid.tsx`·`month-picker-sheet.tsx` · (앞 task가 아직이면) 앱바·ListRow·시트·Tabs·Badge·토스트·빈 상태 | 공용 UI | AC-10 |
| `schedule-admin` e2e | e2e 한 줄기 | AC-11 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. [`schedule-data`](schedule-data.md)가 merge된 뒤에 시작한다.

1. account 쪽 task 넷의 상태를 본다. 공용 UI와 관리자 경로 보호가 merge됐으면 [변경 파일](#변경-파일)에서 빼고, 아니면 여기서 만든다. 파일 이름은 `members`을 따른다
2. `test-planner`가 AC-01~AC-10을 층에 배정한다. 계산은 unit, dal과 RLS는 integration, 흐름은 e2e다
3. writer 셋이 실패 테스트를 쓴다
4. `implementer`가 dal → model → 공용 UI → 홈 → 달력·만들기 → 열기 모드 → 날 상세 껍데기 → 모아보기 → 확정 → 확정 뒤 순으로 초록을 만든다. model이 서야 달력이 그릴 값이 생기고, 달력이 서야 열기 모드와 확정이 얹힌다
5. `sian-auditor`가 시안과 문서를 대조한다
6. `schedule-assign` 행이 `ready`로 올라오게 backlog를 고친다

## 리스크·전환·되돌리기

- **아직 없는 화면으로 가는 줄이 여섯이다.** 홈의 승인할 일·가입 대기·직원·시급·QR·통계가 각자의 task 것이라 이 PR 시점에 404일 수 있다. 전 영역 설계가 끝난 뒤 한꺼번에 구현하니 그 사이가 짧다 — 줄을 숨기지 않는다. 숨기면 어느 task가 그 자리를 채우는지가 화면에서 사라진다
- **날 상세가 둘로 갈린다.** 같은 화면을 두 PR이 만든다. 이 task가 임시 줄을 두고 `schedule-assign`이 지우는데, 그 사이에 임시 줄이 남으면 배정이 안 보이는 화면이 main에 있다. `schedule-assign`의 plan이 「임시 줄을 지운다」를 AC로 들어야 하고, 이 plan의 구현 순서 6이 그것을 backlog에 적는다
- **날 열기가 여러 번의 호출이다.** 한 번에 여러 날을 여는데 함수는 날 하나를 받는다. 부분 실패가 실제로 생기는 자리고 AC-05가 그 모양을 정했다. 함수를 배열로 바꾸는 쪽이 깔끔하지만 [design.md](../../2-design/modules/schedule/design.md#날-열기닫기)가 `open_day` 하나로 정본을 잡았다 — 바꾸려면 정본을 먼저 고친다
- **확정 뒤 되돌릴 수 없다.** e2e가 확정까지 도는데 같은 DB를 쓰는 테스트가 뒤에 오면 그 달을 못 쓴다. spec마다 다른 달을 쓰거나 시드를 격리한다
- **자정 경계를 테스트하기 어렵다.** 확정 잠김·열림이 오늘에 걸려 있다. 서버 시각 오프셋을 주입할 수 있게 model을 순수 함수로 두고 unit이 날짜를 넣어 본다 — e2e는 마감일을 과거로 시드해 열린 쪽만 본다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-02 | 그리드가 어긋난다, 확정 버튼이 잘못 켜진다, 셈이 틀린다 | unit `src/screens/schedule-admin/model/__tests__/`(예정) | `pnpm test` | 월요일 시작·빈칸·줄 수, 세 모습, 신청 수·빈 자리 수·「외 n개」 |
| AC-01 | 근무자에게 남의 신청이 샌다, 한 달이 여러 질의가 된다 | integration `src/entities/schedule/dals/__tests__/`(예정) | `pnpm test:integration:run` | RLS대로 좁혀지고 한 질의로 온다 |
| AC-04·AC-05·AC-06·AC-07·AC-08 | 흐름이 끊긴다, 쓰기 뒤 달력이 안 바뀐다 | e2e `schedule-admin` e2e(예정) | e2e 명령 | 만들기 → 날 열기 → 날 닫기 → 마감일 당기기 → 확정 한 줄기 |
| AC-05 | 부분 실패가 조용히 묻힌다 | e2e 위 spec | 위와 같다 | 실패한 날짜가 토스트에 서고 모드가 안 풀린다 |
| AC-08 | 확정이 두 번 돈다 | integration 위 | `pnpm test:integration:run` | `already_confirmed`를 성공으로 처리한다 |
| AC-09 | 확정 뒤에도 마감 줄·BottomCTA가 남는다 | e2e 위 spec | 위와 같다 | 배지와 확정 줄이 서고 넷이 사라진다 |
| AC-12 | 시안이 문서와 어긋난다 | `sian-auditor` | — | 어긋남 없음 |

- 배정하지 않은 것: 색·여백 토큰 — `sian-auditor`와 디자인 값 lint가 본다. 알림이 실제로 나가는지 — 알림 영역의 것이라 여기서는 함수 호출까지만 본다
- 막힌 것: 홈의 승인할 일 건수는 [`schedule-requests`](../../backlog.md) 뒤에 완성된다

## 범위 밖

- 자리·배정·사람 픽커·자격·강제 변경과 날 상세 안쪽 — [`schedule-assign`](../../backlog.md)
- 날 상세의 임시공휴일 줄과 근무 조정 줄 — [`payroll-adjust`](../../backlog.md). 값이 `holidays`와 `adjustments`로 간다
- 근무 요청 보내기와 요청 상태 — [`schedule-requests`](../../backlog.md)
- 근무자 근무표 화면 — [`schedule-worker`](../../backlog.md)
- 승인할 일 목록·가입 대기·직원·시급·QR·통계 화면 — 각자의 task. 이 task는 홈의 줄과 경로까지다
- 빈 자리 재촉 푸시와 확정 알림 — 알림 영역
- 관리자와 근무자 모드를 오가는 길 — [안 담은 것](../../2-design/modules/schedule/screens/schedule-admin.md#안-담은-것)
- 타입 생성 — [`types-generation`](../../backlog.md)
