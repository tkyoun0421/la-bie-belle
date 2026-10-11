import { jest } from "@jest/globals";

import { countBy, groupBy } from "@/shared/utils/collect";

type Entry = { id: number; category: string };

function entry(id: number, category: string): Entry {
  return { id, category };
}

describe("groupBy — 키마다 배열을 낸다", () => {
  it("같은 키를 가진 항목이 한 배열에 모인다", () => {
    const entries = [entry(1, "a"), entry(2, "b"), entry(3, "a")];

    const grouped = groupBy(entries, (one: Entry) => one.category);

    expect(grouped.get("a")).toEqual([entry(1, "a"), entry(3, "a")]);
    expect(grouped.get("b")).toEqual([entry(2, "b")]);
  });
});

describe("groupBy — 같은 키의 항목은 만난 순서로 쌓인다", () => {
  it("나중에 만난 항목이 배열 끝에 붙는다", () => {
    const entries = [
      entry(1, "x"),
      entry(2, "y"),
      entry(3, "x"),
      entry(4, "x"),
    ];

    const grouped = groupBy(entries, (one: Entry) => one.category);

    expect(grouped.get("x")?.map((one: Entry) => one.id)).toEqual([1, 3, 4]);
  });
});

describe("groupBy — 키의 반복 순서도 처음 그 키를 만난 순서다", () => {
  it("알파벳 순이 아니라 등장 순으로 키가 나온다", () => {
    const entries = [entry(1, "b"), entry(2, "a"), entry(3, "b")];

    const grouped = groupBy(entries, (one: Entry) => one.category);

    expect([...grouped.keys()]).toEqual(["b", "a"]);
  });
});

describe("groupBy — 빈 배열을 주면 빈 Map이다", () => {
  it("항목이 없으면 Map 크기가 0이다", () => {
    const grouped = groupBy([], (one: Entry) => one.category);

    expect(grouped.size).toBe(0);
  });
});

describe("groupBy — 키가 문자열이 아니어도 된다", () => {
  it("수를 키로 써도 그 값 그대로 Map 키가 된다", () => {
    const entries = [entry(1, "a"), entry(2, "b"), entry(3, "c")];

    const grouped = groupBy(entries, (one: Entry) => one.id % 2);

    expect([...grouped.keys()]).toEqual([1, 0]);
    expect(grouped.get(1)).toEqual([entry(1, "a"), entry(3, "c")]);
  });
});

describe("groupBy — keyOf가 각 항목마다 한 번만 불린다", () => {
  it("항목 셋을 넣으면 keyOf 호출도 셋이다", () => {
    const entries = [entry(1, "a"), entry(2, "b"), entry(3, "a")];
    const keyOf = jest.fn((one: Entry) => one.category);

    groupBy(entries, keyOf);

    expect(keyOf).toHaveBeenCalledTimes(3);
  });
});

describe("countBy — 키마다 수를 센다", () => {
  it("같은 키를 가진 항목 수를 더한다", () => {
    const entries = [
      entry(1, "a"),
      entry(2, "b"),
      entry(3, "a"),
      entry(4, "a"),
    ];

    const counted = countBy(entries, (one: Entry) => one.category);

    expect(counted.get("a")).toBe(3);
    expect(counted.get("b")).toBe(1);
  });
});

describe("countBy — 키의 반복 순서도 처음 그 키를 만난 순서다", () => {
  it("알파벳 순이 아니라 등장 순으로 키가 나온다", () => {
    const entries = [entry(1, "b"), entry(2, "a"), entry(3, "b")];

    const counted = countBy(entries, (one: Entry) => one.category);

    expect([...counted.keys()]).toEqual(["b", "a"]);
  });
});

describe("countBy — 빈 배열을 주면 빈 Map이다", () => {
  it("항목이 없으면 Map 크기가 0이다", () => {
    const counted = countBy([], (one: Entry) => one.category);

    expect(counted.size).toBe(0);
  });
});

describe("countBy — keyOf가 각 항목마다 한 번만 불린다", () => {
  it("항목 셋을 넣으면 keyOf 호출도 셋이다", () => {
    const entries = [entry(1, "a"), entry(2, "b"), entry(3, "a")];
    const keyOf = jest.fn((one: Entry) => one.category);

    countBy(entries, keyOf);

    expect(keyOf).toHaveBeenCalledTimes(3);
  });
});
