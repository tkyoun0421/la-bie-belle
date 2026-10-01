import { jest } from "@jest/globals";

const { pressNotification } =
  await import("@/screens/notifications/model/pressNotification");

const DESTINATION = "/schedule?date=2025-09-13";
const IDS = ["notif-1"];

describe("pressNotification — 이동이 먼저고 읽음은 뒤따른다", () => {
  it("markRead가 아직 안 끝난 시점에 navigate는 이미 불려 있다", async () => {
    let resolveMarkRead: () => void = () => {};
    const markRead = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveMarkRead = resolve;
        }),
    );
    const navigate = jest.fn();

    const pending = pressNotification({
      ids: IDS,
      destination: DESTINATION,
      navigate,
      markRead,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(navigate).toHaveBeenCalledWith(DESTINATION);
    expect(markRead).toHaveBeenCalledWith(IDS);

    resolveMarkRead();
    await pending;
  });
});

describe("pressNotification — 읽음이 성공하면 조용히 끝난다", () => {
  it("navigate를 destination 그대로 한 번 부른다", async () => {
    const markRead = jest.fn(() => Promise.resolve());
    const navigate = jest.fn();

    await pressNotification({
      ids: IDS,
      destination: DESTINATION,
      navigate,
      markRead,
    });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(DESTINATION);
  });
});

describe("pressNotification — 읽음이 실패해도 예외가 위로 안 던져진다", () => {
  it("markRead가 reject해도 pressNotification은 던지지 않고 끝난다", async () => {
    const markRead = jest.fn(() => Promise.reject(new Error("읽음 실패")));
    const navigate = jest.fn();

    await expect(
      pressNotification({
        ids: IDS,
        destination: DESTINATION,
        navigate,
        markRead,
      }),
    ).resolves.toBeUndefined();

    expect(navigate).toHaveBeenCalledWith(DESTINATION);
  });
});
