import { describe, it, expect, vi } from "vitest";
import { readEventApplicants } from "#/entities/assignments/repositories/readAssignmentRepository";

describe("readAssignmentRepository", () => {
  describe("readEventApplicants", () => {
    it("should return applicants with conflict flags", async () => {
      const mockEventId = "11111111-1111-4111-a111-111111111111";
      const mockDate = "2026-04-18";
      
      const mockClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
      } as never;

      mockClient.single.mockResolvedValueOnce({ data: { event_date: mockDate }, error: null });

      mockClient.in.mockResolvedValueOnce({
        data: [
          { user_id: "22222222-2222-4222-a222-222222222222", event_id: "33333333-3333-4333-a333-333333333333" },
          { user_id: "44444444-4444-4444-a444-444444444444", event_id: mockEventId }
        ],
        error: null
      });

      mockClient.order.mockResolvedValueOnce({
        data: [
          {
            id: "55555555-5555-4555-a555-555555555555",
            user_id: "22222222-2222-4222-a222-222222222222",
            applied_at: new Date().toISOString(),
            users: { id: "22222222-2222-4222-a222-222222222222", name: "Conflict User", email: "conflict@test.com" }
          },
          {
            id: "66666666-6666-4666-a666-666666666666",
            user_id: "44444444-4444-4444-a444-444444444444",
            applied_at: new Date().toISOString(),
            users: { id: "44444444-4444-4444-a444-444444444444", name: "Ok User", email: "ok@test.com" }
          }
        ],
        error: null
      });

      const result = await readEventApplicants(mockEventId, { client: mockClient });

      expect(result).toHaveLength(2);
      expect(result.find(a => a.userId === "22222222-2222-4222-a222-222222222222")?.hasConflict).toBe(true);
      expect(result.find(a => a.userId === "44444444-4444-4444-a444-444444444444")?.hasConflict).toBe(false);
    });
  });
});
