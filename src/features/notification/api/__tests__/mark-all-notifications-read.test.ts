import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireActiveProfile = vi.fn();
const rpc = vi.fn();
const revalidatePath = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/entities/identity/api/require-active-profile", () => ({ requireActiveProfile }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

beforeEach(() => {
  requireActiveProfile.mockReset();
  requireActiveProfile.mockResolvedValue({ ok: true, profile: { status: "active" } });
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("markAllNotificationsRead", () => {
  it("활성 프로필이면 mark_all_notifications_read RPC를 호출하고 알림함을 재검증한다", async () => {
    rpc.mockResolvedValue({ data: 3, error: null });

    const { markAllNotificationsRead } =
      await import("@/features/notification/api/mark-all-notifications-read");
    const result = await markAllNotificationsRead();

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("mark_all_notifications_read");
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("활성 프로필이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireActiveProfile.mockResolvedValue({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });

    const { markAllNotificationsRead } =
      await import("@/features/notification/api/mark-all-notifications-read");
    const result = await markAllNotificationsRead();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("RPC 오류는 COMMON_UNEXPECTED로 거부하되 재검증은 수행한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { markAllNotificationsRead } =
      await import("@/features/notification/api/mark-all-notifications-read");
    const result = await markAllNotificationsRead();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });
});
