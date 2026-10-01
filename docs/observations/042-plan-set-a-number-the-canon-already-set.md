---
status: open
target: .claude/agents/test-planner.md
date: 2026-10-01
resolved:
---

# plan이 정본과 다른 숫자를 박고 테스트가 그 숫자를 따라 썼다

## 일

`attendance-checkin` plan을 쓰려 `check_in` 함수를 열었더니 기기가 보낸 시각의 한도가 **10분**이었다.

```sql
resolved_checked_at := p_reported_at;
if p_reported_at < p_now - interval '10 minutes' or p_reported_at > p_now then
  resolved_checked_at := p_now;
end if;
```

정본은 2시간이라 적는다. [ATT-029](../2-design/modules/attendance/README.md#att-029)가 「누른 시각에서 2시간 넘어 닿은 인증은 받지 않는다」고, 그 이유 줄이 「기기 시각은 고칠 수 있는 값이라 상한이 필요하고, 2시간이면 지하에서 한 타임 일하고 올라오는 것을 덮되 이틀 뒤 켠 폰이 그날 출근을 만들지는 못한다」고 적는다. [spec AC-07](../2-design/spec/attendance-checkin.md)과 [design.md](../2-design/modules/attendance/design.md)도 2시간과 `too_late`를 든다.

`too_late`는 저장소에 아예 없다 — 함수도 안 던지고 `src/shared/api/error-codes.ts`에도 없다. 2시간을 넘긴 인증이 거부되는 자리가 코드에 서지 않았다.

`attendance-data` plan은 10분을 제 판정으로 적었고 그 근거까지 달았다 — 「10분은 재시도 1분과 화면 잠금 뒤 재개를 덮는 폭」, 「지각 유예 10분과 `checked_at` 한도 10분은 다른 상수다」. 그러고는 integration 테스트가 그 plan을 따라 「10분 넘게 이른 값을 보내면 `now()`로 눌린다」를 단언한다. 정본과 코드가 어긋난 자리에 **그 어긋남을 지키는 테스트가 섰다.**

## 값

10분과 2시간이 다른 축이라는 plan의 설명은 그 자리에서는 그럴듯하다. 하지만 둘을 같이 세우면 ATT-029가 허용한 2시간이 뜻을 잃는다 — 지하에서 09:00에 눌러 11:00에 올라온 인증은 받아들여지지만 `checked_at`이 11:00으로 눌려 지각이 된다. 2시간을 허용한 이유가 「한 타임 일하고 올라오는 것을 덮는다」인데 덮은 뒤 지각으로 적으면 덮지 않은 것과 같다.

더 나쁜 것은 검사가 하나도 안 울렸다는 것이다. 숫자가 plan에 적혀 있었고 테스트가 plan을 보고 쓰였으니 `pnpm test`는 영원히 초록이다. 이 어긋남은 다음 task가 같은 함수를 열어야 비로소 보인다 — 실제로 그렇게 보였다.

## 제안

`test-planner`가 plan에 든 숫자를 받을 때 **그 숫자가 정본에 있는 숫자인지, plan이 새로 정한 숫자인지** 갈라 보고하게 한다. 지금 정의문은 「정본 모순」을 명시로 요구하는데(관찰 032가 연 자리) 그 요구가 **문서끼리의 모순**을 겨눈다. 여기서 모순은 문서와 코드 사이에 있었고, 그 코드를 만든 것은 앞선 plan이다.

같은 target에 관찰 020·037·039가 이미 쌓여 `test-planner-ground-truth` candidate가 서 있다. 이것이 넷째고, 축은 다르다 — 앞 셋은 「정본을 못 찾았다」고 이것은 「정본 대신 plan을 믿었다」다.

## 원칙

plan이 제 판정으로 박은 숫자는 정본이 아니다. 그 숫자를 지키는 테스트가 서면 어긋남이 초록 뒤에 숨는다.
