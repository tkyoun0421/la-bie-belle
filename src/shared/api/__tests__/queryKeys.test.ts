import { queryKeys, staleTogether } from "@/shared/api/queryKeys";

const MONTH = "2026-09";

describe("도메인마다 접두사 하나", () => {
  it("범위 없는 키가 그 도메인 전부를 가리킨다", () => {
    expect(queryKeys.schedule.all).toEqual(["schedule"]);
    expect(queryKeys.availability.all).toEqual(["availability"]);
    expect(queryKeys.request.all).toEqual(["requests"]);
    expect(queryKeys.hall.all).toEqual(["hall"]);
    expect(queryKeys.member.all).toEqual(["members"]);
    expect(queryKeys.session.all).toEqual(["session"]);
    expect(queryKeys.profile.all).toEqual(["profile"]);
    expect(queryKeys.notification.all).toEqual(["notifications"]);
    expect(queryKeys.payroll.all).toEqual(["payroll"]);
    expect(queryKeys.rehearsal.all).toEqual(["rehearsal"]);
  });
});

describe("달을 받는 키", () => {
  it("접두사 뒤에 달을 붙인다", () => {
    expect(queryKeys.schedule.month(MONTH)).toEqual(["schedule", MONTH]);
    expect(queryKeys.availability.mine(MONTH)).toEqual(["availability", MONTH]);
    expect(queryKeys.request.month(MONTH)).toEqual(["requests", MONTH]);
    expect(queryKeys.rehearsal.mine(MONTH)).toEqual(["rehearsal", MONTH]);
    expect(queryKeys.excuse.month(MONTH)).toEqual(["excuses", MONTH]);
  });

  it("급여와 출근의 달 키는 날짜를 달로 자른다", () => {
    expect(queryKeys.payroll.month("2026-09-20")).toEqual(["payroll", MONTH]);
    expect(queryKeys.attendance.month("2026-09-20")).toEqual([
      "attendance",
      MONTH,
    ]);
  });

  it("출근의 날 키는 날짜를 그대로 둔다", () => {
    expect(queryKeys.attendance.day("2026-09-20")).toEqual([
      "attendance",
      "2026-09-20",
    ]);
  });
});

describe("범위가 꼬리로 붙는 키", () => {
  it("달 뒤에 범위가 온다", () => {
    expect(queryKeys.schedule.monthWindow(MONTH)).toEqual([
      "schedule",
      MONTH,
      "window",
    ]);
    expect(queryKeys.schedule.openSlots(MONTH)).toEqual([
      "schedule",
      MONTH,
      "open-slots",
    ]);
    expect(queryKeys.rehearsal.everyone(MONTH)).toEqual([
      "rehearsal",
      MONTH,
      "all",
    ]);
  });

  it("달이 없는 범위는 접두사 뒤에 바로 온다", () => {
    expect(queryKeys.schedule.firstMonth()).toEqual([
      "schedule",
      "first-month",
    ]);
    expect(queryKeys.request.approvals()).toEqual(["requests", "approvals"]);
    expect(queryKeys.hall.qr()).toEqual(["hall", "qr"]);
    expect(queryKeys.member.qualifications()).toEqual([
      "members",
      "qualifications",
    ]);
    expect(queryKeys.session.user()).toEqual(["session", "user"]);
    expect(queryKeys.profile.private()).toEqual(["profile", "private"]);
    expect(queryKeys.notification.unread()).toEqual([
      "notifications",
      "unread",
    ]);
    expect(queryKeys.payroll.wages()).toEqual(["payroll", "wages"]);
  });

  it("명단은 갈래를 범위로 받는다", () => {
    expect(queryKeys.member.list("active")).toEqual(["members", "active"]);
    expect(queryKeys.member.list("pending")).toEqual(["members", "pending"]);
  });
});

describe("전원 신청은 본인 신청과 키가 갈린다", () => {
  it("관리자 쪽이 꼬리를 받는다", () => {
    expect(queryKeys.availability.everyone(MONTH)).toEqual([
      "availability",
      MONTH,
      "all",
    ]);
    expect(queryKeys.rehearsal.everyone(MONTH)).toEqual([
      "rehearsal",
      MONTH,
      "all",
    ]);
  });

  it("본인 키와 안 겹친다", () => {
    expect(queryKeys.availability.everyone(MONTH)).not.toEqual(
      queryKeys.availability.mine(MONTH),
    );
  });

  it("본인 키가 전원 키의 접두사다", () => {
    const everyone = queryKeys.availability.everyone(MONTH);

    expect(everyone.slice(0, 2)).toEqual(queryKeys.availability.mine(MONTH));
  });
});

describe("같은 튜플을 두 범위가 안 쓴다", () => {
  it("팩토리가 내는 키가 전부 다르다", () => {
    const month = "2026-09";
    const keys = [
      queryKeys.schedule.all,
      queryKeys.schedule.month(month),
      queryKeys.schedule.monthWindow(month),
      queryKeys.schedule.openSlots(month),
      queryKeys.schedule.firstMonth(),
      queryKeys.availability.all,
      queryKeys.availability.mine(month),
      queryKeys.availability.everyone(month),
      queryKeys.attendance.day("2026-09-20"),
      queryKeys.attendance.month(month),
      queryKeys.excuse.month(month),
      queryKeys.request.all,
      queryKeys.request.month(month),
      queryKeys.request.approvals(),
      queryKeys.hall.all,
      queryKeys.hall.qr(),
      queryKeys.member.all,
      queryKeys.member.list("active"),
      queryKeys.member.qualifications(),
      queryKeys.profile.all,
      queryKeys.profile.private(),
      queryKeys.notification.all,
      queryKeys.notification.unread(),
      queryKeys.payroll.all,
      queryKeys.payroll.month(month),
      queryKeys.payroll.wages(),
      queryKeys.rehearsal.all,
      queryKeys.rehearsal.mine(month),
      queryKeys.rehearsal.everyone(month),
    ].map((key) => JSON.stringify(key));

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("같이 낡는 묶음", () => {
  it("근무표 쓰기는 근무표·급여·요청을 낡게 한다", () => {
    expect(staleTogether.scheduleWrite).toEqual([
      ["schedule"],
      ["payroll"],
      ["requests"],
    ]);
  });

  it("리허설 쓰기는 리허설과 급여를 낡게 한다", () => {
    expect(staleTogether.rehearsalWrite).toEqual([["rehearsal"], ["payroll"]]);
  });

  it("근무표를 드는 묶음은 급여도 든다", () => {
    for (const group of Object.values(staleTogether)) {
      const holds = (key: readonly string[]) =>
        group.some((each) => each[0] === key[0]);

      if (holds(queryKeys.schedule.all)) {
        expect(holds(queryKeys.payroll.all)).toBe(true);
      }
    }
  });
});
