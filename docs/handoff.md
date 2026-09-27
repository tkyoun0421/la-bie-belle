# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 `rehearsal`이고 `attendance-checkin`은 사람 답 둘을 기다린다.** 근무표 모듈(`schedule-worker`·`schedule-admin`·`schedule-assign`·`schedule-requests`)과 `attendance-qr`이 이번 회차에 전부 `done`이 됐다 — [backlog.md](backlog.md) 두 행이 `ready`다. `attendance-checkin`의 test-planner가 돌았고 정본 모순 둘은 총괄이 spec을 고쳐 닫았다(AC-07 「10분 클램프」 → 「2시간 넘으면 `too_late` 거절」, AC-08 「큐에 안 넣는다」 → 「담아두고 앱이 앞으로 오면 다시 보낸다」 — design.md·README·runtime.md가 정본이었다). 남은 둘은 사람 자리다 — **네이버 지도를 어떻게 띄우나**(`react-native-webview`로 웹 SDK를 감싸면 Expo Go에서도 돌지만 Maestro가 지도 안을 못 보고, 네이티브 모듈은 개발 빌드가 있어야 한다)와 **NCP 대표 계정·지도 키·`customStyleId`가 있나**(키 이름은 `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`로 두고 값은 사람이 채운다 — `EXPO_PUBLIC_APP_URL` 전례). 그 둘이 답이 오면 계획을 이어 쓴다. 곁가지로 `halls` 시드 반경이 200인데 ATT-002는 처음 값 100이다 — `attendance-checkin`의 마이그레이션이 100으로 맞춘다. 실기기 확인은 여전히 사람 자리로 남는다(카탈로그·화면 열넷·테마·끌기·서버 시각 복귀·e2e 플로우 스물여섯 전부 한 번도 기기에서 안 돌았다).

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

**관찰 019는 닫혔고 021은 열려 있다.** 019(자동 리뷰가 코멘트 없이 초록)는 `pr-review.yml`의 코멘트 수 확인 단계로 닫혔다. 021(라우트 파일명이 같으면 e2e 게이트가 남의 플로우로 통과)은 `schedule-admin`에서 첫 번째로 났다 — 두 번째가 나오면 `tdd-guard-e2e.py`의 매핑을 디렉터리 경로 이름으로 바꾼다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e), NCP 대표 계정과 지도 키·`customStyleId`(`attendance-checkin` 착수 전), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더.

회차 기록은 [docs/log/2026-09-27.md](log/2026-09-27.md)다. 그 파일의 첫 절(#409~#423)이 룩앤필 기준점 이동과 화면 task 넷(`ui-kit`·`profile-form`·`members-pending`·`profile-screen`·`members`)을, 둘째 절(#424~#435)이 근무표 모듈 전체(`schedule-worker`·`schedule-admin`·`schedule-assign`·`schedule-requests`)와 `attendance-qr`을 다룬다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
