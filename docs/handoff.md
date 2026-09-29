# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 `plans-restate`다** — backlog의 `ready` 맨 위다. 사용자의 상시 지시는 「전체 기능 구현」이다: 시안 열다섯을 건너뛰고 화면 task가 [ADR-014](2-design/adr/ADR-014-toss-home-baseline.md)를 코드로 옮기는 랄프 루프를 돌리는 중이고, 루프의 정본은 [spec/ui-kit.md](2-design/spec/ui-kit.md)의 「루프」 절이다.

**`stats-worker`가 `done`이다(#457).** `/stats`가 섰다 — 탭 셋(근태·포지션·급여), 날짜 목록, 내가 들어간 포지션만 든 목록, 「내역 보기」가 급여 화면을 연다. 관리자 쪽이 세운 조각·집계 함수·달 키를 그대로 가져다 썼다. **판정 PR(#456)이 정본 모순 여섯을 계획 단계에서 먼저 막은 것이 이 task의 진짜 수확이다** — 급여 계산은 `screens` 층에서 부르고(lint 규칙 3이 `features/stats`가 `features/payroll`을 못 부르게 막는다), 출근율 셈은 `entities/attendance/model/attendance-summary.ts`로 내리고, 급여 탭 보조 줄은 급여 화면과 같은 날을 세고, 근태 상태 여섯은 한 줄에 하나씩이라 안 줄이고, 교육 보조 정보는 「안내 교육」이고, 「나」의 통계 줄이 `navigation.md`의 「세 층」·「뒤로」 표에 빠져 있어 더했다. **`stats-admin`에서는 같은 성격의 자리 여섯이 감사까지 가서야 드러났는데 이번엔 계획 단계에서 잡았다** — `test-planner`에 「정본 모순을 명시로 돌려달라」를 지시문에 실은 값이다.

**구현 중 `NO_VALUE`와 금액 꼴을 `shared/lib/spell-number.ts` 하나로 모았다.** `spellAmount`(급여)와 `spellWon`(시급)이 각자 정규식을 들고 같은 문자열을 내던 것을 합쳤다. **시간 길이는 안 건드렸다** — 「0시간 30분」과 「30분」으로 갈린 자리는 `spell-number-shared` candidate가 받는다. 교육 배정 판정 버그(`EDUCATION_KIND`가 표의 check 제약과 안 맞아 급여 내역 교육 표기가 늘 안 서던 것)도 이 task가 잡았다.

**`pr-diff`가 `useMemo` 안 인라인 계산을 또 찾았다.** 구현자가 「달 번호 하나만 남았다」고 보고했는데 감사가 화면의 `useMemo` 둘(급여를 달로 조인하는 것, 그달 날짜로 거르는 것)을 더 찾아 `chart-values.ts`로 내렸다. [관찰 030](observations/030-export-gate-needs-complete-writer-assignment.md)이 이 사례를 셋째로 기록하고 `test-planner`의 리턴에 「내보낼 함수」 절을 더했다 — **관리자 쪽 `.tsx` 안에 인라인으로 살던 계산은 계획이 「이미 서 있다」로 셀 때 안 보이니, 다음 화면 task를 짤 때 앞 화면의 `.tsx`도 훑어야 한다.**

**계산 넷이 `StatsScreen.tsx`에 남았다.** 전부 이 라운드 테스트 밖이고 다른 화면(`AdminStatsScreen.tsx`·`PayrollScreen.tsx`)을 같이 건드려야 해서 `chart-math-out-of-tsx` candidate에 얹었다 — 달 찾기(`monthIn`과 같은 손), `now` 조립(`server-clock.ts`로 갈 자리), 프로필 없을 때 영값(`myWorkTotalsOfMonth`로 접힘), 값 없을 때 `0%` 대 `NO_VALUE`(정본 판정이 먼저 필요하다).

**`joinPayrollByMonth`를 짜다 이름 부딪힘을 하나 더 봤다.** `PayrollByMonth`라는 같은 이름이 `screens/stats/model/chart-values.ts`와 `features/stats/api/useStatsQueries.ts`에 다른 모양으로 있다 — `payroll-by-month-name-collision` candidate로 세웠다.

**`ready`가 일곱이다.** `stats-worker`가 빠지고 `plans-restate`가 맨 위로 올라왔다 — `notification-list`·`notification-settings`·`notification-push`·`payroll-holidays`·`profile-erasure`·`sian-sync`가 나머지다. `blocked`로 남은 쪽의 이유는 셋뿐이다 — **NCP 자격**(`attendance-checkin`·`hall-location`), **도메인**(`qr-landing-page`·`first-release`), **앞 task의 사슬**(`dashboard`가 `attendance-checkin`을 기다리고 `attendance-excuse`·`notification-emit` 이하가 그 뒤에 선다).

**관찰 021과 030이 `actioned`로 바뀌었다.** 둘 다 `resolved` 날짜가 비어 있어 archive 조건(resolved가 오늘보다 앞선 날짜)을 아직 못 채운다.

**앞선 `stats-admin`(#454)과 급여 모듈(`payroll-wages`·`payroll-view`·`payroll-adjust`)은 로그가 담는다.** 세부는 [2026-09-28 로그](log/2026-09-28.md)가, 그 앞 근무표 모듈과 `attendance-checkin` spec 정정·`rehearsal`·`payroll-data`는 [2026-09-27 로그](log/2026-09-27.md) 셋째 절이 담는다.

## 재개 맥락

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시킨다. spec 파일이 없는 데이터 task는 plan의 `## 완료 조건` 절로도 통과한다(#441) — `attendance-checkin`의 병목은 spec이 아니라 NCP 자격(대표 계정·지도 키·`customStyleId`)이다.

**금액 꼴은 `shared/lib/spell-number.ts` 하나로 모였고, 시간 길이 꼴은 아직 슬라이스 셋에 흩어져 있다.** `screens/payroll/model/summary.ts`의 `spellWorkedHours`(「0시간 30분」)와 `screens/schedule-admin/model/adjust-sheet-rows.ts`의 `spellHours`·`features/rehearsal/model/spell-total.ts`의 `spellMinutes`(「30분」)가 갈려 있다 — `writing.md`가 「30분」 쪽으로 판정했으니 `summary.ts`가 어긋난 쪽이다. `spell-number-shared` candidate가 받는다.

**KST 날짜·달 경계 계산이 `shared/lib/`로 계속 모이는 중이다.** `kst-date.ts`(달·날짜)에 이어 `month-boundary.ts`(화살표를 그릴지)가 이번에 올라갔다. 아직 슬라이스 안에 남은 계산(위 「계산 넷」)이 다음에 손댈 자리다.

**이름 단위 TDD 훅이 서고 나서 계획 배정 누락이 라운드를 하나씩 먹는다.** 관찰 027이 지은 `tdd-guard-unit.py`는 내보낼 이름마다 짝 테스트를 요구한다. `test-planner`가 빠뜨린 함수는 구현 중 훅이 막고, `useMemo` 안 인라인 계산은 감사가 찾는다(관찰 030) — 다음 화면 task를 짤 때 앞 화면의 `.tsx`를 같이 훑어야 같은 라운드 손실이 안 난다.

**픽스처가 한 사실을 여러 psql 호출로 심는 자리가 cron과 경합한다(관찰 024, open).** `backlog.md`의 `test-seed-transaction`이 받는다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e), NCP 대표 계정과 지도 키·`customStyleId`(`attendance-checkin` 착수 전), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더.

회차 기록은 [docs/log/2026-09-29.md](log/2026-09-29.md)다. `stats-admin`(#454, 앞 회차 마지막)을 이어받아 `stats-worker`(#457)가 서고 통계 모듈이 닫힌다. 그 앞은 [docs/log/2026-09-28.md](log/2026-09-28.md)(급여 모듈)와 [docs/log/2026-09-27.md](log/2026-09-27.md)(근무표 모듈·`rehearsal`·저장소 검사 고침 셋·`payroll-data`)다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
