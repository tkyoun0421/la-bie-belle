import {
  areaPointsOf,
  isLabelledMonth,
  linePointsOf,
  plot,
  segmentsOf,
  selectedPointOf,
  valueLabelBottomOf,
  type PlotPoint,
  type TrendChartPoint,
} from "@/shared/utils/trendChart.utils";

function point(month: number, value: number | null): TrendChartPoint {
  return { month, value };
}

function plotPoint(index: number, x: number, y: number): PlotPoint {
  return { index, x, y };
}

describe("plot — 점이 없으면 빈 배열이다", () => {
  it("점이 하나도 없으면 빈 배열을 낸다", () => {
    expect(plot([], 100)).toEqual([]);
  });

  it("값이 있어도 너비가 0이면 빈 배열을 낸다", () => {
    expect(plot([point(1, 5)], 0)).toEqual([]);
  });
});

describe("plot — 점이 하나면 칼럼 중앙과 상하 중간에 선다", () => {
  it("값 하나짜리 점의 좌표가 x=50, y=48이다", () => {
    expect(plot([point(3, 10)], 100)).toEqual([plotPoint(0, 50, 48)]);
  });
});

describe("plot — 값이 모두 같으면 범위가 0이라 y가 다 같다", () => {
  it("세 점 모두 y=48이고 x만 칼럼 폭만큼씩 벌어진다", () => {
    expect(plot([point(1, 5), point(2, 5), point(3, 5)], 300)).toEqual([
      plotPoint(0, 50, 48),
      plotPoint(1, 150, 48),
      plotPoint(2, 250, 48),
    ]);
  });
});

describe("plot — 너비가 칼럼 폭을 통해 x 좌표에 들어간다", () => {
  it("너비 200에 점 둘이면 칼럼이 100이라 x가 50과 150이다", () => {
    expect(plot([point(1, 1), point(2, 2)], 200)).toEqual([
      plotPoint(0, 50, 91),
      plotPoint(1, 150, 5),
    ]);
  });
});

describe("plot — 값이 null인 점은 원래 인덱스를 지닌 채 결과에서 빠진다", () => {
  it("가운뎃점이 null이면 결과에 인덱스 0과 2만 남는다", () => {
    expect(plot([point(1, 10), point(2, null), point(3, 20)], 300)).toEqual([
      plotPoint(0, 50, 91),
      plotPoint(2, 250, 5),
    ]);
  });
});

describe("segmentsOf — 인덱스가 이어지는 점들을 한 구간으로 묶는다", () => {
  it("인덱스 0·1·2가 연속이면 구간 하나에 셋이 다 든다", () => {
    const plotted = [
      plotPoint(0, 0, 0),
      plotPoint(1, 1, 1),
      plotPoint(2, 2, 2),
    ];

    expect(segmentsOf(plotted)).toEqual([plotted]);
  });
});

describe("segmentsOf — 인덱스가 한 칸보다 더 벌어지면 그 자리에서 구간이 끊긴다", () => {
  it("인덱스 1 다음이 3이면 구간이 거기서 둘로 나뉜다", () => {
    const a = plotPoint(0, 0, 0);
    const b = plotPoint(1, 1, 1);
    const c = plotPoint(3, 3, 3);
    const d = plotPoint(4, 4, 4);

    expect(segmentsOf([a, b, c, d])).toEqual([
      [a, b],
      [c, d],
    ]);
  });
});

describe("segmentsOf — 길이가 1인 구간은 결과에서 빠진다", () => {
  it("이웃 없이 혼자인 점은 구간으로 안 남는다", () => {
    expect(segmentsOf([plotPoint(5, 5, 5)])).toEqual([]);
  });

  it("모두 떨어져 있는 점 셋도 구간이 전부 사라진다", () => {
    expect(
      segmentsOf([plotPoint(0, 0, 0), plotPoint(2, 2, 2), plotPoint(4, 4, 4)]),
    ).toEqual([]);
  });
});

describe("segmentsOf — 빈 입력은 빈 구간 목록이다", () => {
  it("점이 하나도 없으면 빈 배열을 낸다", () => {
    expect(segmentsOf([])).toEqual([]);
  });
});

describe("linePointsOf — 점들을 'x,y' 꼴로 이어 공백으로 붙인다", () => {
  it("점 둘이면 'x,y x,y' 꼴 문자열이 된다", () => {
    expect(linePointsOf([plotPoint(0, 10, 20), plotPoint(1, 30, 40)])).toBe(
      "10,20 30,40",
    );
  });

  it("점이 하나면 좌표 하나만 낸다", () => {
    expect(linePointsOf([plotPoint(0, 5, 15)])).toBe("5,15");
  });
});

describe("areaPointsOf — 선 좌표 뒤에 차트 바닥(y=96)으로 내려가는 좌표 둘을 더 붙인다", () => {
  it("점 둘짜리 구간이면 마지막 x, 처음 x 순서로 바닥 좌표가 붙는다", () => {
    expect(areaPointsOf([plotPoint(0, 10, 20), plotPoint(1, 30, 40)])).toBe(
      "10,20 30,40 30,96 10,96",
    );
  });

  it("점 하나짜리 구간도 바닥 좌표 둘이 붙어 같은 x가 두 번 나온다", () => {
    expect(areaPointsOf([plotPoint(0, 5, 15)])).toBe("5,15 5,96 5,96");
  });
});

const LABEL_POINTS = [point(1, 5), point(2, null), point(3, 9)];

describe("selectedPointOf — 고른 달의 찍힌 점을 낸다", () => {
  it("값이 있는 달이면 그 점의 인덱스와 좌표를 낸다", () => {
    expect(selectedPointOf(plot(LABEL_POINTS, 300), LABEL_POINTS, 3)).toEqual(
      plotPoint(2, 250, 5),
    );
  });

  it("값이 없는 달이면 undefined다", () => {
    expect(
      selectedPointOf(plot(LABEL_POINTS, 300), LABEL_POINTS, 2),
    ).toBeUndefined();
  });

  it("목록에 없는 달이면 undefined다", () => {
    expect(
      selectedPointOf(plot(LABEL_POINTS, 300), LABEL_POINTS, 12),
    ).toBeUndefined();
  });

  it("찍힌 점이 하나도 없으면 undefined다", () => {
    expect(selectedPointOf([], LABEL_POINTS, 3)).toBeUndefined();
  });
});

describe("valueLabelBottomOf — 값 라벨은 점 위로 간격만큼 띄운다", () => {
  it("y=48이면 56이다", () => {
    expect(valueLabelBottomOf(48)).toBe(56);
  });

  it("y=5면 99다", () => {
    expect(valueLabelBottomOf(5)).toBe(99);
  });
});

describe("isLabelledMonth — 1·4·7·10월에만 달 이름을 붙인다", () => {
  it.each([1, 4, 7, 10])("%i월은 붙인다", (month) => {
    expect(isLabelledMonth(month)).toBe(true);
  });

  it.each([2, 3, 12])("%i월은 안 붙인다", (month) => {
    expect(isLabelledMonth(month)).toBe(false);
  });
});
