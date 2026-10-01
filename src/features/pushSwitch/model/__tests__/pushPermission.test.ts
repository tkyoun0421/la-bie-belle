import { jest } from "@jest/globals";

type DeviceStatus = "granted" | "denied" | "undetermined";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

const { mapPermissionStatus, getPushPermission, requestPushPermission } =
  await import("@/features/notification/model/pushPermission");

describe("mapPermissionStatus — 기기 응답을 권한 상태 셋으로 옮긴다", () => {
  it("granted 응답은 granted다", () => {
    expect(mapPermissionStatus({ status: "granted" })).toBe("granted");
  });

  it("denied 응답은 denied다", () => {
    expect(mapPermissionStatus({ status: "denied" })).toBe("denied");
  });

  it("안 물어본 상태는 undetermined다", () => {
    expect(mapPermissionStatus({ status: "undetermined" })).toBe(
      "undetermined",
    );
  });
});

describe("getPushPermission — 상태를 읽기만 하고 아무것도 묻지 않는다", () => {
  it("기기 조회 함수를 한 번 불러 상태를 그대로 옮긴다", async () => {
    const getPermissionsAsync = jest.fn(async () => ({
      status: "undetermined" as DeviceStatus,
    }));

    const result = await getPushPermission(getPermissionsAsync);

    expect(result).toBe("undetermined");
    expect(getPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});

describe("requestPushPermission — 안드로이드는 채널을 먼저 만들고 나서 권한을 묻는다", () => {
  it("채널 생성이 끝나기 전에는 권한을 묻지 않는다", async () => {
    const channelDeferred = createDeferred<void>();
    const setNotificationChannelAsync = jest.fn(() => channelDeferred.promise);
    const requestPermissionsAsync = jest.fn(async () => ({
      status: "granted" as DeviceStatus,
    }));
    const getExpoPushTokenAsync = jest.fn(async () => ({
      data: "ExponentPushToken[a]",
    }));

    const pending = requestPushPermission({
      platform: "android",
      projectId: "project-a",
      setNotificationChannelAsync,
      requestPermissionsAsync,
      getExpoPushTokenAsync,
    });

    await Promise.resolve();
    expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(requestPermissionsAsync).not.toHaveBeenCalled();

    channelDeferred.resolve();

    await pending;
    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});

describe("requestPushPermission — iOS는 채널을 안 만든다", () => {
  it("플랫폼이 ios면 채널 생성 함수를 아예 안 부른다", async () => {
    const setNotificationChannelAsync = jest.fn(async () => {});
    const requestPermissionsAsync = jest.fn(async () => ({
      status: "granted" as DeviceStatus,
    }));
    const getExpoPushTokenAsync = jest.fn(async () => ({
      data: "ExponentPushToken[a]",
    }));

    await requestPushPermission({
      platform: "ios",
      projectId: "project-a",
      setNotificationChannelAsync,
      requestPermissionsAsync,
      getExpoPushTokenAsync,
    });

    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("requestPushPermission — 허락하면 projectId를 실어 주소를 받아 함께 낸다", () => {
  it("granted면 getExpoPushTokenAsync에 projectId를 넘기고 받은 주소를 돌려준다", async () => {
    const requestPermissionsAsync = jest.fn(async () => ({
      status: "granted" as DeviceStatus,
    }));
    const getExpoPushTokenAsync = jest.fn(async () => ({
      data: "exp-tok[abc]",
    }));

    const result = await requestPushPermission({
      platform: "ios",
      projectId: "project-a",
      setNotificationChannelAsync: jest.fn(async () => {}),
      requestPermissionsAsync,
      getExpoPushTokenAsync,
    });

    expect(getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: "project-a",
    });
    expect(result).toEqual({
      permission: "granted",
      token: "exp-tok[abc]",
    });
  });
});

describe("requestPushPermission — 주소 발급이 실패해도 던지지 않고 기기 없음으로 돌려준다", () => {
  it("getExpoPushTokenAsync가 거부돼도 예외 없이 token이 null이다", async () => {
    const requestPermissionsAsync = jest.fn(async () => ({
      status: "granted" as DeviceStatus,
    }));
    const getExpoPushTokenAsync = jest.fn(async () => {
      throw new Error("주소를 못 받았다");
    });

    const result = await requestPushPermission({
      platform: "ios",
      projectId: "project-a",
      setNotificationChannelAsync: jest.fn(async () => {}),
      requestPermissionsAsync,
      getExpoPushTokenAsync,
    });

    expect(result).toEqual({ permission: "granted", token: null });
  });
});

describe("requestPushPermission — projectId가 없으면 주소를 시도하지 않고 기기 없음이다", () => {
  it("projectId가 null이면 getExpoPushTokenAsync를 안 부르고 token이 null이다", async () => {
    const requestPermissionsAsync = jest.fn(async () => ({
      status: "granted" as DeviceStatus,
    }));
    const getExpoPushTokenAsync = jest.fn(async () => ({
      data: "exp-tok[abc]",
    }));

    const result = await requestPushPermission({
      platform: "ios",
      projectId: null,
      setNotificationChannelAsync: jest.fn(async () => {}),
      requestPermissionsAsync,
      getExpoPushTokenAsync,
    });

    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ permission: "granted", token: null });
  });
});

describe("requestPushPermission — 거부되면 주소를 시도하지 않는다", () => {
  it("denied면 token 요청 없이 거부 결과만 낸다", async () => {
    const requestPermissionsAsync = jest.fn(async () => ({
      status: "denied" as DeviceStatus,
    }));
    const getExpoPushTokenAsync = jest.fn(async () => ({
      data: "exp-tok[abc]",
    }));

    const result = await requestPushPermission({
      platform: "ios",
      projectId: "project-a",
      setNotificationChannelAsync: jest.fn(async () => {}),
      requestPermissionsAsync,
      getExpoPushTokenAsync,
    });

    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ permission: "denied" });
  });
});
