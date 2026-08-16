import { afterEach, describe, expect, it, vi } from "vitest";

type Listener = (event: never) => void;

type SelfStub = {
  addEventListener: (type: string, listener: Listener) => void;
  registration: { showNotification: ReturnType<typeof vi.fn> };
  clients: { matchAll: ReturnType<typeof vi.fn>; openWindow: ReturnType<typeof vi.fn> };
  location: { origin: string };
};

function createSelfStub(): { stub: SelfStub; listeners: Record<string, Listener> } {
  const listeners: Record<string, Listener> = {};
  const stub: SelfStub = {
    addEventListener: (type, listener) => {
      listeners[type] = listener;
    },
    registration: { showNotification: vi.fn() },
    clients: { matchAll: vi.fn().mockResolvedValue([]), openWindow: vi.fn() },
    location: { origin: "https://labiebelle.test" },
  };
  return { stub, listeners };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

const PUSH_SERVICE_WORKER_PATH = "../../../../../public/push-service-worker.js";

describe("push-service-worker", () => {
  it("push 이벤트를 해석해 showNotification을 호출한다", async () => {
    const { stub, listeners } = createSelfStub();
    vi.stubGlobal("self", stub);

    await import(PUSH_SERVICE_WORKER_PATH);

    const waitUntilCalls: Promise<unknown>[] = [];
    listeners.push?.({
      data: { json: () => ({ title: "제목", body: "본문", target: { screen: "pay" } }) },
      waitUntil: (promise: Promise<unknown>) => {
        waitUntilCalls.push(promise);
      },
    } as never);

    await Promise.all(waitUntilCalls);

    expect(stub.registration.showNotification).toHaveBeenCalledWith(
      "제목",
      expect.objectContaining({ body: "본문", icon: "/icons/icon-192.png" }),
    );
  });

  it("notificationclick 이벤트에서 알림을 닫고, 열린 창이 없으면 새 창을 연다", async () => {
    const { stub, listeners } = createSelfStub();
    vi.stubGlobal("self", stub);

    await import(PUSH_SERVICE_WORKER_PATH);

    const close = vi.fn();
    const waitUntilCalls: Promise<unknown>[] = [];
    listeners.notificationclick?.({
      notification: { data: { target: { screen: "pay" } }, close },
      waitUntil: (promise: Promise<unknown>) => {
        waitUntilCalls.push(promise);
      },
    } as never);

    await Promise.all(waitUntilCalls);

    expect(close).toHaveBeenCalledOnce();
    expect(stub.clients.openWindow).toHaveBeenCalledWith("https://labiebelle.test/pay");
  });

  it("notificationclick 이벤트에서 같은 경로를 이미 연 창이 있으면 focus한다", async () => {
    const { stub, listeners } = createSelfStub();
    const focus = vi.fn();
    stub.clients.matchAll.mockResolvedValue([{ url: "https://labiebelle.test/pay", focus }]);
    vi.stubGlobal("self", stub);

    await import(PUSH_SERVICE_WORKER_PATH);

    const waitUntilCalls: Promise<unknown>[] = [];
    listeners.notificationclick?.({
      notification: { data: { target: { screen: "pay" } }, close: vi.fn() },
      waitUntil: (promise: Promise<unknown>) => {
        waitUntilCalls.push(promise);
      },
    } as never);

    await Promise.all(waitUntilCalls);

    expect(focus).toHaveBeenCalledOnce();
    expect(stub.clients.openWindow).not.toHaveBeenCalled();
  });

  it("알 수 없는 target은 /notifications로 이동한다", async () => {
    const { stub, listeners } = createSelfStub();
    vi.stubGlobal("self", stub);

    await import(PUSH_SERVICE_WORKER_PATH);

    const waitUntilCalls: Promise<unknown>[] = [];
    listeners.notificationclick?.({
      notification: { data: { target: { screen: "unknown" } }, close: vi.fn() },
      waitUntil: (promise: Promise<unknown>) => {
        waitUntilCalls.push(promise);
      },
    } as never);

    await Promise.all(waitUntilCalls);

    expect(stub.clients.openWindow).toHaveBeenCalledWith("https://labiebelle.test/notifications");
  });
});
