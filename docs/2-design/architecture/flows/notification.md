# 알림

짝은 [domain/notification.md](../../domain/notification.md)다. 종류·받는 사람·트리거는 거기 있고, 여기는 누르면 어디로 가나다.

## 목적지

푸시를 누르든 대시보드 알림 영역의 CTA를 누르든 같은 곳이다. `payload`가 날짜·달을 든다. 관리자 목적지는 관리자 층으로 바로 착지하고 앱바 뒤로가 부모 경로로 간다([`README.md`](README.md#뒤로)).

표는 릴리스를 가리지 않고 전부 든다. 교대 다섯 줄과 관리자 공지는 2차다([roadmap](../../../1-plan/roadmap.md#릴리스-목록)) — 1차 알림 task는 나머지만 구현하고, 「교대 수락 → 관리자」의 미정은 2차 교대 알림 task가 닫는다.

| 종류 | 받는 사람 | 간다 |
| --- | --- | --- |
| 가입 승인 | 그 사람 | `/` |
| 신청 접수 열림 · 마감일 변경 | 승인된 전원 | `/schedule?month=` 제출 모드 |
| 근무표 확정 | 배정된 사람 | `/schedule?month=` |
| 근무표 변경 | 들어온 사람 | `/schedule?date=` |
| 근무표 변경 | 빠진 사람 | `/schedule?month=` — 그날 시트에 자기가 없다 |
| 미리 알림 | 배정된 사람 | `/schedule?date=`. 주말 묶음이면 그 사람의 첫 근무 날 |
| 출근 직전 | 배정된 사람 | `/check-in` |
| 근무 요청 도착 | 받은 사람 | `/schedule?date=` 요청 카드 |
| 근무 요청 수락 · 전부 소진 | 관리자 | `/admin/schedule?date=` |
| 교대 요청 도착 | 받은 사람 | `/schedule?date=` |
| 교대 수락 | 요청자 | `/schedule?date=` |
| 교대 수락 | 관리자 | 미정 — [`swap.md`](swap.md) |
| 교대 승인 | 요청자 · 선택된 쪽 | `/schedule?date=` |
| 교대 전부 소진 | 요청자 | `/schedule?date=` |
| 근무 취소 요청 | 관리자 | `/admin/approvals` |
| 근무 취소 결과 | 그 사람 | 승인이면 `/schedule?month=`, 거절이면 `/schedule?date=` |
| 사유 결과 | 그 사람 | `/schedule?date=` 명단의 자기 상태 |
| 빈 자리 재촉 | 관리자 | `/admin/schedule?date=` |
| 관리자 공지 | 승인된 전원 | 없음. 대시보드 알림 영역이 곧 목적지라 CTA가 없고 ✕뿐이다 |

## 읽음

목적지로 가는 것과 읽음은 같은 순간이다 — CTA를 누르면 `mark_notifications_read`가 같이 나간다([`../runtime/notification.md`](../runtime/notification.md)).
