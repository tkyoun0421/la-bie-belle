---
sources:
  - ../../2-design/modules/attendance/screens/excuse.md#목적과-진입
  - ../../2-design/modules/attendance/screens/excuse.md#화면-상태와-흐름
  - ../../2-design/modules/attendance/screens/excuse.md#사유-시트-짜임
  - ../../2-design/modules/attendance/screens/excuse.md#사유-시트-색
  - ../../2-design/modules/attendance/screens/excuse.md#사유-시트-글자
  - ../../2-design/modules/attendance/screens/excuse.md#사유-시트-여백과-모양
  - ../../2-design/modules/attendance/screens/excuse.md#사유-시트-문안
  - ../../2-design/modules/attendance/screens/excuse.md#사유-시트-모션
  - ../../2-design/modules/attendance/screens/excuse.md#규칙과-부딪힌-자리
  - ../../2-design/modules/attendance/design.md#사유
  - ../../2-design/modules/attendance/design.md#사유-제출과-판정
  - ../../2-design/modules/attendance/README.md#att-010
  - ../../2-design/modules/attendance/README.md#att-011
  - ../../2-design/modules/attendance/README.md#att-012
  - ../../2-design/modules/attendance/README.md#att-013
  - ../../2-design/modules/attendance/README.md#att-014
  - ../../2-design/modules/attendance/README.md#att-015
  - ../../2-design/modules/attendance/README.md#att-018
  - ../../2-design/system/screens/approvals.md
  - ../../2-design/design-system/components.md#dialog와-바텀시트
  - ../../2-design/design-system/components.md#input
  - ../../2-design/design-system/writing.md#다이얼로그-왼쪽-버튼은-닫기다
---

# 사유 시트와 판정 줄을 만든다 — 구현 계획

> 앱 골격(`expo-scaffold`)이 선 뒤에 파일 배치와 검증 명령을 채운다. 업무 규칙과 완료 조건은 그대로 선다.

## 입력 명세·기준

정본은 [excuse.md](../../2-design/modules/attendance/screens/excuse.md)와 짝 시안 `excuse.sian.html`이고, 관리자 쪽은 [approvals.md](../../2-design/system/screens/approvals.md)다. 행위 계약은 [design.md](../../2-design/modules/attendance/design.md#사유-제출과-판정), 업무 규칙은 [ATT-010](../../2-design/modules/attendance/README.md#att-010)~[ATT-015](../../2-design/modules/attendance/README.md#att-015)와 [ATT-018](../../2-design/modules/attendance/README.md#att-018)이다.

산출은 셋이다 — 근무자의 사유 바텀시트, `/admin/approvals`의 사유 줄과 판정, 그리고 근무자 명단의 인증 상태 열. 선행은 [`attendance-data`](attendance-data.md)와 [`schedule-requests`](schedule-requests.md)와 [`dashboard`](../../backlog.md)다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **결과가 같은 시트 안에서 난다.** 시트가 사라졌다 다른 것이 뜨는 것이 아니라 내용만 결과로 바뀐다([사유 시트 짜임](../../2-design/modules/attendance/screens/excuse.md#사유-시트-짜임)). 손잡이와 네 모서리가 자리를 지킨다 — **상태가 아홉인 하나의 시트**다
- **보낸 글을 못 고친다.** 관리자가 이미 읽었을 수 있다([ATT-012](../../2-design/modules/attendance/README.md#att-012)). 「이미 보낸 뒤 다시 열기」가 읽기 전용인 것이 그 규칙의 화면 쪽 얼굴이고, 거절되면 **새 사유를 낸다**([ATT-013](../../2-design/modules/attendance/README.md#att-013))
- **오류 테두리를 안 쓴다.** 다섯 자 미만이어도 칸이 안 붉어진다([규칙과 부딪힌 자리](../../2-design/modules/attendance/screens/excuse.md#규칙과-부딪힌-자리)) — 덜 쓴 것은 틀린 것이 아니다. 알리는 것은 칸 아래 도움말 하나다
- **판정이 결근을 확정하지 않는다.** 거절해도 판정 행만 남고 상태는 [`attendance-data`](attendance-data.md)의 순수 함수가 낸다([ATT-014](../../2-design/modules/attendance/README.md#att-014))

`/admin/approvals`의 껍데기는 [`schedule-requests`](schedule-requests.md)의 AC-08이 근무 취소 줄과 함께 먼저 세운다. 이 task는 그 목록에 **사유 줄을 더한다** — 목록이 종류로 탭을 안 가르니([목록 짜임](../../2-design/system/screens/approvals.md#목록-짜임)) 같은 자리가 넓어진다.

## 완료 조건

### AC-01

**시트의 상태 아홉.** [화면 상태와 흐름](../../2-design/modules/attendance/screens/excuse.md#화면-상태와-흐름) 표가 정본이다 — 열자마자·다섯 자 미만·서른 자 남음·200자·보내는 중·보냄·못 보냄·이미 보낸 뒤 다시 열기·키보드가 올라옴.

- 시트는 [Dialog와 바텀시트](../../2-design/design-system/components.md#dialog와-바텀시트)를 그대로 쓴다. 위쪽만 `rounded-lg`, 왼쪽이 「닫기」 오른쪽이 primary
- **덮개를 눌러도 안 닫힌다.** 쓰던 글이 날아가는 것을 막는다. 닫는 길은 「닫기」 하나다
- 덮개 색은 `bg.scrim`이다 — 그 토큰이 라이트·다크와 투명도 42%를 값 안에 들고 있다
- 시트 아래 여백에 `useSafeAreaInsets`의 `bottom`을 더한다

### AC-02

**입력 규칙.**

- 다섯 자 미만이면 보내기가 잠긴다. 칸 아래 도움말이 「조금 더 자세히 써주세요 · 다섯 자 이상」이다. **테두리를 안 물들인다**
- 글자 수는 **서른 자가 남았을 때 나타난다** — 170자부터다. 라벨 줄 오른쪽이다
- 200자에서 더 안 들어간다. 숫자가 `fg.critical`에 `font-semibold`가 되고 도움말이 「여기까지만 쓸 수 있어요」다. **이미 쓴 글을 안 지운다**
- 글자 수에 `tabular-nums`를 건다 — 매 글자 바뀌는 숫자라 폭이 흔들리면 라벨 줄이 떨린다
- 길이를 **UTF-16 코드 유닛이 아니라 사람이 보는 글자로 센다.** 이모지 하나가 2로 세어지면 200자 상한이 사람이 세는 것과 어긋난다
- 함수 쪽 상한과 같은 값이다([`attendance-data`](attendance-data.md#ac-04)) — 화면이 먼저 막고 함수가 마지막 문이다

### AC-03

**보내기와 결과.**

- 누르면 오른쪽 버튼 안에서 링이 돌고 **닫기도 같이 잠긴다**. 중간에 닫으면 갔는지 알 길이 없다
- 성공 — 링 둘이 번지고 흰 원이 튀어오르고 체크가 왼쪽부터 그어진다. 800ms. 「사유를 보냈어요」 / 「관리자가 확인하면 알려드릴게요」. **1.65초 뒤 저절로 닫힌다**
- 실패 — 원이 좌우로 흔들리고 ✕가 두 획으로 180ms·400ms에 그어진다. 620ms. 「사유를 보내지 못했어요」 / 「쓴 내용은 그대로 있어요 · 다시 보내볼게요」. **안 닫힌다.** 쓴 글이 칸에 그대로 있다
- **실패에 링이 없다.** 밖으로 번지는 것은 좋은 소식의 모양이다
- **색만으로 실패를 안 알린다** — ✕ 모양, 흔들림, 문장 셋이 같이 말한다
- 도는 시간이 끝나면 반드시 체크 아니면 ✕가 온다. 링이 돌다 사라지는 끝이 없다
- 시트가 덮고 있는 동안 **대시보드가 안 움직인다.** 다 내려간 뒤 220ms에 버튼과 블록이 바뀐다

### AC-04

**다시 열기와 반려.**

- 이미 낸 날의 「사유 넣기」는 **읽기 전용 칸**과 「확인 중」 배지를 띄운다. 버튼은 닫기 하나다. 제목이 「보낸 사유예요」, 날짜 줄이 「9월 12일(토) · 18:52에 보냈어요」
- 반려된 뒤는 **시트가 아니라 대시보드 블록**이다. `bg.critical-weak` 면에 제목 「사유가 받아들여지지 않았어요」, 아래 줄이 관리자가 남긴 이유를 「관리자가 「…」라고 남겼어요」로 감싼다, 버튼 「사유 다시 쓰기」
  - 그 버튼이 **빈 시트를 연다** — 앞 글을 채워주지 않는다. 거절된 글을 고쳐 내는 것이 아니라 새로 내는 것이다
  - 관리자 이유가 비어 있을 수 없다([`attendance-data`](attendance-data.md#ac-04)가 거절에 이유를 필수로 걸었다)
- 대시보드의 못 찍음 블록과 「사유 넣기」 버튼 자리는 [`dashboard`](../../backlog.md)가 세우고 이 task가 그 문을 이 시트에 연결한다

### AC-05

**키보드.** 칸에 커서가 가면 **시트째 올라앉는다**(`bottom-58`). 가려지는 쪽만 밀면 칸과 버튼 중 하나가 화면 밖으로 나간다.

- iOS 사파리의 visual viewport로 잰다 — 고정 높이 하나로 두면 키보드 높이가 다른 기기에서 어긋난다. 문서의 `bottom-58`은 기준값이다

### AC-06

**`/admin/approvals`의 사유 줄.**

- 목록에 사유 항목이 선다. 누가·어느 날 근무·언제 냈는지와 **글 전문**이 보인다 — 관리자는 `excuses.body`를 읽는다([ATT-018](../../2-design/modules/attendance/README.md#att-018))
- 승인과 반려 둘. **반려는 이유를 받는다** — 안 쓰면 못 보낸다
- 판정하면 **목록에 머문다**([화면 상태와 흐름](../../2-design/modules/attendance/screens/excuse.md#화면-상태와-흐름)) — 판정된 줄이 그 자리에서 결과로 바뀐다
- **시한이 없다**([ATT-015](../../2-design/modules/attendance/README.md#att-015)) — 근무 끝 48시간이 지난 사유도 목록에 남아 판정된다
- 관리자에게 사유가 왔다는 알림이 없다 — 승인할 일 줄의 건수가 대신한다
- 판정 결과가 근무자에게 알림으로 간다. 그 발송은 알림 영역의 몫이고 이 task는 **판정이 알림 대상이라는 것만 넘긴다**

### AC-07

**근무자 명단의 인증 상태.** [`schedule-worker`](schedule-worker.md#ac-09)가 자리를 비워 두었다.

- 날 시트의 각 사람 줄에 상태가 붙는다 — 여섯은 [`attendance-data`](attendance-data.md#ac-06)의 순수 함수가 낸다
- 현황 줄(「11명 중 9명 출근 · 지각 1 · 아직 1」)이 선다. **0인 항목을 뺀다**
- 통신 지연 표시도 같은 함수에서 온다
- `['attendance', 'YYYY-MM-DD']` 캐시를 쓴다

### AC-08

**시안 대조와 낡은 주석.** `sian-auditor`가 `excuse.sian.html`과 화면을 대조한다. 시안 안에 **없는 경로(`domain/attendance.md`)를 가리키는 주석**이 남아 있다 — [`sian-sync`](../../backlog.md)가 든 자리고, 이 task가 그 시안을 만지니 같이 지운다.

### AC-09

**테스트.**

- unit: 길이 세기(이모지 포함), 170자에서 글자 수가 나타나고 200자에서 색이 바뀌는 경계, 다섯 자 경계의 잠금, 상태 아홉의 갈림, 반려 블록이 빈 시트를 여는 것, 현황 줄의 0 제외
- e2e: 못 찍은 날의 대시보드에서 시트를 열어 다섯 자 미만으로는 못 보내고, 채워 보내면 결과가 같은 시트에서 나고 저절로 닫힌다. 다시 열면 읽기 전용이다. 관리자가 `/admin/approvals`에서 그 사유를 보고 반려하면 이유 없이는 못 보낸다. 근무자가 다시 열면 반려 블록이 서고 「사유 다시 쓰기」가 **빈 시트**를 연다
- **덮개를 눌러도 안 닫히는 것**을 e2e가 본다 — 규칙이고 쉽게 깨진다

### AC-10

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm test:integration:run`·e2e 명령 초록.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/features/attendance/excuse-sheet/`·`__tests__/` | 시트 상태 아홉, 입력 규칙, 결과 모션 | AC-01~AC-05 |
| `src/screens/dashboard/` | 못 찍음 블록과 반려 블록에서 시트를 연다 | AC-04 |
| `src/screens/admin-approvals/` | 사유 줄과 판정 | AC-06 |
| `src/screens/schedule/` | 날 시트의 인증 상태 열과 현황 줄 | AC-07 |
| `docs/2-design/modules/attendance/screens/excuse.sian.html` | 낡은 경로 주석을 지운다 | AC-08 |
| `excuse` e2e | 제출부터 반려 뒤 재제출까지 | AC-09 |

## 구현 순서

`test-planner` → `unit-test-writer`·`e2e-test-writer` → `implementer` → `sian-auditor` → `pr-diff`.

1. [`attendance-data`](attendance-data.md)와 [`schedule-requests`](schedule-requests.md)와 [`dashboard`](../../backlog.md)가 merge된 뒤에 시작한다. **문 셋이 다 남의 task에 있다**
2. `test-planner`가 배정한다. 상태 아홉은 unit, 제출부터 반려 뒤 재제출까지의 한 바퀴는 e2e다
3. `unit-test-writer`가 입력 규칙과 상태 갈림을 쓴다
4. `e2e-test-writer`가 한 바퀴를 쓴다 — 근무자와 관리자 둘이 번갈아 나오는 시나리오다
5. `implementer`가 시트 → 판정 줄 → 인증 상태 열 순으로 만든다
6. `sian-auditor`가 대조하고 낡은 주석을 확인한다
7. `pr-diff`가 본다 — 반려 이유가 없이 보내지는 길이 안 열렸는지, `excuses.body`가 근무자 화면으로 새지 않는지

## 리스크·전환·되돌리기

- **문 셋이 남의 task에 있다.** 대시보드의 못 찍음 블록, `/admin/approvals` 목록, 날 시트가 각각 [`dashboard`](../../backlog.md)·[`schedule-requests`](schedule-requests.md)·[`schedule-worker`](schedule-worker.md)의 것이다. 그쪽이 늦어지면 이 task가 통째로 막힌다 — **순서를 바꾸지 말고 기다린다.** 임시 진입점을 만들면 지울 것이 는다
- **키보드 높이가 기기마다 다르다.** `bottom-58`은 기준값이고 실기기에서 어긋나면 문서를 고친다
- **판정 알림이 이 task 밖이다.** 근무자가 결과를 못 받는 구간이 알림 영역이 설 때까지 남는다. 그 사이에도 명단의 자기 상태가 바뀌니 정보가 사라지지는 않는다
- **상태 계산을 여기서 다시 짜면 안 된다.** [`attendance-data`](attendance-data.md#ac-06)의 함수를 부른다. 화면이 「확인 중」을 자기 식으로 판정하면 두 벌이 선다 — `pr-diff`가 보는 자리다
- 되돌리기는 브랜치 revert다. 데이터를 안 건드린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 덮개를 누르면 쓰던 글이 날아간다 | e2e `excuse` e2e(예정) | e2e 명령 | 덮개를 눌러도 안 닫힌다 |
| AC-02 | 상한이 사람이 세는 것과 다르다 | unit `src/features/attendance/excuse-sheet/__tests__/`(예정) | `pnpm test` | 이모지가 한 글자, 170자에서 숫자가 뜨고 200자에서 색이 바뀐다 |
| AC-02 | 쓰는 중에 칸이 붉어진다 | unit 위 | `pnpm test` | 다섯 자 미만에도 테두리가 그대로 |
| AC-03 | 링이 돌다 아무 결과 없이 끝난다 | unit 위 | `pnpm test` | 성공은 체크, 실패는 ✕ |
| AC-03 | 실패인데 글이 날아간다 | e2e 위 | e2e 명령 | 칸에 쓴 글이 남아 있다 |
| AC-04 | 거절된 글이 새 시트에 채워진다 | e2e 위 | e2e 명령 | 빈 시트가 열린다 |
| AC-06 | 이유 없이 반려된다 | e2e 위 | e2e 명령 | 이유가 비면 못 보낸다 |
| AC-06 | 근무자가 남의 사유 글을 본다 | integration `tests/integration/attendance-rls.test.ts` | `pnpm test:integration:run` | [`attendance-data`](attendance-data.md#ac-02)가 이미 막았다 |
| AC-07 | 현황 줄에 0이 남는다 | unit 위 | `pnpm test` | 0인 항목이 빠진다 |

- 배정하지 않은 것: 실기기에서 키보드가 올라올 때 칸과 버튼이 둘 다 보이는지 — 시뮬레이터의 키보드 높이가 실기기와 다르다
- 막힌 것: 지금은 없다

## 범위 밖

- `submit_excuse`·`decide_excuse`와 `excuse_status` 뷰 — [`attendance-data`](attendance-data.md)
- 대시보드의 못 찍음 블록 자체 — [`dashboard`](../../backlog.md)
- `/admin/approvals` 목록의 껍데기와 근무 취소 줄 — [`schedule-requests`](schedule-requests.md)
- 판정 결과 알림 발송 — 알림 영역
- 근태 월 집계 화면 — 통계 화면
