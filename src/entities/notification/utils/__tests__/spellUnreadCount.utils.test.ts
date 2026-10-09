const { spellUnreadCount } =
  await import("@/entities/notification/utils/spellUnreadCount.utils");

describe("spellUnreadCount — 안 읽은 수를 문안으로 옮긴다", () => {
  it("하나 이상이면 수를 들고 말한다", () => {
    expect(spellUnreadCount(3)).toBe("안 읽은 알림 3개");
  });

  it("없으면 수를 말하지 않는다", () => {
    expect(spellUnreadCount(0)).toBe("다 읽었어요");
  });

  it("음수는 없는 것으로 본다", () => {
    expect(spellUnreadCount(-1)).toBe("다 읽었어요");
  });
});
