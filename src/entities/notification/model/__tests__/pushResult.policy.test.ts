type PushOutcome = {
  id: string;
  token: string;
  response:
    | { status: "ok"; id?: string }
    | {
        status: "error";
        message: string;
        details?: { error?: string; fault?: string };
      };
};

function outcome(overrides: Partial<PushOutcome> = {}): PushOutcome {
  return {
    id: "notif-1",
    token: "exp-tok[aaa]",
    response: { status: "ok", id: "receipt-1" },
    ...overrides,
  };
}

describe("splitPushResults — 성공 갈래", () => {
  it("ticket 응답의 ok는 접수증 id와 함께 성공 갈래에 담긴다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({ id: "notif-9", response: { status: "ok", id: "receipt-9" } }),
    ]);

    expect(groups.success).toEqual([{ id: "notif-9", receiptId: "receipt-9" }]);
  });

  it("receipt 응답처럼 id가 없는 ok도 성공 갈래에 담긴다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({ id: "notif-9", response: { status: "ok" } }),
    ]);

    expect(groups.success).toEqual([{ id: "notif-9", receiptId: null }]);
  });
});

describe("splitPushResults — 폐기 갈래는 DeviceNotRegistered 하나뿐이다", () => {
  it("DeviceNotRegistered는 그 기기의 토큰을 폐기 갈래에 담는다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({
        token: "exp-tok[dead]",
        response: {
          status: "error",
          message:
            '"exp-tok[dead]" is not a registered push notification recipient',
          details: { error: "DeviceNotRegistered" },
        },
      }),
    ]);

    expect(groups.discardTokens).toEqual(["exp-tok[dead]"]);
  });

  it("MessageRateExceeded는 폐기가 아니라 재시도다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({
        response: {
          status: "error",
          message: "Rate exceeded",
          details: { error: "MessageRateExceeded" },
        },
      }),
    ]);

    expect(groups.discardTokens).toEqual([]);
  });

  it("에러 코드가 없는 일반 오류도 폐기가 아니라 재시도다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({
        response: { status: "error", message: "일시적인 오류" },
      }),
    ]);

    expect(groups.discardTokens).toEqual([]);
  });
});

describe("splitPushResults — 다시 시도 갈래", () => {
  it("폐기·자격 증명이 아닌 오류는 id와 token을 실어 다시 시도 갈래에 담는다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({
        id: "notif-3",
        token: "exp-tok[busy]",
        response: {
          status: "error",
          message: "Rate exceeded",
          details: { error: "MessageRateExceeded" },
        },
      }),
    ]);

    expect(groups.retry).toEqual([{ id: "notif-3", token: "exp-tok[busy]" }]);
  });
});

describe("splitPushResults — 자격 증명 오류는 넷째 갈래고 재시도에 안 든다", () => {
  it("InvalidCredentials는 사람이 봐야 하는 갈래에만 담긴다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({
        id: "notif-4",
        token: "exp-tok[bad-cred]",
        response: {
          status: "error",
          message: "Invalid credentials",
          details: { error: "InvalidCredentials" },
        },
      }),
    ]);

    expect(groups.needsReview).toEqual([
      {
        id: "notif-4",
        token: "exp-tok[bad-cred]",
        message: "Invalid credentials",
      },
    ]);
  });

  it("InvalidCredentials는 재시도 갈래에 안 든다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({
        response: {
          status: "error",
          message: "Invalid credentials",
          details: { error: "InvalidCredentials" },
        },
      }),
    ]);

    expect(groups.retry).toEqual([]);
  });

  it("InvalidCredentials는 폐기 갈래에도 안 든다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({
        response: {
          status: "error",
          message: "Invalid credentials",
          details: { error: "InvalidCredentials" },
        },
      }),
    ]);

    expect(groups.discardTokens).toEqual([]);
  });
});

describe("splitPushResults — 같은 오류 코드가 ticket 응답과 receipt 응답 두 모양에서 같은 갈래로 나온다", () => {
  it("ticket 모양(details.error만)과 receipt 모양(details.error·fault)이 둘 다 폐기 갈래로 간다", async () => {
    const { splitPushResults } =
      await import("@/entities/notification/model/pushResult.policy");

    const groups = splitPushResults([
      outcome({
        token: "exp-tok[ticket-shape]",
        response: {
          status: "error",
          message: "ticket 응답",
          details: { error: "DeviceNotRegistered" },
        },
      }),
      outcome({
        token: "exp-tok[receipt-shape]",
        response: {
          status: "error",
          message: "receipt 응답",
          details: { error: "DeviceNotRegistered", fault: "developer" },
        },
      }),
    ]);

    expect(groups.discardTokens.sort()).toEqual(
      ["exp-tok[receipt-shape]", "exp-tok[ticket-shape]"].sort(),
    );
  });
});
