# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 `payroll-wages`다.** `payroll-data`가 닫히며 급여 화면 셋(`payroll-wages`·`payroll-view`·`payroll-adjust`)이 전부 `ready`가 됐다. 셋 다 훅이 없는 채로 데이터만 서 있으니 **그 task의 `test-planner`가 훅마다 unit 행을 배정해야 한다**([관찰 020](observations/020-query-hook-has-no-tdd-home.md)) — 무효화는 `['payroll']`이고 [무효화 표](2-design/system/runtime.md#무효화-표)가 정본이다. `payroll-wages`는 착수 전에 정본을 두 자리 봐야 한다 — spec이 「기본을 쓰는 사람에게는 되돌리기 줄이 아예 없다」고 적는데 [PAY-012](2-design/modules/payroll/README.md#pay-012) 뒤로 시급 이력이 빈 승인 사원도 기본을 쓰는 사람이고, 기본 시급이 아직 없을 때의 `no_default_wage` 문안이 안 적혔다. 화면에 붙일 `MonthPickerSheet`도 여기서 처음 붙는다.

**`attendance-checkin`은 사람 답 둘을 기다려 `blocked`로 내렸다.** 정본 모순 둘은 총괄이 spec을 고쳐 닫았고(#437 — AC-07 「10분 클램프」 → 「2시간 넘으면 `too_late` 거절」, AC-08 「큐에 안 넣는다」 → 「담아두고 앱이 앞으로 오면 다시 보낸다」), 남은 둘이 사람 자리다 — **네이버 지도를 어떻게 띄우나**(`react-native-webview`로 웹 SDK를 감싸면 Expo Go에서도 돌지만 Maestro가 지도 안을 못 보고, 네이티브 모듈은 개발 빌드가 있어야 한다)와 **NCP 대표 계정·지도 키·`customStyleId`가 있나**(키 이름은 `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`로 두고 값은 사람이 채우는 전례가 `EXPO_PUBLIC_APP_URL`이다). 곁가지로 `halls` 시드 반경이 200인데 ATT-002는 처음 값 100이다 — 그 task의 마이그레이션이 100으로 맞춘다. 실기기 확인은 여전히 사람 자리로 남는다(카탈로그·화면 열다섯·테마·끌기·서버 시각 복귀·e2e 플로우 스물아홉 전부 한 번도 기기에서 안 돌았다).

**`payroll-data`가 `done`이다(#442).** 표 넷(`wage_rates`·`default_wage_rates`·`adjustments`·`holidays`)과 함수 여섯, dal 여섯, 금액을 내는 순수 함수 다섯이 섰다. 재사용하는 둘(`attendance-status`·`rehearsal-hours`)은 `entities/`로 내렸다 — `features` 사이를 못 부른다(lint 규칙 3). 총괄 판정 넷 — 「연장」 판정을 화면이 다시 하지 않게 `kind`(`normal`·`overtime`·`absent`)를 계산이 내고, `set_holiday`는 근무를 여는 날인지 다시 검사하지 않으며([PAY-024](2-design/modules/payroll/README.md#pay-024) 뒤로 계산이 `holidays`를 안 읽는다), **기본 시급이 서기 전에 승인된 사람이 계산 밖에 영영 남던 구멍을 막았다** — 「따르는 사람」에 시급 이력이 빈 승인 사원을 더해 승인과 기본 시급의 순서로 결과가 안 갈린다([PAY-012](2-design/modules/payroll/README.md#pay-012)). 되돌릴 기본값이 없는 거절은 `bad_amount`가 아니라 새 코드 `no_default_wage`다. 자동 리뷰가 검증 안 된 분기 둘을 짚어 그 판정 둘이 나왔다 — 리뷰 고침(#439)이 실제로 일한 첫 자리다. 남긴 자리 — 훅 전부(화면 셋 몫), `holidays`는 아직 아무도 안 읽는 표(`payroll-holidays`가 채운다), 실제 한 달치 손 계산 대조(첫 달 운영).

**`rehearsal`이 `done`이다(#438).** `rehearsals` 표(갈래 열 없이 check 셋이 시각·건수를 가른다, 건수는 하루 한 줄인 부분 unique index)와 함수 셋, `/me/rehearsals`, 「나」의 리허설 줄이 섰다. 총괄 판정 다섯 — 새 오류 코드는 `overlaps`·`bad_count` 둘(나머지는 근무표 함수가 이미 올렸다), `rehearsal.md`가 전제하던 **달 고르기 시트를 이 task가 `src/shared/ui/MonthPickerSheet.tsx`로 세웠고**(근무표·급여 화면에 붙이는 것은 남았다), **KST 날짜 손을 `src/shared/lib/kst-date.ts`로 모아** 슬라이스 여섯이 위임한다(다섯째 복제가 될 자리였다), 자격 부여 화면은 이 task 밖(`grant_position` 직접 호출), 고치기·지우기는 주인 검사가 자격 검사보다 앞이다(그래야 남의 행이 관리자에게도 `not_allowed`다). 남긴 자리 — 자격을 주는 화면, 시각 입력이 Maestro `inputText`를 받는지, e2e 시드 `rehearsal_qualified`가 이번 달을 써서 로컬 DB를 안 비우면 두 번째 실행이 `already_exists`로 죽는다(`open_day`가 지난 날짜를 안 받는 제약이 근원이다), `components.md` 「빈 상태」가 그림을 요구하는데 `rehearsal.md` 「빈 날」은 그림이 없다고 적었다.

**리뷰 잡이 빈손으로 끝나던 원인을 잡았다(#439, 관찰 022).** 관찰 019의 가드가 두 번 잡았고(#432·#438) `result` 블록의 `permission_denials_count`가 답을 줬다 — `allowedTools`가 일곱뿐이라 파일 예순 장짜리 diff를 자를 손이 없고, 막힌 자리에서 무엇을 하라는 문장도 프롬프트에 없어 에이전트가 리포트 없이 나갔다. 읽기 전용 셸 손 열을 더하고 「어떤 경우에도 코멘트 하나는 남긴다」를 적었다. 고친 직후 #438의 리뷰가 42초·코멘트 0에서 6분 46초·코멘트 1로 바뀌었다 — 가드는 그대로 두고 그 가드가 계속 잰다.

**`attendance-qr`이 `done`이다(#434).** `/admin/qr`이 섰다 — 흰 카드의 QR(`src/shared/ui/QrFace.tsx`, 다크에서도 흰 면), 쓰기 시작한 날, 인쇄용 A4 내보내기(`expo-print`+`expo-sharing`), 크게 띄우기(`expo-keep-awake`), 새로 뽑기(Dialog→`rotate_qr`). 종이와 화면이 `buildQrSvg` 한 장을 같이 쓴다. 총괄 판정 둘 — `hall_secrets`가 `rotate_qr` 전까지 0행이던 빈 상태를 화면이 아니라 마이그레이션(`20260927091507_hall_secrets_seed.sql`)이 첫 코드를 심어 없앴고, 주소 앞부분은 `EXPO_PUBLIC_APP_URL`(비면 마운트 때 던진다)이며 실제 도메인은 첫 출시 준비 몫이다. 남긴 자리 — 실기기 확인(공유 판·인쇄·화면 잠금), KST 날짜 손이 슬라이스 넷에 중복(`src/shared/lib/`로 합치려면 실패 테스트 먼저), 홀 위치 절(`hall-location`), `EXPO_PUBLIC_APP_URL` 실값.

**`schedule-requests`가 `done`이다(#432).** 근무표 모듈이 닫혔다 — 교대(swap)만 남는다. 함수 넷(`send_work_request`·`respond_request`·`create_cancel_request`·`decide_cancel_request`)과 `internal.close_slot_requests`·`internal.expire_requests`, 이 저장소 첫 pg_cron 등록, `server_now()`와 클라이언트 오프셋이 섰다. 「만료됨」은 저장하지 않고 `pending`+`expires_at` 지남으로 파생한다. 총괄이 받아들인 것 둘 — `force_change`는 안 고쳤다(배정을 `add_assignment`에 위임해서 다시 세우면 마감 규칙이 두 군데가 된다), `merge_slots`도 요청 마감을 `internal.close_slot_requests` 대신 인라인으로 그대로 둔다(범위 밖). 남긴 자리 — cron 실제 주기 미확인, 사유 줄(`attendance-excuse`), 알림(`notification-emit`).

**`schedule-assign`이 `done`이다(#429).** 함수 여덟(`add_slot`·`remove_slot`·`merge_slots`·`split_slot`·`add_assignment`·`remove_assignment`·`force_change`·`grant_position`)과 `qualifications` 뷰가 섰다. 총괄이 착수 전에 닫은 것 — 미신청자 배정 시도는 `not_applied`(`not_allowed` 아님), `add_assignment(p_profile_id, p_kind, p_slot_id, p_day_id, p_position, p_skip_qualification)`가 교육의 날·포지션 빈 인자를 채운다. 끌기 조각(`DragAndDrop`·`DropZone`·`SlotCard`)은 판정 없이 `src/shared/ui`에 서고 판정은 `merge-target.ts`·`discard-slot.ts`다. 남긴 자리 — 끌기 실기기 확인, 알림, `revoke_position` 없음.

**`schedule-admin`이 `done`이다(#427).** 관리자 홈(`/admin`)·관리자 달력(`/admin/schedule`)·근무 신청 모아보기(`/admin/applications`)가 섰다. 총괄이 착수 전에 닫은 정본 모순 셋 — 관리자 홈은 `admin-home.md` 열넷이 정본, `check_ins`는 `get-month-schedule.ts`가 임베딩, 빈 자리는 `open_slots` 뷰를 그대로 읽는다. 구현 중 둘 더 — 타일이 말하는 달은 「오늘이 든 달, 확정됐으면 다음 달」, 앱바 제목은 근무자와 같은 「2026년 10월」. writer 단언 둘의 수정을 승인했다 — `countByPosition`은 `count` 합, `checked_at`은 시각 비교. `MonthCalendar`·`DeadlineSheet`가 공용 자리로 올라갔다. 남긴 자리 — KST 날짜 손 슬라이스 중복(다음 근무표 task가 배정), 관찰 021(라우트 파일명 충돌로 e2e 게이트가 남의 플로우로 통과).

**`schedule-worker`가 `done`이다(#425).** `submit_availability(p_month, p_dates)`가 섰다 — 실패 순서 `not_allowed`·`no_schedule`·`already_confirmed`·`window_closed`·`bad_dates`, 마감 당일은 통과. 화면 하나가 `monthState`로 제출 모드와 조회 모드를 가른다. 남긴 자리 — 달 고르기 시트, 인증 상태 실값(attendance), 요청 온 날 점선·취소·교대 시트(schedule-requests가 이었다).

**리뷰 가드가 첫 실전에서 잡았다(#430, 관찰 019 닫힘).** `pr-review.yml`이 자기 코멘트를 세는 마지막 단계를 얻었다 — 세 번째(#414·#420·#429)라 증축했다. `schedule-requests`(#432) 브랜치의 첫 리뷰 실행이 4턴·38초·코멘트 0으로 빨갛게 서서 실전 포착까지 확인됐다.

**앞선 화면 task 아홉(`ui-kit`·`profile-form`·`members-pending`·`profile-screen`·`members`·`schedule-worker`·`schedule-admin`·`schedule-assign`·`schedule-requests`)과 `attendance-qr`이 전부 「spec approved + `expo-scaffold` 실기기 확인 미완」 조건에서 닫혔다.** 서버 상태 훅 정착지(`src/features/<영역>/model/use<이름>.ts` + `client: Db` 주입)와 `px-5` 여백 정본, `SheetLayer`·`FloatingToast`의 `shared/ui` 승격은 그 아홉에서 이미 정리됐다 — 세부는 [2026-09-27 로그](log/2026-09-27.md)의 첫 절이 담는다.

## 재개 맥락

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시킨다. `attendance-checkin`의 병목은 spec이 아니라 NCP 자격(대표 계정·지도 키·`customStyleId`)이다.

**총괄이 착수 전에 정본 모순을 닫는 순서가 이번 구간에서도 반복됐다.** `schedule-admin`(셋)·`schedule-assign`(하나)이 test-planner가 낸 정본 모순을 구현 전에 판정받았고, 그 위에 구현이 섰다.

**KST 날짜 계산이 슬라이스 넷(`schedule-admin`·`admin-home`·`applications`·`qr`)에 중복이다.** 각자 `Intl.DateTimeFormat`을 들고 있고, `src/shared/lib/`로 합치려면 그 자리의 실패 테스트가 먼저 있어야 한다(TDD 훅이 테스트 없는 새 `.ts`를 막는다). 세 번째가 나오면 뺀다고 이전 회차가 적었는데 지금 넷이라 다음에 손댈 때가 됐다.

**픽스처가 한 사실을 여러 psql 호출로 심는 자리가 cron과 경합한다(관찰 024).** `seedWorkRequest`가 요청 행을 넣고 `seedRequestCandidate`가 갈래 행을 넣는 사이에 `internal.expire_requests`의 cron 틱이 떨어지면 요청이 닫힌 채 남는다. 로컬 세 회차에서 매번 다른 요청 테스트가 하나씩 졌고 CI에서는 아직 안 걸렸다 — 요청 테스트가 이유 없이 지면 이것부터 의심한다. `backlog.md`의 `test-seed-transaction`이 받는다.

**관찰 019는 닫혔고 021은 열려 있다.** 019(자동 리뷰가 코멘트 없이 초록)는 `pr-review.yml`의 코멘트 수 확인 단계로 닫혔다. 021(라우트 파일명이 같으면 e2e 게이트가 남의 플로우로 통과)은 `schedule-admin`에서 첫 번째로 났다 — 두 번째가 나오면 `tdd-guard-e2e.py`의 매핑을 디렉터리 경로 이름으로 바꾼다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e), NCP 대표 계정과 지도 키·`customStyleId`(`attendance-checkin` 착수 전), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더.

회차 기록은 [docs/log/2026-09-27.md](log/2026-09-27.md)다. 그 파일의 첫 절(#409~#423)이 룩앤필 기준점 이동과 화면 task 넷(`ui-kit`·`profile-form`·`members-pending`·`profile-screen`·`members`)을, 둘째 절(#424~#435)이 근무표 모듈 전체(`schedule-worker`·`schedule-admin`·`schedule-assign`·`schedule-requests`)와 `attendance-qr`을 다룬다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
