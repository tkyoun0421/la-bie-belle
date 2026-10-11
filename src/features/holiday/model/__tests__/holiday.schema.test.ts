import {
  parseHolidayApiResponse,
  toIsoDate,
} from "@/features/holiday/model/holiday.schema";

describe("toIsoDate — 8자리 숫자 날짜를 YYYY-MM-DD로 옮긴다", () => {
  it("20261003이 2026-10-03이 된다", () => {
    expect(toIsoDate(20261003)).toBe("2026-10-03");
  });
});

describe("toIsoDate — locdate가 숫자 대신 문자열로 와도 같은 날짜를 낸다", () => {
  it("문자열 20261003도 2026-10-03이 된다", () => {
    expect(toIsoDate("20261003")).toBe("2026-10-03");
  });
});

describe("parseHolidayApiResponse — 항목이 하나면 item이 배열이 아니라 객체 하나로 와도 한 건으로 읽는다", () => {
  it("어린이날 하나짜리 응답이 배열 길이 1로 읽힌다", () => {
    const body = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: {
          items: {
            item: {
              dateKind: "01",
              dateName: "어린이날",
              isHoliday: "Y",
              locdate: 20260505,
              seq: 1,
            },
          },
          numOfRows: 10,
          pageNo: 1,
          totalCount: 1,
        },
      },
    };

    expect(parseHolidayApiResponse(body)).toEqual([
      { date: "2026-05-05", name: "어린이날" },
    ]);
  });
});

describe("parseHolidayApiResponse — 여러 항목이 배열로 오면 전부 정확히 옮긴다", () => {
  it("개천절과 한글날 둘 다 date·name 쌍으로 담긴다", () => {
    const body = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: {
          items: {
            item: [
              {
                dateKind: "01",
                dateName: "개천절",
                isHoliday: "Y",
                locdate: 20261003,
                seq: 1,
              },
              {
                dateKind: "01",
                dateName: "한글날",
                isHoliday: "Y",
                locdate: 20261009,
                seq: 2,
              },
            ],
          },
          numOfRows: 10,
          pageNo: 1,
          totalCount: 2,
        },
      },
    };

    expect(parseHolidayApiResponse(body)).toEqual([
      { date: "2026-10-03", name: "개천절" },
      { date: "2026-10-09", name: "한글날" },
    ]);
  });
});

describe("parseHolidayApiResponse — items가 빈 문자열이면 빈 배열이다", () => {
  it("결과 없음을 나타내는 빈 문자열 items가 빈 배열로 읽힌다", () => {
    const body = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: { items: "", numOfRows: 10, pageNo: 1, totalCount: 0 },
      },
    };

    expect(parseHolidayApiResponse(body)).toEqual([]);
  });
});

describe("parseHolidayApiResponse — isHoliday가 N인 항목은 빠진다", () => {
  it("절기(N)는 버리고 공휴일(Y)만 남긴다", () => {
    const body = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: {
          items: {
            item: [
              {
                dateKind: "02",
                dateName: "경칩",
                isHoliday: "N",
                locdate: 20260305,
                seq: 1,
              },
              {
                dateKind: "01",
                dateName: "삼일절",
                isHoliday: "Y",
                locdate: 20260301,
                seq: 2,
              },
            ],
          },
          numOfRows: 10,
          pageNo: 1,
          totalCount: 2,
        },
      },
    };

    expect(parseHolidayApiResponse(body)).toEqual([
      { date: "2026-03-01", name: "삼일절" },
    ]);
  });
});

describe("parseHolidayApiResponse — locdate가 문자열로 와도 숫자일 때와 같은 값을 낸다", () => {
  it("문자열 20261003이 2026-10-03으로 옮겨진다", () => {
    const body = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: {
          items: {
            item: {
              dateKind: "01",
              dateName: "개천절",
              isHoliday: "Y",
              locdate: "20261003",
              seq: 1,
            },
          },
          numOfRows: 10,
          pageNo: 1,
          totalCount: 1,
        },
      },
    };

    expect(parseHolidayApiResponse(body)).toEqual([
      { date: "2026-10-03", name: "개천절" },
    ]);
  });
});

describe("parseHolidayApiResponse — body가 null이면 던지지 않고 빈 배열이다", () => {
  it("null 입력이 빈 배열로 읽힌다", () => {
    expect(parseHolidayApiResponse(null)).toEqual([]);
  });
});

describe("parseHolidayApiResponse — body가 undefined면 던지지 않고 빈 배열이다", () => {
  it("undefined 입력이 빈 배열로 읽힌다", () => {
    expect(parseHolidayApiResponse(undefined)).toEqual([]);
  });
});

describe("parseHolidayApiResponse — body가 문자열이면 던지지 않고 빈 배열이다", () => {
  it("응답이 아닌 일반 문자열이 빈 배열로 읽힌다", () => {
    expect(parseHolidayApiResponse("서버 오류")).toEqual([]);
  });
});

describe("parseHolidayApiResponse — body가 숫자면 던지지 않고 빈 배열이다", () => {
  it("숫자 하나가 빈 배열로 읽힌다", () => {
    expect(parseHolidayApiResponse(42)).toEqual([]);
  });
});

describe("parseHolidayApiResponse — 봉투가 통째로 없으면 던지지 않고 빈 배열이다", () => {
  it("response.body가 아예 없는 응답(NODATA_ERROR류)이 빈 배열로 읽힌다", () => {
    const body = {
      response: {
        header: { resultCode: "03", resultMsg: "NODATA_ERROR" },
      },
    };

    expect(parseHolidayApiResponse(body)).toEqual([]);
  });
});

describe("parseHolidayApiResponse — item이 빈 배열이면 던지지 않고 빈 배열이다", () => {
  it("item: []이 빈 배열 그대로 읽힌다", () => {
    const body = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: {
          items: { item: [] },
          numOfRows: 10,
          pageNo: 1,
          totalCount: 0,
        },
      },
    };

    expect(parseHolidayApiResponse(body)).toEqual([]);
  });
});

describe("parseHolidayApiResponse — 항목에 dateName이 없으면 던지지 않고 빈 배열이다", () => {
  it("dateName이 빠진 모양 어긋난 항목이 빈 배열로 읽힌다", () => {
    const body = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: {
          items: {
            item: {
              dateKind: "01",
              isHoliday: "Y",
              locdate: 20260505,
              seq: 1,
            },
          },
          numOfRows: 10,
          pageNo: 1,
          totalCount: 1,
        },
      },
    };

    expect(parseHolidayApiResponse(body)).toEqual([]);
  });
});

describe("parseHolidayApiResponse — 여럿 가운데 하나만 모양이 깨져도 이미 쌓은 나머지까지 버려진다", () => {
  it("정상 둘 사이에 dateName이 빠진 항목이 섞이면 빈 배열이다", () => {
    const body = {
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: {
          items: {
            item: [
              {
                dateKind: "01",
                dateName: "개천절",
                isHoliday: "Y",
                locdate: 20261003,
                seq: 1,
              },
              {
                dateKind: "01",
                isHoliday: "Y",
                locdate: 20261006,
                seq: 2,
              },
              {
                dateKind: "01",
                dateName: "한글날",
                isHoliday: "Y",
                locdate: 20261009,
                seq: 3,
              },
            ],
          },
          numOfRows: 10,
          pageNo: 1,
          totalCount: 3,
        },
      },
    };

    expect(parseHolidayApiResponse(body)).toEqual([]);
  });
});
