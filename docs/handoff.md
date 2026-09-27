# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**다음 첫 수는 `payroll-wages`다.** `payroll-data`가 닫히며 급여 화면 셋(`payroll-wages`·`payroll-view`·`payroll-adjust`)이 전부 `ready`가 됐다. 셋 다 훅이 없는 채로 데이터만 서 있으니 **그 task의 `test-planner`가 훅마다 unit 행을 배정해야 한다**([관찰 020](observations/020-query-hook-has-no-tdd-home.md)) — 무효화는 `['payroll']`이고 [무효화 표](2-design/system/runtime.md#무효화-표)가 정본이다. `payroll-wages`는 착수 전에 정본을 두 자리 봐야 한다 — spec이 「기본을 쓰는 사람에게는 되돌리기 줄이 아예 없다」고 적는데 [PAY-012](2-design/modules/payroll/README.md#pay-012) 뒤로 시급 이력이 빈 승인 사원도 기본을 쓰는 사람이고, 기본 시급이 아직 없을 때의 `no_default_wage` 문안이 안 적혔다. 화면에 붙일 `MonthPickerSheet`도 여기서 처음 붙는다.

**`attendance-checkin`은 사람 답 둘을 기다려 `blocked`로 내렸다.** 정본 모순 둘은 총괄이 spec을 고쳐 닫았고(#437 — AC-07 「10분 클램프」 → 「2시간 넘으면 `too_late` 거절」, AC-08 「큐에 안 넣는다」 → 「담아두고 앱이 앞으로 오면 다시 보낸다」), 남은 둘이 사람 자리다 — **네이버 지도를 어떻게 띄우나**(`react-native-webview`로 웹 SDK를 감싸면 Expo Go에서도 돌지만 Maestro가 지도 안을 못 보고, 네이티브 모듈은 개발 빌드가 있어야 한다)와 **NCP 대표 계정·지도 키·`customStyleId`가 있나**(키 이름은 `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`로 두고 값은 사람이 채우는 전례가 `EXPO_PUBLIC_APP_URL`이다). 곁가지로 `halls` 시드 반경이 200인데 ATT-002는 처음 값 100이다 — 그 task의 마이그레이션이 100으로 맞춘다. 실기기 확인은 여전히 사람 자리로 남는다(카탈로그·화면 열다섯·테마·끌기·서버 시각 복귀·e2e 플로우 스물아홉 전부 한 번도 기기에서 안 돌았다).

**`payroll-data`가 `done`이다(#442).** 표 넷(`wage_rates`·`default_wage_rates`·`adjustments`·`holidays`)과 함수 여섯, dal 여섯, 금액을 내는 순수 함수 다섯이 섰다. 재사용하는 둘(`attendance-status`·`rehearsal-hours`)은 `entities/`로 내렸다 — `features` 사이를 못 부른다(lint 규칙 3). 총괄 판정 — `set_holiday`는 근무를 여는 날인지 다시 검사하지 않으며([PAY-024](2-design/modules/payroll/README.md#pay-024) 뒤로 계산이 `holidays`를 안 읽는다), **기본 시급이 서기 전에 승인된 사람이 계산 밖에 영영 남던 구멍을 막았다** — 「따르는 사람」에 시급 이력이 빈 승인 사원을 더해 승인과 기본 시급의 순서로 결과가 안 갈린다([PAY-012](2-design/modules/payroll/README.md#pay-012)). 되돌릴 기본값이 없는 거절은 `bad_amount`가 아니라 새 코드 `no_default_wage`다. 마감 문서(#443)가 이 정본 변화로 비어 있던 `wages.md`·`payroll.md`의 화면 자리(기본 시급 미정 줄, 시급 이력 빈 사람의 표시)를 같이 채웠다. 남긴 자리 — 훅 전부(화면 셋 몫), `holidays`는 아직 아무도 안 읽는 표(`payroll-holidays`가 채운다), 실제 한 달치 손 계산 대조(첫 달 운영).

**`rehearsal`이 `done`이다(#438).** `rehearsals` 표(갈래 열 없이 check 셋이 시각·건수를 가른다)와 함수 셋, `/me/rehearsals`, 「나」의 리허설 줄이 섰다. **달 고르기 시트를 `src/shared/ui/MonthPickerSheet.tsx`로 세웠고**(근무표·급여 화면에 붙이는 것은 남았다 — `payroll-wages`가 처음 붙인다), **KST 날짜 손을 `src/shared/lib/kst-date.ts`로 모았다**(다섯째 복제가 될 자리였다). 새 오류 코드는 `overlaps`·`bad_count` 둘이다. 남긴 자리 — 자격을 주는 화면, e2e 시드 `rehearsal_qualified`가 이번 달을 써서 로컬 DB를 안 비우면 두 번째 실행이 죽는다.

**저장소 검사 셋이 이번 구간에서 고쳐졌다.** 리뷰 에이전트가 도구가 막히면 코멘트 없이 끝나던 자리(#439, 관찰 022 닫힘) — 읽기 전용 셸 손 열을 더하고 「어떤 경우에도 코멘트 하나는 남긴다」를 프롬프트에 적었다. spec 게이트가 plan이 정본인 데이터 task를 막던 자리(#441, 관찰 023 닫힘) — spec 파일이 아예 없을 때만 plan의 `## 완료 조건` 절로 통과시킨다. 같이 드러난 `Bash` 쓰기 우회(훅 matcher가 `Write`·`Edit`뿐)는 `hook-bash-writes`로 backlog에 남겼다. 「영향 확인」 게이트가 PR 본문 수정으로는 안 돌던 자리(#443 준비 중 발견, 관찰 025 닫힘) — `ci.yml`의 `pull_request:`에 `edited`를 더했다.

**앞선 근무표 모듈 task 다섯(`schedule-worker`·`schedule-admin`·`schedule-assign`·`schedule-requests`·`attendance-qr`)과 리뷰 가드(#430)는 로그가 담는다.** 세부는 [2026-09-27 로그](log/2026-09-27.md)의 셋째 절이, 그 앞 화면 task 넷(`ui-kit`·`profile-form`·`members-pending`·`profile-screen`·`members`)은 첫째 절이 담는다.

## 재개 맥락

**spec 게이트가 열려 있고 화면 task 전부 `approved`다.** `feat/<슬러그>` 브랜치의 `src/` 쓰기를 spec `status: approved`가 통과시킨다. **spec 파일이 없는 데이터 task는 plan의 `## 완료 조건` 절로도 통과한다**(#441) — `attendance-checkin`의 병목은 spec이 아니라 NCP 자격(대표 계정·지도 키·`customStyleId`)이다.

**KST 날짜 계산이 슬라이스 다섯(`schedule-admin`·`admin-home`·`applications`·`qr`, 그리고 `rehearsal`이 세운 `src/shared/lib/kst-date.ts`)에 흩어져 있다.** 넷은 각자 `Intl.DateTimeFormat`을 들고, 다섯째는 공용 자리다 — 다음에 손댈 때는 넷을 그 공용 자리로 옮기는 쪽이다.

**픽스처가 한 사실을 여러 psql 호출로 심는 자리가 cron과 경합한다(관찰 024, open).** `seedWorkRequest`가 요청 행을 넣고 `seedRequestCandidate`가 갈래 행을 넣는 사이에 `internal.expire_requests`의 cron 틱이 떨어지면 요청이 닫힌 채 남는다. 로컬 세 회차에서 매번 다른 요청 테스트가 하나씩 졌고 CI에서는 아직 안 걸렸다 — 요청 테스트가 이유 없이 지면 이것부터 의심한다. `backlog.md`의 `test-seed-transaction`이 받는다.

**관찰 021은 열려 있다.** 라우트 파일명이 같으면 e2e 게이트가 남의 플로우로 통과하는 자리다 — `schedule-admin`에서 첫 번째로 났다. 두 번째가 나오면 `tdd-guard-e2e.py`의 매핑을 디렉터리 경로 이름으로 바꾼다.

**루프가 사람을 부르는 자리 넷은 그대로다.** 실기기 확인(카탈로그·화면·테마·끌기·서버 시각 복귀·e2e), NCP 대표 계정과 지도 키·`customStyleId`(`attendance-checkin` 착수 전), 3D 석 장(`no-schedule`·`all-clear`·`server-error`), 로컬 Supabase 구글 프로바이더.

회차 기록은 [docs/log/2026-09-27.md](log/2026-09-27.md)다. 첫 절(#409~#423)이 룩앤필 기준점 이동과 화면 task 넷을, 둘째 절(#424~#435)이 근무표 모듈 전체와 `attendance-qr`을, 셋째 절(#437~#443)이 `attendance-checkin` spec 정정·`rehearsal`·저장소 검사 고침 셋·`payroll-data`를 다룬다.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
