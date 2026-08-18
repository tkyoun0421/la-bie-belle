import { describe, expect, it } from "vitest";

import { HOME_BLOCK_NAMES } from "@/views/home/model/home-view-model";

describe("home-view-model (revision 10 — 홈은 읽을 쿼리가 없어 뷰 모델 타입을 이 모델이 소유한다)", () => {
  it("홈의 다섯 블록 이름을 NOTES 라운드 6이 적은 순서 그대로 낸다", () => {
    expect(HOME_BLOCK_NAMES).toEqual(["notices", "today", "week", "upcoming", "pay"]);
  });

  it("블록은 다섯뿐이다", () => {
    expect(HOME_BLOCK_NAMES).toHaveLength(5);
  });
});
