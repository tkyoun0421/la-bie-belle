---
status: open
target: ADR-003 service role 조항 · tests/integration
date: 2026-09-14
resolved:
---

# integration 테스트가 만든 사용자를 못 치운다

## 일

integration 테스트가 로컬 Supabase에 사용자를 만들고 안 지운다. anon 키로는 `auth.users`를 못 지우고, 프로필 행 삭제는 테스트가 지키는 바로 그 RLS에 걸린다. 지우려면 service role이 필요한데 ADR-003이 관리자 배치 작업으로 좁혀 금지했다. `supabase/config.toml`이 가입을 IP당 5분에 서른 번으로 막는데 e2e도 사용자를 만드니, 계정 task를 여러 회차 돌리면 한도에 닿는다.

## 고침

테스트 헬퍼가 로컬 postgres에 직결해 지우는 길이 있다 — `login-screens.md` plan이 승인 시각을 채울 때 같은 길을 택했고 ADR-003 경계 밖이라고 적었다. 그 헬퍼에 삭제를 더하거나, ADR-003에 「로컬 테스트 DB 직결은 service role이 아니다」를 명시한다.

## 원칙

금지 조항과 테스트 위생이 부딪히면 조항에 예외를 적지 말고 경계 밖의 길이 있는지 먼저 본다.
