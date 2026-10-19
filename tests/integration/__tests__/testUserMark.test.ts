import {
  LEGACY_EMAIL_PATTERN,
  newRunId,
  runEmailPattern,
  runIdOf,
  staleOrphanProfileIds,
  stalePurgeBatches,
  testUserEmail,
} from "@tests/integration/testUserMark";

const RUN_STARTED_AT = new Date("2026-10-18T03:00:00.000Z");
const RUN_ID = newRunId(RUN_STARTED_AT, "a1b2c3");
const OTHER_RUN_ID = newRunId(RUN_STARTED_AT, "d4e5f6");
const USER_KEY = "00000000-0000-4000-8000-000000000001";
const HOUR_MS = 60 * 60 * 1000;

function hoursAfterStart(hours: number): Date {
  return new Date(RUN_STARTED_AT.getTime() + hours * HOUR_MS);
}

function matches(pattern: string, email: string): boolean {
  return new RegExp(pattern).test(email);
}

describe("회차 표식", () => {
  it("runId는 시작 시각의 밀리초와 여섯 자리 16진수로 선다", () => {
    expect(RUN_ID).toBe(`${RUN_STARTED_AT.getTime()}-a1b2c3`);
  });

  it("여섯 자리 16진수가 아닌 nonce는 받지 않는다", () => {
    expect(() => newRunId(RUN_STARTED_AT, "xyz")).toThrow();
    expect(() => newRunId(RUN_STARTED_AT, "A1B2C3")).toThrow();
  });

  it("테스트 사용자 이메일은 test+<runId>-<uuid>@example.test 꼴이다", () => {
    expect(testUserEmail(RUN_ID, USER_KEY)).toBe(
      `test+${RUN_ID}-${USER_KEY}@example.test`,
    );
  });

  it("꼴이 어긋난 runId나 uuid가 아닌 키로는 이메일을 만들지 않는다", () => {
    expect(() => testUserEmail("run", USER_KEY)).toThrow();
    expect(() => testUserEmail(RUN_ID, "someone")).toThrow();
  });

  it("회차 패턴은 그 회차의 이메일에만 맞는다", () => {
    const email = testUserEmail(RUN_ID, USER_KEY);

    expect(matches(runEmailPattern(RUN_ID), email)).toBe(true);
    expect(matches(runEmailPattern(OTHER_RUN_ID), email)).toBe(false);
    expect(matches(runEmailPattern(RUN_ID), `${email}.evil`)).toBe(false);
    expect(matches(runEmailPattern(RUN_ID), `x${email}`)).toBe(false);
  });

  it("꼴이 어긋난 runId로는 패턴을 만들지 않는다", () => {
    expect(() => runEmailPattern(".*")).toThrow();
  });

  it("이메일에서 runId를 읽고 표식이 없으면 널이다", () => {
    expect(runIdOf(testUserEmail(RUN_ID, USER_KEY))).toBe(RUN_ID);
    expect(runIdOf(`${USER_KEY}@example.com`)).toBeNull();
    expect(runIdOf(`test+${RUN_ID}-${USER_KEY}@example.com`)).toBeNull();
  });
});

describe("옛 꼴 테스트 이메일", () => {
  it("uuid@example.com 에 정확히 맞는 것만 고른다", () => {
    expect(matches(LEGACY_EMAIL_PATTERN, `${USER_KEY}@example.com`)).toBe(true);
    expect(matches(LEGACY_EMAIL_PATTERN, "someone@example.com")).toBe(false);
    expect(matches(LEGACY_EMAIL_PATTERN, `x${USER_KEY}@example.com`)).toBe(
      false,
    );
    expect(matches(LEGACY_EMAIL_PATTERN, `${USER_KEY}@example.com.kr`)).toBe(
      false,
    );
    expect(matches(LEGACY_EMAIL_PATTERN, `${USER_KEY}@example.test`)).toBe(
      false,
    );
  });
});

describe("오래된 회차 치우기 묶음", () => {
  const createdAtMs = RUN_STARTED_AT.getTime();
  const staleUser = {
    id: "stale-1",
    email: testUserEmail(RUN_ID, USER_KEY),
    createdAtMs,
  };
  const legacyUser = {
    id: "legacy-1",
    email: `${USER_KEY}@example.com`,
    createdAtMs,
  };
  const strangerUser = {
    id: "stranger-1",
    email: "someone@example.com",
    createdAtMs,
  };

  it("6시간이 넘은 회차의 사용자는 그 회차 패턴으로 묶는다", () => {
    expect(stalePurgeBatches([staleUser], hoursAfterStart(7))).toEqual([
      { emailPattern: runEmailPattern(RUN_ID), userIds: ["stale-1"] },
    ]);
  });

  it("6시간이 안 넘은 회차는 건드리지 않는다", () => {
    expect(stalePurgeBatches([staleUser], hoursAfterStart(6))).toEqual([]);
  });

  it("만든 지 6시간이 넘은 옛 꼴 사용자는 옛 꼴 패턴으로 묶고 표식 없는 사용자는 고르지 않는다", () => {
    expect(
      stalePurgeBatches([legacyUser, strangerUser], hoursAfterStart(7)),
    ).toEqual([{ emailPattern: LEGACY_EMAIL_PATTERN, userIds: ["legacy-1"] }]);
  });

  it("만든 지 6시간이 안 넘은 옛 꼴 사용자는 건드리지 않는다", () => {
    expect(stalePurgeBatches([legacyUser], hoursAfterStart(6))).toEqual([]);
  });

  it("회차마다 따로 묶는다", () => {
    const otherUser = {
      id: "stale-2",
      email: testUserEmail(OTHER_RUN_ID, USER_KEY),
      createdAtMs,
    };

    expect(
      stalePurgeBatches([staleUser, otherUser, legacyUser], hoursAfterStart(7)),
    ).toEqual([
      { emailPattern: runEmailPattern(RUN_ID), userIds: ["stale-1"] },
      { emailPattern: runEmailPattern(OTHER_RUN_ID), userIds: ["stale-2"] },
      { emailPattern: LEGACY_EMAIL_PATTERN, userIds: ["legacy-1"] },
    ]);
  });
});

describe("옛 회차가 남긴 user_id 빈 profile", () => {
  const legacyFixture = {
    id: "orphan-1",
    createdAtMs: RUN_STARTED_AT.getTime(),
    approved: true,
    submitted: false,
    hasSubmittedEmail: false,
  };

  it("제출 없이 승인만 찍힌 꼴은 만든 지 6시간이 넘으면 고른다", () => {
    expect(staleOrphanProfileIds([legacyFixture], hoursAfterStart(7))).toEqual([
      "orphan-1",
    ]);
  });

  it("만든 지 6시간이 안 넘었으면 건드리지 않는다", () => {
    expect(staleOrphanProfileIds([legacyFixture], hoursAfterStart(6))).toEqual(
      [],
    );
  });

  it("제출한 적이 있으면 승인됐어도 고르지 않는다", () => {
    expect(
      staleOrphanProfileIds(
        [{ ...legacyFixture, submitted: true }],
        hoursAfterStart(7),
      ),
    ).toEqual([]);
  });

  it("제출이 남긴 이메일이 개인정보에 있으면 고르지 않는다", () => {
    expect(
      staleOrphanProfileIds(
        [{ ...legacyFixture, hasSubmittedEmail: true }],
        hoursAfterStart(7),
      ),
    ).toEqual([]);
  });

  it("승인되지 않은 profile은 고르지 않는다", () => {
    expect(
      staleOrphanProfileIds(
        [{ ...legacyFixture, approved: false }],
        hoursAfterStart(7),
      ),
    ).toEqual([]);
  });
});
