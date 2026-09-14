# 업무 영역

용어와 규칙의 정본이다. 문서와 코드와 화면 문구가 같은 말을 쓰고, 계산과 상태 전이는 여기 적힌 것을 따른다. 자리와 근거는 [ADR-004](../adr/ADR-004-domain-rules-home.md)와 [ADR-009](../adr/ADR-009-design-modules-and-stage-links.md)에 있다.

PRD는 왜 만드는지를 담고 규칙은 안 담는다. [`../spec/`](../spec/)은 task 하나가 무엇이 되면 완료인지를 담는다. task가 끝나도 남는 문장이면 여기가 집이다.

영역 하나가 폴더 하나다. `README.md`가 용어와 업무 규칙, `design.md`가 데이터·API·실행 동작, `screens/`가 그 영역이 소유한 화면 문서와 시안이다. 여러 영역에 걸치는 화면(대시보드·승인함·통계)은 [`../system/screens/`](../system/screens/)에 있고 각 영역의 규칙을 링크한다.

이 파일은 영역을 찾게 하는 데까지다. 영역별 규칙을 요약해 여기 복사하지 않는다 — 공유 데이터나 행위의 소유 영역과 참조 방향만 적는다. 문서별 작성법은 [설계 안내](../README.md#입력과-산출물)가 소유한다.

## 영역 지도

- [account/](account/) — 계정. 프로필과 가입 승인, 관리자 권한. [규칙](account/README.md) · [설계](account/design.md) · 화면: [login](account/screens/login.md) · [profile](account/screens/profile.md) · [members-pending](account/screens/members-pending.md) · [members](account/screens/members.md)
- [schedule/](schedule/) — 근무표. 포지션과 자리와 배정, 확정, 근무 신청과 근무 요청. [규칙](schedule/README.md) · [설계](schedule/design.md) · 화면: [schedule-worker](schedule/screens/schedule-worker.md) · [schedule-admin](schedule/screens/schedule-admin.md)
- [swap/](swap/) — 교대. 요청과 수락과 승인, 강제 변경. [규칙](swap/README.md) · [설계](swap/design.md) · 화면은 schedule-worker의 날 시트라 소유 화면이 없다
- [attendance/](attendance/) — 출근 인증. 위치와 QR, 인증 시각. [규칙](attendance/README.md) · [설계](attendance/design.md) · 화면: [check-in](attendance/screens/check-in.md) · [excuse](attendance/screens/excuse.md) · [qr](attendance/screens/qr.md)
- [payroll/](payroll/) — 급여. 시급과 가산과 조정과 지급 주기. [규칙](payroll/README.md) · [설계](payroll/design.md) · 화면: [payroll](payroll/screens/payroll.md) · [wages](payroll/screens/wages.md)
- [notification/](notification/) — 알림. 무엇이 언제 누구에게 나가나. [규칙](notification/README.md) · [설계](notification/design.md) · 소유 화면이 없다
- [`../system/screens/`](../system/screens/) — 여러 영역에 걸치는 화면. [dashboard](../system/screens/dashboard.md) · [approvals](../system/screens/approvals.md) · [stats](../system/screens/stats.md)

새 영역이 생기면 폴더를 더하고 여기에 한 줄을 더한다. 파일만 더하고 이 목록을 안 고치면 지도가 거짓말을 한다. 화면 문서가 늘면 소유 영역의 줄에 링크를 더한다 — 빠지면 `pnpm test`의 디자인 지도 검사가 잡는다.

## 공통 용어

새 개념이 나오면 해당 영역 파일에 더한다. 여기 없는 말을 코드 이름에 쓰지 않는다.

어느 영역인지 애매하면 그 개념을 누가 쓰는지로 가른다. 관리자가 근무표를 짤 때 쓰면 `schedule`, 급여를 볼 때 쓰면 `payroll`이다. 둘 다 쓰면 경계가 있는 것이니 아래 절에 적는다.

## 영역 사이의 책임과 의존

같은 말이 자리에 따라 뜻이 다르다. 코드 이름을 지을 때 어느 쪽인지 밝힌다.

**근무표에서 근무** — 예정된 배정이다. 아직 일어나지 않았다.

**출근에서 근무** — 인증이 찍힌 사실이다. 실제로 왔는지만 말한다.

**급여에서 근무** — 조정까지 반영해 급여 계산 대상이 된 배정이다. 셋 중 이것만 돈이 된다.

**가입 승인과 교대 승인** — 다른 것이라 이름을 나눠 쓴다. 승인 하나로 부르지 않는다.

경계는 이 문서에만 산다. `src/` 아래에 경계 이름이나 영역 이름의 폴더를 만들지 않는다. 이유는 ADR-002에 있다.

## 경계의 미정

지금 없다.
