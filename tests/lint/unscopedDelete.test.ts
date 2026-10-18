import {
  repositoryUnscopedDeletes,
  unscopedDeletes,
} from "@tests/lint/unscopedDelete";

describe("테스트 코드는 자기 행만 지운다", () => {
  it("조건 없이 표 전체를 지우면 위반이다", () => {
    const source = `execSql("delete from public.default_wage_rates;\\n");`;

    expect(unscopedDeletes("a.test.ts", source)).toEqual([
      { file: "a.test.ts", line: 1, table: "public.default_wage_rates" },
    ]);
  });

  it("세미콜론 없이 문자열이 끝나도 위반이다", () => {
    const source = `execSql("delete from public.days\\n");`;

    expect(unscopedDeletes("a.test.ts", source)).toHaveLength(1);
  });

  it("where가 같은 줄에 있으면 위반이 아니다", () => {
    const source = `execSql("delete from public.days where id = :'id';\\n");`;

    expect(unscopedDeletes("a.test.ts", source)).toEqual([]);
  });

  it("where가 이어 붙은 다음 문자열에 있으면 위반이 아니다", () => {
    const source = `execSql(\n  "delete from public.days\\n" +\n    "where id = :'id';\\n",\n);`;

    expect(unscopedDeletes("a.test.ts", source)).toEqual([]);
  });

  it("using으로 이어지는 삭제는 위반이 아니다", () => {
    const source = `execSql("delete from public.days d using public.schedules s where s.id = d.schedule_id;");`;

    expect(unscopedDeletes("a.test.ts", source)).toEqual([]);
  });

  it("저장소의 src와 tests에 조건 없는 삭제가 없다", () => {
    expect(repositoryUnscopedDeletes()).toEqual([]);
  });
});
