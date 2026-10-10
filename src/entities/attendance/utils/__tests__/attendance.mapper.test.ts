import {
  toCheckIn,
  toExcuseStatus,
} from "@/entities/attendance/utils/attendance.mapper";

describe("toCheckIn — 세 때와 방법이 섞이지 않는다", () => {
  const ROW = {
    id: "checkin-1",
    day_id: "day-1",
    profile_id: "profile-1",
    checked_at: "2026-03-01T09:00:00Z",
    reported_at: "2026-03-01T09:01:00Z",
    received_at: "2026-03-01T09:02:00Z",
    method: "qr",
  };

  it("checked_at·reported_at·received_at이 각자 제 필드로 간다", () => {
    const checkIn = toCheckIn(ROW);

    expect(checkIn.checkedAt).toBe("2026-03-01T09:00:00Z");
    expect(checkIn.reportedAt).toBe("2026-03-01T09:01:00Z");
    expect(checkIn.receivedAt).toBe("2026-03-01T09:02:00Z");
  });

  it("id·day_id·profile_id·method가 각자 제 필드로 간다", () => {
    const checkIn = toCheckIn(ROW);

    expect(checkIn.id).toBe("checkin-1");
    expect(checkIn.dayId).toBe("day-1");
    expect(checkIn.profileId).toBe("profile-1");
    expect(checkIn.method).toBe("qr");
  });
});

describe("toExcuseStatus — 결정값이 정해진 값 안에서만 산다", () => {
  const ROW = {
    day_id: "day-1",
    profile_id: "profile-1",
    submitted_at: "2026-03-01T08:00:00Z",
    decided_at: null,
    decision: null,
  };

  it("decision이 정해진 값이면 그대로 간다", () => {
    const excuseStatus = toExcuseStatus({
      ...ROW,
      decided_at: "2026-03-02T00:00:00Z",
      decision: "approved",
    });

    expect(excuseStatus.decision).toBe("approved");
    expect(excuseStatus.decidedAt).toBe("2026-03-02T00:00:00Z");
  });

  it("decision이 null이면 null로 간다", () => {
    const excuseStatus = toExcuseStatus(ROW);

    expect(excuseStatus.decision).toBeNull();
  });

  it("decision이 정해진 값 밖이면 null로 떨어진다", () => {
    const excuseStatus = toExcuseStatus({ ...ROW, decision: "pending" });

    expect(excuseStatus.decision).toBeNull();
  });

  it("day_id와 profile_id가 섞이지 않고 각자 간다", () => {
    const excuseStatus = toExcuseStatus(ROW);

    expect(excuseStatus.dayId).toBe("day-1");
    expect(excuseStatus.profileId).toBe("profile-1");
  });
});
