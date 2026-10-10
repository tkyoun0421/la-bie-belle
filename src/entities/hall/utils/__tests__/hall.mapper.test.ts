import { toHallDefaults } from "@/entities/hall/utils/hall.mapper";

describe("toHallDefaults — 자리·시작·끝이 섞이지 않는다", () => {
  it("default_slots가 slots로, default_starts·default_ends가 각자 간다", () => {
    const hallDefaults = toHallDefaults({
      default_slots: [{ positions: ["서빙"], count: 2 }],
      default_starts: "10:00:00",
      default_ends: "18:00:00",
    });

    expect(hallDefaults.slots).toEqual([{ positions: ["서빙"], count: 2 }]);
    expect(hallDefaults.starts).toBe("10:00:00");
    expect(hallDefaults.ends).toBe("18:00:00");
  });

  it("자리가 없으면 빈 배열로 간다", () => {
    const hallDefaults = toHallDefaults({
      default_slots: [],
      default_starts: "09:00:00",
      default_ends: "17:00:00",
    });

    expect(hallDefaults.slots).toEqual([]);
  });
});
