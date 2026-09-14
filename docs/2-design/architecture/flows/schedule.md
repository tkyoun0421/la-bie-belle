# 근무표

짝은 [domain/schedule.md](../../domain/schedule.md)다. 화면은 `schedule-worker.md`·`schedule-admin.md`·`approvals.md`다.

## 한 달의 생애

관리자 `/admin`에서 근무표 만들기(`create_schedule`) → 신청 접수 알림이 승인된 전원에게 → 근무자 `/schedule?month=`가 제출 모드 → 날짜 체크 → 저장(`submit_availability`) → 마감이 지나면 관리자가 `/admin/schedule`에서 날을 열고(`open_day`) 날 상세에서 배정하고(`add_assignment`) 확정(`confirm_schedule`) → 근무표 확정 알림 → 근무자 `/schedule?month=`가 보기 모드.

마감일을 바꾸면(`set_application_deadline`) 마감일 변경 알림이 승인된 전원에게 간다. 관리자는 달력의 줄에서 `/admin/applications?month=`로 신청 현황을 모아 본다.

## 근무자 근무표의 문

- 탭 바 「근무표」 — `?month=` 이번 달
- 대시보드 「이번 주 근무」 줄 — `?date=` 그 근무 날, 시트가 열린 채
- 알림 CTA — 종류마다 `?month=` 또는 `?date=`([`notification.md`](notification.md))
- 달력의 요청 온 날 칸 — `?date=`

시트를 닫으면 `?month=`다. 시트 안의 교대 요청·근무 취소·「근무할게요」는 시트 이야기라 화면 문서 몫이다.

## 관리자 근무표의 문

`/admin` 홈의 근무표 타일 → `/admin/schedule?month=` 달력 → 날을 누르면 `/admin/schedule?date=` 날 상세. 날 상세로 오는 길은 넷 — 달력, 알림(근무 요청 수락·전부 소진·빈 자리 재촉), 승인할 일의 근무 취소 승인 뒤(`?from=approvals`), 직원의 퇴사 Dialog(`?from=members`). 뒤로는 온 곳이다.

## 근무 요청

관리자가 날 상세에서 여럿에게 보낸다(`send_work_request`) → 받은 근무자마다 알림 → `/schedule?date=` 그날 시트의 요청 카드 → 「근무할게요」(`respond_request`) → 첫 사람만 통과, 나머지는 `slot_full` → 관리자에게 수락 알림 → 날 상세. 전부 거절이거나 배치 `expire_requests`가 만료시키면 관리자에게 전부 소진 알림 → 날 상세.

끝난 요청의 알림을 뒤늦게 누르면 같은 `?date=`고 시트가 끝난 모양으로 열린다.

## 근무 취소

근무자가 그날 시트에서 낸다(`create_cancel_request`) → 관리자에게 알림 → `/admin/approvals` → 승인(`decide_cancel_request`)이면 날 상세(`?from=approvals`)로 넘어가 빈자리를 채운다, 거절이면 목록에 머문다 → 근무자에게 결과 알림 → 승인이면 `/schedule?month=`(그날 시트에 자기가 없다), 거절이면 `/schedule?date=`.
