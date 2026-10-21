# 사람이 할 일

에이전트가 대신 못 하는 일을 여기 한 곳에 모은다. 직접 손이 닿아야 하는 설정, 실기기 확인, 디자인 결정, 판정이다. 각 줄의 자세한 사정은 링크한 backlog 행이 든다. 끝낸 줄은 지운다.

## 직접 손

- **Supabase 원격 프로젝트의 Redirect URLs에 두 줄을 넣는다.** `labiebelle://auth/callback`과 `exp://**/--/auth/callback`이다. 빠지면 로그인이 오류 없이 돌아오지 못한다. 로컬 `supabase/config.toml`에는 이미 든다. 자리는 [environments.md](5-deploy/environments.md)다.
- **NCP 대표 계정과 네이버 지도 키를 만든다.** [`attendance-checkin`](backlog.md)이 이것을 기다린다.

## 실기기 확인

iOS Expo Go는 SDK 57을 못 띄워 개발 빌드가 필요하다. 폰에서 로컬 Supabase를 보려면 `EXPO_PUBLIC_SUPABASE_URL`을 LAN 주소로 둔다.

- **로그인:** 구글 왕복의 네 계정 경우, 창 닫기, 안드로이드 복귀 때 not-found, 라이트·다크 버튼 톤
- **테마:** 시스템 테마인 다크 기기가 다크로 뜨는지, 라이트를 고른 뒤 OS를 다크로 바꿔도 라이트로 남는지
- **차트:** 통계 화면의 값 라벨 위치와 1·4·7·10월 라벨, 막대 폭, 근무표 칸의 점선 테두리, 출근 기록 없는 달의 출근율이 `–`인지
- **등장 모션:** 움직임 줄이기를 끈 콜드 스타트에 다섯 요소가 70ms씩 어긋나 8px 아래에서 올라오는지, 켠 콜드 스타트는 이동 없이 밝기만 바뀌는지, 실패 줄이 떠도 등장이 다시 안 도는지, 앱을 켠 채 OS 설정을 바꾼 뒤 로그인 화면에 들어가면 바뀐 설정을 따르는지
- **버튼:** 시트 푸터에 `flex-1` 버튼 둘이 나란히 설 때 폭을 반씩 나누는지, 모든 버튼이 눌리는 동안 줄고 `disabled`·`loading`이면 안 주는지(구글 버튼의 `busy` 포함)
- **스켈레톤:** 빛 줄이 끊김 없이 흐르고 한 바퀴 돌아 다시 시작할 때 이음새가 튀지 않는지, 동작 줄이기를 켜면 빛 줄이 없고 끄면 다시 흐르는지, 둥근 모서리(`rounded-xl`·`rounded-sm`) 안에서 잘려 보이는지, 카드 여럿이 한 화면에 설 때 깜빡임으로 읽히지 않는지
- **서버 날짜:** 기기 시계를 하루 돌려도 오늘이 서버 날짜인지(근무표 오늘 강조·통계 다음 달·관리자 홈 오늘 타일)
- **설정값 빠진 빌드:** env 두 값을 비운 빌드에서 스플래시가 내려가고 「앱을 열 수 없어요」 한 장이 뜨는지, 버튼이 없는지, 값이 찬 빌드는 전처럼 입장 판정대로 가는지
- **시트 손잡이:** `DraggableSheet`를 쓰는 화면이 없어 지금은 안 보인다. 아래 `sheets-not-draggable`이 정해져야 볼 수 있다

## 디자인 결정

- [`error-screen-design`](backlog.md) — `AppUnavailable`의 생김새. 지금은 `RetryScreen`을 빌린 임시 꼴이다
- [`sheets-not-draggable`](backlog.md) — 화면 시트 15곳이 끌어 닫기 없는 `SheetLayer`를 쓴다. 시트를 끌어 닫게 바꿀지, 손잡이만 그릴지
- [`stats-density-salvage`](backlog.md) — 닫은 PR #379에서 살릴 통계 화면 판정을 고른다
- [`notification-sub-copy`](backlog.md) — 알림 아래 줄 문안이 정본에 없다

## 판정

화면 동작:

- [`query-failure-reaches-the-screen`](backlog.md) — 화면 일곱의 읽기 실패를 어떻게 그릴지. wages는 실패하면 스켈레톤이 끝없이 돈다
- [`day-sheet-missing-day-is-not-failure`](backlog.md)
- [`payroll-screen-duplicates-fragment-state`](backlog.md)
- [`my-reads-filter-by-profile`](backlog.md) — 관리자가 근무자 화면을 쓰는지

정본과 코드가 어긋난 자리:

- [`canon-and-code-divergence-fixes`](backlog.md) — 판정 여섯, 추천은 행에 있다
- [`requests-closed-30-days`](backlog.md) — 문서를 코드의 `closed_at is null`에 맞출지
- [`monthly-assignment-count-canon`](backlog.md) — 한 달 배정 수 셋을 하나로
- [`runtime-unbounded-keys-table`](backlog.md) — `runtime.md`의 「전체를 읽는 키는 셋」이 코드와 안 맞는다

구조·규칙:

- [`dto-derives-from-generated-types`](backlog.md)
- [`system-detail-level`](backlog.md) — `system/` 문서 넷의 세세함 수준
- [`internal-function-revoke-rule`](backlog.md) — `revoke` 규칙을 `data-access.md`에 적을지
- [`fixture-constants-typed`](backlog.md) — 픽스처 상수에 타입 표기 규칙을 둘지
- [`scaffold-leftovers`](backlog.md) — `src/`의 스캐폴드 잔재를 지울지
- [`design-canvas-source`](backlog.md) — 디자인 캔버스 빌드 소스를 저장소에 넣을지
- [`erased-photo-bytes-remain`](backlog.md) — 지운 사진의 파일 바이트를 Storage API로 회수할지
