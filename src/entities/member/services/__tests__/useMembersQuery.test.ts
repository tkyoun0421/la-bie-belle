import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import type {
  listActiveMembers,
  listLeftMembers,
  listPendingMembers,
  listBlockedMembers,
} from "@/entities/member/api/listMembers.api";
import type { ActiveMember } from "@/entities/member/model/member.type";

const listActiveMembersMock = jest.fn<typeof listActiveMembers>();
const listLeftMembersMock = jest.fn<typeof listLeftMembers>();
const listPendingMembersMock = jest.fn<typeof listPendingMembers>();
const listBlockedMembersMock = jest.fn<typeof listBlockedMembers>();

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: listActiveMembersMock,
  listLeftMembers: listLeftMembersMock,
  listPendingMembers: listPendingMembersMock,
  listBlockedMembers: listBlockedMembersMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMembersQuery } =
  await import("@/entities/member/services/useMembersQuery");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

const ROW: ActiveMember = {
  id: "profile-1",
  displayName: "박서연",
  photoUrl: null,
  submittedAt: "2026-08-01T00:00:00Z",
  approvedAt: "2026-08-02T00:00:00Z",
  rejectedAt: null,
  blockedAt: null,
  role: "member",
  leftAt: null,
  erasedAt: null,
  phone: "010-0000-0001",
  birthDate: null,
  gender: null,
  notificationsEnabled: true,
  hasDevice: true,
};

const MOCK_OF = {
  active: listActiveMembersMock,
  left: listLeftMembersMock,
  pending: listPendingMembersMock,
  blocked: listBlockedMembersMock,
} as const;

const ALL_KINDS = ["active", "left", "pending", "blocked"] as const;

beforeEach(() => {
  listActiveMembersMock.mockReset();
  listLeftMembersMock.mockReset();
  listPendingMembersMock.mockReset();
  listBlockedMembersMock.mockReset();
});

describe("useMembersQuery — kind이 가리키는 DAL 하나만 불러 ['members', kind]에 앉힌다", () => {
  it.each(ALL_KINDS)(
    "kind이 %s면 그 DAL만 부르고 나머지 셋은 안 부른다",
    async (kind) => {
      MOCK_OF[kind].mockResolvedValue([ROW]);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useMembersQuery(FAKE_CLIENT, kind), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(MOCK_OF[kind]).toHaveBeenCalledWith(FAKE_CLIENT);

      for (const other of ALL_KINDS.filter((candidate) => candidate !== kind)) {
        expect(MOCK_OF[other]).not.toHaveBeenCalled();
      }
    },
  );

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    listActiveMembersMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMembersQuery(FAKE_CLIENT, "active"),
      {
        wrapper,
      },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 목록을 그대로 낸다", async () => {
    listActiveMembersMock.mockResolvedValue([ROW]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMembersQuery(FAKE_CLIENT, "active"),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([ROW]);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    listActiveMembersMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMembersQuery(FAKE_CLIENT, "active"),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['members', kind]다", async () => {
    listLeftMembersMock.mockResolvedValue([ROW]);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useMembersQuery(FAKE_CLIENT, "left"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["members", "left"])).toEqual([ROW]);
  });
});
