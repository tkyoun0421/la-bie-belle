import { describe, it, expect, vi } from "vitest";
import { approveReplacementAction } from "../actions/approveReplacement";
import { replacementErrorCodes } from "#/entities/replacements/models/errors/replacementError";

describe("approveReplacementAction", () => {
  const mockActor = { userId: "11111111-1111-4111-a111-111111111111", role: "admin" as const };
  const mockRequestId = "22222222-2222-4222-a222-222222222222";
  const mockUserId = "33333333-3333-4333-a333-333333333333";
  const mockEventId = "44444444-4444-4444-a444-444444444444";
  const mockPositionId = "55555555-5555-4555-a555-555555555555";
  const mockCancelledAssignmentId = "66666666-6666-4666-a666-666666666666";
  const mockNewAssignmentId = "77777777-7777-4777-a777-777777777777";

  const mockRequest = {
    id: mockRequestId,
    status: "open" as const,
    cancelledAssignmentId: mockCancelledAssignmentId,
    positionId: mockPositionId,
    cancelledUserId: "88888888-8888-4888-a888-888888888888",
  };

  const mockDependencies = {
    requireActor: vi.fn().mockResolvedValue(mockActor),
    readRequest: vi.fn().mockResolvedValue(mockRequest),
    updateRequestStatus: vi.fn().mockResolvedValue(undefined),
    updateAssignmentStatus: vi.fn().mockResolvedValue(undefined),
    createAssignment: vi.fn().mockResolvedValue(mockNewAssignmentId),
    client: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { event_id: mockEventId }, error: null }),
    } as any,
  };

  it("should approve replacement successfully", async () => {
    const result = await approveReplacementAction(
      { replacementRequestId: mockRequestId, userId: mockUserId },
      mockDependencies
    );

    expect(result).toEqual({
      requestId: mockRequestId,
      newAssignmentId: mockNewAssignmentId,
    });

    expect(mockDependencies.createAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: mockEventId,
        positionId: mockPositionId,
        userId: mockUserId,
      }),
      expect.anything()
    );

    expect(mockDependencies.updateAssignmentStatus).toHaveBeenCalledWith(
      mockCancelledAssignmentId,
      "cancelled",
      expect.anything()
    );

    expect(mockDependencies.updateRequestStatus).toHaveBeenCalledWith(
      mockRequestId,
      "approved",
      expect.objectContaining({
        approvedAssignmentId: mockNewAssignmentId,
        closedBy: mockActor.userId,
      })
    );
  });

  it("should throw if user is not admin or manager", async () => {
    const memberDependencies = {
      ...mockDependencies,
      requireActor: vi.fn().mockResolvedValue({ userId: "99999999-9999-4999-a999-999999999999", role: "member" }),
    };

    await expect(
      approveReplacementAction(
        { replacementRequestId: mockRequestId, userId: mockUserId },
        memberDependencies
      )
    ).rejects.toThrow(replacementErrorCodes.unauthorizedRole);
  });
});
