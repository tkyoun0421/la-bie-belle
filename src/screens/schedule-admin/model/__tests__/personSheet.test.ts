// 구현 대상: src/screens/schedule-admin/model/personSheet.ts
//
// 사람 시트가 쓰는 표기다(schedule-admin.md 「사람 시트」·「사람 픽커 문안」). 성별 기호는
// lucide의 Venus·Mars로 색이 아니라 모양으로 가른다(ACC-002). 년생은 `birth_date`의 연도
// 뒤 두 자리다 — 만 나이를 세지 않는다(writing.md 「숫자와 단위」). 자격 값은 제한 포지션
// 중 이 사람이 들어갈 수 있는 것들이고 하나도 없으면 줄이 없다.

import {
  genderSymbol,
  genderLabel,
  birthYearShort,
  restrictedQualifications,
} from "@/screens/schedule-admin/model/personSheet";

describe("genderSymbol — female은 Venus, male은 Mars다", () => {
  it("female이면 Venus다", () => {
    expect(genderSymbol("female")).toBe("Venus");
  });

  it("male이면 Mars다", () => {
    expect(genderSymbol("male")).toBe("Mars");
  });
});

describe("genderLabel — 여·남 텍스트다", () => {
  it("female은 「여」다", () => {
    expect(genderLabel("female")).toBe("여");
  });

  it("male은 「남」이다", () => {
    expect(genderLabel("male")).toBe("남");
  });
});

describe("birthYearShort — 연도 뒤 두 자리 + 「년생」이다. 만 나이를 세지 않는다", () => {
  it("1998년생은 「98년생」이다", () => {
    expect(birthYearShort("1998-05-12")).toBe("98년생");
  });

  it("2005년생처럼 앞자리가 0이어도 두 자리를 지킨다", () => {
    expect(birthYearShort("2005-01-01")).toBe("05년생");
  });

  it("생일이 안 지났어도 그대로다 — 나이를 안 센다", () => {
    expect(birthYearShort("1998-12-31")).toBe("98년생");
  });
});

describe("restrictedQualifications — 제한 포지션 중 들어갈 수 있는 것만, README 순서로 낸다", () => {
  it("입력 순서와 달라도 팀장·스캔·메인·드레스·드레스실 순으로 낸다", () => {
    expect(restrictedQualifications(["드레스", "메인"])).toEqual([
      "메인",
      "드레스",
    ]);
  });

  it("제한 포지션이 아닌 값(리허설 등)은 빠진다", () => {
    expect(restrictedQualifications(["리허설", "스캔"])).toEqual(["스캔"]);
  });

  it("하나도 없으면 빈 배열이다", () => {
    expect(restrictedQualifications([])).toEqual([]);
  });
});
