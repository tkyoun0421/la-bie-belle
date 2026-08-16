import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireActiveProfile = vi.fn();
const rpc = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/entities/identity/api/require-active-profile", () => ({ requireActiveProfile }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  requireActiveProfile.mockReset();
  requireActiveProfile.mockResolvedValue({ ok: true, profile: { status: "active" } });
  rpc.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("savePushSubscription", () => {
  it("활성 프로필이면 endpoint·p256dh·auth로 save_push_subscription RPC를 호출한다", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    const { savePushSubscription } = await import("@/features/push/api/save-push-subscription");
    const result = await savePushSubscription({
      endpoint: "https://push.example/device-1",
      p256dh: "p256dh-value",
      auth: "auth-value",
    });

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("save_push_subscription", {
      target_endpoint: "https://push.example/device-1",
      target_p256dh: "p256dh-value",
      target_auth: "auth-value",
    });
  });

  it("활성 프로필이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireActiveProfile.mockResolvedValue({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });

    const { savePushSubscription } = await import("@/features/push/api/save-push-subscription");
    const result = await savePushSubscription({
      endpoint: "https://push.example/device-1",
      p256dh: "p256dh-value",
      auth: "auth-value",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("RPC 오류는 COMMON_UNEXPECTED로 거부한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { savePushSubscription } = await import("@/features/push/api/save-push-subscription");
    const result = await savePushSubscription({
      endpoint: "https://push.example/device-1",
      p256dh: "p256dh-value",
      auth: "auth-value",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
