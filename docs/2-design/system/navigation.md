# 탐색

화면 사이의 흐름이 산다. 어느 화면에서 무엇을 하면 어디로 가는가다.

## 진입과 역할

### 앱을 열면

- 적용 범위: 앱이 뜰 때와 탭 복귀, 그 뒤의 모든 라우트 전환
- 기본 계약: 세션 → 프로필 → 승인 순으로 가른다. 판정은 껍데기 하나가 앱이 뜰 때와 탭 복귀에 `['profile']`을 읽어 한다([`account/design.md`](../modules/account/design.md)). 라우트 전환은 그 값을 쓴다 — 탭을 옮길 때마다 다시 읽지 않는다. 상태마다 가는 곳은 아래 표다
- 이유: 규칙은 [account/README.md](../modules/account/README.md)다
- 예외: 제 자리가 아닌 경로를 열면 제 자리로 간다 — 승인 안 된 사람이 `/`를, 퇴사자가 `/schedule`을, 근무자가 `/admin`을 열었을 때다. 퇴사자에게 열린 경로는 `/left`와 `/payroll` 둘이다

| 상태 | 간다 |
| --- | --- |
| 세션 없음 | `/login` |
| 프로필 없음 · 제출 안 함 · 거절됨 · 승인 대기 | `/pending` |
| 차단 | `/blocked` |
| 퇴사 | `/left` |
| 승인됨 | `/`. 마지막 경로를 복원하지 않는다 |

## 경로

| 경로 | 진입 조건의 참조 | 소유 화면 |
| --- | --- | --- |
| `/login` | [앱을 열면](#앱을-열면) — 세션 없음 | 로그인 · [`login.md`](../modules/account/screens/login.md) |
| `/pending` | [앱을 열면](#앱을-열면) — 프로필 없음 · 제출 안 함 · 거절됨 · 승인 대기 | 프로필 작성 · 승인 대기 · 거절된 뒤 · [`login.md`](../modules/account/screens/login.md) |
| `/blocked` | [앱을 열면](#앱을-열면) — 차단 | 차단 · [`login.md`](../modules/account/screens/login.md) |
| `/left` | [앱을 열면](#앱을-열면) — 퇴사 | 퇴사한 뒤 · [`login.md`](../modules/account/screens/login.md#퇴사한-뒤) |
| `/` | [앱을 열면](#앱을-열면) — 승인됨 | 대시보드 · [`dashboard.md`](screens/dashboard.md) |
| `/check-in` | [앱을 열면](#앱을-열면) — 승인됨 | 출근 인증 · [`check-in.md`](../modules/attendance/screens/check-in.md) |
| `/schedule` | [앱을 열면](#앱을-열면) — 승인됨 | 근무자 근무표. `?month=`는 달, `?date=`는 그날 시트 · [`schedule-worker.md`](../modules/schedule/screens/schedule-worker.md) |
| `/payroll` | [앱을 열면](#앱을-열면) — 승인됨. 퇴사자에게도 열린다 | 급여 · [`payroll.md`](../modules/payroll/screens/payroll.md) |
| `/me` | [앱을 열면](#앱을-열면) — 승인됨 | 나 · [`profile.md`](../modules/account/screens/profile.md) |
| `/me/rehearsals` | 리허설 자격이 있는 사람과 관리자만. `?month=`는 달 | 리허설 · [`rehearsal.md`](../modules/schedule/screens/rehearsal.md) |
| `/notifications` | [앱을 열면](#앱을-열면) — 승인됨 | 알림 목록 · [`notifications.md`](../modules/notification/screens/notifications.md) |
| `/admin` | 관리자만 | 관리자 홈 · [`schedule-admin.md`](../modules/schedule/screens/schedule-admin.md#관리자-홈) |
| `/admin/schedule` | 관리자만 | 관리자 달력. `?month=`는 달, `?date=`는 날 상세 · [`schedule-admin.md`](../modules/schedule/screens/schedule-admin.md) |
| `/admin/applications` | 관리자만 | 근무 신청 모아보기. `?month=` · [`schedule-admin.md`](../modules/schedule/screens/schedule-admin.md#근무-신청-모아보기) |
| `/admin/approvals` | 관리자만 | 승인할 일 · [`approvals.md`](screens/approvals.md) |
| `/admin/members/pending` | 관리자만 | 가입 대기 · [`members-pending.md`](../modules/account/screens/members-pending.md) |
| `/admin/members/blocked` | 관리자만 | 차단한 사람. 뒤로는 가입 대기 · [`members-pending.md`](../modules/account/screens/members-pending.md#차단한-사람-짜임) |
| `/admin/members` | 관리자만 | 직원 · [`members.md`](../modules/account/screens/members.md) |
| `/admin/wages` | 관리자만 | 시급 · [`wages.md`](../modules/payroll/screens/wages.md) |
| `/admin/qr` | 관리자만 | QR · [`qr.md`](../modules/attendance/screens/qr.md) |
| `/admin/stats` | 관리자만 | 통계 · [`stats.md`](screens/stats.md) |

- 적용 범위: 앱의 모든 라우트
- 기본 계약: **동적 세그먼트가 없다.** 날은 전부 `?date=`다. 근무자에게 `?date=`는 달력 위의 시트고 관리자에게는 날 상세 화면 하나다 — 같은 문법, 다른 모양. `/admin` 아래는 관리자만이다. 근무자가 열면 `/`로 보낸다. `/me/rehearsals`는 `/admin` 밖에 있는 유일한 조건부 경로다 — 역할이 아니라 자격이 문을 가른다. 자격 없는 사람이 열면 `/me`로 보낸다
- 이유: 라우트가 전부 정적 껍데기라 미리 받고(prefetch) Service Worker가 캐시한다([system/runtime.md](runtime.md#캐시-네-계층))
- 예외: `?date=`·`?month=`를 읽는 컴포넌트는 Suspense 안에 산다 — 정적 빌드가 요구한다

## 탐색·뒤로 가기

### 세 층

- 적용 범위: 화면이 쌓이는 방식
- 기본 계약:
  - **근무자 층은 탭 넷이 나란히다.** 대시보드 · 근무표 · 급여 · 나. 탭 사이는 뒤로가 없다 — 탭 바가 곧 이동이다. 근무자 층에서 밀려 올라가는 화면은 출근 인증과 리허설과 알림 목록 셋이다. 출근 인증은 닫으면 대시보드고 리허설은 「나」다 — 온 곳으로 돌아간다. 리허설은 자격이 있는 사람에게만 문이 열리고 관리자도 같은 문을 쓴다([schedule/README.md](../modules/schedule/README.md#sch-020))
  - **알림 목록만 문이 여럿이다.** 탭 넷 어디서나 앱바의 종 아이콘으로 열리고 관리자 홈에서도 열린다([NTF-033](../modules/notification/README.md#ntf-033)). 그래서 뒤로가 부모 경로가 아니라 온 화면이다 — 관리자 홈에서 열면 닫을 때 관리자 홈이고, 관리자 층을 안 버린다
  - **관리자 층은 홈 위로 쌓인다.** 「나」의 「관리자 모드」 줄이 `/admin`을 열고, 홈의 줄이 각자의 화면을 연다. 달력은 홈의 근무표 타일이 여는 별개 화면이고 날 상세는 그 위다 — 홈 → 달력 → 날 상세 셋이다. 관리자가 근무자 알림을 누르면 관리자 층을 버리고 근무자 층으로 간다
  - **게이트 층은 넷이 나란히다.** `/login` · `/pending` · `/blocked` · `/left`. 서로 오가지 않고 상태가 바뀌면 껍데기가 옮긴다

### 뒤로

- 적용 범위: 앱바의 뒤로와 브라우저 뒤로
- 기본 계약: **앱바의 뒤로는 부모 경로로 가는 명시 이동이다.** `history.back()`이 아니다. 부모는 표대로 고정이고, `?from=`으로 출처를 드는 화면이 둘이다 — 날 상세는 온 곳이 셋이고, 알림 목록은 문이 다섯이다([NTF-033](../modules/notification/README.md#ntf-033)). 브라우저 뒤로는 있는 만큼 돈다. 앱바 뒤로는 언제나 표대로다
- 이유: 알림으로 바로 착지하면 history가 비어 있어도 뒤로 갈 곳이 있어야 한다
- 예외: **시트는 history에 든다.** 날 시트·달 고르기·요청 시트가 열리면 `pushState`고, 안드로이드 뒤로 버튼과 iOS 가장자리 스와이프가 시트를 닫는다. 화면을 떠나지 않는다. iOS 홈 화면 앱에서 스와이프가 `popstate`를 안 주면 그때 시트를 history에서 뺀다 — 기기 테스트 항목이다

| 어디서 | 뒤로 |
| --- | --- |
| 탭 넷 | 없음 |
| 출근 인증 | `/` |
| 리허설 | `/me` |
| 알림 목록 | 온 화면. `?from=`이 출처를 든다 |
| 관리자 홈 | `/me` |
| 달력 · 근무 신청 모아보기 · 승인할 일 · 가입 대기 · 직원 · 시급 · QR · 통계 | `/admin` |
| 날 상세 | 달력. `?from=approvals`면 승인할 일, `?from=members`면 직원 |
| 급여(퇴사자) | `/left` |
| 프로필 작성 · 승인 대기 | 없음. 로그아웃이 유일한 문 |

## 딥링크

### 알림을 누르면

- 적용 범위: 푸시와 알림 목록에서 여는 이동
- 기본 계약: **알림이 말한 자리까지 간다.** 날이 있는 알림은 그날 시트가 열린 채로 근무표에 선다(`/schedule?date=`), 관리자 알림은 그날 날 상세다(`/admin/schedule?date=`). 종류마다의 목적지는 [`notification/design.md`](../modules/notification/design.md#ui-연결)에 있다
- 기본 계약: 문이 셋이다 — 푸시, 대시보드 알림 영역의 CTA, [알림 목록](../modules/notification/screens/notifications.md)의 줄. 셋 다 같은 표를 쓰고 가면서 읽음이 찍힌다
- 예외: 관리자 공지는 목적지가 없다. 대시보드에서는 알림 영역이 곧 목적지고 목록에서는 그 줄이 안 눌린다
- 예외: 푸시를 눌러 앱이 뜨면 「앱을 열면」 판정을 먼저 거친다 — 차단된 사람은 알림이 어디를 가리키든 `/blocked`다

### 종이 QR을 찍으면

- 적용 범위: 홀에 붙은 종이의 QR을 기기 카메라 앱으로 찍어 여는 이동
- 기본 계약: **`/check-in?c=<코드>`로 온다.** 앱이 그 화면에서 코드로 바로 인증한다 — 누를 것이 없다([check-in.md](../modules/attendance/screens/check-in.md#여섯-모습)). 앱 안에 스캐너가 없어서 이 주소가 QR의 전부다
- 예외: 로그인이 안 됐으면 로그인 뒤 이 주소로 돌아온다. 코드는 주소에 남아 있고 인증은 돌아온 자리에서 일어난다. 승인 전이거나 차단된 사람은 「앱을 열면」 판정이 먼저라 각자의 자리로 간다

## 예외·미정

### 아직 안 정한 것

#### Q-01

- 질문: 교대 승인 화면이 없다
- 필요한 근거와 대안: [`swap/design.md`](../modules/swap/design.md#아직-안-정한-것)

#### Q-02

- 질문: 화면이 없는 함수 — `post_announcement`(공지 보내기), `set_hall_location`(홀 좌표·반경), `undo_leave`(퇴사 되돌리기). `import_holidays`는 목록에서 빠졌다 — cron이 부르는 함수라 사람이 누를 자리가 없다([payroll/design.md](../modules/payroll/design.md#공휴일-받기)). 알림 설정은 「나」의 [알림](../modules/account/screens/profile.md#알림)이고 지난 알림 목록은 [notifications.md](../modules/notification/screens/notifications.md)라 둘 다 목록에서 빠졌다
- 결정 담당과 시점: 1차에 그릴지 미룰지
