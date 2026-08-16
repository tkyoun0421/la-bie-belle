import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requirementsLimit = vi.fn();
const requirementsEq = vi.fn(() => ({ limit: requirementsLimit }));
const requirementsSelect = vi.fn(() => ({ eq: requirementsEq }));

const assignmentsLimit = vi.fn();
const assignmentsEq = vi.fn(() => ({ limit: assignmentsLimit }));
const assignmentsSelect = vi.fn(() => ({ eq: assignmentsEq }));

const traineesLimit = vi.fn();
const traineesEq = vi.fn(() => ({ limit: traineesLimit }));
const traineesSelect = vi.fn(() => ({ eq: traineesEq }));

const from = vi.fn((table: string) => {
  if (table === "schedule_position_requirements") {
    return { select: requirementsSelect };
  }
  if (table === "assignments") {
    return { select: assignmentsSelect };
  }
  if (table === "assignment_trainees") {
    return { select: traineesSelect };
  }
  throw new Error(`unexpected table ${table}`);
});

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  requirementsLimit.mockReset();
  requirementsEq.mockClear();
  requirementsSelect.mockClear();
  assignmentsLimit.mockReset();
  assignmentsEq.mockClear();
  assignmentsSelect.mockClear();
  traineesLimit.mockReset();
  traineesLimit.mockResolvedValue({ data: [], error: null });
  traineesEq.mockClear();
  traineesSelect.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listScheduleRequirements", () => {
  it("스케줄의 필요 인원 표를 포지션명·배정 수와 함께 조회한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-1",
          required_count: 3,
          positions: { name: "팀장", sort_order: 10 },
        },
        {
          position_id: "position-2",
          required_count: 0,
          positions: { name: "드레스", sort_order: 40 },
        },
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
      traineeCounts: {},
      traineePositions: [],
    });
    expect(from).toHaveBeenCalledWith("schedule_position_requirements");
    expect(requirementsSelect).toHaveBeenCalledWith(
      "position_id, required_count, positions(name, sort_order)",
    );
    expect(requirementsEq).toHaveBeenCalledWith("schedule_id", "schedule-1");
    expect(requirementsLimit).toHaveBeenCalledWith(1000);
    expect(from).toHaveBeenCalledWith("assignments");
    expect(assignmentsSelect).toHaveBeenCalledWith("assignment_positions(position_id)");
    expect(assignmentsEq).toHaveBeenCalledWith("schedule_id", "schedule-1");
    expect(assignmentsLimit).toHaveBeenCalledWith(1000);
    expect(from).toHaveBeenCalledWith("assignment_trainees");
    expect(traineesSelect).toHaveBeenCalledWith("position_id, positions(name, sort_order)");
    expect(traineesEq).toHaveBeenCalledWith("schedule_id", "schedule-1");
    expect(traineesLimit).toHaveBeenCalledWith(1000);
  });

  it("AC5·9: 응답 행이 sort_order 오름차순으로 정렬된다(DB 정렬이 아니라 서버 코드 정렬)", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-guide",
          required_count: 2,
          positions: { name: "안내", sort_order: 90 },
        },
        {
          position_id: "position-lead",
          required_count: 1,
          positions: { name: "팀장", sort_order: 10 },
        },
        {
          position_id: "position-scan",
          required_count: 1,
          positions: { name: "스캔", sort_order: 20 },
        },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.map((row) => row.positionName)).toEqual(["팀장", "스캔", "안내"]);
  });

  it("AC5 경계값: sort_order 동률이면 이름순으로 보조 정렬한다(신규 포지션 기본값 1000)", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-b",
          required_count: 1,
          positions: { name: "라마바", sort_order: 1000 },
        },
        {
          position_id: "position-a",
          required_count: 1,
          positions: { name: "가나다", sort_order: 1000 },
        },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.map((row) => row.positionName)).toEqual(["가나다", "라마바"]);
  });

  it("배정이 없는 포지션은 assignedCounts에 등장하지 않는다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-1",
          required_count: 1,
          positions: { name: "팀장", sort_order: 10 },
        },
      ],
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
      traineeCounts: {},
      traineePositions: [],
    });
  });

  it("겸직으로 포지션 합계가 실인원보다 커도 assignedWorkerCount는 배정 행 수와 같다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-1",
          required_count: 1,
          positions: { name: "메인", sort_order: 30 },
        },
        {
          position_id: "position-2",
          required_count: 1,
          positions: { name: "스캔", sort_order: 20 },
        },
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
        { positionId: "position-2", positionName: "스캔", requiredCount: 1 },
        { positionId: "position-1", positionName: "메인", requiredCount: 1 },
      ],
      assignedCounts: { "position-1": 1, "position-2": 1 },
      assignedWorkerCount: 1,
      traineeCounts: {},
      traineePositions: [],
    });
  });

  it("AC6: 한 사람이 세 포지션을 겸해도 상한 없이 모두 집계된다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-1",
          required_count: 1,
          positions: { name: "메인", sort_order: 30 },
        },
        {
          position_id: "position-2",
          required_count: 1,
          positions: { name: "스캔", sort_order: 20 },
        },
        {
          position_id: "position-3",
          required_count: 1,
          positions: { name: "드레스", sort_order: 40 },
        },
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
        { positionId: "position-2", positionName: "스캔", requiredCount: 1 },
        { positionId: "position-1", positionName: "메인", requiredCount: 1 },
        { positionId: "position-3", positionName: "드레스", requiredCount: 1 },
      ],
      assignedCounts: { "position-1": 1, "position-2": 1, "position-3": 1 },
      assignedWorkerCount: 1,
      traineeCounts: {},
      traineePositions: [],
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

    expect(result).toEqual({
      ok: true,
      data: [],
      assignedCounts: {},
      assignedWorkerCount: 0,
      traineeCounts: {},
      traineePositions: [],
    });
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
      data: [
        {
          position_id: "position-1",
          required_count: 1,
          positions: { name: "팀장", sort_order: 10 },
        },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("AC5: 교육생 수 조회가 실패하면 fail-closed로 전체를 실패 처리한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-1",
          required_count: 1,
          positions: { name: "팀장", sort_order: 10 },
        },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });
    traineesLimit.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("AC5: 교육생을 포지션별로 세고 assignedCounts·assignedWorkerCount에는 섞지 않는다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-1",
          required_count: 1,
          positions: { name: "드레스", sort_order: 40 },
        },
        {
          position_id: "position-2",
          required_count: 1,
          positions: { name: "스캔", sort_order: 20 },
        },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({
      data: [{ assignment_positions: [{ position_id: "position-1" }] }],
      error: null,
    });
    traineesLimit.mockResolvedValue({
      data: [
        { position_id: "position-1" },
        { position_id: "position-1" },
        { position_id: "position-2" },
      ],
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({
      ok: true,
      data: [
        { positionId: "position-2", positionName: "스캔", requiredCount: 1 },
        { positionId: "position-1", positionName: "드레스", requiredCount: 1 },
      ],
      assignedCounts: { "position-1": 1 },
      assignedWorkerCount: 1,
      traineeCounts: { "position-1": 2, "position-2": 1 },
      traineePositions: [],
    });
  });

  it("revision 3(교차 검증 F-05): 요구 조회가 상한(1000행)에 닿으면 fail-closed로 처리한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: Array.from({ length: 1000 }, (_, i) => ({
        position_id: `position-${i}`,
        required_count: 1,
        positions: { name: `포지션${i}`, sort_order: 1000 },
      })),
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("revision 3(교차 검증 F-05): 배정 조회가 상한(1000행)에 닿으면 fail-closed로 처리한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-1",
          required_count: 1,
          positions: { name: "팀장", sort_order: 10 },
        },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({
      data: Array.from({ length: 1000 }, () => ({
        assignment_positions: [{ position_id: "position-1" }],
      })),
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("revision 3(교차 검증 F-05): 교육생 조회가 상한(1000행)에 닿으면 fail-closed로 처리한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-1",
          required_count: 1,
          positions: { name: "팀장", sort_order: 10 },
        },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });
    traineesLimit.mockResolvedValue({
      data: Array.from({ length: 1000 }, () => ({ position_id: "position-1" })),
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("revision 3(교차 검증 F-05) 경계값: 999행은 상한 미도달이라 성공으로 처리한다", async () => {
    requirementsLimit.mockResolvedValue({
      data: Array.from({ length: 999 }, (_, i) => ({
        position_id: `position-${i}`,
        required_count: 1,
        positions: { name: `포지션${i}`, sort_order: 1000 },
      })),
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result.ok).toBe(true);
  });

  it("AC5 경계값: 정식이 0명이고 교육생만 있는 포지션도 traineeCounts에 잡힌다", async () => {
    requirementsLimit.mockResolvedValue({
      data: [
        {
          position_id: "position-1",
          required_count: 2,
          positions: { name: "드레스", sort_order: 40 },
        },
      ],
      error: null,
    });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });
    traineesLimit.mockResolvedValue({
      data: [{ position_id: "position-1" }],
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result).toEqual({
      ok: true,
      data: [{ positionId: "position-1", positionName: "드레스", requiredCount: 2 }],
      assignedCounts: {},
      assignedWorkerCount: 0,
      traineeCounts: { "position-1": 1 },
      traineePositions: [],
    });
  });

  it("P3-T11: 교육생 포지션의 이름·정렬 정보를 중복 제거해 traineePositions로 반환한다", async () => {
    requirementsLimit.mockResolvedValue({ data: [], error: null });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });
    traineesLimit.mockResolvedValue({
      data: [
        { position_id: "position-scan", positions: { name: "스캔", sort_order: 20 } },
        { position_id: "position-scan", positions: { name: "스캔", sort_order: 20 } },
        { position_id: "position-main", positions: { name: "메인", sort_order: 30 } },
      ],
      error: null,
    });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.traineePositions).toEqual([
      { positionId: "position-scan", positionName: "스캔", sortOrder: 20 },
      { positionId: "position-main", positionName: "메인", sortOrder: 30 },
    ]);
  });

  it("P3-T11: 교육생이 0명이면 traineePositions도 빈 배열이다", async () => {
    requirementsLimit.mockResolvedValue({ data: [], error: null });
    assignmentsLimit.mockResolvedValue({ data: [], error: null });
    traineesLimit.mockResolvedValue({ data: [], error: null });

    const { listScheduleRequirements } =
      await import("@/entities/schedule/api/list-schedule-requirements");
    const result = await listScheduleRequirements("schedule-1");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.traineePositions).toEqual([]);
  });
});
