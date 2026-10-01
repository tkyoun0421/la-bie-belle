const {
  groupNotificationsByDate,
  resolveNotificationsListState,
  unreadAdminNoticeIds,
} = await import("@/screens/notifications/model/notificationRows.policy");

type RawNotificationRow = {
  id: string;
  profile_id: string;
  kind: string;
  payload: Record<string, unknown>;
  subject_id: string | null;
  created_at: string;
  read_at: string | null;
  claimed_at: string | null;
  push_attempts: number;
  pushed_at: string | null;
};

function buildRow(
  id: string,
  createdAt: string,
  overrides: Partial<RawNotificationRow> = {},
): RawNotificationRow {
  return {
    id,
    profile_id: "profile-1",
    kind: "signup_approved",
    payload: {},
    subject_id: null,
    created_at: createdAt,
    read_at: null,
    claimed_at: null,
    push_attempts: 0,
    pushed_at: null,
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
    expect(groups[0].rows.map((row: RawNotificationRow) => row.id)).toEqual([
      "a1",
      "a2",
    ]);
    expect(groups[1].date).toBe("2025-09-12");
    expect(groups[1].rows.map((row: RawNotificationRow) => row.id)).toEqual([
      "a3",
    ]);
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

describe("resolveNotificationsListState — 처음 읽는 중이면 로딩이다", () => {
  it("isLoading이 true면 다른 값과 무관하게 로딩이다", () => {
    const state = resolveNotificationsListState({
      rows: [],
      isLoading: true,
      isError: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      isFetchNextPageError: false,
    });

    expect(state).toBe("loading");
  });
});

describe("resolveNotificationsListState — 첫 읽기가 실패하면 못 읽음이다", () => {
  it("isError가 true면 못 읽음이다", () => {
    const state = resolveNotificationsListState({
      rows: [],
      isLoading: false,
      isError: true,
      isFetchingNextPage: false,
      hasNextPage: false,
      isFetchNextPageError: false,
    });

    expect(state).toBe("error");
  });
});

describe("resolveNotificationsListState — 받은 알림이 없으면 빈 상태다", () => {
  it("rows가 비어 있고 로딩·에러가 아니면 빈 상태다", () => {
    const state = resolveNotificationsListState({
      rows: [],
      isLoading: false,
      isError: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      isFetchNextPageError: false,
    });

    expect(state).toBe("empty");
  });
});

describe("resolveNotificationsListState — 바닥에서 다음 쪽을 읽는 중이면 더 읽는 중이다", () => {
  it("isFetchingNextPage가 true면 더 읽는 중이다", () => {
    const state = resolveNotificationsListState({
      rows: [buildRow("a1", "2025-09-13T10:00:00+09:00")],
      isLoading: false,
      isError: false,
      isFetchingNextPage: true,
      hasNextPage: true,
      isFetchNextPageError: false,
    });

    expect(state).toBe("loadingMore");
  });
});

describe("resolveNotificationsListState — 다음 쪽 읽기가 실패하면 더 못 읽음이다", () => {
  it("isFetchNextPageError가 true면 더 못 읽음이고 이미 읽은 줄은 남는다", () => {
    const state = resolveNotificationsListState({
      rows: [buildRow("a1", "2025-09-13T10:00:00+09:00")],
      isLoading: false,
      isError: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      isFetchNextPageError: true,
    });

    expect(state).toBe("errorMore");
  });
});

describe("resolveNotificationsListState — 더 읽을 것이 없으면 끝이다", () => {
  it("hasNextPage가 false면 끝이다", () => {
    const state = resolveNotificationsListState({
      rows: [buildRow("a1", "2025-09-13T10:00:00+09:00")],
      isLoading: false,
      isError: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      isFetchNextPageError: false,
    });

    expect(state).toBe("end");
  });
});

describe("resolveNotificationsListState — 줄이 있고 더 읽을 것도 있으면 정상이다", () => {
  it("정상 상태다", () => {
    const state = resolveNotificationsListState({
      rows: [buildRow("a1", "2025-09-13T10:00:00+09:00")],
      isLoading: false,
      isError: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      isFetchNextPageError: false,
    });

    expect(state).toBe("normal");
  });
});

describe("unreadAdminNoticeIds — 안 읽은 관리자 공지의 id만 거른다", () => {
  it("공지 중 안 읽은 것만 남고 읽은 것과 다른 종류는 빠진다", () => {
    const rows = [
      buildRow("notice-unread", "2025-09-13T10:00:00+09:00", {
        kind: "admin_notice",
        read_at: null,
      }),
      buildRow("notice-read", "2025-09-13T09:00:00+09:00", {
        kind: "admin_notice",
        read_at: "2025-09-13T09:30:00+09:00",
      }),
      buildRow("not-notice", "2025-09-13T08:00:00+09:00", {
        kind: "signup_approved",
        read_at: null,
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
        read_at: "2025-09-13T09:30:00+09:00",
      }),
    ];

    expect(unreadAdminNoticeIds(rows)).toEqual([]);
  });
});
