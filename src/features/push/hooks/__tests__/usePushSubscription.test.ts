import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const savePushSubscription = vi.fn();
const removePushSubscription = vi.fn();

vi.mock("@/features/push/api/save-push-subscription", () => ({ savePushSubscription }));
vi.mock("@/features/push/api/remove-push-subscription", () => ({ removePushSubscription }));
vi.mock("@/shared/config/env.client", () => ({
  env: { NEXT_PUBLIC_VAPID_PUBLIC_KEY: "Zml4dHVyZS12YXBpZC1rZXk" },
}));

type FakePushSubscription = {
  endpoint: string;
  toJSON: () => { endpoint: string; keys: { p256dh: string; auth: string } };
  unsubscribe: () => Promise<boolean>;
};

function createFakeSubscription(endpoint: string): FakePushSubscription {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: "p256dh-value", auth: "auth-value" } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
}

function setupSupportedBrowser(options?: { existingSubscription?: FakePushSubscription | null }) {
  const existingSubscription = options?.existingSubscription ?? null;
  const getSubscription = vi.fn().mockResolvedValue(existingSubscription);
  const subscribeFn = vi.fn();
  const registration = {
    pushManager: { getSubscription, subscribe: subscribeFn },
  };
  const register = vi.fn().mockResolvedValue(registration);
  const requestPermission = vi.fn().mockResolvedValue("granted");

  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    serviceWorker: { register, ready: Promise.resolve(registration) },
    userAgent: globalThis.navigator.userAgent,
  });
  vi.stubGlobal("PushManager", function PushManager() {});
  vi.stubGlobal("Notification", { permission: "default", requestPermission });
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));

  return { register, registration, getSubscription, subscribeFn, requestPermission };
}

beforeEach(() => {
  savePushSubscription.mockReset();
  savePushSubscription.mockResolvedValue({ ok: true });
  removePushSubscription.mockReset();
  removePushSubscription.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("usePushSubscription", () => {
  it("push API를 지원하지 않는 환경에서는 status가 unsupported고 등록을 시도하지 않는다", async () => {
    const { usePushSubscription } = await import("@/features/push/hooks/usePushSubscription");
    const { result } = renderHook(() => usePushSubscription());

    expect(result.current.status).toBe("unsupported");
  });

  it("지원 환경에서 마운트하면 SW를 등록하고 미구독이면 status가 ready가 된다", async () => {
    const { register, getSubscription } = setupSupportedBrowser();

    const { usePushSubscription } = await import("@/features/push/hooks/usePushSubscription");
    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(register).toHaveBeenCalledWith("/push-service-worker.js", {
      scope: "/",
      updateViaCache: "none",
    });
    expect(getSubscription).toHaveBeenCalledOnce();
  });

  it("이미 구독 중이면 마운트 후 status가 subscribed가 된다", async () => {
    setupSupportedBrowser({
      existingSubscription: createFakeSubscription("https://push.example/existing"),
    });

    const { usePushSubscription } = await import("@/features/push/hooks/usePushSubscription");
    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => expect(result.current.status).toBe("subscribed"));
  });

  it("subscribe: 권한을 요청하고 구독을 만들어 저장 액션을 호출한 뒤 subscribed가 된다", async () => {
    const { subscribeFn, requestPermission } = setupSupportedBrowser();
    subscribeFn.mockResolvedValue(createFakeSubscription("https://push.example/new"));

    const { usePushSubscription } = await import("@/features/push/hooks/usePushSubscription");
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const outcome = await result.current.subscribe();

    expect(requestPermission).toHaveBeenCalledOnce();
    expect(savePushSubscription).toHaveBeenCalledWith({
      endpoint: "https://push.example/new",
      p256dh: "p256dh-value",
      auth: "auth-value",
    });
    expect(outcome).toEqual({ ok: true });
    await waitFor(() => expect(result.current.status).toBe("subscribed"));
  });

  it("subscribe: 권한이 거부되면 저장 액션을 호출하지 않고 실패를 반환한다", async () => {
    const { requestPermission } = setupSupportedBrowser();
    requestPermission.mockResolvedValue("denied");

    const { usePushSubscription } = await import("@/features/push/hooks/usePushSubscription");
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const outcome = await result.current.subscribe();

    expect(outcome).toEqual({ ok: false });
    expect(savePushSubscription).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.status).toBe("permission-denied"));
  });

  it("unsubscribe: 브라우저 구독을 해지하고 해지 액션을 호출한 뒤 subscribed가 false가 된다", async () => {
    const fakeSubscription = createFakeSubscription("https://push.example/existing");
    setupSupportedBrowser({ existingSubscription: fakeSubscription });

    const { usePushSubscription } = await import("@/features/push/hooks/usePushSubscription");
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("subscribed"));

    const outcome = await result.current.unsubscribe();

    expect(fakeSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(removePushSubscription).toHaveBeenCalledWith({
      endpoint: "https://push.example/existing",
    });
    expect(outcome).toEqual({ ok: true });
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });
});
