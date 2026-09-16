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

그다음 수는 attendance 영역이다 — 순서대로 ① 미정 인터뷰 ② 정본 반영 ③ 시안 갱신과 승인 ④ plan이다.

같은 줄의 다른 후보 — [`types-generation`](backlog.md)은 plan이 없고 작다.

## 재개 맥락

회차 기록은 `docs/log/2026-09-15.md`(이번 회차)와 `docs/log/2026-09-14-3.md`(직전 회차)에 있다.

**주요 설계 문서가 다 서고 작성법 틀로 다시 썼다.** 작성법은 단계 README(`docs/<단계>/README.md`)가 소유하고(ADR-010), 규칙은 `### ACC-001` 같은 고정 ID로 부른다. 1차 화면의 페이지 문서 14개와 짝 시안이 `docs/2-design/modules/<영역>/screens/`와 `docs/2-design/system/screens/`에 있고, 영역을 가로지르는 공통 설계는 `docs/2-design/system/` 넷 — architecture·data-access·runtime·navigation — 이 든다(#315~#318에서 채운 내용을 옮겨 세웠다). 남은 미정은 각 정본의 「아직 안 정한 것」에 있고, 그 미정이 막는 task는 `backlog.md`의 `blocked` 행이 링크한다 — 착수 전 인터뷰로 닫는다. 되돌리기 어려운 결정 넷이 거기서 났다 — 프로필 신원 분리(`profiles.id` 별도, `user_id → auth.users`), 개인정보 표 분리(`profile_private`), 승인 게이트가 서버에서 클라이언트로, 출근 판정이 누른 시각(`reported_at`). 기존 `profiles` 마이그레이션·`readAuthGate`·`middleware.ts`는 이 결정과 어긋나 데이터 task가 갈아엎는다.

**Edge Function 스파이크가 닫혔다.** Deno는 `supabase/functions` 밖을 못 읽는다 — edge-runtime 컨테이너에 그 폴더만 마운트되니 `deno.json` 맵핑도 심볼릭 링크도 안 통한다. CI가 `_shared/`로 복사하는 쪽으로 [notification/design.md](2-design/modules/notification/design.md#푸시-보내기)가 결론을 담았고, 복사 단계는 알림 task가 `ci.yml`에 붙인다.

코드는 세션 기반과 로그인·승인 대기 화면까지다. 대시보드는 데이터가 없어 못 연다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
