# 출근

짝은 [domain/attendance.md](../../domain/attendance.md)와 [`../data-model/attendance.md`](../data-model/attendance.md)다.

## 함수

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `check_in` | 근무자 | 출근 인증. 좌표 또는 QR 값과 `reported_at`(누른 시각)을 받는다. 거리 계산과 코드 대조는 함수가 한다 — 화면의 판정을 안 믿는다. 창 밖이면 `window_closed`, 반경 밖이면 `too_far`, 옛 코드면 `invalid_qr`, 그날 배정이 없으면 `not_allowed`, 이미 찍혀 있으면 `already_done` |
| `submit_excuse` | 근무자 | 사유 제출. 근무 끝 48시간 지나면 `window_closed` |
| `decide_excuse` | 관리자 | 사유 판정. 시한 없음 |
| `set_hall_location` | 관리자 | 좌표·반경 |
| `rotate_qr` | 관리자 | QR 바꾸기. 옛 코드 즉시 폐기 |

## 누른 시각이 판정이다

`check_in`은 「인자로 시각을 받지 않는다」의 유일한 예외다. 홀 지하에서 눌렀는데 몇 분 뒤에야 서버에 닿는 일이 있어 지각을 `now()`로 가르면 억울하다. 함수는 `reported_at`으로 지각을 가르되 한도를 건다 — `now()`보다 10분 넘게 이르면 `now()`, `now()`보다 늦어도 `now()`다. 기기가 보내는 값이라 고칠 수 있는데 한도가 그 폭을 10분으로 막는다. 판정에 쓴 시각이 `checked_at`, 기기가 보낸 원값이 `reported_at`이다. 재시도 규칙은 [`../runtime/attendance.md`](../runtime/attendance.md)에 있다.

`already_done`은 검사에서 잡거나, 검사 사이에 낀 unique 위반(23505)을 함수가 잡아 같은 코드로 던진다. 재시도가 두 번 닿아도 화면은 한 번 성공이다.

## 읽기

명단의 상태는 `check_ins`와 `excuse_status` 뷰를 읽어 화면이 계산한다. `excuses` 표 자체는 본인과 관리자만 — 글이 있어서다.
