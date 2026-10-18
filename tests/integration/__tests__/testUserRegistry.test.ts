import {
  registerTestUser,
  takeRegisteredUsers,
  takeTrackedUsers,
  trackUser,
} from "@tests/integration/testUserRegistry";

afterEach(() => {
  takeTrackedUsers();
  takeRegisteredUsers();
});

describe("테스트 사용자 등록부", () => {
  it("등록한 사용자를 한 번에 꺼내고 꺼낸 뒤에는 비어 있다", () => {
    registerTestUser("user-a");
    registerTestUser("user-b");

    expect(takeRegisteredUsers()).toEqual(["user-a", "user-b"]);
    expect(takeRegisteredUsers()).toEqual([]);
  });

  it("같은 사용자를 두 번 등록해도 한 번만 꺼낸다", () => {
    registerTestUser("user-a");
    registerTestUser("user-a");

    expect(takeRegisteredUsers()).toEqual(["user-a"]);
  });

  it("이 테스트 끝에 지울 사용자는 따로 꺼내고 파일 끝 목록에서는 빠진다", () => {
    registerTestUser("admin");
    registerTestUser("member");
    trackUser("member");

    expect(takeTrackedUsers()).toEqual(["member"]);
    expect(takeTrackedUsers()).toEqual([]);
    expect(takeRegisteredUsers()).toEqual(["admin"]);
  });
});
