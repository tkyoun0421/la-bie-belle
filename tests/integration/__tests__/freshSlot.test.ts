import {
  daysInMonth,
  firstFree,
  monthWindow,
  rowsInWindowSql,
  yearWindow,
} from "@tests/integration/freshSlot";

describe("monthWindow", () => {
  it("그 달 1일부터 다음 달 1일 전까지다", () => {
    expect(monthWindow("2031-04-01", false)).toEqual({
      from: "2031-04-01",
      to: "2031-05-01",
    });
  });

  it("앞뒤 달까지 보면 전달 1일부터 다다음 달 1일 전까지다", () => {
    expect(monthWindow("2031-04-01", true)).toEqual({
      from: "2031-03-01",
      to: "2031-06-01",
    });
  });

  it("해가 넘어가는 달도 연도를 같이 넘긴다", () => {
    expect(monthWindow("2031-12-01", false)).toEqual({
      from: "2031-12-01",
      to: "2032-01-01",
    });
    expect(monthWindow("2032-01-01", true)).toEqual({
      from: "2031-12-01",
      to: "2032-03-01",
    });
  });

  it("1일이 아닌 날짜는 달로 받지 않는다", () => {
    expect(() => monthWindow("2031-04-15", false)).toThrow();
  });
});

describe("yearWindow", () => {
  it("그 해 1월 1일부터 다음 해 1월 1일 전까지다", () => {
    expect(yearWindow(2731)).toEqual({ from: "2731-01-01", to: "2732-01-01" });
  });
});

describe("daysInMonth", () => {
  it("그 달의 날 수를 센다", () => {
    expect(daysInMonth("2031-01-01")).toBe(31);
    expect(daysInMonth("2031-04-01")).toBe(30);
    expect(daysInMonth("2031-02-01")).toBe(28);
    expect(daysInMonth("2032-02-01")).toBe(29);
  });
});

describe("firstFree", () => {
  it("비었다고 판정된 첫 후보를 돌려준다", () => {
    const draws = [3, 7, 11];
    const checked: number[] = [];

    const picked = firstFree(
      () => draws.shift() ?? -1,
      (candidate) => {
        checked.push(candidate);
        return candidate === 7;
      },
      5,
    );

    expect(picked).toBe(7);
    expect(checked).toEqual([3, 7]);
  });

  it("정한 횟수 안에 빈 후보가 없으면 null이다", () => {
    let drawn = 0;

    const picked = firstFree(
      () => {
        drawn += 1;
        return drawn;
      },
      () => false,
      4,
    );

    expect(picked).toBeNull();
    expect(drawn).toBe(4);
  });
});

describe("rowsInWindowSql", () => {
  it("public 표의 날짜 열이 구간 안에 든 행 수를 센다", () => {
    expect(rowsInWindowSql("schedules", "month")).toBe(
      "select count(*) from public.schedules where month >= :'from' and month < :'to';\n",
    );
  });

  it("식별자 꼴이 아닌 표·열 이름은 받지 않는다", () => {
    expect(() => rowsInWindowSql("schedules; drop", "month")).toThrow();
    expect(() => rowsInWindowSql("schedules", "Month")).toThrow();
  });
});
