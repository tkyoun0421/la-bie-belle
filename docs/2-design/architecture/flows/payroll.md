# 급여

짝은 [domain/payroll.md](../../domain/payroll.md)다. 화면은 `payroll.md`·`wages.md`·`stats.md`다.

## 조회

탭 바 「급여」, 대시보드 「이번 주 예상 급여」 줄 → `/payroll`. 기간 화살표와 주·월·연 세그먼트는 화면 안이다. 연 줄을 누르면 그 달의 월 보기다. 다음 화면이 없다.

퇴사자는 `/left`의 버튼 하나로 `/payroll`에 온다 — 탭 바 없이, 앱바 뒤로가 `/left`다.

## 시급·조정

`/admin/wages`에서 사람 시급(`set_wage`)·기본 시급(`set_default_wage`). 조정은 날 상세의 명단에서(`set_adjustment`). 알림이 없다 — 급여 화면이 다음에 열릴 때 바뀐 값이다.

## 통계

`/admin/stats`. 줄을 눌러도 다음 화면이 없다.
