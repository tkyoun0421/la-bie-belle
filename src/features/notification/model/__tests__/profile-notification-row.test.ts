const { getProfileNotificationRow } =
  await import("@/features/notification/model/profile-notification-row");

describe("getProfileNotificationRow — 읽는 중에는 스위치가 잠긴 채 움직이지 않는다", () => {
  it("로딩 갈래면 잠긴 스위치를 낸다", () => {
    expect(getProfileNotificationRow("loading", false)).toEqual({
      kind: "switch",
      state: "locked",
    });
  });
});

describe("getProfileNotificationRow — 권한 거부는 스위치 대신 안내 두 줄이다", () => {
  it("거부 갈래면 제목과 아래 줄을 낸다", () => {
    expect(getProfileNotificationRow("denied", false)).toEqual({
      kind: "notice",
      title: "알림이 꺼져 있어요",
      subline: "기기 설정에서 알림을 켜면 받을 수 있어요",
    });
  });

  it("보내는 중이어도 거부 갈래면 여전히 안내다", () => {
    expect(getProfileNotificationRow("denied", true)).toEqual({
      kind: "notice",
      title: "알림이 꺼져 있어요",
      subline: "기기 설정에서 알림을 켜면 받을 수 있어요",
    });
  });
});

describe("getProfileNotificationRow — 끔 갈래는 꺼진 스위치다", () => {
  it("off면 꺼진 스위치를 낸다", () => {
    expect(getProfileNotificationRow("off", false)).toEqual({
      kind: "switch",
      state: "off",
    });
  });
});

describe("getProfileNotificationRow — 켰으면 기기 유무와 상관없이 켜진 스위치다", () => {
  it("기기가 없어도 의사가 켜져 있으면 켜진 스위치다 — 안 닿는 것을 근무자에게 말하지 않는다", () => {
    expect(getProfileNotificationRow("no-device", false)).toEqual({
      kind: "switch",
      state: "on",
    });
  });

  it("닿는 갈래도 켜진 스위치다", () => {
    expect(getProfileNotificationRow("reachable", false)).toEqual({
      kind: "switch",
      state: "on",
    });
  });
});

describe("getProfileNotificationRow — 보내는 중에는 켜짐·꺼짐과 상관없이 잠긴다", () => {
  it("off인데 보내는 중이면 잠긴 스위치다", () => {
    expect(getProfileNotificationRow("off", true)).toEqual({
      kind: "switch",
      state: "locked",
    });
  });

  it("닿는 갈래인데 보내는 중이면 잠긴 스위치다", () => {
    expect(getProfileNotificationRow("reachable", true)).toEqual({
      kind: "switch",
      state: "locked",
    });
  });
});
