const { fragmentOf } = await import("@/shared/model/fragmentState.policy");

describe("fragmentOf — error가 있으면 failed다", () => {
  it("data가 없고 error만 있으면 failed다", () => {
    const result = fragmentOf(
      { data: undefined, error: new Error("끊겼다") },
      { empty: () => false, ready: () => ({}) },
    );

    expect(result.state).toBe("failed");
  });

  it("error가 있고 data도 와 있으면 그래도 failed다 — error를 먼저 본다", () => {
    const result = fragmentOf(
      { data: [1, 2], error: new Error("끊겼다") },
      { empty: () => false, ready: (data: number[]) => ({ rows: data }) },
    );

    expect(result.state).toBe("failed");
  });
});

describe("fragmentOf — error가 없고 data가 아직 없으면 pending이다", () => {
  it("data가 undefined면 pending이다", () => {
    const result = fragmentOf(
      { data: undefined, error: null },
      { empty: () => false, ready: () => ({}) },
    );

    expect(result.state).toBe("pending");
  });
});

describe("fragmentOf — data가 왔으면 empty 식으로 empty와 ready를 가른다", () => {
  it("empty 식이 참이면 empty다", () => {
    const result = fragmentOf(
      { data: [], error: null },
      { empty: (data: unknown[]) => data.length === 0, ready: () => ({}) },
    );

    expect(result.state).toBe("empty");
  });

  it("empty 식이 거짓이면 ready이고 ready 콜백이 만든 값을 든다", () => {
    const result = fragmentOf(
      { data: [1, 2], error: null },
      {
        empty: (data: number[]) => data.length === 0,
        ready: (data: number[]) => ({ rows: data }),
      },
    );

    expect(result.state).toBe("ready");

    if (result.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.rows).toEqual([1, 2]);
  });
});

describe("fragmentOf — failed 콜백을 주면 failed 가지가 그 값을 든다", () => {
  it("retry를 돌려주면 failed 가지에 그 retry가 그대로 있다", () => {
    const retry = () => {};
    const result = fragmentOf(
      { data: undefined, error: new Error("끊겼다") },
      {
        empty: () => false,
        ready: () => ({}),
        failed: () => ({ retry }),
      },
    );

    expect(result.state).toBe("failed");

    if (result.state !== "failed") {
      throw new Error("failed가 아니다");
    }

    expect(result.retry).toBe(retry);
  });
});

describe("fragmentOf — emptyValue 콜백을 주면 empty 가지가 그 값을 든다", () => {
  it("reason을 돌려주면 empty 가지에 그 reason이 있다", () => {
    const result = fragmentOf(
      { data: [], error: null },
      {
        empty: (data: unknown[]) => data.length === 0,
        ready: () => ({}),
        emptyValue: () => ({ reason: "noMembers" }),
      },
    );

    expect(result.state).toBe("empty");

    if (result.state !== "empty") {
      throw new Error("empty가 아니다");
    }

    expect(result.reason).toBe("noMembers");
  });
});

describe("fragmentOf — empty 식을 안 주면 그 가지가 없다", () => {
  it("empty를 안 주면 data가 빈 배열이어도 ready다", () => {
    const result = fragmentOf(
      { data: [], error: null },
      { ready: (data: unknown[]) => ({ rows: data }) },
    );

    expect(result.state).toBe("ready");

    if (result.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.rows).toEqual([]);
  });

  it("empty를 안 주면 error와 pending은 그대로 가른다", () => {
    const pending = fragmentOf(
      { data: undefined, error: null },
      { ready: () => ({}) },
    );
    const failed = fragmentOf(
      { data: undefined, error: new Error("끊겼다") },
      { ready: () => ({}) },
    );

    expect(pending.state).toBe("pending");
    expect(failed.state).toBe("failed");
  });
});

describe("fragmentOf — 읽기 여럿을 배열로 받는다", () => {
  it("하나라도 error가 있으면 failed다", () => {
    const result = fragmentOf(
      [
        { data: [1], error: null },
        { data: undefined, error: new Error("끊겼다") },
      ],
      { empty: () => false, ready: () => ({}) },
    );

    expect(result.state).toBe("failed");
  });

  it("하나라도 data가 undefined면 pending이다", () => {
    const result = fragmentOf(
      [
        { data: [1], error: null },
        { data: undefined, error: null },
      ],
      { empty: () => false, ready: () => ({}) },
    );

    expect(result.state).toBe("pending");
  });

  it("전부 data가 오면 ready 콜백이 각 자리의 data를 순서대로 배열로 받는다", () => {
    const result = fragmentOf(
      [
        { data: [1, 2], error: null },
        { data: ["a"], error: null },
      ],
      {
        empty: () => false,
        ready: ([nums, letters]: [number[], string[]]) => ({ nums, letters }),
      },
    );

    expect(result.state).toBe("ready");

    if (result.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.nums).toEqual([1, 2]);
    expect(result.letters).toEqual(["a"]);
  });
});
