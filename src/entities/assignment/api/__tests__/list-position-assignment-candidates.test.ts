import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  rpc.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

const SCHEDULE_ID = "11111111-1111-4111-8111-111111111111";
const POSITION_ID = "22222222-2222-4222-8222-222222222222";

describe("listPositionAssignmentCandidates", () => {
  it("RPC 응답을 후보 DTO 배열로 매핑한다", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          profile_id: "33333333-3333-4333-8333-333333333333",
          name: "김근무",
          applied: true,
          currently_assigned: false,
          other_position_names: ["매니저"],
          eligible: true,
          ineligible_reason: null,
          currently_trainee: false,
        },
        {
          profile_id: "44444444-4444-4444-8444-444444444444",
          name: "이근무",
          applied: false,
          currently_assigned: false,
          other_position_names: [],
          eligible: false,
          ineligible_reason: "GENDER_MISMATCH",
          currently_trainee: false,
        },
        {
          profile_id: "55555555-5555-4555-8555-555555555555",
          name: "박근무",
          applied: false,
          currently_assigned: false,
          other_position_names: [],
          eligible: false,
          ineligible_reason: "NOT_ELIGIBLE",
          currently_trainee: true,
        },
      ],
      error: null,
    });

    const { listPositionAssignmentCandidates } =
      await import("@/entities/assignment/api/list-position-assignment-candidates");
    const result = await listPositionAssignmentCandidates({
      scheduleId: SCHEDULE_ID,
      positionId: POSITION_ID,
    });

    expect(result).toEqual({
      ok: true,
      data: [
        {
          profileId: "33333333-3333-4333-8333-333333333333",
          name: "김근무",
          applied: true,
          currentlyAssigned: false,
          otherPositionNames: ["매니저"],
          eligible: true,
          ineligibleReason: null,
          currentlyTrainee: false,
        },
        {
          profileId: "44444444-4444-4444-8444-444444444444",
          name: "이근무",
          applied: false,
          currentlyAssigned: false,
          otherPositionNames: [],
          eligible: false,
          ineligibleReason: "GENDER_MISMATCH",
          currentlyTrainee: false,
        },
        {
          profileId: "55555555-5555-4555-8555-555555555555",
          name: "박근무",
          applied: false,
          currentlyAssigned: false,
          otherPositionNames: [],
          eligible: false,
          ineligibleReason: "NOT_ELIGIBLE",
          currentlyTrainee: true,
        },
      ],
    });
    expect(rpc).toHaveBeenCalledWith("list_position_assignment_candidates", {
      target_schedule_id: SCHEDULE_ID,
      target_position_id: POSITION_ID,
    });
  });

  it("빈 목록 응답은 빈 배열로 매핑한다(활성 근무자 0명 경계)", async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    const { listPositionAssignmentCandidates } =
      await import("@/entities/assignment/api/list-position-assignment-candidates");
    const result = await listPositionAssignmentCandidates({
      scheduleId: SCHEDULE_ID,
      positionId: POSITION_ID,
    });

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { listPositionAssignmentCandidates } =
      await import("@/entities/assignment/api/list-position-assignment-candidates");
    const result = await listPositionAssignmentCandidates({
      scheduleId: SCHEDULE_ID,
      positionId: POSITION_ID,
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 조회 오류는 COMMON_UNEXPECTED로 매핑한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listPositionAssignmentCandidates } =
      await import("@/entities/assignment/api/list-position-assignment-candidates");
    const result = await listPositionAssignmentCandidates({
      scheduleId: SCHEDULE_ID,
      positionId: POSITION_ID,
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
