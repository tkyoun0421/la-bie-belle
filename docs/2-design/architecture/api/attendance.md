# 출근

짝은 [domain/attendance.md](../../domain/attendance.md)와 [`../data-model/attendance.md`](../data-model/attendance.md)다.

## 함수

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `check_in` | 근무자 | 출근 인증. 좌표 또는 QR 값을 받는다. 거리 계산과 코드 대조는 함수가 한다 — 화면의 판정을 안 믿는다. 창 밖이면 `window_closed`, 반경 밖이면 `too_far`, 옛 코드면 `invalid_qr`, 그날 배정이 없으면 `not_allowed` |
| `submit_excuse` | 근무자 | 사유 제출. 근무 끝 48시간 지나면 `window_closed` |
| `decide_excuse` | 관리자 | 사유 판정. 시한 없음 |
| `set_hall_location` | 관리자 | 좌표·반경 |
| `rotate_qr` | 관리자 | QR 바꾸기. 옛 코드 즉시 폐기 |

## 읽기

명단의 상태는 `check_ins`와 `excuse_status` 뷰를 읽어 화면이 계산한다. `excuses` 표 자체는 본인과 관리자만 — 글이 있어서다.
