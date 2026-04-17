import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAppActor } from "../useAppActor";
import { useSession } from "next-auth/react"; // 만약 next-auth를 쓴다면

// 현재 프로젝트는 Supabase Auth를 직접 쓸 수도 있으므로, 
// 실제 프로젝트에서 사용하는 Auth 라이브러리에 맞게 Mocking 합니다.

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

describe("useAppActor", () => {
  it("should return current actor information", () => {
    // 테스트 작성
  });
});
