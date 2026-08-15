import { describe, expect, it } from "vitest";

import {
  mapConfirmedRoster,
  mapConfirmedRosterRow,
  type ConfirmedRosterRow,
} from "@/entities/schedule/model/confirmed-roster";

describe("mapConfirmedRosterRow", () => {
  it("스네이크 케이스 RPC 행을 카멜 케이스로 옮긴다", () => {
    const row = mapConfirmedRosterRow({
      name: "김민준",
      position_name: "매니저",
      sort_order: 80,
      is_trainee: false,
      is_self: true,
    });

    expect(row).toEqual({
      name: "김민준",
      positionName: "매니저",
      sortOrder: 80,
      isTrainee: false,
      isSelf: true,
    });
  });

  it("타입 수준에서 시급·연락처·생년월일·성별 필드를 정의하지 않는다", () => {
    type ForbiddenKeys = "hourlyWage" | "hourlyWageSnapshot" | "phone" | "birthDate" | "gender";
    type Overlap = Extract<keyof ConfirmedRosterRow, ForbiddenKeys>;
    const hasNoForbiddenKeys: Overlap extends never ? true : false = true;

    expect(hasNoForbiddenKeys).toBe(true);
  });
});

describe("mapConfirmedRoster", () => {
  it("예정 시각·예식 목록·roster 행을 카멜 케이스로 옮긴다", () => {
    const roster = mapConfirmedRoster({
      planned_checkin: "09:00",
      planned_checkout: "18:00",
      ceremonies: ["10:00", "14:00"],
      roster: [
        {
          name: "정하은",
          position_name: "매니저",
          sort_order: 80,
          is_trainee: false,
          is_self: false,
        },
      ],
      revision: 1,
      revised_at: "2026-08-15T10:23:02.000000+00:00",
    });

    expect(roster).toEqual({
      plannedCheckin: "09:00",
      plannedCheckout: "18:00",
      ceremonyTimes: ["10:00", "14:00"],
      roster: [
        { name: "정하은", positionName: "매니저", sortOrder: 80, isTrainee: false, isSelf: false },
      ],
      revision: 1,
      revisedAt: "2026-08-15T10:23:02.000000+00:00",
    });
  });

  it("roster가 빈 배열이면 빈 배열을 그대로 옮긴다", () => {
    const roster = mapConfirmedRoster({
      planned_checkin: "09:00",
      planned_checkout: "18:00",
      ceremonies: [],
      roster: [],
      revision: 3,
      revised_at: "2026-08-15T10:23:02.000000+00:00",
    });

    expect(roster.roster).toEqual([]);
    expect(roster.ceremonyTimes).toEqual([]);
  });

  it("revision·revisedAt을 그대로 옮긴다(P3-T09)", () => {
    const roster = mapConfirmedRoster({
      planned_checkin: "09:00",
      planned_checkout: "18:00",
      ceremonies: [],
      roster: [],
      revision: 5,
      revised_at: "2026-08-15T11:00:00.000000+00:00",
    });

    expect(roster.revision).toBe(5);
    expect(roster.revisedAt).toBe("2026-08-15T11:00:00.000000+00:00");
  });
});
