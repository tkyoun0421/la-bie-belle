import { jest } from "@jest/globals";

const store = new Map<string, string>();

jest.unstable_mockModule("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
  },
}));

const { SERVER_CLOCK_STORAGE_KEY } =
  await import("@/entities/clock/consts/clock.const");
const { serverClockStore } =
  await import("@/entities/clock/stores/clock.store");

beforeEach(() => {
  store.clear();
  serverClockStore.setState({ offset: 0 });
});

describe("serverClockStore.adopt — 서버 시각으로 오프셋을 정한다", () => {
  it("서버 시각에서 기기 시각을 뺀 값을 오프셋으로 든다", () => {
    const deviceNowMs = Date.parse("2026-03-02T09:00:00Z");

    serverClockStore.getState().adopt("2026-03-02T09:00:05Z", deviceNowMs);

    expect(serverClockStore.getState().offset).toBe(5000);
  });

  it("정한 오프셋을 저장소에 쓴다", async () => {
    const deviceNowMs = Date.parse("2026-03-02T09:00:00Z");

    serverClockStore.getState().adopt("2026-03-02T09:00:05Z", deviceNowMs);
    await Promise.resolve();

    expect(store.get(SERVER_CLOCK_STORAGE_KEY)).toBe("5000");
  });
});

describe("serverClockStore.restore — 저장된 오프셋을 되살린다", () => {
  it("저장된 숫자를 오프셋으로 든다", async () => {
    store.set(SERVER_CLOCK_STORAGE_KEY, "-1200");

    await serverClockStore.getState().restore();

    expect(serverClockStore.getState().offset).toBe(-1200);
  });

  it("저장된 것이 없으면 0이다", async () => {
    serverClockStore.setState({ offset: 777 });

    await serverClockStore.getState().restore();

    expect(serverClockStore.getState().offset).toBe(0);
  });

  it("숫자가 아닌 글자가 저장돼 있으면 0이다", async () => {
    store.set(SERVER_CLOCK_STORAGE_KEY, "abc");

    await serverClockStore.getState().restore();

    expect(serverClockStore.getState().offset).toBe(0);
  });
});
