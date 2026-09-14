# 근무표

짝은 [domain/schedule.md](../../domain/schedule.md)다. 키 넷이다. 무효화는 [`README.md`](README.md#무효화-표)에 있다.

- `['schedule', 'YYYY-MM']` — 한 달의 `days`·`slots`·`assignments`·`profiles(display_name)`를 한 임베딩으로 받는다([`../api/`](../api/#읽기)). 인증은 안 든다 — 달력이 출근 상태를 안 그린다. 달력·하루·명단의 배정이 전부 이 키에서 갈라 그린다
- `['availability', 'YYYY-MM']` — 본인 신청. 관리자의 신청 현황은 `['availability', 'YYYY-MM', 'all']`이다. `work_date`에 딸려 `days`에 임베딩할 수 없어 따로 읽는다
- `['requests']` — 살아 있는 요청과 닫힌 지 30일 안. 근무 요청·교대·근무 취소가 다 든다
- `['hall']` — 좌표·반경·자리 기본값

## 낙관적인 것

**근무 신청 체크만 즉시 칠한다.** 달력에서 날짜를 누르면 바로 표시되고 저장 버튼이 `submit_availability`를 한 번 보낸다. 실패하면 서버 값으로 되돌리고 토스트다. 마감이 지나 `window_closed`가 오면 달력을 잠근다.

배정 추가·제거·강제 변경·요청 수락·확정은 응답을 기다린다. 확정은 되돌릴 수 없고, 나머지는 남과 겹친다.

## 관리자 동시 편집

`stale`이 오면 「이 근무가 바뀌었어요」 시트를 닫지 않고 그 자리만 다시 읽는다 — 관리자가 고치던 나머지가 사라지지 않게. `add_assignment`가 `already_assigned`·`slot_full`을 던지면 같은 처리다. 잠금은 없다.

## 요청 수락 경쟁

`respond_request`가 `slot_full`·`request_closed`를 던지면 요청 카드를 「마감됨」으로 바꾸고 `['requests']`를 다시 읽는다. 카운트다운은 `expires_at`과 서버 오프셋으로 로컬 계산이고, 0이 되면 버튼이 잠긴다 — 서버의 `expire_requests` cron이 매 분 돌아 닫으니 몇십 초 어긋나면 `request_closed`가 잡는다.

## 달력 이동

달을 넘기면 다음 달 키를 읽는다. 앞뒤 한 달은 `prefetchQuery`로 미리 받는다 — 근무표 화면에서 넘기는 일이 잦다. 세 달 밖은 그때 읽는다.
