import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireAdmin = vi.fn();
const listPositionAssignmentCandidates = vi.fn();

vi.mock("@/entities/identity/api/require-admin", () => ({ requireAdmin }));
vi.mock("@/entities/assignment/api/list-position-assignment-candidates", () => ({
  listPositionAssignmentCandidates,
}));

const VALID_SCHEDULE_ID = "11111111-1111-4111-8111-111111111111";
const VALID_POSITION_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  requireAdmin.mockReset();
  requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
  listPositionAssignmentCandidates.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listAssignmentCandidates", () => {
  it("admin이면 후보 조회를 위임하고 candidates로 반환한다", async () => {
    listPositionAssignmentCandidates.mockResolvedValue({
      ok: true,
      data: [
        {
          profileId: "profile-1",
          name: "김근무",
          applied: true,
          currentlyAssigned: false,
          otherPositionNames: [],
          eligible: true,
          ineligibleReason: null,
        },
      ],
    });

    const { listAssignmentCandidates } =
      await import("@/features/assignment/api/list-assignment-candidates");
    const result = await listAssignmentCandidates({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
    });

    expect(result).toEqual({
      ok: true,
      candidates: [
        {
          profileId: "profile-1",
          name: "김근무",
          applied: true,
          currentlyAssigned: false,
          otherPositionNames: [],
          eligible: true,
          ineligibleReason: null,
        },
      ],
    });
    expect(listPositionAssignmentCandidates).toHaveBeenCalledWith({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
    });
  });

  it("admin이 아니면 조회 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { listAssignmentCandidates } =
      await import("@/features/assignment/api/list-assignment-candidates");
    const result = await listAssignmentCandidates({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(listPositionAssignmentCandidates).not.toHaveBeenCalled();
  });

  it("잘못된 입력은 조회 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    const { listAssignmentCandidates } =
      await import("@/features/assignment/api/list-assignment-candidates");
    const result = await listAssignmentCandidates({
      scheduleId: "not-a-uuid",
      positionId: VALID_POSITION_ID,
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(listPositionAssignmentCandidates).not.toHaveBeenCalled();
  });

  it("하위 조회 실패는 그대로 전달한다", async () => {
    listPositionAssignmentCandidates.mockResolvedValue({
      ok: false,
      code: ERROR_CODE.COMMON_UNEXPECTED,
    });

    const { listAssignmentCandidates } =
      await import("@/features/assignment/api/list-assignment-candidates");
    const result = await listAssignmentCandidates({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
