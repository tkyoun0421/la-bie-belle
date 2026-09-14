# 흐름

화면 사이의 흐름이 산다. 어느 화면에서 무엇을 하면 어디로 가는가다.

화면 문서 열둘이 각자 「들어오는 문」을 적어뒀고 여기는 그것을 한 장으로 모은다. 화면 안의 시트·다이얼로그는 화면 문서 몫이고, 여기는 화면과 화면 사이만 본다. 이 파일이 지도를 들고, 도메인마다의 길은 같은 이름의 파일에 산다 — [`account.md`](../../modules/account/design.md) · [`schedule.md`](schedule.md) · [`swap.md`](swap.md) · [`attendance.md`](attendance.md) · [`payroll.md`](payroll.md) · [`notification.md`](notification.md).

## 경로

| 경로 | 화면 | 문서 |
| --- | --- | --- |
| `/login` | 로그인 | [`login.md`](../../modules/account/screens/login.md) |
| `/pending` | 프로필 작성 · 승인 대기 · 거절된 뒤 | [`login.md`](../../modules/account/screens/login.md) |
| `/blocked` | 차단 | [`login.md`](../../modules/account/screens/login.md) |
| `/left` | 퇴사한 뒤 | [`login.md`](../../modules/account/screens/login.md#퇴사한-뒤) |
| `/` | 대시보드 | [`dashboard.md`](../../design-system/pages/dashboard.md) |
| `/check-in` | 출근 인증 | [`dashboard.md`](../../design-system/pages/dashboard.md#출근-인증) |
| `/schedule` | 근무자 근무표. `?month=`는 달, `?date=`는 그날 시트 | [`schedule-worker.md`](../../design-system/pages/schedule-worker.md) |
| `/payroll` | 급여 | [`payroll.md`](../../design-system/pages/payroll.md) |
| `/me` | 나 | [`profile.md`](../../modules/account/screens/profile.md) |
| `/admin` | 관리자 홈 | [`schedule-admin.md`](../../design-system/pages/schedule-admin.md#관리자-홈) |
| `/admin/schedule` | 관리자 달력. `?month=`는 달, `?date=`는 날 상세 | [`schedule-admin.md`](../../design-system/pages/schedule-admin.md) |
| `/admin/applications` | 근무 신청 모아보기. `?month=` | [`schedule-admin.md`](../../design-system/pages/schedule-admin.md#근무-신청-모아보기) |
| `/admin/approvals` | 승인할 일 | [`approvals.md`](../../design-system/pages/approvals.md) |
| `/admin/members/pending` | 가입 대기 | [`members-pending.md`](../../modules/account/screens/members-pending.md) |
| `/admin/members` | 직원 | [`members.md`](../../modules/account/screens/members.md) |
| `/admin/wages` | 시급 | [`wages.md`](../../design-system/pages/wages.md) |
| `/admin/qr` | QR | [`qr.md`](../../design-system/pages/qr.md) |
| `/admin/stats` | 통계 | [`stats.md`](../../design-system/pages/stats.md) |

**동적 세그먼트가 없다.** 날은 전부 `?date=`다. 라우트가 전부 정적 껍데기라 미리 받고(prefetch) Service Worker가 캐시한다([`../runtime/`](../runtime/#캐시-네-계층)). 근무자에게 `?date=`는 달력 위의 시트고 관리자에게는 날 상세 화면 하나다 — 같은 문법, 다른 모양. `?date=`·`?month=`를 읽는 컴포넌트는 Suspense 안에 산다 — 정적 빌드가 요구한다.

`/admin` 아래는 관리자만이다. 근무자가 열면 `/`로 보낸다.

## 앱을 열면

세션 → 프로필 → 승인 순으로 가른다. 규칙은 [domain/account.md](../../modules/account/README.md)고 판정은 껍데기 하나가 앱이 뜰 때와 탭 복귀에 `['profile']`을 읽어 한다([`../runtime/account.md`](../../modules/account/design.md)). 라우트 전환은 그 값을 쓴다 — 탭을 옮길 때마다 다시 읽지 않는다.

| 상태 | 간다 |
| --- | --- |
| 세션 없음 | `/login` |
| 프로필 없음 · 제출 안 함 · 거절됨 · 승인 대기 | `/pending` |
| 차단 | `/blocked` |
| 퇴사 | `/left` |
| 승인됨 | `/`. 마지막 경로를 복원하지 않는다 |

제 자리가 아닌 경로를 열면 제 자리로 간다 — 승인 안 된 사람이 `/`를, 퇴사자가 `/schedule`을, 근무자가 `/admin`을 열었을 때다. 퇴사자에게 열린 경로는 `/left`와 `/payroll` 둘이다.

## 세 층

**근무자 층은 탭 넷이 나란히다.** 대시보드 · 근무표 · 급여 · 나. 탭 사이는 뒤로가 없다 — 탭 바가 곧 이동이다. 근무자 층에서 밀려 올라가는 화면은 출근 인증 하나고, 닫으면 대시보드다.

**관리자 층은 홈 위로 쌓인다.** 「나」의 「관리자 모드」 줄이 `/admin`을 열고, 홈의 줄이 각자의 화면을 연다. 달력은 홈의 근무표 타일이 여는 별개 화면이고 날 상세는 그 위다 — 홈 → 달력 → 날 상세 셋이다. 관리자가 근무자 알림을 누르면 관리자 층을 버리고 근무자 층으로 간다.

**게이트 층은 넷이 나란히다.** `/login` · `/pending` · `/blocked` · `/left`. 서로 오가지 않고 상태가 바뀌면 껍데기가 옮긴다.

## 뒤로

**앱바의 뒤로는 부모 경로로 가는 명시 이동이다.** `history.back()`이 아니다 — 알림으로 바로 착지하면 history가 비어 있어도 뒤로 갈 곳이 있어야 한다. 부모는 표대로 고정이고, 날 상세만 온 곳이 셋이라 `?from=`으로 출처를 든다.

| 어디서 | 뒤로 |
| --- | --- |
| 탭 넷 | 없음 |
| 출근 인증 | `/` |
| 관리자 홈 | `/me` |
| 달력 · 근무 신청 모아보기 · 승인할 일 · 가입 대기 · 직원 · 시급 · QR · 통계 | `/admin` |
| 날 상세 | 달력. `?from=approvals`면 승인할 일, `?from=members`면 직원 |
| 급여(퇴사자) | `/left` |
| 프로필 작성 · 승인 대기 | 없음. 로그아웃이 유일한 문 |

**시트는 history에 든다.** 날 시트·달 고르기·요청 시트가 열리면 `pushState`고, 안드로이드 뒤로 버튼과 iOS 가장자리 스와이프가 시트를 닫는다. 화면을 떠나지 않는다. iOS 홈 화면 앱에서 스와이프가 `popstate`를 안 주면 그때 시트를 history에서 뺀다 — 기기 테스트 항목이다.

브라우저 뒤로는 있는 만큼 돈다. 앱바 뒤로는 언제나 표대로다.

## 알림을 누르면

**알림이 말한 자리까지 간다.** 날이 있는 알림은 그날 시트가 열린 채로 근무표에 선다(`/schedule?date=`), 관리자 알림은 그날 날 상세다(`/admin/schedule?date=`). 종류마다의 목적지는 [`notification.md`](notification.md)에 있다.

푸시를 눌러 앱이 뜨면 「앱을 열면」 판정을 먼저 거친다 — 차단된 사람은 알림이 어디를 가리키든 `/blocked`다.

## 아직 안 정한 것

- 교대 승인 화면이 없다 — [`swap.md`](swap.md)
- `?month=`가 달력 달인지 근무표 달(10월 5일~11월 1일)인지 — [`../runtime/`](../runtime/#아직-안-정한-것)의 달 키와 같은 결정이다. `?date=2026-11-01` 시트를 닫으면 어느 달로 돌아가나가 여기 걸린다
- 화면이 없는 함수 — `post_announcement`(공지 보내기), `set_hall_location`(홀 좌표·반경), `undo_leave`(퇴사 되돌리기), `import_holidays`. 알림 설정(끄기·다시 켜기)과 지난 알림 목록도 화면이 없다. 1차에 그릴지 미룰지
