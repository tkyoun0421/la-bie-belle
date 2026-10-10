import {
  toProfile,
  toProfilePrivate,
} from "@/entities/profile/utils/profile.mapper";

describe("toProfile — 이름·사진·때가 섞이지 않는다", () => {
  const ROW = {
    id: "p1",
    display_name: "홍길동",
    photo_url: "https://example/1.png",
    role: "member",
    submitted_at: "2026-09-01T00:00:00Z",
    approved_at: "2026-09-02T00:00:00Z",
    rejected_at: null,
    blocked_at: null,
    left_at: null,
    notifications_enabled: true,
  };

  it("id·display_name·photo_url·role이 각자 제 필드로 간다", () => {
    const profile = toProfile(ROW);

    expect(profile.id).toBe("p1");
    expect(profile.displayName).toBe("홍길동");
    expect(profile.photoUrl).toBe("https://example/1.png");
    expect(profile.role).toBe("member");
  });

  it("제출·승인 때가 가고 거절·차단 때는 null로 간다", () => {
    const profile = toProfile(ROW);

    expect(profile.submittedAt).toBe("2026-09-01T00:00:00Z");
    expect(profile.approvedAt).toBe("2026-09-02T00:00:00Z");
    expect(profile.rejectedAt).toBeNull();
    expect(profile.blockedAt).toBeNull();
  });

  it("left_at이 null이면 null로, 값이 있으면 그 값으로 간다", () => {
    expect(toProfile(ROW).leftAt).toBeNull();

    const left = toProfile({ ...ROW, left_at: "2026-10-01T00:00:00Z" });
    expect(left.leftAt).toBe("2026-10-01T00:00:00Z");
  });

  it("notifications_enabled가 그대로 간다", () => {
    const off = toProfile({ ...ROW, notifications_enabled: false });

    expect(off.notificationsEnabled).toBe(false);
  });

  it("display_name과 photo_url이 null이면 null로 간다", () => {
    const empty = toProfile({
      ...ROW,
      display_name: null,
      photo_url: null,
    });

    expect(empty.displayName).toBeNull();
    expect(empty.photoUrl).toBeNull();
  });
});

describe("toProfilePrivate — 연락처 넷이 섞이지 않는다", () => {
  const ROW = {
    email: "member@example.com",
    phone: "010-0000-0001",
    birth_date: "1996-03-04",
    gender: "female",
  };

  it("email·phone·birth_date·gender가 각자 제 필드로 간다", () => {
    const profilePrivate = toProfilePrivate(ROW);

    expect(profilePrivate.email).toBe("member@example.com");
    expect(profilePrivate.phone).toBe("010-0000-0001");
    expect(profilePrivate.birthDate).toBe("1996-03-04");
    expect(profilePrivate.gender).toBe("female");
  });

  it("넷 모두 null이면 null로 간다", () => {
    const empty = toProfilePrivate({
      email: null,
      phone: null,
      birth_date: null,
      gender: null,
    });

    expect(empty.email).toBeNull();
    expect(empty.phone).toBeNull();
    expect(empty.birthDate).toBeNull();
    expect(empty.gender).toBeNull();
  });
});
