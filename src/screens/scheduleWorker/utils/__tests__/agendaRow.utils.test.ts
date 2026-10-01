import {
  agendaRowStatusLabel,
  filterAgendaDays,
  type AgendaDay,
} from "@/screens/scheduleWorker/utils/agendaRow.utils";

describe("agendaRowStatusLabel — 아코디언 날짜 줄 오른쪽의 내 상태 문구", () => {
  it("내 근무가 없으면 근무 없음이다", () => {
    const label = agendaRowStatusLabel(null);

    expect(label).toBe("근무 없음");
  });

  it("정규 배정이면 내 포지션 이름이다", () => {
    const label = agendaRowStatusLabel({ kind: "regular", position: "팀장" });

    expect(label).toBe("팀장");
  });

  it("교육 배정이면 교육 · 배우는 포지션이다", () => {
    const label = agendaRowStatusLabel({
      kind: "training",
      position: "드레스",
    });

    expect(label).toBe("교육 · 드레스");
  });
});

const DAYS: AgendaDay[] = [
  {
    workDate: "2026-10-10",
    myAssignment: { kind: "regular", position: "팀장" },
  },
  { workDate: "2026-10-11", myAssignment: null },
  {
    workDate: "2026-10-12",
    myAssignment: { kind: "training", position: "드레스" },
  },
];

describe("filterAgendaDays — 내 근무만을 켜면 내 근무가 없는 날짜 줄이 빠진다", () => {
  it("꺼져 있으면 열린 날 전부가 그대로 선다", () => {
    const rows = filterAgendaDays(DAYS, false);

    expect(rows).toEqual(DAYS);
  });

  it("켜면 내 근무가 없는 날이 빠진다", () => {
    const rows = filterAgendaDays(DAYS, true);

    expect(rows.map((row) => row.workDate)).toEqual([
      "2026-10-10",
      "2026-10-12",
    ]);
  });

  it("내 근무가 하나도 없으면 켰을 때 목록이 빈다", () => {
    const rows = filterAgendaDays(
      [{ workDate: "2026-10-11", myAssignment: null }],
      true,
    );

    expect(rows).toEqual([]);
  });
});
