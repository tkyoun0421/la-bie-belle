import type { Notification } from "@/entities/notification/model/notification.type";

const policy =
  await import("@/entities/notification/model/notificationRows.policy");

const { groupNotificationsByDate, unreadAdminNoticeIds } = policy;

// @ts-expect-error 대상 export가 아직 없다
const resolveNotificationsPaging = policy.resolveNotificationsPaging;

function buildRow(
  id: string,
  createdAt: string,
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id,
    profileId: "profile-1",
    kind: "signup_approved",
    payload: {},
    subjectId: null,
    createdAt,
    readAt: null,
    claimedAt: null,
    pushAttempts: 0,
    pushedAt: null,
    ...overrides,
  };
}

describe("groupNotificationsByDate — 받은 날의 한국 달력일로 줄을 묶는다", () => {
  it("같은 날에 받은 두 줄이 한 그룹에 든다", () => {
    const rows = [
      buildRow("a1", "2025-09-13T21:00:00+09:00"),
      buildRow("a2", "2025-09-13T19:00:00+09:00"),
      buildRow("a3", "2025-09-12T21:00:00+09:00"),
    ];

    const groups = groupNotificationsByDate(rows);

    expect(groups).toHaveLength(2);
    expect(groups[0].date).toBe("2025-09-13");
    expect(groups[0].rows.map((row: Notification) => row.id)).toEqual([
      "a1",
      "a2",
    ]);
    expect(groups[1].date).toBe("2025-09-12");
    expect(groups[1].rows.map((row: Notification) => row.id)).toEqual(["a3"]);
  });

  it("빈 목록이면 그룹도 빈 배열이다", () => {
    expect(groupNotificationsByDate([])).toEqual([]);
  });

  it("자정 직전과 직후는 다른 그룹이다", () => {
    const rows = [
      buildRow("b1", "2025-09-13T00:10:00+09:00"),
      buildRow("b2", "2025-09-12T23:50:00+09:00"),
    ];

    const groups = groupNotificationsByDate(rows);

    expect(groups).toHaveLength(2);
    expect(groups[0].date).toBe("2025-09-13");
    expect(groups[1].date).toBe("2025-09-12");
  });
});

function paging(overrides: {
  isFetchingNextPage?: boolean;
  isFetchNextPageError?: boolean;
  hasNextPage?: boolean;
}) {
  return resolveNotificationsPaging({
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    hasNextPage: false,
    ...overrides,
  });
}

describe("resolveNotificationsPaging — 더 불러오기 축 하나만 답한다", () => {
  it("다음 쪽을 읽는 중이면 pending이다", () => {
    expect(paging({ isFetchingNextPage: true, hasNextPage: true })).toBe(
      "pending",
    );
  });

  it("다음 쪽 읽기가 실패했으면 failed다", () => {
    expect(paging({ isFetchNextPageError: true, hasNextPage: true })).toBe(
      "failed",
    );
  });

  it("더 읽을 쪽이 있고 읽는 중도 실패도 아니면 idle이다", () => {
    expect(paging({ hasNextPage: true })).toBe("idle");
  });

  it("더 읽을 쪽이 없으면 end다", () => {
    expect(paging({ hasNextPage: false })).toBe("end");
  });

  it("읽는 중이면 실패가 겹쳐도 pending이 앞선다", () => {
    expect(
      paging({
        isFetchingNextPage: true,
        isFetchNextPageError: true,
        hasNextPage: true,
      }),
    ).toBe("pending");
  });

  it("실패했으면 더 읽을 쪽이 없어도 failed가 end보다 앞선다", () => {
    expect(paging({ isFetchNextPageError: true, hasNextPage: false })).toBe(
      "failed",
    );
  });
});

describe("unreadAdminNoticeIds — 안 읽은 관리자 공지의 id만 거른다", () => {
  it("공지 중 안 읽은 것만 남고 읽은 것과 다른 종류는 빠진다", () => {
    const rows = [
      buildRow("notice-unread", "2025-09-13T10:00:00+09:00", {
        kind: "admin_notice",
        readAt: null,
      }),
      buildRow("notice-read", "2025-09-13T09:00:00+09:00", {
        kind: "admin_notice",
        readAt: "2025-09-13T09:30:00+09:00",
      }),
      buildRow("not-notice", "2025-09-13T08:00:00+09:00", {
        kind: "signup_approved",
        readAt: null,
      }),
    ];

    expect(unreadAdminNoticeIds(rows)).toEqual(["notice-unread"]);
  });

  it("빈 목록이면 빈 배열이다", () => {
    expect(unreadAdminNoticeIds([])).toEqual([]);
  });

  it("전부 읽은 공지면 빈 배열이다", () => {
    const rows = [
      buildRow("notice-read", "2025-09-13T09:00:00+09:00", {
        kind: "admin_notice",
        readAt: "2025-09-13T09:30:00+09:00",
      }),
    ];

    expect(unreadAdminNoticeIds(rows)).toEqual([]);
  });
});
