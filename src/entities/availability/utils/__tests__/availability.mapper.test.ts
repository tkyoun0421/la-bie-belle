import { toAvailability } from "@/entities/availability/utils/availability.mapper";

describe("toAvailability — 신청 행을 옮긴다", () => {
  it("조인으로 온 이름이 `name`으로 올라온다", () => {
    const availability = toAvailability({
      profile_id: "p1",
      work_date: "2026-10-20",
      profiles: { display_name: "홍길동" },
    });

    expect(availability).toEqual({
      profileId: "p1",
      workDate: "2026-10-20",
      name: "홍길동",
    });
  });

  it("이름을 안 읽는 질의라도 선다", () => {
    const availability = toAvailability({
      profile_id: "p2",
      work_date: "2026-10-21",
      profiles: null,
    });

    expect(availability.name).toBeNull();
    expect(availability.workDate).toBe("2026-10-21");
  });
});
