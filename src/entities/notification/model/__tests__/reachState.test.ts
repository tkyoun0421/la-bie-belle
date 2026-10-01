const { getReachState } =
  await import("@/features/notification/model/reachState");

describe("getReachState — 값을 다 못 읽은 동안은 로딩이라 네 갈래 중 무엇도 아니다", () => {
  it("의사를 아직 못 읽었으면 로딩이다", () => {
    expect(
      getReachState({
        notificationsEnabled: null,
        hasDevice: true,
        permission: "granted",
      }),
    ).toBe("loading");
  });

  it("기기 주소 유무를 아직 못 읽었으면 로딩이다", () => {
    expect(
      getReachState({
        notificationsEnabled: true,
        hasDevice: null,
        permission: "granted",
      }),
    ).toBe("loading");
  });

  it("권한 상태를 아직 못 읽었으면 로딩이다", () => {
    expect(
      getReachState({
        notificationsEnabled: true,
        hasDevice: true,
        permission: null,
      }),
    ).toBe("loading");
  });
});

describe("getReachState — 권한 거부가 넷째 갈래로 갈리고 의사·기기보다 앞선다", () => {
  it("의사를 켰고 기기가 있어도 권한을 거부했으면 거부 갈래다", () => {
    expect(
      getReachState({
        notificationsEnabled: true,
        hasDevice: true,
        permission: "denied",
      }),
    ).toBe("denied");
  });

  it("의사를 꺼두고 기기도 없는데 권한까지 거부했어도 거부 갈래로 읽힌다", () => {
    expect(
      getReachState({
        notificationsEnabled: false,
        hasDevice: false,
        permission: "denied",
      }),
    ).toBe("denied");
  });
});

describe("getReachState — 의사가 꺼져 있으면 끔이다", () => {
  it("권한이 허락 상태여도 의사가 꺼져 있으면 끔이다", () => {
    expect(
      getReachState({
        notificationsEnabled: false,
        hasDevice: true,
        permission: "granted",
      }),
    ).toBe("off");
  });

  it("권한이 안 물어본 상태여도 의사가 꺼져 있으면 끔이다", () => {
    expect(
      getReachState({
        notificationsEnabled: false,
        hasDevice: false,
        permission: "undetermined",
      }),
    ).toBe("off");
  });
});

describe("getReachState — 켰는데 기기가 없으면 기기 없음이다", () => {
  it("의사는 참인데 기기 주소가 없으면 기기 없음이다", () => {
    expect(
      getReachState({
        notificationsEnabled: true,
        hasDevice: false,
        permission: "granted",
      }),
    ).toBe("no-device");
  });
});

describe("getReachState — 켰고 기기가 있으면 닿는다", () => {
  it("의사도 참이고 기기 주소도 있으면 닿는 갈래다", () => {
    expect(
      getReachState({
        notificationsEnabled: true,
        hasDevice: true,
        permission: "granted",
      }),
    ).toBe("reachable");
  });

  it("권한이 안 물어본 상태여도 의사와 기기가 다 있으면 닿는 갈래다", () => {
    expect(
      getReachState({
        notificationsEnabled: true,
        hasDevice: true,
        permission: "undetermined",
      }),
    ).toBe("reachable");
  });
});
