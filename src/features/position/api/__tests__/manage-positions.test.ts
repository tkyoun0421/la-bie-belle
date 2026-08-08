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

describe("createPosition", () => {
  const validInput = {
    name: "신규포지션",
    defaultRequiredCount: 2,
    genderRequirement: "any" as const,
    isDefault: false,
  };

  it("admin은 새 포지션을 insert한다", async () => {
    insert.mockResolvedValue({ error: null });

    const { createPosition } = await import("@/features/position/api/manage-positions");
    const result = await createPosition(validInput);

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("positions");
    expect(insert).toHaveBeenCalledWith({
      name: "신규포지션",
      default_required_count: 2,
      gender_requirement: "any",
      is_default: false,
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 insert 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { createPosition } = await import("@/features/position/api/manage-positions");
    const result = await createPosition(validInput);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(insert).not.toHaveBeenCalled();
  });

  it("빈 이름은 서버에서도 거부한다", async () => {
    const { createPosition } = await import("@/features/position/api/manage-positions");
    const result = await createPosition({ ...validInput, name: "  " });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(insert).not.toHaveBeenCalled();
  });

  it("이름 중복(23505)은 SCHEDULING_VALIDATION으로 매핑한다", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });

    const { createPosition } = await import("@/features/position/api/manage-positions");
    const result = await createPosition(validInput);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
  });
});

describe("updatePosition", () => {
  const validInput = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "수정된포지션",
    defaultRequiredCount: 3,
    genderRequirement: "female" as const,
    isDefault: true,
    isActive: false,
  };

  it("admin은 id 기준으로 포지션을 update한다", async () => {
    updateEq.mockResolvedValue({ error: null });

    const { updatePosition } = await import("@/features/position/api/manage-positions");
    const result = await updatePosition(validInput);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      name: "수정된포지션",
      default_required_count: 3,
      gender_requirement: "female",
      is_default: true,
      is_active: false,
    });
    expect(updateEq).toHaveBeenCalledWith("id", "11111111-1111-4111-8111-111111111111");
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("시스템 포지션 보호 위반(P0001)은 COMMON_UNEXPECTED로 매핑한다", async () => {
    updateEq.mockResolvedValue({ error: { code: "P0001", message: "protected" } });

    const { updatePosition } = await import("@/features/position/api/manage-positions");
    const result = await updatePosition(validInput);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});

describe("deletePosition", () => {
  it("admin은 id 기준으로 포지션을 delete한다", async () => {
    deleteEq.mockResolvedValue({ error: null });

    const { deletePosition } = await import("@/features/position/api/manage-positions");
    const result = await deletePosition({ id: "11111111-1111-4111-8111-111111111111" });

    expect(result).toEqual({ ok: true });
    expect(deleteEq).toHaveBeenCalledWith("id", "11111111-1111-4111-8111-111111111111");
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("사용 중인 포지션 delete(23503)는 SCHEDULING_POSITION_IN_USE로 매핑한다", async () => {
    deleteEq.mockResolvedValue({ error: { code: "23503", message: "fk violation" } });

    const { deletePosition } = await import("@/features/position/api/manage-positions");
    const result = await deletePosition({ id: "11111111-1111-4111-8111-111111111111" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_POSITION_IN_USE });
  });

  it("admin이 아니면 delete 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { deletePosition } = await import("@/features/position/api/manage-positions");
    const result = await deletePosition({ id: "11111111-1111-4111-8111-111111111111" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(deleteEq).not.toHaveBeenCalled();
  });
});
