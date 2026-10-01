// 구현 대상: src/entities/notification/model/pushMessage.ts (notification-push plan AC-06)
//
// 잡힌 알림 행과 그 사람의 기기 주소 목록을 받아 부칠 메시지 배열을 낸다. 함수 이름은
// buildPushMessages(주소 수만큼 메시지를 낸다)와 chunkPushMessages(백 건씩 끊는다)로
// 정했다 — plan이 이름을 비워둬 이 테스트가 계약을 정한다.
//
// buildPushMessages가 받는 한 행의 모양은 AC-02가 claim_notifications이 돌려주는 것과
// 같다 — id·kind·payload·그 사람의 tokens 배열이다. 문안(제목·아래 줄)은
// `src/entities/notification/model/title.ts`가 그대로 내니 이 테스트는 그 문자열을
// title.test.ts가 이미 확인한 값 그대로 가져다 쓴다.

type ClaimedPushNotification = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  tokens: string[];
};

function claimedRow(
  overrides: Partial<ClaimedPushNotification> = {},
): ClaimedPushNotification {
  return {
    id: "notif-1",
    kind: "assignment_added",
    payload: { work_date: "2025-09-13" },
    tokens: ["exp-tok[aaa]"],
    ...overrides,
  };
}

describe("buildPushMessages — 주소마다 메시지가 하나씩 난다", () => {
  it("주소가 둘이면 메시지도 둘이다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([
      claimedRow({
        tokens: ["exp-tok[aaa]", "exp-tok[bbb]"],
      }),
    ]);

    expect(messages).toHaveLength(2);
  });

  it("주소가 없으면 메시지가 0건이다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([claimedRow({ tokens: [] })]);

    expect(messages).toHaveLength(0);
  });
});

describe("buildPushMessages — data에는 kind와 목적지만 든다", () => {
  it("문안(제목 문자열)이 data 어디에도 없다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([claimedRow()]);
    const serialized = JSON.stringify(messages[0].data);

    expect(serialized).not.toContain("근무가 생겼어요");
  });

  it("data의 키가 kind와 destination 둘뿐이다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([claimedRow()]);

    expect(Object.keys(messages[0].data).sort()).toEqual([
      "destination",
      "kind",
    ]);
  });

  it("data.kind가 그 행의 kind와 같다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([
      claimedRow({ kind: "schedule_confirmed", payload: { month: "2025-10" } }),
    ]);

    expect(messages[0].data.kind).toBe("schedule_confirmed");
  });

  it("data.destination이 UI 연결 표의 경로와 같다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([
      claimedRow({
        kind: "assignment_added",
        payload: { work_date: "2025-09-13" },
      }),
    ]);

    expect(messages[0].data.destination).toBe("/schedule?date=2025-09-13");
  });
});

describe("buildPushMessages — 제목과 아래 줄은 title.ts가 낸다", () => {
  it("assignment_added의 title이 '9월 13일 근무가 생겼어요'다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([
      claimedRow({
        kind: "assignment_added",
        payload: { work_date: "2025-09-13" },
      }),
    ]);

    expect(messages[0].title).toBe("9월 13일 근무가 생겼어요");
  });

  it("아래 줄이 있는 종류는 body가 null이 아니다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([
      claimedRow({
        kind: "requests_open",
        payload: { month: "2025-10", deadline: "2025-09-20" },
      }),
    ]);

    expect(messages[0].body).not.toBeNull();
  });
});

describe("buildPushMessages — 2차 다섯은 문장이 없어 메시지가 0건이다", () => {
  it.each([
    "admin_notice",
    "swap_requested",
    "swap_accepted",
    "swap_approved",
    "swap_exhausted",
  ])("%s는 메시지를 안 낸다", async (kind) => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([claimedRow({ kind, payload: {} })]);

    expect(messages).toHaveLength(0);
  });
});

describe("buildPushMessages — 메시지마다 알림 id와 토큰을 든다", () => {
  it("나중에 {id, receipt_id}를 조립할 수 있게 알림 id를 싣는다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([claimedRow({ id: "notif-77" })]);

    expect(messages[0].notificationId).toBe("notif-77");
  });

  it("메시지의 to가 그 기기의 토큰과 같다", async () => {
    const { buildPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const messages = buildPushMessages([
      claimedRow({ tokens: ["exp-tok[ccc]"] }),
    ]);

    expect(messages[0].to).toBe("exp-tok[ccc]");
  });
});

describe("chunkPushMessages — 백 건 경계", () => {
  function manyMessages(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      to: `exp-tok[${index}]`,
      title: "제목",
      body: null,
      data: {
        kind: "assignment_added",
        destination: "/schedule?date=2025-09-13",
      },
      notificationId: `notif-${index}`,
    }));
  }

  it("100건이면 묶음이 하나다", async () => {
    const { chunkPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const chunks = chunkPushMessages(manyMessages(100));

    expect(chunks).toHaveLength(1);
  });

  it("101건이면 묶음이 둘이다", async () => {
    const { chunkPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const chunks = chunkPushMessages(manyMessages(101));

    expect(chunks).toHaveLength(2);
  });

  it("250건이면 묶음이 셋이고 크기가 100·100·50이다", async () => {
    const { chunkPushMessages } =
      await import("@/entities/notification/utils/pushMessage.utils");

    const chunks = chunkPushMessages(manyMessages(250));

    expect(chunks.map((chunk: unknown[]) => chunk.length)).toEqual([
      100, 100, 50,
    ]);
  });
});
