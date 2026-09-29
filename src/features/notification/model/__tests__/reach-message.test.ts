const { getMemberListSuffix, getMemberSheetLine, getUnreachableConfirmLine } =
  await import("@/features/notification/model/reach-message");

describe("getMemberListSuffix — 직원 목록 줄의 알림 표시 문안", () => {
  it("스스로 끈 재직자는 '· 알림 꺼둠'이다", () => {
    expect(getMemberListSuffix("off", true)).toBe("· 알림 꺼둠");
  });

  it("기기가 안 연결된 재직자는 '· 기기 안 연결'이다", () => {
    expect(getMemberListSuffix("no-device", true)).toBe("· 기기 안 연결");
  });

  it("받을 수 있는 사람에게는 어느 갈래에도 아무것도 안 선다", () => {
    expect(getMemberListSuffix("reachable", true)).toBeNull();
  });

  it("퇴사자에게는 갈래가 무엇이든 아무것도 안 선다", () => {
    expect(getMemberListSuffix("off", false)).toBeNull();
  });
});

describe("getMemberSheetLine — 사람 시트의 알림 표시 문안", () => {
  it("스스로 끈 재직자는 '알림을 꺼두었어요'다", () => {
    expect(getMemberSheetLine("off", true)).toBe("알림을 꺼두었어요");
  });

  it("기기가 안 연결된 재직자는 '기기에서 알림을 꺼서 안 가요'다", () => {
    expect(getMemberSheetLine("no-device", true)).toBe(
      "기기에서 알림을 꺼서 안 가요",
    );
  });

  it("받을 수 있는 사람에게는 어느 갈래에도 아무것도 안 선다", () => {
    expect(getMemberSheetLine("reachable", true)).toBeNull();
  });

  it("퇴사자에게는 갈래가 무엇이든 아무것도 안 선다", () => {
    expect(getMemberSheetLine("no-device", false)).toBeNull();
  });
});

describe("getUnreachableConfirmLine — 확정 뒤 확인 자리는 갈래를 안 가르고 한 줄로 합친다", () => {
  it("스스로 끈 사람도 '{이름} 님은 알림을 못 받아요 · 따로 연락해주세요'다", () => {
    expect(getUnreachableConfirmLine("박서연", "off", true)).toBe(
      "박서연 님은 알림을 못 받아요 · 따로 연락해주세요",
    );
  });

  it("기기가 안 연결된 사람도 같은 한 줄이다", () => {
    expect(getUnreachableConfirmLine("박서연", "no-device", true)).toBe(
      "박서연 님은 알림을 못 받아요 · 따로 연락해주세요",
    );
  });

  it("받을 수 있는 사람에게는 어느 갈래에도 아무것도 안 선다", () => {
    expect(getUnreachableConfirmLine("박서연", "reachable", true)).toBeNull();
  });

  it("퇴사자에게는 갈래가 무엇이든 아무것도 안 선다", () => {
    expect(getUnreachableConfirmLine("박서연", "off", false)).toBeNull();
  });
});
