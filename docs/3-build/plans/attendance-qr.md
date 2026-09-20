---
sources:
  - ../../2-design/modules/attendance/screens/qr.md#목적과-진입
  - ../../2-design/modules/attendance/screens/qr.md#화면-상태와-흐름
  - ../../2-design/modules/attendance/screens/qr.md#qr-짜임
  - ../../2-design/modules/attendance/screens/qr.md#qr-그림
  - ../../2-design/modules/attendance/screens/qr.md#내보내기
  - ../../2-design/modules/attendance/screens/qr.md#크게-띄우기
  - ../../2-design/modules/attendance/screens/qr.md#새로-뽑기
  - ../../2-design/modules/attendance/screens/qr.md#새로-뽑기-확인
  - ../../2-design/modules/attendance/screens/qr.md#뽑은-뒤
  - ../../2-design/modules/attendance/screens/qr.md#qr-색
  - ../../2-design/modules/attendance/screens/qr.md#qr-글자
  - ../../2-design/modules/attendance/screens/qr.md#qr-여백과-모양
  - ../../2-design/modules/attendance/screens/qr.md#qr-문안
  - ../../2-design/modules/attendance/screens/qr.md#qr-모션
  - ../../2-design/modules/attendance/screens/qr.md#규칙과-부딪힌-자리
  - ../../2-design/modules/attendance/design.md#qr-바꾸기
  - ../../2-design/modules/attendance/design.md#인쇄용-종이-내보내기
  - ../../2-design/modules/attendance/README.md#att-005
  - ../../2-design/modules/attendance/README.md#att-006
  - ../../2-design/modules/attendance/README.md#att-027
  - ../../2-design/system/navigation.md#경로
  - ../../2-design/design-system/components.md#button
  - ../../2-design/design-system/components.md#dialog와-바텀시트
  - ../../2-design/design-system/components.md#앱바
  - ../../2-design/design-system/components.md#토스트
---

# 관리자 QR 화면을 만든다 — 구현 계획

## 입력 명세·기준

정본은 [qr.md](../../2-design/modules/attendance/screens/qr.md)와 짝 시안 `qr.sian.html`이다. 둘이 어긋나면 문서가 이긴다. 행위 계약은 [design.md](../../2-design/modules/attendance/design.md#qr-바꾸기)와 [인쇄용 그림 내려받기](../../2-design/modules/attendance/design.md#인쇄용-종이-내보내기)고, 업무 규칙은 [ATT-005](../../2-design/modules/attendance/README.md#att-005)·[ATT-006](../../2-design/modules/attendance/README.md#att-006)·[ATT-027](../../2-design/modules/attendance/README.md#att-027)이다.

`/admin/qr` 하나와 그 안의 상태 다섯이 산출이다. 선행은 [`attendance-data`](attendance-data.md) — `hall_secrets`와 `rotate_qr`과 `['hall', 'qr']` dal이 거기서 온다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **그림 둘이 다르다.** 화면의 QR과 내려받는 인쇄용 그림은 같은 코드를 담지만 다른 그림이다. 인쇄용은 A4 비율(2480×3508픽셀)에 제목과 안내 한 줄과 자르는 선이 같이 박힌다([내보내기](../../2-design/modules/attendance/screens/qr.md#내보내기)). **화면 QR을 그대로 저장하는 것이 아니다**
- **서버가 파일을 안 만든다.** 브라우저가 canvas로 그려 내려준다([인쇄용 그림 내려받기](../../2-design/modules/attendance/design.md#인쇄용-종이-내보내기)) — 서버에 파일을 두면 `rotate_qr`이 도는 순간 낡은 그림이 남는다
- **QR 면이 팔레트 밖이다.** 화면 QR도 인쇄용 그림도 항상 흰 면에 검은 코드다([QR 그림](../../2-design/modules/attendance/screens/qr.md#qr-그림)). 다크에서 반전하면 카메라가 못 읽는 기기가 있다. 이 화면에서 **테마를 안 따르는 자리가 넷이다** — QR 면, 크게 띄우기 바탕, 크게 띄우기 닫기 아이콘, 인쇄용 그림 전체
- **캐시가 짧다.** `['hall', 'qr']`은 `staleTime`이 0이고 영속하지 않는다. 관리자가 두 기기로 열어둔 채 한쪽에서 돌리면 다른 쪽의 옛 값은 이미 죽은 코드다

지금 코드에는 `/admin` 아래 화면이 하나도 없다. 앱바·Button·Dialog·토스트는 [`design-system-base`](../../backlog.md)가 세운 shadcn/ui 조각을 쓴다.

## 완료 조건

### AC-01

**경로와 문.** `/admin/qr`이 [navigation.md](../../2-design/system/navigation.md#경로)의 조건대로 선다 — 관리자만이다. 들어오는 문은 관리자 홈의 「QR」 줄이고 그 줄은 [`schedule-admin`](schedule-admin.md)이 이미 세웠다. 앱바 뒤로는 관리자 홈으로 간다.

### AC-02

**정상 상태.** 세로로 앱바 → QR 그림 → 쓰기 시작한 날 → 버튼 셋이다.

- QR 그림은 화면 폭에서 좌우 여백(`px-6`)을 뺀 정사각, `rounded-xl`, 테두리 `stroke.surface`, 안쪽 여백 `p-6`. **면은 흰색 고정**이다
- 쓰기 시작한 날은 `hall_secrets.rotated_at`에서 온다. 문구는 「2026년 3월 2일부터 쓰고 있어요」 — **연도가 붙는다**. `tabular-nums`
- 버튼 셋을 세로로 쌓는다. [BottomCTA](../../2-design/design-system/components.md#bottomcta)를 안 쓴다. 내려받기·크게 띄우기는 Button secondary, 새로 뽑기는 Button outline
- 간격은 [QR 여백과 모양](../../2-design/modules/attendance/screens/qr.md#qr-여백과-모양) 표 그대로다 — 새로 뽑기 위가 `mt-6`으로 혼자 넓다
- **primary 버튼이 없다.** 이 화면에 브랜드 색이 없다
- 등장 모션이 없다

### AC-03

**QR 그림을 그린다.** 라이브러리로 `qr_code` 문자열을 QR로 만든다.

- 의존을 하나 더한다. `qrcode` 계열 중 **canvas와 data URL 둘 다 내는 것**을 고른다 — 화면은 SVG·canvas 어느 쪽이어도 되지만 인쇄용 그림이 canvas에 그려 넣을 QR을 필요로 한다
- 오류 정정 수준은 M 이상이다. 인쇄된 종이가 긁히거나 젖어도 읽혀야 한다
- **여백(quiet zone)을 코드 자체에 넣지 않는다** — 화면은 `p-6`이, 인쇄용 그림은 QR 둘레의 흰 여백이 그 몫이다. 둘 다 넣으면 코드가 작아진다

### AC-04

**인쇄용 그림 내려받기.** [내보내기](../../2-design/modules/attendance/screens/qr.md#내보내기)의 표가 값의 정본이다.

- 2480×3508 canvas를 만든다. 바탕 흰색, 글자 검정
- 자르는 선 — 점선, 가장자리에서 **178픽셀** 안쪽, 굵기 **3픽셀**, 색은 팔레트 `neutral-300`의 **라이트 값**
- QR — 가운데, 자르는 선 안쪽 폭의 **60%**(약 1250픽셀). 둘레에 흰 여백이 있다
- 제목 「출근 인증」이 QR 위, 안내 「스마트폰 카메라로 찍어 출근을 인증하세요」가 QR 아래 한 줄
- **시안의 픽셀 값을 쓰지 않는다.** 시안은 300픽셀 폭으로 줄여 그린 것이라 그 안의 `1.5px`는 파일의 3픽셀이 아니다. 구현이 따르는 것은 문서의 표다
- canvas를 PNG blob으로 뽑아 내려받는다. 파일 이름에 날짜가 든다
- **글꼴이 문제다.** canvas의 `fillText`는 그 시점에 로드된 글꼴만 쓴다. 웹폰트가 아직 안 왔으면 다른 글꼴로 그려져 종이에 남는다 — **`document.fonts.ready`를 기다린 뒤에 그린다**

### AC-05

**저장이 안 열림.** 내려받기가 브라우저에 막히는 자리를 덮는다.

- 같은 그림을 **새 탭에 띄우고** 토스트가 「그림을 길게 눌러 저장하세요」를 말한다
- **실패를 말하는 문장을 앞에 안 붙인다.** 화면이 이미 다음 수를 열었으니 막힌 것이 아니라 다른 길이다
- 「크게 띄우기」로 안 보낸다 — 그쪽은 화면 크기의 QR이라 안내와 자르는 선이 안 따라온다
- 새 탭이 팝업 차단에 막히는 자리가 또 있다. 그때는 blob URL을 같은 탭에서 연다 — **화면이 사라지는 것이 아니라 뒤로가기로 돌아온다**
- 아이폰 사파리에서 홈 화면 앱으로 열면 파일이 사진첩으로 간다. 앱이 하는 일이 없다

### AC-06

**크게 띄우기.** 화면 전체가 QR이 된다.

- 흰 바탕, 가운데 QR(화면 폭에서 좌우 48px을 남긴 크기), 오른쪽 위 닫기. **앱바가 없다** — 이 앱에서 앱바 없는 화면이 처음 서는 자리다
- 닫기는 검은 아이콘이고 접근성 라벨이 「닫기」다. 닿는 면이 44px이다
- **화면 잠금을 막는다.** Screen Wake Lock으로 건다. 모드를 나가면 푼다. **탭이 숨었다 돌아오면 다시 건다** — 브라우저가 `visibilitychange`에서 잠금을 놓는다
  - 지원 안 하는 브라우저면 **아무 말 없이 건너뛴다.** 화면이 꺼지는 것이 이 화면의 실패가 아니다
- **밝기를 앱이 안 올린다**
- 들어오고 나갈 때 `--duration-base`로 흰 면이 차오르고 걷힌다
- 하드웨어 뒤로가기로 나가진다 — 새 경로가 아니라 이 화면의 상태라, 히스토리 항목을 하나 쌓아 뒤로가기가 목록으로 안 빠지게 한다

### AC-07

**새로 뽑기.** [Dialog](../../2-design/design-system/components.md#dialog와-바텀시트)가 화면 가운데 선다.

- 제목 「QR을 새로 뽑을까요?」, 본문 「지금 QR이 바로 끝나요. 홀에 붙여둔 종이도 갈아야 해요」, 왼쪽 「닫기」, 오른쪽 「새로 뽑기」
- **오른쪽 버튼이 destructive가 아니다.** 파괴가 아니라 새 코드를 뽑는 것이다
- 확인하면 `rotate_qr`을 부른다. 끝나면 QR 그림이 새 코드로 바뀌고 날짜가 오늘이 되고 토스트 「QR을 새로 뽑았어요」가 뜬다
- **갈아 끼우는 모션이 없다.** 옛 코드와 새 코드가 화면에서 섞이는 순간을 안 만든다
- 실패하면 Dialog가 닫히지 않고 그 자리에서 다시 누를 수 있다. **낙관적 갱신을 안 한다** — 안 바뀐 코드를 바뀐 것으로 그리면 관리자가 그 화면을 찍어 인쇄한다
- 근무자에게 알림이 안 간다

### AC-08

**시안 대조.** 구현이 끝나면 `sian-auditor`가 `/admin/qr`과 `qr.sian.html`을 대조한다. 토큰 이름·문안·상태 다섯·모션이 문서와 같아야 한다.

### AC-09

**테스트.**

- unit: 인쇄용 그림의 좌표 계산(2480×3508에서 자르는 선 inset·QR 크기·제목과 안내의 기준선)을 순수 함수로 빼 값을 본다 — **canvas를 그리지 않고 숫자만 본다**. 날짜 문구 포맷(연도 포함·`tabular-nums` 대상). 내려받기 실패 경로가 새 탭으로 갈리는 분기
- e2e: 관리자로 `/admin/qr`에 들어가 QR과 날짜와 버튼 셋이 보인다. 크게 띄우기가 열리고 앱바 없이 닫기로 닫힌다. 새로 뽑기 Dialog가 서고 닫기로 닫힌다. 확인하면 날짜가 오늘이 되고 토스트가 뜬다. **근무자로는 `/admin/qr`에 못 들어간다**
- **e2e가 파일 내려받기를 안 본다.** Playwright가 파일을 받을 수는 있지만 받은 PNG의 내용을 검증하는 비용이 크다. 좌표는 unit이 보고 실제 종이는 손으로 본다

### AC-10

**검증.** `pnpm lint`·`pnpm format:check`·`pnpm typecheck`·`pnpm test`·`pnpm e2e` 초록.

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/app/admin/qr/page.tsx` | 경로와 역할 문 | AC-01 |
| `src/screens/admin-qr/` | 상태 다섯의 조립 | AC-02·AC-05~AC-07 |
| `src/features/attendance/qr-poster/*.ts`·`__tests__/` | 인쇄용 그림 좌표와 canvas 그리기 | AC-04·AC-09 |
| `src/features/attendance/qr-poster/*.tsx` | 내려받기·새 탭 갈림 | AC-05 |
| `src/shared/ui/` | 필요하면 전체 화면 껍데기 | AC-06 |
| `package.json` | QR 라이브러리 | AC-03 |
| `tests/e2e/admin-qr.spec.ts` | 관리자 흐름 | AC-09 |

## 구현 순서

`test-planner` → `unit-test-writer`·`e2e-test-writer` → `implementer` → `sian-auditor` → `pr-diff`.

1. QR 라이브러리를 고른다. **`web-researcher`에게 canvas 출력과 번들 크기와 최근 유지 상태를 확인시킨다** — 고르고 나면 인쇄용 그림의 모양이 그것에 묶인다
2. `test-planner`가 AC-01~AC-08을 층에 배정한다
3. `unit-test-writer`가 좌표 함수를 먼저 쓴다. 숫자가 틀리면 종이가 틀린다
4. `e2e-test-writer`가 관리자 흐름을 쓴다
5. `implementer`가 정상 → 크게 띄우기 → 새로 뽑기 → 인쇄용 그림 순으로 만든다. **인쇄용 그림이 마지막이다** — 가장 크고 화면 없이도 확인이 되는 부분이다
6. `sian-auditor`가 대조한다
7. **손으로 A4에 한 장 뽑아 본다.** 자르는 선이 인쇄에서 안 잘리는지, 그 선대로 잘라 붙일 만한지, QR이 카메라에 읽히는지다. 이것은 기계가 못 보는 자리라 [검증 방법](#검증-방법)의 수동 행이다

## 리스크·전환·되돌리기

- **실제 종이가 검증의 끝이다.** 178픽셀·3픽셀·60%는 문서가 정한 값이지만 프린터가 삼키는 가장자리는 기계마다 다르다. 첫 인쇄에서 선이 잘리면 **문서의 표를 고치고 시안을 따라 고친다** — 구현에서 값을 슬쩍 바꾸지 않는다
- **글꼴이 안 온 채로 그려질 수 있다.** [AC-04](#ac-04)가 `document.fonts.ready`를 걸었지만 그 약속이 안 지켜지는 브라우저가 있다. 대체 글꼴로 그려져도 QR은 읽히니 종이가 못 쓰게 되지는 않는다
- **Wake Lock이 없는 브라우저가 있다.** 조용히 건너뛴다고 정했다. 관리자가 화면이 꺼진다고 느끼는 것이 유일한 증상이다
- **새 탭 경로를 손으로만 본다.** 브라우저가 내려받기를 막는 조건을 테스트가 만들기 어렵다. 실기기 확인이 [검증 방법](#검증-방법)에 든다
- **QR 값이 화면에 그림으로만 선다.** 문자열을 텍스트로 안 보여준다 — 관리자가 복사해 어딘가에 붙이면 [ATT-027](../../2-design/modules/attendance/README.md#att-027)의 구멍이 넓어진다
- 되돌리기는 브랜치 revert다. 데이터를 안 건드린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 근무자가 관리자 화면을 연다 | e2e `tests/e2e/admin-qr.spec.ts`(예정) | `pnpm e2e` | 근무자는 못 들어간다 |
| AC-02 | 날짜에 연도가 빠진다 | unit `src/features/attendance/qr-poster/__tests__/`(예정) | `pnpm test` | 「2026년 3월 2일부터 쓰고 있어요」 |
| AC-04 | 종이의 선 위치와 QR 크기가 틀린다 | unit 위 | `pnpm test` | inset 178, 굵기 3, QR이 안쪽 폭의 60% |
| AC-05 | 내려받기가 막히면 아무 일도 안 일어난다 | unit 위 | `pnpm test` | 새 탭 경로로 갈리고 토스트 문구가 맞다 |
| AC-06 | 크게 띄우기에서 못 나간다 | e2e 위 | `pnpm e2e` | 닫기로 정상으로 돌아온다 |
| AC-07 | 실패했는데 새 코드로 그려진다 | e2e 위 | `pnpm e2e` | 성공해야 날짜가 오늘이 된다 |
| AC-08 | 시안과 화면이 어긋난다 | `sian-auditor` | — | 문안·토큰·상태·모션 일치 |

- 배정하지 않은 것: A4 실제 인쇄 확인(자르는 선이 인쇄에서 살아 있는지, 잘라 붙일 만한지, 그 종이의 QR이 카메라에 읽히는지), 아이폰 사파리 홈 화면 앱에서 사진첩으로 가는지, Wake Lock이 없는 브라우저에서 화면이 꺼지는지 — 전부 실기기와 실제 프린터가 필요하다
- 막힌 것: 지금은 없다

## 범위 밖

- QR을 찍는 화면 — [`attendance-checkin`](../../backlog.md)
- 홀 좌표·반경 화면 — 1차 밖이다([안 담은 것](../../2-design/modules/attendance/screens/qr.md#안-담은-것))
- 옛 코드로 찍은 기록을 세는 것 — 안 담기로 정했다
- `rotate_qr`과 `hall_secrets` — [`attendance-data`](attendance-data.md)
- 관리자 홈의 「QR」 줄 — [`schedule-admin`](schedule-admin.md)
- 교체 주기 재촉 — 주기가 규칙으로 서면 그때다
