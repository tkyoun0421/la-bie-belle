import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requirementsLimit = vi.fn();
const requirementsOrder = vi.fn(() => ({ limit: requirementsLimit }));
const requirementsEq = vi.fn(() => ({ order: requirementsOrder }));
const requirementsSelect = vi.fn(() => ({ eq: requirementsEq }));

const assignmentsLimit = vi.fn();
const assignmentsEq = vi.fn(() => ({ limit: assignmentsLimit }));
const assignmentsSelect = vi.fn(() => ({ eq: assignmentsEq }));

const from = vi.fn((table: string) => {
  if (table === "schedule_position_requirements") {
    return { select: requirementsSelect };
  }
  if (table === "assignments") {
    return { select: assignmentsSelect };
  }
  throw new Error(`unexpected table ${table}`);
});

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  requirementsLimit.mockReset();
  requirementsOrder.mockClear();
  requirementsEq.mockClear();
  requirementsSelect.mockClear();
  assignmentsLimit.mockReset();
  assignmentsEq.mockClear();
  assignmentsSelect.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listScheduleRequirements", () => {
  it("스케줄의 필요 인원 표를 포지션명·배정 수와 함께 조회한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        { position_id: "position-1", required_count: 3, positions: { name: "팀장" } },
        { position_id: "position-2", required_count: 0, positions: { name: "드레스" } },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({
      data: [
        { assignment_positions: [{ position_id: "position-1" }] },
        { assignment_positions: [{ position_id: "position-1" }, { position_id: "position-2" }] },
      ],
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({
      ok: true,
      data: [
        { positionId: "position-1", positionName: "팀장", requiredCount: 3 },
        { positionId: "position-2", positionName: "드레스", requiredCount: 0 },
      ],
      assignedCounts: { "position-1": 2, "position-2": 1 },
      assignedWorkerCount: 2,
    });
    expect(from).toHaveBeenCalledWith("schedule_position_requirements");
    expect(requirementsSelect).toHaveBeenCalledWith("position_id, required_count, positions(name)");
    expect(requirementsEq).toHaveBeenCalledWith("schedule_id", "schedule-1");
    expect(requirementsOrder).toHaveBeenCalledWith("position_id", { ascending: true });
    expect(requirementsLimit).toHaveBeenCalledWith(1000);
    expect(from).toHaveBeenCalledWith("assignments");
    expect(assignmentsSelect).toHaveBeenCalledWith("assignment_positions(position_id)");
    expect(assignmentsEq).toHaveBeenCalledWith("schedule_id", "schedule-1");
    expect(assignmentsLimit).toHaveBeenCalledWith(1000);
  });

  it("배정이 없는 포지션은 assignedCounts에 등장하지 않는다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [{ position_id: "position-1", required_count: 1, positions: { name: "팀장" } }],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({
      ok: true,
      data: [{ positionId: "position-1", positionName: "팀장", requiredCount: 1 }],
      assignedCounts: {},
      assignedWorkerCount: 0,
    });
  });

  it("겸직으로 포지션 합계가 실인원보다 커도 assignedWorkerCount는 배정 행 수와 같다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        { position_id: "position-1", required_count: 1, positions: { name: "메인" } },
        { position_id: "position-2", required_count: 1, positions: { name: "스캔" } },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({
      data: [
        { assignment_positions: [{ position_id: "position-1" }, { position_id: "position-2" }] },
      ],
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({
      ok: true,
      data: [
        { positionId: "position-1", positionName: "메인", requiredCount: 1 },
        { positionId: "position-2", positionName: "스캔", requiredCount: 1 },
      ],
      assignedCounts: { "position-1": 1, "position-2": 1 },
      assignedWorkerCount: 1,
    });
  });

  it("AC6: 한 사람이 세 포지션을 겸해도 상한 없이 모두 집계된다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        { position_id: "position-1", required_count: 1, positions: { name: "메인" } },
        { position_id: "position-2", required_count: 1, positions: { name: "스캔" } },
        { position_id: "position-3", required_count: 1, positions: { name: "드레스" } },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({
      data: [
        {
          assignment_positions: [
            { position_id: "position-1" },
            { position_id: "position-2" },
            { position_id: "position-3" },
          ],
        },
      ],
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({
      ok: true,
      data: [
        { positionId: "position-1", positionName: "메인", requiredCount: 1 },
        { positionId: "position-2", positionName: "스캔", requiredCount: 1 },
        { positionId: "position-3", positionName: "드레스", requiredCount: 1 },
      ],
      assignedCounts: { "position-1": 1, "position-2": 1, "position-3": 1 },
      assignedWorkerCount: 1,
    });
  });

  it("조인된 포지션이 없는 행(FK 정합성 예외)은 결과에서 제외한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [{ position_id: "orphan", required_count: 1, positions: null }],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: true, data: [], assignedCounts: {}, assignedWorkerCount: 0 });
  });

  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "denied" },
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 조회 오류는 COMMON_UNEXPECTED로 매핑한다", async () => {
    requirementsLimit.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("배정 수 조회가 실패하면 fail-closed로 전체를 실패 처리한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [{ position_id: "position-1", required_count: 1, positions: { name: "팀장" } }],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });
});
