import {
  toNamedRehearsal,
  toRehearsal,
} from "@/entities/rehearsal/utils/rehearsal.mapper";

const ROW = {
  id: "r1",
  profile_id: "p1",
  work_date: "2026-10-20",
  starts_at: "13:00:00",
  ends_at: "17:00:00",
  count: 3,
};

describe("toRehearsal — 이름을 안 읽는 질의의 행을 옮긴다", () => {
  it("시작과 끝이 뒤바뀌지 않는다", () => {
    const rehearsal = toRehearsal(ROW);

    expect(rehearsal.startsAt).toBe("13:00:00");
    expect(rehearsal.endsAt).toBe("17:00:00");
  });

  it("이름을 안 읽는 질의라 `name`이 비어 온다", () => {
    expect(toRehearsal(ROW).name).toBeNull();
  });

  it("시각과 횟수는 빌 수 있다", () => {
    const rehearsal = toRehearsal({
      ...ROW,
      starts_at: null,
      ends_at: null,
      count: null,
    });

    expect(rehearsal.startsAt).toBeNull();
    expect(rehearsal.endsAt).toBeNull();
    expect(rehearsal.count).toBeNull();
  });
});

describe("toNamedRehearsal — 조인으로 온 이름을 얹는다", () => {
  it("`profiles.display_name`이 `name`으로 올라온다", () => {
    const rehearsal = toNamedRehearsal({
      ...ROW,
      profiles: { display_name: "홍길동" },
    });

    expect(rehearsal.name).toBe("홍길동");
    expect(rehearsal.profileId).toBe("p1");
  });

  it("조인이 비어도 선다", () => {
    expect(toNamedRehearsal({ ...ROW, profiles: null }).name).toBeNull();
  });
});
