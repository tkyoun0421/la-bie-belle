import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";
import { positionRank } from "@/entities/schedule/model/positionRank.policy";

describe("positionRank — 포지션의 몇째 자리인지", () => {
  it("정본 순서의 아홉 포지션은 그 순서대로 0부터 아홉째까지다", () => {
    expect(POSITION_ORDER.map((position) => positionRank(position))).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("순서 표에 없는 포지션은 맨 뒤다", () => {
    expect(positionRank("없는포지션")).toBe(POSITION_ORDER.length);
  });

  it("빈 글자도 맨 뒤다", () => {
    expect(positionRank("")).toBe(POSITION_ORDER.length);
  });

  it("없는 포지션은 아는 포지션 어느 것보다 뒤에 선다", () => {
    const last = Math.max(
      ...POSITION_ORDER.map((position) => positionRank(position)),
    );

    expect(positionRank("없는포지션")).toBeGreaterThan(last);
  });
});
