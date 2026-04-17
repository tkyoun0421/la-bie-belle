import { describe, expect, it, vi } from "vitest";
import { createAssignmentAction } from "#/mutations/assignments/actions/createAssignment";

describe("createAssignmentAction", () => {
  it("assigns a user to an event position using an admin/manager actor", async () => {
    const client = {} as never;
    const requireActor = vi.fn().mockResolvedValue({
      email: "admin@labiebelle.local",
      kind: "authenticated_user",
      name: "관리자",
      role: "admin",
      source: "auth_user",
      userId: "11111111-1111-4111-8111-111111111111",
    });
    const readEvent = vi.fn().mockResolvedValue({
      createdAt: "2026-04-11T08:00:00.000Z",
      eventDate: "2026-04-20",
      firstServiceAt: "10:30",
      id: "11111111-1111-4111-8111-111111111111",
      lastServiceEndAt: "16:00",
      positionSlots: [
        {
          positionId: "22222222-2222-4222-8222-222222222222",
          positionName: "포지션",
          requiredCount: 2,
          trainingCount: 0,
        },
      ],
      status: "draft",
      templateId: null,
      timeLabel: "10:30 - 16:00",
      title: "Title",
      viewerApplicationStatus: null,
    });
    const createRecord = vi.fn().mockResolvedValue("assignment-1234");

    await expect(
      createAssignmentAction(
        {
          eventId: "11111111-1111-4111-8111-111111111111",
          positionId: "22222222-2222-4222-8222-222222222222",
          userId: "33333333-3333-4333-8333-333333333333",
        },
        {
          client,
          createRecord,
          readEvent,
          requireActor,
        }
      )
    ).resolves.toEqual({
      assignmentId: "assignment-1234",
      eventId: "11111111-1111-4111-8111-111111111111",
      positionId: "22222222-2222-4222-8222-222222222222",
      userId: "33333333-3333-4333-8333-333333333333",
    });

    expect(createRecord).toHaveBeenCalledWith(
      {
        assignmentKind: undefined,
        eventId: "11111111-1111-4111-8111-111111111111",
        positionId: "22222222-2222-4222-8222-222222222222",
        userId: "33333333-3333-4333-8333-333333333333",
      },
      { client }
    );
  });

  it("rejects when the actor is a member", async () => {
    await expect(
      createAssignmentAction(
        {
          eventId: "11111111-1111-4111-8111-111111111111",
          positionId: "22222222-2222-4222-8222-222222222222",
          userId: "33333333-3333-4333-8333-333333333333",
        },
        {
          client: {} as never,
          createRecord: vi.fn(),
          readEvent: vi.fn(),
          requireActor: vi.fn().mockResolvedValue({
            email: "member1@labiebelle.local",
            kind: "authenticated_user",
            name: "팀원",
            role: "member",
            source: "auth_user",
            userId: "33333333-3333-4333-8333-333333333333",
          }),
        }
      )
    ).rejects.toMatchObject({
      code: "ASSIGNMENT_UNAUTHORIZED_ROLE",
    });
  });

  it("rejects when the specified position is not part of the event slots", async () => {
    await expect(
      createAssignmentAction(
        {
          eventId: "11111111-1111-4111-8111-111111111111",
          positionId: "77777777-7777-4777-8777-777777777777",
          userId: "33333333-3333-4333-8333-333333333333",
        },
        {
          client: {} as never,
          createRecord: vi.fn(),
          readEvent: vi.fn().mockResolvedValue({
            createdAt: "2026-04-11T08:00:00.000Z",
            eventDate: "2026-04-20",
            firstServiceAt: "10:30",
            id: "11111111-1111-4111-8111-111111111111",
            lastServiceEndAt: "16:00",
            positionSlots: [
              {
                positionId: "22222222-2222-4222-8222-222222222222",
                positionName: "포지션",
                requiredCount: 2,
                trainingCount: 0,
              },
            ],
            status: "draft",
            templateId: null,
            timeLabel: "10:30 - 16:00",
            title: "Title",
            viewerApplicationStatus: null,
          }),
          requireActor: vi.fn().mockResolvedValue({
            email: "admin@labiebelle.local",
            kind: "authenticated_user",
            name: "관리자",
            role: "admin",
            source: "auth_user",
            userId: "11111111-1111-4111-8111-111111111111",
          }),
        }
      )
    ).rejects.toMatchObject({
      code: "ASSIGNMENT_CREATE_POSITION_NOT_IN_EVENT",
    });
  });
});
