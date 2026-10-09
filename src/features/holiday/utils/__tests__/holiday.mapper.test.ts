import { toHolidayImportEntry } from "@/features/holiday/utils/holiday.mapper";

describe("toHolidayImportEntry — import_holidays가 받는 키로 옮긴다", () => {
  it("날짜가 `holiday_date` 키로 간다", () => {
    const entry = toHolidayImportEntry({
      date: "2026-10-09",
      name: "한글날",
    });

    expect(entry).toEqual({ holiday_date: "2026-10-09", name: "한글날" });
  });

  it("키가 그 둘뿐이다", () => {
    const entry = toHolidayImportEntry({ date: "2026-03-01", name: "삼일절" });

    expect(Object.keys(entry).sort()).toEqual(["holiday_date", "name"]);
  });
});
