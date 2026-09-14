# 출근 — 설계

짝은 [README.md](README.md)다. 출근의 데이터와 API와 실행 동작이 여기 산다.

## 참조 규칙

공통 스키마·권한·컬럼 규약은 [data-model/README.md](../../architecture/data-model/README.md), 읽기·쓰기·타입·에러 계약은 [api/README.md](../../architecture/api/README.md), 캐시 계층·무효화 표·시각은 [runtime/README.md](../../architecture/runtime/README.md)를 따른다.

키는 `['attendance', 'YYYY-MM-DD']`(그날 `check_ins`와 `excuse_status`)·`['excuses', 'YYYY-MM']`(본인 사유 목록)·`['hall', 'qr']`다. 명단은 이 키와 `['schedule', 그달]`의 배정을 합쳐 그린다. 무효화는 [runtime/README.md](../../architecture/runtime/README.md#무효화-표)에 있다.

## 소유 데이터

표는 `check_ins`·`excuses`·`hall_secrets` 셋과 뷰 `excuse_status` 하나다.

### 인증과 사유는 그날 그 사람에 붙인다

`check_ins(day_id, profile_id, checked_at, reported_at, received_at, method) unique(day_id, profile_id)`, `excuses(day_id, profile_id, body, submitted_at, decided_at, decision, decision_reason)`. `checked_at`은 판정에 쓴 시각, `reported_at`은 기기가 누른 시각이다 — 둘이 갈리는 이유는 [누른 시각이 판정이다](#누른-시각이-판정이다)에 있다. 배정이 아니다 — 9시 30분에 찍은 인증이 10시 강제 변경으로 사라지면 안 된다. 근무 시간이 날짜당 하나라 포지션이 바뀌어도 인증 창은 같다. 인증 함수가 「그날 살아 있는 배정이 있나」를 따로 검사한다. `received_at timestamptz`가 서버 수신 시각이고, 셋의 관계는 [누른 시각이 판정이다](#누른-시각이-판정이다)에 있다.

인증은 되돌릴 수 없다 — 행을 고치는 함수가 없다.

### 사유

거절되면 새 행이다. 판정은 `decided_at`·`decision`으로 남고 글(`body`)은 본인과 관리자만 읽는다. 명단이 그리는 「확인 중·인정·결근」은 판정 결과가 필요하니 `excuse_status` 뷰(`security_invoker`)가 글만 빼고 `(day_id, profile_id, decided_at, decision)`을 전원에게 낸다.

### 상태는 계산한다

출근·지각·안 찍음·확인 중·인정·결근 다섯은 저장하지 않는다. `features/attendance`의 순수 함수가 `check_ins`·`excuse_status`·`days.starts_at`·서버 시각으로 낸다. 결근은 시계가 지나면 저절로 되는 것이라 배치가 없다.

### QR

`hall_secrets(hall_id, qr_code, rotated_at)`. `halls`와 가른 이유는 읽기 범위다 — 좌표·반경은 전원이 읽지만 QR 값은 관리자만이다. 같은 행에 있으면 근무자가 값을 읽어 스캔 없이 인증 함수에 넣는다. 바꾸면 옛 값을 덮어 즉시 폐기된다.

## 행위별 구현 계약

### 출근 인증

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `check_in` | 근무자 | 출근 인증. 좌표 또는 QR 값과 `reported_at`(누른 시각)을 받는다. 거리 계산과 코드 대조는 함수가 한다 — 화면의 판정을 안 믿는다. 창 밖이면 `window_closed`, 반경 밖이면 `too_far`, 옛 코드면 `invalid_qr`, 그날 배정이 없으면 `not_allowed`, 이미 찍혀 있으면 `already_done` |

#### 누른 시각이 판정이다

`check_in`은 「인자로 시각을 받지 않는다」의 유일한 예외다. 홀 지하에서 눌렀는데 몇 분 뒤에야 서버에 닿는 일이 있어 지각을 `now()`로 가르면 억울하다. 함수는 `reported_at`으로 지각을 가르되 한도를 건다 — `now()`보다 10분 넘게 이르면 `now()`, `now()`보다 늦어도 `now()`다. 기기가 보내는 값이라 고칠 수 있는데 한도가 그 폭을 10분으로 막는다. 판정에 쓴 시각이 `checked_at`, 기기가 보낸 원값이 `reported_at`이다. 재시도 규칙은 [인증은 화면이 열린 동안 다시 시도한다](#인증은-화면이-열린-동안-다시-시도한다)에 있다.

`already_done`은 검사에서 잡거나, 검사 사이에 낀 unique 위반(23505)을 함수가 잡아 같은 코드로 던진다. 재시도가 두 번 닿아도 화면은 한 번 성공이다.

#### 인증은 화면이 열린 동안 다시 시도한다

**쓰기를 재시도하지 않는 규칙의 유일한 예외다.** 홀 지하가 통신이 약하다. `check_in`이 `TransportError`면 지수 백오프로 다섯 번 더 보낸다 — 2초·4초·8초·16초·32초, 합쳐 1분쯤이다(`retryDelay` 명시). 화면은 「인증을 보내는 중」을 보인다. 화면을 잠그거나 앱을 전환하면 iOS가 타이머를 멈추고 돌아올 때 이어 돈다 — 끊지 않는다. 다섯 번 다 실패하면 「인증을 못 보냈어요. 통신이 되는 곳에서 다시 눌러주세요」다. 큐에 넣지 않는다.

**판정은 누른 시각이다.** 화면이 `reported_at`(`Date.now() + 오프셋`)을 보내고 함수가 그 값으로 지각을 가른다 — 지하에서 09:58에 눌렀는데 10:04에 닿아도 정시다. 「인자로 시각을 받지 않는다」([api/README.md](../../architecture/api/README.md#서버-시각))의 유일한 예외라 한도가 붙는다. `reported_at`이 `now()`보다 10분 넘게 이르면 `now()`로 판정하고, `now()`보다 늦으면 `now()`다. 기기에서 보내는 값이라 고쳐 보낼 수 있는데, 한도가 그 폭을 10분으로 막는다. 10분은 재시도 1분과 화면 잠금 뒤 재개를 덮는다. 저장은 셋이다 — `checked_at`이 판정에 쓴 시각, `reported_at`이 기기가 보낸 원값, `received_at`이 서버에 닿은 시각(`now()`). `received_at`과 `reported_at`이 5분 넘게 다르면 명단이 「통신 지연」을 표시한다 — 기준은 [ATT-017](README.md#att-017)이다.

**재시도가 두 번 닿으면 `already_done`이다.** 첫 요청이 갔는데 응답만 못 받은 경우 두 번째가 `(day_id, profile_id)` unique에 걸린다. 함수가 검사로 잡거나, 검사 사이에 끼어 unique 위반(23505)이 나면 그것도 함수가 잡아 `already_done`으로 던진다. 화면은 성공으로 처리한다.

### 사유 제출과 판정

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `submit_excuse` | 근무자 | 사유 제출. 근무 끝 48시간 지나면 `window_closed` |
| `decide_excuse` | 관리자 | 사유 판정. 시한 없음 |

`submit_excuse`·`decide_excuse`는 응답을 기다린다.

### 홀 좌표와 반경

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `set_hall_location` | 관리자 | 좌표·반경 |

### QR 바꾸기

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `rotate_qr` | 관리자 | QR 바꾸기. 옛 코드 즉시 폐기 |

QR 값은 `['hall', 'qr']`로 읽고 `staleTime`이 0, 영속하지 않는다 — 관리자가 돌리면 옛 값이 `invalid_qr`이다. 위치는 `navigator.geolocation`을 인증 버튼을 누른 순간 한 번 받는다. 권한이 없으면 버튼 대신 안내다.

### 행위 밖의 실행 동작

명단의 상태는 `check_ins`와 `excuse_status` 뷰를 읽어 화면이 계산한다. `excuses` 표 자체는 본인과 관리자만 — 글이 있어서다.

그날 명단은 배정과 인증을 합쳐 상태를 계산한다 — 출근·지각·미출근이 저장된 것이 아니다. 하루 띠는 `days`의 시간과 서버 오프셋으로 로컬 계산이고, 매 분 다시 계산한다.

## UI 연결

화면은 [qr](screens/qr.md)과 [dashboard](../../system/screens/dashboard.md)·[approvals](../../system/screens/approvals.md)다.
