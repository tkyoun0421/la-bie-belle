const { isForegroundEntry } =
  await import("@/features/notification/model/app-entry");

describe("isForegroundEntry — 앱이 뜰 때와 포그라운드로 돌아올 때가 진입이다", () => {
  it("이전 상태를 모르는 첫 진입에서 active로 오면 진입이다", () => {
    expect(isForegroundEntry(null, "active")).toBe(true);
  });

  it("백그라운드에서 active로 돌아오면 진입이다", () => {
    expect(isForegroundEntry("background", "active")).toBe(true);
  });

  it("inactive에서 active로 돌아와도 진입이다", () => {
    expect(isForegroundEntry("inactive", "active")).toBe(true);
  });
});

describe("isForegroundEntry — 이미 앞에 있던 상태는 진입이 아니다", () => {
  it("active에서 active로 온 전이는 진입이 아니다 — 화면을 오가는 것이 여기 걸리면 안 된다", () => {
    expect(isForegroundEntry("active", "active")).toBe(false);
  });
});

describe("isForegroundEntry — 앞으로 나오는 전이가 아니면 진입이 아니다", () => {
  it("active에서 background로 가는 것은 진입이 아니다", () => {
    expect(isForegroundEntry("active", "background")).toBe(false);
  });

  it("background에서 inactive로 가는 것도 진입이 아니다", () => {
    expect(isForegroundEntry("background", "inactive")).toBe(false);
  });
});
