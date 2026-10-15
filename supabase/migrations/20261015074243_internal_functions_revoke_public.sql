-- `internal` 함수의 EXECUTE를 `PUBLIC`에서 걷는다(data-access.md 「함수 안의 규칙」).
--
-- 앞선 마이그레이션마다 붙은 `revoke all on all functions in schema internal from anon,
-- authenticated`는 헛돈다. 함수 EXECUTE는 만들 때 `PUBLIC`에 붙고, 두 역할은 `PUBLIC`을
-- 타고 그대로 들어온다. 지금 막는 것은 스키마 USAGE와 PostgREST 노출 목록뿐이다.
--
-- 걷어도 끊기는 길이 없다. `internal` 함수를 부르는 자리는 전부 `security definer`인
-- `public` 함수(소유자 `postgres`), `postgres`가 등록한 cron, `security definer` 함수만
-- 행을 넣는 `notifications`의 트리거다. 어느 쪽이든 실행 주체가 소유자 `postgres`다.
revoke execute on all functions in schema internal from public;

-- 앞으로 만들 함수도 막는다. 스키마를 지정한 `alter default privileges ... revoke`는
-- 효과가 없다 — 스키마별 기본 권한은 전역 기본값에 더해지기만 하고, `PUBLIC`의 EXECUTE는
-- 전역 기본값이 준다. 그래서 전역에서 걷고 `public` 스키마에만 되돌린다. `public`에 새로
-- 만드는 함수의 권한은 이 두 줄 전과 같고, `internal`과 앞으로 만들 스키마는 `PUBLIC`에
-- 안 열린다. 마이그레이션을 돌리는 역할과 상관없이 `postgres`가 만드는 함수에 걸리도록
-- `for role`을 적는다.
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public grant execute on functions to public;
