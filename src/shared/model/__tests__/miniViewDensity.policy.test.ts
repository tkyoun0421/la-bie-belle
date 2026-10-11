import {
  miniViewDensity,
  miniViewLoads,
} from "@/shared/model/miniViewDensity.policy";

describe("miniViewDensity — 안 연 날은 빈칸이다", () => {
  it("isOpen이 false면 null이다", () => {
    const density = miniViewDensity({
      isOpen: false,
      assignedCount: 5,
      maxAssignedCount: 10,
    });

    expect(density).toBeNull();
  });
});

describe("miniViewDensity — 배정 인원이 많을수록 값이 커진다", () => {
  it("배정이 없으면 가장 옅은 0이다", () => {
    const density = miniViewDensity({
      isOpen: true,
      assignedCount: 0,
      maxAssignedCount: 10,
    });

    expect(density).toBe(0);
  });

  it("이 달 최대치와 같으면 가장 진한 1이다", () => {
    const density = miniViewDensity({
      isOpen: true,
      assignedCount: 10,
      maxAssignedCount: 10,
    });

    expect(density).toBe(1);
  });

  it("절반이면 0.5다", () => {
    const density = miniViewDensity({
      isOpen: true,
      assignedCount: 5,
      maxAssignedCount: 10,
    });

    expect(density).toBe(0.5);
  });
});

describe("miniViewDensity — 이 달에 배정이 하나도 없으면 나눗셈이 안 터진다", () => {
  it("maxAssignedCount가 0이면 0이다", () => {
    const density = miniViewDensity({
      isOpen: true,
      assignedCount: 0,
      maxAssignedCount: 0,
    });

    expect(density).toBe(0);
  });
});

describe("miniViewLoads — 키는 날짜 전체가 아니라 일(day) 숫자다", () => {
  it("2026-10-05가 5로, 2026-10-12가 12로 들어간다", () => {
    const loads = miniViewLoads([
      { workDate: "2026-10-05", assignedCount: 2 },
      { workDate: "2026-10-12", assignedCount: 4 },
    ]);

    expect(Object.keys(loads).sort()).toEqual(["5", "12"].sort());
  });
});

describe("miniViewLoads — load는 이 달 최대 배정 인원에 대한 비율이다", () => {
  it("최대가 4면 배정 2는 0.5, 배정 4는 1이다", () => {
    const loads = miniViewLoads([
      { workDate: "2026-10-05", assignedCount: 2 },
      { workDate: "2026-10-12", assignedCount: 4 },
    ]);

    expect(loads[5]).toEqual({ load: 0.5 });
    expect(loads[12]).toEqual({ load: 1 });
  });
});

describe("miniViewLoads — 대상이 없으면 빈 객체다", () => {
  it("날이 없으면 load도 하나도 없다", () => {
    expect(miniViewLoads([])).toEqual({});
  });
});
