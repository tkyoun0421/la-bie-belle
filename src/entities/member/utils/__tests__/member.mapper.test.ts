import {
  toActiveMember,
  toMember,
  toMemberSummary,
  toQualification,
} from "@/entities/member/utils/member.mapper";

const SUMMARY = {
  id: "p1",
  display_name: "홍길동",
  photo_url: "https://example/1.png",
  submitted_at: "2026-09-01T00:00:00Z",
  approved_at: "2026-09-02T00:00:00Z",
  rejected_at: null,
  blocked_at: null,
};

const MEMBER = {
  ...SUMMARY,
  role: "member",
  left_at: null,
  erased_at: null,
  profile_private: {
    phone: "010-0000-0001",
    birth_date: "1996-03-04",
    gender: "female",
  },
};

describe("toMemberSummary — 때를 적는 열 다섯이 뒤섞이지 않는다", () => {
  it("낸 때와 받은 때와 돌린 때가 제자리로 간다", () => {
    const summary = toMemberSummary(SUMMARY);

    expect(summary.submittedAt).toBe("2026-09-01T00:00:00Z");
    expect(summary.approvedAt).toBe("2026-09-02T00:00:00Z");
    expect(summary.rejectedAt).toBeNull();
    expect(summary.blockedAt).toBeNull();
  });

  it("이름과 사진은 제 열이라 `displayName`이다", () => {
    const summary = toMemberSummary(SUMMARY);

    expect(summary.displayName).toBe("홍길동");
    expect(summary.photoUrl).toBe("https://example/1.png");
  });
});

describe("toMember — 연락처 중첩을 편다", () => {
  it("`profile_private` 셋이 한 층으로 올라온다", () => {
    const member = toMember(MEMBER);

    expect(member.phone).toBe("010-0000-0001");
    expect(member.birthDate).toBe("1996-03-04");
    expect(member.gender).toBe("female");
  });

  it("연락처를 조인하지 않은 질의면 그 셋이 빈다", () => {
    const member = toMember({ ...MEMBER, profile_private: null });

    expect(member.phone).toBeNull();
    expect(member.birthDate).toBeNull();
    expect(member.gender).toBeNull();
    expect(member.displayName).toBe("홍길동");
  });

  it("떠난 때와 지운 때가 뒤섞이지 않는다", () => {
    const member = toMember({
      ...MEMBER,
      left_at: "2026-10-01T00:00:00Z",
      erased_at: null,
    });

    expect(member.leftAt).toBe("2026-10-01T00:00:00Z");
    expect(member.erasedAt).toBeNull();
  });
});

describe("toActiveMember — 기기 유무는 다른 질의가 준다", () => {
  it("받은 값이 `hasDevice`로 들어가고 설정은 제 열에서 온다", () => {
    const member = toActiveMember(
      { ...MEMBER, notifications_enabled: true },
      false,
    );

    expect(member.notificationsEnabled).toBe(true);
    expect(member.hasDevice).toBe(false);
  });
});

describe("toQualification — 자격 행을 옮긴다", () => {
  it("사람과 자리 둘뿐이다", () => {
    expect(toQualification({ profile_id: "p1", position: "메인" })).toEqual({
      profileId: "p1",
      position: "메인",
    });
  });
});
