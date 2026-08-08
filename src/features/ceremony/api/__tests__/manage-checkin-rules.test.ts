import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireAdmin = vi.fn();
const insert = vi.fn();
const updateEq = vi.fn();
const update = vi.fn(() => ({ eq: updateEq }));
const deleteEq = vi.fn();
const del = vi.fn(() => ({ eq: deleteEq }));
const from = vi.fn(() => ({ insert, update, delete: del }));
const revalidatePath = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/entities/identity/api/require-admin", () => ({ requireAdmin }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

beforeEach(() => {
  requireAdmin.mockReset();
  requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
  insert.mockReset();
  updateEq.mockReset();
  update.mockClear();
  deleteEq.mockReset();
  del.mockClear();
  from.mockClear();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createCheckInRule", () => {
  it("admin은 규칙 행을 insert한다", async () => {
    insert.mockResolvedValue({ error: null });

    const { createCheckInRule } = await import("@/features/ceremony/api/manage-checkin-rules");
    const result = await createCheckInRule({
      firstCeremonyAt: "12:00",
      recommendedCheckIn: "10:10",
    });

    expect(result).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({
      first_ceremony_at: "12:00",
      recommended_check_in: "10:10",
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 insert 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { createCheckInRule } = await import("@/features/ceremony/api/manage-checkin-rules");
    const result = await createCheckInRule({
      firstCeremonyAt: "12:00",
      recommendedCheckIn: "10:10",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(insert).not.toHaveBeenCalled();
  });

  it("중복 first_ceremony_at(23505)은 SCHEDULING_VALIDATION으로 매핑한다", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });

    const { createCheckInRule } = await import("@/features/ceremony/api/manage-checkin-rules");
    const result = await createCheckInRule({
      firstCeremonyAt: "10:00",
      recommendedCheckIn: "08:00",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
  });
});

describe("updateCheckInRule", () => {
  it("admin은 first_ceremony_at 기준으로 recommended_check_in을 update한다", async () => {
    updateEq.mockResolvedValue({ error: null });

    const { updateCheckInRule } = await import("@/features/ceremony/api/manage-checkin-rules");
    const result = await updateCheckInRule({
      firstCeremonyAt: "10:00",
      recommendedCheckIn: "08:25",
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ recommended_check_in: "08:25" });
    expect(updateEq).toHaveBeenCalledWith("first_ceremony_at", "10:00");
    expect(revalidatePath).toHaveBeenCalledOnce();
  });
});

describe("deleteCheckInRule", () => {
  it("admin은 first_ceremony_at 기준으로 규칙을 delete한다", async () => {
    deleteEq.mockResolvedValue({ error: null });

    const { deleteCheckInRule } = await import("@/features/ceremony/api/manage-checkin-rules");
    const result = await deleteCheckInRule({ firstCeremonyAt: "10:00" });

    expect(result).toEqual({ ok: true });
    expect(deleteEq).toHaveBeenCalledWith("first_ceremony_at", "10:00");
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 delete 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { deleteCheckInRule } = await import("@/features/ceremony/api/manage-checkin-rules");
    const result = await deleteCheckInRule({ firstCeremonyAt: "10:00" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(deleteEq).not.toHaveBeenCalled();
  });
});
