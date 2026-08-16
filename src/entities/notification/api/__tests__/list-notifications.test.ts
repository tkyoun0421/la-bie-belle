import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const limit = vi.fn();
const order = vi.fn(() => ({ limit }));
const select = vi.fn(() => ({ order }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  limit.mockReset();
  order.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listNotifications", () => {
  it("최근 순으로 정렬·상한을 명시해 조회하고 unreadCount를 함께 반환한다", async () => {
    limit.mockResolvedValue({
      data: [
        {
          id: "notification-1",
          title: "근무 배정이 확정됐어요",
          body: "8월 9일 근무가 확정됐어요",
          created_at: "2026-08-06T09:00:00+09:00",
          read_at: null,
          target: { screen: "schedule-detail", date: "2026-08-09" },
        },
        {
          id: "notification-2",
          title: "예상 급여가 갱신됐어요",
          body: "이번 달 예상 급여를 확인하세요",
          created_at: "2026-07-20T10:00:00+09:00",
          read_at: "2026-07-21T10:00:00+09:00",
          target: { screen: "pay" },
        },
      ],
      error: null,
    });

    const { listNotifications } = await import("@/entities/notification/api/list-notifications");
    const result = await listNotifications();

    expect(from).toHaveBeenCalledWith("notifications");
    expect(select).toHaveBeenCalledWith("id, title, body, created_at, read_at, target");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(1000);
    expect(result).toEqual({
      ok: true,
      items: [
        {
          id: "notification-1",
          title: "근무 배정이 확정됐어요",
          body: "8월 9일 근무가 확정됐어요",
          occurredAt: "2026-08-06T09:00:00+09:00",
          read: false,
          target: { screen: "schedule-detail", date: "2026-08-09" },
        },
        {
          id: "notification-2",
          title: "예상 급여가 갱신됐어요",
          body: "이번 달 예상 급여를 확인하세요",
          occurredAt: "2026-07-20T10:00:00+09:00",
          read: true,
          target: { screen: "pay" },
        },
      ],
      unreadCount: 1,
    });
  });

  it("schedule screen을 month와 함께 파싱해 목록에 포함한다", async () => {
    limit.mockResolvedValue({
      data: [
        {
          id: "notification-schedule",
          title: "새 근무 모집이 열렸어요",
          body: "8월 10일~8월 12일 근무 모집이 열렸어요",
          created_at: "2026-08-06T09:00:00+09:00",
          read_at: null,
          target: { screen: "schedule", month: "2026-08" },
        },
      ],
      error: null,
    });

    const { listNotifications } = await import("@/entities/notification/api/list-notifications");
    const result = await listNotifications();

    expect(result.ok).toBe(true);
    expect(result.ok && result.items).toEqual([
      {
        id: "notification-schedule",
        title: "새 근무 모집이 열렸어요",
        body: "8월 10일~8월 12일 근무 모집이 열렸어요",
        occurredAt: "2026-08-06T09:00:00+09:00",
        read: false,
        target: { screen: "schedule", month: "2026-08" },
      },
    ]);
  });

  it("schedule screen의 month 형식이 불량이면 목록에서 제외한다", async () => {
    limit.mockResolvedValue({
      data: [
        {
          id: "notification-bad-month",
          title: "새 근무 모집이 열렸어요",
          body: "8월 10일~8월 12일 근무 모집이 열렸어요",
          created_at: "2026-08-06T09:00:00+09:00",
          read_at: null,
          target: { screen: "schedule", month: "2026-8" },
        },
      ],
      error: null,
    });

    const { listNotifications } = await import("@/entities/notification/api/list-notifications");
    const result = await listNotifications();

    expect(result).toEqual({ ok: true, items: [], unreadCount: 0 });
  });

  it("데이터가 없으면 빈 목록과 unreadCount 0을 반환한다", async () => {
    limit.mockResolvedValue({ data: null, error: null });

    const { listNotifications } = await import("@/entities/notification/api/list-notifications");
    const result = await listNotifications();

    expect(result).toEqual({ ok: true, items: [], unreadCount: 0 });
  });

  it("알 수 없는 screen 값을 가진 행은 목록에서 제외한다", async () => {
    limit.mockResolvedValue({
      data: [
        {
          id: "notification-known",
          title: "근무 배정이 확정됐어요",
          body: "8월 9일 근무가 확정됐어요",
          created_at: "2026-08-06T09:00:00+09:00",
          read_at: null,
          target: { screen: "schedule-detail", date: "2026-08-09" },
        },
        {
          id: "notification-unknown",
          title: "알 수 없는 알림",
          body: "알 수 없는 본문",
          created_at: "2026-08-05T09:00:00+09:00",
          read_at: null,
          target: { screen: "unknown-screen" },
        },
      ],
      error: null,
    });

    const { listNotifications } = await import("@/entities/notification/api/list-notifications");
    const result = await listNotifications();

    expect(result.ok).toBe(true);
    expect(result.ok && result.items.map((item) => item.id)).toEqual(["notification-known"]);
    expect(result.ok && result.unreadCount).toBe(1);
  });

  it("조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    limit.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listNotifications } = await import("@/entities/notification/api/list-notifications");
    const result = await listNotifications();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
