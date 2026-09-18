# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**구현은 전 영역의 설계가 끝난 뒤 한꺼번에 한다.** task 하나의 plan이 섰다고 그 task를 구현하지 않는다. 영역마다 ① 정본의 「아직 안 정한 것」을 인터뷰로 닫고(한 라운드 한 질문) ② 정본에 반영하고 ③ 시안을 갱신해 아티팩트로 사용자가 보고 승인하고 ④ plan을 쓴다. 순서는 account → schedule → attendance → payroll → notification → system이고 swap은 2차라 뒤다. 실패 테스트 작성부터가 구현 단계라 plan 뒤에 writer를 띄우지 않는다.

account가 끝났다. 미정이 다 닫혔고(login·README·members-pending·members·profile), 시안 셋이 아티팩트로 승인됐고, 화면 plan 넷이 섰다 — [profile-form](3-build/plans/profile-form.md)·[members-pending](3-build/plans/members-pending.md)·[profile-screen](3-build/plans/profile-screen.md)·[members](3-build/plans/members.md). plan을 쓰다 나온 결정 열둘을 정본에 반영했다 — `already_decided` 코드, `profile_private.email`, `phone` check 제약, 차단 해제가 `submitted_at`도 비우기, `/admin/members/blocked` 경로, `is_admin()`이 퇴사·차단을 보기, `last_admin` 셈에 퇴사·차단 제외와 퇴사 처리도 막기, 쓰기는 전부 응답 대기, 관리자는 자기 이름 고치기 가능, 지난 시간 표기 규칙, 하나 고르는 목록 공용화, `profile-erasure` task 신설.

**schedule 영역의 미정이 다 닫혔고 정본에 반영됐다.** 결정 다섯이다.

- **근무표는 달력 달이다** — 8월 근무표 = 8월 1일~8월 31일([SCH-010](2-design/modules/schedule/README.md#sch-010)). 주 묶음(8/3~9/6)을 버렸다. 급여 월 조회도 따라 달력 달이 됐고([PAY-022](2-design/modules/payroll/README.md#pay-022)) 달을 걸친 주는 날마다 갈린다. 화면에서는 범위 줄이 사라지고 그리드가 이 달 밖으로 남긴 칸은 빈칸이다
- **교육 배정 행이 서면 그 자리에서 자격이다** — 교육 날이 안 왔어도, 출근 인증이 없어도 센다([SCH-013](2-design/modules/schedule/README.md#sch-013)). 거두는 길은 배정을 지우는 것 하나
- **사람 픽커 줄 오른쪽 끝에 성별 기호**(lucide `Venus`/`Mars`, `fg.neutral-subtle`). 색으로는 안 가른다. **길게 누르면 사람 시트**가 겹쳐 올라온다 — 사진·이름·「♀ 여 · 98년생」·자격
- **나이는 만 나이가 아니라 년생**이다 — `98년생` 꼴([writing.md](2-design/design-system/writing.md#숫자와-단위))
- **교육 배정도 인증을 찍는다**는 [ATT-020](2-design/modules/attendance/README.md#att-020)이 이미 닫아둔 것이라 화면 문서가 그것을 따랐다 — 부제와 현황 줄 인원에 든다
- `emit_reminders`는 cron 항목 하나고 함수가 요일을 본다([notification/design.md](2-design/modules/notification/design.md#행위-밖의-실행-동작))

schedule 시안 둘은 갱신해 아티팩트로 올렸고 감사도 마쳤다.

**디자인 시스템의 라운딩이 바뀌었다.** 누를 수 있는 것을 알약에서 내렸다 — `rounded-lg`가 16px에서 **14px**이 되고 버튼·세그먼트·토스트가 거기로 갔다. 배지는 `rounded-sm`(8px), 높이 32px 이하인 작은 버튼도 8px이다. `rounded-full`은 원과 트랙에만 남는다 — 사진·이니셜 원, 점, 시트 손잡이, 하루 띠, 스위치, 글자 없이 아이콘만 든 정사각형 버튼. 정본 셋(`tokens.md`·`spacing-shape.md`·`components.md`)과 화면 문서 여덟, 시안 열넷, `src/app/globals.css`(`pnpm tokens:css`)까지 따라갔다. 구글 로그인 버튼은 근거를 잃어 직사각형 자산으로 바뀌었고, 「알약」이라 부르던 조각 이름은 상태 배지·확인 중 배지·보기 전환 세그먼트·secondary 버튼이 됐다.

토스트도 같이 고쳤다 — `left: 50%`에 `right`가 없어 쓸 수 있는 폭이 화면 절반으로 눌리던 배치 버그였다. 좌우 24px에 `margin: 0 auto`다. 한 줄 규칙과 문안 길이 기준은 `writing.md`의 새 「토스트」 절에 있다.

**시안 개선 제안서([design-sian-improvements](proposals/design-sian-improvements.md))를 열 항목 다 검토했다.** 최신 결정과 부딪히는 자리는 없다. 판정은 이렇다 — D-01 서체와 D-02 터치 영역은 제안이 아니라 정본 위반이라 바로 고치고, S-01 조작 상태와 S-02 로딩·통신 실패는 `components.md`와 `runtime.md`에 이미 열려 있는 미정이라 채택하되 순서를 뒤로 뒀다. D-03 대시보드 위계와 S-03 미리보기와 C-01 근무 변경 요약과 C-03 첫 출근 안내는 각자 제 영역 차례에 본다. 기각 둘 — D-04는 관리자 홈 화면 문서가 아직 없어서 정할 대상이 없고, C-02는 [급여 화면](2-design/modules/payroll/screens/payroll.md#규칙과-부딪힌-자리)이 「검산이 실제로 막히면 그때 프로필에 「내 시급」을 세운다」로 이미 조건부로 닫아둔 것이라 조건이 안 찼다.

**D-01과 D-02가 끝났다**([#372](https://github.com/tkyoun0421/la-bie-belle/pull/372)). 시안 열넷의 앱 목업이 시스템 서체를 쓰고 있어서 [서체 연결](2-design/design-system/tokens.md#서체-연결)을 그대로 걸게 했다 — 아티팩트는 외부 스타일시트를 `fonts.googleapis.com`에서만 받고 Wanted Sans는 거기 없어 링크가 조용히 차단되니, `pnpm sian:inline <시안 경로>`가 그 화면에 찍히는 글자가 든 조각만 골라 심은 복사본을 `.artifact/`에 만든다(절차는 [2-design/README](2-design/README.md)의 시안 만들기 절). 누를 수 있는데 세로가 44px이 안 되던 36종은 `::after`로 닿는 면만 넓혀 0이 됐고, 남은 셋은 문서가 허용한 가로 예외다. 실측은 `.artifact/measure-hit.mjs`가 한다.

제안서의 결정 기록도 채웠다 — [design-sian-improvements](proposals/design-sian-improvements.md)가 `accepted`고 항목별 표가 본문에 있다. 남은 판단 항목이 없다.

**schedule plan 다섯이 다 섰다.** [schedule-data](3-build/plans/schedule-data.md)·[schedule-admin](3-build/plans/schedule-admin.md)·[schedule-assign](3-build/plans/schedule-assign.md)·[schedule-worker](3-build/plans/schedule-worker.md)·[schedule-requests](3-build/plans/schedule-requests.md)다. backlog의 `schedule` 한 행을 다섯으로 갈랐다 — 그 행이 「남은 미정 둘을 먼저 닫는다」로 멈춰 있었는데 미정은 이미 다 닫혔다.

plan을 쓰며 가른 경계 넷이다.

- **날 상세가 두 task로 갈린다.** `schedule-admin`이 앱바·근무 시간 줄·근무 신청 줄·「이 날 닫기」까지 만들고 포지션 줄 자리에 임시 줄을 둔다. `schedule-assign`이 그 임시 줄을 지우며 자리 카드·픽커·잠금·끌기를 채운다. 가르는 선이 `open_day`/`close_day`와 `add_slot`/`add_assignment` 사이다
- **`schedule-data`는 함수 일곱까지다.** 표 아홉과 뷰와 RLS에 근무표 뼈대 함수(`create_schedule`·`set_application_deadline`·`confirm_schedule`·`open_day`·`close_day`·`set_day_hours`·`set_hall_defaults`)만 낸다. 나머지 열셋은 각 화면 task가 자기 테스트와 같이 낸다
- **`schedule-worker`는 `schedule-admin`과 나란히 간다.** 선행이 `schedule-data` 하나뿐이다. 달력 그리드·달 고르기 시트·BottomCTA를 둘이 같이 쓰니 먼저 merge되는 쪽이 만든다
- **`schedule-requests`가 pg_cron을 처음 켠다.** `expire_requests` 하나고 `supabase/config.toml`에 설정이 아직 없다. 자리를 채우는 길 셋(`add_assignment`·`force_change`·`close_day`)을 `create or replace`로 고쳐 요청을 닫는 일도 거기 있다

다른 영역이 이어받을 자리도 backlog 행에 적었다 — `members`의 `mark_leave` 남은 배정 검사, `attendance`의 인증 상태 열과 approvals 사유 줄이다.

**attendance 영역이 끝났다.** 미정이 다 닫혔고 정본에 반영됐고 시안이 따라갔고 plan 넷이 섰다 — [attendance-data](3-build/plans/attendance-data.md)·[attendance-qr](3-build/plans/attendance-qr.md)·[attendance-checkin](3-build/plans/attendance-checkin.md)·[attendance-excuse](3-build/plans/attendance-excuse.md). backlog의 `attendance` 한 행을 넷으로 갈랐다.

인터뷰로 닫은 결정 넷이다.

- **인쇄용 그림은 A4 비율이다** — 2480×3508픽셀 300dpi에 제목과 안내 한 줄과 자르는 선까지 들어간다. 화면의 QR과 다른 그림이고 브라우저 canvas가 그린다 — 서버에 파일을 두면 `rotate_qr`이 도는 순간 낡은 그림이 남는다
- **내려받기가 막히면 새 탭에 그림을 띄운다.** 실패를 말하는 문장을 앞에 안 붙이고 토스트가 「그림을 길게 눌러 저장하세요」만 말한다
- **오래된 QR을 앱이 재촉하지 않는다.** 교체 주기가 규칙으로 안 서 있으니 몇 달이 「오래됐다」인지도 앱이 정할 일이 아니다. 화면은 쓰기 시작한 날만 적는다
- **종이의 QR이 담는 것은 앱 주소다** — `/check-in?c=<코드>`. 앱 안에 스캐너가 없고 기기 카메라 앱이 찍으면 링크가 앱을 열어 인증한다. 카메라 권한을 안 받는 길이고, 위치 권한을 이미 거부한 사람에게 권한 창을 한 번 더 안 띄운다. 대가는 코드가 주소에 실리는 것이라 [ATT-027](2-design/modules/attendance/README.md#att-027)의 구멍이 조금 넓어진다 — 인증 뒤 주소에서 `c`를 지워 덜 남게 한다

넷째는 정본 둘이 부딪힌 자리에서 나왔다 — `qr.md`가 「앱 안에 스캐너가 없다」고 적고 `check-in.md`가 「QR 시트 → 스캔」이라 적고 있었다. 그 결정이 `/check-in`의 모습을 넷에서 **여섯**으로 늘렸다(「QR로 들어옴」·「코드가 죽었다」). 「위치를 못 본다」의 주요 버튼 「QR 찍기」는 사라졌다 — 앱이 스캐너를 열 수 없으니 누를 것이 없는 버튼이 된다.

plan을 쓰며 가른 경계 셋이다.

- **`attendance-data`가 상태 계산을 소유한다.** 출근·지각·안 찍음·확인 중·인정·결근 여섯이 저장되지 않으니 그 순수 함수가 저장소에 한 벌만 있어야 한다. 명단·대시보드·근태 집계·급여가 전부 그것을 부른다 — payroll이 결근을 다시 세면 두 벌이 선다
- **`attendance-excuse`는 문 셋이 남의 task에 있다.** 대시보드 못 찍음 블록, `/admin/approvals` 목록, 근무자 날 시트다. 임시 진입점을 만들지 않고 기다린다
- **`attendance-checkin`은 사람이 콘솔에서 할 일이 선행이다.** NCP 대표 계정 지정과 지도 키·`customStyleId` 발급이다. 대표 계정을 안 잡으면 첫 호출부터 과금이다

**payroll 영역의 미정이 다 닫혔고 정본에 반영됐다.** 인터뷰가 두 덩이였다 — 공휴일·시급·조회 열, 그리고 그 과정에서 처음 나온 **리허설**이 여덟이다.

첫 덩이 열이다.

- **공휴일은 앱이 알아서 받는다** — pg_cron `fetch_holidays`가 날마다 다음 해가 비었는지 보고 `pg_net`으로 Edge Function `import-holidays`를 쏜다([PAY-023](2-design/modules/payroll/README.md#pay-023)). 한 해에 실제로 밖을 부르는 것은 한 번이고 실패하면 다음 날 같은 조건이 다시 쏜다 — 날마다 도는 것이 곧 재시도라 실패 큐가 없다
- **임시공휴일은 관리자가 날마다 표시한다**([PAY-027](2-design/modules/payroll/README.md#pay-027)) — 날 상세의 스위치 하나고 `manual`로 따로 남아 받기가 안 덮는다. 받아온 공휴일인 날에는 켜진 채 잠긴다
- **시급 상한 100,000원**이고 자릿수만 막는다. **이력은 세 줄**까지 보이고 최저임금은 안 본다
- 급여 화면의 **달을 걸친 주는 「10월 27일~11월 2일」**로 쓰고, **연 조회에만 목록 맨 아래 합계 줄**이 선다 — 안 눌리고 화살표가 없다
- **`set_adjustment`의 화면이 없던 구멍을 닫았다** — 날 상세에 「근무 조정」 줄이 서고 시트에 그날 배정된 전원이 뜬다([schedule-admin.md](2-design/modules/schedule/screens/schedule-admin.md#근무-조정)). `wages.md`와 `stats.md`가 「날 상세의 명단에서」라 가리키는데 `schedule-admin.md` 짜임에 그 줄이 없었다

**리허설은 문서에 아예 없던 개념이라 새로 세웠다**([SCH-020](2-design/modules/schedule/README.md#sch-020)~[SCH-023](2-design/modules/schedule/README.md#sch-023)·[PAY-028](2-design/modules/payroll/README.md#pay-028)).

- **자격 있는 근무자가 스스로 넣고 승인이 없다.** 자격은 `position_grants`에 `'리허설'` 한 줄이고 관리자가 준다 — 교육 배정으로는 안 생긴다. 리허설 일정은 담당자가 신랑신부와 직접 잡아 관리자가 언제인지 모른다
- **본인과 관리자만 본다.** 다른 근무자의 그날 명단에 안 뜨고 현황 머릿수에도 안 든다 — [SCH-019](2-design/modules/schedule/README.md#sch-019)의 「근무표 전체를 본다」를 깨는 예외라 명단이 「9명」인 날에 홀에 열 명이 있을 수 있다
- **아무 날짜에나 넣는다.** 날이 열렸는지, 확정됐는지, 지난 날인지 안 보고 소급 상한도 없다
- **입력이 두 갈래고 앱이 가른다.** 그날 본인 배정이 없으면 시작·끝 시각, 있으면 건수다 — **1건이 1시간**이고 한 자리까지다. 사람이 갈래를 고르지 않는다
- **급여는 합산한다.** 배정 9시간 + 리허설 2건 = 11시간이고 그중 2시간이 1.5배다. 나눠 세면 각각 9시간 기준을 따로 받아 연장이 아예 안 난다
- **넣는 자리는 `/me/rehearsals`다.** 「나」에 자격 있는 사람에게만 줄이 선다. `/schedule`의 날 시트는 확정된 달에서만 열려 아무 날짜나 받는 문이 못 된다. 화면 문서가 새로 섰다 — [rehearsal.md](2-design/modules/schedule/screens/rehearsal.md)

backlog의 `payroll` 한 행을 여섯으로 갈랐다 — `rehearsal`·`payroll-data`·`payroll-holidays`·`payroll-wages`·`payroll-view`·`payroll-adjust`. 임시공휴일 줄과 근무 조정 줄은 근무표 화면에 서지만 값이 급여 표로 가서 `schedule-admin`이 아니라 `payroll-adjust`가 만든다.

시안 넷이 감사를 거쳐 아티팩트로 올라갔고 전부 승인됐다 — `wages`·`payroll`·`schedule-admin`이 갱신됐고 `rehearsal`이 새로 섰다. 총괄이 정한 다섯도 같이 승인됐다 — 결근은 `adjustments.minutes`의 음수, 리허설에 출근 인증 없음, 관리자도 `/me/rehearsals`를 같이 씀, 겸임의 빈 자리는 먼저 만들어진 것, 겸임은 두 줄 다 풀려야 함.

**payroll plan 여섯이 다 섰다.** [rehearsal](3-build/plans/rehearsal.md)·[payroll-data](3-build/plans/payroll-data.md)·[payroll-holidays](3-build/plans/payroll-holidays.md)·[payroll-wages](3-build/plans/payroll-wages.md)·[payroll-view](3-build/plans/payroll-view.md)·[payroll-adjust](3-build/plans/payroll-adjust.md)다.

plan을 쓰며 나온 막힌 것 둘이 착수 전에 닫혀야 한다.

- **리허설 자격을 주는 화면이 정본에 없다.** [자격](2-design/modules/schedule/design.md#자격)이 「관리자가 직접 준 행이 유일한 길」이라 정했는데 그 행을 만드는 자리가 어디에도 안 그려져 있다 — 사람 픽커의 「자격도 주기」는 포지션 배정 맥락이라 안 맞다. 닫히기 전에는 `rehearsal` task가 서도 아무도 자격을 못 받는다
- **결근 음수가 근무 시간 변경과 어긋난다.** 9시간일 때 넣은 −540분이 8시간으로 줄어든 날에 그대로 남으면 총 −60분이다. 계산에 바닥을 넣을지 근무 시간을 고칠 때 조정을 다시 계산할지가 [payroll-adjust](3-build/plans/payroll-adjust.md#리스크전환되돌리기)의 첫 결정이다

**notification 영역이 끝났다.** 미정이 다 닫혔고 정본에 반영됐고 시안 일곱이 승인됐고 plan 다섯이 섰다.

인터뷰로 닫은 결정 여덟이다.

- **지난 알림은 앱바의 종 아이콘에서 본다**([NTF-033](2-design/modules/notification/README.md#ntf-033)). 화면이 새로 섰다 — [notifications.md](2-design/modules/notification/screens/notifications.md). 종은 근무자 탭 넷과 관리자 홈에 서고 **퇴사자가 보는 급여 화면에는 없다**. 수를 안 적고 점만 찍는다
- **대시보드의 알림 영역은 그대로 남는다.** 처음에 「아이콘만 남긴다」로 갔다가 [prd.md](1-plan/prd.md)가 대시보드 네 항목을 못박아둔 것과 부딪혀 되돌렸다 — 종은 지나간 것 전부, 알림 영역은 안 읽은 것 중 최근 한 건이고 거기서 답한다
- **알림 목록에서는 줄 전체가 눌린다** — [NTF-024](2-design/modules/notification/README.md#ntf-024)의 예외다. 대시보드는 CTA와 ✕만 눌리는데 목록은 반대고, 누르면 그 알림이 말한 자리로 가며 읽음이 찍힌다. **관리자 공지만 안 눌리고**(갈 곳이 없다) 그것 하나가 여는 것으로 읽음이 찍힌다
- **알림을 못 받는 사람을 관리자가 본다**([NTF-034](2-design/modules/notification/README.md#ntf-034)). 갈래가 둘이라 화면이 갈라 말한다 — 「· 알림 꺼둠」과 「· 기기 안 연결」이다. 서는 자리가 셋이다 — 직원 목록 줄, 사람 시트, 확정 뒤 확인 시트
- **RLS를 안 풀고 뷰로 냈다.** `push_subscriptions`는 본인 행만 열고 `security definer` 뷰 `push_reachable(profile_id, has_device)`가 관리자에게 불리언 하나만 낸다 — `endpoint`도 `keys`도 안 낸다
- **의사와 상태를 가른다.** 받겠다는 의사는 `profiles.notifications_enabled`고 기기가 닿는지는 `push_subscriptions` 행의 유무다. 둘을 곱해 셋이 나고 프로필이 셋을 갈라 말한다 — **스위치를 켜도 기기가 안 닿을 수 있다**
- **알림끼리 묶지 않는다**([NTF-035](2-design/modules/notification/README.md#ntf-035)). 예외는 주말 미리 알림 하나고 그것은 같은 종류를 묶는 것이다
- **목록은 전부를 50건씩 끊어 읽는다.** 안 지우는 규칙이라 계속 길어진다

**알림 문장 스물셋이 처음으로 저장소에 섰다.** [알림 제목](2-design/modules/notification/screens/notifications.md#알림-제목) 표가 정본이고 대시보드와 푸시가 같은 것을 쓴다 — 그 문구가 어디에도 없던 자리였다.

**1차 알림의 범위를 다시 그었다.** [roadmap](1-plan/roadmap.md#릴리스-목록)이 알림을 「승인·확정·전날·직전」 넷으로 적었는데 같은 표의 1차 기능에 근무 요청·근무 취소·사유 승인이 들어 있고 2차가 미룬다고 적은 것은 교대와 공지뿐이었다. **1차는 교대와 공지를 뺀 열하나**고 roadmap의 괄호를 그렇게 고쳤다.

backlog의 `notification-first` 한 행을 여섯으로 갈랐다 — [notification-data](3-build/plans/notification-data.md)·[notification-push](3-build/plans/notification-push.md)·[notification-emit](3-build/plans/notification-emit.md)·[notification-schedule](3-build/plans/notification-schedule.md)·[notification-list](3-build/plans/notification-list.md)·`notification-second`. `notification-settings`까지 plan 다섯이 섰고 `notification-second`는 교대 설계가 서야 쓴다. `dashboard`의 선행도 `notification-list`로 바꿨다 — 문장 함수를 거기서 가져다 쓴다.

plan을 쓰며 가른 경계 셋이다.

- **낳기와 보내기가 다른 task다.** `notification-emit`은 함수 안에서 행을 낳고 `notification-push`는 이미 선 행을 집어 기기로 보낸다. 잡기 update의 `returning`이 중복 발송을 막는 자리라 그것만으로 task 하나다
- **시각을 보는 것이 따로 선다.** `notification-schedule`이 저녁 9시와 출근 10분 전을 맡는다. 금요일에 주말 묶음과 전날 알림이 둘 다 나가면 두 번 울려서 그 조건이 이 task의 핵심 단언이다
- **문장 함수가 `notification-list`에 산다.** 푸시도 대시보드도 그것을 가져다 쓴다. 두 곳이 문장을 따로 들면 같은 알림이 기기와 화면에서 다르게 읽힌다

**system 영역의 미정이 다 닫혔고 정본에 반영됐다.** 이 영역은 인터뷰가 두 덩이였다 — 「디자인이 단조롭고 차트를 넣어 컨텐츠를 늘려야 한다」에서 시작한 차트 일곱, 그리고 원래 열려 있던 미정 다섯이다.

차트 일곱이다.

- **통계의 탭마다 맨 위에 추이 그래프가 선다.** 탭마다 대표 숫자 하나고 기간은 **열두 달**이다 — 예식장은 봄·가을에 몰려서 여섯 달만 보면 10월에 열었을 때 지난봄이 잘린다
- **목록에도 그림이 붙는다** — 포지션 줄과 사람별 줄에 [줄 막대](2-design/design-system/components.md#줄-막대), 근태 현황 줄 아래에 [비율 띠](2-design/design-system/components.md#비율-띠)
- **대시보드 넷이 두꺼워지고 아래 셋이 붙었다.** 이번 주 근무가 월~일 일곱 칸 스트립이 되고 예상 급여에 지난주 대비가 붙었다. 넷 아래에 이번 달 누적·다음 근무·[미니 달력](2-design/design-system/components.md#미니-달력)이 이어진다 — 근무가 없는 날에는 「다음 근무」가 빠진다. 띠 아래 한 줄이 이미 같은 말을 한다
- **관리자 홈에 셋이 붙었다** — 오늘 현황과 진행 띠, 빈 자리 카드, 이번 달 근무표 미니뷰. 빈 자리 경고가 타일 요약 줄의 승격에서 타일 밖 카드로 나왔다. 오늘 현황의 띠는 몫이 **둘**이고 지각을 안 가른다 — 그 줄이 답하는 것은 「다 왔나」 하나다
- **차트 전용 색 계열 셋을 새로 열었다**([tokens.md](2-design/design-system/tokens.md)의 `chart-a`·`chart-b`·`chart-c`). 색조가 브랜드(57)에서 멀고 채도가 브랜드 최대치 근처에서 막혀 통계 화면이 브랜드 버튼보다 크게 말하지 못한다. **좋고 나쁨을 안 싣는다** — [stats.md](2-design/system/screens/stats.md)의 「색으로 안 가른다」가 지키던 축(화면이 사람을 나무라지 않기)이 그대로 산다
- **차트는 브랜드 색 예산 밖이다**([foundation/color.md](2-design/design-system/foundation/color.md#차트가-색을-쓰는-법)). 조각 넷의 정본은 [components.md의 차트 넷](2-design/design-system/components.md#차트-넷)이고 **등장 모션이 없다** — 막대가 자라거나 선이 그려지는 연출을 문서가 막았다
- **미니 달력은 다섯 줄이나 여섯 줄이다.** 처음 「7×5」로 썼는데 1일이 늦은 요일이고 31일까지인 달은 마지막 주가 사라진다. 아래 내용이 24px 밀리는 쪽을 골랐다

미정 다섯이다.

- **근무자용 통계 화면을 연다** — `/stats`고 탭이 근태·포지션·급여다. 「나」의 「통계」 줄로 들어간다. 관리자는 홈에서 `/admin/stats`로 간다 — 뒤에 관리자 탭이 둘로 줄어 칸 수는 갈렸고 짜임은 그대로 공용이다. [prd.md](1-plan/prd.md)의 「근무자는 자기 것만 본다 — 이번 달에 몇 번 나왔고 몇 번 늦었는지다」가 따라 넓어졌다
- **화면 문서를 안 갈랐다.** 두 화면이 세그먼트·추이 그래프·줄 막대·비율 띠를 전부 공유하고 갈리는 것은 담는 값과 탭 이름뿐이다 — 파일을 가르면 같은 짜임이 두 벌 선다
- **사람별 목록은 모든 줄이 눌리고 [근무 내역 시트](2-design/system/screens/stats.md#근무-내역-시트)가 열린다.** 그달에 한 번 나온 사람은 한 줄짜리 시트다 — 여러 날 나온 줄만 열리게 하면 안 눌리는 줄을 눌렀을 때 아무 일도 안 일어나는 것이 고장으로 읽힌다
- **근무 0건인 달은 보조 줄과 예상치 안내가 같이 사라진다.** `–` 하나만 남는다
- **거절 이유 상한은 100자**고, **승인·거절의 통신 실패는 열려 있는 자리 안에서 말한다** — 시트도 Dialog도 안 닫히고 「보내지 못했어요. 다시 시도해주세요」다. 판정은 [runtime.md](2-design/system/runtime.md#낙관적-업데이트)가 즉시 칠하라고 한 조건(되돌릴 수 있고 남과 안 겹침) 둘 다에 안 맞는다

시안 다섯이 감사를 거쳐 갱신됐다 — `stats`·`dashboard`·`schedule-admin` 셋이 아티팩트로 승인됐고, 그 뒤 미정 결정으로 `stats`·`approvals`·`profile`이 한 번 더 따라갔다.

시안이 잡아낸 문서 결함도 같이 닫았다 — `schedule-admin.md` 문안 표의 요일 둘(10월 1일이 목요일인 시나리오에서 「10월 8일(수)」·「10월 10일(금)」), `dashboard.md`의 「9월 20일(금)」(오늘이 9월 12일(토)이라 그날은 일요일), 미니 달력의 줄 수·칸 라운딩(`rounded-xs`가 「아직 배정 없음」으로 비어 있던 자리를 받았다)·시작 요일·폭 규칙, 통계 가로축 눈금 색이다.

**`attendance-excuse` plan이 없는 task를 가리키고 있었다.** 다섯 자리에서 `approvals`를 선행으로 부르는데 보드에 그 행이 없다 — `/admin/approvals` 껍데기의 주인은 [`schedule-requests`](3-build/plans/schedule-requests.md)의 AC-08이고 plan이 적어둔 「가입 승인 줄」도 `approvals.md`엔 없다. 다섯 자리를 다 고쳤다.

**관리자 통계에서 금액을 뺐다.** 관리자가 급여를 주는 자리가 아니라 홀 전체 인건비를 앱에 물을 사람이 없다. 인건비 탭이 **「근무」 탭**이 되고 합계가 432시간이 됐다. 결정 넷이다.

- **관리자 탭이 둘이다** — 근무·근태. 포지션이 탭에서 내려와 근무 탭의 둘째 구획이 됐다. 포지션 탭 합계도 「그달 근무 시간 전체」라 근무 탭과 같은 숫자를 두 번 말하게 돼서다. 한 화면에서 같은 432시간을 사람으로 한 번, 포지션으로 한 번 가른다
- **사람별 줄만 눌리고 [근무 내역 시트](2-design/system/screens/stats.md#근무-내역-시트)가 열린다** — 날짜·포지션·시간에 「합계 · 8회 · 72시간」이다. 포지션 줄에는 화살표가 없어 안 눌리는 것이 미리 보인다
- **리허설은 통계에 안 든다** — 배정만 센다([SCH-021](2-design/modules/schedule/README.md#sch-021)). 급여는 합산하니 이 시간과 급여가 기대는 시간이 다를 수 있고, 그것을 화면이 설명하지 않는다
- **`['attendance', 'YYYY-MM']` 달 키를 열었다** — 날 키로 한 달을 읽으면 서른 질의, 열두 달 그래프에서는 360이다

따라 움직인 정본이 여덟이다 — `stats.md`, `prd.md`, `roadmap.md`(통계가 시급을 안 기다린다), `payroll/README.md`의 PAY-016(시급이 뜨는 화면 셋 → 둘), `wages.md`, `payroll.md`, `attendance/design.md`, `payroll-data`·`payroll-wages` plan의 범위 밖 줄. `stats-admin`의 선행에서 `payroll-wages`가 빠졌다.

**system plan 둘이 섰다** — [stats-admin](3-build/plans/stats-admin.md)·[stats-worker](3-build/plans/stats-worker.md). 가른 경계 셋이다.

- **집계 순수 함수가 `stats-admin`에 산다.** 근무자 통계는 입력만 좁혀 같은 함수를 쓴다 — 따로 짜면 내 통계와 관리자 통계가 나를 다르게 센다
- **근태 셈을 새로 안 짠다.** [`attendance-data` AC-06](3-build/plans/attendance-data.md#ac-06)의 상태 함수를 부르고, 이 task가 더하는 것은 달 키 dal 하나다
- **차트 조각 셋이 `shared/ui`다.** 대시보드와 근무자 통계가 가져다 쓴다

`dashboard` 행은 착수할 때 spec을 새 형식으로 다시 쓰라고 적어둔 채로 있고 **그 링크가 가리키는 `2-design/spec/dashboard.md`는 아직 없다.** `approvals` 화면은 자기 task가 없고 `schedule-requests`와 `attendance-excuse`가 나눠 만든다.

관리자 홈은 [`admin-home-split`](backlog.md)으로 남겼다 — `schedule-admin.md`에서 빼 `system/screens/admin-home.md`로 옮기는 일이고 들어오는 링크가 22곳(문서 12개)이라 차트 작업과 안 섞었다.

같은 줄의 다른 후보 — [`types-generation`](backlog.md)은 plan이 없고 작다.

## 재개 맥락

회차 기록은 `docs/log/2026-09-15.md`(이번 회차)와 `docs/log/2026-09-14-3.md`(직전 회차)에 있다.

**주요 설계 문서가 다 서고 작성법 틀로 다시 썼다.** 작성법은 단계 README(`docs/<단계>/README.md`)가 소유하고(ADR-010), 규칙은 `### ACC-001` 같은 고정 ID로 부른다. 1차 화면의 페이지 문서 14개와 짝 시안이 `docs/2-design/modules/<영역>/screens/`와 `docs/2-design/system/screens/`에 있고, 영역을 가로지르는 공통 설계는 `docs/2-design/system/` 넷 — architecture·data-access·runtime·navigation — 이 든다(#315~#318에서 채운 내용을 옮겨 세웠다). 남은 미정은 각 정본의 「아직 안 정한 것」에 있고, 그 미정이 막는 task는 `backlog.md`의 `blocked` 행이 링크한다 — 착수 전 인터뷰로 닫는다. 되돌리기 어려운 결정 넷이 거기서 났다 — 프로필 신원 분리(`profiles.id` 별도, `user_id → auth.users`), 개인정보 표 분리(`profile_private`), 승인 게이트가 서버에서 클라이언트로, 출근 판정이 누른 시각(`reported_at`). 기존 `profiles` 마이그레이션·`readAuthGate`·`middleware.ts`는 이 결정과 어긋나 데이터 task가 갈아엎는다.

**Edge Function 스파이크가 닫혔다.** Deno는 `supabase/functions` 밖을 못 읽는다 — edge-runtime 컨테이너에 그 폴더만 마운트되니 `deno.json` 맵핑도 심볼릭 링크도 안 통한다. CI가 `_shared/`로 복사하는 쪽으로 [notification/design.md](2-design/modules/notification/design.md#푸시-보내기)가 결론을 담았고, 복사 단계는 알림 task가 `ci.yml`에 붙인다.

코드는 세션 기반과 로그인·승인 대기 화면까지다. 대시보드는 데이터가 없어 못 연다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
