# 출근

짝은 [domain/attendance.md](../../domain/attendance.md)다. 화면은 `dashboard.md`(대시보드·출근 인증)·`approvals.md`·`qr.md`다.

## 인증

출근 직전 알림 → `/check-in`. 대시보드 「출근 인증하기」 → `/check-in`. 위치를 받아 `check_in` → 인증되면 2초 뒤 저절로 `/`. 멀거나 위치를 못 보면 QR 시트 → 스캔 → 같은 함수 → 같은 끝. 닫기는 `/`다. 재시도 규칙은 [`../runtime/attendance.md`](../runtime/attendance.md).

## 사유

못 찍은 근무자가 대시보드의 「사유 넣기」 시트에서 낸다(`submit_excuse`) → 관리자 `/admin/approvals` → 판정(`decide_excuse`)은 목록에 머문다 → 근무자에게 결과 알림 → `/schedule?date=` 그날 명단의 자기 상태.

관리자에게 사유가 왔다는 알림은 없다 — 승인할 일 줄의 건수가 대신한다.

## QR

`/admin/qr`에서 바꾸면(`rotate_qr`) 즉시 폐기. 옛 QR로 스캔한 사람은 `invalid_qr`이고 `/check-in`에 머문다. 홀 좌표·반경(`set_hall_location`)은 화면이 없다 — [`README.md`](README.md#아직-안-정한-것).
