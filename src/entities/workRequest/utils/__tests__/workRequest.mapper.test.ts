import {
  toPendingApproval,
  toSlotRequest,
} from "@/entities/workRequest/utils/workRequest.mapper";

describe("toSlotRequest — 두 겹 중첩을 평평하게 편다", () => {
  const ROW = {
    id: "r1",
    slot_id: "s1",
    closed_at: null,
    expires_at: "2026-10-18T00:00:00Z",
    request_candidates: [
      {
        profile_id: "p1",
        status: "pending",
        expires_at: "2026-10-19T00:00:00Z",
      },
    ],
    slots: {
      id: "s1",
      positions: ["서빙"],
      days: {
        work_date: "2026-10-20",
        starts_at: "10:00:00",
        ends_at: "18:00:00",
      },
    },
  };

  it("`slots.days`의 세 열이 한 층으로 올라온다", () => {
    const request = toSlotRequest(ROW);

    expect(request.workDate).toBe("2026-10-20");
    expect(request.startsAt).toBe("10:00:00");
    expect(request.endsAt).toBe("18:00:00");
  });

  it("요청의 만료와 후보의 만료가 섞이지 않는다", () => {
    const request = toSlotRequest(ROW);

    expect(request.expiresAt).toBe("2026-10-18T00:00:00Z");
    expect(request.candidates[0].expiresAt).toBe("2026-10-19T00:00:00Z");
  });

  it("`slots.id`가 아니라 `slot_id`가 자리 번호다", () => {
    const request = toSlotRequest({ ...ROW, slot_id: null });

    expect(request.slotId).toBeNull();
  });

  it("후보가 없으면 빈 배열이다", () => {
    const request = toSlotRequest({ ...ROW, request_candidates: [] });

    expect(request.candidates).toEqual([]);
  });
});

describe("toPendingApproval — 배정과 사람을 한 층으로 편다", () => {
  const ROW = {
    id: "ap1",
    assignment_id: "a1",
    reason: "몸이 아파요",
    created_at: "2026-10-02T00:00:00Z",
    assignments: {
      day_id: "d1",
      position: "안내",
      days: {
        work_date: "2026-10-17",
        starts_at: "11:00:00",
        ends_at: "19:00:00",
      },
    },
    profiles: { display_name: "홍길동", photo_url: "https://example/1.png" },
  };

  it("`assignments.days`의 세 열이 한 층으로 올라온다", () => {
    const approval = toPendingApproval(ROW);

    expect(approval.workDate).toBe("2026-10-17");
    expect(approval.startsAt).toBe("11:00:00");
    expect(approval.endsAt).toBe("19:00:00");
  });

  it("요청 자신의 id와 배정의 id가 섞이지 않는다", () => {
    const approval = toPendingApproval(ROW);

    expect(approval.id).toBe("ap1");
    expect(approval.assignmentId).toBe("a1");
    expect(approval.dayId).toBe("d1");
  });

  it("조인으로 끌어온 이름은 `name`이고 빌 수 있다", () => {
    const approval = toPendingApproval({
      ...ROW,
      profiles: { display_name: null, photo_url: null },
    });

    expect(approval.name).toBeNull();
    expect(approval.photoUrl).toBeNull();
  });
});
