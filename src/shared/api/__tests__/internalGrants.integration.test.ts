import { queryColumn } from "@tests/integration/postgres";

const INTERNAL_FUNCTIONS =
  "select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'internal'";

function internalFunctionsWhere(condition: string): string[] {
  return queryColumn(`${INTERNAL_FUNCTIONS} and ${condition};\n`);
}

describe("internal 스키마 함수는 로그인 여부와 상관없이 부를 수 없다", () => {
  it("internal 스키마에 함수가 하나 이상 있다", () => {
    expect(queryColumn(`${INTERNAL_FUNCTIONS};\n`).length).toBeGreaterThan(0);
  });

  it("anon 역할은 어떤 internal 함수도 실행할 수 없다", () => {
    expect(
      internalFunctionsWhere(
        "has_function_privilege('anon', p.oid, 'EXECUTE')",
      ),
    ).toEqual([]);
  });

  it("authenticated 역할은 어떤 internal 함수도 실행할 수 없다", () => {
    expect(
      internalFunctionsWhere(
        "has_function_privilege('authenticated', p.oid, 'EXECUTE')",
      ),
    ).toEqual([]);
  });

  it("PUBLIC에 실행 권한이 붙은 internal 함수가 없다", () => {
    expect(
      internalFunctionsWhere(
        "(p.proacl is null or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'))",
      ),
    ).toEqual([]);
  });
});
