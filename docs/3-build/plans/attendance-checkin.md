---
sources:
  - ../../2-design/modules/attendance/screens/check-in.md#목적과-진입
  - ../../2-design/modules/attendance/screens/check-in.md#화면-상태와-흐름
  - ../../2-design/modules/attendance/screens/check-in.md#출근-인증-짜임
  - ../../2-design/modules/attendance/screens/check-in.md#여섯-모습
  - ../../2-design/modules/attendance/screens/check-in.md#출근-인증-색
  - ../../2-design/modules/attendance/screens/check-in.md#출근-인증-글자
  - ../../2-design/modules/attendance/screens/check-in.md#출근-인증-여백과-모양
  - ../../2-design/modules/attendance/screens/check-in.md#출근-인증-문안
  - ../../2-design/modules/attendance/screens/check-in.md#출근-인증-모션
  - ../../2-design/modules/attendance/screens/check-in.md#규칙과-부딪힌-자리
  - ../../2-design/modules/attendance/design.md#출근-인증
  - ../../2-design/modules/attendance/design.md#qr
  - ../../2-design/modules/attendance/design.md#홀-좌표와-반경
  - ../../2-design/modules/attendance/README.md#att-001
  - ../../2-design/modules/attendance/README.md#att-002
  - ../../2-design/modules/attendance/README.md#att-003
  - ../../2-design/modules/attendance/README.md#att-004
  - ../../2-design/modules/attendance/README.md#att-008
  - ../../2-design/modules/attendance/README.md#att-009
  - ../../2-design/modules/attendance/README.md#att-017
  - ../../2-design/modules/attendance/README.md#att-027
  - ../../2-design/system/navigation.md#종이-qr을-찍으면
  - ../../2-design/system/runtime.md#재시도
  - ../../2-design/design-system/foundation/motion.md#축하할-순간
---

# 출근 인증 화면을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [check-in.md](../../2-design/modules/attendance/screens/check-in.md)와 짝 시안 `check-in.sian.html`이다. 둘이 어긋나면 문서가 이긴다. 행위 계약은 [design.md](../../2-design/modules/attendance/design.md#출근-인증)와 [QR](../../2-design/modules/attendance/design.md#qr), 업무 규칙은 [ATT-001](../../2-design/modules/attendance/README.md#att-001)~[ATT-004](../../2-design/modules/attendance/README.md#att-004)·[ATT-008](../../2-design/modules/attendance/README.md#att-008)·[ATT-009](../../2-design/modules/attendance/README.md#att-009)·[ATT-017](../../2-design/modules/attendance/README.md#att-017)이다.

`/check-in` 하나와 그 안의 모습 여섯이 산출이고, **이 앱에서 가장 큰 모션이 여기 있다**. 선행은 [`attendance-data`](attendance-data.md)다.

정본에서 확인한 다섯이 plan의 방향을 정한다.

- **문이 둘이다.** 대시보드의 「출근 인증하기」로 들어오는 위치 길과, 벽의 종이를 기기 카메라로 찍어 `/check-in?c=<코드>`로 들어오는 QR 길이다([종이 QR을 찍으면](../../2-design/system/navigation.md#종이-qr을-찍으면)). **앱 안에 스캐너가 없다** — 앱이 QR에 대해 할 수 있는 것은 어디로 가라고 말하는 것뿐이다
- **지도가 배경이 아니라 내용이다.** 화면을 끝까지 채우고 그 위에 버튼 둘과 시트가 얹힌다. 네이버 지도를 `submodules=gl`로 띄우고 NCP 콘솔에서 만든 스타일을 `customStyleId`로 건다 — 카카오맵에는 다크 타일이 없어서다
- **축하가 아홉 겹이다.** 섬광·정확도 원판·원판·링 넷·방사·원·체크·시트·카운트 줄이 1050ms 안에 겹친다([출근 인증 모션](../../2-design/modules/attendance/screens/check-in.md#출근-인증-모션)). [motion.md](../../2-design/design-system/foundation/motion.md#축하할-순간)가 「이 앱에서 확실한 축하는 하나다」라고 못 박은 그 하나다
- **주요 버튼이 없는 모습이 둘이다.** 「위치를 못 본다」와 「QR로 들어옴」이다. 누를 것이 없는 자리에 버튼을 안 세운다
- **재시도가 여기서만 돈다.** `check_in`이 `TransportError`면 2·4·8·16·32초로 다섯 번 더다. **화면을 잠갔다 돌아와도 이어 돈다** — iOS가 타이머를 멈추면 재개 시점에 이어 붙인다

지금 코드에는 지도도 인증 화면도 없다. 함수와 dal과 재시도는 [`attendance-data`](attendance-data.md)가 세우고 이 task는 화면만 만든다.

## 완료 조건

### AC-01

**모습 여섯.** [화면 상태와 흐름](../../2-design/modules/attendance/screens/check-in.md#화면-상태와-흐름) 표가 정본이다 — 확인 중·인증됐다·멀거나 안 잡힘·위치를 못 본다·QR로 들어옴·코드가 죽었다.

- 골격이 여섯에서 같다 — 위는 지도(또는 빈 면), 아래는 시트다. **시트를 화면 전체로 늘리는 모습이 없다**
- 여섯의 갈림이 순수 함수다. 입력은 위치 권한 상태·좌표·홀 좌표와 반경·주소의 `c` 파라미터·`check_in` 결과다
- 문안은 [출근 인증 문안](../../2-design/modules/attendance/screens/check-in.md#출근-인증-문안) 표 그대로다

### AC-02

**지도.**

- 네이버 지도를 `submodules=gl`로 띄운다. 스타일은 NCP 콘솔의 Map Style Editor에서 만들어 `customStyleId`로 건다. **라이트와 다크 둘을 만든다** — 색 값은 [출근 인증 색](../../2-design/modules/attendance/screens/check-in.md#출근-인증-색) 표의 지도 다섯 줄이다
- **키를 환경 변수로 받는다.** 저장소가 PUBLIC이라 코드에 안 박는다
- **「대표 계정」을 먼저 잡는다.** 무료 월 1,000만 건이 대표로 지정된 계정 하나에만 붙고, 지정 안 된 계정은 첫 호출부터 과금이다. **키 발급 전에 이것이 먼저다**
- 홀 좌표·반경은 DB에서 온다. **값이 오기 전에는 지도를 안 그린다**
- 지도 위에 셋을 그린다 — 내 위치 점과 정확도 원판, 홀 앵커와 이름표, 100미터 점선 원
- **타일이 오기 전에는 원이 안 돈다.** 지도 자리를 `bg.neutral-weak` 면으로 두고 타일이 다 오면 그때 퍼지기 시작한다. **스피너를 안 얹는다** — 시트가 이미 「위치를 확인하고 있어요」라고 말한다

### AC-03

**위치와 거리.**

- `navigator.geolocation`을 **인증 버튼을 누른 순간 한 번** 받는다. 계속 지켜보지 않는다
- 화면이 거리를 계산해 그리지만 **판정은 함수가 한다**([ATT-002](../../2-design/modules/attendance/README.md#att-002)). 화면의 거리는 눈으로 보는 값이고 통과 여부는 `check_in`의 대답이다
- 100미터 밖이면 함수를 안 부르고 「멀거나 안 잡힘」으로 간다 — 부르면 `too_far`가 올 것이 뻔하고, 그 왕복이 사람을 기다리게 한다
- 권한이 거부되면 「위치를 못 본다」다. **「다시 시도」를 안 둔다** — 브라우저가 한 번 거부하면 다시 묻지 않는다

### AC-04

**QR로 들어온 길.**

- 주소에 `c`가 있으면 **들어오자마자** `check_in`을 `method = 'qr'`로 부른다. 누를 것이 없다
- **위치 권한을 안 묻는다.** 지도를 안 그리고 빈 면을 둔다 — 열린 길 앞에서 닫힌 문을 두드리게 하지 않는다
- 성공하면 「인증됐다」로 간다 — **축하도 카운트도 위치로 들어온 길과 같다.** 들어온 문이 달랐을 뿐 끝나는 자리가 같다
- `invalid_qr`이면 「코드가 죽었다」다. 주요 버튼 「위치로 인증하기」가 **위치 길로 갈아탄다** — 화면을 새로 열지 않고 같은 화면에서 「확인 중」이 된다
- 로그인이 안 됐으면 로그인 뒤 이 주소로 돌아온다. **코드가 주소에 남아 있어야 한다**
- 승인 전이거나 차단된 사람은 「앱을 열면」 판정이 먼저다 — 코드가 있어도 각자의 자리로 간다
- **인증한 뒤 주소에서 `c`를 지운다.** 남겨 두면 뒤로가기나 새로고침이 같은 코드로 다시 부르고, 브라우저 기록에 코드가 계속 산다

### AC-05

**인증됐다와 카운트.**

- 축하 아홉 겹을 [출근 인증 모션](../../2-design/modules/attendance/screens/check-in.md#출근-인증-모션) 표의 시간·배수·지연 그대로 만든다. **흰 원에 브랜드 색 체크다** — 초록을 안 쓴다
- **체크가 그어진다.** 짧은 획이 왼쪽 아래에서 먼저 가고 꺾여 오른쪽 위로 올라간다
- **확인 중의 퍼지는 원이 축하가 시작되면 사라진다**
- 카운트는 **시트가 다 선 뒤부터** 2초다. 「2초 뒤 저절로 돌아가요」가 버튼 밑에 서고 숫자만 1로 바뀐다. `tabular-nums`
- **화면 아무 데나 누르면 멈춘다.** 멈추면 그 줄이 통째로 사라지고 버튼만 남는다 — **토스트를 안 띄운다.** 한 번 멈추면 다시 안 센다
- 끝나면 `/`로 간다. 히스토리를 쌓지 않고 **바꿔치기한다** — 돌아간 뒤 뒤로가기가 인증 화면으로 되돌아오면 안 된다
- **움직임 줄이기** — 퍼지는 원이 멈추고 정확도 원판은 남는다. 섬광·링·방사가 빠지고 체크는 다 그려진 채로 나타난다

### AC-06

**실패와 재시도.**

- `check_in`의 재시도는 [`attendance-data`](attendance-data.md#ac-07)의 dal이 든다. 화면은 **도는 동안 무엇을 보여줄지**를 정한다 — 주요 버튼이 눌린 채 잠기고 링이 돈다
- **화면을 잠갔다 돌아와도 이어 돈다.** iOS가 타이머를 멈추므로 `visibilitychange`에서 남은 대기를 이어 붙인다. **끊고 다시 시작하지 않는다** — 다시 시작하면 1분이 2분이 된다
- 다 실패하면 오류를 시트에 적고 버튼이 다시 눌린다. 코드는 [오류의 모양](../../2-design/system/data-access.md#오류의-모양)이 가른다 — `window_closed`·`not_allowed`·`already_done`은 사람이 알아야 할 사실이고 `TransportError`는 다시 눌러볼 일이다
- `already_done`이면 **실패로 안 그린다.** 이미 찍힌 것이니 「인증됐다」로 간다 — 재시도가 두 번 닿은 자리이고, 화면에서는 한 번 성공이다

### AC-07

**시안 대조.** `sian-auditor`가 `/check-in`과 `check-in.sian.html`을 대조한다. 모습 여섯·문안·토큰·모션 아홉 겹이 문서와 같아야 한다.

### AC-08

**테스트.**

- unit: 모습 여섯의 갈림(권한·좌표·`c` 파라미터·함수 결과의 조합), 거리 문구 포맷, 100미터 경계, 카운트가 멈추는 것과 다시 안 세는 것, `already_done`이 성공으로 가는 것, 재시도가 잠금 뒤 이어 붙는 것, 인증 뒤 주소에서 `c`가 지워지는 것
- e2e: 위치를 허용하고 홀 안에서 인증하면 축하가 뜨고 2초 뒤 `/`로 간다. 화면을 누르면 카운트가 멈춘다. 홀 밖이면 「멀거나 안 잡힘」이고 주요 버튼이 「위치 다시 확인하기」다. 권한을 거부하면 지도가 없고 **주요 버튼이 없다**. `?c=` 주소로 들어가면 버튼 없이 인증된다. 틀린 `c`면 「이 코드는 더 쓰지 않아요」다
  - Playwright의 `context.grantPermissions`와 `setGeolocation`으로 위치를 만든다
  - **지도 타일을 안 기다린다.** 네트워크가 필요한 외부 API라 e2e에서 막고, 지도 자리가 빈 면인 상태로 시트를 본다

### AC-09

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm e2e` 초록.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/app/check-in/page.tsx` | 경로와 `c` 파라미터 | AC-01·AC-04 |
| `src/screens/check-in/model/*.ts`·`__tests__/` | 모습 여섯의 갈림, 거리·카운트·재시도 | AC-01·AC-03·AC-05·AC-06 |
| `src/screens/check-in/ui/*.tsx` | 지도·시트·축하의 조립 | AC-02·AC-05 |
| `src/features/attendance/map/` | 네이버 지도 감싸기와 스타일 | AC-02 |
| `.env.example` | 지도 키 이름 | AC-02 |
| `tests/e2e/check-in.spec.ts` | 위치·QR 두 문 | AC-08 |

## 구현 순서

`test-planner` → `unit-test-writer`·`e2e-test-writer` → `implementer` → `sian-auditor` → `pr-diff`.

1. **NCP 대표 계정과 키가 먼저다.** 이것이 안 잡히면 지도가 안 뜨고 화면의 절반이 없다. 키를 받고 Map Style Editor에서 라이트·다크 스타일 둘을 만들어 `customStyleId`를 확보한다 — **사람이 콘솔에서 하는 일이라 task 시작 전에 끝나 있어야 한다**
2. `test-planner`가 AC-01~AC-07을 층에 배정한다
3. `unit-test-writer`가 모습 여섯의 갈림을 먼저 쓴다. 조합이 많은 자리라 여기서 빠지면 화면에서 안 보인다
4. `e2e-test-writer`가 두 문을 쓴다
5. `implementer`가 지도 → 모습 여섯 → 재시도 → 축하 순으로 만든다. **축하가 마지막이다** — 가장 크고, 앞의 것들이 서야 붙일 자리가 생긴다
6. `sian-auditor`가 대조한다
7. **실기기에서 한 번 본다.** 지하에서 위치가 안 잡히는 것, 화면을 잠갔다 돌아왔을 때 재시도가 이어 도는 것, 벽의 종이를 실제로 찍어 앱이 열리는 것이다

## 리스크·전환·되돌리기

- **지도 키가 이 task의 문이다.** 대표 계정을 안 잡으면 첫 호출부터 과금이다. 키·스타일이 없으면 지도 없는 화면으로 먼저 만들 수는 있지만 그 상태의 시안이 없다 — **기다리는 쪽이 맞다**
- **축하 아홉 겹이 저사양 기기에서 끊길 수 있다.** transform과 opacity만 쓰고 레이아웃을 건드리는 속성을 안 쓴다. 끊기면 겹 수를 줄이는 것이 아니라 **문서를 고치고 시안을 따라 고친다**
- **재시도가 잠금 뒤 이어 도는 것을 자동으로 못 본다.** unit이 가짜 타이머로 논리를 보지만 실제 iOS 동작은 실기기다. [검증 방법](#검증-방법)의 수동 행이다
- **코드가 주소에 실린다.** [ATT-027](../../2-design/modules/attendance/README.md#att-027)의 구멍이 넓어지는 자리고 [규칙과 부딪힌 자리](../../2-design/modules/attendance/screens/check-in.md#규칙과-부딪힌-자리)가 근거를 적었다. [AC-04](#ac-04)가 인증 뒤 `c`를 지워 기록에 덜 남게 한다
- **위치 권한을 QR 길에서 안 묻는다.** 그래서 QR로 들어온 인증에는 좌표가 없다 — 함수가 `method = 'qr'`이면 거리를 안 보니 문제가 안 된다. 다만 「어디서 찍혔는지」가 남지 않는다. 문서가 그 값을 저장하지 않기로 이미 정했다
- 되돌리기는 브랜치 revert다. 데이터를 안 건드린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 모습을 잘못 가른다 | unit `src/screens/check-in/model/__tests__/`(예정) | `pnpm test` | 권한·좌표·`c`·결과 조합이 여섯으로 간다 |
| AC-03 | 100미터 경계에서 뒤집힌다 | unit 위 | `pnpm test` | 정확히 100미터는 안이다 |
| AC-04 | 인증 뒤 코드가 주소에 남는다 | unit 위 | `pnpm test` | `c`가 지워진다 |
| AC-04 | 틀린 코드에 실패 화면이 안 뜬다 | e2e `tests/e2e/check-in.spec.ts`(예정) | `pnpm e2e` | 「이 코드는 더 쓰지 않아요」 |
| AC-05 | 카운트가 멈춘 뒤 다시 센다 | unit 위 | `pnpm test` | 한 번 멈추면 끝이다 |
| AC-05 | 돌아간 뒤 뒤로가기가 인증 화면으로 온다 | e2e 위 | `pnpm e2e` | 히스토리가 바꿔치기됐다 |
| AC-06 | 재시도가 처음부터 다시 돈다 | unit 위 | `pnpm test` | 남은 대기를 이어 붙인다 |
| AC-06 | 이미 찍힌 것이 실패로 그려진다 | unit 위 | `pnpm test` | `already_done`이 「인증됐다」로 간다 |
| AC-07 | 시안과 화면이 어긋난다 | `sian-auditor` | — | 모습 여섯·문안·토큰·모션 일치 |

- 배정하지 않은 것: 실기기에서 화면을 잠갔다 돌아왔을 때 재시도가 이어 도는지, 지하에서 위치가 안 잡히는 실제 모습, 벽에 붙인 종이를 카메라로 찍어 앱이 열리는지, 축하가 저사양 기기에서 끊기는지 — 전부 실기기가 필요하다
- 막힌 것: NCP 대표 계정 지정과 지도 키·`customStyleId` 발급. **사람이 콘솔에서 해야 하고 이 task가 시작되기 전에 끝나 있어야 한다**

## 범위 밖

- `check_in` 함수와 재시도 dal — [`attendance-data`](attendance-data.md)
- 관리자 QR 화면과 인쇄용 그림 — [`attendance-qr`](attendance-qr.md)
- 사유 시트 — [`attendance-excuse`](attendance-excuse.md)
- 대시보드의 「출근 인증하기」 버튼과 띠 아래 한 줄 — [`dashboard`](../../backlog.md)
- 출근 직전 알림 — 알림 영역
- 홀 좌표를 고치는 화면 — 1차 밖
