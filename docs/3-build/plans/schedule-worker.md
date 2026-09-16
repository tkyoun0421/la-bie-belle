---
sources:
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무표
  - ../../2-design/modules/schedule/screens/schedule-worker.md#달-고르기-시트
  - ../../2-design/modules/schedule/screens/schedule-worker.md#날-시트
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무표-짜임
  - ../../2-design/modules/schedule/screens/schedule-worker.md#보기-전환-세그먼트
  - ../../2-design/modules/schedule/screens/schedule-worker.md#달력-순--기본
  - ../../2-design/modules/schedule/screens/schedule-worker.md#포지션-순--날짜-아코디언
  - ../../2-design/modules/schedule/screens/schedule-worker.md#확정-전--근무-신청
  - ../../2-design/modules/schedule/screens/schedule-worker.md#마감-뒤--확정-전
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무표를-아직-안-만든-달
  - ../../2-design/modules/schedule/screens/schedule-worker.md#달-고르기-시트-짜임
  - ../../2-design/modules/schedule/screens/schedule-worker.md#날-시트-짜임
  - ../../2-design/modules/schedule/screens/schedule-worker.md#인증-상태
  - ../../2-design/modules/schedule/screens/schedule-worker.md#시트의-문
  - ../../2-design/modules/schedule/screens/schedule-worker.md#실패와-경합
  - ../../2-design/modules/schedule/screens/schedule-worker.md#색
  - ../../2-design/modules/schedule/screens/schedule-worker.md#글자
  - ../../2-design/modules/schedule/screens/schedule-worker.md#근무표-문안
  - ../../2-design/modules/schedule/screens/schedule-worker.md#달-고르기-시트-문안
  - ../../2-design/modules/schedule/screens/schedule-worker.md#날-시트-문안
  - ../../2-design/modules/schedule/screens/schedule-worker.md#모션
  - ../../2-design/modules/schedule/design.md#근무-신청-내기
  - ../../2-design/modules/schedule/design.md#행위-밖의-실행-동작
  - ../../2-design/modules/schedule/README.md#sch-005
  - ../../2-design/modules/schedule/README.md#sch-006
  - ../../2-design/modules/schedule/README.md#sch-010
  - ../../2-design/modules/schedule/README.md#sch-019
  - ../../2-design/modules/attendance/README.md#att-008
  - ../../2-design/modules/attendance/README.md#att-016
  - ../../2-design/modules/attendance/README.md#att-020
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/system/navigation.md#뒤로
  - ../../2-design/system/runtime.md#읽기-범위
  - ../../2-design/system/runtime.md#무효화-표
  - ../../2-design/system/runtime.md#낙관적-업데이트
  - ../../2-design/system/runtime.md#로딩
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/design-system/components.md#근무표-날짜-칸
  - ../../2-design/design-system/components.md#bottomcta
  - ../../2-design/design-system/components.md#탭-바
  - ../../2-design/design-system/components.md#badge
  - ../../2-design/design-system/components.md#알림-블록
  - ../../2-design/design-system/components.md#dialog와-바텀시트
---

# 근무자 근무표 화면을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [schedule-worker.md](../../2-design/modules/schedule/screens/schedule-worker.md)다 — [근무표](../../2-design/modules/schedule/screens/schedule-worker.md#근무표)·[달 고르기 시트](../../2-design/modules/schedule/screens/schedule-worker.md#달-고르기-시트)·[날 시트](../../2-design/modules/schedule/screens/schedule-worker.md#날-시트)의 상태 표, [보기 전환 세그먼트](../../2-design/modules/schedule/screens/schedule-worker.md#보기-전환-세그먼트)·[달력 순](../../2-design/modules/schedule/screens/schedule-worker.md#달력-순--기본)·[포지션 순](../../2-design/modules/schedule/screens/schedule-worker.md#포지션-순--날짜-아코디언)·[확정 전 — 근무 신청](../../2-design/modules/schedule/screens/schedule-worker.md#확정-전--근무-신청)·[날 시트 짜임](../../2-design/modules/schedule/screens/schedule-worker.md#날-시트-짜임)·[인증 상태](../../2-design/modules/schedule/screens/schedule-worker.md#인증-상태)·[시트의 문](../../2-design/modules/schedule/screens/schedule-worker.md#시트의-문)의 짜임, 색·글자 표, 문안 표 셋이다. 쓰기 함수는 `submit_availability` 하나다([근무 신청 내기](../../2-design/modules/schedule/design.md#근무-신청-내기)) — 이 task가 만든다. 규칙은 [SCH-005](../../2-design/modules/schedule/README.md#sch-005)·[SCH-006](../../2-design/modules/schedule/README.md#sch-006)·[SCH-010](../../2-design/modules/schedule/README.md#sch-010)·[SCH-019](../../2-design/modules/schedule/README.md#sch-019)고, 인증 상태는 [ATT-008](../../2-design/modules/attendance/README.md#att-008)·[ATT-016](../../2-design/modules/attendance/README.md#att-016)·[ATT-020](../../2-design/modules/attendance/README.md#att-020)이다.

선행은 [`schedule-data`](schedule-data.md)뿐이다. [`schedule-admin`](schedule-admin.md)과 나란히 갈 수 있다 — 달력 그리드와 달 고르기 시트를 둘이 같이 쓰므로 먼저 merge되는 쪽이 만든다.

정본에서 확인한 다섯이 plan의 방향을 정한다.

- **한 화면이 달의 상태를 탄다.** `/schedule`이 확정된 달에서는 근무표고 확정 전 달에서는 제출 모드다([확정 전 — 근무 신청](../../2-design/modules/schedule/screens/schedule-worker.md#확정-전--근무-신청)). **별도 제출 화면이 없다.** 그래서 라우트 하나가 `schedules` 행의 유무와 `confirmed_at`과 `application_deadline`으로 네 모습 — 안 만든 달 / 접수 중 / 마감 뒤 확정 전 / 확정됨 — 을 가른다
- **근무 신청은 달 단위 덮어쓰기다.** [근무 신청 내기](../../2-design/modules/schedule/design.md#근무-신청-내기)가 「그 달 행을 지우고 새로 넣는다」고 정했다. 날짜마다 토글을 보내지 않고 저장 버튼이 한 번 보낸다. **0개로도 보낸다** — 이미 낸 신청을 전부 무르는 길이 그것뿐이다
- **체크만 즉시 칠한다.** 같은 절이 「근무 신청 체크만 즉시 칠한다」고 정했다. 날짜를 누르면 화면이 바로 표시하고 저장은 따로다 — 이것은 [낙관적 업데이트](../../2-design/system/runtime.md#낙관적-업데이트)가 아니라 **아직 안 보낸 로컬 상태**다. 보내기가 실패하면 고른 날이 그대로 남는다
- **「내 근무만」이 두 보기를 같이 탄다.** 상태가 하나고 거르는 방법이 보기마다 다르다 — 달력은 회색 면을 빼고 목록은 줄을 지운다([보기 전환 세그먼트](../../2-design/modules/schedule/screens/schedule-worker.md#보기-전환-세그먼트)). 켠 채 보기를 옮기면 켜져 있다
- **인증 상태가 시간에 걸린다.** 근무 시작 한 시간 전에 창이 열리면서 상태 열과 현황 줄이 **같이 나타난다**([인증 상태](../../2-design/modules/schedule/screens/schedule-worker.md#인증-상태)). 열리기 전에는 열이 통째로 없다 — 「아직 안 찍음」이 열한 줄 서면 안 온 사람들처럼 읽힌다. 값은 `check_ins`고 그 표는 attendance 영역이 낸다

지금 코드에 근무자 화면이 하나도 없고 탭 바도 없다. `/schedule` 라우트가 없다.

## 완료 조건

### AC-01

**`submit_availability`가 선다.** `supabase/migrations/<날짜>_schedule_functions.sql`에 더한다.

- `submit_availability(p_month date, p_dates date[])` — `security definer`, `set search_path = ''`. 첫 줄이 `is_approved()` 검사, 아니면 `not_allowed`
- 그 달 `schedules` 행이 없으면 `no_schedule`. `application_deadline`이 지났으면 `window_closed` — 마감은 그 날 끝까지다(`now()`의 Asia/Seoul 날짜가 `application_deadline`보다 뒤면 닫힘)
- 확정된 달이면 `already_confirmed`
- **그 달 내 `availabilities` 행을 전부 지우고 받은 날짜를 넣는다.** 한 트랜잭션이다. `p_dates`가 빈 배열이면 지우기만 한다
- 받은 날짜 중 그 달 밖이 있으면 `bad_dates`. 함수가 마지막 문이다 — 화면이 먼저 막는다
- 자기 행만 만진다. `p_profile_id`를 안 받는다 — 남의 신청을 내는 길을 만들지 않는다

`error-codes.ts`에 `window_closed`·`bad_dates`가 든다.

### AC-02

**읽기 dal과 model.**

- `get-month-schedule.ts`는 [schedule-admin](schedule-admin.md#ac-01)이 만든 것을 그대로 쓴다 — `['schedule', 'YYYY-MM']` 하나가 `days`·`slots`·`assignments`를 임베딩한다([행위 밖의 실행 동작](../../2-design/modules/schedule/design.md#행위-밖의-실행-동작)). 근무자 세션에서는 RLS가 같은 질의를 좁힌다. **명단을 보려면 배정된 사람의 이름이 필요하니** `assignments`에 프로필 이름을 임베딩한다 — 근무자도 근무표 전체를 본다([SCH-019](../../2-design/modules/schedule/README.md#sch-019))
- `get-my-availability.ts` — `['availability', 'YYYY-MM']`. 내 그 달 신청 날짜들. 관리자 화면이 쓰는 전원 질의와 키가 같으니 **RLS가 갈라준다** — 근무자에게는 자기 행만 온다
- `submit-availability.ts` — 쓰기 dal 하나
- 앞뒤 한 달은 `prefetchQuery`다. 세 달 밖은 그때 읽는다
- model(`src/screens/schedule-worker/model/`)
  - 달의 네 모습 판정 — 안 만든 달 / 접수 중 / 마감 뒤 확정 전 / 확정됨
  - 달력 칸 상태 — 내 근무 / 남의 근무만 / 닫힌 날 / 오늘 / 요청 온 날, 그리고 「내 근무만」이 켜졌을 때의 면 제거. 정본은 [components.md](../../2-design/design-system/components.md#근무표-날짜-칸)
  - 아코디언 줄의 내 상태 — 내 포지션 이름 / 「근무 없음」 / 「교육 · 드레스」
  - 날 시트 명단 정렬 — 포지션 정본 순서(팀장·스캔·메인·드레스·축가·매니저·안내·드레스실·대기실). 한 포지션에 여럿이면 사람마다 줄이고 포지션 이름은 첫 줄에만
  - 부제 인원 — 정규와 교육을 같이 센다([ATT-020](../../2-design/modules/attendance/README.md#att-020)). 교육 하나 붙은 열한 자리 날이 「12명」이다
  - 빈 자리 줄 — 자리 수보다 배정이 적으면 그 줄이 「빈 자리」
  - 현황 줄 — 「11명 중 9명 출근 · 지각 1 · 아직 1」. **0인 항목은 뺀다.** 전원이 제때 찍었으면 「11명 전원 출근」
  - 버튼 둘의 노출 — 내 근무 날이고 근무 전날까지고 요청 중이 아닐 때만
  - 마감 줄 문구 — 접수 중이면 「스케줄 신청 마감 10월 2일(금) · 3일 남았어요」, 마감 뒤면 「스케줄 신청이 10월 2일에 마감됐어요」
  - 달 고르기 시트 — 근무표가 없는 달은 흐리되 눌린다

전부 unit 테스트가 든다.

### AC-03

**근무표 화면의 뼈대.** `src/app/schedule/page.tsx` → `src/screens/schedule-worker/`.

- 앱바 — 「2026년 10월」과 양옆 화살표, 제목 오른쪽에 `chevron-down` 14px. 제목을 누르면 달 고르기 시트. **「근무표」가 제목에 없다**
- 달 이동에 열람 제한이 없다. 연도 줄도 마찬가지다 — 입사 이전 해로 가면 열두 칸이 전부 흐리다
- 화면 맨 아래 [탭 바](../../2-design/design-system/components.md#탭-바) 고정, 「근무표」가 지금 탭
- URL이 `?month=`와 `?date=` 둘을 받는다. `?date=`로 오면 그 달을 열고 날 시트가 열린 채다
- 들어오는 문 넷 — 탭 바, 대시보드 「이번 주 근무」 줄, 알림 CTA, 달력의 요청 온 날 칸. 시트를 닫으면 `?month=`다
- 확정된 달에만 보기 전환 세그먼트와 「내 근무만」이 선다

### AC-04

**달력 순.** 기본 보기다.

- 월 달력, 주는 월요일 시작, 이 달 밖 칸은 빈칸. 그리드 계산은 [schedule-admin](schedule-admin.md#ac-02)의 model과 같은 조각을 쓴다
- 내 근무 날 — `bg.brand-weak` 면에 `bg.brand-solid` 점. 교육 배정도 같은 칸이다
- 예식이 있지만 내가 안 나가는 날 — 회색 면만
- 오늘 — 날짜 숫자를 검은 원이 감싼다. 칸 배경은 그날 상태 그대로라 오늘이 내 근무면 브랜드 면에 원과 점이 같이 선다
- 근무 요청이 온 날 — 회색 면에 브랜드 점선이 돌고 있다. 누르면 요청 시트가 열린다
- 달력 아래 한 줄 — 기본은 표식 설명(「점이 내 근무예요」, 요청이 있으면 「점이 내 근무, 도는 점선이 근무 요청이에요」), 사건이 있으면 그것(「10월 17일 안내 자리는 다른 분이 맡았어요」). **사건 문구는 이 진입에서만 산다** — 떠났다 오면 표식으로 돌아간다. 색은 어느 쪽이든 `fg.neutral-subtle` · `text-xs`
- 열린 날은 전부 눌린다 — 내 근무가 없어도 누가 나가는지 본다

### AC-05

**포지션 순과 「내 근무만」.**

- 아코디언이 열린 날만 날짜순으로 선다. 기본은 전부 접힘
- 날짜 줄 — 왼쪽 「10월 10일(토)」, 오른쪽에 내 상태(포지션 이름 `fg.brand` / 「근무 없음」 `fg.neutral-subtle` / 「교육 · 드레스」)
- 펼치면 날 시트와 같은 구성 — 포지션 순서, 내 줄 강조, 오른쪽 끝 인증 상태, 끝에 같은 버튼 둘. **현황 줄은 여기서 안 선다** — 날짜 줄이 이미 그 자리를 쓴다
- 「내 근무만」 체크박스는 세그먼트 오른쪽 끝, 두 보기에서 같은 자리
- **상태가 하나다.** 한쪽에서 켜면 다른 쪽도 켜져 있다
- 달력에서 켜면 — 내가 안 나가는 날의 회색 면이 빠진다. **날짜 글자는 `fg.neutral-muted` 그대로**라 닫힌 날(`fg.neutral-subtle`)과 갈린다. **그 날들은 그대로 눌린다.** 요청 온 날의 도는 점선은 남는다 — 면은 「예식이 있다」고 점선은 「나한테 요청이 왔다」라 뜻이 다르다
- 목록에서 켜면 — 내 근무 없는 날 줄이 사라지고 펼침에도 내 줄만 남는다. 버튼은 그대로 선다
- 확정 전 달에는 세그먼트도 체크박스도 안 선다

### AC-06

**확정 전 — 근무 신청.** 같은 달력이 제출 모드다.

- 달력 칸이 점선이다. 날짜를 눌러 고르고, 고른 날은 `bg.brand-weak-selected` 면에 `stroke.brand-solid` 테두리와 체크
- 개수 상한이 없다
- 마감 줄이 달력 위에 선다
- 하단 고정 「보내기」([BottomCTA](../../2-design/design-system/components.md#bottomcta))가 탭 바 위에 얹힌다 — 보내기가 위라 엄지가 먼저 닿는다
- **0개로도 보낸다.** 버튼이 안 잠긴다
- 보내면 → `submit_availability`. 토스트 「10월 근무 신청을 보냈어요」가 뜨고 달력은 고른 채 그대로다. `['availability']`를 무효화한다
- **마감 전 재진입이면 보낸 날짜가 선택된 채 열린다.** 고쳐 다시 보내면 이전 제출을 덮어쓴다
- 마감 뒤 확정 전 — 달력이 읽기 전용이다. 보낸 신청이 고른 날 표시 그대로 보이고, 날짜가 안 눌리고, 보내기가 없다. 마감 줄 문구가 바뀌고 그 아래 「근무표를 만들고 있어요. 확정되면 여기에 보여요」
- 안 만든 달 — 빈 달력(같은 점선 칸)이고 아무 날짜도 안 눌리고 「아직 10월 근무 신청을 받지 않아요. 열리면 알려드릴게요」

### AC-07

**날 시트.**

- 바텀시트다. 제목이 날짜, 부제가 근무 시간과 인원 「10:00 – 18:00 · 11명」
- 명단 — 포지션 정본 순서. 줄은 포지션 이름(`fg.neutral-subtle` · `text-xs`)과 사람 이름. 교육 배정은 Badge neutral 「교육」
- 내 줄 — `bg.brand-weak` 면에 오른쪽 끝 「나」(`fg.brand`). 인증 상태가 서는 날은 「나」가 왼쪽, 상태가 오른쪽
- 빈 자리 — 「빈 자리」(`fg.neutral-subtle`)
- 하단 버튼 둘 — 「근무 취소」(secondary, 왼쪽)와 「교대 요청」(primary, 오른쪽). 내가 안 나가는 날에는 둘 다 없다. 근무 전날까지고 지난 날은 조회만이다
- 시트는 history에 든다 — 브라우저 뒤로가 시트를 닫고 화면을 안 떠난다([뒤로](../../2-design/system/navigation.md#뒤로))
- 요청 중이면 내 줄에 Badge neutral 「교대 요청 중」 또는 「취소 요청 중」이 서고 버튼 둘이 비활성이다. **값을 채우는 것은 [`schedule-requests`](../../backlog.md)와 swap이다** — 이 task는 자리와 모양만 둔다

### AC-08

**인증 상태.** 값은 attendance 영역의 `check_ins`다.

- 명단 줄 오른쪽 끝에 상태, 부제 아래에 현황 줄(`mt-2`)
- **인증 창이 열리기 전에는 상태 열이 통째로 없다.** 근무 시작 한 시간 전에 창이 열리면서 상태 열과 현황 줄이 같이 나타난다([ATT-008](../../2-design/modules/attendance/README.md#att-008))
- **색으로 안 가른다.** 여섯이 다 `fg.neutral-muted`고 시각에 `tabular-nums`. 지각과 결근에 경고색을 안 쓴다
- 사유 글은 안 보인다. 「확인 중」까지가 명단이 말하는 전부다
- 지난 날에도 남는다
- **`check_ins` 표가 아직 없다.** attendance task 뒤에 값이 찬다 — 그때까지 상태 열과 현황 줄이 안 선다. 자리와 model 판정은 여기서 만들고 [선행이 갈린 자리](#ac-09)에 적는다

### AC-09

**선행이 갈린 자리 넷.** 이 task의 PR에 들어오지 않는다.

- **인증 상태 값 — `attendance` 뒤.** `check_ins`를 읽어 여섯 상태와 현황 줄을 채운다. 그때 `['schedule']` 질의에 `check_ins` 임베딩을 더한다
- **교대 요청 시트 — swap 뒤.** [교대 요청 시트 짜임](../../2-design/modules/schedule/screens/schedule-worker.md#교대-요청-시트-짜임)의 후보 목록·CTA·두 번째 길이 swap 영역의 것이다. 이 task는 날 시트의 「교대 요청」 버튼까지다
- **근무 취소 시트와 근무 요청 시트 — [`schedule-requests`](../../backlog.md) 뒤.** 사유 입력과 「근무할게요」·「어려워요」가 그 task다. 달력의 요청 온 날 점선도 값이 거기서 온다
- **대시보드 「이번 주 근무」 줄에서 오는 문 — `dashboard` 뒤.** `?date=`로 시트가 열린 채 오는 동작은 여기서 만들고, 보내는 쪽 화면이 그 task다

### AC-10

**공용 UI가 는다.**

- 이 화면이 첫 자리인 것 — 탭 바(`tab-bar.tsx`), 아코디언(`accordion.tsx`)
- schedule-admin과 같이 쓰는 것 — 달력 그리드, 달 고르기 시트, BottomCTA, 알림 블록. **먼저 merge되는 쪽이 만든다**
- **보기 전환 세그먼트와 「내 근무만」 체크박스는 `src/shared/ui/`로 안 올린다.** [규칙과 부딪힌 자리](../../2-design/modules/schedule/screens/schedule-worker.md#규칙과-부딪힌-자리)가 둘 다 「두 번째 사용자가 나올 때 정한다」로 보류했다. 화면 안에 둔다 — 증축 규칙대로 상처가 생긴 자리에만 짓는다
- 다만 값은 [세그먼트](../../2-design/design-system/components.md#세그먼트) 절을 따른다 — 트랙 44px·안쪽 여백 4px·칸 36px·트랙 `rounded-lg`·선택 칸 10px·선택 면이 `--d-fast`로 미끄러진다. 그 절의 것과 다른 점은 글자 대신 아이콘 둘이라는 것뿐이고, 접근성 라벨을 「달력 순」·「포지션 순」으로 단다

### AC-11

**테스트.**

- unit: AC-02 전부(네 모습 판정·칸 상태·「내 근무만」 거르기·아코디언 내 상태·명단 정렬·인원 셈·현황 줄의 0 제외·버튼 노출·마감 줄 문구)
- integration: `submit_availability`의 승인 검사·마감 뒤 `window_closed`·확정 뒤 `already_confirmed`·덮어쓰기(이전 행이 사라진다)·빈 배열로 전부 지우기·그 달 밖 날짜 `bad_dates`·남의 행을 못 만지는 것. `get-my-availability`가 근무자에게 자기 행만 주는 것
- e2e(`tests/e2e/schedule-worker.spec.ts`): 근무자가 `/schedule`을 열어 확정 전 달에서 날짜 셋을 고르고 보내고 → 다시 들어와 고른 채 열리는지 → 하나 빼고 다시 보내 덮어쓰는지 → 확정된 달에서 보기를 바꾸고 「내 근무만」을 켜고 → 날을 눌러 시트를 보고 브라우저 뒤로로 닫는 데까지

### AC-12

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run`·`pnpm build && pnpm e2e` 전부 초록. `sian-auditor`가 `schedule-worker.sian.html`과 문서를 대조한다 — backlog의 [`sian-sync`](../../backlog.md)가 이 시안에 적어둔 어긋남(후보 없음 버튼 문구·「취소 요청 중」과 「보내기 실패」와 「배정이 사라졌을 때」 목업)을 그때 같이 잡는다.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_schedule_functions.sql` | `submit_availability` | AC-01 |
| `src/shared/api/error-codes.ts` | `window_closed`·`bad_dates` | AC-01 |
| `src/entities/schedule/dals/get-my-availability.ts`·`submit-availability.ts`·`__tests__/` | 읽기 하나, 쓰기 하나 | AC-02 |
| `src/entities/schedule/dals/get-month-schedule.ts` | 이름 임베딩 | AC-02 |
| `src/screens/schedule-worker/model/*.ts`·`__tests__/` | 네 모습·칸 상태·거르기·명단·셈·문구 | AC-02 |
| `src/features/schedule/*.ts`·`__tests__/` | query·mutation과 무효화 | AC-06 |
| `src/screens/schedule-worker/ui/*.tsx` · `src/app/schedule/page.tsx` | 달력 순·포지션 순·제출 모드·날 시트 | AC-03~AC-08 |
| `src/shared/ui/tab-bar.tsx`·`accordion.tsx` · (admin이 아직이면) `calendar-grid.tsx`·`month-picker-sheet.tsx`·`bottom-cta.tsx` | 공용 UI | AC-10 |
| `tests/e2e/schedule-worker.spec.ts` | e2e | AC-11 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. [`schedule-data`](schedule-data.md)가 merge된 뒤에 시작한다.

1. `schedule-admin`의 상태를 본다. 달력 그리드·달 고르기 시트·BottomCTA가 merge됐으면 [변경 파일](#변경-파일)에서 빼고 아니면 여기서 만든다. 둘이 같이 열려 있으면 뒤에 merge되는 쪽이 충돌을 푼다
2. `test-planner`가 AC-01~AC-10을 층에 배정한다
3. writer 셋이 실패 테스트를 쓴다
4. `implementer`가 함수 → dal → model → 공용 UI → 제출 모드 → 달력 순 → 포지션 순 → 「내 근무만」 → 날 시트 순으로 초록을 만든다. **제출 모드가 먼저인 것은 확정 전 달이 근무표보다 단순하고 쓰기 경로가 거기 하나이기 때문이다**
5. `sian-auditor`가 시안과 문서를 대조한다
6. AC-09의 넷을 `attendance`·swap·`schedule-requests`·`dashboard` task의 plan이 잇도록 backlog 행에 적는다

## 리스크·전환·되돌리기

- **인증 상태가 한동안 안 선다.** `check_ins` 표가 없어 상태 열과 현황 줄이 비어 있다. 명단만으로도 화면이 서지만 시안과 다르게 보인다 — `sian-auditor`가 그 차이를 「아직」으로 읽게 [AC-09](#ac-09)를 plan에 남긴다
- **덮어쓰기가 조용히 지운다.** `submit_availability`가 그 달 행을 전부 지우고 다시 넣는다. 화면이 보낸 배열이 낡았으면 사용자가 모르는 채로 신청이 줄어든다. 재진입에 서버 값으로 다시 칠하는 것이 방벽이고, e2e가 덮어쓰기를 한 번 본다
- **버튼 둘이 서는데 갈 곳이 없다.** 「근무 취소」와 「교대 요청」이 각각 다른 task의 시트를 연다. 이 PR 시점에는 눌러도 아무것도 안 열린다 — **버튼을 숨기지 않는다.** 숨기면 어느 task가 그 자리를 채우는지가 화면에서 사라진다. e2e가 버튼의 존재만 본다
- **아이콘 세그먼트와 체크박스가 문서-로컬이다.** 화면 안에 두면 다음 사용자가 나왔을 때 같은 것을 두 번 만들 수 있다. 정본이 보류한 자리라 지금 올리지 않는 것이 맞지만, `pr-diff`가 이 조각들이 `src/shared/ui/`로 새지 않았는지 본다 — 올리는 판단은 두 번째 사용자가 나올 때 총괄이 한다
- **탭 바와 BottomCTA가 겹친다.** 제출 모드에서 둘이 같이 선다. 엄지가 닿는 자리가 두 층이라 실기기에서 한 번 본다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 마감 뒤에 신청이 들어간다, 남의 신청을 낸다 | integration `src/entities/schedule/dals/__tests__/submit-availability.integration.test.ts`(예정) | `pnpm test:integration:run` | `window_closed`·`already_confirmed`·`bad_dates`, 자기 행만 |
| AC-01 | 덮어쓰기가 이전 행을 남긴다 | integration 위 | 위와 같다 | 이전 행이 사라지고 빈 배열이 전부 지운다 |
| AC-02 | 달의 네 모습을 잘못 가른다, 인원을 잘못 센다 | unit `src/screens/schedule-worker/model/__tests__/`(예정) | `pnpm test` | 네 모습, 교육 포함 인원, 현황 줄 0 제외 |
| AC-05 | 「내 근무만」이 닫힌 날과 안 갈린다 | unit 위 + e2e | 위와 같다 | 면은 빠지고 글자는 `fg.neutral-muted`, 그 날들이 눌린다 |
| AC-06 | 재진입에 고른 날이 안 뜬다 | e2e `tests/e2e/schedule-worker.spec.ts`(예정) | `pnpm build && pnpm e2e` | 보낸 날짜가 선택된 채 열리고 덮어쓰기가 된다 |
| AC-07 | 브라우저 뒤로가 화면을 떠난다 | e2e 위 spec | 위와 같다 | 시트만 닫히고 URL이 `?month=`다 |
| AC-12 | 시안이 문서와 어긋난다 | `sian-auditor` | — | 어긋남 없음 |

- 배정하지 않은 것: 탭 바와 BottomCTA가 겹치는 엄지 자리 — 실기기에서 손으로 본다. 색·여백 토큰 — `sian-auditor`와 디자인 값 lint가 본다
- 막힌 것: 인증 상태는 `attendance` 뒤, 시트 셋은 swap·`schedule-requests` 뒤에 찬다

## 범위 밖

- 교대 요청 시트 — swap 영역
- 근무 취소 시트와 근무 요청 시트, 요청 온 날 점선의 값 — [`schedule-requests`](../../backlog.md)
- 인증 상태 값과 `check_ins` — attendance 영역
- 대시보드 — [`dashboard`](../../backlog.md)
- 관리자 화면 — [`schedule-admin`](schedule-admin.md)·[`schedule-assign`](schedule-assign.md)
- 알림 발송 — 알림 영역
- 타입 생성 — [`types-generation`](../../backlog.md)
