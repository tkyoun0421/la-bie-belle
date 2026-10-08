import { formatBirthDate } from "@/entities/profile/utils/formatBirthDate.utils";

describe("formatBirthDate — 생년월일과 오늘을 견줘 만 나이를 같이 적는다", () => {
  it("생일 전날에는 아직 나이를 안 더한다", () => {
    const label = formatBirthDate(
      "1992-03-04",
      "2026-03-03T12:00:00.000+09:00",
    );

    expect(label).toBe("1992년 3월 4일(33세)");
  });

  it("생일 당일에는 나이를 더한다", () => {
    const label = formatBirthDate(
      "1992-03-04",
      "2026-03-04T00:00:01.000+09:00",
    );

    expect(label).toBe("1992년 3월 4일(34세)");
  });

  it("생일 다음날에도 이미 더한 나이가 그대로다", () => {
    const label = formatBirthDate(
      "1992-03-04",
      "2026-03-05T12:00:00.000+09:00",
    );

    expect(label).toBe("1992년 3월 4일(34세)");
  });

  it("2월 29일생은 평년 2월 28일까지는 아직 나이를 안 더한다", () => {
    const label = formatBirthDate(
      "2000-02-29",
      "2027-02-28T23:59:00.000+09:00",
    );

    expect(label).toBe("2000년 2월 29일(26세)");
  });

  it("2월 29일생은 평년 3월 1일에 나이를 더한다", () => {
    const label = formatBirthDate(
      "2000-02-29",
      "2027-03-01T00:00:01.000+09:00",
    );

    expect(label).toBe("2000년 2월 29일(27세)");
  });
});
