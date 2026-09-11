# 흐름

화면 사이의 흐름이 산다. 어느 화면에서 무엇을 하면 어디로 가는가다.

## 여기 담는 것

이 파일이 전체 지도를 들고, 갈래가 깊어지면 `<도메인>.md`로 나간다.

- 앱을 열었을 때 어디로 가나 — 로그인 전, 프로필 전, 승인 전, 승인 뒤, 퇴사 뒤
- 근무자 탭 넷과 관리자 홈이 여는 화면들
- 알림을 누르면 어디로 가나
- 되돌아오는 길 — 앱바의 뒤로가 어디로 가나

## 재료는 이미 있다

화면 문서 여덟이 각자 「들어오는 문」을 적어뒀다. 모아 그리면 된다.

| 화면 | 문서 |
| --- | --- |
| 로그인·프로필 작성·승인 대기·퇴사한 뒤 | [`login.md`](../../design-system/pages/login.md) |
| 대시보드 | [`dashboard.md`](../../design-system/pages/dashboard.md) |
| 근무자 근무표 | [`schedule-worker.md`](../../design-system/pages/schedule-worker.md) |
| 급여 조회 | [`payroll.md`](../../design-system/pages/payroll.md) |
| 나 | [`profile.md`](../../design-system/pages/profile.md) |
| 관리자 홈·근무표 | [`schedule-admin.md`](../../design-system/pages/schedule-admin.md) |
| 승인할 일 | [`approvals.md`](../../design-system/pages/approvals.md) |
| 가입 대기 | [`members-pending.md`](../../design-system/pages/members-pending.md) |
| 직원 | [`members.md`](../../design-system/pages/members.md) |
| 시급 | [`wages.md`](../../design-system/pages/wages.md) |
| QR | [`qr.md`](../../design-system/pages/qr.md) |
| 통계 | [`stats.md`](../../design-system/pages/stats.md) |

## 아직 백지다

언제든 모아 그릴 수 있다. [`data-model/`](../data-model/)이나 [`api/`](../api/)를 기다리지 않는다 — 화면 사이의 길은 이미 정해져 있고 여기는 그것을 한 장으로 옮기는 자리다.
