---
status: open
target: ADR-003 service role 조항 · tests/integration
date: 2026-09-14
resolved:
---

# integration 테스트가 만든 사용자를 못 치운다

## 일

integration 테스트가 로컬 Supabase에 사용자를 만들고 안 지운다. anon 키로는 `auth.users`를 못 지우고, 프로필 행 삭제는 테스트가 지키는 바로 그 RLS에 걸린다. 지우려면 service role이 필요한데 ADR-003이 관리자 배치 작업으로 좁혀 금지했다. `supabase/config.toml`이 가입을 IP당 5분에 서른 번으로 막는데 e2e도 사용자를 만드니, 계정 task를 여러 회차 돌리면 한도에 닿는다.

## 쌓인 행이 **거짓 실패**를 만든다

`dto-to-domain-shape`의 검증으로 integration 전체를 돌리니 613건 중 하나가 빨갰다. `getWageRates`의 「한 사람의 이력이 날짜로 안 잘리고 전부 온다」가 세 행을 심고 하나만 받았다.

원인은 바뀐 코드가 아니었다. 그때 DB에 `profiles` 1710행, `wage_rates` 2044행(사람 1220명)이 쌓여 있었고 `supabase/config.toml`의 `max_rows = 1000`이 PostgREST의 응답을 자른다. 질의는 `order("effective_date", desc)`만 걸어 limit이 없는데, 상한이 **전체 결과**에 걸려 상위 천 행만 오고 그 안에 그 사람의 가장 늦은 날 하나만 들었다. `supabase db reset` 뒤 같은 테스트가 4/4 통과했다.

**앞선 기록은 반대 방향이었다** — backlog의 `test-data-isolation`이 「남은 행이 실패를 **가리기도** 한다」를 적었다(`open_day` 테스트가 행 존재만 단언해 거짓 초록이 났다). 쌓인 행이 거짓 초록과 거짓 빨강을 다 만든다.

**재실행 횟수가 임계를 넘으면 터진다.** 이 자리는 한 사람당 세 행을 심고 전수를 읽는 질의라, `wage_rates`가 천 행을 넘는 순간부터 반드시 빨개진다. 로컬에서 몇 회차를 돈 기계에서만 나고 CI는 깨끗한 DB라 안 난다 — 반대로 읽히는 함정이다.

## 고침

테스트 헬퍼가 로컬 postgres에 직결해 지우는 길이 있다 — `login-screens.md` plan이 승인 시각을 채울 때 같은 길을 택했고 ADR-003 경계 밖이라고 적었다. 그 헬퍼에 삭제를 더하거나, ADR-003에 「로컬 테스트 DB 직결은 service role이 아니다」를 명시한다.

## 원칙

금지 조항과 테스트 위생이 부딪히면 조항에 예외를 적지 말고 경계 밖의 길이 있는지 먼저 본다.
