import { describe, expect, it } from "vitest";
import { initialValuesOf } from "@/screens/pending/model/resubmit-initial";

describe("initialValuesOf — 거절된 뒤 다시 보낼 때 지난 값을 채운다", () => {
  it("프로필 행과 연락처 행이 둘 다 있으면 넷을 채운다", () => {
    const values = initialValuesOf(
      { display_name: "테스트 이름" },
      { phone: "010-1234-5678", birth_date: "1993-04-21", gender: "female" },
    );

    expect(values).toEqual({
      displayName: "테스트 이름",
      gender: "female",
      birth: "19930421",
      phone: "010-1234-5678",
    });
  });

  it("둘 다 없으면 빈 값이다", () => {
    const values = initialValuesOf(null, null);

    expect(values).toEqual({
      displayName: "",
      gender: null,
      birth: "",
      phone: "",
    });
  });

  it("연락처 행만 없으면 이름만 채워지고 나머지는 빈 값이다", () => {
    const values = initialValuesOf({ display_name: "테스트 이름" }, null);

    expect(values).toEqual({
      displayName: "테스트 이름",
      gender: null,
      birth: "",
      phone: "",
    });
  });
});
