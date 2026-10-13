import { jest } from "@jest/globals";

type Deps = {
  projectId: string | null;
  getPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: (o: { projectId: string }) => Promise<{
    data: string;
  }>;
};

const { readGrantedPushToken } =
  await import("@/features/auth/lib/devicePushToken.lib");

function depsWith(overrides: Partial<Deps> = {}) {
  const getExpoPushTokenAsync = jest.fn<Deps["getExpoPushTokenAsync"]>(
    async () => ({ data: "ExponentPushToken[0000]" }),
  );
  const deps: Deps = {
    projectId: "0000-0000",
    getPermissionsAsync: async () => ({ status: "granted" }),
    getExpoPushTokenAsync,
    ...overrides,
  };

  return { deps, getExpoPushTokenAsync };
}

describe("readGrantedPushToken — 창을 띄우지 않고 이 기기의 토큰만 읽는다", () => {
  it("권한이 허용이고 projectId가 있으면 토큰 문자열을 돌려준다", async () => {
    const { deps } = depsWith();

    await expect(readGrantedPushToken(deps)).resolves.toBe(
      "ExponentPushToken[0000]",
    );
  });

  it("토큰을 받을 때 projectId를 넘긴다", async () => {
    const { deps, getExpoPushTokenAsync } = depsWith();

    await readGrantedPushToken(deps);

    expect(getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: "0000-0000",
    });
  });

  it("권한이 거부면 널이고 토큰을 받으러 가지 않는다", async () => {
    const { deps, getExpoPushTokenAsync } = depsWith({
      getPermissionsAsync: async () => ({ status: "denied" }),
    });

    await expect(readGrantedPushToken(deps)).resolves.toBeNull();
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("권한을 아직 안 물었으면 널이고 토큰을 받으러 가지 않는다", async () => {
    const { deps, getExpoPushTokenAsync } = depsWith({
      getPermissionsAsync: async () => ({ status: "undetermined" }),
    });

    await expect(readGrantedPushToken(deps)).resolves.toBeNull();
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("projectId가 없으면 널이다", async () => {
    const { deps } = depsWith({ projectId: null });

    await expect(readGrantedPushToken(deps)).resolves.toBeNull();
  });

  it("토큰 받기가 던지면 널이다 — 던지지 않는다", async () => {
    const { deps } = depsWith({
      getExpoPushTokenAsync: async () => {
        throw new Error("network");
      },
    });

    await expect(readGrantedPushToken(deps)).resolves.toBeNull();
  });

  it("권한 읽기가 던져도 널이다", async () => {
    const { deps } = depsWith({
      getPermissionsAsync: async () => {
        throw new Error("native");
      },
    });

    await expect(readGrantedPushToken(deps)).resolves.toBeNull();
  });
});
