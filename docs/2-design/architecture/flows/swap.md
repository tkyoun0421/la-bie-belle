# 교대

짝은 [domain/swap.md](../../domain/swap.md)다. 화면은 `schedule-worker.md`의 날 시트다.

## 셋이 거친다

요청자가 그날 시트에서 여럿에게 건다(`create_swap_request`) → 받는 쪽마다 알림 → `/schedule?date=` 그날 시트 → 수락(`respond_request`) → 요청자와 관리자에게 수락 알림 → 관리자가 승인(`approve_swap`) → 배정이 바뀌고 승인 알림이 요청자와 선택된 쪽에게 → `/schedule?date=`.

받는 쪽이 전부 거절·만료면 요청자에게 전부 소진 알림 하나 → `/schedule?date=`. 거절·만료 건건이는 안 울린다. 수락 취소는 안 울린다.

## 아직 안 정한 것

- **관리자가 교대를 승인하는 화면이 없다.** `schedule-admin.md`가 「관리자 승인 화면은 여기 없다」고 비워뒀고 `approvals.md`는 근무 취소와 사유만 든다. 수락 알림이 관리자를 어디로 보낼지가 이것에 달렸다 — 승인할 일에 교대 종류를 더하는 것이 후보다. 정해질 때까지 [`notification.md`](notification.md)의 그 줄은 비워둔다
- **받을 사람 없이 관리자에게만 거는 교대.** `api/swap.md`가 함수 모양은 적었는데 관리자에게 무엇이 어디로 가는지는 domain도 여기도 비어 있다. 위 화면과 같이 정한다
