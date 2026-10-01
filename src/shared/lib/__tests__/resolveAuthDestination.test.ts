import {
  resolveAuthDestination,
  resolveGateMove,
} from "@/shared/lib/resolve-auth-destination";

const emptyProfile = { approvedAt: null, blockedAt: null, leftAt: null };

describe("resolveAuthDestination — 세션과 프로필 상태로 목적지를 가른다", () => {
  it("세션이 없으면 프로필이 승인 상태여도 로그인 화면으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: false,
      profile: {
        approvedAt: "2026-09-01T00:00:00.000Z",
        blockedAt: null,
        leftAt: null,
      },
    });

    expect(destination).toBe("/login");
  });

  it("프로필 행이 없으면 승인 대기 화면으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: true,
      profile: null,
    });

    expect(destination).toBe("/pending");
  });

  it("승인 시각이 없으면 승인 대기 화면으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: true,
      profile: emptyProfile,
    });

    expect(destination).toBe("/pending");
  });

  it("차단 시각이 있으면 승인·퇴사 여부와 무관하게 차단 화면으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: true,
      profile: {
        approvedAt: "2026-09-01T00:00:00.000Z",
        blockedAt: "2026-09-05T00:00:00.000Z",
        leftAt: "2026-09-10T00:00:00.000Z",
      },
    });

    expect(destination).toBe("/blocked");
  });

  it("차단되지 않고 퇴사 시각만 있으면 승인 시각이 있어도 퇴사 화면으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: true,
      profile: {
        approvedAt: "2026-09-01T00:00:00.000Z",
        blockedAt: null,
        leftAt: "2026-09-10T00:00:00.000Z",
      },
    });

    expect(destination).toBe("/left");
  });

  it("승인 시각만 있으면 홈으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: true,
      profile: {
        approvedAt: "2026-09-01T00:00:00.000Z",
        blockedAt: null,
        leftAt: null,
      },
    });

    expect(destination).toBe("/");
  });
});

describe("resolveGateMove — 게이트 경로 사이의 이동을 가른다", () => {
  it("승인 대기 화면에 있는데 목적지가 홈이면 홈으로 옮긴다", () => {
    expect(resolveGateMove("/", "/pending")).toBe("/");
  });

  it("로그인 화면에 있는데 목적지가 대기 화면이면 대기 화면으로 옮긴다", () => {
    expect(resolveGateMove("/pending", "/login")).toBe("/pending");
  });

  it("이미 제 자리인 차단 화면은 옮기지 않는다", () => {
    expect(resolveGateMove("/blocked", "/blocked")).toBeNull();
  });

  it("일반 경로에 있는데 목적지가 차단 화면이면 차단 화면으로 옮긴다", () => {
    expect(resolveGateMove("/blocked", "/")).toBe("/blocked");
  });

  it("승인된 사람이 홈을 열면 옮기지 않는다", () => {
    expect(resolveGateMove("/", "/")).toBeNull();
  });

  it("승인된 사람이 일반 경로를 열면 옮기지 않는다", () => {
    expect(resolveGateMove("/", "/schedule")).toBeNull();
  });
});
