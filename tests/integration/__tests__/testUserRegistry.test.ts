import {
  registerTestProfile,
  registerTestUser,
  takeRegistered,
  takeTracked,
  trackUser,
} from "@tests/integration/testUserRegistry";

afterEach(() => {
  takeTracked();
  takeRegistered();
});

describe("테스트 사용자 등록부", () => {
  it("등록한 사용자를 한 번에 꺼내고 꺼낸 뒤에는 비어 있다", () => {
    registerTestUser("user-a");
    registerTestUser("user-b");

    expect(takeRegistered().userIds).toEqual(["user-a", "user-b"]);
    expect(takeRegistered().userIds).toEqual([]);
  });

  it("같은 사용자를 두 번 등록해도 한 번만 꺼낸다", () => {
    registerTestUser("user-a");
    registerTestUser("user-a");

    expect(takeRegistered().userIds).toEqual(["user-a"]);
  });

  it("이 테스트 끝에 지울 사용자는 따로 꺼내고 파일 끝 목록에서는 빠진다", () => {
    registerTestUser("admin");
    registerTestUser("member");
    trackUser("member");

    expect(takeTracked().userIds).toEqual(["member"]);
    expect(takeTracked().userIds).toEqual([]);
    expect(takeRegistered().userIds).toEqual(["admin"]);
  });

  it("가입 헬퍼가 만든 profile id를 그 사용자와 같이 꺼낸다", () => {
    registerTestUser("user-a");
    registerTestProfile("user-a", "profile-a");
    registerTestUser("user-b");

    expect(takeRegistered()).toEqual({
      userIds: ["user-a", "user-b"],
      profileIds: ["profile-a"],
    });
    expect(takeRegistered()).toEqual({ userIds: [], profileIds: [] });
  });

  it("이 테스트 끝에 지울 사용자의 profile id도 같이 꺼내고 파일 끝 목록에서는 빠진다", () => {
    registerTestUser("admin");
    registerTestProfile("admin", "profile-admin");
    registerTestUser("member");
    registerTestProfile("member", "profile-member");
    trackUser("member");

    expect(takeTracked()).toEqual({
      userIds: ["member"],
      profileIds: ["profile-member"],
    });
    expect(takeRegistered()).toEqual({
      userIds: ["admin"],
      profileIds: ["profile-admin"],
    });
  });
});
